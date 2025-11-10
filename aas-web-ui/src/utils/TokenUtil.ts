import { base64Decode } from '@/utils/EncodeDecodeUtils';

export function getUserFromToken(accessToken: string): any {
    const failResponse = null;

    if (!accessToken || accessToken.trim() === '') return failResponse;

    try {
        const accessTokenPayload = JSON.parse(base64Decode(accessToken.split('.')[1]));

        const user = {
            username: accessTokenPayload?.preferred_username,
            name: accessTokenPayload?.name,
            given_name: accessTokenPayload?.given_name,
            family_name: accessTokenPayload?.family_name,
            email: accessTokenPayload?.email,
            roles: accessTokenPayload?.realm_access?.roles,
        };
        return user;
    } catch (error) {
        throw new Error('Failed to parse JWT token: ' + error);
    }
}
