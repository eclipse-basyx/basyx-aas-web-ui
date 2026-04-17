import type { ComponentPublicInstance, Ref } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'

import { useAASListPagination } from '@/composables/AAS/AASListPagination'

function createVirtualScrollRef (clientHeight = 560): Ref<ComponentPublicInstance | null> {
  const root = document.createElement('div')
  root.classList.add('v-virtual-scroll')

  Object.defineProperty(root, 'clientHeight', {
    value: clientHeight,
    configurable: true,
  })

  Object.defineProperty(root, 'scrollHeight', {
    value: 2000,
    configurable: true,
    writable: true,
  })

  Object.defineProperty(root, 'scrollTop', {
    value: 0,
    configurable: true,
    writable: true,
  })

  return ref({ $el: root } as unknown as ComponentPublicInstance)
}

describe('AASListPagination.ts', () => {
  it('calculates dynamic limit and disables pagination when cursor does not advance', async () => {
    const fetchPage = vi
      .fn()
      .mockResolvedValueOnce({
        items: [],
        nextCursor: 'cursor-1',
        hasMore: true,
      })
      .mockResolvedValueOnce({
        items: [],
        nextCursor: 'cursor-1',
        hasMore: true,
      })

    const pagination = useAASListPagination({
      virtualScrollRef: createVirtualScrollRef(560),
      itemHeight: 56,
      minPageLimit: 1,
      maxPageLimit: 300,
      pageSizeMultiplier: 3,
      prefetchThresholdInRows: 8,
      scrollLoadDebounceMs: 50,
      minPageLoadIntervalMs: 0,
      fetchPage,
      onPageItems: vi.fn(),
    })

    await pagination.fetchNextPage()
    await pagination.fetchNextPage()

    expect(fetchPage).toHaveBeenNthCalledWith(1, {
      limit: 30,
      cursor: undefined,
      source: undefined,
    })
    expect(fetchPage).toHaveBeenNthCalledWith(2, {
      limit: 30,
      cursor: 'cursor-1',
      source: undefined,
    })
    expect(pagination.hasMorePages.value).toBe(false)
  })

  it('preserves previously selected source when a later page omits source', async () => {
    const fetchPage = vi
      .fn()
      .mockResolvedValueOnce({
        items: [],
        nextCursor: 'cursor-1',
        hasMore: true,
        source: 'registry',
      })
      .mockResolvedValueOnce({
        items: [],
        nextCursor: 'cursor-2',
        hasMore: true,
      })
      .mockResolvedValueOnce({
        items: [],
        nextCursor: undefined,
        hasMore: false,
      })

    const pagination = useAASListPagination({
      virtualScrollRef: createVirtualScrollRef(560),
      itemHeight: 56,
      minPageLimit: 1,
      maxPageLimit: 300,
      pageSizeMultiplier: 3,
      prefetchThresholdInRows: 8,
      scrollLoadDebounceMs: 50,
      minPageLoadIntervalMs: 0,
      fetchPage,
      onPageItems: vi.fn(),
    })

    await pagination.fetchNextPage()
    await pagination.fetchNextPage()
    await pagination.fetchNextPage()

    expect(fetchPage).toHaveBeenNthCalledWith(1, {
      limit: 30,
      cursor: undefined,
      source: undefined,
    })
    expect(fetchPage).toHaveBeenNthCalledWith(2, {
      limit: 30,
      cursor: 'cursor-1',
      source: 'registry',
    })
    expect(fetchPage).toHaveBeenNthCalledWith(3, {
      limit: 30,
      cursor: 'cursor-2',
      source: 'registry',
    })
  })

  it('ignores stale in-flight page results after generation invalidation', async () => {
    let resolvePage: (value: { items: Array<any>, nextCursor?: string, hasMore: boolean }) => void
    const fetchPage = vi.fn().mockImplementation(
      () => new Promise(resolve => {
        resolvePage = resolve
      }),
    )
    const onPageItems = vi.fn()

    const pagination = useAASListPagination({
      virtualScrollRef: createVirtualScrollRef(560),
      itemHeight: 56,
      minPageLimit: 1,
      maxPageLimit: 300,
      pageSizeMultiplier: 3,
      prefetchThresholdInRows: 8,
      scrollLoadDebounceMs: 50,
      minPageLoadIntervalMs: 0,
      fetchPage,
      onPageItems,
    })

    const inFlightFetch = pagination.fetchNextPage()
    pagination.invalidatePaginationGeneration()

    resolvePage!({
      items: [{ id: 'aas-1' }],
      nextCursor: 'stale-cursor',
      hasMore: true,
    })

    await inFlightFetch

    expect(onPageItems).not.toHaveBeenCalled()
    expect(pagination.pageLoading.value).toBe(false)
  })

  it('clears initial loading flag when invalidation happens during initialize', async () => {
    let resolvePage: (value: { items: Array<any>, nextCursor?: string, hasMore: boolean }) => void
    const fetchPage = vi.fn().mockImplementation(
      () => new Promise(resolve => {
        resolvePage = resolve
      }),
    )

    const pagination = useAASListPagination({
      virtualScrollRef: createVirtualScrollRef(560),
      itemHeight: 56,
      minPageLimit: 1,
      maxPageLimit: 300,
      pageSizeMultiplier: 3,
      prefetchThresholdInRows: 8,
      scrollLoadDebounceMs: 50,
      minPageLoadIntervalMs: 0,
      fetchPage,
      onPageItems: vi.fn(),
    })

    const initializePromise = pagination.initialize()
    expect(pagination.isLoadingInitialPage.value).toBe(true)

    pagination.invalidatePaginationGeneration()
    expect(pagination.isLoadingInitialPage.value).toBe(false)

    resolvePage!({
      items: [],
      nextCursor: undefined,
      hasMore: false,
    })

    await initializePromise
    expect(pagination.isLoadingInitialPage.value).toBe(false)
  })

  it('initializes first page and invokes completion callback', async () => {
    const fetchPage = vi.fn().mockResolvedValue({
      items: [{ id: 'aas-1' }],
      nextCursor: undefined,
      hasMore: false,
    })
    const onPageItems = vi.fn()
    const afterInitialPageLoaded = vi.fn()

    const pagination = useAASListPagination({
      virtualScrollRef: createVirtualScrollRef(560),
      itemHeight: 56,
      minPageLimit: 1,
      maxPageLimit: 300,
      pageSizeMultiplier: 3,
      prefetchThresholdInRows: 8,
      scrollLoadDebounceMs: 50,
      minPageLoadIntervalMs: 0,
      fetchPage,
      onPageItems,
    })

    await pagination.initialize(afterInitialPageLoaded)
    await nextTick()

    expect(fetchPage).toHaveBeenCalledTimes(1)
    expect(onPageItems).toHaveBeenCalledWith([{ id: 'aas-1' }])
    expect(afterInitialPageLoaded).toHaveBeenCalledTimes(1)
    expect(pagination.isLoadingInitialPage.value).toBe(false)
    expect(pagination.pageLoading.value).toBe(false)
  })

  it('resolves nested virtual scroll container from wrapper root', () => {
    const wrapper = document.createElement('div')
    const nestedContainer = document.createElement('div')
    nestedContainer.classList.add('v-virtual-scroll')
    wrapper.append(nestedContainer)

    const pagination = useAASListPagination({
      virtualScrollRef: ref({ $el: wrapper } as unknown as ComponentPublicInstance),
      itemHeight: 56,
      minPageLimit: 1,
      maxPageLimit: 300,
      pageSizeMultiplier: 3,
      prefetchThresholdInRows: 8,
      scrollLoadDebounceMs: 50,
      minPageLoadIntervalMs: 0,
      fetchPage: vi.fn().mockResolvedValue({ items: [], hasMore: false }),
      onPageItems: vi.fn(),
    })

    expect(pagination.getVirtualScrollContainer()).toBe(nestedContainer)
  })
})
