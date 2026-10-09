/**
 * ABAC Rule Types
 */

import type { JsonObject } from './json'

export interface RuleBase {
  versionId: string
  ruleIndex: number
}

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
  configured_rule_json: JsonObject
  materialized_rule_json: JsonObject
  acl_json?: JsonObject | null
  attributes_json?: JsonObject[] | null
  objects_json?: JsonObject[] | null
  formula_json?: JsonObject | null
  filters_json?: JsonObject[] | null
  access: string
  rights: string[]
  rule_hash: string
  materialized_rule_hash: string
  created_at: string
  created_by_subject?: string
  created_by_issuer?: string
  created_by_client_id?: string
}

export interface RuleCreate {
  versionId: string
  payload: {
    position?: number
    rule: JsonObject
  }
}

export interface RuleDelete extends RuleBase {}

export interface RuleDuplicate extends RuleBase {}

export interface RuleMove extends RuleBase {
  payload: { position: number }
}

export interface RulePatch extends RuleBase {
  patch: JsonObject
}

export interface RuleReplace extends RuleBase {
  rule: JsonObject
}

export interface RuleUpdate extends RuleReplace {
  currentRule: JsonObject
}

export interface RuleToggle extends RuleBase {
  payload: { enabled: boolean }
}
