import type { BaSyxComponentKey } from '@/types/BaSyx'

export const accessRights = ['CREATE', 'READ', 'UPDATE', 'DELETE', 'EXECUTE', 'VIEW', 'ALL'] as const

export type AccessRight = typeof accessRights[number]

export interface AccessPrincipal {
  type?: 'user' | 'group'
  issuer: string
  subject: string
}

export type ResourceObject
  = | { ROUTE: string }
    | { IDENTIFIABLE: string }
    | { REFERABLE: string }
    | { DESCRIPTOR: string }

export interface ResourceBoundPolicy {
  RESOURCE: ResourceObject
  rules: Array<Record<string, unknown>>
  DEFATTRIBUTES?: Array<Record<string, unknown>>
  DEFACLS?: Array<Record<string, unknown>>
  DEFFORMULAS?: Array<Record<string, unknown>>
}

export interface ManagedGrant {
  id: string
  principal: AccessPrincipal
  rights: AccessRight[]
}

export interface ResourceAccessOverview {
  revision: number
  resource: ResourceObject
  localPolicy: ResourceBoundPolicy | null
  effectivePolicy: ResourceBoundPolicy | null
  owners: AccessPrincipal[]
  managers: AccessPrincipal[]
  grants: ManagedGrant[]
}

export type ResourceAccessTargetKind
  = | 'aas'
    | 'submodel'
    | 'nested-submodel'
    | 'submodel-element'
    | 'nested-submodel-element'
    | 'aas-descriptor'
    | 'nested-submodel-descriptor'
    | 'submodel-descriptor'
    | 'discovery'
    | 'concept-description'

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
  aasId?: string
  submodelId?: string
  idShortPath?: string
}

export interface ResourceAccessResult<T = unknown> {
  ok: boolean
  data?: T
  etag?: string
  location?: string
  status?: number
  message?: string
}

export interface GrantInput {
  principal: AccessPrincipal
  rights: AccessRight[]
}

export interface ShareLinkInput {
  rights: AccessRight[]
  expiresInSeconds: number
}

export interface ShareLinkResponse {
  id: string
  shareLink: string
  expiresAt: string
}
