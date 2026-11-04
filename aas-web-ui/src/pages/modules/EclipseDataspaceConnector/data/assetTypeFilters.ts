import type { CatenaXEdcQuerySpec } from '@/composables/Client/CatenaXEdcClient'
import { CX_TAXO_NAMESPACE, DCT_NAMESPACE, EDC_NAMESPACE } from '@/pages/modules/EclipseDataspaceConnector/data/namespaces'

export interface AssetTypeFilterPreset {
  title: string
  value: string
  querySpec?: CatenaXEdcQuerySpec
  matches?: (asset: any) => boolean // Catalog dataset or asset of the management API
}

// Items of the filter select, dividers are rendered by v-select between the groups of presets
export type AssetTypeFilterItem = AssetTypeFilterPreset | { type: 'divider' }

/**
 * Returns a query spec that only matches catalog datasets or assets of the given Catena-X taxonomy type (`dct:type`).
 */
function assetTypeQuerySpec (taxonomyType: string): CatenaXEdcQuerySpec {
  return {
    filterExpression: [
      {
        '@context': { edc: EDC_NAMESPACE },
        '@type': 'edc:Criterion',
        'operandLeft': `'${DCT_NAMESPACE}type'.'@id'`,
        'operator': '=',
        'operandRight': CX_TAXO_NAMESPACE + taxonomyType,
      },
    ],
  }
}

/**
 * Returns the string values of a JSON-LD value, e.g. the texts of LangStrings, without their `@type`.
 */
function textValues (value: unknown): string[] {
  if (typeof value === 'string') {
    return [value]
  }
  if (Array.isArray(value)) {
    return value.flatMap(item => textValues(item))
  }
  if (value && typeof value === 'object') {
    return Object.entries(value)
      .filter(([key]) => key !== '@type')
      .flatMap(([, item]) => textValues(item))
  }
  return []
}

/**
 * Returns a case-insensitive pattern that matches the given word only as a whole word, e.g. `SM` in `sm-1` but not in `small`.
 */
function wordPattern (word: string): RegExp {
  return new RegExp(`(^|[^a-z0-9])${word}([^a-z0-9]|$)`, 'i')
}

/**
 * Returns a matcher for catalog datasets or assets whose ID, display name or description contains one of the given texts
 * (case-insensitive) or matches one of the given patterns.
 * It is applied client-side, since the criteria of a query spec are AND-combined and can't express this OR.
 */
function textMatcher (...searchTerms: Array<string | RegExp>): (asset: any) => boolean {
  const patterns = searchTerms.map(searchTerm => typeof searchTerm === 'string'
    ? new RegExp(searchTerm.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`), 'i')
    : searchTerm)
  // Catalog datasets have their texts on top level, assets of the management API in `properties`
  return asset => Object.entries({ ...asset, ...asset?.properties })
    .filter(([key]) => key === '@id' || ['description', 'displayName'].includes(key.split(/[#/:]/).pop() ?? ''))
    .flatMap(([, value]) => textValues(value))
    .some(text => patterns.some(pattern => pattern.test(text)))
}

// Service assets (e.g. AAS Service, Submodel Service) give access to many AAS or Submodels, not to a single one
const isService = textMatcher('Service')
const isSubmodel = textMatcher(wordPattern('SM'), 'Submodel')
const isAssetAdministrationShell = textMatcher('AAS', 'Asset Administration Shell')
// Push assets receive data, e.g. an AAS or Submodel posted to their data plane
export const isPushAsset = textMatcher('push')

export const assetTypeFilterItems: AssetTypeFilterItem[] = [
  { title: 'All', value: 'all' },
  { type: 'divider' },
  { title: 'Digital Twin Registry', value: 'digitalTwinRegistry', querySpec: assetTypeQuerySpec('DigitalTwinRegistry') },
  { title: 'Submodel Service', value: 'submodelService', querySpec: assetTypeQuerySpec('Submodel') },
  { title: 'Push Asset', value: 'pushAsset', matches: isPushAsset },
  { type: 'divider' },
  { title: 'Digital Product Passport', value: 'digitalProductPassport', matches: textMatcher('DPP', 'Digital Product Passport') },
  {
    title: 'Asset Administration Shell',
    value: 'assetAdministrationShell',
    matches: asset => isAssetAdministrationShell(asset) && !isSubmodel(asset) && !isService(asset),
  },
  { title: 'Submodel', value: 'submodel', matches: asset => isSubmodel(asset) && !isService(asset) },
]

/**
 * Returns the filter preset with the given value, skipping the dividers of the filter items.
 */
export function assetTypeFilterPreset (value: string): AssetTypeFilterPreset | undefined {
  return assetTypeFilterItems.find((item): item is AssetTypeFilterPreset => 'value' in item && item.value === value)
}
