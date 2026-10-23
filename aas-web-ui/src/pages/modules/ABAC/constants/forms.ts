import type { ComparisonOperator, LiteralOption } from '../types/forms'

export { DEFINITION_SCHEMA_PROPERTIES as DEFINITION_LIST_KEYS } from '../types/definitions'

export const COMPARISON_OPERATORS = ['eq', 'ne', 'gt', 'ge', 'lt', 'le', 'contains', 'starts-with', 'ends-with', 'regex'] as const satisfies readonly ComparisonOperator[]

export const LITERAL_OPTIONS = ['strVal', 'numVal', 'hexVal', 'dateTimeVal', 'timeVal', 'boolean'] as const satisfies readonly LiteralOption[]

/** Standard property paths without resource-specific element names; suggestions are checked against the pinned schema in tests. */
export const FIELD_PATH_SUGGESTIONS = ['$aas#idShort', '$sm#idShort', '$sm#semanticId', '$cd#idShort'] as const
