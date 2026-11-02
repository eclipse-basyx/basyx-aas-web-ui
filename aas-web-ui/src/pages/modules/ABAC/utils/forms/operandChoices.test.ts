import type { ComparisonOperator, LiteralOperandState } from '../../types/forms'
import Ajv from 'ajv'
import { describe, expect, it } from 'vitest'
import schema from '@/schemas/access-rules/aas-queries-and-access-rules-3.2.schema.json'
import { FIELD_PATH_SUGGESTIONS } from '../../constants/forms'
import { encodeOperand } from './expression'
import { isOperandChoiceAllowed } from './operandChoices'

const text: LiteralOperandState = { source: 'literal', literalOption: 'strVal', value: 'x' }
const number: LiteralOperandState = { source: 'literal', literalOption: 'numVal', value: 1 }
const boolean: LiteralOperandState = { source: 'literal', literalOption: 'boolean', value: true }
const field: LiteralOperandState = { source: 'field', value: '$sm#idShort' }
const claim: LiteralOperandState = { source: 'attribute', kind: 'CLAIM', value: 'role' }
const anonymous: LiteralOperandState = { source: 'attribute', kind: 'GLOBAL', value: 'ANONYMOUS' }
const now: LiteralOperandState = { source: 'attribute', kind: 'GLOBAL', value: 'UTCNOW' }
const date: LiteralOperandState = { source: 'literal', literalOption: 'dateTimeVal', value: '2026-10-23T00:00:00Z' }

describe('schema-compatible operand choices', () => {
  it.each<{ operator: ComparisonOperator, left: LiteralOperandState, right: LiteralOperandState, allowed: boolean }>([
    { operator: 'eq', left: boolean, right: boolean, allowed: true },
    { operator: 'ne', left: boolean, right: field, allowed: true },
    { operator: 'gt', left: boolean, right: boolean, allowed: false },
    { operator: 'le', left: number, right: field, allowed: true },
    { operator: 'eq', left: text, right: number, allowed: false },
    { operator: 'eq', left: number, right: claim, allowed: false },
    { operator: 'eq', left: claim, right: text, allowed: true },
    { operator: 'eq', left: anonymous, right: text, allowed: true },
    { operator: 'ge', left: now, right: date, allowed: true },
    { operator: 'eq', left: now, right: field, allowed: false },
    { operator: 'eq', left: now, right: now, allowed: false },
    { operator: 'eq', left: now, right: text, allowed: true },
    { operator: 'eq', left: field, right: field, allowed: false },
    { operator: 'contains', left: field, right: field, allowed: false },
    { operator: 'starts-with', left: anonymous, right: text, allowed: true },
    { operator: 'regex', left: number, right: text, allowed: false },
  ])('$operator permits $left with $right: $allowed', ({ operator, left, right, allowed }) => {
    expect(isOperandChoiceAllowed(operator, left, right)).toBe(allowed)
  })

  it('agrees with the pinned schema for supported type pairs when the peer can participate in the operator', () => {
    const ajv = new Ajv({ strict: false, unicodeRegExp: false, ignoreKeywordsWithRef: true, logger: false })
    const operands: LiteralOperandState[] = [text, number, boolean, field, claim, anonymous, now, date,
      { source: 'literal', literalOption: 'hexVal', value: '16#AB' },
      { source: 'literal', literalOption: 'timeVal', value: '12:00:00Z' },
      { source: 'attribute', kind: 'REFERENCE', value: '$sm("subject")#idShort' },
      { source: 'attribute', kind: 'GLOBAL', value: 'LOCALNOW' },
      { source: 'attribute', kind: 'GLOBAL', value: 'CLIENTNOW' },
    ]
    const operators: ComparisonOperator[] = ['eq', 'ne', 'gt', 'ge', 'lt', 'le', 'contains', 'starts-with', 'ends-with', 'regex']
    for (const operator of operators) {
      const definition = ['contains', 'starts-with', 'ends-with', 'regex'].includes(operator)
        ? 'stringItems'
        : (['eq', 'ne'].includes(operator) ? 'equalityComparisonItems' : 'orderedComparisonItems')
      const validate = ajv.compile({ definitions: schema.definitions, $ref: `#/definitions/${definition}` })
      for (const left of operands) {
        for (const right of operands) {
          // An incompatible existing peer allows repair, covered separately below.
          if ((!['eq', 'ne'].includes(operator) && right.source === 'literal' && right.literalOption === 'boolean')
            || (definition === 'stringItems' && right.source === 'literal' && right.literalOption !== 'strVal')) {
            continue
          }
          const pair = [encodeOperand(left), encodeOperand(right)]
          expect(isOperandChoiceAllowed(operator, left, right), `${operator}: ${JSON.stringify(pair)}`).toBe(validate(pair))
        }
      }
    }
  })

  it('offers only schema-valid field path examples', () => {
    const ajv = new Ajv({ strict: false, unicodeRegExp: false, ignoreKeywordsWithRef: true, logger: false })
    const validate = ajv.compile({ definitions: schema.definitions, $ref: '#/definitions/FieldIdentifier' })
    for (const path of FIELD_PATH_SUGGESTIONS) {
      expect(validate(path), path).toBe(true)
    }
  })

  it('allows repairing a non-text operand after changing to a string operator', () => {
    expect(isOperandChoiceAllowed('contains', text, number)).toBe(true)
    expect(isOperandChoiceAllowed('contains', number, text)).toBe(false)
  })

  it('allows repairing existing Boolean operands after changing to an ordered operator', () => {
    expect(isOperandChoiceAllowed('gt', text, boolean)).toBe(true)
    expect(isOperandChoiceAllowed('gt', boolean, text)).toBe(false)
  })
})
