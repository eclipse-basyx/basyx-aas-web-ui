import type { EdcBffAuthConfig } from '../../../server/edc-bff/types'
import { describe, expect, it, vi } from 'vitest'
import { validateJwt } from '../../../server/edc-bff/auth'

interface TestKeyPair {
  jwk: JsonWebKey & { kid: string }
  privateKey: CryptoKey
}

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
    const firstToken = await createJwt(firstKey, authConfig)
    const secondToken = await createJwt(secondKey, authConfig)
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

async function createTestKeyPair (kid: string): Promise<TestKeyPair> {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'RSASSA-PKCS1-v1_5',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['sign', 'verify'],
  ) as CryptoKeyPair
  const jwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey) as JsonWebKey & { kid: string }
  jwk.kid = kid
  jwk.alg = 'RS256'
  jwk.use = 'sig'

  return {
    jwk,
    privateKey: keyPair.privateKey,
  }
}

async function createJwt (keyPair: TestKeyPair, authConfig: EdcBffAuthConfig): Promise<string> {
  const encodedHeader = encodeBase64UrlJson({
    alg: 'RS256',
    kid: keyPair.jwk.kid,
  })
  const encodedPayload = encodeBase64UrlJson({
    aud: authConfig.audience,
    exp: Math.floor(Date.now() / 1000) + 3600,
    iss: authConfig.issuer,
  })
  const signingInput = `${encodedHeader}.${encodedPayload}`
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    keyPair.privateKey,
    new TextEncoder().encode(signingInput),
  )

  return `${signingInput}.${Buffer.from(signature).toString('base64url')}`
}

function encodeBase64UrlJson (value: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(value), 'utf8').toString('base64url')
}
