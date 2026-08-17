/**
 * Formula Complexity Classification
 *
 * A hard-coded, heuristic classification that estimates the evaluation cost
 * of a formula expression without talking to the BE.
 *
 * Classification rules (Phase 1):
 * - LOW: No $field access in the expression tree → data-independent complexity
 * - DATA_DRIVEN: At least one $field access → data-driven complexity
 *
 */

import type { FormulaExpression } from '@/pages/modules/ABAC/types/formula'

export type Complexity = 'N/A' | 'LOW' | 'DATA_DRIVEN'

/**
 * Deep-walk a FormulaExpression tree and return true if any node
 * contains a $field key.
 */
export function hasFieldAccess (node: unknown): boolean {
  if (node === null || node === undefined) {
    return false
  }

  if (Array.isArray(node)) {
    return node.some(element => hasFieldAccess(element))
  }

  if (typeof node === 'object') {
    const obj = node as Record<string, unknown>
    const keys = Object.keys(obj)

    if (keys.includes('$field')) {
      return true
    }

    // Recurse into children
    return keys.some(key => hasFieldAccess(obj[key]))
  }

  return false
}

export function classifyFormulaComplexity (formula?: FormulaExpression): Complexity {
  if (!formula) {
    return 'N/A'
  }

  if (hasFieldAccess(formula)) {
    return 'DATA_DRIVEN'
  }

  return 'LOW'
}
