/**
 * RS256 keys and tokens for tests of the JWT auth of the EDC BFF.
 */
export interface TestKeyPair {
  jwk: JsonWebKey & { kid: string } // Public key, as served in the JWKS
  privateKey: CryptoKey
}

export async function createTestKeyPair (kid: string): Promise<TestKeyPair> {
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

/**
 * Returns a JWT signed with the given key, valid for an hour, with the given claims, e.g. `iss`, `aud` or `realm_access`.
 */
export async function createJwt (keyPair: TestKeyPair, claims: Record<string, unknown>): Promise<string> {
  const encodedHeader = encodeBase64UrlJson({
    alg: 'RS256',
    kid: keyPair.jwk.kid,
  })
  const encodedPayload = encodeBase64UrlJson({
    exp: Math.floor(Date.now() / 1000) + 3600,
    ...claims,
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
