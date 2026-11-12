import { describe, expect, it } from 'vitest'
import { normalizeEndpointUrl } from '@/utils/url'

describe('normalizeEndpointUrl', () => {
  it.each([
    ['  https://example.com/shells///  ', 'https://example.com/shells'],
    ['/api/shells/', '/api/shells'],
    ['https://example.com', 'https://example.com'],
    [' '.repeat(3), ''],
    [undefined, ''],
  ])('normalizes %j to %j', (input, expected) => {
    expect(normalizeEndpointUrl(input)).toBe(expected)
  })
})
