import type { InfrastructureConfig } from '@/types/Infrastructure'
import type { QueryLanguageQuery, QueryPage, QueryTarget } from '@/types/QueryLanguage'
import { appendQueryParams, normalizeLimit, parseNextCursor } from '@/composables/Client/PaginationUtils'
import { useRequestHandling } from '@/composables/RequestHandling'
import { buildQueryEndpoint } from '@/utils/QueryLanguageUtils'

export interface QueryPageOptions {
  limit?: number
  cursor?: string
  /**
   * Infrastructure to query instead of the selected one.
   */
  infrastructure?: InfrastructureConfig
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
    const requestArgs = [
      appendQueryParams(endpoint, queryParams),
      JSON.stringify(query),
      headers,
      'executing Query Language search',
      false,
    ] as const
    const response = options.infrastructure
      ? await postRequest(...requestArgs, false, undefined, { infrastructure: options.infrastructure })
      : await postRequest(...requestArgs)

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
