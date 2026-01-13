import type { OAuth2ConnectionData } from '@/types/Infrastructure';

interface OAuth2TokenResponse {
    access_token: string;
    token_type: string;
    expires_in?: number;
    refresh_token?: string;
    scope?: string;
    id_token?: string;
}

interface OAuth2Token {
    accessToken: string;
    refreshToken?: string;
    expiresAt?: number;
    tokenType: string;
    idToken?: string;
}

/**
 * Authenticate using OAuth2 Client Credentials Flow
 * Note: This should only be used if your OAuth2 server allows CORS requests
 * and you understand the security implications of exposing client credentials
 */
export async function authenticateOAuth2ClientCredentials(config: OAuth2ConnectionData): Promise<OAuth2Token> {
    const { host, clientId, clientSecret, scope } = config;

    if (!host || !clientId || !clientSecret) {
        throw new Error('Missing required OAuth2 configuration');
    }

    // 1. Step - fetch well known OIDC config host/.well-known/openid-configuration
    const result = await fetch(`${host}/.well-known/openid-configuration`);
    if (!result.ok) {
        throw new Error(`Failed to fetch OpenID configuration: ${result.status} ${result.statusText}`);
    }

    const configData = await result.json();
    if (!configData.token_endpoint) {
        throw new Error('Token endpoint not found in OpenID configuration');
    }

    // 2. Step - use token endpoint from well known config
    // If the token endpoint is not provided, use the default /token path
    const tokenUrl = configData.token_endpoint;

    // Prepare request body
    const params = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
    });

    if (scope) {
        params.append('scope', scope);
    }

    try {
        const response = await fetch(tokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params,
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`OAuth2 authentication failed: ${response.status} ${errorText}`);
        }

        const data: OAuth2TokenResponse = await response.json();

        // Calculate expiration time
        const expiresAt = data.expires_in ? Date.now() + data.expires_in * 1000 : undefined;

        return {
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            expiresAt,
            tokenType: data.token_type,
        };
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`OAuth2 authentication error: ${error.message}`);
        }
        throw new Error('OAuth2 authentication failed with unknown error');
    }
}

/**
 * Generate PKCE challenge for Authorization Code Flow
 */
async function generatePKCE(): Promise<{ codeVerifier: string; codeChallenge: string }> {
    // Generate random code verifier
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const codeVerifier = base64URLEncode(array);

    // Generate code challenge from verifier
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const hash = await crypto.subtle.digest('SHA-256', data);
    const codeChallenge = base64URLEncode(new Uint8Array(hash));

    return { codeVerifier, codeChallenge };
}

/**
 * Base64 URL encode without padding
 */
function base64URLEncode(buffer: Uint8Array): string {
    const base64 = btoa(String.fromCharCode(...buffer));
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Initiate OAuth2 Authorization Code Flow with PKCE
 * This is the recommended approach for browser-based applications
 */
export async function initiateOAuth2AuthorizationCodeFlow(config: {
    authorizationEndpoint: string;
    clientId: string;
    redirectUri: string;
    scope?: string;
    state?: string;
}): Promise<void> {
    console.warn('[OAuth2] Initiating Authorization Code Flow with PKCE');
    const { authorizationEndpoint, clientId, redirectUri, scope, state } = config;

    // Generate PKCE
    const { codeVerifier, codeChallenge } = await generatePKCE();

    // Store code verifier in localStorage for later use (survives redirects)
    // Use state as key to support multiple simultaneous auth flows
    const storageKey = state ? `oauth2_code_verifier_${state}` : 'oauth2_code_verifier';
    localStorage.setItem(storageKey, codeVerifier);
    console.warn(`[OAuth2] Stored code verifier with key: ${storageKey}`);
    if (state) {
        localStorage.setItem('oauth2_state', state);
        console.warn(`[OAuth2] Stored state: ${state}`);
    }

    // Build authorization URL
    const params = new URLSearchParams({
        response_type: 'code',
        client_id: clientId,
        redirect_uri: redirectUri,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
    });

    if (scope) {
        params.append('scope', scope);
    }
    if (state) {
        params.append('state', state);
    }

    const authUrl = `${authorizationEndpoint}?${params.toString()}`;

    // Redirect to authorization endpoint
    window.location.href = authUrl;
}

/**
 * Exchange authorization code for tokens
 * Call this after the OAuth2 provider redirects back to your app
 */
export async function exchangeOAuth2AuthorizationCode(config: {
    tokenEndpoint: string;
    clientId: string;
    redirectUri: string;
    code: string;
    state?: string;
}): Promise<OAuth2Token> {
    const { tokenEndpoint, clientId, redirectUri, code, state } = config;

    // Retrieve code verifier from localStorage using state as key
    const storageKey = state ? `oauth2_code_verifier_${state}` : 'oauth2_code_verifier';
    if (process.env.NODE_ENV === 'development') {
        console.warn(`[OAuth2] Looking for code verifier with key: ${storageKey}`);
        console.warn(`[OAuth2] Current localStorage keys:`, Object.keys(localStorage));
    }
    const codeVerifier = localStorage.getItem(storageKey);
    if (!codeVerifier) {
        console.error(`[OAuth2] Code verifier not found in localStorage for key: ${storageKey}`);
        throw new Error('Code verifier not found. Authorization flow may have been interrupted.');
    }
    if (process.env.NODE_ENV === 'development') {
        console.warn(`[OAuth2] Found code verifier, proceeding with token exchange`);
        console.warn('Code Verifier:', codeVerifier);
    }
    // Prepare request
    const params = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        redirect_uri: redirectUri,
        code,
        code_verifier: codeVerifier,
    });

    try {
        const response = await fetch(tokenEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params,
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Token exchange failed: ${response.status} ${errorText}`);
        }

        const data: OAuth2TokenResponse = await response.json();

        const expiresAt = data.expires_in ? Date.now() + data.expires_in * 1000 : undefined;

        // Clean up localStorage
        localStorage.removeItem(storageKey);
        if (state) {
            localStorage.removeItem('oauth2_state');
        }

        return {
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            expiresAt,
            tokenType: data.token_type,
            idToken: data.id_token,
        };
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Token exchange error: ${error.message}`);
        }
        throw new Error('Token exchange failed with unknown error');
    }
}

/**
 * Refresh an OAuth2 access token
 */
export async function refreshOAuth2Token(config: {
    tokenEndpoint: string;
    clientId: string;
    refreshToken: string;
    clientSecret?: string;
}): Promise<OAuth2Token> {
    const { tokenEndpoint, clientId, refreshToken, clientSecret } = config;

    const params = new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: clientId,
        refresh_token: refreshToken,
    });

    if (clientSecret) {
        params.append('client_secret', clientSecret);
    }

    try {
        const response = await fetch(tokenEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params,
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Token refresh failed: ${response.status} ${errorText}`);
        }

        const data: OAuth2TokenResponse = await response.json();

        const expiresAt = data.expires_in ? Date.now() + data.expires_in * 1000 : undefined;

        return {
            accessToken: data.access_token,
            refreshToken: data.refresh_token || refreshToken, // Use new refresh token if provided
            expiresAt,
            tokenType: data.token_type,
            idToken: data.id_token,
        };
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Token refresh error: ${error.message}`);
        }
        throw new Error('Token refresh failed with unknown error');
    }
}
