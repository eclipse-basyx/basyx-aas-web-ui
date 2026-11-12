import type { BaSyxComponentKey } from '@/types/BaSyx'
import { describe, expect, it } from 'vitest'
import { isValidConnectionResponse, isValidServiceDescription } from '@/utils/ComponentConnectionUtils'

const pagedObjectComponents: BaSyxComponentKey[] = [
  'AASRepo',
  'SubmodelRepo',
  'AASRegistry',
  'SubmodelRegistry',
  'ConceptDescriptionRepo',
]

describe('isValidServiceDescription', () => {
  it('accepts advertised profiles without requiring a particular server implementation', () => {
    expect(isValidServiceDescription({ profiles: ['https://example.org/aas/profile'], extra: 'metadata' })).toBe(true)
  })

  it.each([
    undefined,
    null,
    '<html>Sign in</html>',
    new Blob(['<html>Sign in</html>'], { type: 'text/html' }),
    {},
    { profiles: 'https://example.org/aas/profile' },
    { profiles: [] },
    { profiles: [''] },
    { profiles: [' '.repeat(3)] },
    { profiles: [123] },
    { profiles: ['https://example.org/aas/profile', null] },
  ])('rejects a non-description response: %s', data => {
    expect(isValidServiceDescription(data)).toBe(false)
  })
})

describe('isValidConnectionResponse', () => {
  describe.each(pagedObjectComponents)('%s', componentKey => {
    it('accepts a paged result containing identifiable objects', () => {
      expect(isValidConnectionResponse(componentKey, {
        result: [{ id: 'https://example.org/first' }, { id: 'https://example.org/second' }],
        paging_metadata: {},
      })).toBe(true)
    })

    it('accepts an empty repository or registry', () => {
      expect(isValidConnectionResponse(componentKey, { result: [] })).toBe(true)
    })

    it.each([
      undefined,
      null,
      '<html>Sign in</html>',
      new Blob(['<html>Sign in</html>'], { type: 'text/html' }),
      [],
      {},
      { message: 'Different API' },
      { result: {} },
      { result: null },
      { result: ['https://example.org/aas'] },
      { result: [{}] },
      { result: [{ id: 123 }] },
      { result: [{ id: '' }] },
      { result: [{ id: ' '.repeat(3) }] },
      { result: [{ id: 'https://example.org/aas' }, null] },
    ])('rejects a response without a valid paged list: %s', data => {
      expect(isValidConnectionResponse(componentKey, data)).toBe(false)
    })
  })

  describe('AASDiscovery', () => {
    it('accepts a list of AAS identifiers', () => {
      expect(isValidConnectionResponse('AASDiscovery', { result: ['https://example.org/aas'] })).toBe(true)
    })

    it('accepts an empty discovery result', () => {
      expect(isValidConnectionResponse('AASDiscovery', { result: [] })).toBe(true)
    })

    it.each([
      {},
      { result: null },
      { result: 'https://example.org/aas' },
      { result: [{ id: 'https://example.org/aas' }] },
      { result: [''] },
      { result: [' '.repeat(3)] },
      { result: ['https://example.org/aas', 123] },
    ])('rejects a malformed identifier list: %s', data => {
      expect(isValidConnectionResponse('AASDiscovery', data)).toBe(false)
    })
  })

  it('preserves successful Company Lookup responses without applying an AAS schema', () => {
    expect(isValidConnectionResponse('CompanyLookup', { companies: [] })).toBe(true)
  })
})
