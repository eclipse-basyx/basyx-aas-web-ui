<template>
  <v-card class="d-flex flex-column" color="card" elevation="0">
    <!-- Title bar -->
    <v-card-title class="px-0 py-2 d-flex align-center">
      <v-tooltip location="bottom" open-delay="600">
        <template #activator="{ props: activatorProps }">
          <v-btn
            class="ma-0"
            :disabled="!infrastructure"
            icon="mdi-reload"
            :loading="listLoading"
            variant="plain"
            v-bind="activatorProps"
            @click="clearQuerySearch"
          />
        </template>

        <span>Reload AAS List</span>
      </v-tooltip>

      <div class="flex-grow-1 pr-2">
        <QuerySearchField
          v-model="searchValue"
          :advanced-active="querySearch.activeMode.value === 'advanced'"
          :advanced-dialog-open="advancedQueryDialog"
          :infrastructure-template="infrastructureTemplate"
          label="Search AAS"
          :loading="querySearch.loading.value"
          :server-search="queryAvailable"
          :target="queryTarget"
          @advanced="openSearchDialog"
          @clear="clearQuerySearch"
          @submit="submitSearch"
        />
      </div>
    </v-card-title>

    <v-divider />

    <v-progress-linear
      v-if="(visiblePageLoading || querySearch.loading.value) && !listLoading"
      color="primary"
      height="2"
      indeterminate
    />

    <!-- AAS List (fills the remaining height, only the virtual scroll scrolls) -->
    <v-list
      bg-color="card"
      class="pa-0 d-flex flex-column flex-grow-1"
      nav
    >
      <template v-if="listLoading">
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

      <v-empty-state
        v-else-if="!infrastructure"
        icon="mdi-server-network"
        text="Select an infrastructure to load its AAS"
        title="Select AAS Infrastructure"
      >
        <template #media>
          <v-icon size="64" />
        </template>
      </v-empty-state>

      <template v-else>
        <v-empty-state
          v-if="querySearch.activeMode.value && aasList.length === 0"
          class="text-divider"
          text="No Asset Administration Shells match the active query"
          title="No matching AAS"
        />

        <v-virtual-scroll
          v-else
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
              @click="selectAas(item)"
            >
              <!-- Tooltip with idShort and id -->
              <v-tooltip activator="parent" open-delay="600" transition="slide-x-transition">
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

              <v-list-item-title class="text-primary">
                {{ nameToDisplay(item) }}
              </v-list-item-title>

              <v-list-item-subtitle class="text-listItemText">{{ item.id }}</v-list-item-subtitle>
            </v-list-item>
          </template>
        </v-virtual-scroll>

        <v-list-item v-if="isSearchLimited" class="px-4 py-1" density="compact">
          <v-list-item-subtitle class="text-listItemText">
            Searching loaded shells only. Scroll down to load more.
          </v-list-item-subtitle>
        </v-list-item>

        <v-list-item v-if="visiblePageLoading" class="px-4 py-0" density="compact">
          <template #prepend>
            <v-progress-circular class="mr-2" indeterminate size="16" width="2" />
          </template>

          <v-list-item-subtitle class="text-listItemText ml-1">Loading more shells...</v-list-item-subtitle>
        </v-list-item>

        <v-list-item
          v-if="querySearch.activeMode.value && querySearch.failed.value"
          class="justify-center px-4 py-1"
          density="compact"
        >
          <v-btn prepend-icon="mdi-reload" size="small" variant="tonal" @click="retryQueryPage">
            Retry query
          </v-btn>
        </v-list-item>
      </template>
    </v-list>

    <AdvancedQueryDialog
      v-if="queryAvailable"
      v-model="advancedQueryDialog"
      :endpoint="aasRepoUrl"
      :infrastructure-template="infrastructureTemplate"
      :loading="querySearch.loading.value"
      :mobile="false"
      :query="advancedQueryDraft"
      :target="queryTarget"
      title="Advanced AAS query"
      @execute="executeAdvancedQuery"
      @reset="resetAdvancedQueryDraft"
      @update:query="advancedQueryDraft = $event"
    />
  </v-card>
