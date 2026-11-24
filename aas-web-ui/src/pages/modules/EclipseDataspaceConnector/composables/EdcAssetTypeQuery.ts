import type { CatenaXEdcAsset } from '@/composables/Client/CatenaXEdcClient'
import { useCatenaXEdcClient } from '@/composables/Client/CatenaXEdcClient'
import {
  EDC_ASSET_ID_OPERAND,
  type EdcListPage,
  type EdcPageResult,
  queryAllEdcPages,
  queryEdcPage,
} from '@/pages/modules/EclipseDataspaceConnector/composables/EdcPaging'
import { assetTypeFilterPreset, type AssetTypeFilterValue } from '@/pages/modules/EclipseDataspaceConnector/data/assetTypeFilters'

export function useEdcAssetTypeQuery () {
  // Composables
  const { queryAssets } = useCatenaXEdcClient()

  /**
   * Queries a page of the assets of the given asset type filter preset, e.g. `digitalTwinRegistry`, or of all assets for `all`.
   * A preset evaluated in the browser (`matches`) returns all its assets at once.
   */
  async function queryAssetsOfTypePage (proxyId: string, assetTypeFilterValue: AssetTypeFilterValue, page: EdcListPage): Promise<EdcPageResult<CatenaXEdcAsset>> {
    const assetTypeFilter = assetTypeFilterPreset(assetTypeFilterValue)
    if (assetTypeFilter?.matches) {
      return queryAssetsOfType(proxyId, assetTypeFilterValue, page.search)
    }

    return queryEdcPage(
      querySpec => queryAssets(proxyId, { querySpec }),
      page,
      { filter: assetTypeFilter?.querySpec, idOperand: EDC_ASSET_ID_OPERAND },
    )
  }

  /**
   * Queries all assets of the given asset type filter preset, optionally only those whose ID contains `search`.
   */
  async function queryAssetsOfType (proxyId: string, assetTypeFilterValue: AssetTypeFilterValue, search?: string): Promise<EdcPageResult<CatenaXEdcAsset>> {
    const assetTypeFilter = assetTypeFilterPreset(assetTypeFilterValue)
    const result = await queryAllEdcPages(
      querySpec => queryAssets(proxyId, { querySpec }),
      { filter: assetTypeFilter?.querySpec, search, idOperand: EDC_ASSET_ID_OPERAND },
    )

    return result.success
      ? { success: true, data: result.data.filter(asset => assetTypeFilter?.matches?.(asset) ?? true), hasMore: false }
      : result
  }

  return { queryAssetsOfType, queryAssetsOfTypePage }
}
