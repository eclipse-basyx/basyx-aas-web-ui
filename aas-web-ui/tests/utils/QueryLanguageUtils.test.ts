import { describe, expect, it } from 'vitest'
import {
  buildQueryEndpoint,
  buildQuickSearchQuery,
  buildStructuredSearchQuery,
  createQueryFilter,
  escapeRegexLiteral,
  formatQueryFilterExpression,
  getQueryFilterFields,
  parseQuerySearchExpression,
  resolveAasQueryTarget,
  supportsQueryProfile,
  validateQueryForTarget,
} from '@/utils/QueryLanguageUtils'

describe('QueryLanguageUtils', () => {
  it('recognizes target-specific BaSyx Go profiles for AAS API 3.2 and newer', () => {
    expect(supportsQueryProfile({
      profiles: [
        'https://basyx.org/aas/API/3/2/AssetAdministrationShellRepositoryServiceSpecification/SSP-001',
      ],
    }, 'aas-repository')).toBe(true)

    expect(supportsQueryProfile({
      profiles: [
        'https://basyx.org/aas/API/3/4/SubmodelRepositoryService/1.0/',
      ],
    }, 'submodel-repository')).toBe(true)

    expect(supportsQueryProfile({
      profiles: [
        'https://admin-shell.io/aas/API/3/2/AssetAdministrationShellRegistryServiceSpecification/SSP-004',
      ],
    }, 'aas-registry')).toBe(false)

    expect(supportsQueryProfile({
      profiles: [
        'https://basyx.org/aas/API/3/1/AssetAdministrationShellRegistryServiceSpecification/SSP-001',
      ],
    }, 'aas-registry')).toBe(false)

    expect(supportsQueryProfile({ profiles: [] }, 'aas-registry')).toBe(false)
  })

  it('constructs query endpoints from service roots and collection URLs', () => {
    expect(buildQueryEndpoint('https://example.com/shells', 'aas-repository'))
      .toBe('https://example.com/query/shells')
    expect(buildQueryEndpoint('https://example.com/shell-descriptors/', 'aas-registry'))
      .toBe('https://example.com/query/shell-descriptors')
    expect(buildQueryEndpoint('https://example.com/query/submodels', 'submodel-repository'))
      .toBe('https://example.com/query/submodels')
  })

  it('builds literal, case-insensitive quick searches for the selected target', () => {
    expect(escapeRegexLiteral('Pump (A)+')).toBe(String.raw`Pump \(A\)\+`)

    const query = buildQuickSearchQuery('submodel-repository', ' Pump (A)+ ')
    const conditions = query?.$condition.$or as Array<Record<string, any>>

    expect(conditions).toHaveLength(8)
    expect(conditions[0].$match).toHaveLength(1)
    expect(conditions[0].$match[0].$regex).toEqual([
      { $field: '$sm#id' },
      { $strVal: String.raw`(?i)Pump \(A\)\+` },
    ])
    expect(conditions.slice(4).map(condition => condition.$match[0].$regex[0].$field)).toEqual([
      '$sme#idShort',
      '$sme#value',
      '$sme#semanticId.keys[].value',
      '$sme#supplementalSemanticIds[].keys[].value',
    ])
    expect(buildQuickSearchQuery('aas-repository', '  ')).toBeUndefined()
  })

  it('keeps query targets aligned with the loaded source except for mono-all environments', () => {
    expect(resolveAasQueryTarget('mono-all', 'registry', true, true)).toBe('aas-repository')
    expect(resolveAasQueryTarget('mono-repo', 'registry', true, false)).toBe('aas-registry')
    expect(resolveAasQueryTarget('full', 'registry', true, true)).toBe('aas-registry')
    expect(resolveAasQueryTarget('full', 'registry', true, false)).toBe('aas-registry')
    expect(resolveAasQueryTarget('full', 'repository', false, true)).toBe('aas-repository')
  })

  it('exposes stable visual fields with target-specific Query Language paths', () => {
    const repositoryFields = getQueryFilterFields('aas-repository')
    const registryFields = getQueryFilterFields('aas-registry')
    const submodelFields = getQueryFilterFields('submodel-repository')

    expect(repositoryFields.find(field => field.key === 'assetKind')?.path)
      .toBe('$aas#assetInformation.assetKind')
    expect(registryFields.find(field => field.key === 'assetKind')?.path)
      .toBe('$aasdesc#assetKind')
    expect(submodelFields.find(field => field.key === 'semanticId')?.path)
      .toBe('$sm#semanticId.keys[].value')
    expect(submodelFields.some(field => field.key === 'assetKind')).toBe(false)
  })

  it('combines text search and visual filters without generating fragment filters', () => {
    const query = buildStructuredSearchQuery('aas-repository', 'Pump (A)+', [
      { id: 'one', field: 'idShort', operator: 'contains', value: 'Motor.1' },
      { id: 'two', field: 'assetKind', operator: 'equals', value: 'Instance' },
    ], 'all')

    expect(query).toEqual({
      $condition: {
        $and: [
          expect.objectContaining({ $or: expect.any(Array) }),
          {
            $match: [
              {
                $contains: [
                  { $field: '$aas#idShort' },
                  { $strVal: 'Motor.1' },
                ],
              },
              {
                $eq: [
                  { $field: '$aas#assetInformation.assetKind' },
                  { $strVal: 'Instance' },
                ],
              },
            ],
          },
        ],
      },
    })
    expect(query).not.toHaveProperty('$filters')
  })

  it('supports match-any, expert regex, defaults, and compact labels', () => {
    const filters = [
      { id: 'one', field: 'semanticId' as const, operator: 'starts-with' as const, value: '0173.' },
      { id: 'two', field: 'idShort' as const, operator: 'regex' as const, value: '^Motor-[0-9]+$' },
    ]
    const query = buildStructuredSearchQuery('submodel-repository', '', filters, 'any')

    expect(query?.$condition).toEqual({
      $or: [
        {
          $match: [{
            '$starts-with': [
              { $field: '$sm#semanticId.keys[].value' },
              { $strVal: '0173.' },
            ],
          }],
        },
        {
          $match: [{
            $regex: [
              { $field: '$sm#idShort' },
              { $strVal: '^Motor-[0-9]+$' },
            ],
          }],
        },
      ],
    })

    const defaultFilter = createQueryFilter('aas-registry', 'new-filter')
    expect(defaultFilter).toEqual({
      id: 'new-filter',
      field: 'id',
      operator: 'contains',
      value: '',
    })
    expect(formatQueryFilterExpression({
      id: 'kind',
      field: 'assetKind',
      operator: 'equals',
      value: 'NotApplicable',
    })).toBe('assetKind=NotApplicable')
  })

  it('ignores incomplete or target-incompatible visual filters', () => {
    expect(buildStructuredSearchQuery('aas-registry', '', [
      { id: 'empty', field: 'idShort', operator: 'contains', value: '  ' },
    ], 'all')).toBeUndefined()

    expect(buildStructuredSearchQuery('submodel-repository', '', [
      { id: 'aas-only', field: 'assetKind', operator: 'equals', value: 'Instance' },
    ], 'all')).toBeUndefined()
  })

  it('uses not-exists equality semantics for exclusions on multi-valued fields', () => {
    expect(buildStructuredSearchQuery('aas-repository', '', [{
      id: 'excluded-specific-id',
      field: 'specificAssetId',
      operator: 'not-equals',
      value: 'blocked',
    }], 'all')).toEqual({
      $condition: {
        $not: {
          $match: [{
            $eq: [
              { $field: '$aas#assetInformation.specificAssetIds[].value' },
              { $strVal: 'blocked' },
            ],
          }],
        },
      },
    })
  })

  it('keeps exclusions outside the correlated positive match', () => {
    expect(buildStructuredSearchQuery('aas-repository', '', [
      { id: 'included', field: 'idShort', operator: 'contains', value: 'Motor' },
      { id: 'excluded', field: 'specificAssetId', operator: 'not-equals', value: 'blocked' },
    ], 'all')).toEqual({
      $condition: {
        $and: [
          {
            $match: [{
              $contains: [
                { $field: '$aas#idShort' },
                { $strVal: 'Motor' },
              ],
            }],
          },
          {
            $not: {
              $match: [{
                $eq: [
                  { $field: '$aas#assetInformation.specificAssetIds[].value' },
                  { $strVal: 'blocked' },
                ],
              }],
            },
          },
        ],
      },
    })
  })

  it('parses GitHub-style field qualifiers while preserving plain text', () => {
    expect(parseQuerySearchExpression(
      'aas-repository',
      'pump idShort:Motor assetKind=Instance globalAssetId:"urn:asset 42"',
    )).toEqual({
      text: 'pump',
      filters: [
        { id: 'search-filter-0-idShort', field: 'idShort', operator: 'contains', value: 'Motor' },
        { id: 'search-filter-1-assetKind', field: 'assetKind', operator: 'equals', value: 'Instance' },
        { id: 'search-filter-2-globalAssetId', field: 'globalAssetId', operator: 'contains', value: 'urn:asset 42' },
      ],
      incompleteField: undefined,
    })
  })

  it('formats symbolic filter expressions used by the search builder', () => {
    const filter = {
      id: 'symbolic-filter',
      field: 'globalAssetId' as const,
      operator: 'equals' as const,
      value: 'urn:asset 42',
    }

    expect(formatQueryFilterExpression(filter)).toBe('globalAssetId="urn:asset 42"')
    expect(parseQuerySearchExpression('aas-repository', formatQueryFilterExpression(filter)).filters[0])
      .toMatchObject({
        field: filter.field,
        operator: filter.operator,
        value: filter.value,
      })
  })

  it('supports exclusions, incomplete qualifiers, and target-specific fields', () => {
    expect(parseQuerySearchExpression(
      'submodel-repository',
      'semanticId!=0173 -idShort:Draft supplementalSemanticId:',
    )).toEqual({
      text: '',
      filters: [
        { id: 'search-filter-0-semanticId', field: 'semanticId', operator: 'not-equals', value: '0173' },
        { id: 'search-filter-1-idShort', field: 'idShort', operator: 'not-equals', value: 'Draft' },
      ],
      incompleteField: 'supplementalSemanticId',
    })

    expect(parseQuerySearchExpression('submodel-repository', 'assetKind:Type motor')).toEqual({
      text: 'assetKind:Type motor',
      filters: [],
      incompleteField: undefined,
    })
  })

  it('rejects incompatible roots and identifier-only selections', () => {
    expect(validateQueryForTarget(JSON.stringify({
      $condition: { $eq: [{ $field: '$sme#idShort' }, { $strVal: 'Temperature' }] },
    }), 'submodel-repository').isValid).toBe(true)

    const wrongRoot = validateQueryForTarget(JSON.stringify({
      $condition: { $eq: [{ $field: '$aas#idShort' }, { $strVal: 'Example' }] },
    }), 'submodel-repository')
    expect(wrongRoot.isValid).toBe(false)
    expect(wrongRoot.message).toContain('Allowed roots: $sm, $sme')

    expect(validateQueryForTarget(JSON.stringify({
      $condition: { $boolean: true },
      $select: 'id',
    }), 'aas-repository').isValid).toBe(false)

    expect(validateQueryForTarget(JSON.stringify({
      $condition: { $boolean: true },
      $filters: [{
        $fragment: '$sme.Readings[]',
        $condition: {
          $eq: [{ $field: '$sme.Readings[]#value' }, { $strVal: '42' }],
        },
      }],
    }), 'aas-repository').isValid).toBe(false)

    expect(validateQueryForTarget(JSON.stringify({
      $condition: { $boolean: true },
      $filters: [{
        $fragment: '$sme.Readings[]',
        $condition: {
          $eq: [{ $field: '$sme.Readings[]#value' }, { $strVal: '42' }],
        },
      }],
    }), 'aas-repository', 'mono-all').isValid).toBe(false)

    expect(validateQueryForTarget(JSON.stringify({
      $condition: { $eq: [{ $field: '$sm#idShort' }, { $strVal: 'Nameplate' }] },
      $filters: [{
        $fragment: '$aas#submodels[]',
        $condition: {
          $eq: [{ $field: '$aas#submodels[].keys[].value' }, { $strVal: 'submodel-id' }],
        },
      }],
    }), 'aas-repository', 'mono-all').isValid).toBe(true)

    expect(validateQueryForTarget(JSON.stringify({
      $condition: {
        $and: [
          { $eq: [{ $field: '$sm#idShort' }, { $strVal: 'Nameplate' }] },
          { $eq: [{ $field: '$sme.ManufacturerName#value' }, { $strVal: 'Example' }] },
        ],
      },
    }), 'aas-repository', 'mono-repo').isValid).toBe(false)

    const wrongAasRepositoryRoot = validateQueryForTarget(JSON.stringify({
      $condition: { $eq: [{ $field: '$aasdesc#idShort' }, { $strVal: 'Example' }] },
    }), 'aas-repository')
    expect(wrongAasRepositoryRoot.isValid).toBe(false)
    expect(wrongAasRepositoryRoot.message).toContain('Allowed roots: $aas')

    const separatedRepositorySubmodelRoot = validateQueryForTarget(JSON.stringify({
      $condition: { $eq: [{ $field: '$sm#idShort' }, { $strVal: 'Nameplate' }] },
    }), 'aas-repository', 'full')
    expect(separatedRepositorySubmodelRoot.isValid).toBe(false)
    expect(separatedRepositorySubmodelRoot.message).toContain('Allowed roots: $aas')
    expect(separatedRepositorySubmodelRoot.message).toContain('only available with mono-all')
  })
})
