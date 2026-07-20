<template>
  <v-layout :style="{ height: fullHeight }">

    <!-- AAS list  -->
    <v-navigation-drawer
      class="leftMenu"
      color="appNavigation"
      width="336"
    >
      <v-card
        class="d-flex flex-column"
        color="rgba(0,0,0,0)"
        elevation="0"
        style="height: 100%"
      >
        <v-card-title class="px-2 d-flex align-center">
          <v-tooltip location="bottom" open-delay="600">
            <template #activator="{ props: activatorProps }">
              <v-btn
                class="ml-n3"
                icon="mdi-reload"
                :loading="aasListLoading"
                variant="plain"
                v-bind="activatorProps"
                @click="reloadAasList()"
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

        <v-card-text
          class="pt-0 pb-0 px-2"
          style="overflow-y: auto"
          :style="{ height: fullHeightList }"
        >
          <div v-if="aasListLoading">
            <v-skeleton-loader type="list-item@6" />
          </div>

          <template v-else>
            <v-list
              v-if="aasList.length > 0"
              class="pa-0"
              density="compact"
              nav
            >
              <v-virtual-scroll
                ref="aasVirtualScrollRef"
                class="bg-card mb-2"
                :item-height="itemHeight"
                :items="aasList"
              >
                <template #default="{ item }">
                  <v-list-item
                    v-if="item && Object.keys(item).length > 0"
                    :active="aasIsSelected(item)"
                    base-color="listItem"
                    :border="aasIsSelected(item) ? 'primary' : 'listItem thin'"
                    class="mt-2 mx-0"
                    color="primarySurface"
                    style="
                      border-top: solid;
                      border-right: solid;
                      border-bottom: solid;
                      border-width: 1px;
                    "
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

                    <v-tooltip
                      activator="parent"
                      open-delay="600"
                      transition="slide-x-transition"
                    >
                      <div v-if="item.id" class="text-body-small">
                        <span class="font-weight-bold">{{ "ID: " }}</span>
                        {{ item.id }}
                      </div>

                      <div v-if="item.idShort" class="text-body-small">
                        <span class="font-weight-bold">{{ "idShort: " }}</span>
                        {{ item.idShort }}
                      </div>

                      <v-divider v-if="item.administration?.version" class="my-1" />

                      <div v-if="item.administration?.version" class="text-body-small">
                        <span class="font-weight-bold">{{ "Version: " }}</span>
                        {{
                          item.administration.version
                            + (item.administration.revision
                              ? "." + item.administration.revision
                              : "")
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
                  <v-progress-circular
                    class="mr-2"
                    indeterminate
                    size="16"
                    width="2"
                  />
                </template>

                <v-list-item-subtitle class="text-listItemText ml-1">
                  Loading more shells...
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </template>
        </v-card-text>
      </v-card>
    </v-navigation-drawer>

    <!-- Submodel list -->
    <v-navigation-drawer
      class="leftMenu"
      color="appNavigation"
      width="336"
    >
      <v-card
        class="d-flex flex-column"
        color="rgba(0,0,0,0)"
        elevation="0"
        style="height: 100%"
      >
        <v-card-title class="px-2 d-flex align-center">
          <v-text-field
            clearable
            density="compact"
            hide-details
            label="Search for Submodel..."
            :model-value="smSearchValue"
            persistent-placeholder
            :placeholder="smList.length.toString() + ' Submodels'"
            variant="outlined"
            @update:model-value="filterSubmodelList"
          />

          <v-tooltip location="bottom" open-delay="600">
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

          <v-tooltip location="bottom" open-delay="600">
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

        <v-card-text class="pt-0 pb-0 px-2 flex-grow-1" style="overflow-y: auto">
          <div v-if="smListLoading">
            <v-skeleton-loader type="list-item@6" />
          </div>

          <template v-else>
            <div
              v-if="!selectedAAS || Object.keys(selectedAAS).length === 0"
              class="d-flex align-center justify-center"
              style="height: 100%; min-height: 200px"
            >
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
                  <v-list-item
                    v-if="item && Object.keys(item).length > 0"
                    :key="item.id"
                    :active="smIsSelected(item)"
                    base-color="listItem"
                    :border="smIsSelected(item) ? 'primary' : 'listItem thin'"
                    class="mt-2 mx-0"
                    color="primarySurface"
                    style="
                      border-top: solid;
                      border-right: solid;
                      border-bottom: solid;
                      border-width: 1px;
                    "
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
                    <template #prepend="{ isSelected: smIsChecked, select: smSelect }">
                      <v-checkbox-btn
                        class="ml-n1 mr-1"
                        :model-value="smIsChecked"
                        @update:model-value="smSelect"
                      />
                    </template>

                    <v-tooltip
                      activator="parent"
                      open-delay="600"
                      transition="slide-x-transition"
                    >
                      <div v-if="item.id" class="text-body-small">
                        <span class="font-weight-bold">{{ "ID: " }}</span>
                        {{ item.id }}
                      </div>

                      <div v-if="item.idShort" class="text-body-small">
                        <span class="font-weight-bold">{{ "idShort: " }}</span>
                        {{ item.idShort }}
                      </div>

                      <div v-if="item?.semanticId?.keys[0]?.value" class="text-body-small">
                        <span class="font-weight-bold">{{ "semanticId: " }}</span>
                        {{ item.semanticId.keys[0].value }}
                      </div>

                      <v-divider v-if="item.administration?.version" class="my-1" />

                      <div v-if="item.administration?.version" class="text-body-small">
                        <span class="font-weight-bold">{{ "Version: " }}</span>
                        {{
                          item.administration.version
                            + (item.administration.revision
                              ? "." + item.administration.revision
                              : "")
                        }}
                      </div>

                      <v-divider
                        v-if="
                          item?.semanticId?.keys[0]?.value
                            && (smts.some(
                              (smt: any) =>
                                item.semanticId.keys[0].value === smt.semanticId,
                            )
                              || extractVersionRevision(item.semanticId.keys[0].value).version)
                        "
                        class="my-1"
                      />

                      <div
                        v-if="
                          smts.some(
                            (smt: any) =>
                              item?.semanticId?.keys[0]?.value === smt.semanticId,
                          )
                        "
                        class="text-body-small"
                      >
                        <span class="font-weight-bold">{{ "SMT: " }}</span>
                        {{
                          smts.find(
                            (smt: any) =>
                              item?.semanticId?.keys[0]?.value === smt.semanticId,
                          )?.name
                        }}
                      </div>

                      <div
                        v-if="
                          smts.some(
                            (smt: any) =>
                              item?.semanticId?.keys[0]?.value === smt.semanticId,
                          )
                        "
                        class="text-body-small"
                      >
                        <span class="font-weight-bold">{{ "SMT Version: " }}</span>
                        {{
                          smts.find(
                            (smt: any) =>
                              item?.semanticId?.keys[0]?.value === smt.semanticId,
                          )?.version
                        }}
                      </div>

                      <div
                        v-else-if="
                          item?.semanticId?.keys[0]?.value
                            && extractVersionRevision(item?.semanticId?.keys[0]?.value).version
                        "
                        class="text-body-small"
                      >
                        <span class="font-weight-bold">{{ "SMT Version: " }}</span>
                        {{
                          extractVersionRevision(item?.semanticId?.keys[0]?.value).version
                            + (extractVersionRevision(item?.semanticId?.keys[0]?.value).revision
                              ? "."
                                + extractVersionRevision(item?.semanticId?.keys[0]?.value).revision
                              : "")
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
                      <v-chip size="x-small">v{{ smVersionToDisplay(item) }}</v-chip>
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
                  <v-progress-circular
                    class="mr-2"
                    indeterminate
                    size="16"
                    width="2"
                  />
                </template>

                <v-list-item-subtitle class="text-listItemText ml-1">
                  Loading more shells...
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </template>
        </v-card-text>
      </v-card>
    </v-navigation-drawer>

    <!-- Data preview -->
    <v-main class="py-0">
      <v-container class="ma-0 pa-0" fluid style="height: 100%; overflow-y: auto">

        <div
          v-if="!selectedAAS || Object.keys(selectedAAS).length === 0"
          class="d-flex align-center justify-center"
          style="height: 100%"
        >
          <v-empty-state
            icon="mdi-gesture-tap"
            style="padding-top: 86px"
            text="Please select an AAS and/or SM(s) to push."
            title="Select AAS"
          >
            <template #media>
              <v-icon size="64" />
            </template>
          </v-empty-state>
        </div>

        <template v-else>
          <div class="d-flex justify-space-between align-center mt-4 mx-4 mb-2">
            <v-btn-toggle
              v-model="selectedAasSmDataToPushView"
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

            <v-checkbox
              v-if="selectedSms.length === 1"
              v-model="justPushSmData"
              class="m-0"
              density="compact"
              hide-details
              label="Just push Submodel data"
            />

            <v-list-item-title class="text-body-large pr-2 d-flex align-center">
              <v-icon class="mr-2" color="primary" icon="custom:aasIcon" size="small" />
              <span class="text-body-2 mx-1">/</span>
              <v-icon class="mr-2" color="primary" size="small">mdi-folder</v-icon>
              data to push
            </v-list-item-title>
          </div>

          <!-- JSON view -->
          <pre
            v-if="selectedAasSmDataToPushView === 'json'"
            class="json-content mt-0 mx-4 mb-4 bg-surface rounded border"
            :style="{ height: fullHeightAasSmsDataToPushJson }"
          >
            <code class="mx-5" v-html="aasSmDataToPushJsonFormatted" />
          </pre>

          <!-- Tree view -->
          <div
            v-else
            class="rounded border overflow-y-auto mx-4 mb-4 pa-4"
            :style="{ height: fullHeightAasSmsDataToPushJson, 'background-color': '#f5f5f5' }"
          >
            <JsonTreeView :data="aasSmDataToPushJsonParsed" />
          </div>
        </template>

      </v-container>
    </v-main>

  </v-layout>
</template>

<script lang="ts" setup>
  import * as Prism from 'prismjs'
  import {
    type ComponentPublicInstance,
    computed,
    ref,
    type Ref,
    watch,
  } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useTheme } from 'vuetify'
  import JsonTreeView from '@/components/UIComponents/JsonTreeView.vue'
  import { useAASHandling } from '@/composables/AAS/AASHandling'
  import {
    appendOrMergeSortedAasById,
    compareAasById,
  } from '@/composables/AAS/AASListAccumulation'
  import { useAASListPagination } from '@/composables/AAS/AASListPagination'
  import { useReferableUtils } from '@/composables/AAS/ReferableUtils'
  import { useSMHandling } from '@/composables/AAS/SMHandling'
  import { useEdcDataTransfer } from '@/pages/modules/EclipseDataspaceConnector/composables/useEdcDataTransfer'
  import { useEdcStore } from '@/pages/modules/EclipseDataspaceConnector/store/EdcStore'
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

  // Vue Router
  const route = useRoute()
  const router = useRouter()

  // Vuetify
  const theme = useTheme()

  // Stores
  const navigationStore = useNavigationStore()
  const edcStore = useEdcStore()
  const aasStore = useAASStore()

  // Props
  const props = defineProps<{
    fullHeight: string
    selectedBusinessPartner: any
    selectedCatalogDataset: any
    pushingAsset: boolean
  }>()

  // Constants
  const itemHeight = 56
  const minPageLimit = 100
  const maxPageLimit = 300
  const prefetchThresholdInRows = 8
  const pageSizeMultiplier = 3
  const scrollLoadDebounceMs = 200
  const minPageLoadIntervalMs = 350

  const jsonLanguage = getPrismJsonLanguage()

  // Emits
  const emit = defineEmits<{
    'update:aas-sm-data-to-push': [value: any]
    'update:selected-sms-count': [value: number]
    'update:pushing-asset': [value: boolean]
    'update:edc-status': [value: string]
  }>()

  const aasList = ref([] as Array<any>) as Ref<Array<any>>
  const aasLoadedIds = ref(new Set<string>())
  const aasSearchValue = ref('')
  const aasSmDataToPushJson = ref<string>('')
  const aasSmDataToPushJsonParsed = ref({} as any)
  const aasSmDataToPushJsonFormatted = ref<string>('')
  const aasVirtualScrollRef: Ref<VirtualScrollInstance | null> = ref(null)
  const allLoadedAas = ref([] as Array<any>) as Ref<Array<any>>
  const cancelled = ref(false)
  const justPushSmData = ref(false)
  const selectedAasSmDataToPushView = ref<'json' | 'tree'>('tree')
  const selectedSmIds = ref<string[]>([])
  const selectedSms = ref<any[]>([])
  const smList = ref([] as Array<any>) as Ref<Array<any>>
  const smListLoading = ref(false)
  const smListUnfiltered = ref([] as Array<any>) as Ref<Array<any>>
  const smSearchValue = ref('')
  const smVirtualScrollRef: Ref<VirtualScrollInstance | null> = ref(null)

  const fullHeightList = ref(
    `calc(${props.fullHeight} - 64px)`,
  )
  const fullHeightAasSmsDataToPushJson = ref(`calc(${props.fullHeight} - 64px - 16px)`)

  // Composables
  const { resolveEdcEndpointByCatalogDataset } = useEdcDataTransfer()
  const { fetchAasShellListPage, fetchAasById, fetchAasSmListById }
    = useAASHandling()
  const { fetchSmById } = useSMHandling()
  const { nameToDisplay, descriptionToDisplay } = useReferableUtils()
  const {
    hasMorePages,
    isLoadingInitialPage,
    pageLoading,
    resetPaginationState: resetPaginationStateInternal,
    initialize: initializeAasPagination,
  } = useAASListPagination({
    virtualScrollRef: aasVirtualScrollRef,
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
          if (!item?.id || aasLoadedIds.value.has(item.id)) return false
          aasLoadedIds.value.add(item.id)
          return true
        })
        .map(item => preprocessListItem(item))

      if (incomingItems.length > 0) {
        allLoadedAas.value = appendOrMergeSortedAasById(
          allLoadedAas.value,
          incomingItems,
        )
        applyCurrentFilter()
      }
    },
  })

  const debouncedFilterAasList = debounce(filterAasList, 300)

  // Computed
  const isEdcV0_12_1 = computed(() => edcStore.getEdcType === 'Tractus-X EDC v0.12.1')
  const primaryColor = computed(() => theme.current.value.colors.primary)
  const isDark = computed(() => theme.current.value.dark)
  const selectedAAS = computed(() => aasStore.getSelectedAAS)
  const aasListLoading = computed(() => isLoadingInitialPage.value)
  const isSearchLimited = computed(
    () => aasSearchValue.value.trim() !== '' && hasMorePages.value,
  )

  // Watchers
  watch(
    () => selectedAAS.value,
    async () => {
      applyCurrentFilter()
      scrollToSelectedAAS()
      await prepareAasData()
    },
    { deep: true },
  )

  watch(
    () => selectedSmIds.value,
    async () => {
      selectedSms.value = []
      for (const smId of selectedSmIds.value) {
        const sm = await fetchSmById(smId)
        selectedSms.value = [...selectedSms.value, sm]
      }
      emit('update:selected-sms-count', selectedSms.value.length)
      prepareAasSmDataToPushJson()
    },
  )

  watch(
    () => justPushSmData.value,
    () => {
      prepareAasSmDataToPushJson()
    },
  )

  watch(
    () => aasSmDataToPushJson.value,
    () => {
      try {
        const formatted = formatJSON(aasSmDataToPushJson.value)

        // Apply syntax highlighting using Prism
        if (Prism && Prism.highlight) {
          aasSmDataToPushJsonFormatted.value = Prism.highlight(
            formatted,
            jsonLanguage,
            'json',
          )
        } else {
          aasSmDataToPushJsonFormatted.value = formatted
          console.warn('Prism highlighting not available')
        }
      } catch (error_) {
        console.error('Error highlighting JSON:', error_)
        aasSmDataToPushJsonFormatted.value = aasSmDataToPushJson.value || ''
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
    const filteredItems
      = trimmedSearch === ''
        ? allLoadedAas.value
        : allLoadedAas.value.filter(
          item =>
            item.idLower.includes(trimmedSearch)
            || item.idShortLower.includes(trimmedSearch)
            || item.nameLower.includes(trimmedSearch)
            || item.descLower.includes(trimmedSearch),
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
    if (
      !selectedAAS.value
      || Object.keys(selectedAAS.value).length === 0
      || !selectedAAS.value.id
    ) {
      return undefined
    }

    const selectedId = selectedAAS.value.id
    const selectedLoadedItem = allLoadedAas.value.find(
      item => item?.id === selectedId,
    )
    if (selectedLoadedItem) {
      return selectedLoadedItem
    }

    const aasPathFromQuery
      = typeof route.query.aas === 'string' ? route.query.aas : ''
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

  async function reloadAasList (): Promise<void> {
    resetAASListState(true)
    await initializeAasPagination(scrollToSelectedAAS)
    await prepareAasData()
  }

  async function prepareAasData (): Promise<void> {
    if (selectedAAS.value && Object.keys(selectedAAS.value).length > 0) {
      const aas = await fetchAasById(selectedAAS.value.id)

      fetchAasSmListById(aas.id).then((submodels: Array<any>) => {
        const submodelsSorted = submodels.toSorted((smA: any, smB: any) => {
          return smTitleToDisplay(smA) + '|' + smVersionToDisplay(smA)
            > smTitleToDisplay(smB) + '|' + smVersionToDisplay(smB)
            ? 1
            : -1
        })

        smList.value = [...submodelsSorted]
        smListUnfiltered.value = [...submodelsSorted]
        prepareAasSmDataToPushJson()
      })
    } else {
      smList.value = []
      smListUnfiltered.value = []
    }
    selectedSmIds.value = []
  }

  function filterAasList (value: string | null): void {
    aasSearchValue.value = value?.trim() ?? ''
    applyCurrentFilter()
    scrollToSelectedAAS()
  }

  function filterSubmodelList (value: string): void {
    smSearchValue.value = value?.trim() ?? ''
    smList.value = !value || value.trim() === ''
      ? smListUnfiltered.value
      : smListUnfiltered.value.filter(
        (sm: any) =>
          sm.id.toLowerCase().includes(value.toLowerCase())
          || sm.idShort.toLowerCase().includes(value.toLowerCase())
          || nameToDisplay(sm).toLowerCase().includes(value.toLowerCase())
          || descriptionToDisplay(sm)
            .toLowerCase()
            .includes(value.toLowerCase()),
      )
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
      const query = structuredClone(route.query)
      if (Object.hasOwn(query, 'aas')) delete query.aas
      if (Object.hasOwn(query, 'path')) delete query.path
      router.push({ query })
    } else {
      const query = structuredClone(route.query)
      query.aas = aas.path
      if (Object.hasOwn(query, 'path')) delete query.path
      router.push({ query })
    }
  }

  function selectAllSMs (): void {
    selectedSmIds.value = smList.value.map((sm: any) => sm.id)
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

  function scrollToSelectedAAS (): void {
    const index = aasList.value.findIndex((item: any) => aasIsSelected(item))
    if (index === -1) return

    const intervalId = setInterval(() => {
      if (
        aasVirtualScrollRef.value
        && aasVirtualScrollRef.value.$el.querySelector(
          '.v-virtual-scroll__container',
        ).children.length > 0
      ) {
        aasVirtualScrollRef.value.scrollToIndex(index)
        clearInterval(intervalId)
      }
    }, 50)
  }

  function scrollToSelectedSubmodel (): void {
    const index = smList.value.findIndex((sm: any) => smIsSelected(sm))
    if (index === -1) return

    const intervalId = setInterval(() => {
      if (
        smVirtualScrollRef.value
        && smVirtualScrollRef.value.$el.querySelector(
          '.v-virtual-scroll__container',
        ).children.length > 0
      ) {
        smVirtualScrollRef.value.scrollToIndex(index)
        clearInterval(intervalId)
      }
    }, 50)
  }

  function smTitleToDisplay (sm: any): string {
    if (
      sm?.displayName
      && Array.isArray(sm?.displayName)
      && sm?.displayName.length > 0
    )
      return nameToDisplay(sm)

    const smt = smts.find(
      (smt: any) => sm?.semanticId?.keys[0]?.value === smt.semanticId,
    )
    if (smt) return smt.name

    return nameToDisplay(sm)
  }

  function smVersionToDisplay (sm: any): string {
    if (sm.administration?.version) {
      return (
        sm.administration.version
        + (sm.administration.revision
          ? '.' + sm.administration.revision
          : '')
      )
    }

    if (sm?.semanticId?.keys[0]?.value) {
      const smt = smts.find(
        (smt: any) => sm.semanticId.keys[0].value === smt.semanticId,
      )
      if (smt) return smt.version
    }

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

  function prepareAasSmDataToPushJson (): void {
    aasSmDataToPushJsonParsed.value = justPushSmData.value
      ? selectedSms.value[0]
      : {
        assetAdministrationShells: [selectedAAS.value],
        submodels: selectedSms.value,
        conceptDescriptions: [],
      }

    aasSmDataToPushJson.value = JSON.stringify(aasSmDataToPushJsonParsed.value, null, 2)

    emit('update:aas-sm-data-to-push', aasSmDataToPushJsonParsed.value)
  }

  async function initialize (): Promise<void> {
    resetAASListState(true)
    await initializeAasPagination(scrollToSelectedAAS)
    await prepareAasData()
  }

  async function pushData (): Promise<void> {
    if (!props.selectedBusinessPartner || !props.selectedCatalogDataset) return

    const usePermission = isEdcV0_12_1.value
      ? {
        action: 'use',
        constraint: [
          {
            and: [
              {
                leftOperand: 'FrameworkAgreement',
                operator: 'eq',
                rightOperand: 'DataExchangeGovernance:1.0',
              },
              {
                leftOperand: 'Membership',
                operator: 'eq',
                rightOperand: 'active',
              },
              {
                leftOperand: 'UsagePurpose',
                operator: 'isAnyOf',
                rightOperand: 'rwx.core.pushEndpoint:1',
              },
            ],
          },
        ],
      }
      : []

    const { endpoint, headers } = await resolveEdcEndpointByCatalogDataset(
      props.selectedCatalogDataset,
      props.selectedBusinessPartner,
      {
        cancelled,
        setInProgress: value => emit('update:pushing-asset', value),
        setStatus: msg => emit('update:edc-status', msg),
      },
      usePermission,
    )

    if (!endpoint) return

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(aasSmDataToPushJsonParsed.value),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      emit('update:edc-status', 'Data pushed successfully')
    } catch (error) {
      console.error('Error pushing data:', error)
      emit('update:edc-status', `Error: Failed to push data - ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      emit('update:pushing-asset', false)
    }
  }

  function cancel (): void {
    cancelled.value = true
  }

  defineExpose({ initialize, pushData, cancel, getDataToPush: () => aasSmDataToPushJsonParsed.value })
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
