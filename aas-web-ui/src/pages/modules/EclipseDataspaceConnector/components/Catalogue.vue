<template>
  <v-container class="pa-0 ma-0" fluid :style="{ 'height': fullHeight}">

    <v-layout :style="{ 'height': fullHeight}">

      <v-navigation-drawer
        class="leftMenu"
        color="appNavigation"
        :width="336"
      >
        <v-card color="rgba(0,0,0,0)" elevation="0">
          <v-card-title class="py-3">

            <v-select
              v-model="selectedBusinessPartner"
              density="compact"
              hide-details
              item-title="name"
              :items="businessPartners"
              label="Select Business Partner"
              return-object
              variant="solo"
            >
              <template #item="{ props, item }">
                <v-list-item v-bind="props" :subtitle="item.bpn" />
              </template>
            </v-select>

          </v-card-title>

          <v-divider />

          <v-card-text class="pt-0 pb-0 px-2" style="overflow-y: auto; height: calc(100svh - 64px - 48px - 40px - 64px - 3px)">

            <div v-if="listLoading">
              <v-skeleton-loader type="list-item@6" />
            </div>

            <template v-else>

              <!-- Catalog -->
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
                    <!-- Single Policy -->
                    <v-list-item
                      :key="item['@id']"
                      :active="isSelected(item)"
                      base-color="listItem"
                      :border="isSelected(item) ? 'primary' : 'listItem thin'"
                      class="mt-2 mx-0"
                      color="primarySurface"
                      style="border-top: solid; border-right: solid; border-bottom: solid; border-width: 1px"
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
                        <!-- Catalog Dataset ID -->
                        <div v-if="item['@id']" class="text-body-small">
                          <span class="font-weight-bold">{{ 'ID: ' }}</span>
                          {{ item['@id'] }}
                        </div>

                        <!-- Created At -->
                        <div v-if="item?.createdAt" class="text-body-small mt-1">
                          <span class="font-weight-bold">{{ 'Created: ' }}</span>
                          {{ new Date(item.createdAt).toISOString() }}
                        </div>

                        <!-- Name -->
                        <div v-if="item?.name" class="text-body-small mt-1">
                          <span class="font-weight-bold">{{ 'Name: ' }}</span>
                          {{ item?.name }}
                        </div>

                        <!-- Description -->
                        <div v-if="item?.description" class="text-body-small mt-1">
                          <span class="font-weight-bold">{{ 'Description: ' }}</span>
                          {{ item?.description }}
                        </div>

                      </v-tooltip>

                      <v-list-item-title class="text-primary">
                        {{ item?.name || item?.description }}
                      </v-list-item-title>

                      <v-list-item-subtitle class="text-listItemTex">
                        {{ item['@id'] }}
                      </v-list-item-subtitle>

                      <template #append>
                        <v-badge
                          color="error"
                          icon="mdi-network-strength-4-alert"
                          inline
                          :model-value="
                            item.status && item.status.trim() !== '' && item.status === 'offline'
                              ? true
                              : false
                          "
                          text-color="buttonText"
                        />

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
                              <!-- Copy Catalog Dataset ID to clipboard -->
                              <v-list-item
                                @click.stop="
                                  copyToClipboard(item['@id'], 'CatalogDatasetId', copyIconAsRef)
                                "
                              >
                                <template #prepend>
                                  <v-icon size="x-small">{{ copyIcon }} </v-icon>
                                </template>

                                <v-list-item-subtitle>Copy Catalog Dataset ID</v-list-item-subtitle>
                              </v-list-item>
                            </v-list>
                          </v-sheet>
                        </v-menu>

                      </template>

                    </v-list-item>
                  </template>

                </v-virtual-scroll>
              </v-list>

              <v-empty-state
                v-else
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

      <v-main class="py-0">

        <v-container class="ma-0 pa-0" fluid style="overflow-y: auto;" :style="{'height': fullHeightMain}">

          <div
            v-if="!selectedBusinessPartner
              || Object.keys(selectedBusinessPartner).length === 0
              || !selectedCatalogDataset
              || Object.keys(selectedCatalogDataset).length === 0"
            class="mx-0 pa-0 d-flex align-center justify-center"
            :style="{'height': fullHeightMain}"
          >

            <v-empty-state
              v-if="!selectedBusinessPartner || Object.keys(selectedBusinessPartner).length === 0"
              icon="mdi-gesture-tap"
              style="padding-top: 45px"
              text="Please select a Business Partner to load its Catalog"
              title="Select Business Partner"
            >
              <template #media>
                <v-icon size="64" />
              </template>
            </v-empty-state>

            <v-empty-state
              v-else-if="!selectedCatalogDataset || Object.keys(selectedCatalogDataset).length === 0"
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

            <v-list-item class="pl-3 pt-0">
              <v-list-item-title class="text-body-large">Catalog Dataset</v-list-item-title>
            </v-list-item>

            <pre
              class="json-content mt-0 mx-4 mb-0 bg-surface rounded border"
              style="height: 275px; min-height: 63px"
            >
              <code class="mx-5" v-html="selectedCatalogDatasetJsonFormatted" />
            </pre>

            <v-card-actions class="pa-4">
              <v-chip
                v-if="fetchStatus"
                class="mr-2"
                :color="fetchStatus.startsWith('Error') ? 'error' : fetchStatus.includes('successfully') ? 'success' : 'primary'"
                density="compact"
                label
                variant="tonal"
              >
                <v-progress-circular
                  v-if="fetchingAsset"
                  class="mr-2"
                  indeterminate
                  size="16"
                  width="2"
                />
                {{ fetchStatus }}
              </v-chip>

              <v-spacer />

              <v-btn
                class="text-buttonText"
                :color="fetchingAsset ? 'error' : 'primary'"
                :disabled="!fetchingAsset && !isHttpDataPull"
                :prepend-icon="fetchingAsset ? 'mdi-close' : 'mdi-download'"
                rounded="lg"
                :text="fetchingAsset ? 'Cancel Fetch' : 'Fetch Asset'"
                variant="flat"
                @click="fetchingAsset ? (cancelFetchAsset = true) : fetchAsset()"
              />
            </v-card-actions>

            <v-divider />

            <v-list-item class="pl-3">
              <v-list-item-title class="text-body-large">Asset</v-list-item-title>
            </v-list-item>

            <pre
              class="json-content mt-0 mx-4 mb-5 bg-surface rounded border"
              style="min-height: 63px"
              :style="{'max-height': heightAssetJson}"
            >
                  <code class="mx-5" v-html="assetJsonFormatted" />
                </pre>

          </template>

        </v-container>
      </v-main>
    </v-layout>
  </v-container>
