<template>
  <v-container fluid>
    <v-card border="0" class="flex-grow-1">

      <v-card-text
        class="pa-0"
        :class="mdAndDown ? 'd-flex flex-column' : 'd-flex'"
        :style="mdAndDown ? { height: listHeight } : {}"
      >
        <v-sheet
          :class="mdAndDown ? '' : 'border-e-thin rounded-s-lg'"
          :style="mdAndDown ? { height: '50%', display: 'flex', 'flex-direction': 'column' } : {}"
          :width="mdAndDown ? '100%' : 340"
        >
          <v-list-item class="pl-3">
            <v-list-item-title class="text-body-large">Select AAS to register as EDC Asset</v-list-item-title>
          </v-list-item>

          <v-divider />

          <v-card-title class="py-3">
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

          <!-- AAS List -->
          <v-list
            bg-color="card"
            class="pa-0"
            nav
            :style="{
              display: 'flex',
              'flex-direction': 'column',
              height: listHeight,
            }"
          >
            <template v-if="aasListLoading">
              <v-list-item
                v-for="i in 6"
                :key="i"
                class="px-0 py-3"
                density="compact"
                :height="48"
                nav
              >
                <v-list-item-title>
                  <v-skeleton-loader type="list-item" :width="300" />
                </v-list-item-title>

                <template #append>
                  <v-skeleton-loader type="list-item" :width="50" />
                </template>
              </v-list-item>
            </template>

            <template v-else>
              <v-virtual-scroll
                ref="virtualScrollRef"
                class="pb-2 bg-card"
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
                    class="mt-2 mx-2"
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
                        color="primary"
                        icon="custom:aasIcon"
                        rel="noopener noreferrer"
                        size="x-small"
                        style="z-index: 9000; margin-left: -4px"
                        target="_blank"
                        variant="plain"
                        @click.stop
                      />
                    </template>
                    <!-- Tooltip with idShort and id -->
                    <v-tooltip
                      v-if="!isMobile"
                      activator="parent"
                      :disabled="isMobile"
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

                    <v-list-item-subtitle class="text-listItemText">{{ item.id }}</v-list-item-subtitle>

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
            </template>
          </v-list>

        </v-sheet>

        <div
          class="d-flex flex-column"
          :class="mdAndDown ? 'border-t-thin' : 'flex-grow-1'"
          :style="mdAndDown ? { height: '50%', 'overflow-y': 'auto' } : {}"
        >
          <v-empty-state
            v-if="!selectedAAS || Object.keys(selectedAAS).length === 0"
            :class="mdAndDown ? 'py-8' : ''"
            icon="mdi-gesture-tap"
            text="Please select an AAS to register as EDC Asset."
            title="Select AAS"
          >
            <template #media>
              <v-icon size="64" />
            </template>
          </v-empty-state>

          <template v-else>
            <v-list-item class="pl-3">
              <v-list-item-title class="text-body-large">EDC Asset (of AAS)</v-list-item-title>
            </v-list-item>

            <v-list-item class="px-3 pb-3">
              <pre class="json-content"><code v-html="aasEdcAssetJsonFormatted" /></pre>
            </v-list-item>

            <v-divider />

            <v-card-text
              class="pa-0"
              :class="mdAndDown ? 'd-flex flex-column' : 'd-flex'"
              :style="mdAndDown ? { height: listHeight } : {}"
            >

              <v-sheet
                :class="mdAndDown ? '' : 'border-e-thin rounded-s-lg'"
                :style="mdAndDown ? { height: '50%', display: 'flex', 'flex-direction': 'column' } : {}"
                :width="mdAndDown ? '100%' : 680"
              >

                <v-list-item class="pl-3">
                  <v-list-item-title class="text-body-large">
                    Select SMs to register as EDC Asset (together with AAS)
                    <v-tooltip
                      location="bottom"
                      open-delay="600"
                    >
                      <template #activator="{ props }">
                        <v-btn
                          icon="mdi-checkbox-multiple-outline"
                          variant="plain"
                          v-bind="props"
                          @click="selectAllSMs()"
                        />
                      </template>

                      <span>Select all Submodels</span>
                    </v-tooltip>

                    <v-tooltip
                      location="bottom"
                      open-delay="600"
                    >
                      <template #activator="{ props }">
                        <v-btn
                          icon="mdi-checkbox-multiple-blank-outline"
                          variant="plain"
                          v-bind="props"
                          @click="deselectAllSMs()"
                        />
                      </template>

                      <span>Deselect all Submodels</span>
                    </v-tooltip>
                  </v-list-item-title>
                </v-list-item>

                <v-divider />

                <!-- SM List -->
                <v-list
                  v-if="
                    submodelList.length
                      > 0"
                  v-model:selected="selectedSmIds"
                  bg-color="card"
                  class="pa-0"
                  nav
                  select-strategy="leaf"
                  :style="{
                    display: 'flex',
                    'flex-direction': 'column',
                    height: listHeight,
                  }"
                >
                  <v-virtual-scroll
                    ref="smVirtualScrollRef"
                    class="pb-2 bg-card"
                    :item-height="itemHeight"
                    :items="submodelList"
                  >
                    <template #default="{ item }">
                      <!-- Single SM -->
                      <v-list-item
                        v-if="item && Object.keys(item).length > 0"
                        :key="item.id"
                        :active="smIsSelected(item)"
                        base-color="listItem"
                        :border="smIsSelected(item) ? 'primary' : 'listItem thin'"
                        class="mt-2 mx-2"
                        color="primarySurface"
                        style="border-width: 1px"
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
                          <v-list-item-action start>
                            <v-checkbox-btn :model-value="isSelected" @update:model-value="select" />
                          </v-list-item-action>
                        </template>

                        <!-- <template #prepend>
                          <v-chip
                            border
                            class="mr-3"
                            color="primary"
                            label
                            size="x-small"
                          >
                            {{ item.kind && item.kind === 'Template' ? 'SMT' : 'SM' }}
                          </v-chip>
                        </template> -->

                        <v-tooltip
                          v-if="!isMobile"
                          activator="parent"
                          :disabled="isMobile"
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
                          {{ smTitleToDisplay(item) }}
                        </v-list-item-title>

                        <v-list-item-subtitle class="text-listItemText">{{ item.id }}</v-list-item-subtitle>

                        <template v-if="smVersionToDisplay(item)" #append>
                          <v-chip size="x-small"> v{{ smVersionToDisplay(item) }} </v-chip>
                        </template>
                      </v-list-item>
                    </template>
                  </v-virtual-scroll>
                </v-list>

              </v-sheet>

              <div
                class="d-flex flex-column"
                :class="mdAndDown ? 'border-t-thin' : 'flex-grow-1'"
                :style="mdAndDown ? { height: '50%', 'overflow-y': 'auto' } : {}"
              >
                <v-list-item class="pl-3">
                  <v-list-item-title class="text-body-large">EDC Assets (of SMs)</v-list-item-title>
                </v-list-item>

                <v-list-item class="px-3 pb-3">
                  <pre class="json-content"><code v-html="smEdcAssetsJsonFormatted" /></pre>
                </v-list-item>
              </div>

            </v-card-text>
          </template>
        </div>
      </v-card-text>

      <v-divider />

      <v-card-actions :class="mdAndDown ? 'justify-center' : ''">
        <div v-if="!mdAndDown" style="width: 340px" />
        <v-spacer v-if="!mdAndDown" />

        <v-btn
          class="text-buttonText"
          color="success"
          :disabled="!selectedAAS || Object.keys(selectedAAS).length === 0"
          text="Register"
          variant="flat"
          @click="null"
        />

        <v-spacer v-if="!mdAndDown" />
      </v-card-actions>

    </v-card>
  </v-container>
