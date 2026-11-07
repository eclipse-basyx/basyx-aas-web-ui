<template>
  <v-dialog v-model="sendDataDialog" height="90%" style="max-width: 1920px" width="90%">
    <v-sheet border class="d-flex flex-column" height="100%" rounded="lg">
      <v-card-title class="bg-cardHeader">
        Send Data to {{ catalogDataset?.name || catalogDataset?.['@id'] }}
      </v-card-title>

      <v-divider />

      <v-card-text class="pa-0 overflow-y-auto flex-grow-1">

        <v-layout :style="{ 'height': fullHeight }">

          <InfrastructureSelectionDrawers
            v-model:aas="selectedAas"
            v-model:aas-unavailable="aasUnavailable"
            v-model:infrastructure-id="selectedInfrastructureId"
            v-model:submodel-list-failed="submodelListFailed"
            v-model:submodels="selectedSubmodels"
            preselect-all-submodels
          />

          <v-main class="py-0">
            <v-container class="ma-0 pa-0 d-flex flex-column" fluid :style="{ 'height': fullHeight }">

              <!-- Offset by the drawer header, so the empty state aligns with the one of the Submodel List -->
              <div
                v-if="!selectedAas || submodelListFailed"
                class="d-flex align-center justify-center"
                :style="{ 'height': fullHeight, 'padding-top': drawerHeaderHeight }"
              >
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
              </div>

              <template v-else>
                <!-- Preview of the AAS Environment to send, empty if no Submodel is selected -->
                <JsonPreviewTabs
                  hide-tabs
                  :items="[environmentTab]"
                  :model-value="environmentTab.value"
                  style="flex: 1 1 0"
                />

                <!-- Preview of the single selected Submodel, sharing the height with the AAS Environment -->
                <template v-if="selectedSubmodels.length === 1">
                  <v-divider />

                  <JsonPreviewTabs
                    hide-tabs
                    :items="[submodelTab]"
                    :model-value="submodelTab.value"
                    style="flex: 1 1 0"
                  />
                </template>
              </template>

            </v-container>
          </v-main>

        </v-layout>

      </v-card-text>

      <v-divider />

      <v-card-actions>
        <v-spacer />

        <v-btn
          rounded="lg"
          text="Cancel"
          @click="sendDataDialog = false"
        />

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
      </v-card-actions>
    </v-sheet>
  </v-dialog>
</template>

<script lang="ts" setup>
  import type { JsonPreviewTab } from '@/pages/modules/EclipseDataspaceConnector/components/Assets/JsonPreviewTabs.vue'
  import type { AasUnavailableReason } from '@/pages/modules/EclipseDataspaceConnector/components/Shared/SelectAasEmptyState.vue'
  import type { CatenaXPartner } from '@/types/Infrastructure'
  import { useCatenaXEdcClient } from '@/composables/Client/CatenaXEdcClient'
  import JsonPreviewTabs from '@/pages/modules/EclipseDataspaceConnector/components/Assets/JsonPreviewTabs.vue'
  import InfrastructureSelectionDrawers from '@/pages/modules/EclipseDataspaceConnector/components/Shared/InfrastructureSelectionDrawers.vue'
  import SelectAasEmptyState from '@/pages/modules/EclipseDataspaceConnector/components/Shared/SelectAasEmptyState.vue'
  import { edcBffFailureText, useEdcRequestFailureMessage } from '@/pages/modules/EclipseDataspaceConnector/composables/EdcRequestFailure'
  import { useNavigationStore } from '@/store/NavigationStore'
  import { extractId as extractIdFromReference } from '@/utils/AAS/ReferenceUtil'

  const props = withDefaults(defineProps<{
    modelValue: boolean
    proxyId?: string
    businessPartner: CatenaXPartner | null
    catalogDataset: any // Catalog dataset of the push asset
  }>(), {
    proxyId: 'default',
  })

  const emit = defineEmits<{
    (event: 'update:model-value', value: boolean): void
  }>()

  // Stores
  const navigationStore = useNavigationStore()

  // Composables
  const { pushData } = useCatenaXEdcClient()
  const { showFailureMessage } = useEdcRequestFailureMessage()

  // Data
  const sendDataDialog = ref(false)
  const fullHeight = 'calc(90vh - 52px - 52px - 2px)' // dialog - dialog header - dialog footer - 2x divider
  const drawerHeaderHeight = '121px' // selection field (8px + 40px) + list title bar (72px) + divider (1px)
  const selectedInfrastructureId = ref<string | null>(null)
  const selectedAas = ref<any>(null)
  const aasUnavailable = ref<AasUnavailableReason | null>(null) // Set by the AAS List of the selected infrastructure
  const submodelListFailed = ref(false) // Set by the Submodel List of the selected AAS
  const selectedSubmodels = ref<Array<any>>([])
  const sendingData = ref<'environment' | 'submodel' | null>(null) // Data currently being sent

  // Computed Properties
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
    json: selectedSubmodels.value[0],
  }))

  // Watchers
  watch(
    () => props.modelValue,
    value => {
      sendDataDialog.value = value
      if (!value) {
        selectedInfrastructureId.value = null
      }
    },
  )

  watch(
    () => sendDataDialog.value,
    value => {
      emit('update:model-value', value)
    },
  )

  // Methods
  function createEnvironment (): unknown {
    const aas = selectedAas.value?.aas
    if (!aas || selectedSubmodels.value.length === 0) return undefined

    // The AAS only keeps the references to the selected Submodels
    const selectedIds = new Set(selectedSubmodels.value.map(sm => sm.id))
    const submodelRefs: Array<any> = Array.isArray(aas.submodels) ? aas.submodels : []
    return {
      assetAdministrationShells: [{
        ...aas,
        submodels: submodelRefs.filter(submodelRef => selectedIds.has(extractIdFromReference(submodelRef, 'Submodel'))),
      }],
      submodels: selectedSubmodels.value,
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
