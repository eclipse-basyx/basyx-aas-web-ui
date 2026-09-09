<template>
  <v-dialog v-model="conversionDialog" max-width="560px" :persistent="conversionLoading">
    <v-sheet border rounded="lg">
      <v-card-title class="bg-cardHeader">Convert Submodel to Instance</v-card-title>
      <v-divider />

      <v-card-text v-if="submodel" class="pb-0">
        <p>
          Convert
          <span class="text-primary font-weight-bold">{{ submodelName }}</span>
          to an instance?
        </p>

        <p class="mt-3">
          This permanently removes all template qualifiers from the Submodel and every nested
          Submodel Element. Other qualifiers, identifiers, and content are preserved.
        </p>
      </v-card-text>

      <v-divider />

      <v-card-actions>
        <v-spacer />

        <v-btn
          :disabled="conversionLoading"
          rounded="lg"
          text="Cancel"
          @click="conversionDialog = false"
        />

        <v-btn
          class="text-buttonText"
          color="primary"
          :loading="conversionLoading"
          prepend-icon="mdi-swap-horizontal"
          rounded="lg"
          text="Convert to Instance"
          variant="flat"
          @click="confirmConversion"
        />
      </v-card-actions>
    </v-sheet>
  </v-dialog>
</template>

<script lang="ts" setup>
  import { types as aasTypes, jsonization } from '@aas-core-works/aas-core3.1-typescript'
  import { useRoute } from 'vue-router'
  import { useSMEHandling } from '@/composables/AAS/SMEHandling'
  import { useSMRepositoryClient } from '@/composables/Client/SMRepositoryClient'
  import { appendHttpStatusFailureReason } from '@/composables/HttpStatusMessages'
  import { useNavigationStore } from '@/store/NavigationStore'
  import { convertSubmodelTemplateToInstance } from '@/utils/AAS/SubmodelTemplateConversion'

  const props = defineProps<{
    modelValue: boolean
    submodel?: any
  }>()

  const emit = defineEmits<{
    (event: 'update:model-value', value: boolean): void
  }>()

  const route = useRoute()

  const {
    fetchSm,
    putSubmodelAtPath,
    consumeLastRequestFailureStatus,
    consumeLastRequestFailureDetails,
  } = useSMRepositoryClient()
  const { fetchAndDispatchSme } = useSMEHandling()

  const navigationStore = useNavigationStore()

  const conversionDialog = ref(props.modelValue)
  const conversionLoading = ref(false)

  const submodelName = computed(() => props.submodel?.idShort || props.submodel?.id || 'the selected Submodel')

  watch(
    () => props.modelValue,
    value => {
      conversionDialog.value = value
    },
  )

  watch(
    () => conversionDialog.value,
    value => {
      emit('update:model-value', value)
    },
  )

  async function confirmConversion (): Promise<void> {
    if (conversionLoading.value) {
      return
    }

    const target = {
      id: typeof props.submodel?.id === 'string' ? props.submodel.id : '',
      path: typeof props.submodel?.path === 'string' ? props.submodel.path : '',
    }
    if (!target.id || !target.path) {
      showConversionError('The Submodel endpoint is unavailable. Reload the tree and try again.')
      return
    }

    conversionLoading.value = true
    try {
      const fetchedSubmodel = await fetchSm(target.path)
      if (!fetchedSubmodel || Object.keys(fetchedSubmodel).length === 0) {
        showConversionError(requestFailureDetails('The latest Submodel could not be fetched from the repository.'))
        return
      }

      const submodelOrError = jsonization.submodelFromJsonable(fetchedSubmodel)
      if (submodelOrError.error !== null) {
        showConversionError(`The fetched Submodel is invalid: ${submodelOrError.error.message}`)
        return
      }

      const submodel = submodelOrError.mustValue()
      if (submodel.id !== target.id) {
        showConversionError(requestFailureDetails('The latest Submodel could not be fetched from the repository.'))
        return
      }
      if (submodel.kind !== aasTypes.ModellingKind.Template) {
        closeDialogForTarget(target.path)
        navigationStore.dispatchTriggerTreeviewReload()
        navigationStore.dispatchSnackbar({
          status: true,
          timeout: 5000,
          color: 'info',
          btnColor: 'buttonText',
          text: `Submodel '${submodel.id}' is no longer a template. No changes were written.`,
        })
        return
      }

      const removedQualifierCount = convertSubmodelTemplateToInstance(submodel)
      const updated = await putSubmodelAtPath(submodel, target.path, true)
      if (!updated) {
        showConversionError(requestFailureDetails(`Submodel '${submodel.id}' was not updated in the repository.`))
        return
      }

      closeDialogForTarget(target.path)
      navigationStore.dispatchTriggerTreeviewReload()
      const selectedNodeRefreshed = await refreshSelectedNode(target.path)
      if (!selectedNodeRefreshed) {
        navigationStore.dispatchSnackbar({
          status: true,
          timeout: 8000,
          color: 'warning',
          btnColor: 'buttonText',
          baseError: 'Submodel converted with refresh warning.',
          extendedError: 'The Submodel was updated, but the selected node could not be refreshed. Reload the tree to display the latest data.',
        })
        return
      }

      navigationStore.dispatchSnackbar({
        status: true,
        timeout: 5000,
        color: 'success',
        btnColor: 'buttonText',
        text: `Submodel converted to an instance. Removed ${removedQualifierCount} template qualifier${removedQualifierCount === 1 ? '' : 's'}.`,
      })
    } catch (error) {
      showConversionError(error instanceof Error ? error.message : String(error))
    } finally {
      conversionLoading.value = false
    }
  }

  async function refreshSelectedNode (submodelPath: string): Promise<boolean> {
    const selectedPath = route.query.path
    if (
      typeof selectedPath !== 'string'
      || (
        selectedPath !== submodelPath
        && !selectedPath.startsWith(`${submodelPath}/submodel-elements/`)
      )
    ) {
      return true
    }

    const fragment = typeof route.query.fragment === 'string' ? route.query.fragment : undefined
    try {
      const refreshedNode = await fetchAndDispatchSme(selectedPath, false, fragment)
      return Boolean(refreshedNode && Object.keys(refreshedNode).length > 0)
    } catch (error) {
      console.warn('Failed to refresh the selected node after converting its Submodel:', error)
      return false
    }
  }

  function closeDialogForTarget (targetPath: string): void {
    if (props.submodel?.path === targetPath) {
      conversionDialog.value = false
    }
  }

  function requestFailureDetails (fallback: string): string {
    const failureStatus = consumeLastRequestFailureStatus()
    const failureDetails = consumeLastRequestFailureDetails()
    const failure = appendHttpStatusFailureReason(fallback, failureStatus)
    return failureDetails ? `${failure}\n${failureDetails}` : failure
  }

  function showConversionError (extendedError: string): void {
    navigationStore.dispatchSnackbar({
      status: true,
      timeout: 8000,
      color: 'error',
      btnColor: 'buttonText',
      baseError: 'Failed to convert Submodel to an instance.',
      extendedError,
    })
  }
</script>
