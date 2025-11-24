import type { KeycloakConnectionData } from '@/types/Infrastructure';
import { usePopupOverlay } from '@/composables/PopupOverlay';

export interface KeycloakAuthResult {
    accessToken: string;
    refreshToken?: string;
    idToken?: string;
    expiresAt: number;
}

/**
 * Authenticate with Keycloak using Authorization Code flow with PKCE
 */
export async function authenticateWithAuthCode(config: KeycloakConnectionData): Promise<KeycloakAuthResult> {
    const { showOverlay, hideOverlay } = usePopupOverlay();

    return new Promise<KeycloakAuthResult>((resolve, reject) => {
        const run = async (): Promise<void> => {
            const { serverUrl, realm, clientId } = config;

            if (!serverUrl || !realm || !clientId) {
                reject(new Error('Missing required Keycloak configuration'));
                return;
            }

            // Generate PKCE code verifier and challenge
            const codeVerifier = generateCodeVerifier();
            const codeChallenge = await generateCodeChallenge(codeVerifier);

            // Store code verifier for later exchange
            const sessionKey = `pkce_code_verifier_${Date.now()}`;
            sessionStorage.setItem(sessionKey, codeVerifier);

            // Build authorization URL
            const redirectUri = `${window.location.origin}/keycloak-callback.html`;
            const state = generateRandomString(32);
            sessionStorage.setItem(`pkce_state_${sessionKey}`, state);

            const authUrl = new URL(`${serverUrl.replace(/\/$/, '')}/realms/${realm}/protocol/openid-connect/auth`);
            authUrl.searchParams.set('client_id', clientId);
            authUrl.searchParams.set('redirect_uri', redirectUri);
            authUrl.searchParams.set('response_type', 'code');
            authUrl.searchParams.set('scope', 'openid profile email');
            authUrl.searchParams.set('code_challenge', codeChallenge);
            authUrl.searchParams.set('code_challenge_method', 'S256');
            authUrl.searchParams.set('state', state);

            // Show overlay before opening popup
            showOverlay();

            // Open popup window
            const width = 500;
            const height = 600;
            const left = window.screenX + (window.outerWidth - width) / 2;
            const top = window.screenY + (window.outerHeight - height) / 2;

            const keycloakPopup = window.open(
                authUrl.toString(),
                'keycloak-login',
                `width=${width},height=${height},left=${left},top=${top},popup=yes,resizable=yes,scrollbars=yes`
            );

            if (!keycloakPopup) {
                hideOverlay();
                sessionStorage.removeItem(sessionKey);
                sessionStorage.removeItem(`pkce_state_${sessionKey}`);
                reject(new Error('Failed to open login popup. Please allow popups for this site.'));
                return;
            }

            // Listen for messages from popup
            const messageHandler = async (event: MessageEvent): Promise<void> => {
                if (event.origin !== window.location.origin) return;

                if (event.data && event.data.type === 'keycloak-auth-code') {
                    const { code, state: returnedState } = event.data;
                    const storedState = sessionStorage.getItem(`pkce_state_${sessionKey}`);

                    if (returnedState !== storedState) {
                        if (keycloakPopup && !keycloakPopup.closed) {
                            keycloakPopup.close();
                        }
                        hideOverlay();
                        window.removeEventListener('message', messageHandler);
                        sessionStorage.removeItem(sessionKey);
                        sessionStorage.removeItem(`pkce_state_${sessionKey}`);
                        reject(new Error('Invalid state parameter'));
                        return;
                    }

                    try {
                        const tokenResult = await exchangeCodeForToken(code, config, sessionKey);
                        if (keycloakPopup && !keycloakPopup.closed) {
                            keycloakPopup.close();
                        }
                        hideOverlay();
                        window.removeEventListener('message', messageHandler);
                        resolve(tokenResult);
                    } catch (error) {
                        if (keycloakPopup && !keycloakPopup.closed) {
                            keycloakPopup.close();
                        }
                        hideOverlay();
                        window.removeEventListener('message', messageHandler);
                        sessionStorage.removeItem(sessionKey);
                        sessionStorage.removeItem(`pkce_state_${sessionKey}`);
                        reject(error);
                    }
                } else if (event.data && event.data.type === 'keycloak-auth-error') {
                    if (keycloakPopup && !keycloakPopup.closed) {
                        keycloakPopup.close();
                    }
                    hideOverlay();
                    window.removeEventListener('message', messageHandler);
                    sessionStorage.removeItem(sessionKey);
                    sessionStorage.removeItem(`pkce_state_${sessionKey}`);
                    reject(new Error(event.data.errorDescription || event.data.error || 'Authentication failed'));
                }
            };

            window.addEventListener('message', messageHandler);

            // Monitor if popup is closed manually
            const popupCheckInterval = setInterval(() => {
                if (keycloakPopup && keycloakPopup.closed) {
                    clearInterval(popupCheckInterval);
                    hideOverlay();
                    window.removeEventListener('message', messageHandler);
                    sessionStorage.removeItem(sessionKey);
                    sessionStorage.removeItem(`pkce_state_${sessionKey}`);
                    reject(new Error('Login popup was closed'));
                }
            }, 500);
        };
        run();
    });
}

