import { hasItems } from '@/utils/array'
import { normalizeBaseUrl } from '@/utils/url'

describe('Array Utilities (array.ts)', () => {
  describe('hasItems', () => {
    it('should return true if array contains valid elements', () => {
      expect(hasItems([1, 2, 3])).toBe(true)
      expect(hasItems(['a'])).toBe(true)
    })

    it('should return true if array contains elements alongside nullish values', () => {
      expect(hasItems([null, 'valid element', undefined])).toBe(true)
    })

    it('should return false for empty arrays', () => {
      expect(hasItems([])).toBe(false)
    })

    it('should return false if array only contains null or undefined values', () => {
      expect(hasItems([null])).toBe(false)
      expect(hasItems([undefined, null, undefined])).toBe(false)
    })

    it('should return false for null and undefined inputs', () => {
      expect(hasItems(null)).toBe(false)
      expect(hasItems(undefined)).toBe(false)
    })
  })
})

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
