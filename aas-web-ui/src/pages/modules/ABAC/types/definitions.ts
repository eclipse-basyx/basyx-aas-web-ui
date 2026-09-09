import type { FormulaExpression } from '@/pages/modules/ABAC/types/formula'

export const DEFINITION_KINDS = ['attributes', 'acls', 'objects', 'formulas'] as const
export type DefinitionKind = (typeof DEFINITION_KINDS)[number]

export type GlobalAttribute = 'LOCALNOW' | 'UTCNOW' | 'CLIENTNOW' | 'ANONYMOUS'
export interface AttributeSource {
  CLAIM?: string
  GLOBAL?: GlobalAttribute
  REFERENCE?: string
}

export interface DefAttribute {
  name: string
  attributes?: AttributeSource[]
  USEATTRIBUTES?: string[]
}

export type AccessRight = 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'EXECUTE' | 'VIEW' | 'ALL'
export type AccessDecision = 'ALLOW' | 'DISABLED'

export interface AclEntry {
  ACCESS: AccessDecision
  RIGHTS: AccessRight[]
  ATTRIBUTES?: AttributeSource[]
  USEATTRIBUTES?: string
}

export interface DefAcl {
  name: string
  acl: AclEntry
}

export type RouteObject
  = | { ROUTE: string }
    | { IDENTIFIABLE: string }
    | { REFERABLE: string }
    | { FRAGMENT: string }
    | { DESCRIPTOR: string }

export interface DefObject {
  name: string
  objects?: RouteObject[]
  USEOBJECTS?: string[]
}

export interface DefFormula {
  name: string
  formula: FormulaExpression
}

export interface AccessPermissionRuleFilter {
  FRAGMENT: string
  MATCH?: boolean
  CONDITION?: FormulaExpression
  USEFORMULA?: string
}

export type Definition = DefAttribute | DefAcl | DefObject | DefFormula

// ---------------------------------------------------------------------------
// Request / Response
// ---------------------------------------------------------------------------

export interface DefinitionsMap {
  attributes: DefAttribute[]
  acls: DefAcl[]
  objects: DefObject[]
  formulas: DefFormula[]
}

export interface DefinitionCreatePayload {
  name: string
  attributes?: AttributeSource[]
  USEATTRIBUTES?: string[]
  acl?: AclEntry
  objects?: RouteObject[]
  USEOBJECTS?: string[]
  formula?: FormulaExpression
}

export interface DefinitionCreate {
  versionId: string
  kind: DefinitionKind
  payload: DefinitionCreatePayload
}

export interface DefinitionDelete {
  versionId: string
  kind: DefinitionKind
  name: string
}

export interface DefinitionPatch {
  versionId: string
  kind: DefinitionKind
  name: string
  patch: Partial<DefinitionCreatePayload>
}

export interface DefinitionReplace {
  versionId: string
  kind: DefinitionKind
  name: string
  payload: DefinitionCreatePayload
}
