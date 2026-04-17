export interface PaginationPageOptions {
  limit?: number
  cursor?: string
}

export interface PaginationPageResult<T> {
  items: Array<T>
  nextCursor?: string
  hasMore: boolean
  pagingMetadata?: Record<string, any>
}

export function normalizeLimit (limit?: number): number | undefined {
  if (typeof limit !== 'number' || Number.isNaN(limit)) {
    return undefined
  }
  return Math.max(1, Math.floor(limit))
}

export function appendQueryParams (path: string, queryParams: URLSearchParams): string {
  const query = queryParams.toString()
  if (query === '') {
    return path
  }
  return path + (path.includes('?') ? '&' : '?') + query
}

export function parseNextCursor (data: any): string | undefined {
  const rawCursor = (
    data?.paging_metadata?.cursor
    ?? data?.pagingMetadata?.cursor
    ?? data?.nextCursor
    ?? data?.next_cursor
    ?? data?.cursor
  )

  if (rawCursor === undefined || rawCursor === null) {
    return undefined
  }

  const trimmed = String(rawCursor).trim()
  return trimmed === '' ? undefined : trimmed
}
