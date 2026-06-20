<template>
  <v-container class="pa-0 ma-0" fluid :style="{ height: fullHeight }">
    <v-layout :style="{ height: fullHeight }">

      <!-- ── Left sidebar: Business Partner selector + Catalog list ──────── -->
      <v-navigation-drawer class="leftMenu" color="appNavigation" :width="336">
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

          <v-card-text
            class="pt-0 pb-0 px-2"
            style="
              overflow-y: auto;
              height: calc(100svh - 64px - 48px - 40px - 64px - 3px);
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

      <!-- ── Main content area ─────────────────────────────────────────── -->
      <v-main class="py-0">
        <v-container
          class="ma-0 pa-0"
          fluid
          style="overflow-y: auto"
          :style="{ height: fullHeightMain }"
        >

          <!-- Empty states when nothing is selected yet -->
          <div
            v-if="
              !selectedBusinessPartner
                || Object.keys(selectedBusinessPartner).length === 0
                || !selectedCatalogDataset
                || Object.keys(selectedCatalogDataset).length === 0
            "
            class="mx-0 pa-0 d-flex align-center justify-center"
            :style="{ height: fullHeightMain }"
          >
            <v-empty-state
              v-if="
                !selectedBusinessPartner
                  || Object.keys(selectedBusinessPartner).length === 0
              "
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

            <!-- ── Catalog Dataset detail card ─────────────────────────── -->
            <div class="d-flex justify-space-between align-center mt-4 mx-4 mb-2">
              <v-btn-toggle
                v-model="selectedView"
                density="compact"
                mandatory
                rounded="lg"
                variant="outlined"
              >
                <v-btn value="tree">
                  <v-icon start>mdi-file-tree-outline</v-icon>
                  Tree
                </v-btn>

                <v-btn value="json">
                  <v-icon start>mdi-code-json</v-icon>
                  JSON
                </v-btn>
              </v-btn-toggle>

              <v-list-item-title class="text-body-large pr-2 d-flex align-center">
                <v-icon class="mr-1" color="primary" size="small">
                  mdi-database-search-outline
                </v-icon>
                Catalog Dataset
              </v-list-item-title>
            </div>

            <!-- JSON view -->
            <pre
              v-if="selectedView === 'json'"
              class="json-content mt-0 mx-4 mb-0 bg-surface rounded border"
              style="height: 275px; min-height: 63px"
            >
              <code class="mx-5" v-html="selectedCatalogDatasetJsonFormatted" />
            </pre>

            <!-- Tree view -->
            <div
              v-else
              class="rounded border overflow-y-auto mx-4 mb-0 pa-4"
              style="height: 275px; min-height: 63px; background-color: #f5f5f5"
            >
              <JsonTreeView :data="selectedCatalogDataset" />
            </div>

            <!-- ── Action bar ───────────────────────────────────────────── -->
            <v-card-actions class="mt-0 mb-2 mx-4 pa-0">
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

              <!-- Push Data button (shown when asset ID contains 'push-asset' / 'asset-push') -->
              <template v-if="isPushAsset">
                <span v-if="!dataTranserInProgress" class="text-body-2 text-medium-emphasis mr-2">
                  Select AAS/SM data below to push
                </span>

                <v-btn
                  class="text-buttonText"
                  :color="dataTranserInProgress ? 'error' : 'primary'"
                  :disabled="!dataTranserInProgress && aasSmDataToPushIsEmpty"
                  :prepend-icon="dataTranserInProgress ? 'mdi-close' : 'mdi-upload'"
                  rounded="lg"
                  :text="dataTranserInProgress ? 'Cancel Push' : 'Push selected data'"
                  variant="flat"
                  @click="dataTranserInProgress ? pushDataRef?.cancel() : pushDataRef?.pushData()"
                />
              </template>

              <!-- <v-btn
                v-else-if="isDigitalTwinRegistryAsset"
                class="text-buttonText"
                :color="dataTranserInProgress ? 'error' : 'primary'"
                :disabled="!dataTranserInProgress && aasSmDataToPushIsEmpty"
                :prepend-icon="dataTranserInProgress ? 'mdi-close' : 'mdi-upload'"
                rounded="lg"
                :text="dataTranserInProgress ? 'Cancel Push' : 'Push selected Data'"
                variant="flat"
                @click="dataTranserInProgress ? (cancelAssetTransfer = true) : pushDataRef?.pushData()"
              /> -->

              <!-- Fetch Asset button (default) -->
              <v-btn
                v-else
                class="text-buttonText"
                :color="dataTranserInProgress ? 'error' : 'primary'"
                :disabled="!dataTranserInProgress && !isHttpDataPull"
                :prepend-icon="dataTranserInProgress ? 'mdi-close' : 'mdi-download'"
                rounded="lg"
                :text="dataTranserInProgress ? 'Cancel Fetch' : 'Fetch Asset'"
                variant="flat"
                @click="dataTranserInProgress ? fetchAssetRef?.cancel() : triggerFetchAsset()"
              />
            </v-card-actions>

            <v-divider />

            <!-- ── Use case 1: Push Data ────────────────────────────────── -->
            <CatalogPushData
              v-if="isPushAsset"
              ref="pushDataRef"
              :full-height-aas-sms-data-to-push-json="fullHeightAasSmsDataToPushJson"
              :full-height-list="fullHeightList"
              :full-height-lists="fullHeightLists"
              :pushing-asset="dataTranserInProgress"
              :selected-business-partner="selectedBusinessPartner"
              :selected-catalog-dataset="selectedCatalogDataset"
              @update:aas-sm-data-to-push="aasSmDataToPush = $event"
              @update:edc-status="edcStatus = $event"
              @update:pushing-asset="dataTranserInProgress = $event"
              @update:selected-sms-count="selectedSmsCount = $event"
            />

            <!-- ── Use case 2: Fetch Asset ──────────────────────────────── -->
            <CatalogFetchAsset
              v-else
              ref="fetchAssetRef"
              :fetching-asset="dataTranserInProgress"
              :height-asset-json="heightAssetJson"
              :selected-business-partner="selectedBusinessPartner"
              :selected-catalog-dataset="selectedCatalogDataset"
              @update:edc-status="edcStatus = $event"
              @update:fetching-asset="dataTranserInProgress = $event"
            />

          </template>

        </v-container>
      </v-main>

    </v-layout>
  </v-container>
