import type { FormulaOperator } from '../types/formula'
import source from '@/schemas/access-rules/aas-queries-and-access-rules-3.2.schema.json'

export const FORMULA_OPERATORS = Object.keys(source.definitions.logicalExpression.properties) as FormulaOperator[]

export const FORMULA_GROUP_MIN_ITEMS = {
  and: source.definitions.logicalExpression.properties.$and.minItems,
  or: source.definitions.logicalExpression.properties.$or.minItems,
  match: source.definitions.logicalExpression.properties.$match.minItems,
} as const
