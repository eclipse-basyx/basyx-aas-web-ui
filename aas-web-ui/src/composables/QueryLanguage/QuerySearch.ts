import type { QueryLanguageQuery, QueryPage, QuerySearchMode } from '@/types/QueryLanguage'
import type { Ref } from 'vue'

interface UseQuerySearchOptions<T> {
  debounceMs?: number
  pageLimit?: number
  fetchPage: (query: QueryLanguageQuery, options: { limit: number, cursor?: string }) => Promise<QueryPage<T>>
  getKey: (item: T) => string
}

export function useQuerySearch<T> (options: UseQuerySearchOptions<T>) {
  const items = ref<T[]>([]) as Ref<T[]>
  const activeQuery = ref<QueryLanguageQuery>()
  const activeMode = ref<QuerySearchMode>()
  const nextCursor = ref<string>()
  const hasMore = ref(false)
  const loading = ref(false)
  const loadingMore = ref(false)
  const failed = ref(false)
  const generation = ref(0)

  let debounceTimer: ReturnType<typeof setTimeout> | undefined

  async function execute (query: QueryLanguageQuery, mode: QuerySearchMode): Promise<boolean> {
    cancelScheduled()
    const requestGeneration = ++generation.value
    loading.value = true
    loadingMore.value = false
    failed.value = false

    try {
      const page = await options.fetchPage(query, { limit: options.pageLimit ?? 100 })
      if (requestGeneration !== generation.value) {
        return false
      }
      if (!page.success) {
        return false
      }

      items.value = deduplicate(page.items)
      activeQuery.value = query
      activeMode.value = mode
      nextCursor.value = page.nextCursor
      hasMore.value = page.hasMore
      return true
    } finally {
      if (requestGeneration === generation.value) {
        loading.value = false
      }
    }
  }

  function schedule (
    query: QueryLanguageQuery,
    mode: QuerySearchMode = 'quick',
    onComplete?: (success: boolean) => void,
  ): void {
    cancelScheduled()
    generation.value += 1
    loading.value = false
    loadingMore.value = false
    failed.value = false
    debounceTimer = setTimeout(() => {
      debounceTimer = undefined
      void execute(query, mode).then(success => onComplete?.(success))
    }, options.debounceMs ?? 300)
  }

  async function loadMore (): Promise<boolean> {
    if (!activeQuery.value || !hasMore.value || loading.value || loadingMore.value) {
      return false
    }

    const requestGeneration = generation.value
    const cursor = nextCursor.value
    loadingMore.value = true
    failed.value = false
    try {
      const page = await options.fetchPage(activeQuery.value, {
        limit: options.pageLimit ?? 100,
        cursor,
      })
      if (requestGeneration !== generation.value) {
        return false
      }
      if (!page.success) {
        failed.value = true
        return false
      }

      items.value = deduplicate([...items.value, ...page.items])
      nextCursor.value = page.nextCursor
      hasMore.value = page.hasMore && page.nextCursor !== cursor
      return true
    } finally {
      if (requestGeneration === generation.value) {
        loadingMore.value = false
      }
    }
  }

  function clear (): void {
    cancelScheduled()
    generation.value += 1
    items.value = []
    activeQuery.value = undefined
    activeMode.value = undefined
    nextCursor.value = undefined
    hasMore.value = false
    loading.value = false
    loadingMore.value = false
    failed.value = false
  }

  function invalidate (): void {
    clear()
  }

  function cancelScheduled (): void {
    if (debounceTimer !== undefined) {
      clearTimeout(debounceTimer)
      debounceTimer = undefined
    }
  }

  function deduplicate (values: T[]): T[] {
    const seen = new Set<string>()
    return values.filter(value => {
      const key = options.getKey(value)
      if (seen.has(key)) {
        return false
      }
      seen.add(key)
      return true
    })
  }

  onBeforeUnmount(cancelScheduled)

  return {
    items,
    activeQuery,
    activeMode,
    hasMore,
    loading,
    loadingMore,
    failed,
    execute,
    schedule,
    loadMore,
    clear,
    invalidate,
  }
}
