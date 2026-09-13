import { describe, expect, it } from 'vitest'
import { getAccessPrincipalFromToken } from '@/utils/TokenUtil'

function token (payload: Record<string, unknown>): string {
  return ['e30', btoa(JSON.stringify(payload)).replace(/=+$/, ''), 'signature'].join('.')
}

describe('getAccessPrincipalFromToken', () => {
  it('uses stable OIDC issuer and subject claims', () => {
    expect(getAccessPrincipalFromToken(token({ iss: 'https://issuer.example', sub: 'user-1' }))).toEqual({
      issuer: 'https://issuer.example',
      subject: 'user-1',
    })
  })

  it('rejects tokens without a stable principal', () => {
    expect(() => getAccessPrincipalFromToken(token({ preferred_username: 'user' }))).toThrow('iss and sub')
  })
})
