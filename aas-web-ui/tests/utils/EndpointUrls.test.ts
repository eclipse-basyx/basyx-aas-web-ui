import { describe, expect, it } from 'vitest'
import { base64Encode } from '@/utils/EncodeDecodeUtils'
import {
  AAS_DISCOVERY_ENDPOINT_PATH,
  AAS_REPOSITORY_ENDPOINT_PATH,
  endpointUrl,
  resourceUrl,
} from '@/utils/EndpointUrls'

describe('EndpointUrls', () => {
  describe('endpointUrl', () => {
    it.each([
      ['https://repo.test', 'https://repo.test/shells'],
      ['https://repo.test/', 'https://repo.test/shells'],
      ['https://repo.test/shells', 'https://repo.test/shells'],
      ['https://repo.test/shells/', 'https://repo.test/shells'],
      ['  https://repo.test/shells/  ', 'https://repo.test/shells'],
      ['https://repo.test/api', 'https://repo.test/api/shells'],
      ['', ''],
      [' '.repeat(3), ''],
    ])('returns the endpoint of %j', (baseUrl, expected) => {
      expect(endpointUrl(baseUrl, AAS_REPOSITORY_ENDPOINT_PATH)).toBe(expected)
    })

    it('appends endpoint paths with several segments', () => {
      expect(endpointUrl('https://discovery.test/', AAS_DISCOVERY_ENDPOINT_PATH)).toBe('https://discovery.test/lookup/shells')
      expect(endpointUrl('https://discovery.test/lookup/shells', AAS_DISCOVERY_ENDPOINT_PATH)).toBe('https://discovery.test/lookup/shells')
    })

    it('returns no endpoint without a base URL', () => {
      expect(endpointUrl(undefined as unknown as string, AAS_REPOSITORY_ENDPOINT_PATH)).toBe('')
    })
  })

  describe('resourceUrl', () => {
    it('returns the URL of a resource with its Base64 encoded ID', () => {
      expect(resourceUrl('https://repo.test/', AAS_REPOSITORY_ENDPOINT_PATH, 'urn:aas:1'))
        .toBe(`https://repo.test/shells/${base64Encode('urn:aas:1')}`)
    })

    it('trims the ID before encoding it', () => {
      expect(resourceUrl('https://repo.test', AAS_REPOSITORY_ENDPOINT_PATH, ' urn:aas:1 '))
        .toBe(`https://repo.test/shells/${base64Encode('urn:aas:1')}`)
    })

    it('appends the resource to a base URL that ends in the endpoint path', () => {
      expect(resourceUrl('https://repo.test/shells', AAS_REPOSITORY_ENDPOINT_PATH, 'urn:aas:1'))
        .toBe(`https://repo.test/shells/${base64Encode('urn:aas:1')}`)
    })

    it.each([
      ['https://repo.test', ''],
      ['https://repo.test', ' '.repeat(3)],
      ['https://repo.test', undefined as unknown as string],
      ['', 'urn:aas:1'],
      [' '.repeat(3), 'urn:aas:1'],
    ])('returns no URL for base URL %j and ID %j', (baseUrl, id) => {
      expect(resourceUrl(baseUrl, AAS_REPOSITORY_ENDPOINT_PATH, id)).toBe('')
    })
  })
})
