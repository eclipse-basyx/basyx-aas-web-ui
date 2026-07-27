import { describe, expect, it } from 'vitest'
import {
  evaluateFeatureControl,
  extractFeatureClaims,
  parseFeatureControlClaimMappings,
} from '@/utils/FeatureControl'

describe('feature control claim mappings', () => {
  it('parses the BaSyx Go list mapping shape', () => {
    expect(parseFeatureControlClaimMappings(JSON.stringify([
      {
        target: ' features ',
        mode: ' LIST ',
        sources: ['/basyx_features', '/nested/features', '/basyx_features'],
      },
    ]))).toEqual([
      {
        target: 'features',
        mode: 'list',
        sources: ['/basyx_features', '/nested/features'],
      },
    ])
  })

  it.each([
    ['malformed JSON', '{'],
    ['non-array configuration', '{}'],
    ['unsupported target', '[{"target":"roles","mode":"list","sources":["/roles"]}]'],
    ['unsupported mode', '[{"target":"features","mode":"scalar","sources":["/feature"]}]'],
    ['missing sources', '[{"target":"features","mode":"list","sources":[]}]'],
    ['non-string source', '[{"target":"features","mode":"list","sources":[1]}]'],
    ['invalid pointer', '[{"target":"features","mode":"list","sources":["features"]}]'],
    ['incomplete pointer escape', '[{"target":"features","mode":"list","sources":["/feature~"]}]'],
    ['unsupported pointer escape', '[{"target":"features","mode":"list","sources":["/feature~2"]}]'],
    ['duplicate target', '[{"target":"features","mode":"list","sources":["/first"]},{"target":"features","mode":"list","sources":["/second"]}]'],
  ])('rejects %s', (_name, configuration) => {
    expect(() => parseFeatureControlClaimMappings(configuration)).toThrow()
  })

  it('treats an absent or empty configuration as disabled', () => {
    expect(parseFeatureControlClaimMappings('')).toEqual([])
    expect(parseFeatureControlClaimMappings(' '.repeat(3))).toEqual([])
    expect(parseFeatureControlClaimMappings('[]')).toEqual([])
  })

  it('merges and deduplicates scalar and array claims from all sources', () => {
    const mappings = parseFeatureControlClaimMappings(JSON.stringify([
      {
        target: 'features',
        mode: 'list',
        sources: ['/basyx_features', '/provider/features'],
      },
    ]))

    expect(extractFeatureClaims({
      basyx_features: 'allow-editing',
      provider: {
        features: ['allow-uploading', 'allow-editing'],
      },
    }, mappings)).toEqual(['allow-editing', 'allow-uploading'])
  })

  it('supports escaped object keys and array indices in JSON pointers', () => {
    const mappings = parseFeatureControlClaimMappings(JSON.stringify([
      {
        target: 'features',
        mode: 'list',
        sources: ['/claims/a~1b/~0features/1'],
      },
    ]))

    expect(extractFeatureClaims({
      claims: {
        'a/b': {
          '~features': ['allow-editing', 'allow-uploading'],
        },
      },
    }, mappings)).toEqual(['allow-uploading'])
  })

  it('returns an empty list when none of the configured sources exist', () => {
    const mappings = parseFeatureControlClaimMappings(JSON.stringify([
      { target: 'features', mode: 'list', sources: ['/missing'] },
    ]))

    expect(extractFeatureClaims({}, mappings)).toEqual([])
  })

  it.each([
    [{ basyx_features: true }],
    [{ basyx_features: ['allow-editing', false] }],
    [{ basyx_features: { editing: true } }],
  ])('rejects an invalid mapped claim shape', claims => {
    const mappings = parseFeatureControlClaimMappings(JSON.stringify([
      { target: 'features', mode: 'list', sources: ['/basyx_features'] },
    ]))

    expect(() => extractFeatureClaims(claims, mappings)).toThrow()
  })
})

describe('feature evaluation', () => {
  it('maps every supported feature value', () => {
    expect(evaluateFeatureControl([
      'endpoint-config-available',
      'multiple-aas',
      'sm-viewer-editor',
      'multiple-sm',
      'allow-editing',
      'allow-uploading',
      'allow-logout',
    ])).toEqual({
      endpointConfigAvailable: true,
      singleAas: false,
      smViewerEditor: true,
      singleSm: false,
      allowEditing: true,
      allowUploading: true,
      allowLogout: true,
    })

    expect(evaluateFeatureControl([
      'endpoint-config-unavailable',
      'single-aas',
      'single-sm',
      'forbid-editing',
      'forbid-uploading',
      'forbid-logout',
    ])).toEqual({
      endpointConfigAvailable: false,
      singleAas: true,
      singleSm: true,
      allowEditing: false,
      allowUploading: false,
      allowLogout: false,
    })
  })

  it('lets restrictive values win regardless of claim order', () => {
    const permissiveFirst = evaluateFeatureControl([
      'endpoint-config-available',
      'endpoint-config-unavailable',
      'multiple-aas',
      'single-aas',
      'multiple-sm',
      'single-sm',
      'allow-editing',
      'forbid-editing',
      'allow-uploading',
      'forbid-uploading',
      'allow-logout',
      'forbid-logout',
    ])
    const restrictiveFirst = evaluateFeatureControl([
      'forbid-logout',
      'allow-logout',
      'forbid-uploading',
      'allow-uploading',
      'forbid-editing',
      'allow-editing',
      'single-sm',
      'multiple-sm',
      'single-aas',
      'multiple-aas',
      'endpoint-config-unavailable',
      'endpoint-config-available',
    ])

    expect(permissiveFirst).toEqual({
      endpointConfigAvailable: false,
      singleAas: true,
      singleSm: true,
      allowEditing: false,
      allowUploading: false,
      allowLogout: false,
    })
    expect(restrictiveFirst).toEqual(permissiveFirst)
  })

  it('does not override deployment defaults for an empty feature set', () => {
    expect(evaluateFeatureControl([])).toEqual({})
  })

  it('rejects unsupported feature values instead of silently applying a partial set', () => {
    expect(() => evaluateFeatureControl(['allow-editing', 'allow-uplaoding'])).toThrow(
      'Unsupported feature control value "allow-uplaoding"',
    )
  })
})
