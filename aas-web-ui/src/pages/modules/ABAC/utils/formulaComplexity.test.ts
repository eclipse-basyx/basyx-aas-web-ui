import type { FormulaExpression } from '@/composables/Client/ABAC/types/formula'
import { describe, expect, it } from 'vitest'
import { classifyFormulaComplexity, hasFieldAccess } from './formulaComplexity'

const simpleBool: FormulaExpression = { $boolean: true }

const stringCmp: FormulaExpression = {
  $eq: [
    { $strVal: 'hello' },
    { $strVal: 'hello' },
  ],
}

const withFieldAccess: FormulaExpression = {
  $eq: [
    { $field: 'semanticId' },
    { $strVal: 'some-value' },
  ],
}

const nestedLogicalWithField: FormulaExpression = {
  $and: [
    {
      $eq: [
        { $field: 'idShort' },
        { $strVal: 'myAas' },
      ],
    },
    {
      $ne: [
        { $attribute: { CLAIM: 'role' } },
        { $strVal: 'admin' },
      ],
    },
  ],
}

const deepNestedNoField: FormulaExpression = {
  $and: [
    {
      $or: [
        {
          $ge: [
            { $dayOfMonth: { $dateTimeCast: { $attribute: { GLOBAL: 'UTCNOW' } } } },
            { $numVal: 15 },
          ],
        },
        { $boolean: true },
      ],
    },
    {
      $not: {
        $eq: [
          { $strCast: { $attribute: { CLAIM: 'department' } } },
          { $strVal: 'engineering' },
        ],
      },
    },
  ],
}

const matchWithField: FormulaExpression = {
  $match: [
    {
      $eq: [
        { $field: 'assetType' },
        { $strVal: 'MyAssetType' },
      ],
    },
  ],
}

const matchNoField: FormulaExpression = {
  $match: [
    {
      $eq: [
        { $strVal: 'assetType' },
        { $strVal: 'MyAssetType' },
      ],
    },
  ],
}

const castWithField: FormulaExpression = {
  $eq: [
    { $boolCast: { $field: 'enabled' } },
    { $boolean: true },
  ],
}

describe('hasFieldAccess', () => {
  it('returns false for null / undefined / primitives', () => {
    expect(hasFieldAccess(null)).toBe(false)
    expect(hasFieldAccess(undefined)).toBe(false)
    expect(hasFieldAccess(42)).toBe(false)
    expect(hasFieldAccess('hello')).toBe(false)
  })

  it('returns false for a simple boolean expression', () => {
    expect(hasFieldAccess(simpleBool)).toBe(false)
  })

  it('returns false for a simple string comparison', () => {
    expect(hasFieldAccess(stringCmp)).toBe(false)
  })

  it('returns true when a direct $field operand exists', () => {
    expect(hasFieldAccess(withFieldAccess)).toBe(true)
  })

  it('returns true when $field is nested inside $and', () => {
    expect(hasFieldAccess(nestedLogicalWithField)).toBe(true)
  })

  it('returns false for a deep tree with no $field', () => {
    expect(hasFieldAccess(deepNestedNoField)).toBe(false)
  })

  it('returns true when $field is inside $match', () => {
    expect(hasFieldAccess(matchWithField)).toBe(true)
  })

  it('returns false for $match with no $field', () => {
    expect(hasFieldAccess(matchNoField)).toBe(false)
  })

  it('returns true when $field is wrapped inside $boolCast', () => {
    expect(hasFieldAccess(castWithField)).toBe(true)
  })

  it('detects $field inside an array', () => {
    expect(hasFieldAccess([{ $field: 'x' }])).toBe(true)
  })

  it('detects $field deep inside a complex object', () => {
    const deep = {
      a: {
        b: [
          { c: { d: [{ $field: 'found' }] } },
        ],
      },
    }
    expect(hasFieldAccess(deep)).toBe(true)
  })
})

describe('classifyFormulaComplexity', () => {
  it('returns N/A for undefined formula', () => {
    const result = classifyFormulaComplexity(undefined)
    expect(result).toBe('N/A')
  })

  it('returns LOW for a simple boolean', () => {
    const result = classifyFormulaComplexity(simpleBool)
    expect(result).toBe('LOW')
  })

  it('returns LOW for string comparison', () => {
    const result = classifyFormulaComplexity(stringCmp)
    expect(result).toBe('LOW')
  })

  it('returns DATA_DRIVEN for a formula with $field', () => {
    const result = classifyFormulaComplexity(withFieldAccess)
    expect(result).toBe('DATA_DRIVEN')
  })

  it('returns DATA_DRIVEN for nested logical with $field', () => {
    const result = classifyFormulaComplexity(nestedLogicalWithField)
    expect(result).toBe('DATA_DRIVEN')
  })

  it('returns LOW for deep nested tree with no $field', () => {
    const result = classifyFormulaComplexity(deepNestedNoField)
    expect(result).toBe('LOW')
  })

  it('returns DATA_DRIVEN for $match with $field', () => {
    const result = classifyFormulaComplexity(matchWithField)
    expect(result).toBe('DATA_DRIVEN')
  })

  it('returns LOW for $match with no $field', () => {
    const result = classifyFormulaComplexity(matchNoField)
    expect(result).toBe('LOW')
  })
})