</template>

<script lang="ts" setup>
  import * as Prism from 'prismjs'
  import { type ComponentPublicInstance, computed, onActivated, onMounted, ref, type Ref, watch } from 'vue'
  import { useTheme } from 'vuetify'
  import { useClipboardUtil } from '@/composables/ClipboardUtil'
  import { type CatalogRequest, useEdcClient } from '@/pages/modules/EclipseDataspaceConnector/composables/Client/EdcClient'
  import { useEdcStore } from '@/pages/modules/EclipseDataspaceConnector/store/EdcStore'
  import { formatJSON } from '@/utils/JsonUtils'
  import { getPrismJsonLanguage } from '@/utils/prismJsonLanguage'

  // Extend the ComponentPublicInstance type to include scrollToIndex
  interface VirtualScrollInstance extends ComponentPublicInstance {
    scrollToIndex: (index: number) => void
  }

  // Stores
  const edcStore = useEdcStore()

  // Composables
  const {
    queryCatalogue,
    initiateContractNegotiation,
    getContractNegotiation,
    getContractNegotiationState,
    initiateTransferProcess,
    getTransferProcessState,
    getEdrDataAddress,
  } = useEdcClient()
  const { copyToClipboard } = useClipboardUtil()

  // Vuetify
  const theme = useTheme()

  // Data
  const fullHeight = ref('calc(100vh - 64px - 48px - 40px - 2px)') // Full height - header - tabs - footer - border
  const fullHeightMain = ref('calc(100vh - 64px - 48px - 40px - 2px)') // Full height - header - tabs - footer - padding - border

  const heightAssetJson = ref('calc(100vh - 64px - 48px - 40px - 2px - 275px)') // Full height -  - padding - border - aasJson - v-list-item - action bar

  const selectedBusinessPartner = ref<any>(null)

  const catalogList = ref([] as Array<any>) as Ref<Array<any>> // Variable to store the Catalog Dataset data
  const catalogListUnfiltered = ref([] as Array<any>) as Ref<Array<any>> // Variable to store the Catalog Dataset data before filtering
  const listLoading = ref(false) // Variable to store if the AAS List is loading
  const virtualScrollRef: Ref<VirtualScrollInstance | null> = ref(null) // Reference to the Virtual Scroll Component
  const selectedCatalogDataset = ref({} as any)
  const selectedCatalogDatasetJson = ref<string>('')
  const selectedCatalogDatasetJsonFormatted = ref<string>('')
  const assetJson = ref<string>('')
  const assetJsonFormatted = ref<string>('')
  const copyIcon = ref<string>('mdi-clipboard-file-outline')

  const fetchingAsset = ref(false)
  const fetchStatus = ref('')
  const cancelFetchAsset = ref(false)

  // Computed properties
  const businessPartners = computed(() => edcStore.getEdcConfig?.businessPartners ?? [])
  const primaryColor = computed(() => theme.current.value.colors.primary)
  const isDark = computed(() => theme.current.value.dark)
  const copyIconAsRef = computed(() => copyIcon)

  const isHttpDataPull = computed(() => {
    const distributions = selectedCatalogDataset.value?.['dcat:distribution']
    if (!distributions) return false

    const distArray = Array.isArray(distributions) ? distributions : [distributions]

    return distArray.some((dist: any) =>
      dist['@type'] === 'dcat:Distribution'
      && dist['dct:format']?.['@id'] === 'HttpData-PULL',
    )
  })

  // Watchers
  watch(
    () => edcStore.getEdcConfig,
    () => {
      initialize()
    },
  )

  watch(
    () => selectedBusinessPartner.value,
    () => {
      initialize()
    },
  )

  watch(
    () => selectedCatalogDataset.value,
    () => {
      try {
        selectedCatalogDatasetJson.value = JSON.stringify(selectedCatalogDataset.value)
        const formatted = formatJSON(selectedCatalogDatasetJson.value)

        // Apply syntax highlighting using Prism
        if (Prism && Prism.highlight) {
          selectedCatalogDatasetJsonFormatted.value = Prism.highlight(formatted, getPrismJsonLanguage(), 'json')
        } else {
          selectedCatalogDatasetJsonFormatted.value = formatted
          console.warn('Prism highlighting not available')
        }

        assetJson.value = ''
        assetJsonFormatted.value = ''

        fetchStatus.value = ''
      } catch (error_) {
        console.error('Error highlighting JSON:', error_)
        selectedCatalogDatasetJsonFormatted.value = selectedCatalogDatasetJson.value || ''
      }
    },
    { deep: true },
  )

  onMounted(() => {
    initialize()
  })

  onActivated(() => {
    scrollToSelectedCatalogDataset()
  })

  async function initialize (): Promise<void> {
    listLoading.value = true

    selectedCatalogDataset.value = {}
    selectedCatalogDatasetJson.value = ''
    selectedCatalogDatasetJsonFormatted.value = ''

    assetJson.value = ''
    assetJsonFormatted.value = ''

    fetchStatus.value = ''

    if (selectedBusinessPartner.value && selectedBusinessPartner.value.dsp) {
      const catalogRequest: CatalogRequest = {
        counterPartyId: selectedBusinessPartner.value.bpn,
        counterPartyAddress: selectedBusinessPartner.value.dsp,
        protocol: 'dataspace-protocol-http',
      }
      const catalog = await queryCatalogue(catalogRequest)

      if (catalog && catalog['dcat:dataset']) {
        const datasets = Array.isArray(catalog['dcat:dataset'])
          ? catalog['dcat:dataset']
          : [catalog['dcat:dataset']]

        const datasetsSorted = datasets.toSorted((datasetA: any, datasetB: any) => {
          return (datasetA['@id'] || '') > (datasetB['@id'] || '') ? 1 : -1
        })

        catalogList.value = [...datasetsSorted]
        catalogListUnfiltered.value = [...datasetsSorted]
      } else {
        catalogList.value = []
        catalogListUnfiltered.value = []
      }

      scrollToSelectedCatalogDataset()
    }

    listLoading.value = false
  }

  function selectCatalogDataset (policy: any): void {
    if (isSelected(policy)) {
      selectedCatalogDataset.value = {}
    } else {
      selectedCatalogDataset.value = policy

      if (!selectedCatalogDataset.value || Object.keys(selectedCatalogDataset.value).length === 0) {
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

  function scrollToSelectedCatalogDataset (): void {
    // Find the index of the selected item
    const index = catalogList.value.findIndex((sm: any) => isSelected(sm))

    if (index !== -1) {
      const intervalId = setInterval(() => {
        if (
          virtualScrollRef.value
          && virtualScrollRef.value?.$el.querySelector('.v-virtual-scroll__container').children.length > 0
        ) {
          // Access the scrollable container
          virtualScrollRef.value.scrollToIndex(index)
          clearInterval(intervalId)
        }
      }, 50)
    }
  }

  async function fetchAsset (): Promise<void> {
    if (!selectedBusinessPartner.value || !selectedCatalogDataset.value) return

    fetchingAsset.value = true
    fetchStatus.value = 'Initiating Contract Negotiation...'
    cancelFetchAsset.value = false

    const providerAssetId = selectedCatalogDataset.value['@id']
    const providerDspEndpoint = selectedBusinessPartner.value.dsp
    const providerBpn = selectedBusinessPartner.value.bpn

    // 1. Find offer
    const policy = Array.isArray(selectedCatalogDataset.value['odrl:hasPolicy'])
      ? selectedCatalogDataset.value['odrl:hasPolicy'][0]
      : selectedCatalogDataset.value['odrl:hasPolicy']

    if (!policy) {
      console.error('No policy found in dataset')
      fetchStatus.value = 'Error: No policy found'
      fetchingAsset.value = false
      return
    }

    const contractRequest: any = {
      counterPartyAddress: providerDspEndpoint,
      protocol: 'dataspace-protocol-http',
      policy: {
        '@id': policy['@id'],
        '@type': 'Offer',
        'assigner': providerBpn,
        'target': providerAssetId,
        'permission': [
          {
            action: 'use',
          },
        ],
        'prohibition': [],
        'obligation': [],
      },
    }

    // 1. Initiate Contract Negotiation
    if (cancelFetchAsset.value) {
      fetchingAsset.value = false
      fetchStatus.value = 'Fetch cancelled'
      return
    }
    const negotiationResponse = await initiateContractNegotiation(contractRequest)
    if (!negotiationResponse) {
      fetchStatus.value = 'Error: Failed to initiate negotiation'
      fetchingAsset.value = false
      return
    }
    const negotiationId = negotiationResponse['@id']

    // 2. Polling Negotiation State until finalized
    let negotiationState = ''
    fetchStatus.value = 'Waiting for Negotiation to be finalized...'
    while (negotiationState !== 'FINALIZED') {
      if (cancelFetchAsset.value) {
        fetchingAsset.value = false
        fetchStatus.value = 'Fetch cancelled'
        return
      }
      await new Promise(resolve => setTimeout(resolve, 1000))
      const stateResponse = await getContractNegotiationState(negotiationId)
      negotiationState = stateResponse?.state || ''
      if (negotiationState) fetchStatus.value = `Negotiation state: ${negotiationState}`
    }

    if (negotiationState !== 'FINALIZED') {
      console.error('Negotiation failed or was terminated')
      fetchStatus.value = 'Error: Negotiation failed'
      fetchingAsset.value = false
      return
    }

    // Get the agreement ID from the negotiation
    if (cancelFetchAsset.value) {
      fetchingAsset.value = false
      fetchStatus.value = 'Fetch cancelled'
      return
    }
    const negotiation = await getContractNegotiation(negotiationId)
    const contractAgreementId = negotiation?.contractAgreementId
    if (!contractAgreementId) {
      fetchStatus.value = 'Error: No agreement ID found'
      fetchingAsset.value = false
      return
    }

    // 3. Initiate Transfer Process
    if (cancelFetchAsset.value) {
      fetchingAsset.value = false
      fetchStatus.value = 'Fetch cancelled'
      return
    }
    fetchStatus.value = 'Initiating Transfer Process...'
    const transferRequest: any = {
      counterPartyAddress: providerDspEndpoint,
      counterPartyId: providerBpn,
      contractId: contractAgreementId,
      protocol: 'dataspace-protocol-http',
      assetId: providerAssetId,
      transferType: 'HttpData-PULL',
    }

    const transferResponse = await initiateTransferProcess(transferRequest)
    if (!transferResponse) {
      fetchStatus.value = 'Error: Failed to initiate transfer'
      fetchingAsset.value = false
      return
    }
    const transferProcessId = transferResponse['@id']

    // 4. Polling Transfer Process State until STARTED
    let transferState = ''
    fetchStatus.value = 'Waiting for Transfer to start...'
    while (transferState !== 'STARTED' && transferState !== 'TERMINATED' && transferState !== 'COMPLETED') {
      if (cancelFetchAsset.value) {
        fetchingAsset.value = false
        fetchStatus.value = 'Fetch cancelled'
        return
      }
      await new Promise(resolve => setTimeout(resolve, 1000))
      const stateResponse = await getTransferProcessState(transferProcessId)
      transferState = stateResponse?.state || ''
      if (transferState) fetchStatus.value = `Transfer state: ${transferState}`
    }

    if (transferState !== 'STARTED' && transferState !== 'COMPLETED') {
      console.error('Transfer failed or was terminated')
      fetchStatus.value = 'Error: Transfer failed'
      fetchingAsset.value = false
      return
    }

    // 5. Get EDR Data Address
    if (cancelFetchAsset.value) {
      fetchingAsset.value = false
      fetchStatus.value = 'Fetch cancelled'
      return
    }
    fetchStatus.value = 'Retrieving EDR Data Address...'
    const edr = await getEdrDataAddress(transferProcessId)
    if (!edr) {
      fetchStatus.value = 'Error: Failed to retrieve EDR'
      fetchingAsset.value = false
      return
    }

    // 6. Fetch Asset Data using endpoint and authorization
    if (cancelFetchAsset.value) {
      fetchingAsset.value = false
      fetchStatus.value = 'Fetch cancelled'
      return
    }
    fetchStatus.value = 'Fetching Asset Data...'
    const endpoint = (edr as any).endpoint
    const token = (edr as any).authorization

    const headers = new Headers()
    if (token) {
      headers.append('Authorization', token)
    }

    try {
      const response = await fetch(endpoint, { headers })
      const data = await response.json()
      assetJson.value = JSON.stringify(data)

      // 7. Format and highlight assetJson
      const formatted = formatJSON(assetJson.value)
      assetJsonFormatted.value = Prism && Prism.highlight ? Prism.highlight(formatted, getPrismJsonLanguage(), 'json') : formatted
      fetchStatus.value = 'Asset fetched successfully'
    } catch (error) {
      console.error('Error fetching asset data:', error)
      fetchStatus.value = 'Error: Failed to fetch data'
    } finally {
      fetchingAsset.value = false
    }
  }

</script>

<style scoped>
    :deep(.token) {
        line-height: 21px;
    }

    :deep(code) {
        line-height: 21px;
    }

    .json-content {
        word-wrap: normal;
        font-size: 14px;
        line-height: 21px;
        flex-grow: 0;
        overflow: auto;
        background-color: #f5f5f5;
    }

    .json-content code {
        display: block;
    }

    :deep(.token.punctuation) {
        color: #999;
    }

    :deep(.token.property) {
        color: #905;
    }

    :deep(.token.string) {
        color: #690;
    }

    :deep(.token.number) {
        color: #07a;
    }

    :deep(.token.boolean) {
        color: #07a;
    }

    :deep(.token.null) {
        color: #999;
    }

</style>
