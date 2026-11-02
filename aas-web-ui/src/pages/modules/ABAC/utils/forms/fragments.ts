export const FRAGMENT_PATHS = {
  aas: ['idShort', 'assetInformation.assetType', 'assetInformation.globalAssetId', 'assetInformation.specificAssetIds', 'assetInformation.specificAssetIds[]', 'assetInformation.specificAssetIds[].externalSubjectId.keys[]', 'submodels', 'submodels[]', 'submodels[].keys[]'],
  sm: ['idShort', 'semanticId', 'semanticId.keys[]', 'supplementalSemanticIds', 'supplementalSemanticIds[]', 'supplementalSemanticIds[].keys[]'],
  sme: ['', 'idShort', 'value', 'valueType', 'language', 'semanticId', 'semanticId.keys[]', 'supplementalSemanticIds[]', 'supplementalSemanticIds[].keys[]'],
  cd: ['idShort'],
  aasdesc: ['idShort', 'description', 'displayName', 'extension', 'administration', 'assetKind', 'assetType', 'globalAssetId', 'specificAssetIds', 'specificAssetIds[]', 'specificAssetIds[].externalSubjectId.keys[]', 'endpoints', 'endpoints[]', 'submodelDescriptors', 'submodelDescriptors[]', 'submodelDescriptors[].semanticId', 'submodelDescriptors[].supplementalSemanticIds[]', 'submodelDescriptors[].endpoints[]'],
  smdesc: ['idShort', 'semanticId', 'semanticId.keys[]', 'supplementalSemanticIds', 'supplementalSemanticIds[]', 'supplementalSemanticIds[].keys[]', 'endpoints', 'endpoints[]'],
} as const

export type FragmentTarget = keyof typeof FRAGMENT_PATHS

/**
 * Splits recognized fragment syntax without validating or modifying its contents.
 * Backend extensions and unfamiliar syntax remain editable as a custom value.
 */
export function readFragment (value: string): { target: FragmentTarget, path: string, field: string } | undefined {
  const match = /^\$(aas|sm|sme|cd|aasdesc|smdesc)(?:\.([^#]*))?(?:#(.*))?$/.exec(value)
  if (!match) {
    return undefined
  }
  const target = match[1] as FragmentTarget
  if (target !== 'sme' && (match[2] !== undefined || !value.includes('#'))) {
    return undefined
  }
  return { target, path: match[2] ?? '', field: match[3] ?? '' }
}

/**
 * Builds fragment syntax. Only Submodel Elements support a path or a whole-element selector.
 */
export function writeFragment (target: FragmentTarget, field: string, path = ''): string {
  const elementPath = target === 'sme' && path !== '' ? `.${path}` : ''
  const fieldSuffix = target === 'sme' && field === '' ? '' : `#${field}`
  return `$${target}${elementPath}${fieldSuffix}`
}
