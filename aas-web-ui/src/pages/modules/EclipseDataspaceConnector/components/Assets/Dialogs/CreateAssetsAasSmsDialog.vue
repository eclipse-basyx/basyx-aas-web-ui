<template>
  <v-dialog v-model="createAssetsDialog" height="90%" style="max-width: 1440px" width="90%">
    <v-sheet border class="d-flex flex-column" height="100%" rounded="lg">
      <v-card-title class="bg-cardHeader">
        Create Assets
      </v-card-title>

      <v-divider />

      <v-card-text class="pa-0 overflow-y-auto flex-grow-1">

        <v-layout :style="{ 'height': fullHeight}">

          <v-navigation-drawer
            class="leftMenu"
            color="appNavigation"
            :width="336"
          >
            <v-card color="rgba(0,0,0,0)" elevation="0">
              <v-card-title
                class="px-2 d-flex align-center"
              >

                <v-tooltip
                  location="bottom"
                  open-delay="600"
                >
                  <template #activator="{ props: activatorProps }">
                    <v-btn
                      class="ml-n3"
                      icon="mdi-reload"
                      :loading="aasListLoading"
                      variant="plain"
                      v-bind="activatorProps"
                      @click="initialize()"
                    />

                  </template>

                  <span>Reload AAS List</span>
                </v-tooltip>

                <v-text-field
                  clearable
                  density="compact"
                  hide-details
                  label="Search for AAS..."
                  :model-value="aasSearchValue"
                  persistent-placeholder
                  :placeholder="aasList.length.toString() + ' Shells'"
                  variant="outlined"
                  @update:model-value="debouncedFilterAasList"
                />
              </v-card-title>

              <v-divider />

              <v-card-text class="pt-0 pb-0 px-2" style="overflow-y: auto" :style="{'height': fullHeightLists}">

                <div v-if="aasListLoading">
                  <v-skeleton-loader type="list-item@6" />
                </div>

                <template v-else>
                  <!-- AAS List -->
                  <v-list
                    v-if="aasList.length > 0"
                    class="pa-0"
                    density="compact"
                    nav
                  >

                    <v-virtual-scroll
                      ref="virtualScrollRef"
                      class="bg-card mb-2"
                      :item-height="itemHeight"
                      :items="aasList"
                    >

                      <template #default="{ item }">
                        <!-- Single AAS -->
                        <v-list-item
                          v-if="item && Object.keys(item).length > 0"
                          :active="aasIsSelected(item)"
                          base-color="listItem"
                          :border="aasIsSelected(item) ? 'primary' : 'listItem thin'"
                          class="mt-2 mx-0"
                          color="primarySurface"
                          style="border-top: solid; border-right: solid; border-bottom: solid; border-width: 1px"
                          :style="{
                            'border-color': aasIsSelected(item)
                              ? primaryColor + ' !important'
                              : isDark
                                ? '#686868 !important'
                                : '#ABABAB !important',
                          }"
                          variant="tonal"
                          @click="selectAAS(item)"
                        >

                          <template #prepend>
                            <v-btn
                              class="ml-n1"
                              color="primary"
                              icon="custom:aasIcon"
                              rel="noopener noreferrer"
                              size="x-small"
                              style="z-index: 9000"
                              target="_blank"
                              variant="plain"
                              @click.stop
                            />
                          </template>
                          <!-- Tooltip with idShort and id -->
                          <v-tooltip
                            activator="parent"
                            open-delay="600"
                            transition="slide-x-transition"
                          >
                            <!-- AAS ID -->
                            <div v-if="item.id" class="text-body-small">
                              <span class="font-weight-bold">{{ 'ID: ' }}</span>
                              {{ item.id }}
                            </div>
                            <!-- AAS idShort -->
                            <div v-if="item.idShort" class="text-body-small">
                              <span class="font-weight-bold"> {{ 'idShort: ' }}</span>
                              {{ item.idShort }}
                            </div>

                            <v-divider v-if="item.administration?.version" class="my-1" />
                            <!-- AAS administrative information -->
                            <div v-if="item.administration?.version" class="text-body-small">
                              <span class="font-weight-bold">{{ 'Version: ' }}</span>
                              {{
                                item.administration.version +
                                  (item.administration.revision ? '.' + item.administration.revision : '')
                              }}
                            </div>
                          </v-tooltip>

                          <v-list-item-title class="text-primary" style="z-index: 9999">
                            {{ nameToDisplay(item) }}
                          </v-list-item-title>

                          <v-list-item-subtitle class="text-listItemText">
                            {{ item.id }}
                          </v-list-item-subtitle>

                        </v-list-item>
                      </template>

                    </v-virtual-scroll>

                    <v-list-item
                      v-if="isSearchLimited"
                      class="px-4 py-1"
                      density="compact"
                    >
                      <v-list-item-subtitle class="text-listItemText">
                        Searching loaded shells only. Scroll down to load more.
                      </v-list-item-subtitle>
                    </v-list-item>

                    <v-list-item
                      v-if="pageLoading && !aasListLoading"
                      class="px-4 py-0"
                      density="compact"
                    >
                      <template #prepend>
                        <v-progress-circular class="mr-2" indeterminate size="16" width="2" />
                      </template>

                      <v-list-item-subtitle class="text-listItemText ml-1">Loading more shells...</v-list-item-subtitle>
                    </v-list-item>
                  </v-list>

                </template>

              </v-card-text>

            </v-card>
          </v-navigation-drawer>

          <v-navigation-drawer
            class="leftMenu"
            color="appNavigation"
            :width="336"
          >
            <v-card color="rgba(0,0,0,0)" elevation="0">
              <v-card-title
                class="px-2 d-flex align-center"
              >
                <v-text-field
                  clearable
                  density="compact"
                  hide-details
                  label="Search for Submodel..."
                  :model-value="aasSearchValue"
                  persistent-placeholder
                  :placeholder="smList.length.toString() + ' Submodels'"
                  variant="outlined"
                  @update:model-value="filterSubmodelList"
                />

                <v-tooltip
                  location="bottom"
                  open-delay="600"
                >
                  <template #activator="{ props: activatorProps }">
                    <v-btn
                      class="mx-0"
                      icon="mdi-checkbox-multiple-outline"
                      variant="plain"
                      v-bind="activatorProps"
                      @click="selectAllSMs()"
                    />
                  </template>

                  <span>Select all Submodels</span>
                </v-tooltip>

                <v-tooltip
                  location="bottom"
                  open-delay="600"
                >
                  <template #activator="{ props: activatorProps }">
                    <v-btn
                      class="ml-n3 mr-n2"
                      icon="mdi-checkbox-multiple-blank-outline"
                      variant="plain"
                      v-bind="activatorProps"
                      @click="deselectAllSMs()"
                    />
                  </template>

                  <span>Deselect all Submodels</span>
                </v-tooltip>

              </v-card-title>

              <v-divider />

              <v-card-text class="pt-0 pb-0 px-2" style="overflow-y: auto" :style="{'height': fullHeightLists}">

                <div v-if="smListLoading">
                  <v-skeleton-loader type="list-item@6" />
                </div>

                <template v-else>

                  <div v-if="!selectedAAS || Object.keys(selectedAAS).length === 0" class="d-flex align-center justify-center" :style="{'height': fullHeightLists}">

                    <v-empty-state
                      icon="mdi-gesture-tap"
                      text="Please select an AAS to load its Submodels"
                      title="Select AAS"
                    >
                      <template #media>
                        <v-icon size="64" />
                      </template>
                    </v-empty-state>
                  </div>

                  <!-- SM List -->
                  <v-list
                    v-else-if="smList.length > 0"
                    v-model:selected="selectedSmIds"
                    class="pa-0"
                    density="compact"
                    nav
                    select-strategy="leaf"
                  >

                    <v-virtual-scroll
                      ref="smVirtualScrollRef"
                      class="bg-card mb-2"
                      :item-height="itemHeight"
                      :items="smList"
                    >

                      <template #default="{ item }">
                        <!-- Single SM -->
                        <v-list-item
                          v-if="item && Object.keys(item).length > 0"
                          :key="item.id"
                          :active="smIsSelected(item)"
                          base-color="listItem"
                          :border="smIsSelected(item) ? 'primary' : 'listItem thin'"
                          class="mt-2 mx-0"
                          color="primarySurface"
                          style="border-top: solid; border-right: solid; border-bottom: solid; border-width: 1px"
                          :style="{
                            'border-color': smIsSelected(item)
                              ? primaryColor + ' !important'
                              : isDark
                                ? '#686868 !important'
                                : '#ABABAB !important',
                          }"
                          :value="item.id"
                          variant="tonal"
                        >

                          <template #prepend="{ isSelected, select }">
                            <v-checkbox-btn class="ml-n1 mr-1" :model-value="isSelected" @update:model-value="select" />
                          </template>

                          <!-- Tooltip with idShort and id -->
                          <v-tooltip
                            activator="parent"
                            open-delay="600"
                            transition="slide-x-transition"
                          >
                            <!-- Submodel ID -->
                            <div v-if="item.id" class="text-body-small">
                              <span class="font-weight-bold">{{ 'ID: ' }}</span>
                              {{ item.id }}
                            </div>
                            <!-- Submodel idShort -->
                            <div v-if="item.idShort" class="text-body-small">
                              <span class="font-weight-bold"> {{ 'idShort: ' }}</span>
                              {{ item.idShort }}
                            </div>
                            <!-- Submodel semanticId -->
                            <div v-if="item?.semanticId?.keys[0]?.value" class="text-body-small">
                              <span class="font-weight-bold"> {{ 'semanticId: ' }}</span>
                              {{ item.semanticId.keys[0].value }}
                            </div>

                            <v-divider v-if="item.administration?.version" class="my-1" />
                            <!-- Submodel administrative information -->
                            <div v-if="item.administration?.version" class="text-body-small">
                              <span class="font-weight-bold">{{ 'Version: ' }}</span>
                              {{
                                item.administration.version +
                                  (item.administration.revision
                                    ? '.' + item.administration.revision
                                    : '')
                              }}
                            </div>

                            <v-divider
                              v-if="
                                item?.semanticId?.keys[0]?.value &&
                                  (smts.some(
                                    (smt: any) => item.semanticId.keys[0].value === smt.semanticId
                                  ) ||
                                    extractVersionRevision(item.semanticId.keys[0].value).version)
                              "
                              class="my-1"
                            />
                            <!-- Submodel Template name -->
                            <div
                              v-if="
                                smts.some(
                                  (smt: any) =>
                                    item?.semanticId?.keys[0]?.value === smt.semanticId
                                )
                              "
                              class="text-body-small"
                            >
                              <span class="font-weight-bold">{{ 'SMT: ' }}</span>
                              {{
                                smts.find(
                                  (smt: any) =>
                                    item?.semanticId?.keys[0]?.value === smt.semanticId
                                )?.name
                              }}
                            </div>
                            <!-- Submodel Template version -->
                            <div
                              v-if="
                                smts.some(
                                  (smt: any) =>
                                    item?.semanticId?.keys[0]?.value === smt.semanticId
                                )
                              "
                              class="text-body-small"
                            >
                              <span class="font-weight-bold">{{ 'SMT Version: ' }}</span>
                              {{
                                smts.find(
                                  (smt: any) =>
                                    item?.semanticId?.keys[0]?.value === smt.semanticId
                                )?.version
                              }}
                            </div>
                            <!-- Submodel Template version extracted from semanticId -->
                            <div
                              v-else-if="
                                item?.semanticId?.keys[0]?.value &&
                                  extractVersionRevision(item?.semanticId?.keys[0]?.value).version
                              "
                              class="text-body-small"
                            >
                              <span class="font-weight-bold">{{ 'SMT Version: ' }}</span>
                              {{
                                extractVersionRevision(item?.semanticId?.keys[0]?.value).version +
                                  (extractVersionRevision(item?.semanticId?.keys[0]?.value).revision
                                    ? '.' +
                                      extractVersionRevision(item?.semanticId?.keys[0]?.value)
                                        .revision
                                    : '')
                              }}
                            </div>
                          </v-tooltip>

                          <v-list-item-title class="text-primary" style="z-index: 9999">
                            {{ nameToDisplay(item) }}
                          </v-list-item-title>

                          <v-list-item-subtitle class="text-listItemText">
                            {{ item.id }}
                          </v-list-item-subtitle>

                          <template v-if="smVersionToDisplay(item)" #append>
                            <v-chip size="x-small"> v{{ smVersionToDisplay(item) }} </v-chip>
                          </template>

                        </v-list-item>
                      </template>

                    </v-virtual-scroll>

                    <v-list-item
                      v-if="isSearchLimited"
                      class="px-4 py-1"
                      density="compact"
                    >
                      <v-list-item-subtitle class="text-listItemText">
                        Searching loaded shells only. Scroll down to load more.
                      </v-list-item-subtitle>
                    </v-list-item>

                    <v-list-item
                      v-if="pageLoading && !aasListLoading"
                      class="px-4 py-0"
                      density="compact"
                    >
                      <template #prepend>
                        <v-progress-circular class="mr-2" indeterminate size="16" width="2" />
                      </template>

                      <v-list-item-subtitle class="text-listItemText ml-1">Loading more shells...</v-list-item-subtitle>
                    </v-list-item>
                  </v-list>

                </template>

              </v-card-text>

            </v-card>
          </v-navigation-drawer>

          <v-main class="py-0">

            <v-container class="ma-0 pa-0" fluid style="overflow-y: auto;" :style="{'height': fullHeightMain}">

              <div v-if="!selectedAAS || Object.keys(selectedAAS).length === 0" class="d-flex align-center justify-center" :style="{'height': fullHeightMain}">

                <v-empty-state
                  icon="mdi-gesture-tap"
                  style="padding-top: 86px"
                  text="Please select an AAS to register as EDC Asset."
                  title="Select AAS"
                >
                  <template #media>
                    <v-icon size="64" />
                  </template>
                </v-empty-state>

              </div>

              <template v-else>

                <v-list-item class="pl-3">
                  <v-list-item-title class="text-body-large">EDC Asset (of AAS)</v-list-item-title>
                </v-list-item>

                <pre
                  class="json-content mt-0 mx-4 mb-5 bg-surface rounded border"
                  style="height: 275px; min-height: 63px"
                >
                  <code class="mx-5" v-html="aasEdcAssetJsonFormatted" />
                </pre>

                <v-divider class="mt-4" />

                <v-list-item class="pl-3">
                  <v-list-item-title class="text-body-large">EDC Assets (of Submodels)</v-list-item-title>
                </v-list-item>

                <pre
                  class="json-content mt-0 mx-4 mb-5 bg-surface rounded border"
                  style="min-height: 63px"
                  :style="{'max-height': heightSmJson}"
                >
                  <code class="mx-5" v-html="smEdcAssetsJsonFormatted" />
                </pre>

              </template>

            </v-container>

          </v-main>

        </v-layout>

      </v-card-text>

      <v-card-actions>
        <v-spacer />

        <v-checkbox
          v-model="updateEndpoints"
          class="m-0"
          density="compact"
          hide-details
          label="Add DSP Endpoint to AAS/SM descriptors"
        />

        <v-spacer />

        <v-btn
          rounded="lg"
          text="Cancel"
          @click="createAssetsDialog = false"
        />

        <v-btn
          class="text-buttonText"
          color="primary"
          :disabled="!selectedAAS || Object.keys(selectedAAS).length === 0"
          rounded="lg"
          text="Create"
          variant="flat"
          @click="createEdcAssets"
        />
      </v-card-actions>
    </v-sheet>
  </v-dialog>
