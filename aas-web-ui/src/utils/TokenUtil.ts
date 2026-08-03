import type { UserData } from '@/types/Infrastructure'
import { base64Decode } from '@/utils/EncodeDecodeUtils'

export type TokenPayload = Record<string, unknown>

/**
 * Decodes a JWT payload without verifying its signature.
 */
export function getTokenPayload (accessToken: string): TokenPayload {
  if (!accessToken || accessToken.trim() === '') {
    throw new Error('Failed to parse JWT token: empty token')
  }

  try {
    const tokenParts = accessToken.split('.')
    if (tokenParts.length !== 3) {
      throw new Error('Malformed JWT token: expected 3 segments separated by dots.')
    }

    const payload: unknown = JSON.parse(base64Decode(tokenParts[1]))
    if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
      throw new Error('Malformed JWT token: payload must be an object.')
    }
    return payload as TokenPayload
  } catch (error) {
    const message = 'Failed to parse JWT token: ' + (error instanceof Error ? error.message : String(error))
    throw new Error(message, { cause: error })
  }
}

/**
 * Extracts user profile information from a JWT access token.
 *
 * The function decodes the JWT payload, parses the JSON, and maps common OpenID
 * Connect claim names to a User object.
 * This function does not perform signature verification and assumes `base64Decode`
 * can decode base64url-encoded payloads.
 *
 * @param {string} accessToken - A compact JWT string in the form "header.payload.signature".
 * @returns {UserData} A user object assembled from the token's claims.
 * @throws {Error} If the token is empty.
 * @throws {Error} If the token payload cannot be decoded or parsed.
 */
export function getUserFromToken (accessToken: string): UserData {
  const accessTokenPayload = getTokenPayload(accessToken)
  return {
    username: accessTokenPayload.preferred_username,
    name: accessTokenPayload.name,
    given_name: accessTokenPayload.given_name,
    family_name: accessTokenPayload.family_name,
    email: accessTokenPayload.email,
  } as UserData
}
