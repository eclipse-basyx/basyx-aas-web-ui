/**
 * ABAC Policy Types
 */

import type { JsonObject } from './json'

export type PolicyStatus = 'staged' | 'active' | 'superseded' | 'rejected'

export type PolicySourceType = 'file' | 'api'

// ---------------------------------------------------------------------------
// Request / Response
// ---------------------------------------------------------------------------

export interface PolicyVersion {
  version_id: number
  service_scope: string
  policy_id: string
  status: PolicyStatus
  source_type: PolicySourceType
  source_ref?: string
  configured_policy_json?: JsonObject
  configured_policy_hash: string
  raw_policy_hash?: string
  materialized_policy_json?: JsonObject
  materialized_policy_hash: string
  created_at: string
  created_by_subject?: string
  created_by_issuer?: string
  created_by_client_id?: string
  updated_at?: string
  updated_by_subject?: string
  updated_by_issuer?: string
  updated_by_client_id?: string
  activated_at?: string
  activated_by_subject?: string
  activated_by_issuer?: string
  activated_by_client_id?: string
  superseded_at?: string
  artifact_ref?: JsonObject
}

export interface ActivePolicy extends PolicyVersion {
  status: 'active'
}

export interface PolicyValidationResult {
  valid: boolean
  policy_id?: string
  materialized_policy_hash?: string
  error?: string
}

export interface PolicyImport {
  source_ref?: string
  activate?: boolean
  policy: JsonObject
}
