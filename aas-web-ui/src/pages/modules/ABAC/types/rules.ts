/**
 * ABAC Rule Types
 */

import type { AccessPermissionRuleFilter, AclEntry, AttributeSource, RouteObject } from '@/pages/modules/ABAC/types/definitions'
import type { FormulaExpression } from '@/pages/modules/ABAC/types/formula'

// ---------------------------------------------------------------------------
// Request / Response
// ---------------------------------------------------------------------------

export interface Rule {
  rule_id: number
  version_id: number
  policy_id: string
  service_scope: string
  rule_index: number
  matched_rule_id: string
  configured_rule_json: ConfiguredRule
  materialized_rule_json: Record<string, unknown>
  acl_json: AclEntry
  attributes_json: AttributeSource[]
  objects_json: RouteObject[]
  formula_json: FormulaExpression
  filters_json: AccessPermissionRuleFilter[]
  access: string
  rights: string[]
  rule_hash: string
  materialized_rule_hash: string
  created_at: string
}

export interface ConfiguredRule {
  ACL?: AclEntry
  USEACL?: string
  OBJECTS?: RouteObject[]
  USEOBJECTS?: string[]
  FORMULA?: FormulaExpression
  USEFORMULA?: string
  FILTER?: AccessPermissionRuleFilter
  FILTERLIST?: AccessPermissionRuleFilter[]
}

export interface RuleCreate {
  versionId: string
  payload: {
    position?: number
    rule: ConfiguredRule
  }
}

interface RuleOperation {
  versionId: string
  ruleIndex: number
}

export interface RuleDelete extends RuleOperation {}

export interface RuleDuplicate extends RuleOperation {}

export interface RuleMove extends RuleOperation {
  payload: { position: number }
}

export interface RulePatch extends RuleOperation {
  patch: Partial<ConfiguredRule>
}

export interface RuleReplace extends RuleOperation {
  rule: ConfiguredRule
}

export interface RuleToggle extends RuleOperation {
  payload: { enabled: boolean }
}
