<template>
  <InfrastructureDialog
    v-model="sendDataDialog"
    :show-empty-state="!selectedAas || submodelListFailed"
    :title="`Send Data to ${catalogDataset?.name || catalogDataset?.['@id']}`"
  >
    <template #drawers>
      <InfrastructureSelectionDrawers
        v-model:aas="selectedAas"
        v-model:aas-unavailable="aasUnavailable"
        v-model:infrastructure-id="selectedInfrastructureId"
        v-model:submodel-list-failed="submodelListFailed"
        v-model:submodels="selectedSubmodels"
        preselect-all-submodels
      />
    </template>

    <template #empty-state>
      <!-- Sending needs at least one Submodel -->
      <v-empty-state
        v-if="selectedAas"
        icon="mdi-database-alert-outline"
        text="The AAS cannot be sent, as its Submodels could not be loaded"
        title="Submodels Not Available"
      >
        <template #media>
          <v-icon size="64" />
        </template>
      </v-empty-state>

      <SelectAasEmptyState
        v-else
        :aas-unavailable="aasUnavailable"
        :infrastructure-selected="!!selectedInfrastructureId"
        text="Select an AAS to send it with all its Submodels. Deselect Submodels to send the AAS with only the remaining ones."
      />
    </template>

    <!-- Preview of the AAS Environment to send, empty if no Submodel is selected -->
    <JsonPreviewTabs
      class="flex-1-1-0"
      hide-tabs
      :items="[environmentTab]"
      :model-value="environmentTab.value"
    />

    <!-- Preview of the single selected Submodel, sharing the height with the AAS Environment -->
    <template v-if="selectedSubmodels.length === 1">
      <v-divider />

      <JsonPreviewTabs
        class="flex-1-1-0"
        hide-tabs
        :items="[submodelTab]"
        :model-value="submodelTab.value"
      />
    </template>

    <template #actions>
      <v-btn
        class="text-buttonText"
        color="primary"
        :disabled="selectedSubmodels.length !== 1 || !businessPartner || sendingData === 'environment'"
        :loading="sendingData === 'submodel'"
        prepend-icon="mdi-folder"
        rounded="lg"
        text="Send Submodel"
        variant="flat"
        @click="sendData('submodel', 'Submodel', submodelTab.json)"
      />

      <v-btn
        class="text-buttonText"
        color="primary"
        :disabled="!environmentTab.json || !businessPartner || sendingData === 'submodel'"
        :loading="sendingData === 'environment'"
        prepend-icon="custom:aasIcon"
        rounded="lg"
        text="Send AAS"
        variant="flat"
        @click="sendData('environment', 'AAS Environment', environmentTab.json)"
      />
    </template>
  </InfrastructureDialog>
</template>