</template>

<script lang="ts" setup>
  import { base64Decode } from 'basyx-typescript-sdk'
  import Prism from 'prismjs'
  import { computed, onMounted, ref } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useTheme } from 'vuetify'
  import { useAASHandling } from '@/composables/AAS/AASHandling'
  import { appendOrMergeSortedAasById, compareAasById } from '@/composables/AAS/AASListAccumulation'
  import { useAASListPagination } from '@/composables/AAS/AASListPagination'
  import { useReferableUtils } from '@/composables/AAS/ReferableUtils'
  import { useSMHandling } from '@/composables/AAS/SMHandling'
  import { useAASRegistryClient } from '@/composables/Client/AASRegistryClient'
  import { useSMRegistryClient } from '@/composables/Client/SMRegistryClient'
  import { useEdcClient } from '@/pages/modules/EclipseDataspaceConnector/composables/Client/EdcClient'
  import assetTemplate_v0_9 from '@/pages/modules/EclipseDataspaceConnector/data/assets/asset___tractus-x_edc_v0.9.json'
  import assetTemplate_v0_12_1 from '@/pages/modules/EclipseDataspaceConnector/data/assets/asset___tractus-x_edc_v0.12.1.json'
  import { useEdcStore } from '@/pages/modules/EclipseDataspaceConnector/store/EdcStore'
  import { useAASStore } from '@/store/AASDataStore'
  import { useNavigationStore } from '@/store/NavigationStore'
  import { extractEndpointHref, getEndpointProtocol } from '@/utils/AAS/DescriptorUtils'
  import { extractVersionRevision } from '@/utils/AAS/SemanticIdUtils'
  import { smts } from '@/utils/AAS/SubmodelTemplateUtils'
  import { base64Encode } from '@/utils/EncodeDecodeUtils'
  import { debounce } from '@/utils/generalUtils'
  import { formatJSON } from '@/utils/JsonUtils'
  import { getPrismJsonLanguage } from '@/utils/prismJsonLanguage'
  import 'prismjs/themes/prism.css'

  // Extend the ComponentPublicInstance type to include scrollToIndex
  interface VirtualScrollInstance extends ComponentPublicInstance {
    scrollToIndex: (index: number) => void
  }

  const props = defineProps<{
    modelValue: boolean
  }>()

  const emit = defineEmits<{
    (event: 'update:model-value' | 'assets-created', value: boolean): void
  }>()

  // Vue Router
  const route = useRoute()
  const router = useRouter()

  // Stores
  const navigationStore = useNavigationStore()
  const aasStore = useAASStore()
  const edcStore = useEdcStore()

  // Composables
  const { createAsset } = useEdcClient()
  const { fetchAasShellListPage, fetchAasById, fetchAasSmListById } = useAASHandling()
  const { fetchSmById } = useSMHandling()
  const { nameToDisplay, descriptionToDisplay } = useReferableUtils()
  const { fetchAasDescriptorById, putAasDescriptor } = useAASRegistryClient()
  const { fetchSmDescriptorById, putSubmodelDescriptor } = useSMRegistryClient()

  // Vuetify
  const theme = useTheme()

  // Data
  const createAssetsDialog = ref(false)
  const fullHeight = ref('calc(90vh - 52px - 52px)') // dialog - dialog header - dialog footer
  const fullHeightMain = ref('calc(90vh - 52px - 52px)') // dialog - dialog header - dialog footer
  const fullHeightLists = ref('calc(90vh - 52px - 52px - 64px - 1px)') // Full height -  - search field - search field divider
  const heightSmJson = ref('calc(90vh - 52px - 52px - 275px)') // Full height -  - padding - border - aasJson - v-list-item - action bar
  const debouncedFilterAasList = debounce(filterAasList, 300) // Debounced function to filter the AAS List
  const itemHeight = 56
  const minPageLimit = 100
  const maxPageLimit = 300
  const prefetchThresholdInRows = 8
  const pageSizeMultiplier = 3
  const scrollLoadDebounceMs = 200
  const minPageLoadIntervalMs = 350

  const aasList = ref([] as Array<any>) as Ref<Array<any>> // Variable to store currently displayed AAS Data
  const smList = ref([] as Array<any>) as Ref<Array<any>> // Variable to store the SM Data
  const smListUnfiltered = ref([] as Array<any>) as Ref<Array<any>> // Variable to store the SM Data before

  const allLoadedAas = ref([] as Array<any>) as Ref<Array<any>> // Variable to store all loaded AAS Data

  const aasSearchValue = ref('')

  const aasLoadedIds = ref(new Set<string>())
  const aasListLoading = computed(() => isLoadingInitialPage.value) // Variable to store if the AAS List is loading

  const smListLoading = ref(false)

  const virtualScrollRef: Ref<VirtualScrollInstance | null> = ref(null) // Reference to the Virtual Scroll Component
  const smVirtualScrollRef: Ref<VirtualScrollInstance | null> = ref(null) // Reference to the Virtual Scroll Component

  const jsonLanguage = getPrismJsonLanguage()

  const aasEdcAsset = ref({} as any)
  const aasEdcAssetJson = ref<string>('')
  const aasEdcAssetJsonFormatted = ref<string>('')

  const smEdcAssets = ref([] as any)
  const smEdcAssetsJson = ref<string>('')
  const smEdcAssetsJsonFormatted = ref<string>('')

  const selectedSmIds = ref<string[]>([])

  const updateEndpoints = ref(false)

  const {
    hasMorePages,
    isLoadingInitialPage,
    pageLoading,
    resetPaginationState: resetPaginationStateInternal,
    initialize: initializePagination,
  } = useAASListPagination({
    virtualScrollRef,
    itemHeight,
    minPageLimit,
    maxPageLimit,
    pageSizeMultiplier,
    prefetchThresholdInRows,
    scrollLoadDebounceMs,
    minPageLoadIntervalMs,
    fetchPage: params => fetchAasShellListPage(params),
    onPageItems: items => {
      const incomingItems = items
        .toSorted(compareAasById)
        .filter(item => {
          if (!item?.id || aasLoadedIds.value.has(item.id)) {
            return false
          }
          aasLoadedIds.value.add(item.id)
          return true
        })
        .map(item => preprocessListItem(item))

      if (incomingItems.length > 0) {
        allLoadedAas.value = appendOrMergeSortedAasById(allLoadedAas.value, incomingItems)
        applyCurrentFilter()
      }
    },
  })

  // Computed Properties
  const isDark = computed(() => theme.global.current.value.dark) // Check if the current Theme is dark
  const primaryColor = computed(() => theme.current.value.colors.primary) // returns the primary color of the current theme

  const selectedAAS = computed(() => aasStore.getSelectedAAS) // Get the selected AAS from Store

  const activeAssetTemplate = computed(() =>
    edcStore.getEdcType === 'Tractus-X EDC v0.12.1' ? assetTemplate_v0_12_1 : assetTemplate_v0_9,
  )

  const isSearchLimited = computed(() => aasSearchValue.value.trim() !== '' && hasMorePages.value)

  onMounted(async () => {
    initialize()
  })

  // Watchers
  watch(
    () => props.modelValue,
    value => {
      createAssetsDialog.value = value
      if (!value) {
        // resetForm()
      }
    },
  )

  watch(
    () => createAssetsDialog.value,
    value => {
      emit('update:model-value', value)
    },
  )

  watch(
    () => aasEdcAsset.value,
    () => {
      try {
        aasEdcAssetJson.value = JSON.stringify(aasEdcAsset.value)
        const formatted = formatJSON(aasEdcAssetJson.value)

        // Apply syntax highlighting using Prism
        if (Prism && Prism.highlight) {
          aasEdcAssetJsonFormatted.value = Prism.highlight(formatted, jsonLanguage, 'json')
        } else {
          aasEdcAssetJsonFormatted.value = formatted
          console.warn('Prism highlighting not available')
        }
      } catch (error_) {
        console.error('Error highlighting JSON:', error_)
        aasEdcAssetJsonFormatted.value = aasEdcAssetJson.value || ''
      }
    },
    { deep: true },
  )

  watch(
    () => selectedAAS.value,
    async () => {
      applyCurrentFilter()
      scrollToSelectedAAS()

      prepareAasData()
    },
    { deep: true },
  )

  watch(
    () => selectedSmIds.value,
    async () => {
      smEdcAssets.value = []

      for (const smId of selectedSmIds.value) {
        const sm = await fetchSmById(smId)
        smEdcAssets.value = [...smEdcAssets.value, createEdcAssetJson(selectedAAS.value, sm)]
      }
    },
  )

  watch(
    () => smEdcAssets.value,
    () => {
      try {
        smEdcAssetsJson.value = JSON.stringify(smEdcAssets.value)
        const formatted = formatJSON(smEdcAssetsJson.value)

        // Apply syntax highlighting using Prism
        if (Prism && Prism.highlight) {
          smEdcAssetsJsonFormatted.value = Prism.highlight(formatted, jsonLanguage, 'json')
        } else {
          smEdcAssetsJsonFormatted.value = formatted
          console.warn('Prism highlighting not available')
        }
      } catch (error_) {
        console.error('Error highlighting JSON:', error_)
        smEdcAssetsJsonFormatted.value = smEdcAssetsJson.value || ''
      }
    },
    { deep: true },
  )

  function preprocessListItem (item: any): any {
    return {
      ...item,
      idLower: item?.id?.toLowerCase() || '',
      idShortLower: item?.idShort?.toLowerCase() || '',
      nameLower: nameToDisplay(item).toLowerCase(),
      descLower: descriptionToDisplay(item).toLowerCase(),
    }
  }

  function applyCurrentFilter (): void {
    const trimmedSearch = aasSearchValue.value.trim().toLowerCase()
    const filteredItems = trimmedSearch === ''
      ? allLoadedAas.value
      : allLoadedAas.value.filter(
        aasOrAasDescriptor =>
          aasOrAasDescriptor.idLower.includes(trimmedSearch)
          || aasOrAasDescriptor.idShortLower.includes(trimmedSearch)
          || aasOrAasDescriptor.nameLower.includes(trimmedSearch)
          || aasOrAasDescriptor.descLower.includes(trimmedSearch),
      )

    const pinnedSelectedItem = createPinnedSelectedItem()
    if (pinnedSelectedItem) {
      aasList.value = [
        pinnedSelectedItem,
        ...filteredItems.filter(item => item?.id !== pinnedSelectedItem.id),
      ]
      return
    }

    aasList.value = filteredItems
  }

  function createPinnedSelectedItem (): any | undefined {
    if (!selectedAAS.value || Object.keys(selectedAAS.value).length === 0 || !selectedAAS.value.id) {
      return undefined
    }

    const selectedId = selectedAAS.value.id
    const selectedLoadedItem = allLoadedAas.value.find(item => item?.id === selectedId)
    if (selectedLoadedItem) {
      return selectedLoadedItem
    }

    const aasPathFromQuery = typeof route.query.aas === 'string' ? route.query.aas : ''
    const selectedPath = selectedAAS.value.path || aasPathFromQuery
    return preprocessListItem({
      ...selectedAAS.value,
      path: selectedPath,
    })
  }

  function resetAASListState (enablePagination = true): void {
    aasList.value = []
    allLoadedAas.value = []
    aasLoadedIds.value.clear()
    resetPaginationStateInternal(enablePagination)
    aasSearchValue.value = ''
  }

  // Function to get the AAS Data from the Registry Server
  async function initialize (): Promise<void> {
    resetAASListState(true)
    await initializePagination(scrollToSelectedAAS)
    await prepareAasData()
  }

  async function prepareAasData () {
    if (selectedAAS.value && Object.keys(selectedAAS.value).length > 0) {
      const aas = await fetchAasById(selectedAAS.value.id)

      aasEdcAsset.value = createEdcAssetJson(aas, null)

      fetchAasSmListById(aas.id).then((submodels: Array<any>) => {
        const submodelsSorted = submodels.toSorted((smA: any, smB: any) => {
          // Sort SMs with respect to displayed title and version
          return smTitleToDisplay(smA) + '|' + smVersionToDisplay(smA)
            > smTitleToDisplay(smB) + '|' + smVersionToDisplay(smB)
            ? 1
            : -1
        })

        smList.value = [...submodelsSorted]
      })
    } else {
      aasEdcAsset.value = {}
      smList.value = []
    }
    selectedSmIds.value = []
  }

  function filterAasList (value: string | null): void {
    aasSearchValue.value = value?.trim() ?? ''
    applyCurrentFilter()
    scrollToSelectedAAS()
  }

  function filterSubmodelList (value: string): void {
    if (!value || value.trim() === '') {
      smList.value = smListUnfiltered.value
    } else {
      // Filter list of SMs (cf. AASList.vue)
      const smListFiltered = smListUnfiltered.value.filter(
        (sm: any) =>
          sm.id.toLowerCase().includes(value.toLowerCase())
          || sm.idShort.toLowerCase().includes(value.toLowerCase())
          || nameToDisplay(sm).toLowerCase().includes(value.toLowerCase())
          || descriptionToDisplay(sm).toLowerCase().includes(value.toLowerCase()),
      )
      smList.value = smListFiltered
    }
    scrollToSelectedSubmodel()
  }

  function selectAAS (aas: any): void {
    if (aasListLoading.value) {
      navigationStore.dispatchSnackbar({
        status: true,
        timeout: 4000,
        color: 'error',
        btnColor: 'buttonText',
        text: 'Please wait for the current Request to finish.',
      })
      return
    }

    if (aasIsSelected(aas)) {
      // Deselect AAS: remove aas and path url query parameter
      const query = structuredClone(route.query)
      if (Object.hasOwn(query, 'aas')) delete query.aas
      if (Object.hasOwn(query, 'path')) delete query.path

      router.push({ query: query })
    } else {
      const query = structuredClone(route.query)
      query.aas = aas.path
      if (Object.hasOwn(query, 'path')) delete query.path

      router.push({ query: query })
    }
  }

  function selectAllSMs (): void {
    selectedSmIds.value = []
    for (const sm of smList.value) {
      selectedSmIds.value = [...selectedSmIds.value, sm.id]
    }
  }

  function deselectAllSMs (): void {
    selectedSmIds.value = []
  }

  function aasIsSelected (aasOrAasDescriptor: any): boolean {
    if (
      !selectedAAS.value
      || Object.keys(selectedAAS.value).length === 0
      || !selectedAAS.value.id
      || !aasOrAasDescriptor
      || Object.keys(aasOrAasDescriptor).length === 0
      || !aasOrAasDescriptor.id
    ) {
      return false
    }
    return selectedAAS.value.id === aasOrAasDescriptor.id
  }

  function smIsSelected (smOrSmDescriptor: any): boolean {
    if (
      !smOrSmDescriptor
      || Object.keys(smOrSmDescriptor).length === 0
      || !smOrSmDescriptor.id
    ) {
      return false
    }
    return selectedSmIds.value.includes(smOrSmDescriptor.id)
  }

  // Function to scroll to the selected AAS
  function scrollToSelectedAAS (): void {
    // Find the index of the selected item
    const index = aasList.value.findIndex((aasOrAasDescriptor: any) => aasIsSelected(aasOrAasDescriptor))

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

  function scrollToSelectedSubmodel (): void {
    // Find the index of the selected item
    const index = smList.value.findIndex((sm: any) => smIsSelected(sm))

    if (index !== -1) {
      const intervalId = setInterval(() => {
        if (
          smVirtualScrollRef.value
          && virtualScrollRef.value?.$el.querySelector('.v-virtual-scroll__container').children.length > 0
        ) {
          // Access the scrollable container
          smVirtualScrollRef.value.scrollToIndex(index)
          clearInterval(intervalId)
        }
      }, 50)
    }
  }

  function createEdcAssetJson (aas: any, sm: any): any {
    if (!aas || Object.keys(aas).length === 0) return {}

    const identifiable = (aas && Object.keys(aas).length > 0 && sm && Object.keys(sm).length > 0) ? sm : aas

    const assetDisplayName = (aas && Object.keys(aas).length > 0 && sm && Object.keys(sm).length > 0)
      ? nameToDisplay(aas, 'en') + ' - SM ' + nameToDisplay(sm, 'en')
      : nameToDisplay(identifiable, 'en')
    const assetDescription = descriptionToDisplay(identifiable, 'en')
    const assetEndpoint = identifiable.path

    let templateStr = JSON.stringify(activeAssetTemplate.value)
    templateStr = templateStr.replace(/\{\{EDC Asset ID(?:\|[^}]*)?\}\}/g, base64Encode(identifiable.id))
    templateStr = templateStr.replace(/\{\{Asset ID(?:\|[^}]*)?\}\}/g, base64Encode(identifiable.id))
    templateStr = templateStr.replace(/\{\{Asset Display Name(?:\|[^}]*)?\}\}/g, assetDisplayName)
    templateStr = templateStr.replace(/\{\{Asset Description(?:\|[^}]*)?\}\}/g, assetDescription)
    templateStr = templateStr.replace(/\{\{Asset Endpoint(?:\|[^}]*)?\}\}/g, assetEndpoint)

    // TODO Specification of oauth2 for dataAddress
    templateStr = templateStr.replace(/\{\{Endpoint client ID(?:\|[^}]*)?\}\}/g, '')
    templateStr = templateStr.replace(/\{\{Endpoint client secret key(?:\|[^}]*)?\}\}/g, '')
    templateStr = templateStr.replace(/\{\{Token scope(?:\|[^}]*)?\}\}/g, '')
    templateStr = templateStr.replace(/\{\{Token endpoint(?:\|[^}]*)?\}\}/g, '')

    const edcAsset = JSON.parse(templateStr)

    // Remove oauth2 properties from the dataAddress if they have an empty value
    const dataAddress = edcAsset.dataAddress
    if (dataAddress && typeof dataAddress === 'object') {
      for (const key of Object.keys(dataAddress)) {
        if (key.startsWith('oauth2:') && dataAddress[key] === '') {
          delete dataAddress[key]
        }
      }
    }

    return edcAsset
  }

  function smTitleToDisplay (sm: any): string {
    // If there is a specified displayName, use it
    if (sm?.displayName && Array.isArray(sm?.displayName) && sm?.displayName.length > 0) return nameToDisplay(sm)

    // Use name of SMT specification
    const smt = smts.find((smt: any) => sm?.semanticId?.keys[0]?.value === smt.semanticId)
    if (smt) return smt.name

    return nameToDisplay(sm)
  }

  function smVersionToDisplay (sm: any): string {
    // If there are administrative information use it
    if (sm.administration?.version)
      return sm.administration.version + (sm.administration.revision ? '.' + sm.administration.revision : '')

    // Use version of SMT specification
    if (sm?.semanticId?.keys[0]?.value) {
      const smt = smts.find((smt: any) => sm.semanticId.keys[0].value === smt.semanticId)
      if (smt) return smt.version
    }

    // Use version of from semanticId
    if (sm?.semanticId?.keys[0]?.value) {
      const semanticId = sm.semanticId.keys[0].value

      if (semanticId.startsWith('http') && extractVersionRevision(semanticId)) {
        return (
          extractVersionRevision(semanticId).version
          + (extractVersionRevision(semanticId).revision
            ? '.' + extractVersionRevision(semanticId).revision
            : '')
        )
      }
    }

    return ''
  }

  async function createEdcAssets (): Promise<void> {
    if (!selectedAAS.value || Object.keys(selectedAAS.value).length === 0) return

    const edcAssets = [aasEdcAsset.value, ...smEdcAssets.value]

    const results = await Promise.all(
      edcAssets.map(edcAsset => createAsset(edcAsset)),
    )

    const succeededResults = results.filter(r => r.success)
    const failedResults = results.filter(r => !r.success)
    if (updateEndpoints.value)
      for (const succeededResult of succeededResults) {
        const base64Id = succeededResult?.data?.['@id']
        const id = (base64Id && base64Id !== '' ? base64Decode(base64Id) : '')
        if (id !== '') {
          const dpsEndpoint = edcStore.getControlplaneDspEndpoint
          const aasDescriptor = await fetchAasDescriptorById(selectedAAS.value.id)
          const aasEndpoint = extractEndpointHref(aasDescriptor, 'AAS-3.0')
          if (id === selectedAAS.value.id) {
            // Add DSP endpoint to AAS descriptor
            const aasDspEndpoint = {
              interface: 'AAS-3.0',
              protocolInformation: {
                href: `${aasEndpoint}`,
                endpointProtocol: getEndpointProtocol(aasEndpoint),
                subprotocol: 'DSP',
                subprotocolBody: `id=${base64Id};dspEndpoint=${dpsEndpoint}`,
              },
            }
            aasDescriptor.endpoints.push(aasDspEndpoint)
            await putAasDescriptor(aasDescriptor)
          } else {
            // Add DSP endpoint to SM descriptor
            const smDescriptor = await fetchSmDescriptorById(id)
            const smEndpoint = extractEndpointHref(smDescriptor, 'SUBMODEL-3.0')
            const smDspEndpoint = {
              interface: 'SUBMODEL-3.0',
              protocolInformation: {
                href: `${smEndpoint}`,
                endpointProtocol: getEndpointProtocol(smEndpoint),
                subprotocol: 'DSP',
                subprotocolBody: `id=${base64Id};dspEndpoint=${dpsEndpoint}`,
              },
            }
            smDescriptor.endpoints.push(smDspEndpoint)
            await putSubmodelDescriptor(smDescriptor)

            // Add DSP endpoint to SM descriptor in AAS descriptor
            const aasDescriptorsmDescriptor = aasDescriptor.submodelDescriptors.find(
              (descriptor: any) => descriptor.id === id,
            )
            if (aasDescriptorsmDescriptor) {
              const endpoint = extractEndpointHref(aasDescriptorsmDescriptor, 'SUBMODEL-3.0')
              const dspEndpoint = {
                interface: 'SUBMODEL-3.0',
                protocolInformation: {
                  href: `${endpoint}`,
                  endpointProtocol: getEndpointProtocol(endpoint),
                  subprotocol: 'DSP',
                  subprotocolBody: `id=${base64Id};dspEndpoint=${dpsEndpoint}`,
                },
              }
              aasDescriptorsmDescriptor.endpoints.push(dspEndpoint)
              await putAasDescriptor(aasDescriptor)
            }
          }
        }
      }

    const errors = failedResults
      .map(r => r.errorMessage)
      .filter(Boolean) as string[]

    if (failedResults.length === 0) {
      navigationStore.dispatchSnackbar({
        status: true,
        timeout: 4000,
        color: 'success',
        btnColor: 'buttonText',
        text: `Successfully created ${succeededResults.length} EDC Asset${succeededResults.length === 1 ? '' : 's'}.`,
      })
      emit('assets-created', true)
      createAssetsDialog.value = false
    } else if (succeededResults.length === 0) {
      navigationStore.dispatchSnackbar({
        status: true,
        timeout: 8000,
        color: 'error',
        btnColor: 'buttonText',
        text: `Failed to create all ${failedResults.length} EDC Asset${failedResults.length === 1 ? '' : 's'}.`
          + (errors.length > 0 ? ` ${errors.join(', ')}` : ''),
      })
    } else {
      navigationStore.dispatchSnackbar({
        status: true,
        timeout: 8000,
        color: 'warning',
        btnColor: 'buttonText',
        text: `Created ${succeededResults.length} EDC Asset${succeededResults.length === 1 ? '' : 's'} successfully, ${failedResults.length} failed.`
          + (errors.length > 0 ? ` ${errors.join(', ')}` : ''),
      })
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
