import type { EdcBffAuthConfig } from '../../../server/edc-bff/types'
import { describe, expect, it, vi } from 'vitest'
import { validateJwt } from '../../../server/edc-bff/auth'
import { createJwt, createTestKeyPair } from '../../helpers/jwt'

describe('EDC BFF auth', () => {
  it('refreshes JWKS when a token references a new signing key ID', async () => {
    const authConfig: EdcBffAuthConfig = {
      mode: 'jwt',
      jwksUrl: 'https://issuer.example.test/jwks-rotation',
      issuer: 'https://issuer.example.test',
      audience: 'basyx-aas-web-ui',
      requiredRoles: [],
    }
    const firstKey = await createTestKeyPair('kid-1')
    const secondKey = await createTestKeyPair('kid-2')
    const claims = { iss: authConfig.issuer, aud: authConfig.audience }
    const firstToken = await createJwt(firstKey, claims)
    const secondToken = await createJwt(secondKey, claims)
    const fetchMock = vi.fn(async () => Response.json({
      keys: fetchMock.mock.calls.length === 1
        ? [firstKey.jwk]
        : [firstKey.jwk, secondKey.jwk],
    }))

    await validateJwt(firstToken, authConfig, fetchMock as typeof fetch)
    await validateJwt(secondToken, authConfig, fetchMock as typeof fetch)

    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})
