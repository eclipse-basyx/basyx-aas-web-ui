import { describe, expect, it } from 'vitest'
import {
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
