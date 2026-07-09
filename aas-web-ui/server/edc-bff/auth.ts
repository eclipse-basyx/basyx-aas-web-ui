import type { EdcBffAuthConfig } from './types.js'
import type { IncomingMessage } from 'node:http'

interface JsonWebKeySet {
  keys?: KeyedJsonWebKey[]
}

type KeyedJsonWebKey = JsonWebKey & { kid?: string }

interface JwtHeader {
  alg?: string
  kid?: string
}

interface JwtPayload {
  aud?: string | string[]
  exp?: number
  iss?: string
  nbf?: number
  realm_access?: { roles?: string[] }
  resource_access?: Record<string, { roles?: string[] }>
  roles?: string[]
  scope?: string
}

const jwksCache = new Map<string, JsonWebKeySet>()

export async function authorizeRequest (
  request: IncomingMessage,
  authConfig: EdcBffAuthConfig,
): Promise<void> {
  if (authConfig.mode === 'none') {
    return
  }

  const token = getBearerToken(request.headers.authorization)
  if (!token) {
    throw createAuthError('Missing bearer token', 401)
  }

  await validateJwt(token, authConfig)
}

export async function validateJwt (
  token: string,
  authConfig: EdcBffAuthConfig,
  fetchFn: typeof fetch = fetch,
): Promise<JwtPayload> {
  const [encodedHeader, encodedPayload, encodedSignature] = token.split('.')
  if (!encodedHeader || !encodedPayload || !encodedSignature) {
    throw createAuthError('Invalid JWT format', 401)
  }

  const header = decodeBase64UrlJson<JwtHeader>(encodedHeader)
  const payload = decodeBase64UrlJson<JwtPayload>(encodedPayload)

  if (header.alg !== 'RS256' || !header.kid) {
    throw createAuthError('Unsupported JWT header', 401)
  }

  await verifyJwtSignature(token, header, authConfig, fetchFn)
  validateJwtClaims(payload, authConfig)

  return payload
}

export function createAuthError (message: string, status = 401): Error & { status: number } {
  const error = new Error(message) as Error & { status: number }
  error.status = status
  return error
}

function getBearerToken (authorizationHeader: string | undefined): string {
  if (!authorizationHeader?.toLowerCase().startsWith('bearer ')) {
    return ''
  }

  return authorizationHeader.slice('bearer '.length).trim()
}

async function verifyJwtSignature (
  token: string,
  header: JwtHeader,
  authConfig: EdcBffAuthConfig,
  fetchFn: typeof fetch,
): Promise<void> {
  if (!authConfig.jwksUrl) {
    throw createAuthError('JWKS URL is not configured', 500)
  }

  const [encodedHeader, encodedPayload, encodedSignature] = token.split('.')
  const jwks = await getJwks(authConfig.jwksUrl, fetchFn)
  let jwk = jwks.keys?.find(key => key.kid === header.kid)
  if (!jwk) {
    const refreshedJwks = await getJwks(authConfig.jwksUrl, fetchFn, true)
    jwk = refreshedJwks.keys?.find(key => key.kid === header.kid)
  }
  if (!jwk) {
    throw createAuthError('JWT signing key not found', 401)
  }

  const key = await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify'],
  )

  const verified = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    key,
    base64UrlToArrayBuffer(encodedSignature),
    new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`),
  )

  if (!verified) {
    throw createAuthError('Invalid JWT signature', 401)
  }
}

async function getJwks (jwksUrl: string, fetchFn: typeof fetch, forceRefresh = false): Promise<JsonWebKeySet> {
  const cached = jwksCache.get(jwksUrl)
  if (cached && !forceRefresh) {
    return cached
  }

  const response = await fetchFn(jwksUrl)
  if (!response.ok) {
    throw createAuthError(`Could not fetch JWKS: ${response.status}`, 500)
  }

  const jwks = await response.json() as JsonWebKeySet
  jwksCache.set(jwksUrl, jwks)
  return jwks
}

function validateJwtClaims (payload: JwtPayload, authConfig: EdcBffAuthConfig): void {
  const now = Math.floor(Date.now() / 1000)
  if (payload.exp !== undefined && payload.exp <= now) {
    throw createAuthError('JWT expired', 401)
  }

  if (payload.nbf !== undefined && payload.nbf > now) {
    throw createAuthError('JWT not active yet', 401)
  }

  if (authConfig.issuer && payload.iss !== authConfig.issuer) {
    throw createAuthError('JWT issuer mismatch', 403)
  }

  if (authConfig.audience && !hasAudience(payload.aud, authConfig.audience)) {
    throw createAuthError('JWT audience mismatch', 403)
  }

  if (authConfig.requiredRoles.length > 0 && !hasRequiredRole(payload, authConfig.requiredRoles)) {
    throw createAuthError('JWT role missing', 403)
  }
}

function hasAudience (audienceClaim: string | string[] | undefined, expectedAudience: string): boolean {
  if (Array.isArray(audienceClaim)) {
    return audienceClaim.includes(expectedAudience)
  }
  return audienceClaim === expectedAudience
}

function hasRequiredRole (payload: JwtPayload, requiredRoles: string[]): boolean {
  const roles = new Set<string>([
    ...(payload.roles ?? []),
    ...(payload.realm_access?.roles ?? []),
    ...Object.values(payload.resource_access ?? {}).flatMap(resource => resource.roles ?? []),
    ...(payload.scope?.split(' ').filter(Boolean) ?? []),
  ])

  return requiredRoles.some(role => roles.has(role))
}

function decodeBase64UrlJson<T> (value: string): T {
  return JSON.parse(new TextDecoder().decode(base64UrlToArrayBuffer(value))) as T
}

function base64UrlToArrayBuffer (value: string): ArrayBuffer {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/')
  const paddedBase64 = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
  const buffer = Buffer.from(paddedBase64, 'base64')
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer
}