<script lang="ts" setup>
  import type { JsonPreviewTab } from '@/pages/modules/EclipseDataspaceConnector/components/Shared/JsonPreviewTabs.vue'
  import type { AasUnavailableReason } from '@/pages/modules/EclipseDataspaceConnector/components/Shared/SelectAasEmptyState.vue'
  import type { CatenaXPartner } from '@/types/Infrastructure'
  import { useCatenaXEdcClient } from '@/composables/Client/CatenaXEdcClient'
  import InfrastructureDialog from '@/pages/modules/EclipseDataspaceConnector/components/Shared/InfrastructureDialog.vue'
  import InfrastructureSelectionDrawers from '@/pages/modules/EclipseDataspaceConnector/components/Shared/InfrastructureSelectionDrawers.vue'
  import JsonPreviewTabs from '@/pages/modules/EclipseDataspaceConnector/components/Shared/JsonPreviewTabs.vue'
  import SelectAasEmptyState from '@/pages/modules/EclipseDataspaceConnector/components/Shared/SelectAasEmptyState.vue'
  import { useEdcDialogRoute } from '@/pages/modules/EclipseDataspaceConnector/composables/EdcDialogRoute'
  import { edcBffFailureText, useEdcRequestFailureMessage } from '@/pages/modules/EclipseDataspaceConnector/composables/EdcRequestFailure'
  import { useNavigationStore } from '@/store/NavigationStore'
  import { extractId as extractIdFromReference } from '@/utils/AAS/ReferenceUtil'
  import { withoutRuntimeFields } from '@/utils/AAS/RuntimeFields'

  const props = withDefaults(defineProps<{
    proxyId?: string
    businessPartner: CatenaXPartner | null
    catalogDataset: any // Catalog dataset of the push asset
  }>(), {
    proxyId: 'default',
  })

  const sendDataDialog = defineModel<boolean>({ required: true })

  // Stores
  const navigationStore = useNavigationStore()

  // Composables
  const { pushData } = useCatenaXEdcClient()
  const { showFailureMessage } = useEdcRequestFailureMessage()
  const { dialogState } = useEdcDialogRoute()

  // Data
  const selectedInfrastructureId = dialogState('infrastructure') // In the URL to return to it after a login, removed on close
  const selectedAas = ref<any>(null)
  const aasUnavailable = ref<AasUnavailableReason | null>(null) // Set by the AAS List of the selected infrastructure
  const submodelListFailed = ref(false) // Set by the Submodel List of the selected AAS
  const selectedSubmodels = ref<Array<any>>([])
  const sendingData = ref<'environment' | 'submodel' | null>(null) // Data currently being sent

  // Computed Properties
  // The previews show what is sent: without the fields the UI adds at runtime, e.g. `endpoints` with internal repository URLs
  // AAS Environment of the selected AAS with only the selected Submodels (all of them initially)
  const environmentTab = computed<JsonPreviewTab>(() => ({
    value: 'environment',
    title: 'AAS Environment',
    previewTitle: 'AAS Environment',
    previewIcon: 'custom:aasIcon',
    json: createEnvironment(),
  }))

  const submodelTab = computed<JsonPreviewTab>(() => ({
    value: 'submodel',
    title: 'Submodel',
    previewTitle: 'Submodel',
    previewIcon: 'mdi-folder',
    json: withoutRuntimeFields(selectedSubmodels.value[0]),
  }))

  // Methods
  function createEnvironment (): unknown {
    const aas = selectedAas.value?.aas
    if (!aas || selectedSubmodels.value.length === 0) return undefined

    // The AAS only keeps the references to the selected Submodels
    const selectedIds = new Set(selectedSubmodels.value.map(sm => sm.id))
    const submodelRefs: Array<any> = Array.isArray(aas.submodels) ? aas.submodels : []
    // Each AAS and Submodel on its own, the environment keeps its `conceptDescriptions`
    return {
      assetAdministrationShells: [{
        ...withoutRuntimeFields(aas),
        submodels: submodelRefs.filter(submodelRef => selectedIds.has(extractIdFromReference(submodelRef, 'Submodel'))),
      }],
      submodels: selectedSubmodels.value.map(submodel => withoutRuntimeFields(submodel)),
      conceptDescriptions: [],
    }
  }

  async function sendData (kind: 'environment' | 'submodel', title: string, json: unknown): Promise<void> {
    if (!json || !props.businessPartner) return

    sendingData.value = kind
    // The BFF negotiates the push asset and posts the data to the data plane given by the EDR
    const result = await pushData(props.proxyId, {
      counterPartyId: props.businessPartner.counterPartyId,
      counterPartyAddress: props.businessPartner.counterPartyAddress,
      assetId: props.catalogDataset?.['@id'],
      data: json,
    })
    sendingData.value = null

    if (!result.success) {
      showFailureMessage(`Failed to send the ${title}.`, edcBffFailureText(result))
      return
    }

    navigationStore.dispatchSnackbar({
      status: true,
      timeout: 4000,
      color: 'success',
      btnColor: 'buttonText',
      text: `Successfully sent the ${title}.`,
    })
    sendDataDialog.value = false
  }
</script>
