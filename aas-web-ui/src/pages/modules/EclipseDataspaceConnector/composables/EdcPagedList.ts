import type { CatenaXEdcFailure } from '@/composables/Client/CatenaXEdcClient'
import type { EdcListPage, EdcPageResult } from '@/pages/modules/EclipseDataspaceConnector/composables/EdcPaging'
import type { ComponentPublicInstance, Ref } from 'vue'
import { useAASListPagination } from '@/composables/AAS/AASListPagination'

export const EDC_LIST_ITEM_HEIGHT = 56

/**
 * A list of EDC resources or catalog datasets in a `v-virtual-scroll`, loading the next page when scrolling near its end.
 * The cursor of a page is the offset of the next one.
 */
export function useEdcPagedList<T> (options: {
  virtualScrollRef: Ref<ComponentPublicInstance | null>
  queryPage: (page: Omit<EdcListPage, 'search'>) => Promise<EdcPageResult<T>>
  onFailure: (failure: CatenaXEdcFailure) => void
}) {
  const items = ref([]) as Ref<T[]>
  const requestFailed = ref(false)
  let reloadCount = 0 // A reload replaced by a newer one or by `clear` reports that it is outdated

  const { isLoadingInitialPage, pageLoading, initialize, invalidatePaginationGeneration, unbindVirtualScrollListener } = useAASListPagination<T>({
    virtualScrollRef: options.virtualScrollRef,
    itemHeight: EDC_LIST_ITEM_HEIGHT,
    minPageLimit: 50,
    maxPageLimit: 200,
    pageSizeMultiplier: 3,
    prefetchThresholdInRows: 8,
    scrollLoadDebounceMs: 200,
    minPageLoadIntervalMs: 350,
    fetchPage: async ({ limit, cursor }) => {
      const offset = Number(cursor ?? 0)
      const result = await options.queryPage({ offset, limit })
      if (!result.success) {
        requestFailed.value = true
        options.onFailure(result)
        return { items: [], hasMore: false }
      }

      const hasMore = result.hasMore ?? result.data.length >= limit
      return { items: result.data, hasMore, nextCursor: String(offset + result.data.length) }
    },
    onPageItems: pageItems => {
      items.value.push(...pageItems)
    },
  })

  onBeforeUnmount(() => {
    unbindVirtualScrollListener()
  })

  /**
   * Loads the first page again. Resolves to `false` if a newer reload or `clear` replaced this one.
   */
  async function reload (): Promise<boolean> {
    const current = ++reloadCount
    items.value = []
    requestFailed.value = false
    await initialize()
    return current === reloadCount
  }

  /**
   * Empties the list and drops the pages still loading, e.g. when no list can be requested.
   */
  function clear (): void {
    reloadCount++
    invalidatePaginationGeneration()
    items.value = []
    requestFailed.value = false
  }

  return { items, listLoading: isLoadingInitialPage, pageLoading, requestFailed, reload, clear }
}
