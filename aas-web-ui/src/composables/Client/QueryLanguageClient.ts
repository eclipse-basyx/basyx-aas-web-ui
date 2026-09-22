import type { QueryLanguageQuery, QueryPage, QueryTarget } from '@/types/QueryLanguage'
import { appendQueryParams, normalizeLimit, parseNextCursor } from '@/composables/Client/PaginationUtils'
import { useRequestHandling } from '@/composables/RequestHandling'
import { buildQueryEndpoint } from '@/utils/QueryLanguageUtils'

export interface QueryPageOptions {
  limit?: number
  cursor?: string
}

export function useQueryLanguageClient () {
  const { postRequest } = useRequestHandling()

  async function queryPage<T> (
    baseUrl: string,
    target: QueryTarget,
    query: QueryLanguageQuery,
    options: QueryPageOptions = {},
  ): Promise<QueryPage<T>> {
    const endpoint = buildQueryEndpoint(baseUrl, target)
    if (endpoint === '') {
      return { items: [], hasMore: false, success: false }
    }

    const queryParams = new URLSearchParams()
    const limit = normalizeLimit(options.limit)
    if (limit !== undefined) {
      queryParams.set('limit', String(limit))
    }
    if (options.cursor?.trim()) {
      queryParams.set('cursor', options.cursor.trim())
    }

    const headers = new Headers({ 'Content-Type': 'application/json' })
    const response = await postRequest(
      appendQueryParams(endpoint, queryParams),
      JSON.stringify(query),
      headers,
      'executing Query Language search',
      false,
    )

    if (!response?.success) {
      return { items: [], hasMore: false, success: false }
    }

    const items = Array.isArray(response.data?.result) ? response.data.result as T[] : []
    const nextCursor = parseNextCursor(response.data)
    return {
      items,
      nextCursor,
      hasMore: nextCursor !== undefined,
      success: true,
    }
  }

  return { queryPage }
}