</template>

<script lang="ts" setup>
  import * as Prism from 'prismjs'
  import {
    type ComponentPublicInstance,
    computed,
    nextTick,
    onActivated,
    onMounted,
    ref,
    type Ref,
    watch,
  } from 'vue'
  import { useTheme } from 'vuetify'
  import JsonTreeView from '@/components/UIComponents/JsonTreeView.vue'
  import { useClipboardUtil } from '@/composables/ClipboardUtil'
  import CatalogFetchAsset from '@/pages/modules/EclipseDataspaceConnector/components/CatalogFetchAsset.vue'
  import CatalogPushData from '@/pages/modules/EclipseDataspaceConnector/components/CatalogPushData.vue'
  import {
    type CatalogRequest,
    useEdcClient,
  } from '@/pages/modules/EclipseDataspaceConnector/composables/Client/EdcClient'
  import { useEdcStore } from '@/pages/modules/EclipseDataspaceConnector/store/EdcStore'
  import { formatJSON } from '@/utils/JsonUtils'
  import { getPrismJsonLanguage } from '@/utils/prismJsonLanguage'
  import 'prismjs/themes/prism.css'

  // Extend the ComponentPublicInstance type to include scrollToIndex
  interface VirtualScrollInstance extends ComponentPublicInstance {
    scrollToIndex: (index: number) => void
  }

  // Stores
  const edcStore = useEdcStore()

  // Composables
  const { queryCatalog } = useEdcClient()

  const { copyToClipboard } = useClipboardUtil()

  // Vuetify
  const theme = useTheme()

  // Constants
  const fullHeight = ref('calc(100vh - 64px - 48px - 40px - 2px)')
  const fullHeightMain = ref('calc(100vh - 64px - 48px - 40px - 2px)')
  const heightAssetJson = ref('calc(100vh - 64px - 48px - 40px - 2px - 275px)')
  const fullHeightLists = ref(
    'calc(100vh - 64px - 48px - 40px - 2px - 275px - 60px - 60px - 1px)',
  )
  const fullHeightList = ref(
    'calc(100vh - 64px - 48px - 40px - 2px - 275px - 60px - 60px - 64px)',
  )
  const fullHeightAasSmsDataToPushJson = ref(
    'calc(100vh - 64px - 48px - 40px - 2px - 275px - 60px - 60px - 1px - 64px - 16px)',
  )

  // Data
  const aasSmDataToPush = ref({} as any)
  const catalogList = ref([] as Array<any>) as Ref<Array<any>>
  const catalogListUnfiltered = ref([] as Array<any>) as Ref<Array<any>>
  const copyIcon = ref<string>('mdi-clipboard-file-outline')
  const dataTranserInProgress = ref(false)
  const edcStatus = ref('')
  const fetchAssetRef = ref<InstanceType<typeof CatalogFetchAsset> | null>(null)
  const listLoading = ref(false)
  const pushDataRef = ref<InstanceType<typeof CatalogPushData> | null>(null)
  const selectedBusinessPartner = ref<any>(null)
  const selectedCatalogDataset = ref({} as any)
  const selectedCatalogDatasetJson = ref<string>('')
  const selectedCatalogDatasetJsonFormatted = ref<string>('')
  const selectedSmsCount = ref(0)
  const selectedView = ref<'json' | 'tree'>('tree')
  const virtualScrollRef: Ref<VirtualScrollInstance | null> = ref(null)

  // Computed
  const businessPartners = computed(
    () => edcStore.getEdcConfig?.businessPartners ?? [],
  )
  const primaryColor = computed(() => theme.current.value.colors.primary)
  const isDark = computed(() => theme.current.value.dark)
  const copyIconAsRef = computed(() => copyIcon)
  const isPushAsset = computed(() => {
    const id: string = selectedCatalogDataset.value?.['@id'] ?? ''
    return id.includes('push-asset') || id.includes('asset-push')
  })
  const _isDigitalTwinRegistryAsset = computed(() => {
    const id: string = selectedCatalogDataset.value?.['@id'] ?? ''
    return id.includes('dt-registry') || id.includes('digitaltwin-registry') || id.includes('digital-twin-registry')
  })
  const isHttpDataPull = computed(() => {
    const distributions = selectedCatalogDataset.value?.['dcat:distribution']
    if (!distributions) return false
    const distArray = Array.isArray(distributions)
      ? distributions
      : [distributions]
    return distArray.some(
      (dist: any) =>
        dist['@type'] === 'dcat:Distribution'
        && dist['dct:format']?.['@id'] === 'HttpData-PULL',
    )
  })
  const aasSmDataToPushIsEmpty = computed(() => {
    return (
      !aasSmDataToPush.value
      || Object.keys(aasSmDataToPush.value).length === 0
    ) && selectedSmsCount.value === 0
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
    () => isPushAsset.value,
    async value => {
      if (value) {
        await nextTick()
        pushDataRef.value?.initialize()
      }
    },
  )

  watch(
    () => selectedCatalogDataset.value,
    () => {
      try {
        selectedCatalogDatasetJson.value = JSON.stringify(
          selectedCatalogDataset.value,
        )
        const formatted = formatJSON(selectedCatalogDatasetJson.value)

        selectedCatalogDatasetJsonFormatted.value
          = Prism && Prism.highlight
            ? Prism.highlight(formatted, getPrismJsonLanguage(), 'json')
            : formatted

        edcStatus.value = ''
      } catch (error_) {
        console.error('Error highlighting JSON:', error_)
        selectedCatalogDatasetJsonFormatted.value
          = selectedCatalogDatasetJson.value || ''
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
    edcStatus.value = ''

    if (selectedBusinessPartner.value?.dsp) {
      const catalogRequest: CatalogRequest = {
        counterPartyId: selectedBusinessPartner.value.bpn,
        counterPartyAddress: selectedBusinessPartner.value.dsp,
        protocol: 'dataspace-protocol-http',
      }
      const catalog = await queryCatalog(catalogRequest)

      if (catalog && catalog['dcat:dataset']) {
        const datasets = Array.isArray(catalog['dcat:dataset'])
          ? catalog['dcat:dataset']
          : [catalog['dcat:dataset']]

        const datasetsSorted = datasets.toSorted(
          (datasetA: any, datasetB: any) =>
            (datasetA['@id'] || '') > (datasetB['@id'] || '') ? 1 : -1,
        )

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

  /** Delegate fetch to CatalogFetchAsset sub-component. */
  function triggerFetchAsset (): void {
    fetchAssetRef.value?.fetchAsset()
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
