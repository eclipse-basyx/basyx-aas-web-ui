<template>
  <v-container class="pa-0 ma-0" fluid :style="{ height: fullHeight }">
    <v-layout :style="{ height: fullHeight }">

      <v-navigation-drawer class="leftMenu" color="appNavigation" :width="336">
        <v-card color="rgba(0,0,0,0)" elevation="0">
          <v-card-title class="pl-0 pr-4 pt-2 pb-1 d-flex align-center">
            <v-tooltip location="bottom" open-delay="600">
              <template #activator="{ props: tooltipProps }">
                <v-btn
                  class="ma-0"
                  :disabled="!selectedBusinessPartner"
                  icon="mdi-reload"
                  v-bind="tooltipProps"
                  :loading="listLoading"
                  variant="plain"
                  @click="initialize()"
                />
              </template>

              <span>Reload Catalog</span>
            </v-tooltip>

            <v-select
              v-model="selectedBusinessPartner"
              density="compact"
              hide-details
              :item-props="partner => ({ subtitle: partner.counterPartyId })"
              :item-title="partner => partner.name || partner.counterPartyId"
              :items="businessPartners"
              label="Select Business Partner"
              return-object
              variant="solo"
            />
          </v-card-title>

          <!-- Aligned with the Business Partner selection next to the reload button -->
          <div class="pl-12 pr-4 pb-3">
            <v-select
              v-model="selectedCatalogFilter"
              density="compact"
              hide-details
              :items="assetTypeFilterItems"
              label="Filter by Asset Type"
              variant="solo"
            />
          </div>

          <v-divider />

          <v-card-text
            class="pt-0 pb-0 px-2"
            style="
              overflow-y: auto;
              height: calc(100svh - 64px - 48px - 40px - 112px - 3px);
            "
          >
            <div v-if="listLoading">
              <v-skeleton-loader type="list-item@6" />
            </div>

            <template v-else>
              <v-list
                v-if="catalogList.length > 0"
                class="pa-0"
                density="compact"
                nav
              >
                <v-virtual-scroll
                  ref="virtualScrollRef"
                  class="bg-card mb-2"
                  :item-height="56"
                  :items="catalogList"
                >
                  <template #default="{ item }">
                    <v-list-item
                      :key="item['@id']"
                      :active="isSelected(item)"
                      base-color="listItem"
                      :border="isSelected(item) ? 'primary' : 'listItem thin'"
                      class="mt-2 mx-0"
                      color="primarySurface"
                      style="
                        border-top: solid;
                        border-right: solid;
                        border-bottom: solid;
                        border-width: 1px;
                      "
                      :style="{
                        'border-color': isSelected(item)
                          ? primaryColor + ' !important'
                          : isDark
                            ? '#686868 !important'
                            : '#ABABAB !important',
                      }"
                      variant="tonal"
                      @click="selectCatalogDataset(item)"
                    >
                      <template #prepend>
                        <v-btn
                          class="ml-n1"
                          color="primary"
                          icon="mdi-code-json"
                          rel="noopener noreferrer"
                          size="x-small"
                          style="z-index: 9000"
                          target="_blank"
                          variant="plain"
                          @click.stop
                        />
                      </template>

                      <v-tooltip
                        activator="parent"
                        open-delay="600"
                        transition="slide-x-transition"
                      >
                        <div v-if="item['@id']" class="text-body-small">
                          <span class="font-weight-bold">{{ "ID: " }}</span>
                          {{ item["@id"] }}
                        </div>

                        <div v-if="item?.createdAt" class="text-body-small mt-1">
                          <span class="font-weight-bold">{{ "Created: " }}</span>
                          {{ new Date(item.createdAt).toISOString() }}
                        </div>

                        <div v-if="item?.name" class="text-body-small mt-1">
                          <span class="font-weight-bold">{{ "Name: " }}</span>
                          {{ item?.name }}
                        </div>

                        <div v-if="item?.description" class="text-body-small mt-1">
                          <span class="font-weight-bold">{{ "Description: " }}</span>
                          {{ item?.description }}
                        </div>
                      </v-tooltip>

                      <v-list-item-title class="text-primary">
                        {{ item?.name || item?.description }}
                      </v-list-item-title>

                      <v-list-item-subtitle class="text-listItemText">
                        {{ item["@id"] }}
                      </v-list-item-subtitle>

                      <template #append>
                        <v-menu>
                          <template #activator="{ props }">
                            <v-btn
                              color="listItemText"
                              icon
                              size="x-small"
                              variant="plain"
                              v-bind="props"
                              @click.prevent
                            >
                              <v-icon size="x-small">mdi-dots-vertical</v-icon>
                            </v-btn>
                          </template>

                          <v-sheet border>
                            <v-list class="py-0" dense density="compact" slim>
                              <v-divider />

                              <v-list-item
                                @click.stop="
                                  copyToClipboard(item['@id'], 'CatalogDatasetId', copyIconAsRef)
                                "
                              >
                                <template #prepend>
                                  <v-icon size="x-small">{{ copyIcon }}</v-icon>
                                </template>

                                <v-list-item-subtitle class="pr-2">Copy Catalog Dataset ID</v-list-item-subtitle>
                              </v-list-item>
                            </v-list>
                          </v-sheet>
                        </v-menu>
                      </template>
                    </v-list-item>
                  </template>
                </v-virtual-scroll>
              </v-list>

              <!-- The list starts below the selections, so the empty states move up to the height of the ones on the right -->
              <v-empty-state
                v-else-if="selectedBusinessPartner && catalogRequestFailed"
                class="mt-n12"
                icon="mdi-database-alert-outline"
                text="The Catalog of the selected Business Partner could not be requested. Reload the Catalog to try again."
                title="Catalog Not Available"
              >
                <template #media>
                  <v-icon size="64" />
                </template>
              </v-empty-state>

              <v-empty-state
                v-else-if="selectedBusinessPartner"
                class="mt-n12"
                icon="mdi-database-off-outline"
                text="The Catalog of the selected Business Partner contains no Datasets of the selected Asset Type"
                title="No Catalog Datasets"
              >
                <template #media>
                  <v-icon size="64" />
                </template>
              </v-empty-state>

              <v-empty-state
                v-else
                class="mt-n12"
                icon="mdi-gesture-tap"
                text="Please select a Business Partner to load its Catalog"
                title="Select Business Partner"
              >
                <template #media>
                  <v-icon size="64" />
                </template>
              </v-empty-state>
            </template>
          </v-card-text>
        </v-card>
      </v-navigation-drawer>

      <v-main>
        <v-container fluid>

          <!-- Placeholder of the Catalog Dataset while the Catalog loads -->
          <v-skeleton-loader
            v-if="listLoading"
            class="border rounded-lg"
            type="list-item-avatar, divider, paragraph@3"
          />

          <!-- Empty states when nothing is selected yet -->
          <div
            v-else-if="
              !selectedBusinessPartner
                || Object.keys(selectedBusinessPartner).length === 0
                || !selectedCatalogDataset
                || Object.keys(selectedCatalogDataset).length === 0
            "
            class="d-flex align-center justify-center"
            :style="{ height: fullHeightMain }"
          >
            <v-empty-state
              v-if="
                !selectedBusinessPartner
                  || Object.keys(selectedBusinessPartner).length === 0
              "
              icon="mdi-gesture-tap"
              text="Please select a Business Partner to load its Catalog"
              title="Select Business Partner"
            >
              <template #media>
                <v-icon size="64" />
              </template>
            </v-empty-state>

            <v-empty-state
              v-else-if="catalogRequestFailed"
              icon="mdi-database-alert-outline"
              text="No Catalog Dataset can be selected, as the Catalog of the selected Business Partner could not be requested"
              title="Catalog Not Available"
            >
              <template #media>
                <v-icon size="64" />
              </template>
            </v-empty-state>

            <v-empty-state
              v-else-if="
                !selectedCatalogDataset
                  || Object.keys(selectedCatalogDataset).length === 0
              "
              icon="mdi-gesture-tap"
              text="Please select a Catalog Dataset"
              title="Select Catalog Dataset"
            >
              <template #media>
                <v-icon size="64" />
              </template>
            </v-empty-state>
          </div>

          <template v-else>
            <JSONPreview
              :height="catalogDatasetPreviewHeight"
              icon="mdi-database-outline"
              :json-content="selectedCatalogDataset"
              title="Catalog Dataset"
            />

            <!-- Use case: Push Data -->
            <div v-if="isPushAsset(selectedCatalogDataset)" class="d-flex mt-2">
              <v-spacer />

              <v-btn
                class="text-buttonText"
                color="primary"
                prepend-icon="mdi-upload"
                rounded="lg"
                text="Send Data"
                variant="flat"
                @click="sendDataDialog = true"
              />
            </div>

            <!-- Use case: Fetch Data -->
            <template v-else-if="isFetchAsset(selectedCatalogDataset)">
              <div class="d-flex mt-2">
                <v-spacer />

                <!-- Readonly instead of disabled, as disabled would drop the success color -->
                <v-btn
                  class="text-buttonText"
                  :color="dataFetched ? 'success' : 'primary'"
                  :loading="fetchingData"
                  :prepend-icon="dataFetched ? 'mdi-check' : 'mdi-download'"
                  :readonly="dataFetched"
                  rounded="lg"
                  :text="dataFetched ? 'Data Fetched' : 'Fetch Data'"
                  variant="flat"
                  @click="fetchCatalogDatasetData()"
                />
              </div>

              <!-- Shares the height with the Catalog Dataset -->
              <JSONPreview
                v-if="dataFetched"
                class="mt-2"
                :download-file-name="selectedCatalogDataset['@id']"
                :height="jsonPreviewHalfHeight"
                :icon="fetchedDataTypeInfo?.icon ?? 'mdi-download'"
                :json-content="fetchedData"
                :title="fetchedDataTypeInfo ? `Fetched ${fetchedDataTypeInfo.title}` : 'Fetched Data'"
              />

              <div v-if="fetchedSubmodel" class="d-flex mt-2">
                <v-spacer />

                <v-btn
                  class="text-buttonText"
                  color="primary"
                  prepend-icon="mdi-import"
                  rounded="lg"
                  text="Import Submodel"
                  variant="flat"
                  @click="importSubmodelDialog = true"
                />
              </div>
            </template>

            <!-- <v-card-actions v-if="showDatasetActions" class="mt-2 pa-0">
              <v-chip
                v-if="edcStatus"
                class="mr-2"
                :color="
                  edcStatus.startsWith('Error')
                    ? 'error'
                    : edcStatus.includes('successfully')
                      ? 'success'
                      : 'primary'
                "
                density="compact"
                label
                variant="tonal"
              >
                <v-progress-circular
                  v-if="dataTranserInProgress"
                  class="mr-2"
                  indeterminate
                  size="16"
                  width="2"
                />
                {{ edcStatus }}
              </v-chip>

              <v-spacer />

              Use case 2: Discovery
              <template v-if="isDigitalTwinRegistryAsset">
                <div>
                  <v-text-field
                    v-model="discoveryId"
                    clearable
                    density="compact"
                    hide-details
                    label="Identifier to discover"
                    variant="outlined"
                    width="350"
                  />
                </div>

                <v-btn
                  class="text-buttonText"
                  :color="dataTranserInProgress ? 'error' : 'primary'"
                  :disabled="!dataTranserInProgress && discoveryId == ''"
                  :prepend-icon="dataTranserInProgress ? 'mdi-close' : 'mdi-magnify'"
                  rounded="lg"
                  :text="dataTranserInProgress ? 'Cancel Discovery' : 'Discover ID'"
                  variant="flat"
                  @click="dataTranserInProgress ? discoverIdRef?.cancel() : discoverIdRef?.discoverId()"
                />
              </template>

              Use case 3: Fetch Asset
              <v-btn
                v-else
                class="text-buttonText"
                :color="dataTranserInProgress ? 'error' : 'primary'"
                :disabled="!dataTranserInProgress && !isHttpDataPull"
                :prepend-icon="dataTranserInProgress ? 'mdi-close' : 'mdi-download'"
                rounded="lg"
                :text="dataTranserInProgress ? 'Cancel Fetch' : 'Fetch Asset'"
                variant="flat"
                @click="dataTranserInProgress ? fetchAssetRef?.cancel() : fetchAssetRef?.fetchAsset()"
              />
            </v-card-actions> -->

            <!--Use case 2: Discovery -->
            <!-- <CatalogDiscoverId
              v-if="isDigitalTwinRegistryAsset"
              ref="discoverIdRef"
              :discovering-id="dataTranserInProgress"
              :discovery-id="discoveryId"
              :full-height="fullHeightAsset"
              :selected-business-partner="selectedBusinessPartner"
              :selected-catalog-dataset="selectedCatalogDataset"
              @update:discovering-id="dataTranserInProgress = $event"
              @update:edc-status="edcStatus = $event"
            /> -->

            <!--Use case 3: Fetch Asset -->
            <!-- <CatalogFetchAsset
              v-else
              ref="fetchAssetRef"
              :fetching-asset="dataTranserInProgress"
              :full-height="fullHeightAsset"
              :selected-business-partner="selectedBusinessPartner"
              :selected-catalog-dataset="selectedCatalogDataset"
              @update:edc-status="edcStatus = $event"
              @update:fetching-asset="dataTranserInProgress = $event"
            /> -->

          </template>

          <!-- Opens once the Catalog Dataset is selected, which a dialog restored from the URL has to wait for -->
          <SendDataDialog
            :business-partner="selectedBusinessPartner"
            :catalog-dataset="selectedCatalogDataset"
            :model-value="sendDataDialog && isPushAsset(selectedCatalogDataset)"
            :proxy-id="edcProxyId"
            @update:model-value="sendDataDialog = $event"
          />

          <ImportSubmodelDialog v-model="importSubmodelDialog" :submodel="fetchedSubmodel" />

        </v-container>
      </v-main>

    </v-layout>
  </v-container>
