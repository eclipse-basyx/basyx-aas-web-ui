import type { BaSyxComponentKey } from '@/types/BaSyx'

/** Relations that can be granted on an individual resource. */
export const accessRelations = ['owner', 'editor', 'viewer', 'executor'] as const
export type AccessRelation = typeof accessRelations[number]

/** Relations that can be granted on a repository family. */
export const repositoryRelations = ['creator', 'admin'] as const
export type RepositoryRelation = typeof repositoryRelations[number]

export type GrantRelation = AccessRelation | RepositoryRelation

export type PrincipalType = 'user' | 'group'

/** An issuer-scoped user or group. */
export interface AccessPrincipal {
  type: PrincipalType
  issuer: string
  subject: string
}

/** A direct grant as returned and accepted by `$access/grants`. */
export interface AccessGrant {
  relation: GrantRelation
  subjectType: PrincipalType
  issuer: string
  subject: string
  createdBy?: string
  createdAt?: string
}

export interface AccessObject {
  type: string
  id: string
  idShortPath?: string
}

export interface InheritanceLink {
  aasId: string
  approvedBy: string
  approvedAt: string
}

/** The response of `GET …/$access`; its revision is also the ETag. */
export interface AccessDocument {
  object: AccessObject
  revision: number
  grants: AccessGrant[]
  inheritance?: InheritanceLink[]
  derivedFrom?: AccessObject
}

export type EffectiveAction = 'read' | 'update' | 'delete' | 'execute' | 'manage'
export type EffectiveSource = 'abac' | 'abac-conditional' | 'rebac' | 'administrator' | 'none'

export interface EffectiveRights {
  object: AccessObject
  rights: Array<{ action: EffectiveAction, source: EffectiveSource }>
}

export type InvitationRelation = Exclude<AccessRelation, 'owner'>

export interface InvitationRequest {
  relation: InvitationRelation
  expiresAt: string
  maxUses?: number
  expectedPrincipal?: { issuer: string, subject: string }
}

export interface Invitation {
  id: string
  relation: InvitationRelation
  expiresAt: string
  maxUses: number
  usedCount?: number
  createdBy: string
  createdAt: string
  restricted?: boolean
  /** Only present in the response that created the invitation. */
  token?: string
}

export interface AcceptedInvitation {
  object: AccessObject
  relation: InvitationRelation
}

export interface AuditEvent {
  id: number
  occurredAt: string
  type: string
  actor: string
  object: string
  details: Record<string, unknown>
  previousHash?: string
  hash: string
  evidence?: Record<string, unknown>
}

export interface AuditVerification {
  valid: boolean
  checked: number
  headHash?: string
  firstInvalidId?: number
  reason?: string
  evidenceVerified: number
  evidenceMissing: number
}

export interface ReconcileReport {
  orphanGrants: number
  orphanLinks: number
  orphanDerivations: number
  orphanInvitations: number
}

/** Repository families as used by `/security/rebac/repositories/{kind}`. */
export type RepositoryKind
  = | 'aas'
    | 'submodel'
    | 'concept_description'
    | 'aas_descriptor'
    | 'submodel_descriptor'
    | 'asset_links'

export type ResourceAccessTargetKind
  = | 'aas'
    | 'submodel'
    | 'submodel-element'
    | 'concept-description'
    | 'aas-descriptor'
    | 'submodel-descriptor'
    | 'discovery'

export interface ResourceAccessTarget {
  kind: ResourceAccessTargetKind
  label: string
  endpoint: string
  componentKey: BaSyxComponentKey
}

export interface ResourceAccessTargetInput {
  kind: ResourceAccessTargetKind
  baseUrl: string
  resourceId?: string
  submodelId?: string
  idShortPath?: string
}

export interface ResourceAccessResult<T = unknown> {
  ok: boolean
  data?: T
  etag?: string
  status?: number
  message?: string
}
