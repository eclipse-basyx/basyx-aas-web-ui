import { describe, expect, it } from 'vitest'
import {
  buildQueryEndpoint,
  buildQuickSearchQuery,
  buildStructuredSearchQuery,
  createQueryFilter,
  escapeRegexLiteral,
  formatQueryFilter,
  getQueryFilterFields,
  parseQuerySearchExpression,
  supportsQueryProfile,
  validateQueryForTarget,
} from '@/utils/QueryLanguageUtils'

describe('QueryLanguageUtils', () => {
  it('recognizes version-tolerant IDTA query profiles', () => {
    expect(supportsQueryProfile({
      profiles: [
        'https://admin-shell.io/aas/API/3/2/AssetAdministrationShellRepositoryServiceSpecification/SSP-003',
      ],
    }, 'aas-repository')).toBe(true)

    expect(supportsQueryProfile({
      profiles: [
        'https://admin-shell.io/aas/API/3/1/SubmodelRepositoryServiceSpecification/SSP-005/',
      ],
    }, 'submodel-repository')).toBe(true)

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

    expect(conditions).toHaveLength(4)
    expect(conditions[0].$regex).toEqual([
      { $field: '$sm#id' },
      { $strVal: String.raw`(?i)Pump \(A\)\+` },
    ])
    expect(buildQuickSearchQuery('aas-repository', '  ')).toBeUndefined()
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
            $and: [
              {
                $regex: [
                  { $field: '$aas#idShort' },
                  { $strVal: String.raw`(?i)Motor\.1` },
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
          $regex: [
            { $field: '$sm#semanticId.keys[].value' },
            { $strVal: String.raw`(?i)^0173\.` },
          ],
        },
        {
          $regex: [
            { $field: '$sm#idShort' },
            { $strVal: '^Motor-[0-9]+$' },
          ],
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
    expect(formatQueryFilter('aas-registry', {
      id: 'kind',
      field: 'assetKind',
      operator: 'equals',
      value: 'NotApplicable',
    })).toBe('Asset Kind equals Not Applicable')
  })

  it('ignores incomplete or target-incompatible visual filters', () => {
    expect(buildStructuredSearchQuery('aas-registry', '', [
      { id: 'empty', field: 'idShort', operator: 'contains', value: '  ' },
    ], 'all')).toBeUndefined()

    expect(buildStructuredSearchQuery('submodel-repository', '', [
      { id: 'aas-only', field: 'assetKind', operator: 'equals', value: 'Instance' },
    ], 'all')).toBeUndefined()
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
        $fragment: '$sme#value',
        $condition: { $boolean: true },
      }],
    }), 'aas-repository').isValid).toBe(false)

    expect(validateQueryForTarget(JSON.stringify({
      $condition: { $boolean: true },
      $filters: [{
        $fragment: '$sme#value',
        $condition: { $boolean: true },
      }],
    }), 'aas-repository', 'mono-all').isValid).toBe(true)

    expect(validateQueryForTarget(JSON.stringify({
      $condition: {
        $and: [
          { $eq: [{ $field: '$sm#idShort' }, { $strVal: 'Nameplate' }] },
          { $eq: [{ $field: '$sme.ManufacturerName#value' }, { $strVal: 'Example' }] },
        ],
      },
    }), 'aas-repository', 'mono-repo').isValid).toBe(true)

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
    expect(separatedRepositorySubmodelRoot.message).toContain('only available with mono-repo or mono-all')
  })
})
