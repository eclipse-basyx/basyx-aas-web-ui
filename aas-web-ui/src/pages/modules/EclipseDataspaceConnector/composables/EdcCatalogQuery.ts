import type { CatenaXEdcCatalog, CatenaXEdcQuerySpec } from '@/composables/Client/CatenaXEdcClient'
import type { CatenaXPartner } from '@/types/Infrastructure'
import { useCatenaXEdcClient } from '@/composables/Client/CatenaXEdcClient'
import {
  type EdcListPage,
  type EdcPageResult,
  type EdcQuery,
  queryAllEdcPages,
  queryEdcPage,
} from '@/pages/modules/EclipseDataspaceConnector/composables/EdcPaging'
import { assetTypeFilterPreset, type AssetTypeFilterValue } from '@/pages/modules/EclipseDataspaceConnector/data/assetTypeFilters'

/**
 * Returns the datasets of a catalog, which has a single dataset as object.
 */
export function catalogDatasets (catalog: CatenaXEdcCatalog | undefined): any[] {
  const datasets = catalog?.['dcat:dataset'] ?? catalog?.dataset
  if (!datasets) {
    return []
  }
  return Array.isArray(datasets) ? datasets : [datasets]
}

/**
 * The provider applies offset, limit and filter of a catalog query spec, but not its sorting,
 * so a catalog keeps the order of the provider.
 */
function catalogQuerySpec ({ offset, limit, filterExpression }: CatenaXEdcQuerySpec): CatenaXEdcQuerySpec {
  return { '@type': 'QuerySpec', offset, limit, ...(filterExpression ? { filterExpression } : {}) }
}

export function useEdcCatalogQuery () {
  // Composables
  const { requestCatalog } = useCatenaXEdcClient()

  function catalogQuery (proxyId: string, partner: CatenaXPartner): EdcQuery<any> {
    return async querySpec => {
      const result = await requestCatalog(proxyId, {
        counterPartyId: partner.counterPartyId,
        // The BFF defaults to DSP 2025-1 and adds its version path to the address
        counterPartyAddress: partner.counterPartyAddress,
        querySpec: catalogQuerySpec(querySpec),
      })
      return result.success ? { success: true, data: catalogDatasets(result.data) } : result
    }
  }

  /**
   * Requests a page of the catalog datasets of the given asset type filter preset, or of all datasets for `all`.
   * A preset evaluated in the browser (`matches`) returns all its datasets at once.
   */
  async function queryCatalogPage (
    proxyId: string,
    partner: CatenaXPartner,
    assetTypeFilterValue: AssetTypeFilterValue,
    page: EdcListPage,
  ): Promise<EdcPageResult<any>> {
    const assetTypeFilter = assetTypeFilterPreset(assetTypeFilterValue)
    const query = catalogQuery(proxyId, partner)

    if (assetTypeFilter?.matches) {
      const result = await queryAllEdcPages(query, { filter: assetTypeFilter.querySpec })
      return result.success
        ? { success: true, data: result.data.filter(dataset => assetTypeFilter.matches?.(dataset)), hasMore: false }
        : result
    }
    return queryEdcPage(query, page, { filter: assetTypeFilter?.querySpec })
  }

  /**
   * Requests the catalog dataset of the given asset, e.g. one beyond the loaded pages. Resolves to `null` if there is none.
   */
  async function findCatalogDataset (proxyId: string, partner: CatenaXPartner, assetId: string): Promise<any> {
    const result = await requestCatalog(proxyId, {
      counterPartyId: partner.counterPartyId,
      counterPartyAddress: partner.counterPartyAddress,
      assetId,
    })
    return result.success ? (catalogDatasets(result.data).find(dataset => dataset['@id'] === assetId) ?? null) : null
  }

  return { queryCatalogPage, findCatalogDataset }
}
