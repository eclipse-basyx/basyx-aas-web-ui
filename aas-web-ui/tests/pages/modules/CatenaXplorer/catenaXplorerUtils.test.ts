import { describe, expect, it } from 'vitest'
import {
  buildShellDescriptorEndpointUrl,
  buildShellDescriptorsCurlCommand,
  buildShellDescriptorsRequestUrl,
  displayValue,
  formatDateTime,
  getAssetIdNameSuggestions,
  getDescriptorKey,
  getDescriptorLastUpdatedAt,
  getDescriptorStats,
  getSubmodelMarkerValues,
  normalizeSupplementalSemanticIds,
} from '@/pages/modules/CatenaXplorer/catenaXplorerUtils'

describe('catenaXplorerUtils.ts', () => {
  it('builds shell descriptor endpoint URLs from DTR URLs and descriptor IDs', () => {
    expect(buildShellDescriptorEndpointUrl(
      'http://localhost:5004/api/v3',
      'urn:example:aas:product-001',
    )).toBe('http://localhost:5004/api/v3/shell-descriptors/dXJuOmV4YW1wbGU6YWFzOnByb2R1Y3QtMDAx')

    expect(buildShellDescriptorEndpointUrl(
      'http://localhost:5004/api/v3/shell-descriptors',
      'urn:example:aas:product-001',
    )).toBe('http://localhost:5004/api/v3/shell-descriptors/dXJuOmV4YW1wbGU6YWFzOnByb2R1Y3QtMDAx')
  })

  it('builds an unfiltered shell descriptors request URL without asset IDs', () => {
    expect(buildShellDescriptorsRequestUrl(
      'http://localhost:5004/api/v3',
      'manufacturerPartId',
      '',
    )).toBe('http://localhost:5004/api/v3/shell-descriptors?limit=1000')
  })

  it('builds a filtered shell descriptors request URL with encoded asset IDs', () => {
    expect(buildShellDescriptorsRequestUrl(
      'http://localhost:5004/api/v3/',
      'manufacturerPartId',
      'PART-001',
    )).toBe(
      'http://localhost:5004/api/v3/shell-descriptors?limit=1000'
      + '&assetIds=eyJuYW1lIjoibWFudWZhY3R1cmVyUGFydElkIiwidmFsdWUiOiJQQVJULTAwMSJ9',
    )
  })

  it('builds a cURL command for shell descriptors', () => {
    expect(buildShellDescriptorsCurlCommand(
      'http://localhost:5004/api/v3/shell-descriptors',
      'manufacturerPartId',
      '',
    )).toBe('curl -X GET \'http://localhost:5004/api/v3/shell-descriptors?limit=1000\'')
  })

  it('extracts unique asset ID name suggestions from descriptors', () => {
    const suggestions = getAssetIdNameSuggestions([
      {
        globalAssetId: 'urn:example:asset:1',
        specificAssetIds: [
          { name: 'manufacturerPartId', value: 'PART-001' },
          { name: 'customerPartId', value: 'CUSTOMER-PART-001' },
        ],
      },
      {
        specificAssetIds: [
          { name: 'manufacturerPartId', value: 'PART-002' },
          { name: ' ', value: 'ignored' },
        ],
      },
    ])

    expect(suggestions).toEqual(['customerPartId', 'globalAssetId', 'manufacturerPartId'])
  })

  it('formats display fallbacks for sparse descriptor values', () => {
    expect(displayValue(null)).toBe('-')
    expect(displayValue('  ')).toBe('-')
    expect(displayValue('urn:example:aas:1')).toBe('urn:example:aas:1')
    expect(formatDateTime('not-a-date')).toBe('not-a-date')
    expect(getDescriptorKey({ id: 'aas-1', idShort: 'Shell' })).toBe('aas-1')
    expect(getDescriptorKey({ idShort: 'Shell' })).toBe('Shell')
  })

  it('counts descriptors only', () => {
    expect(getDescriptorStats([
      { id: 'aas-1', submodelDescriptors: [{ id: 'sm-1' }, { id: 'sm-2' }] },
      { id: 'aas-2' },
    ])).toEqual({
      descriptorCount: 2,
    })
  })

  it('extracts the best available descriptor update timestamp', () => {
    expect(getDescriptorLastUpdatedAt({
      createdAt: '2026-01-01T10:00:00Z',
      updatedAt: '2026-01-02T10:00:00Z',
    })).toBe('2026-01-02T10:00:00Z')

    expect(getDescriptorLastUpdatedAt({
      createdAt: '2026-01-01T10:00:00Z',
    })).toBe('2026-01-01T10:00:00Z')
  })

  it('normalizes plural and singular supplemental semantic IDs', () => {
    const pluralReference = {
      type: 'ExternalReference',
      keys: [{ type: 'GlobalReference', value: 'PUBLIC_READABLE' }],
    }
    const singularReference = {
      type: 'ExternalReference',
      keys: [{ type: 'GlobalReference', value: 'BPN_COMPANY_001' }],
    }

    const normalized = normalizeSupplementalSemanticIds({
      supplementalSemanticIds: [pluralReference],
      supplementalSemanticId: singularReference,
    })

    expect(normalized).toEqual([pluralReference, singularReference])
  })

  it('extracts marker values from normalized supplemental semantic IDs', () => {
    expect(getSubmodelMarkerValues({
      supplementalSemanticIds: [
        {
          keys: [
            { value: 'PUBLIC_READABLE' },
            { value: 'BPN_COMPANY_001' },
          ],
        },
      ],
      supplementalSemanticId: {
        keys: [
          { value: 'BPN_COMPANY_001' },
          { value: 'BPN_COMPANY_002' },
        ],
      },
    })).toEqual(['PUBLIC_READABLE', 'BPN_COMPANY_001', 'BPN_COMPANY_002'])
  })
})
