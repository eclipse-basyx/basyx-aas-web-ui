import type { useQuerySearch } from '@/composables/QueryLanguage/QuerySearch'

interface UseQuerySearchScrollOptions {
  querySearch: Pick<ReturnType<typeof useQuerySearch<any>>, 'activeMode' | 'hasMore' | 'loadingMore' | 'failed' | 'loadMore'>
  getScrollContainer: () => HTMLElement | null
  prefetchDistance: number // Distance in px from the end of the list that loads the next page
  stopPagination: () => void // Stops paging the complete list while the query results are shown
  syncItems: () => void // Shows the loaded query results in the list
}

/**
 * Pages the results of a query search in a list: loads the next page when the list is scrolled near its end.
 */
export function useQuerySearchScroll (options: UseQuerySearchScrollOptions) {
  const { querySearch } = options

  let scrollContainer: HTMLElement | null = null

  // Shows the first page of the query results instead of the complete list
  function activateQueryResults (): void {
    options.stopPagination()
    unbindQueryScrollListener()
    options.syncItems()
    void nextTick(bindQueryScrollListener)
  }

  function bindQueryScrollListener (): void {
    if (!querySearch.activeMode.value) {
      return
    }
    const container = options.getScrollContainer()
    if (!container || container === scrollContainer) {
      return
    }

    unbindQueryScrollListener()
    scrollContainer = container
    scrollContainer.addEventListener('scroll', onQueryScroll, { passive: true })
  }

  function unbindQueryScrollListener (): void {
    scrollContainer?.removeEventListener('scroll', onQueryScroll)
    scrollContainer = null
  }

  function onQueryScroll (): void {
    if (
      !scrollContainer
      || !querySearch.hasMore.value
      || querySearch.loadingMore.value
      || querySearch.failed.value
    ) {
      return
    }
    const remaining = scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight
    if (remaining > options.prefetchDistance) {
      return
    }

    void querySearch.loadMore().then(success => {
      if (success) {
        options.syncItems()
      }
    })
  }

  function retryQueryPage (): void {
    querySearch.failed.value = false
    void querySearch.loadMore().then(success => {
      if (success) {
        options.syncItems()
      }
    })
  }

  return {
    activateQueryResults,
    unbindQueryScrollListener,
    retryQueryPage,
  }
}