</template>

<script lang="ts" setup>
  import type { InfrastructureConfig } from '@/types/Infrastructure'
  import type { QueryLanguageQuery, QueryTarget } from '@/types/QueryLanguage'
  import type { ComponentPublicInstance, Ref } from 'vue'
  import { useTheme } from 'vuetify'
  import { appendOrMergeSortedAasById, compareAasById } from '@/composables/AAS/AASListAccumulation'
  import { useAASListPagination } from '@/composables/AAS/AASListPagination'
  import { useReferableUtils } from '@/composables/AAS/ReferableUtils'
  import { useAASRepositoryClient } from '@/composables/Client/AASRepositoryClient'
  import { useQueryLanguageClient } from '@/composables/Client/QueryLanguageClient'
  import { useQuerySearch } from '@/composables/QueryLanguage/QuerySearch'
  import { getActiveComponentUrlForTemplate } from '@/utils/InfrastructureUtils'
  import {
    buildStructuredSearchQuery,
    createQueryExample,
    parseQuerySearchExpression,
    supportsQueryProfile,
  } from '@/utils/QueryLanguageUtils'

  // Extend the ComponentPublicInstance type to include scrollToIndex
  interface VirtualScrollInstance extends ComponentPublicInstance {
    scrollToIndex: (index: number) => void
  }

  const props = defineProps<{
    infrastructure: InfrastructureConfig | null
  }>()

  const selectedAas = defineModel<any>({ default: null })

  // Composables
  const { fetchAasListPage, fetchAasRepositoryDescription, getAasEndpointById } = useAASRepositoryClient()
  const { queryPage } = useQueryLanguageClient()
  const { nameToDisplay, descriptionToDisplay } = useReferableUtils()

  // Vuetify
  const theme = useTheme()

  const itemHeight = 56
  const minPageLimit = 100
  const prefetchThresholdInRows = 8
  const queryTarget: QueryTarget = 'aas-repository' // AAS are always read from the AAS Repository

  // Data
  const aasList = ref([] as Array<any>) as Ref<Array<any>> // Currently displayed AAS
  const allLoadedAas = ref([] as Array<any>) as Ref<Array<any>> // All loaded AAS
  const loadedIds = new Set<string>()
  const searchValue = ref('')
  const queryAvailable = ref(false) // Whether the AAS Repository supports the AAS Query Language
  const advancedQueryDialog = ref(false)
  const advancedQueryDraft = ref('')
  const virtualScrollRef: Ref<VirtualScrollInstance | null> = ref(null)
  let queryScrollContainer: HTMLElement | null = null

  const {
    hasMorePages,
    isLoadingInitialPage,
    pageLoading,
    getVirtualScrollContainer,
    bindVirtualScrollListener,
    unbindVirtualScrollListener,
    invalidatePaginationGeneration,
    resetPaginationState,
    initialize: initializePagination,
  } = useAASListPagination({
    virtualScrollRef,
    itemHeight,
    minPageLimit,
    maxPageLimit: 300,
    pageSizeMultiplier: 3,
    prefetchThresholdInRows,
    scrollLoadDebounceMs: 200,
    minPageLoadIntervalMs: 350,
    fetchPage: ({ limit, cursor }) => fetchAasListPage({ limit, cursor, infrastructure: props.infrastructure ?? undefined }),
    onPageItems: items => {
      const incomingItems = items
        .toSorted(compareAasById)
        .filter((item: any) => {
          if (!item?.id || loadedIds.has(item.id)) {
            return false
          }
          loadedIds.add(item.id)
          return true
        })
        .map((item: any) => preprocessListItem(item))

      if (incomingItems.length > 0) {
        allLoadedAas.value = appendOrMergeSortedAasById(allLoadedAas.value, incomingItems)
        applyCurrentFilter()
      }
    },
  })

  const querySearch = useQuerySearch<any>({
    debounceMs: 300,
    pageLimit: minPageLimit,
    getKey: item => item?.id ?? JSON.stringify(item),
    fetchPage: (query, options) =>
      queryPage<any>(aasRepoUrl.value, queryTarget, query, { ...options, infrastructure: props.infrastructure ?? undefined }),
  })

  // Computed Properties
  const isDark = computed(() => theme.global.current.value.dark)
  const primaryColor = computed(() => theme.current.value.colors.primary)
  const aasRepoUrl = computed(() => props.infrastructure ? getActiveComponentUrlForTemplate(props.infrastructure, 'AASRepo') : '')
  const infrastructureTemplate = computed(() => props.infrastructure?.template ?? 'full')
  const listLoading = computed(() => isLoadingInitialPage.value)
  const parsedSearch = computed(() => parseQuerySearchExpression(queryTarget, searchValue.value, infrastructureTemplate.value))
  const isSearchLimited = computed(() => !queryAvailable.value && searchValue.value.trim() !== '' && hasMorePages.value)
  const visiblePageLoading = computed(() => querySearch.loadingMore.value || pageLoading.value)

  // Watchers
  watch(
    () => props.infrastructure?.id,
    () => {
      selectedAas.value = null
      initialize()
    },
    { immediate: true },
  )

  watch(
    () => selectedAas.value,
    () => {
      applyCurrentFilter()
      scrollToSelectedAas()
    },
  )

  watch(
    () => listLoading.value,
    loading => {
      if (loading) {
        unbindVirtualScrollListener()
        return
      }

      void nextTick(() => {
        if (!querySearch.activeMode.value) bindVirtualScrollListener()
      })
    },
  )

  // Lifecycle Hooks
  onBeforeUnmount(() => {
    unbindVirtualScrollListener()
    unbindQueryScrollListener()
    querySearch.invalidate()
  })

  // Methods
  async function initialize (): Promise<void> {
    queryAvailable.value = false
    advancedQueryDraft.value = ''

    const infrastructure = props.infrastructure
    if (infrastructure) {
      void fetchAasRepositoryDescription(infrastructure).then(description => {
        if (props.infrastructure?.id === infrastructure.id) {
          queryAvailable.value = supportsQueryProfile(description, queryTarget)
        }
      })
    }

    await clearQuerySearch()
  }

  async function loadCompleteAasList (): Promise<void> {
    invalidatePaginationGeneration()
    aasList.value = []
    allLoadedAas.value = []
    loadedIds.clear()
    resetPaginationState(true)
    if (!props.infrastructure) return

    await initializePagination(scrollToSelectedAas)
  }

  function preprocessListItem (item: any): any {
    return {
      ...item,
      aas: item,
      endpoints: [{ protocolInformation: { href: getAasEndpointById(item.id, props.infrastructure ?? undefined) }, interface: 'AAS-3.0' }],
      idLower: item?.id?.toLowerCase() || '',
      idShortLower: item?.idShort?.toLowerCase() || '',
      nameLower: nameToDisplay(item).toLowerCase(),
      descLower: descriptionToDisplay(item).toLowerCase(),
    }
  }

  function applyCurrentFilter (): void {
    if (querySearch.activeMode.value) {
      aasList.value = withPinnedSelectedItem(allLoadedAas.value)
      return
    }

    const trimmedSearch = searchValue.value.trim().toLowerCase()
    const filteredItems = trimmedSearch === ''
      ? allLoadedAas.value
      : allLoadedAas.value.filter(
        aas =>
          aas.idLower.includes(trimmedSearch)
          || aas.idShortLower.includes(trimmedSearch)
          || aas.nameLower.includes(trimmedSearch)
          || aas.descLower.includes(trimmedSearch),
      )

    aasList.value = withPinnedSelectedItem(filteredItems)
  }

  function withPinnedSelectedItem (items: any[]): any[] {
    if (!selectedAas.value?.id) return items

    return [
      selectedAas.value,
      ...items.filter(item => item?.id !== selectedAas.value.id),
    ]
  }

  async function submitSearch (): Promise<void> {
    if (parsedSearch.value.incompleteField) return
    if (searchValue.value.trim() === '') {
      await clearQuerySearch()
      return
    }

    if (!queryAvailable.value) {
      applyCurrentFilter()
      scrollToSelectedAas()
      return
    }

    const query = buildStructuredSearchQuery(
      queryTarget,
      parsedSearch.value.text,
      parsedSearch.value.filters,
      'all',
      infrastructureTemplate.value,
    )
    if (!query) return

    const success = await querySearch.execute(query, parsedSearch.value.filters.length > 0 ? 'filters' : 'quick')
    if (success) activateQueryResults()
  }

  async function clearQuerySearch (): Promise<void> {
    searchValue.value = ''
    querySearch.clear()
    unbindQueryScrollListener()
    await loadCompleteAasList()
  }

  function openSearchDialog (): void {
    if (advancedQueryDraft.value.trim() === '') {
      const structuredQuery = buildStructuredSearchQuery(
        queryTarget,
        parsedSearch.value.text,
        parsedSearch.value.filters,
        'all',
        infrastructureTemplate.value,
      )
      advancedQueryDraft.value = structuredQuery
        ? JSON.stringify(structuredQuery, null, 2)
        : createQueryExample(queryTarget)
    }
    advancedQueryDialog.value = true
  }

  function resetAdvancedQueryDraft (): void {
    advancedQueryDraft.value = createQueryExample(queryTarget)
  }

  async function executeAdvancedQuery (query: QueryLanguageQuery): Promise<void> {
    const success = await querySearch.execute(query, 'advanced')
    if (!success) return

    searchValue.value = ''
    activateQueryResults()
    advancedQueryDialog.value = false
  }

  function syncQueryItems (): void {
    loadedIds.clear()
    for (const item of querySearch.items.value) {
      if (item?.id) loadedIds.add(item.id)
    }
    allLoadedAas.value = querySearch.items.value
      .map(item => preprocessListItem(item))
      .toSorted(compareAasById)
    applyCurrentFilter()
  }

  function activateQueryResults (): void {
    invalidatePaginationGeneration()
    unbindVirtualScrollListener()
    unbindQueryScrollListener()
    syncQueryItems()
    void nextTick(bindQueryScrollListener)
  }

  function bindQueryScrollListener (): void {
    if (!querySearch.activeMode.value) return
    const container = getVirtualScrollContainer()
    if (!container || container === queryScrollContainer) return

    unbindQueryScrollListener()
    queryScrollContainer = container
    queryScrollContainer.addEventListener('scroll', onQueryScroll, { passive: true })
  }

  function unbindQueryScrollListener (): void {
    queryScrollContainer?.removeEventListener('scroll', onQueryScroll)
    queryScrollContainer = null
  }

  function onQueryScroll (): void {
    if (
      !queryScrollContainer
      || !querySearch.hasMore.value
      || querySearch.loadingMore.value
      || querySearch.failed.value
    ) return
    const remaining = queryScrollContainer.scrollHeight - queryScrollContainer.scrollTop - queryScrollContainer.clientHeight
    if (remaining > itemHeight * prefetchThresholdInRows) return

    void querySearch.loadMore().then(success => {
      if (success) syncQueryItems()
    })
  }

  function retryQueryPage (): void {
    querySearch.failed.value = false
    void querySearch.loadMore().then(success => {
      if (success) syncQueryItems()
    })
  }

  function selectAas (aas: any): void {
    selectedAas.value = aasIsSelected(aas) ? null : aas
  }

  function aasIsSelected (aas: any): boolean {
    return !!selectedAas.value?.id && selectedAas.value.id === aas?.id
  }

  function scrollToSelectedAas (): void {
    const index = aasList.value.findIndex(aas => aasIsSelected(aas))
    if (index !== -1) {
      void nextTick(() => virtualScrollRef.value?.scrollToIndex(index))
    }
  }
</script>
