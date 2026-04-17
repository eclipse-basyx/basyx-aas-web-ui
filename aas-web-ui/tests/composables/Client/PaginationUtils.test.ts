import { describe, expect, it } from 'vitest'

import { appendQueryParams, normalizeLimit, parseNextCursor } from '@/composables/Client/PaginationUtils'

describe('PaginationUtils.ts', () => {
  it('normalizes limits to positive integers', () => {
    expect(normalizeLimit(undefined)).toBeUndefined()
    expect(normalizeLimit(Number.NaN)).toBeUndefined()
    expect(normalizeLimit(0)).toBe(1)
    expect(normalizeLimit(-10)).toBe(1)
    expect(normalizeLimit(42.8)).toBe(42)
  })

  it('appends query params correctly', () => {
    const queryParams = new URLSearchParams({ limit: '100', cursor: 'abc' })

    expect(appendQueryParams('https://example.test/shells', queryParams)).toBe('https://example.test/shells?limit=100&cursor=abc')
    expect(appendQueryParams('https://example.test/shells?foo=bar', queryParams)).toBe('https://example.test/shells?foo=bar&limit=100&cursor=abc')
    expect(appendQueryParams('https://example.test/shells', new URLSearchParams())).toBe('https://example.test/shells')
  })

  it('parses cursor from supported payload shapes', () => {
    expect(parseNextCursor({ paging_metadata: { cursor: 'next-1' } })).toBe('next-1')
    expect(parseNextCursor({ pagingMetadata: { cursor: 'next-2' } })).toBe('next-2')
    expect(parseNextCursor({ nextCursor: 'next-3' })).toBe('next-3')
    expect(parseNextCursor({ next_cursor: 'next-4' })).toBe('next-4')
    expect(parseNextCursor({ cursor: 'next-5' })).toBe('next-5')
    expect(parseNextCursor({ cursor: '  ' })).toBeUndefined()
    expect(parseNextCursor({})).toBeUndefined()
  })
})
