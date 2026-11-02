import type { CatenaXEdcQuerySpec } from '@/composables/Client/CatenaXEdcClient'
import { CX_TAXO_NAMESPACE, DCT_NAMESPACE, EDC_NAMESPACE } from '@/pages/modules/EclipseDataspaceConnector/data/namespaces'

export interface CatalogFilterPreset {
  title: string
  value: string
  querySpec?: CatenaXEdcQuerySpec
  matches?: (dataset: any) => boolean
}

// Items of the filter select, dividers are rendered by v-select between the groups of presets
export type CatalogFilterItem = CatalogFilterPreset | { type: 'divider' }

/**
 * Returns a query spec that only matches catalog datasets of the given Catena-X taxonomy type (`dct:type`).
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
 * Returns a matcher for catalog datasets whose ID, display name or description contains one of the given texts
 * (case-insensitive) or matches one of the given patterns.
 * It is applied client-side, since the criteria of a query spec are AND-combined and can't express this OR.
 */
function textMatcher (...searchTerms: Array<string | RegExp>): (dataset: any) => boolean {
  const patterns = searchTerms.map(searchTerm => typeof searchTerm === 'string'
    ? new RegExp(searchTerm.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`), 'i')
    : searchTerm)
  return dataset => Object.entries(dataset ?? {})
    .filter(([key]) => key === '@id' || ['description', 'displayName'].includes(key.split(/[#/:]/).pop() ?? ''))
    .flatMap(([, value]) => textValues(value))
    .some(text => patterns.some(pattern => pattern.test(text)))
}

// Service assets (e.g. AAS Service, Submodel Service) give access to many AAS or Submodels, not to a single one
const isService = textMatcher('Service')
const isSubmodel = textMatcher(wordPattern('SM'), 'Submodel')
const isAssetAdministrationShell = textMatcher('AAS', 'Asset Administration Shell')

export const catalogFilterItems: CatalogFilterItem[] = [
  { title: 'All', value: 'all' },
  { type: 'divider' },
  { title: 'Digital Twin Registry', value: 'digitalTwinRegistry', querySpec: assetTypeQuerySpec('DigitalTwinRegistry') },
  { title: 'Submodel Service', value: 'submodelService', querySpec: assetTypeQuerySpec('Submodel') },
  { title: 'Push Asset', value: 'pushAsset', matches: textMatcher('push') },
  { type: 'divider' },
  { title: 'Digital Product Passport', value: 'digitalProductPassport', matches: textMatcher('DPP', 'Digital Product Passport') },
  {
    title: 'Asset Administration Shell',
    value: 'assetAdministrationShell',
    matches: dataset => isAssetAdministrationShell(dataset) && !isSubmodel(dataset) && !isService(dataset),
  },
  { title: 'Submodel', value: 'submodel', matches: dataset => isSubmodel(dataset) && !isService(dataset) },
]

/**
 * Returns the filter preset with the given value, skipping the dividers of the filter items.
 */
export function catalogFilterPreset (value: string): CatalogFilterPreset | undefined {
  return catalogFilterItems.find((item): item is CatalogFilterPreset => 'value' in item && item.value === value)
}
