import type { AccessPrincipal } from '@/types/ResourceAccess'

export function accessPrincipalKey (principal: AccessPrincipal): string {
  return JSON.stringify([principal.type ?? 'user', principal.issuer, principal.subject])
}

export function accessPrincipalLabel (principal: AccessPrincipal): string {
  return `${principal.type === 'group' ? 'Group' : 'Person'}: ${principal.subject}`
}
