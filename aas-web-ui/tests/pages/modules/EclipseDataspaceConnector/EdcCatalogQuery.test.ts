import type { CatenaXPartner } from '@/types/Infrastructure'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { catalogDatasets, useEdcCatalogQuery } from '@/pages/modules/EclipseDataspaceConnector/composables/EdcCatalogQuery'

const mocks = vi.hoisted(() => ({
  requestCatalog: vi.fn(),
}))

vi.mock('@/composables/Client/CatenaXEdcClient', () => ({
  useCatenaXEdcClient: () => ({ requestCatalog: mocks.requestCatalog }),
}))

const partner = { id: 'provider-a', name: 'Provider A', counterPartyId: 'BPNL-A', counterPartyAddress: 'https://provider-a.test/api/v1/dsp' } as CatenaXPartner
const catalogOf = (datasets: unknown) => ({ success: true, data: { 'dcat:dataset': datasets } })
const datasetsOf = (ids: string[]) => ids.map(id => ({ '@id': id }))

describe('EdcCatalogQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('reads single and several datasets of a catalog', () => {
    expect(catalogDatasets({ 'dcat:dataset': { '@id': 'a' } })).toEqual([{ '@id': 'a' }])
    expect(catalogDatasets({ dataset: datasetsOf(['a', 'b']) })).toEqual(datasetsOf(['a', 'b']))
    expect(catalogDatasets(undefined)).toEqual([])
  })

  it('requests one page of the catalog, with the filter of the partner and without sorting', async () => {
    mocks.requestCatalog.mockResolvedValue(catalogOf(datasetsOf(['dtr-1', 'dtr-2'])))
    const { queryCatalogPage } = useEdcCatalogQuery()

    const result = await queryCatalogPage('proxy-a', partner, 'digitalTwinRegistry', { offset: 50, limit: 2 })

    expect(result).toMatchObject({ success: true, data: datasetsOf(['dtr-1', 'dtr-2']), hasMore: true })
    const request = mocks.requestCatalog.mock.calls[0]![1]
    expect(request).toMatchObject({ counterPartyId: 'BPNL-A', counterPartyAddress: 'https://provider-a.test/api/v1/dsp' })
    expect(request.querySpec).toEqual({
      '@type': 'QuerySpec',
      'offset': 50,
      'limit': 2,
      'filterExpression': [expect.objectContaining({ operandRight: 'https://w3id.org/catenax/taxonomy#DigitalTwinRegistry' })],
    })
  })

  it('requests all pages for a filter evaluated in the browser', async () => {
    const page = Array.from({ length: 500 }, (_, index) => ({ '@id': index === 0 ? 'push-asset' : `asset-${index}` }))
    mocks.requestCatalog
      .mockResolvedValueOnce(catalogOf(page))
      .mockResolvedValueOnce(catalogOf({ '@id': 'push-asset-2' }))
    const { queryCatalogPage } = useEdcCatalogQuery()

    const result = await queryCatalogPage('proxy-a', partner, 'pushAsset', { offset: 0, limit: 50 })

    expect(result).toEqual({ success: true, data: datasetsOf(['push-asset', 'push-asset-2']), hasMore: false })
    expect(mocks.requestCatalog).toHaveBeenCalledTimes(2)
    expect(mocks.requestCatalog.mock.calls[1]![1].querySpec).toMatchObject({ offset: 500, limit: 500 })
  })

  it('finds a dataset by its asset ID', async () => {
    mocks.requestCatalog
      .mockResolvedValueOnce(catalogOf({ '@id': 'push-asset' }))
      .mockResolvedValueOnce({ success: false, status: 502 })
    const { findCatalogDataset } = useEdcCatalogQuery()

    await expect(findCatalogDataset('proxy-a', partner, 'push-asset')).resolves.toEqual({ '@id': 'push-asset' })
    await expect(findCatalogDataset('proxy-a', partner, 'push-asset')).resolves.toBeNull()
    // The EDC BFF builds the query spec of the asset ID
    expect(mocks.requestCatalog.mock.calls[0]![1]).toEqual({
      counterPartyId: partner.counterPartyId,
      counterPartyAddress: partner.counterPartyAddress,
      assetId: 'push-asset',
    })
  })
})
