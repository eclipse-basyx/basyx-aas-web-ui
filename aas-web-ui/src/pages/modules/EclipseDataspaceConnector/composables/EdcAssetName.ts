import type { CatenaXEdcAsset } from '@/composables/Client/CatenaXEdcClient'

/** Name of an asset for the UI: its display name, else its name, else its description, else an empty string */
export function edcAssetName (asset: Partial<CatenaXEdcAsset> | null | undefined): string {
  const properties = asset?.properties ?? {}
  const name = properties.displayName || properties.name || properties.description
  return typeof name === 'string' ? name : ''
}
