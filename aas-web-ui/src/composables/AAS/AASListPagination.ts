import type { AasListSource } from '@/composables/AAS/AASHandling'
import type { ComponentPublicInstance, Ref } from 'vue'
import { nextTick, ref } from 'vue'
import { debounce } from '@/utils/generalUtils'

export interface AasListPagePayload {
  items: Array<any>
  nextCursor?: string
  hasMore: boolean
  source?: AasListSource
}

export interface UseAASListPaginationOptions {
  virtualScrollRef: Ref<ComponentPublicInstance | null>
  itemHeight: number
  minPageLimit: number
  maxPageLimit: number
  pageSizeMultiplier: number
  prefetchThresholdInRows: number
  scrollLoadDebounceMs: number
  minPageLoadIntervalMs: number
  fetchPage: (params: {
    limit: number
    cursor?: string
    source?: AasListSource
  }) => Promise<AasListPagePayload>
  onPageItems: (items: Array<any>) => void | Promise<void>
}

export function useAASListPagination (options: UseAASListPaginationOptions) {
  const nextCursor = ref<string | undefined>(undefined)
  const hasMorePages = ref(true)
  const activeSource = ref<AasListSource | undefined>(undefined)
  const isLoadingInitialPage = ref(false)
  const pageLoading = ref(false)
  const paginationGeneration = ref(0)
  const lastPageLoadAt = ref(0)

  let scrollContainerEl: HTMLElement | null = null

  function getVirtualScrollContainer (): HTMLElement | null {
    const rootEl = options.virtualScrollRef.value?.$el
    if (!rootEl) {
      return null
    }

    if (rootEl instanceof HTMLElement && rootEl.classList.contains('v-virtual-scroll')) {
      return rootEl
    }

    if (rootEl instanceof HTMLElement) {
      const nestedContainer = rootEl.querySelector('.v-virtual-scroll')
      return nestedContainer instanceof HTMLElement ? nestedContainer : null
    }

    return null
  }

  function getDynamicLimit (): number {
    const container = getVirtualScrollContainer()
    const viewportHeight = container?.clientHeight ?? 0
    const visibleRows = Math.max(1, Math.ceil(viewportHeight / options.itemHeight))
    const calculatedLimit = visibleRows * options.pageSizeMultiplier
    return Math.min(options.maxPageLimit, Math.max(options.minPageLimit, calculatedLimit))
  }

  function unbindVirtualScrollListener (): void {
    if (scrollContainerEl) {
      scrollContainerEl.removeEventListener('scroll', onVirtualScroll)
      scrollContainerEl = null
    }
  }

  function bindVirtualScrollListener (): void {
    const container = getVirtualScrollContainer()
    if (!container || container === scrollContainerEl) {
      return
    }

    unbindVirtualScrollListener()
    scrollContainerEl = container
    scrollContainerEl.addEventListener('scroll', onVirtualScroll, { passive: true })
  }

  async function fetchNextPage (): Promise<void> {
    const expectedGeneration = paginationGeneration.value

    if (!hasMorePages.value || pageLoading.value) {
      return
    }

    lastPageLoadAt.value = Date.now()
    pageLoading.value = true

    try {
      const previousCursor = nextCursor.value
      const page = await options.fetchPage({
        limit: getDynamicLimit(),
        cursor: nextCursor.value,
        source: activeSource.value,
      })

      if (expectedGeneration !== paginationGeneration.value) {
        return
      }

      activeSource.value = page.source
      nextCursor.value = page.nextCursor
      hasMorePages.value = page.hasMore

      if (page.hasMore && page.nextCursor === previousCursor) {
        hasMorePages.value = false
      }

      if (Array.isArray(page.items) && page.items.length > 0) {
        await options.onPageItems(page.items)
      }
    } finally {
      if (expectedGeneration === paginationGeneration.value) {
        pageLoading.value = false
      }
    }
  }

  async function tryLoadNextPageIfNeeded (): Promise<void> {
    if (!hasMorePages.value || pageLoading.value || isLoadingInitialPage.value) {
      return
    }

    const now = Date.now()
    if (now - lastPageLoadAt.value < options.minPageLoadIntervalMs) {
      return
    }

    const container = getVirtualScrollContainer()
    if (!container) {
      return
    }

    const remainingDistance = container.scrollHeight - container.scrollTop - container.clientHeight
    if (remainingDistance <= options.itemHeight * options.prefetchThresholdInRows) {
      await fetchNextPage()
    }
  }

  const debouncedTryLoadNextPageIfNeeded = debounce(() => {
    void tryLoadNextPageIfNeeded()
  }, options.scrollLoadDebounceMs)

  function onVirtualScroll (): void {
    debouncedTryLoadNextPageIfNeeded()
  }

  function beginPaginationGeneration (): number {
    paginationGeneration.value += 1
    return paginationGeneration.value
  }

  function invalidatePaginationGeneration (): void {
    paginationGeneration.value += 1
  }

  function resetPaginationState (enablePagination = true): void {
    nextCursor.value = undefined
    hasMorePages.value = enablePagination
    activeSource.value = undefined
    isLoadingInitialPage.value = false
    pageLoading.value = false
  }

  async function initialize (afterInitialPageLoaded?: () => void): Promise<void> {
    const generation = beginPaginationGeneration()
    resetPaginationState(true)
    isLoadingInitialPage.value = true

    try {
      await fetchNextPage()

      if (generation !== paginationGeneration.value) {
        return
      }

      afterInitialPageLoaded?.()
    } finally {
      if (generation === paginationGeneration.value) {
        isLoadingInitialPage.value = false

        void nextTick(() => {
          bindVirtualScrollListener()
        })
      }
    }
  }

  return {
    hasMorePages,
    activeSource,
    isLoadingInitialPage,
    pageLoading,
    paginationGeneration,
    getVirtualScrollContainer,
    bindVirtualScrollListener,
    unbindVirtualScrollListener,
    invalidatePaginationGeneration,
    resetPaginationState,
    fetchNextPage,
    initialize,
  }
}
