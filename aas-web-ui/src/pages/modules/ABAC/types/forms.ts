import type { ACL, AttributeItem, LogicalExpression, ObjectItem, Value } from '@/schemas/access-rules/types/accessRules.generated'

/**
 * Form states model only what the guided editors can represent. Documents keep
 * every extra property verbatim; limitations name the content that cannot be
 * represented faithfully so dialogs keep the JSON editor authoritative there.
 */

export type DocumentEditorMode = 'form' | 'json'

export type AttributeSourceKind = keyof AttributeItem
export type AttributeGlobalValue = NonNullable<AttributeItem['GLOBAL']>

export interface AttributeSourceState {
  kind: AttributeSourceKind
  value: string
}

export type ObjectItemKind = keyof ObjectItem

export interface ObjectItemState {
  kind: ObjectItemKind
  value: string
}

export type AccessValue = ACL['ACCESS']

type WithoutDollar<T> = T extends `$${infer Name}` ? Name : never
export type ExpressionOperator = WithoutDollar<keyof LogicalExpression>

/**
 * Comparison operators have exactly two operands in the generated grammar.
 */
export type ComparisonOperator = WithoutDollar<{
  [K in keyof LogicalExpression]-?: NonNullable<LogicalExpression[K]> extends readonly [unknown, unknown] ? K : never
}[keyof LogicalExpression]>

/**
 * Literal choices come from scalar value members; field references have separate controls.
 */
export type LiteralOption = WithoutDollar<Exclude<{
  [K in keyof Value]-?: NonNullable<Value[K]> extends string | number | boolean ? K : never
}[keyof Value], '$field'>>

export interface AclState {
  access?: AccessValue
  rights?: string[]
  attributes?: AttributeSourceState[]
  useAttributes?: string
}

export interface AttributesDefinitionState {
  entries: AttributeSourceState[]
  references: string[]
}

export interface AclsDefinitionState {
  acl: AclState
}

export interface ListWithReferences<T> {
  entries: T[]
  references: string[]
}

/**
 * Object definitions combine inline entries and references to other object collections.
 */
export type ObjectsDefinitionState = ListWithReferences<ObjectItemState>

export interface FormulasDefinitionState {
  expression: ExpressionState | null
}

export type RuleAclState = { mode: 'inline', acl: AclState } | { mode: 'reference', name?: string }
export type RuleFormulaState = { mode: 'inline', formula: ExpressionState | null } | { mode: 'reference', name?: string }
export interface RuleFilterState {
  fragment?: string
  condition?: { mode: 'inline', condition: ExpressionState | null } | { mode: 'reference', name?: string }
}
export interface RuleState {
  acl: RuleAclState
  objects: ListWithReferences<ObjectItemState>
  formula: RuleFormulaState
  filters: RuleFilterState[]
}

export type LiteralOperandState
  = | { source: 'literal', literalOption: Exclude<LiteralOption, 'boolean'>, value: string | number }
    | { source: 'literal', literalOption: 'boolean', value: boolean }
    | { source: 'field', value: string }
    | { source: 'attribute', kind: AttributeSourceKind, value: string }

export type ExpressionState
  = | { kind: 'boolean', value: boolean }
    | { kind: 'empty' }
    | { kind: 'not', operand: ExpressionState }
    | { kind: 'and' | 'or' | 'match', items: ExpressionState[] }
    | { kind: 'comparison', operator: ComparisonOperator, left: LiteralOperandState, right: LiteralOperandState }

export type DefinitionFormState
  = | { kind: 'attributes', attributes: AttributesDefinitionState }
    | { kind: 'acls', acls: AclsDefinitionState }
    | { kind: 'objects', objects: ObjectsDefinitionState }
    | { kind: 'formulas', formulas: FormulasDefinitionState }

/**
 * Stable limitation tokens for content the guided form cannot represent;
 * dialogs translate them and keep the JSON editor open.
 */
export type FormLimitation
  = | 'malformed'
    | 'notAnObject'
    | 'structure'
    | 'attributeItem'
    | 'rights'
    | 'expression'

export type Representation = { ok: true } | { ok: false, limitation: FormLimitation }
