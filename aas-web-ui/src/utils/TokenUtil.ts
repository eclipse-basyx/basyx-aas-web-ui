import { UserData } from '@/types/Infrastructure';
import { base64Decode } from '@/utils/EncodeDecodeUtils';

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
export function getUserFromToken(accessToken: string): UserData {
    if (!accessToken || accessToken.trim() === '') throw new Error('Failed to parse JWT token: empty token');

    try {
        const tokenParts = accessToken.split('.');

        if (tokenParts.length !== 3) {
            throw new Error('Malformed JWT token: expected 3 segments separated by dots.');
        }

        const accessTokenPayload = JSON.parse(base64Decode(accessToken.split('.')[1]));

        const user = {
            username: accessTokenPayload?.preferred_username,
            name: accessTokenPayload?.name,
            given_name: accessTokenPayload?.given_name,
            family_name: accessTokenPayload?.family_name,
            email: accessTokenPayload?.email,
            roles: accessTokenPayload?.realm_access?.roles,
        } as UserData;
        return user;
    } catch (error) {
        throw new Error('Failed to parse JWT token: ' + (error instanceof Error ? error.message : String(error)));
    }
}
