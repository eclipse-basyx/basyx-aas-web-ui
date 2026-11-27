import type { CatenaXEdcQuerySpec } from '@/composables/Client/CatenaXEdcClient'
import { describe, expect, it, vi } from 'vitest'
import { namesAnyAsset, selectsAnyAsset } from '@/pages/modules/EclipseDataspaceConnector/composables/EdcAssetsSelector'
import {
  EDC_ASSET_ID_OPERAND,
  edcQuerySpec,
  queryAllEdcPages,
  queryEdcPage,
} from '@/pages/modules/EclipseDataspaceConnector/composables/EdcPaging'

const typeFilter: CatenaXEdcQuerySpec = {
  filterExpression: [{ operandLeft: 'type', operator: '=', operandRight: 'DigitalTwinRegistry' }],
}

function idsOf (count: number, offset = 0): Array<{ '@id': string }> {
  return Array.from({ length: count }, (_, index) => ({ '@id': `resource-${offset + index}` }))
}

describe('EdcPaging', () => {
  it('builds a query spec sorted by ID, with the filter and the search', () => {
    expect(edcQuerySpec({ filter: typeFilter, search: ' dtr ', idOperand: EDC_ASSET_ID_OPERAND }, 100, 50)).toEqual({
      '@context': { '@vocab': 'https://w3id.org/edc/v0.0.1/ns/' },
      '@type': 'QuerySpec',
      'offset': 100,
      'limit': 50,
      'sortField': 'id',
      'sortOrder': 'ASC',
      'filterExpression': [
        { operandLeft: 'type', operator: '=', operandRight: 'DigitalTwinRegistry' },
        { '@type': 'Criterion', 'operandLeft': 'https://w3id.org/edc/v0.0.1/ns/id', 'operator': 'ilike', 'operandRight': '%dtr%' },
      ],
    })
    expect(edcQuerySpec({ search: '  ' }, 0, 50)).not.toHaveProperty('filterExpression')
  })

  it('queries one page and reports whether there may be more', async () => {
    const query = vi.fn()
      .mockResolvedValueOnce({ success: true, data: idsOf(50) })
      .mockResolvedValueOnce({ success: true, data: idsOf(3) })

    await expect(queryEdcPage(query, { offset: 0, limit: 50, search: 'x' })).resolves.toMatchObject({ hasMore: true })
    await expect(queryEdcPage(query, { offset: 50, limit: 50 })).resolves.toMatchObject({ hasMore: false })
    expect(query).toHaveBeenNthCalledWith(1, expect.objectContaining({
      offset: 0,
      limit: 50,
      filterExpression: [expect.objectContaining({ operandLeft: 'id', operandRight: '%x%' })],
    }))
  })

  it('queries all pages until a page is not full', async () => {
    const query = vi.fn()
      .mockResolvedValueOnce({ success: true, data: idsOf(500) })
      .mockResolvedValueOnce({ success: true, data: idsOf(2, 500) })

    const result = await queryAllEdcPages(query, { filter: typeFilter })

    expect(result).toMatchObject({ success: true, hasMore: false })
    expect(result.success && result.data).toHaveLength(502)
    expect(query).toHaveBeenCalledTimes(2)
    expect(query).toHaveBeenNthCalledWith(2, expect.objectContaining({ offset: 500, limit: 500, filterExpression: typeFilter.filterExpression }))
  })

  it('stops querying all pages at a failure or an endless list', async () => {
    const failing = vi.fn()
      .mockResolvedValueOnce({ success: true, data: idsOf(500) })
      .mockResolvedValueOnce({ success: false, status: 502 })
    const endless = vi.fn().mockResolvedValue({ success: true, data: idsOf(500) })

    await expect(queryAllEdcPages(failing)).resolves.toEqual({ success: false, status: 502 })
    await expect(queryAllEdcPages(endless)).resolves.toMatchObject({ success: false, details: expect.stringContaining('more than') })
    expect(endless).toHaveBeenCalledTimes(100)
  })
})

describe('EdcAssetsSelector', () => {
  const contractOf = (assetsSelector: unknown) => ({ accessPolicyId: 'a', contractPolicyId: 'u', assetsSelector }) as any
  const assetIds = new Set<string | undefined>(['asset-1'])

  it('finds an asset in "=" and "in" criteria, also among several criteria', () => {
    expect(namesAnyAsset(contractOf({ operandLeft: 'https://w3id.org/edc/v0.0.1/ns/id', operator: '=', operandRight: 'asset-1' }), assetIds)).toBe(true)
    expect(namesAnyAsset(contractOf({ operandLeft: 'id', operator: 'in', operandRight: ['asset-0', 'asset-1'] }), assetIds)).toBe(true)
    expect(namesAnyAsset(contractOf([
      { operandLeft: 'type', operator: '=', operandRight: 'asset-1' },
      { operandLeft: 'edc:id', operator: '=', operandRight: 'asset-1' },
    ]), assetIds)).toBe(true)
    expect(namesAnyAsset(contractOf({ operandLeft: 'type', operator: '=', operandRight: 'asset-1' }), assetIds)).toBe(false)
  })

  it('treats an empty selector as selecting all assets, but naming none', () => {
    expect(selectsAnyAsset(contractOf([]), assetIds)).toBe(true)
    expect(namesAnyAsset(contractOf([]), assetIds)).toBe(false)
  })
})
