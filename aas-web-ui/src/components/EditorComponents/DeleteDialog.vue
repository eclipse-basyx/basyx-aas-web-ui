<template>
  <v-dialog v-model="deleteDialog" max-width="500px">
    <v-card>
      <v-card-title> Confirm Delete </v-card-title>
      <v-divider />

      <v-card-text v-if="element" class="pb-0">
        <span>Are you sure you want to delete the </span>
        <span class="font-weight-bold">{{ element.modelType }}</span>
        <span> with the</span>
        {{ deleteIdentifierLabel }}
        <span class="text-primary font-weight-bold">
          {{ deleteIdentifier }}
        </span>

        <span> ?</span>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn @click="deleteDialog = false">Cancel</v-btn>

        <v-btn
          color="error"
          :loading="deleteLoading"
          prepend-icon="mdi-delete"
          variant="tonal"
          @click="confirmDelete"
        >Delete</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
  import { computed, ref, watch } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useOperationTreeMutation } from '@/composables/AAS/OperationTreeMutation'
  import { useSMHandling } from '@/composables/AAS/SMHandling'
  import { useAASRepositoryClient } from '@/composables/Client/AASRepositoryClient'
  import { useSMRegistryClient } from '@/composables/Client/SMRegistryClient'
  import { useSMRepositoryClient } from '@/composables/Client/SMRepositoryClient'
  import { useRequestHandling } from '@/composables/RequestHandling'
  import { useAASStore } from '@/store/AASDataStore'
  import { useInfrastructureStore } from '@/store/InfrastructureStore'
  import { useNavigationStore } from '@/store/NavigationStore'
  import { extractEndpointHref } from '@/utils/AAS/DescriptorUtils'
  import {
    isOperationOwnedNode,
    resolveOperationLocator,
    serializeOperationLocator,
  } from '@/utils/AAS/OperationTreeUtils'
  import { isComponentActiveForTemplate } from '@/utils/InfrastructureUtils'

  const aasStore = useAASStore()
  const infrastructureStore = useInfrastructureStore()
  const navigationStore = useNavigationStore()

  const router = useRouter()
  const route = useRoute()

  const { deleteRequest } = useRequestHandling()
  const { fetchSmDescriptor } = useSMHandling()
  const { deleteSubmodelDescriptor } = useSMRegistryClient()
  const { deleteSubmodelRef, getAasEndpointById } = useAASRepositoryClient()
  const { getSmEndpointById } = useSMRepositoryClient()
  const { mutateOperation } = useOperationTreeMutation()

  const props = defineProps<{
    modelValue: boolean
    element: any
  }>()

  const emit = defineEmits<{
    (event: 'update:model-value', value: boolean): void
  }>()

  const deleteDialog = ref(false) // Variable to store if the delete dialog is open
  const deleteLoading = ref(false) // Variable to store if the AAS is being deleted

  const selectedAAS = computed(() => aasStore.getSelectedAAS) // get selected AAS from Store
  const selectedInfrastructure = computed(() => infrastructureStore.getSelectedInfrastructure)
  const submodelRegistryActive = computed(() =>
    isComponentActiveForTemplate(selectedInfrastructure.value, 'SubmodelRegistry'),
  )
  const submodelRepoHasRegistryIntegration = computed(
    () => selectedInfrastructure.value?.components?.SubmodelRepo?.hasRegistryIntegration ?? true,
  )
  const shouldResolveSubmodelWithRegistry = computed(
    () => submodelRegistryActive.value && submodelRepoHasRegistryIntegration.value,
  )
  const manualSubmodelDescriptorSyncRequired = computed(
    () => submodelRegistryActive.value && !submodelRepoHasRegistryIntegration.value,
  )
  const deleteIdentifierLabel = computed(() => {
    if (props.element?.modelType === 'Submodel') return 'id'
    if (props.element?.idShort) return 'idShort'
    if (props.element?.isDirectOperationVariable) return 'direction/index'
    if (props.element?.listIndex !== undefined) return 'list index'
    return 'tree location'
  })
  const deleteIdentifier = computed(() => {
    if (props.element?.modelType === 'Submodel') return props.element.id
    if (props.element?.idShort) return props.element.idShort
    if (props.element?.isDirectOperationVariable) {
      let direction = 'Input'
      if (props.element.operationVariableDirection === 'inoutputVariables') direction = 'In/Out'
      if (props.element.operationVariableDirection === 'outputVariables') direction = 'Output'
      return `${direction} [${props.element.operationVariableIndex}]`
    }
    if (props.element?.listIndex !== undefined) return `[${props.element.listIndex}]`
    return props.element?.persistence?.fragment || props.element?.modelType
  })

  watch(
    () => props.modelValue,
    value => {
      deleteDialog.value = value
    },
  )

  watch(
    () => deleteDialog.value,
    value => {
      emit('update:model-value', value)
    },
  )

  async function confirmDelete (): Promise<void> {
    deleteLoading.value = true
    if (isOperationOwnedNode(props.element)) {
      await deleteOperationOwnedElement()
      return
    }
    let deleteSucceeded = false
    if (props.element.modelType === 'Submodel') {
      let smEndpoint = ''
      if (shouldResolveSubmodelWithRegistry.value) {
        const smDescriptor = await fetchSmDescriptor(props.element.id)
        smEndpoint = extractEndpointHref(smDescriptor, 'SUBMODEL-3.0')
        if (!smEndpoint) {
          smEndpoint = getSmEndpointById(props.element.id)
        }
      } else {
        smEndpoint = getSmEndpointById(props.element.id)
      }

      if (!smEndpoint) {
        navigationStore.dispatchSnackbar({
          status: true,
          timeout: 6000,
          color: 'error',
          btnColor: 'buttonText',
          text: 'Unable to resolve Submodel endpoint for deletion.',
        })
        deleteLoading.value = false
        return
      }

      try {
        // delete the submodel
        const submodelDeleteResponse = await deleteRequest(smEndpoint, 'removing Submodel', false)
        if (!submodelDeleteResponse?.success) {
          deleteLoading.value = false
          return
        }

        // extract the AAS endpoint
        const aasEndpoint
          = extractEndpointHref(selectedAAS.value, 'AAS-3.0') || getAasEndpointById(selectedAAS.value.id)

        // delete the submodel reference from the AAS
        const submodelRefDeleted = await deleteSubmodelRef(aasEndpoint, props.element.id)
        if (!submodelRefDeleted) {
          deleteLoading.value = false
          return
        }

        if (manualSubmodelDescriptorSyncRequired.value) {
          const descriptorDeleted = await deleteSubmodelDescriptor(props.element.id)
          if (!descriptorDeleted) {
            navigationStore.dispatchSnackbar({
              status: true,
              timeout: 6000,
              color: 'warning',
              btnColor: 'buttonText',
              baseError: 'Submodel deleted with synchronization warning.',
              extendedError: `Failed to delete Submodel descriptor '${props.element.id}'.`,
            })
          }
        }

        // delete the submodel reference from the local AAS
        const localAAS = { ...selectedAAS.value }
        const submodelRefs = localAAS.submodels
        const index = submodelRefs.findIndex(
          (smRef: any) =>
            smRef.keys
            && Array.isArray(smRef.keys)
            && smRef.keys.some((key: any) => key.value === props.element.id),
        )
        if (index !== -1) {
          submodelRefs.splice(index, 1)
        }

        // Check if the selected Submodel is the deleted one
        if (props.element.path === route.query.path) {
          const query = structuredClone(route.query)
          if (Object.hasOwn(query, 'path')) delete query.path

          router.push({ query: query })
          aasStore.dispatchSelectedNode({})
        }
        navigationStore.dispatchTriggerTreeviewReload()
        aasStore.dispatchSelectedAAS(localAAS)
        deleteSucceeded = true
      } catch (error) {
        console.error('Error while deleting Submodel:', error)
      }
    } else {
      // delete Submodel Element
      try {
        const submodelElementDeleteResponse = await deleteRequest(props.element.path, 'removing Submodel Element', false)
        if (!submodelElementDeleteResponse?.success) {
          deleteLoading.value = false
          return
        }

        // Check if the selected Submodel Element is the deleted one
        if (props.element.path === route.query.path) {
          const query = structuredClone(route.query)
          query.path = props.element.parent.path

          router.push({ query: query })
          aasStore.dispatchSelectedNode(props.element.parent)
        }
        navigationStore.dispatchTriggerTreeviewReload()
        deleteSucceeded = true
      } catch (error) {
        console.error('Error while deleting Submodel Element:', error)
      }
    }
    deleteLoading.value = false
    if (deleteSucceeded) {
      // close the dialog only after a successful deletion chain
      deleteDialog.value = false
    }
  }

  async function deleteOperationOwnedElement (): Promise<void> {
    const boundary = props.element.persistence
    let parentLocator = [...boundary.locator]
    const result = await mutateOperation(boundary, ({ operation, locator }) => {
      const lastSegment = locator.at(-1)
      if (lastSegment === 'value') {
        const index = locator.at(-2)
        const direction = locator.at(-3)
        if (typeof index !== 'number' || typeof direction !== 'string') return false
        parentLocator = locator.slice(0, -3)
        const operationParent = resolveOperationLocator(operation, parentLocator)
        const variables = operationParent?.[direction]
        if (!Array.isArray(variables) || index >= variables.length) return false
        variables.splice(index, 1)
        return true
      }

      if (typeof lastSegment !== 'number') return false
      const collectionLocator = locator.slice(0, -1)
      const collection = resolveOperationLocator(operation, collectionLocator)
      if (!Array.isArray(collection) || lastSegment >= collection.length) return false
      collection.splice(lastSegment, 1)
      parentLocator = locator.slice(0, -2)
      return true
    })

    deleteLoading.value = false
    if (!result.success) return

    const query: Record<string, string | (string | null)[] | null | undefined> = {
      ...route.query,
      path: boundary.operationPath,
    }
    const parentFragment = serializeOperationLocator(parentLocator)
    if (parentFragment) query.fragment = parentFragment
    else delete query.fragment
    await router.push({ query })
    navigationStore.dispatchTriggerTreeviewReload()
    deleteDialog.value = false
  }
</script>
