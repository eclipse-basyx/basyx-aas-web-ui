import { describe, expect, it } from 'vitest'
import {
  buildAssetIdNameSuggestions,
  buildEdcShellDescriptorsCurlCommand,
  buildShellDescriptorEndpointUrl,
  buildShellDescriptorsCurlCommand,
  buildShellDescriptorsRequestUrl,
  displayValue,
  formatDateTime,
  getAssetIdNameSuggestions,
  getDescriptorKey,
  getDescriptorLastUpdatedAt,
  getDescriptorStats,
  getDescriptorTimestampInfo,
  getSpecificAssetIdNameSuggestions,
  getSubmodelEdcEndpointInfo,
  getSubmodelMarkerValues,
  normalizeSupplementalSemanticIds,
  parseSubprotocolBody,
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
    )).toBe('http://localhost:5004/api/v3/shell-descriptors?limit=100')
  })

  it('builds a filtered shell descriptors request URL with encoded asset IDs', () => {
    expect(buildShellDescriptorsRequestUrl(
      'http://localhost:5004/api/v3/',
      'manufacturerPartId',
      'PART-001',
    )).toBe(
      'http://localhost:5004/api/v3/shell-descriptors?limit=100'
      + '&assetIds=eyJuYW1lIjoibWFudWZhY3R1cmVyUGFydElkIiwidmFsdWUiOiJQQVJULTAwMSJ9',
    )
  })

  it('builds a cURL command for shell descriptors', () => {
    expect(buildShellDescriptorsCurlCommand(
      'http://localhost:5004/api/v3/shell-descriptors',
      'manufacturerPartId',
      '',
    )).toBe('curl -X GET \'http://localhost:5004/api/v3/shell-descriptors?limit=100\'')
  })

  it('builds an effective EDC BFF cURL command with the current asset filter', () => {
    expect(buildEdcShellDescriptorsCurlCommand(
      'https://ui.example/api/catena-x/edc/default/dtr/shell-descriptors',
      'BPNL0001',
      'https://partner.example/api/v1/dsp',
      'dataspace-protocol-http',
      'manufacturerPartId',
      'PART-001',
      'transfer-123',
    )).toBe(
      'curl -X POST \'https://ui.example/api/catena-x/edc/default/dtr/shell-descriptors\' \\\n'
      + '  -H \'Content-Type: application/json\' \\\n'
      + '  --data-raw \'{"counterPartyId":"BPNL0001","counterPartyAddress":"https://partner.example/api/v1/dsp","protocol":"dataspace-protocol-http","limit":100,"assetIds":[{"name":"manufacturerPartId","value":"PART-001"}],"transferProcessId":"transfer-123"}\'',
    )
  })

  it('adds safe authorization placeholders to cURL commands', () => {
    expect(buildShellDescriptorsCurlCommand(
      'https://registry.example/api/v3',
      'manufacturerPartId',
      'PART-001',
      'Bearer <ACCESS_TOKEN>',
    )).toContain('-H \'Authorization: Bearer <ACCESS_TOKEN>\'')

    expect(buildEdcShellDescriptorsCurlCommand(
      'https://ui.example/api/catena-x/edc/default/dtr/shell-descriptors',
      'BPNL0001',
      'https://partner.example/dsp',
      'dataspace-protocol-http',
      'manufacturerPartId',
      'PART-001',
      undefined,
      'Basic <BASE64_USERNAME_PASSWORD>',
    )).toContain('-H \'Authorization: Basic <BASE64_USERNAME_PASSWORD>\'')
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

  it('builds shared asset ID suggestion lists for search and specific asset IDs', () => {
    const searchSuggestions = buildAssetIdNameSuggestions(
      [{ specificAssetIds: [{ name: 'customAssetId', value: 'CUSTOM-001' }] }],
      ['zDiscoveredAssetId', 'manufacturerPartId'],
    )

    expect(searchSuggestions).toEqual([
      'manufacturerId',
      'manufacturerPartId',
      'customerPartId',
      'digitalTwinType',
      'partInstanceId',
      'intrinsicId',
      'batchId',
      'van',
      'parentOrderNumber',
      'jisNumber',
      'jisCallDate',
      'globalAssetId',
      'customAssetId',
      'zDiscoveredAssetId',
    ])
    expect(getSpecificAssetIdNameSuggestions(searchSuggestions)).toEqual([
      'manufacturerId',
      'manufacturerPartId',
      'customerPartId',
      'digitalTwinType',
      'partInstanceId',
      'intrinsicId',
      'batchId',
      'van',
      'parentOrderNumber',
      'jisNumber',
      'jisCallDate',
      'customAssetId',
      'zDiscoveredAssetId',
    ])
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

  it('labels descriptor timestamps by the source field', () => {
    expect(getDescriptorTimestampInfo({
      createdAt: '2026-01-01T10:00:00Z',
      updatedAt: '2026-01-02T10:00:00Z',
    })).toEqual({
      label: 'Updated',
      value: '2026-01-02T10:00:00Z',
    })

    expect(getDescriptorTimestampInfo({
      createdAt: '2026-01-01T10:00:00Z',
    })).toEqual({
      label: 'Created',
      value: '2026-01-01T10:00:00Z',
    })
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

  it('parses Submodel EDC endpoint information', () => {
    expect(parseSubprotocolBody(
      ' id = submodel-asset ; dspEndpoint = https://counterparty-dsp.test/api/v1/dsp ; malformed ',
    )).toEqual({
      id: 'submodel-asset',
      dspEndpoint: 'https://counterparty-dsp.test/api/v1/dsp',
    })

    expect(getSubmodelEdcEndpointInfo({
      endpoints: [{
        protocolInformation: {
          href: 'https://data-plane.test/api/public/submodel-asset/submodel',
          subprotocol: 'DSP',
          subprotocolBody: 'id=submodel-asset;dspEndpoint=https://counterparty-dsp.test/api/v1/dsp',
        },
      }],
    })).toEqual({
      assetId: 'submodel-asset',
      dspEndpoint: 'https://counterparty-dsp.test/api/v1/dsp',
      href: 'https://data-plane.test/api/public/submodel-asset/submodel',
      subprotocolBody: 'id=submodel-asset;dspEndpoint=https://counterparty-dsp.test/api/v1/dsp',
    })

    expect(getSubmodelEdcEndpointInfo({
      endpoints: [{ protocolInformation: { href: 'https://data-plane.test/submodel' } }],
    })).toBeNull()
  })
})
