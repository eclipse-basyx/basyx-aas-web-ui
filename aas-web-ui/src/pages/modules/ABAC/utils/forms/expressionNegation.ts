import type { ExpressionState } from '../../types/forms'

/**
 * Read outer NOT parity without treating NE as negated equality.
 */
export function readExpressionNegation (expression: ExpressionState): { condition: ExpressionState, negated: boolean } {
  let condition = expression
  let negated = false
  while (condition.kind === 'not') {
    negated = !negated
    condition = condition.operand
  }
  return { condition, negated }
}

/**
 * An explicit Negated selection controls outer NOT, independently of the comparison.
 */
export function writeExpressionNegation (condition: ExpressionState, negated: boolean): ExpressionState {
  return negated ? { kind: 'not', operand: condition } : condition
}

/**
 * Operand and operator edits retain every original NOT wrapper, including double NOT.
 */
export function replaceExpressionCondition (expression: ExpressionState, condition: ExpressionState): ExpressionState {
  return expression.kind === 'not'
    ? { ...expression, operand: replaceExpressionCondition(expression.operand, condition) }
    : condition
}
