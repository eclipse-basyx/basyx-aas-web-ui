import type { LiteralOperandState } from '../../types/forms'
import { describe, expect, it } from 'vitest'
import { decodeExpression, encodeExpression } from './expression'

describe('expression codec', () => {
  it('leaves unsupported expressions nested inside NOT available to JSON mode', () => {
    const expression = { $not: { $not: { $future: true } } }
    expect(decodeExpression(expression)).toBeUndefined()
    expect(expression).toEqual({ $not: { $not: { $future: true } } })
  })

  it.each([
    { $strVal: { nested: true } },
    { $strVal: 5 },
    { $numVal: null },
    { $numVal: true },
    { $numVal: [] },
    { $timeVal: [] },
    { $dateTimeVal: {} },
    { $hexVal: false },
  ])('keeps unsupported literal shapes in JSON mode: %j', operand => {
    expect(decodeExpression({ $eq: [operand, { $strVal: 'x' }] })).toBeUndefined()
  })

  it.each([
    { UNKNOWN: 'role' },
    { GLOBAL: 'OTHER' },
    { CLAIM: 'role', GLOBAL: 'LOCALNOW' },
    { CLAIM: 'role', extra: true },
    { CLAIM: 42 },
  ])('rejects unsupported expression attribute sources: %j', attributeSource => {
    expect(decodeExpression({ $eq: [{ $attribute: attributeSource }, { $strVal: 'x' }] })).toBeUndefined()
  })

  const supported: unknown[] = [
    { $boolean: true },
    { $eq: [{ $strVal: 'admin' }, { $attribute: { CLAIM: 'role' } }] },
    { $ne: [{ $numVal: 1 }, { $numVal: 2 }] },
    { $gt: [{ $numVal: 5 }, { $attribute: { GLOBAL: 'LOCALNOW' } }] },
    { $contains: [{ $attribute: { REFERENCE: 'ref' } }, { $strVal: 'x' }] },
    { '$starts-with': [{ $strVal: 'prefix' }, { $strVal: 'value' }] },
    { '$ends-with': [{ $strVal: 's' }, { $strVal: 'ends' }] },
    { $not: { $boolean: false } },
    { $and: [{ $eq: [{ $strVal: 'a' }, { $strVal: 'b' }] }, { $ne: [{ $numVal: 1 }, { $numVal: 2 }] }] },
    { $or: [{ $boolean: true }, { $eq: [{ $field: 'idShort' }, { $strVal: 'name' }] }] },
    { $match: [{ $eq: [{ $strVal: 'a' }, { $strVal: 'b' }] }] },
    { $regex: [{ $strVal: 'pattern' }, { $strVal: 'value' }] },
  ]

  it('round-trips supported expressions exactly', () => {
    for (const source of supported) {
      if (source === undefined) {
        continue
      }
      const state = decodeExpression(source)
      expect(state, JSON.stringify(source)).toBeDefined()
      expect(encodeExpression(state!)).toEqual(source)
    }
  })

  it('keeps $numVal values exactly as stored, including advisory strings', () => {
    const state = decodeExpression({ $eq: [{ $numVal: 'abc' }, { $strVal: 'x' }] })
    expect(state).toEqual({
      kind: 'comparison',
      operator: 'eq',
      left: { source: 'literal', literalOption: 'numVal', value: 'abc' },
      right: { source: 'literal', literalOption: 'strVal', value: 'x' },
    } satisfies {
      kind: 'comparison'
      operator: string
      left: LiteralOperandState
      right: LiteralOperandState
    })
    expect(encodeExpression(state!)).toEqual({ $eq: [{ $numVal: 'abc' }, { $strVal: 'x' }] })
  })

  it('recognizes all comparison operators', () => {
    for (const operator of ['eq', 'ne', 'gt', 'ge', 'lt', 'le', 'contains', 'starts-with', 'ends-with', 'regex']) {
      const key = `$${operator}`
      const state = decodeExpression({ [key]: [{ $field: 'a' }, { $strVal: 'b' }] })
      expect(state?.kind, key).toBe('comparison')
      if (state?.kind === 'comparison') {
        expect(state.operator).toBe(operator)
      }
    }
  })

  it('rejects unsupported constructs without altering them', () => {
    const unsupported: unknown[] = [
      { $strCast: { $attribute: { CLAIM: 'role' } } },
      { $numCast: { $strVal: '5' } },
      { $boolCast: { $attribute: { CLAIM: 'role' } } },
      { $dayOfWeek: { $dateTimeVal: '2024-01-01T00:00:00Z' } },
      { $month: { $attribute: { GLOBAL: 'LOCALNOW' } } },
      { $and: [{ $boolean: true }] },
      { $or: [] },
      { $match: [] },
      { $eq: [{ $strVal: 'a' }] },
      { $and: [{ $boolean: true }, { $boolean: false }], $or: [{ $boolean: true }] },
      { $unknown: [{ $boolean: true }] },
    ]
    for (const source of unsupported) {
      expect(decodeExpression(source), JSON.stringify(source)).toBeUndefined()
    }
  })
})
