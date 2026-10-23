import type { ExpressionState } from '../../types/forms'

/** Present nested NOTs and not-equals as one operator and a negation flag without changing the source. */
export function readExpressionNegation (expression: ExpressionState): { condition: ExpressionState, negated: boolean } {
  let condition = expression
  let negated = false
  while (condition.kind === 'not') {
    negated = !negated
    condition = condition.operand
  }
  if (condition.kind === 'comparison' && condition.operator === 'ne') {
    negated = !negated
    condition = { ...condition, operator: 'eq' }
  }
  return { condition, negated }
}

/** Use NE for negated equality, which is also supported inside match groups. */
export function writeExpressionNegation (condition: ExpressionState, negated: boolean): ExpressionState {
  if (!negated) {
    return condition
  }
  if (condition.kind === 'comparison' && condition.operator === 'eq') {
    return { ...condition, operator: 'ne' }
  }
  return { kind: 'not', operand: condition }
}
