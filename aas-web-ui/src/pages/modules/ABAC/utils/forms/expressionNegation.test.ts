import type { ExpressionState } from '../../types/forms'
import { describe, expect, it } from 'vitest'
import { encodeExpression } from './expression'
import { readExpressionNegation, writeExpressionNegation } from './expressionNegation'

const equality: ExpressionState = {
  kind: 'comparison',
  operator: 'eq',
  left: { source: 'literal', literalOption: 'strVal', value: 'admin' },
  right: { source: 'attribute', kind: 'CLAIM', value: 'role' },
}

describe('expression negation controls', () => {
  it('wraps non-equality comparisons in NOT and restores the original when disabled', () => {
    const comparison: ExpressionState = { ...equality, operator: 'contains' }
    const negated = writeExpressionNegation(comparison, true)
    expect(encodeExpression(negated)).toEqual({ $not: { $contains: [{ $strVal: 'admin' }, { $attribute: { CLAIM: 'role' } }] } })
    expect(readExpressionNegation(negated)).toEqual({ condition: comparison, negated: true })
    expect(writeExpressionNegation(readExpressionNegation(negated).condition, false)).toEqual(comparison)
    expect(comparison.operator).toBe('contains')
  })

  it('shows not-equals and NOT equals as the same controls without mutating the source', () => {
    const notEquals: ExpressionState = { ...equality, operator: 'ne' }
    expect(readExpressionNegation(notEquals)).toEqual({ condition: equality, negated: true })
    expect(readExpressionNegation({ kind: 'not', operand: equality })).toEqual({ condition: equality, negated: true })
    expect(notEquals.operator).toBe('ne')
  })

  it('cancels repeated NOTs, including NOT of not-equals', () => {
    expect(readExpressionNegation({ kind: 'not', operand: { kind: 'not', operand: equality } }))
      .toEqual({ condition: equality, negated: false })
    expect(readExpressionNegation({ kind: 'not', operand: { ...equality, operator: 'ne' } }))
      .toEqual({ condition: equality, negated: false })
  })

  it('encodes negated equality as NE, including within a match group', () => {
    const negated = writeExpressionNegation(equality, true)
    expect(encodeExpression({ kind: 'match', items: [negated] })).toEqual({
      $match: [{ $ne: [{ $strVal: 'admin' }, { $attribute: { CLAIM: 'role' } }] }],
    })
    expect(writeExpressionNegation(readExpressionNegation(negated).condition, false)).toEqual(equality)
  })

  it('negates an entire group without changing its children', () => {
    const group: ExpressionState = { kind: 'and', items: [equality, { kind: 'boolean', value: true }] }
    const negated = writeExpressionNegation(group, true)
    expect(negated).toEqual({ kind: 'not', operand: group })
    expect(readExpressionNegation(negated).condition).toBe(group)
    expect(writeExpressionNegation(group, false)).toBe(group)
  })

  it('keeps boolean values separate from their negation', () => {
    const constant: ExpressionState = { kind: 'boolean', value: false }
    expect(encodeExpression(writeExpressionNegation(constant, true))).toEqual({ $not: { $boolean: false } })
    expect(readExpressionNegation(writeExpressionNegation(constant, true)))
      .toEqual({ condition: constant, negated: true })
  })
})
