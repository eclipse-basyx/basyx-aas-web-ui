import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { hasItems } from './array'
import { validateURL } from './url'
import { zodRule } from './zodRule'

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
  describe('validateURL', () => {
    it('should return true for valid HTTP and HTTPS URLs', () => {
      expect(validateURL('https://fraunhofer.de')).toBe(true)
      expect(validateURL('https://iese.fraunhofer.de/submodel')).toBe(true)
    })

    it('should return true for localhost variants', () => {
      expect(validateURL('http://localhost')).toBe(true)
      expect(validateURL('https://localhost:8080/api')).toBe(true)
    })

    it('should return false for invalid formats, missing protocols, or non-http protocols', () => {
      expect(validateURL('ftp://fraunhofer.de')).toBe(false)
      expect(validateURL('not-a-url')).toBe(false)
      expect(validateURL('https//missing-colon.com')).toBe(false)
    })

    it('should return false for nullish, empty or space-only text values', () => {
      expect(validateURL(undefined)).toBe(false)
      expect(validateURL('')).toBe(false)
      expect(validateURL(' '.repeat(4))).toBe(false)
    })
  })
})

describe('Vuetify Validation Rules Utility (zodRule.ts)', () => {
  it('should return true when value satisfies the Zod schema validation rules', () => {
    const stringSchema = z.string().min(3)
    const rule = zodRule(stringSchema)

    expect(rule('valid text')).toBe(true)
  })

  it('should return the custom validation message from the Zod issue on verification failure', () => {
    const customErrorMessage = 'Domain string shorthand reference is required'
    const domainSchema = z.string().trim().min(1, customErrorMessage)
    const rule = zodRule(domainSchema)

    expect(rule(' '.repeat(3))).toBe(customErrorMessage)
    expect(rule('')).toBe(customErrorMessage)
  })

  it('should return a generic "Invalid value" message if Zod issue lacks an explicit string text mapping', () => {
    const basicSchema = z.string().url()
    const rule = zodRule(basicSchema)

    // Falls back to Zod's default message if none specified, or utility fallback if missing entirely
    const result = rule('not-a-url')
    expect(typeof result).toBe('string')
    expect(result).not.toBe(true)
  })
})