</template>

<script lang="ts" setup>
  import type { CatenaXEdcCatalogRequest } from '@/composables/Client/CatenaXEdcClient'
  import type { CatenaXPartner } from '@/types/Infrastructure'
  import type { ComponentPublicInstance, Ref } from 'vue'
  import { types as aasTypes } from '@aas-core-works/aas-core3.1-typescript'
  import { useTheme } from 'vuetify'
  import { useCatenaXEdcClient } from '@/composables/Client/CatenaXEdcClient'
  import { useClipboardUtil } from '@/composables/ClipboardUtil'
  import ImportSubmodelDialog from '@/pages/modules/EclipseDataspaceConnector/components/Catalog/Dialogs/ImportSubmodelDialog.vue'
  import SendDataDialog from '@/pages/modules/EclipseDataspaceConnector/components/Catalog/Dialogs/SendDataDialog.vue'
  import { useEdcDialogRoute } from '@/pages/modules/EclipseDataspaceConnector/composables/EdcDialogRoute'
  import { edcBffFailureText, useEdcRequestFailureMessage } from '@/pages/modules/EclipseDataspaceConnector/composables/EdcRequestFailure'
  import {
    assetTypeFilterItems,
    assetTypeFilterPreset,
    isFetchAsset,
    isPushAsset,
  } from '@/pages/modules/EclipseDataspaceConnector/data/assetTypeFilters'
  import { fetchedDataType } from '@/pages/modules/EclipseDataspaceConnector/data/fetchedDataType'
  import { useInfrastructureStore } from '@/store/InfrastructureStore'
  import { normalizeCatenaXPartners } from '@/utils/CatenaXPartnerUtils'

  // Extend the ComponentPublicInstance type to include scrollToIndex
  interface VirtualScrollInstance extends ComponentPublicInstance {
    scrollToIndex: (index: number) => void
  }

  // Stores
  const infrastructureStore = useInfrastructureStore()

  // Composables
  const { fetchData, requestCatalog } = useCatenaXEdcClient()
  const { showFailureMessage } = useEdcRequestFailureMessage()
  const { dialogOpen, dialogState } = useEdcDialogRoute()

  const { copyToClipboard } = useClipboardUtil()

  // Vuetify
  const theme = useTheme()

  // Data
  const fullHeight = ref('calc(100vh - 64px - 48px - 40px - 2px)') // Header - Tabs - Footer - Lines
  const fullHeightMain = ref('calc(100vh - 64px - 48px - 40px - 32px - 2px)') // Full height - header - tabs - footer - padding - border
  const fullHeightMainJsonPreview = ref('calc(100vh - 64px - 48px - 40px - 32px - 2px - 64px - 32px)') // Full height - header - tabs - footer - padding - border - JSON
  const fullHeightMainJsonPreviewWithActions = ref('calc(100vh - 64px - 48px - 40px - 32px - 2px - 64px - 32px - 44px)') // JSON preview - actions
  const fullHeightMainJsonPreviewWithActionsHalf = ref('calc((100vh - 64px - 48px - 40px - 32px - 2px - 2 * (64px + 32px) - 44px - 8px) / 2)') // Two JSON previews (with margin) below each other, the actions in between
  const fullHeightMainJsonPreviewWithTwoActionsHalf = ref('calc((100vh - 64px - 48px - 40px - 32px - 2px - 2 * (64px + 32px) - 2 * 44px - 8px) / 2)') // As above, with actions below the second JSON preview too

  const catalogList = ref([] as Array<any>) as Ref<Array<any>>
  const catalogListUnfiltered = ref([] as Array<any>) as Ref<Array<any>>

  const listLoading = ref(false)
  const catalogRequestFailed = ref(false)
  const virtualScrollRef: Ref<VirtualScrollInstance | null> = ref(null)
  // const dataTranserInProgress = ref(false)
  // const discoverIdRef = ref<InstanceType<typeof CatalogDiscoverId> | null>(null)
  // const discoveryId = ref<string>('')
  // const edcStatus = ref('')
  // const fetchAssetRef = ref<InstanceType<typeof CatalogFetchAsset> | null>(null)

  const selectedBusinessPartner = ref<CatenaXPartner | null>(null)
  const selectedCatalogDataset = ref({} as any)
  const selectedCatalogFilter = ref('all')
  // The open dialog is kept in the URL with the selection it was opened for, e.g. to return to it after a login
  const sendDataDialog = dialogOpen('send-data', () => ({
    partner: selectedBusinessPartner.value?.id,
    dataset: selectedCatalogDataset.value?.['@id'],
  }))
  const sendDataPartnerId = dialogState('partner')
  const sendDataDatasetId = dialogState('dataset')
  const importSubmodelDialog = ref(false)
  const fetchingData = ref(false)
  const fetchedData = ref<unknown>(undefined) // Data fetched from the data plane of the selected catalog dataset

  const copyIcon = ref<string>('mdi-clipboard-file-outline')

  // Computed properties
  const primaryColor = computed(() => theme.current.value.colors.primary)
  const isDark = computed(() => theme.current.value.dark)
  const copyIconAsRef = computed(() => copyIcon)
  const selectedEdcConfig = computed(() => infrastructureStore.getSelectedInfrastructure?.catenaX?.edc ?? null)
  const edcProxyId = computed(() => selectedEdcConfig.value?.proxyId?.trim() ?? 'default')
  const businessPartners = computed(() => normalizeCatenaXPartners(selectedEdcConfig.value?.partners ?? []))
  const dataFetched = computed(() => fetchedData.value !== undefined)
  const fetchedDataTypeInfo = computed(() => fetchedDataType(fetchedData.value)) // AAS or Submodel, if the fetched data is one
  const fetchedSubmodel = computed(() => {
    const instance = fetchedDataTypeInfo.value?.instance
    return instance instanceof aasTypes.Submodel ? instance : null
  })
  // Height of the Catalog Dataset and the Fetched Data, sharing the space below each other
  const jsonPreviewHalfHeight = computed(() => fetchedSubmodel.value
    ? fullHeightMainJsonPreviewWithTwoActionsHalf.value
    : fullHeightMainJsonPreviewWithActionsHalf.value)
  const catalogDatasetPreviewHeight = computed(() => {
    if (dataFetched.value) {
      return jsonPreviewHalfHeight.value
    }
    return isPushAsset(selectedCatalogDataset.value) || isFetchAsset(selectedCatalogDataset.value)
      ? fullHeightMainJsonPreviewWithActions.value
      : fullHeightMainJsonPreview.value
  })
  // const isDigitalTwinRegistryAsset = computed(() => {
  //   const id: string = selectedCatalogDataset.value?.['@id'] ?? ''
  //   return id.includes('dt-registry') || id.includes('digitaltwin-registry') || id.includes('digital-twin-registry')
  // })
  // const isHttpDataPull = computed(() => {
  //   const distributions = selectedCatalogDataset.value?.['dcat:distribution'] ?? selectedCatalogDataset.value?.distribution
  //   if (!distributions) return false
  //   const distArray = Array.isArray(distributions)
  //     ? distributions
  //     : [distributions]
  //   return distArray.some((dist: any) => {
  //     const type = String(dist['@type'] ?? '').toLowerCase()
  //     const format = dist['dct:format']?.['@id'] ?? dist.format
  //     return ['dcat:distribution', 'distribution'].includes(type) && format === 'HttpData-PULL'
  //   })
  // })

  // Watchers
  watch(
    businessPartners,
    partners => {
      if (selectedBusinessPartner.value && partners.some(partner => partner.id === selectedBusinessPartner.value?.id)) {
        return
      }

      // The Business Partner of a Send Data dialog restored from the URL takes precedence over the default one
      const defaultPartnerId = selectedEdcConfig.value?.defaultPartnerId?.trim() ?? ''
      const partnerId = (sendDataDialog.value ? sendDataPartnerId.value : null) ?? defaultPartnerId
      selectedBusinessPartner.value = partners.find(partner => partner.id === partnerId) ?? null
    },
    { immediate: true },
  )

  watch(
    [selectedBusinessPartner, selectedCatalogFilter],
    () => {
      initialize()
    },
  )

  watch(selectedCatalogDataset, () => {
    fetchedData.value = undefined
  })

  onMounted(() => {
    initialize()
  })
  onActivated(() => {
    scrollToSelectedCatalogDataset()
  })

  async function initialize (): Promise<void> {
    listLoading.value = true

    selectedCatalogDataset.value = {}
    catalogRequestFailed.value = false
    // edcStatus.value = ''

    if (selectedBusinessPartner.value?.counterPartyAddress) {
      const catalogFilter = assetTypeFilterPreset(selectedCatalogFilter.value)

      const catalogRequest: CatenaXEdcCatalogRequest = {
        counterPartyId: selectedBusinessPartner.value.counterPartyId,
        // The BFF adds the DSP 2025-1 version path to the address
        counterPartyAddress: selectedBusinessPartner.value.counterPartyAddress,
        protocol: 'dataspace-protocol-http:2025-1',
        querySpec: catalogFilter?.querySpec,
      }
      const result = await requestCatalog(edcProxyId.value, catalogRequest)
      catalogRequestFailed.value = !result.success
      if (!result.success) {
        showFailureMessage('Failed to request the catalog.', edcBffFailureText(result))
      }

      const catalog = result.success ? result.data : undefined
      const catalogDataset = catalog?.['dcat:dataset'] ?? catalog?.dataset

      if (catalog && catalogDataset) {
        const datasets = Array.isArray(catalogDataset)
          ? catalogDataset
          : [catalogDataset]

        const datasetsSorted = datasets.toSorted(
          (datasetA: any, datasetB: any) =>
            (datasetA['@id'] || '') > (datasetB['@id'] || '') ? 1 : -1,
        )

        catalogList.value = datasetsSorted.filter(dataset => catalogFilter?.matches?.(dataset) ?? true)
        catalogListUnfiltered.value = [...datasetsSorted]
      } else {
        catalogList.value = []
        catalogListUnfiltered.value = []
      }

      scrollToSelectedCatalogDataset()
    }

    restoreSendDataDialog()
    listLoading.value = false
  }

  // Selects the Catalog Dataset of a Send Data dialog restored from the URL, the dialog then opens.
  // Without it, e.g. if the Catalog could not be requested, the dialog is closed.
  function restoreSendDataDialog (): void {
    if (!sendDataDialog.value) return

    const catalogDataset = selectedBusinessPartner.value?.id === sendDataPartnerId.value
      ? catalogList.value.find(dataset => dataset['@id'] === sendDataDatasetId.value)
      : undefined
    if (catalogDataset && isPushAsset(catalogDataset)) {
      selectedCatalogDataset.value = catalogDataset
      scrollToSelectedCatalogDataset()
    } else {
      sendDataDialog.value = false
    }
  }

  function selectCatalogDataset (policy: any): void {
    if (isSelected(policy)) {
      selectedCatalogDataset.value = {}
    } else {
      selectedCatalogDataset.value = policy

      if (Object.keys(selectedCatalogDataset.value).length === 0) {
        scrollToSelectedCatalogDataset()
      }
    }
  }

  function isSelected (policy: any): boolean {
    if (
      !selectedCatalogDataset.value
      || Object.keys(selectedCatalogDataset.value).length === 0
      || !selectedCatalogDataset.value['@id']
      || !policy
      || Object.keys(policy).length === 0
      || !policy['@id']
    ) {
      return false
    }
    return selectedCatalogDataset.value['@id'] === policy['@id']
  }

  async function fetchCatalogDatasetData (): Promise<void> {
    const businessPartner = selectedBusinessPartner.value
    const catalogDataset = selectedCatalogDataset.value
    if (!businessPartner || !catalogDataset?.['@id']) return

    fetchingData.value = true
    // The BFF negotiates the asset and fetches the data from the data plane given by the EDR
    const result = await fetchData(edcProxyId.value, {
      counterPartyId: businessPartner.counterPartyId,
      counterPartyAddress: businessPartner.counterPartyAddress,
      assetId: catalogDataset['@id'],
    })
    fetchingData.value = false

    // Ignore the result if another catalog dataset was selected in the meantime
    if (catalogDataset !== selectedCatalogDataset.value) return

    if (!result.success) {
      showFailureMessage('Failed to fetch the data.', edcBffFailureText(result))
      return
    }

    fetchedData.value = result.data.data
  }

  function scrollToSelectedCatalogDataset (): void {
    const index = catalogList.value.findIndex((item: any) => isSelected(item))
    if (index === -1) return

    const intervalId = setInterval(() => {
      if (
        virtualScrollRef.value
        && virtualScrollRef.value.$el.querySelector(
          '.v-virtual-scroll__container',
        ).children.length > 0
      ) {
        virtualScrollRef.value.scrollToIndex(index)
        clearInterval(intervalId)
      }
    }, 50)
  }

</script>