/**
 * Authenticate with Keycloak using Client Credentials flow
 */
export async function authenticateWithClientCredentials(config: KeycloakConnectionData): Promise<KeycloakAuthResult> {
    const { serverUrl, realm, clientId, clientSecret } = config;

    if (!serverUrl || !realm || !clientId || !clientSecret) {
        throw new Error('Client Secret is required for client credentials flow');
    }

    const tokenEndpoint = `${serverUrl.replace(/\/$/, '')}/realms/${realm}/protocol/openid-connect/token`;
    const params = new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'client_credentials',
    });

    const response = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error_description || 'Authentication failed');
    }

    const expiresAt = Date.now() + (data.expires_in || 300) * 1000;
    return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        idToken: data.id_token,
        expiresAt,
    };
}

/**
 * Authenticate with Keycloak using Password flow
 */
export async function authenticateWithPassword(config: KeycloakConnectionData): Promise<KeycloakAuthResult> {
    const { serverUrl, realm, clientId, clientSecret, username, password } = config;

    if (!serverUrl || !realm || !clientId) {
        throw new Error('Missing required Keycloak configuration');
    }

    if (!username || !password) {
        throw new Error('Username and Password are required for password flow');
    }

    const tokenEndpoint = `${serverUrl.replace(/\/$/, '')}/realms/${realm}/protocol/openid-connect/token`;
    const params = new URLSearchParams({
        client_id: clientId,
        username: username,
        password: password,
        grant_type: 'password',
    });

    if (clientSecret) {
        params.set('client_secret', clientSecret);
    }

    const response = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error_description || 'Authentication failed');
    }

    const expiresAt = Date.now() + (data.expires_in || 300) * 1000;
    return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        idToken: data.id_token,
        expiresAt,
    };
}

/**
 * Main authentication function that handles all Keycloak flows
 */
export async function authenticateKeycloak(config: KeycloakConnectionData): Promise<KeycloakAuthResult> {
    const { authFlow } = config;

    if (!authFlow) {
        throw new Error('Auth flow not specified');
    }

    if (authFlow === 'client-credentials') {
        return authenticateWithClientCredentials(config);
    } else if (authFlow === 'password') {
        return authenticateWithPassword(config);
    } else {
        return authenticateWithAuthCode(config);
    }
}

/**
 * Exchange authorization code for access token
 */
async function exchangeCodeForToken(
    code: string,
    config: KeycloakConnectionData,
    sessionKey: string
): Promise<KeycloakAuthResult> {
    const { serverUrl, realm, clientId } = config;
    const codeVerifier = sessionStorage.getItem(sessionKey);
    const redirectUri = `${window.location.origin}/keycloak-callback.html`;

    if (!codeVerifier) {
        throw new Error('Code verifier not found');
    }

    const tokenEndpoint = `${serverUrl.replace(/\/$/, '')}/realms/${realm}/protocol/openid-connect/token`;
    const params = new URLSearchParams({
        client_id: clientId,
        code: code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
        code_verifier: codeVerifier,
    });

    const response = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error_description || 'Token exchange failed');
    }

    // console.log('Token exchange response:', data);
    // console.log('ID Token from response:', data.id_token);

    // Clean up session storage
    sessionStorage.removeItem(sessionKey);
    sessionStorage.removeItem(`pkce_state_${sessionKey}`);

    const expiresAt = Date.now() + (data.expires_in || 300) * 1000;
    const result = {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        idToken: data.id_token,
        expiresAt,
    };
    // console.log('Returning auth result:', result);
    return result;
}

// PKCE helper functions
function generateRandomString(length: number): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    let result = '';
    const randomValues = new Uint8Array(length);
    crypto.getRandomValues(randomValues);
    for (let i = 0; i < length; i++) {
        result += charset[randomValues[i] % charset.length];
    }
    return result;
}

function generateCodeVerifier(): string {
    return generateRandomString(128);
}

async function generateCodeChallenge(verifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return base64UrlEncode(hash);
}

function base64UrlEncode(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