</template>

<script lang="ts" setup>
  import Prism from 'prismjs'
  import { computed, onMounted, ref } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useDisplay, useTheme } from 'vuetify'
  import { useAASHandling } from '@/composables/AAS/AASHandling'
  import { appendOrMergeSortedAasById, compareAasById } from '@/composables/AAS/AASListAccumulation'
  import { useAASListPagination } from '@/composables/AAS/AASListPagination'
  import { useReferableUtils } from '@/composables/AAS/ReferableUtils'
  import { useSMHandling } from '@/composables/AAS/SMHandling'
  import { useAASStore } from '@/store/AASDataStore'
  import { useNavigationStore } from '@/store/NavigationStore'
  import { extractVersionRevision } from '@/utils/AAS/SemanticIdUtils'
  import { smts } from '@/utils/AAS/SubmodelTemplateUtils'
  import { debounce } from '@/utils/generalUtils'
  import { formatJSON } from '@/utils/JsonUtils'
  import { getPrismJsonLanguage } from '@/utils/prismJsonLanguage'
  import 'prismjs/themes/prism.css'

  // Extend the ComponentPublicInstance type to include scrollToIndex
  interface VirtualScrollInstance extends ComponentPublicInstance {
    scrollToIndex: (index: number) => void
  }

  defineOptions({
    inheritAttrs: false,
    moduleTitle: 'Eclipse Dataspace Connector GUI',
    isDesktopModule: true,
    isMobileModule: false,
    preserveRouteQuery: true,
  })

  // Vue Router
  const route = useRoute()
  const router = useRouter()

  // Stores
  const navigationStore = useNavigationStore()
  const aasStore = useAASStore()

  // Composables
  const { fetchAasShellListPage, fetchAndDispatchAasById, fetchAasSmListById } = useAASHandling()
  const { fetchSmById } = useSMHandling()
  const { nameToDisplay, descriptionToDisplay } = useReferableUtils()

  // Vuetify
  const theme = useTheme()
  const display = useDisplay()

  // Data
  const debouncedFilterAasList = debounce(filterAasList, 300) // Debounced function to filter the AAS List
  const itemHeight = 56
  const minPageLimit = 100
  const maxPageLimit = 300
  const prefetchThresholdInRows = 8
  const pageSizeMultiplier = 3
  const scrollLoadDebounceMs = 200
  const minPageLoadIntervalMs = 350

  const aasList = ref([] as Array<any>) as Ref<Array<any>> // Variable to store currently displayed AAS Data
  const submodelList = ref([] as Array<any>) as Ref<Array<any>> // Variable to store the SM Data

  const allLoadedAas = ref([] as Array<any>) as Ref<Array<any>> // Variable to store all loaded AAS Data

  const aasSearchValue = ref('')

  const aasLoadedIds = ref(new Set<string>())
  const aasListLoading = computed(() => isLoadingInitialPage.value) // Variable to store if the AAS List is loading

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

  const listHeight = ref('calc(100vh - 288px)')

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
  const isMobile = computed(() => navigationStore.getIsMobile) // Check if the current Device is a Mobile Device
  const isDark = computed(() => theme.global.current.value.dark) // Check if the current Theme is dark
  const primaryColor = computed(() => theme.current.value.colors.primary) // returns the primary color of the current theme

  const selectedAAS = computed(() => aasStore.getSelectedAAS) // Get the selected AAS from Store

  const mdAndDown = computed(() => display.mdAndDown.value)

  const isSearchLimited = computed(() => aasSearchValue.value.trim() !== '' && hasMorePages.value)

  onMounted(async () => {
    initialize()
  })

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
    () => selectedSmIds.value,
    async () => {
      smEdcAssets.value = []

      for (const smId of selectedSmIds.value) {
        const sm = await fetchSmById(smId)
        smEdcAssets.value = [...smEdcAssets.value, createEdcAsset(selectedAAS.value, sm)]
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

    aasWasSelected()
  }

  async function aasWasSelected (): Promise<void> {
    const aas = await fetchAndDispatchAasById(selectedAAS.value.id)

    aasEdcAsset.value = createEdcAsset(aas, null)

    fetchAasSmListById(aas.id).then((submodels: Array<any>) => {
      const submodelsSorted = submodels.toSorted((smA: any, smB: any) => {
        // Sort SMs with respect to displayed title and version
        return smTitleToDisplay(smA) + '|' + smVersionToDisplay(smA)
          > smTitleToDisplay(smB) + '|' + smVersionToDisplay(smB)
          ? 1
          : -1
      })

      submodelList.value = [...submodelsSorted]
    })

    selectedSmIds.value = []
  }

  function filterAasList (value: string | null): void {
    aasSearchValue.value = value?.trim() ?? ''
    applyCurrentFilter()
    scrollToSelectedAAS()
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

      // if (scrollToAas) scrollToSelectedAAS();
    }
    aasWasSelected()
  }

  function selectAllSMs (): void {
    selectedSmIds.value = []
    for (const sm of submodelList.value) {
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

  function createEdcAsset (aas: any, sm: any): any {
    let edcAsset = {} as any

    if (!aas || Object.keys(aas).length === 0) return edcAsset

    const identifiable = (aas && Object.keys(aas).length > 0 && sm && Object.keys(sm).length > 0) ? sm : aas

    edcAsset = { '@id': identifiable.id, 'properties': {
      name: (aas && Object.keys(aas).length > 0 && sm && Object.keys(sm).length > 0) ? nameToDisplay(aas, 'en') + ' - SM ' + nameToDisplay(sm, 'en') : nameToDisplay(identifiable, 'en'),
      description: descriptionToDisplay(identifiable, 'en'),
    }, 'dataAddress': {
      type: 'HttpData',
      baseUrl: identifiable.path,
    } }

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

</script>

<style scoped>
    :deep(.token) {
        line-height: 21px;
    }

    :deep(code) {
        line-height: 21px;
    }

    .json-content {
        margin: 0;
        padding: 16px;
        word-wrap: normal;
        font-size: 14px;
        line-height: 21px;
        flex-grow: 0;
        overflow: auto;
        min-height: 42px;
        max-height: 600px;
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
