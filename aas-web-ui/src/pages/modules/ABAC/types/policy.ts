/**
 * ABAC Policy Types
 */

import type {
  DefAcl,
  DefAttribute,
  DefFormula,
  DefObject,
} from './definitions'
import type { ConfiguredRule } from './rules'

export type PolicyStatus = 'staged' | 'active' | 'superseded' | 'rejected'

export type PolicySourceType = 'file' | 'api'

export interface CompletePolicy {
  AllAccessPermissionRules: {
    DEFATTRIBUTES?: DefAttribute[]
    DEFACLS?: DefAcl[]
    DEFOBJECTS?: DefObject[]
    DEFFORMULAS?: DefFormula[]
    rules: ConfiguredRule[]
  }
}

// ---------------------------------------------------------------------------
// Request / Response
// ---------------------------------------------------------------------------

export interface PolicyVersion {
  version_id: number
  service_scope: string
  policy_id: string
  status: PolicyStatus
  source_type: PolicySourceType
  source_ref: string
  configured_policy_json: Record<string, unknown>
  configured_policy_hash: string
  raw_policy_hash: string
  materialized_policy_json: Record<string, unknown>
  materialized_policy_hash: string
  created_at: string
  updated_at: string
  activated_at?: string
  superseded_at?: string
  artifact_ref: Record<string, unknown>
}

export interface ActivePolicy extends PolicyVersion {
  status: 'active'
}

export interface PolicyValidationResult {
  valid: boolean
  policy_id: string
  materialized_policy_hash: string
  error: string
}

export interface PolicyImport {
  source_ref?: string
  activate?: boolean
  policy: CompletePolicy
}
