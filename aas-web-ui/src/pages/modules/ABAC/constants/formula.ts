import type { FormulaOperator } from '../types/formula'
import source from '@/schemas/access-rules/aas-queries-and-access-rules-3.1.schema.json'

export const FORMULA_OPERATORS = Object.keys(source.definitions.logicalExpression.properties) as FormulaOperator[]
