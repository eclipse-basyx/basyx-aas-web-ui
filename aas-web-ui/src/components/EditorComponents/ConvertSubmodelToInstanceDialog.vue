<template>
  <v-dialog v-model="conversionDialog" max-width="560px">
    <v-card>
      <v-card-title>Convert Submodel to Instance</v-card-title>
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

      <v-card-actions>
        <v-spacer />
        <v-btn :disabled="conversionLoading" @click="conversionDialog = false">Cancel</v-btn>

        <v-btn
          color="primary"
          :loading="conversionLoading"
          prepend-icon="mdi-swap-horizontal"
          variant="tonal"
          @click="confirmConversion"
        >
          Convert to Instance
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
  import { types as aasTypes, jsonization } from '@aas-core-works/aas-core3.1-typescript'
  import { computed, ref, watch } from 'vue'
  import { useRoute } from 'vue-router'
  import { useSMEHandling } from '@/composables/AAS/SMEHandling'
  import { useSMRepositoryClient } from '@/composables/Client/SMRepositoryClient'
  import { appendHttpStatusFailureReason } from '@/composables/HttpStatusMessages'
  import { useAASStore } from '@/store/AASDataStore'
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
    putSubmodel,
    consumeLastRequestFailureStatus,
    consumeLastRequestFailureDetails,
  } = useSMRepositoryClient()
  const { fetchAndDispatchSme } = useSMEHandling()

  const aasStore = useAASStore()
  const navigationStore = useNavigationStore()

  const conversionDialog = ref(props.modelValue)
  const conversionLoading = ref(false)

  const selectedAAS = computed(() => aasStore.getSelectedAAS)
  const submodelName = computed(() => props.submodel?.idShort || props.submodel?.id || 'the selected Submodel')

  watch(
    () => props.modelValue,
    value => {
      conversionDialog.value = value
      if (value) {
        conversionLoading.value = false
      }
    },
  )

  watch(
    () => conversionDialog.value,
    value => {
      emit('update:model-value', value)
    },
  )

  async function confirmConversion (): Promise<void> {
    if (!props.submodel?.path) {
      showConversionError('The Submodel endpoint is unavailable. Reload the tree and try again.')
      return
    }

    conversionLoading.value = true
    try {
      const fetchedSubmodel = await fetchSm(props.submodel.path)
      if (!fetchedSubmodel || Object.keys(fetchedSubmodel).length === 0) {
        showConversionError('The latest Submodel could not be fetched from the repository.')
        return
      }

      const submodelOrError = jsonization.submodelFromJsonable(fetchedSubmodel)
      if (submodelOrError.error !== null) {
        showConversionError(`The fetched Submodel is invalid: ${submodelOrError.error.message}`)
        return
      }

      const submodel = submodelOrError.mustValue()
      if (submodel.kind !== aasTypes.ModellingKind.Template) {
        conversionDialog.value = false
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
      const aasId = typeof selectedAAS.value?.id === 'string' ? selectedAAS.value.id : undefined
      const updated = await putSubmodel(submodel, true, aasId)
      if (!updated) {
        const failureStatus = consumeLastRequestFailureStatus()
        const failureDetails = consumeLastRequestFailureDetails()
        const baseFailure = appendHttpStatusFailureReason(
          `Submodel '${submodel.id}' was not updated in the repository.`,
          failureStatus,
        )
        showConversionError(failureDetails ? `${baseFailure}\n${failureDetails}` : baseFailure)
        return
      }

      conversionDialog.value = false
      navigationStore.dispatchTriggerTreeviewReload()
      try {
        await refreshSelectedNode()
      } catch (error) {
        console.warn('Failed to refresh the selected node after converting its Submodel:', error)
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

  async function refreshSelectedNode (): Promise<void> {
    const selectedPath = route.query.path
    const submodelPath = props.submodel?.path
    if (
      typeof selectedPath !== 'string'
      || typeof submodelPath !== 'string'
      || (
        selectedPath !== submodelPath
        && !selectedPath.startsWith(`${submodelPath}/submodel-elements/`)
      )
    ) {
      return
    }

    const fragment = typeof route.query.fragment === 'string' ? route.query.fragment : undefined
    await fetchAndDispatchSme(selectedPath, false, fragment)
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
