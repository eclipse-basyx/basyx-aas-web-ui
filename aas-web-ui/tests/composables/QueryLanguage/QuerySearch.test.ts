import type { QueryLanguageQuery, QueryPage } from '@/types/QueryLanguage'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { effectScope } from 'vue'
import { useQuerySearch } from '@/composables/QueryLanguage/QuerySearch'

const query: QueryLanguageQuery = { $condition: { $boolean: true } }

describe('useQuerySearch', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('debounces quick searches and commits successful results', async () => {
    vi.useFakeTimers()
    const fetchPage = vi.fn(async (): Promise<QueryPage<{ id: string }>> => ({
      items: [{ id: 'one' }],
      nextCursor: 'next',
      hasMore: true,
      success: true,
    }))
    const scope = effectScope()
    const search = scope.run(() => useQuerySearch({ fetchPage, getKey: item => item.id }))!

    search.schedule(query)
    expect(fetchPage).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(300)

    expect(fetchPage).toHaveBeenCalledOnce()
    expect(search.items.value).toEqual([{ id: 'one' }])
    expect(search.activeMode.value).toBe('quick')
    expect(search.hasMore.value).toBe(true)
    scope.stop()
  })

  it('deduplicates cursor pages and keeps committed data after failure', async () => {
    const fetchPage = vi.fn()
      .mockResolvedValueOnce({ items: [{ id: 'one' }], nextCursor: 'next', hasMore: true, success: true })
      .mockResolvedValueOnce({ items: [{ id: 'one' }, { id: 'two' }], hasMore: false, success: true })
      .mockResolvedValueOnce({ items: [], hasMore: false, success: false })
    const scope = effectScope()
    const search = scope.run(() => useQuerySearch<{ id: string }>({ fetchPage, getKey: item => item.id }))!

    await search.execute(query, 'advanced')
    await search.loadMore()
    expect(search.items.value).toEqual([{ id: 'one' }, { id: 'two' }])

    await search.execute({ $condition: { $boolean: false } }, 'advanced')
    expect(search.items.value).toEqual([{ id: 'one' }, { id: 'two' }])
    expect(search.activeQuery.value).toEqual(query)
    scope.stop()
  })

  it('ignores a stale response after the search is cleared', async () => {
    let resolvePage: (page: QueryPage<{ id: string }>) => void = () => {}
    const pendingPage: Promise<QueryPage<{ id: string }>> = new Promise(resolve => {
      resolvePage = resolve
    })
    const fetchPage = vi.fn(() => pendingPage)
    const scope = effectScope()
    const search = scope.run(() => useQuerySearch<{ id: string }>({ fetchPage, getKey: item => item.id }))!

    const request = search.execute(query, 'quick')
    search.clear()
    resolvePage({ items: [{ id: 'stale' }], hasMore: false, success: true })
    await request

    expect(search.items.value).toEqual([])
    expect(search.activeMode.value).toBeUndefined()
    scope.stop()
  })
})
