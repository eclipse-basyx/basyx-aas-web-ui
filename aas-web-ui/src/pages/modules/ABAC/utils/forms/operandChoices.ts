import type { ComparisonOperator, LiteralOperandState, LiteralOption } from '../../types/forms'

const STRING_OPERATORS: ReadonlySet<ComparisonOperator> = new Set(['contains', 'starts-with', 'ends-with', 'regex'])
const ORDERED_TYPES: readonly LiteralOption[] = ['numVal', 'hexVal', 'dateTimeVal', 'timeVal']

function isStringOperand (operand: LiteralOperandState): boolean {
  return operand.source !== 'literal' || operand.literalOption === 'strVal'
}

function isStringPair (operand: LiteralOperandState, other: LiteralOperandState): boolean {
  return isStringOperand(operand) && isStringOperand(other)
    && (operand.source !== 'field' || other.source !== 'field')
}

function hasType (operand: LiteralOperandState, type: LiteralOption): boolean {
  if (operand.source === 'literal') {
    return operand.literalOption === type
  }
  return type === 'dateTimeVal' && operand.source === 'attribute' && operand.kind === 'GLOBAL'
    && ['LOCALNOW', 'UTCNOW', 'CLIENTNOW'].includes(operand.value)
}

/**
 * Follows the pinned schema's scalar operand shapes, covered against that schema
 * in tests. Draft values and field paths still undergo ordinary validation.
 */
export function isOperandChoiceAllowed (operator: ComparisonOperator, operand: LiteralOperandState, other?: LiteralOperandState): boolean {
  if (STRING_OPERATORS.has(operator)) {
    return isStringOperand(operand) && (!other || !isStringOperand(other) || isStringPair(operand, other))
  }

  const equality = operator === 'eq' || operator === 'ne'
  if (!equality && hasType(operand, 'boolean')) {
    return false
  }
  // An existing operand made invalid by an operator change must not prevent repair.
  if (!other || (!equality && hasType(other, 'boolean'))) {
    return true
  }

  let shapes = Number(isStringPair(operand, other))
  const types = equality ? [...ORDERED_TYPES, 'boolean' as const] : ORDERED_TYPES
  for (const type of types) {
    if ((hasType(operand, type) && (hasType(other, type) || other.source === 'field'))
      || (operand.source === 'field' && hasType(other, type))) {
      shapes++
    }
  }
  // The schema's oneOf requires exactly one comparison shape, including for time globals.
  return shapes === 1
}
