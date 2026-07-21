import { describe, expect, it } from 'vitest'
import { normalizeBaseUrl } from './url'

describe('URL Utilities (url.ts)', () => {
  describe('normalizeBaseUrl', () => {
    const endpoint = '/companies'

    it('should return undefined if input string is empty or whitespace', () => {
      expect(normalizeBaseUrl('', endpoint)).toBeUndefined()
      expect(normalizeBaseUrl(' '.repeat(3), endpoint)).toBeUndefined()
    })

    it('should append the endpoint if missing from base url', () => {
      expect(normalizeBaseUrl('https://example.com', endpoint))
        .toBe('https://example.com/companies')
    })

    it('should strip trailing slash before appending endpoint', () => {
      expect(normalizeBaseUrl('https://example.com/', endpoint))
        .toBe('https://example.com/companies')
    })

    it('should return original string if endpoint is already present', () => {
      expect(normalizeBaseUrl('https://example.com/companies', endpoint))
        .toBe('https://example.com/companies')
    })
  })
})
