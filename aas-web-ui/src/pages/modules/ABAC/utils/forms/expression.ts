import type { ComparisonOperator, ExpressionState, LiteralOperandState, LiteralOption } from '../../types/forms'
import { COMPARISON_OPERATORS, LITERAL_OPTIONS } from '../../constants/forms'
import { isObject } from '../object'
import { decodeAttributeSource } from './attributes'

/**
 * Codec between logical expressions of the pinned access-rule schema and the
 * structured form state. The supported subset deliberately excludes casts and
 * related value operators ($strCast, $numCast, $hexCast, $dateTimeCast,
 * $timeCast, $boolCast, $dayOfWeek, $dayOfMonth, $month, $year): expressions
 * using them are not representable and stay editable in JSON mode, preserving
 * their content exactly.
 */

const GROUP_KEYS = new Set(['$and', '$or', '$match'])

type SupportedOperator = Exclude<ExpressionState['kind'], 'comparison' | 'empty'> | ComparisonOperator

const OPERATOR_KEYS = {
  'and': '$and',
  'or': '$or',
  'not': '$not',
  'match': '$match',
  'boolean': '$boolean',
  'eq': '$eq',
  'ne': '$ne',
  'gt': '$gt',
  'ge': '$ge',
  'lt': '$lt',
  'le': '$le',
  'contains': '$contains',
  'starts-with': '$starts-with',
  'ends-with': '$ends-with',
  'regex': '$regex',
} as const satisfies { [K in SupportedOperator]: `$${K}` }

const LITERAL_KEYS = {
  strVal: '$strVal',
  numVal: '$numVal',
  hexVal: '$hexVal',
  dateTimeVal: '$dateTimeVal',
  timeVal: '$timeVal',
  boolean: '$boolean',
} as const satisfies { [K in LiteralOption]: `$${K}` }

/** Encodes the current draft without coercing values or checking schema validity. */
export function encodeOperand (operandState: LiteralOperandState): { [propertyName: string]: unknown } {
  switch (operandState.source) {
    case 'literal': { return { [LITERAL_KEYS[operandState.literalOption]]: operandState.value }
    }
    case 'field': { return { $field: operandState.value }
    }
    case 'attribute': { return { $attribute: { [operandState.kind]: operandState.value } }
    }
  }
}

function decodeOperand (inputValue: unknown): LiteralOperandState | undefined {
  const operand = isObject(inputValue) ? inputValue : undefined
  if (!operand) {
    return undefined
  }
  const propertyNames = Object.keys(operand)
  // Multiple or unknown keys (for example casts) are not representable.
  if (propertyNames.length !== 1) {
    return undefined
  }
  const operandKey = propertyNames[0]!
  const operandValue = operand[operandKey]

  if (operandKey === LITERAL_KEYS.boolean) {
    return typeof operandValue === 'boolean' ? { source: 'literal', literalOption: 'boolean', value: operandValue } : undefined
  }
  if (operandKey === '$field') {
    return typeof operandValue === 'string' ? { source: 'field', value: operandValue } : undefined
  }
  if (operandKey === '$attribute') {
    const attributeSource = decodeAttributeSource(operandValue)
    return attributeSource ? { source: 'attribute', ...attributeSource } : undefined
  }
  for (const option of LITERAL_OPTIONS) {
    if (operandKey !== LITERAL_KEYS[option] || option === 'boolean') {
      continue
    }
    // Numeric draft strings stay unchanged; the other literal controls edit text.
    if (typeof operandValue !== 'string' && !(option === 'numVal' && typeof operandValue === 'number' && Number.isFinite(operandValue))) {
      return undefined
    }
    return { source: 'literal', literalOption: option, value: operandValue }
  }
  return undefined
}

/**
 * Decodes the subset supported by the controls; undefined keeps the expression in JSON mode.
 * Empty expressions and unfinished scalar text are drafts, not proof of schema validity.
 */
export function decodeExpression (inputValue: unknown): ExpressionState | undefined {
  const expressionDocument = isObject(inputValue) ? inputValue : undefined
  if (!expressionDocument) {
    return undefined
  }
  const propertyNames = Object.keys(expressionDocument)
  if (propertyNames.length > 1) {
    return undefined
  }
  if (propertyNames.length === 0) {
    return { kind: 'empty' }
  }
  const operatorKey = propertyNames[0]!
  const operatorValue = expressionDocument[operatorKey]

  if (operatorKey === OPERATOR_KEYS.boolean) {
    if (typeof operatorValue !== 'boolean') {
      return undefined
    }
    return { kind: 'boolean', value: operatorValue }
  }

  if (operatorKey === OPERATOR_KEYS.not) {
    const operand = decodeExpression(operatorValue)
    return operand === undefined ? undefined : { kind: 'not', operand }
  }

  if (GROUP_KEYS.has(operatorKey)) {
    if (!Array.isArray(operatorValue)) {
      return undefined
    }
    const items: ExpressionState[] = []
    for (const entry of operatorValue) {
      const decodedExpression = decodeExpression(entry)
      if (decodedExpression === undefined) {
        return undefined
      }
      items.push(decodedExpression)
    }
    const minimumItems = operatorKey === OPERATOR_KEYS.match ? 1 : 2
    if (items.length < minimumItems) {
      return undefined
    }
    return { kind: operatorKey.slice(1) as 'and' | 'or' | 'match', items }
  }

  const operator = COMPARISON_OPERATORS.find(candidate => OPERATOR_KEYS[candidate] === operatorKey)
  if (!operator) {
    return undefined
  }
  if (!Array.isArray(operatorValue) || operatorValue.length !== 2) {
    return undefined
  }
  const left = decodeOperand(operatorValue[0])
  const right = decodeOperand(operatorValue[1])
  if (left === undefined || right === undefined) {
    return undefined
  }
  return { kind: 'comparison', operator, left, right }
}

export function encodeExpression (expressionState: ExpressionState): { [propertyName: string]: unknown } {
  switch (expressionState.kind) {
    case 'empty': { return {}
    }
    case 'boolean': { return { $boolean: expressionState.value }
    }
    case 'not': { return { $not: encodeExpression(expressionState.operand) }
    }
    case 'and':
    case 'or':
    case 'match': { return { [OPERATOR_KEYS[expressionState.kind]!]: expressionState.items.map(item => encodeExpression(item)) }
    }
    case 'comparison': { return {
      [OPERATOR_KEYS[expressionState.operator]!]: [encodeOperand(expressionState.left), encodeOperand(expressionState.right)],
    }
    }
  }
}
