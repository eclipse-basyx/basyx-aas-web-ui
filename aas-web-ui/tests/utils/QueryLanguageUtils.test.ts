import { describe, expect, it } from 'vitest'
import {
  buildQueryEndpoint,
  buildQuickSearchQuery,
  escapeRegexLiteral,
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
  })
})
