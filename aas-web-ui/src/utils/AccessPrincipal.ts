import type { AccessGrant, AccessPrincipal } from '@/types/ResourceAccess'

export function accessPrincipalKey (principal: AccessPrincipal): string {
  return JSON.stringify([principal.type, principal.issuer, principal.subject])
}

export function grantPrincipal (grant: AccessGrant): AccessPrincipal {
  return { type: grant.subjectType, issuer: grant.issuer, subject: grant.subject }
}

export function accessPrincipalLabel (principal: AccessPrincipal): string {
  return `${principal.type === 'group' ? 'Group' : 'Person'} ${principal.subject}`
}

export function samePrincipal (left?: AccessPrincipal, right?: AccessPrincipal): boolean {
  return Boolean(left && right && accessPrincipalKey(left) === accessPrincipalKey(right))
}
