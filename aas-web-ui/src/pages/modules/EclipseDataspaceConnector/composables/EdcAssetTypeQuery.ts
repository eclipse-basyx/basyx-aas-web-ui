import type { CatenaXEdcAsset } from '@/composables/Client/CatenaXEdcClient'
import { useCatenaXEdcClient } from '@/composables/Client/CatenaXEdcClient'
import { assetTypeFilterPreset } from '@/pages/modules/EclipseDataspaceConnector/data/assetTypeFilters'
import { EDC_NAMESPACE } from '@/pages/modules/EclipseDataspaceConnector/data/namespaces'

export function useEdcAssetTypeQuery () {
  // Composables
  const { queryAssets } = useCatenaXEdcClient()

  /**
   * Queries the assets of the given asset type filter preset, e.g. `digitalTwinRegistry`, or all assets for `all`.
   */
  async function queryAssetsOfType (proxyId: string, assetTypeFilterValue: string): Promise<CatenaXEdcAsset[] | null> {
    const assetTypeFilter = assetTypeFilterPreset(assetTypeFilterValue)

    // Unlike in a catalog request, the query spec is the request body itself and needs its own context and type
    const assets = await queryAssets(proxyId, assetTypeFilter?.querySpec && {
      querySpec: { '@context': { '@vocab': EDC_NAMESPACE }, '@type': 'QuerySpec', ...assetTypeFilter.querySpec },
    })

    return assets?.filter(asset => assetTypeFilter?.matches?.(asset) ?? true) ?? null
  }

  return { queryAssetsOfType }
}
