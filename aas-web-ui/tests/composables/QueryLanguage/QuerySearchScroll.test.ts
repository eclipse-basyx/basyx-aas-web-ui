import { describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { useQuerySearchScroll } from '@/composables/QueryLanguage/QuerySearchScroll'

function createScrollContainer (scrollTop: number): HTMLElement {
  const container = document.createElement('div')
  Object.defineProperty(container, 'scrollHeight', { value: 1000 })
  Object.defineProperty(container, 'clientHeight', { value: 200 })
  container.scrollTop = scrollTop
  return container
}

function setup (container: HTMLElement) {
  const querySearch = {
    activeMode: ref<'quick' | undefined>('quick'),
    hasMore: ref(true),
    loadingMore: ref(false),
    failed: ref(false),
    loadMore: vi.fn(async () => true),
  }
  const options = {
    querySearch,
    getScrollContainer: () => container,
    prefetchDistance: 100,
    stopPagination: vi.fn(),
    syncItems: vi.fn(),
  }
  return { querySearch, options, ...useQuerySearchScroll(options) }
}

describe('useQuerySearchScroll', () => {
  it('shows the query results and loads the next page when scrolled near the end', async () => {
    const container = createScrollContainer(0)
    const { querySearch, options, activateQueryResults } = setup(container)

    activateQueryResults()
    expect(options.stopPagination).toHaveBeenCalledOnce()
    expect(options.syncItems).toHaveBeenCalledOnce()
    await nextTick()

    container.dispatchEvent(new Event('scroll'))
    expect(querySearch.loadMore).not.toHaveBeenCalled()

    container.scrollTop = 750
    container.dispatchEvent(new Event('scroll'))
    await vi.waitFor(() => expect(options.syncItems).toHaveBeenCalledTimes(2))
    expect(querySearch.loadMore).toHaveBeenCalledOnce()
  })

  it('stops loading pages when the listener is unbound', async () => {
    const container = createScrollContainer(750)
    const { querySearch, activateQueryResults, unbindQueryScrollListener } = setup(container)

    activateQueryResults()
    await nextTick()
    unbindQueryScrollListener()

    container.dispatchEvent(new Event('scroll'))
    expect(querySearch.loadMore).not.toHaveBeenCalled()
  })

  it('retries a failed page', async () => {
    const { querySearch, options, retryQueryPage } = setup(createScrollContainer(0))
    querySearch.failed.value = true

    retryQueryPage()
    expect(querySearch.failed.value).toBe(false)
    await vi.waitFor(() => expect(options.syncItems).toHaveBeenCalledOnce())
  })
})
