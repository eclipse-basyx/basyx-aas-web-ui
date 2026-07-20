import { describe, expect, it } from 'vitest'
import { oidcIssuersMatch } from '@/composables/Auth/OpenIdConnect'

describe('oidcIssuersMatch', () => {
  it('matches an exact OIDC issuer', () => {
    expect(oidcIssuersMatch(
      'https://idp.example/tenant/v2.0',
      'https://idp.example/tenant/v2.0',
    )).toBe(true)
  })

  it('matches a Microsoft Entra tenant-independent issuer template', () => {
    expect(oidcIssuersMatch(
      'https://login.microsoftonline.com/{tenantid}/v2.0',
      'https://login.microsoftonline.com/9188040d-6c67-4c5b-b112-36a304b66dad/v2.0',
    )).toBe(true)
  })

  it('does not allow a template placeholder to span URL path segments', () => {
    expect(oidcIssuersMatch(
      'https://login.microsoftonline.com/{tenantid}/v2.0',
      'https://login.microsoftonline.com/tenant/extra/v2.0',
    )).toBe(false)
  })

  it('rejects a different issuer', () => {
    expect(oidcIssuersMatch(
      'https://idp.example/{tenantid}/v2.0',
      'https://attacker.example/tenant/v2.0',
    )).toBe(false)
  })
})
