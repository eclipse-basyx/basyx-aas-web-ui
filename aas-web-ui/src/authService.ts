/**
 * authService.ts
 *
 * Contains functions to handle authentication with Keycloak
 */

import Keycloak from 'keycloak-js';
import { KeycloakOnLoad } from 'keycloak-js';
import { useAuthStore } from '@/store/AuthStore';

/**
 * Sets up token refresh interval for direct grant authentication
 */
function setupTokenRefresh(
    keycloakUrl: string,
    keycloakRealm: string,
    keycloakClientId: string,
    authStore: ReturnType<typeof useAuthStore>
): void {
    const tokenEndpoint = `${keycloakUrl}/realms/${keycloakRealm}/protocol/openid-connect/token`;

    const refreshIntervalId = window.setInterval(async () => {
        try {
            const refreshToken = authStore.getRefreshToken;
            if (!refreshToken) {
                throw new Error('Missing refresh token');
            }

            const refreshParams = new URLSearchParams({
                client_id: keycloakClientId,
                grant_type: 'refresh_token',
                refresh_token: refreshToken,
            });
            const refreshResponse = await fetch(tokenEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: refreshParams.toString(),
            });
            const refreshData = await refreshResponse.json();
            if (refreshResponse.ok) {
                authStore.setToken(refreshData.access_token);
                authStore.setRefreshToken(refreshData.refresh_token);
            } else {
                throw new Error(refreshData.error_description || 'Token refresh failed');
            }
        } catch (error) {
            console.error('Token refresh error:', error);
            authStore.setAuthStatus(false);
            authStore.setAuthEnabled(false);
            authStore.setUser(null);
        }
    }, 60000); // refresh every minute

    authStore.setRefreshIntervalId(refreshIntervalId);
}

/**
 * Logs in a user with direct grant using Keycloak
 *
 * @param keycloakUrl - The URL of the Keycloak server
 * @param keycloakRealm - The realm to authenticate against
 * @param keycloakClientId - The client ID to use for authentication
 * @param username - The username of the user to authenticate
 * @param password - The password of the user to authenticate
 */
export async function loginWithDirectGrant(
    keycloakUrl: string,
    keycloakRealm: string,
    keycloakClientId: string,
    username: string,
    password: string
): Promise<void> {
    const authStore = useAuthStore();

    // Check if we already have valid tokens
    if (authStore.getToken && authStore.getAuthStatus) {
        try {
            // Validate token by checking if it's not expired
            const tokenPayload = JSON.parse(atob(authStore.getToken.split('.')[1]));
            const currentTime = Math.floor(Date.now() / 1000);

            if (tokenPayload.exp && tokenPayload.exp > currentTime) {
                // Token is still valid, but ensure we have Keycloak instance and refresh interval
                if (!authStore.getKeycloak) {
                    const keycloak = new Keycloak({
                        url: keycloakUrl,
                        realm: keycloakRealm,
                        clientId: keycloakClientId,
                    });
                    authStore.setKeycloak(keycloak);
                }

                if (!authStore.getRefreshIntervalId) {
                    setupTokenRefresh(keycloakUrl, keycloakRealm, keycloakClientId, authStore);
                }

                return; // Token is valid, no need to create a new session
            }
        } catch (error) {
            // If token validation fails, proceed with new login
            console.error('Token validation failed:', error);
        }
    }

    const tokenEndpoint = `${keycloakUrl}/realms/${keycloakRealm}/protocol/openid-connect/token`;
    const params = new URLSearchParams({
        client_id: keycloakClientId,
        username,
        password,
        grant_type: 'password',
    });

    try {
        const response = await fetch(tokenEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString(),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error_description || 'Authentication failed');
        }

        // Store tokens in the auth store
        const authStore = useAuthStore();

        // Create a minimal keycloak instance for logout functionality (without initialization)
        const keycloak = new Keycloak({
            url: keycloakUrl,
            realm: keycloakRealm,
            clientId: keycloakClientId,
        });
        authStore.setKeycloak(keycloak);
        authStore.setToken(data.access_token);
        authStore.setRefreshToken(data.refresh_token);
        authStore.setAuthStatus(true);
        authStore.setAuthEnabled(true);

        // Setup token refresh interval
        setupTokenRefresh(keycloakUrl, keycloakRealm, keycloakClientId, authStore);
    } catch (error) {
        console.error('Auto login failed:', error);
        const authStore = useAuthStore();
        authStore.setAuthStatus(false);
        authStore.setUser(null);
        throw error;
    }
}

/**
 * Initializes Keycloak authentication
 *
 * @param keycloakUrl - The URL of the Keycloak server
 * @param keycloakRealm - The realm to authenticate against
 * @param keycloakClientId - The client ID to use for authentication
 */
export async function initKeycloak(
    keycloakUrl: string,
    keycloakRealm: string,
    keycloakClientId: string
): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        let keycloak: Keycloak | null = null;

        const initOptions = {
            url: keycloakUrl,
            realm: keycloakRealm,
            clientId: keycloakClientId,
            onLoad: 'login-required' as KeycloakOnLoad,
        };

        try {
            keycloak = new Keycloak(initOptions);
            // set the keycloak instance in the auth store
            const authStore = useAuthStore();
            authStore.setKeycloak(keycloak);
            authStore.setAuthStatus(false);
            authStore.setAuthEnabled(true);
        } catch (error) {
            console.error('Failed to initialize Keycloak, running without authentication.', error);
            const authStore = useAuthStore();
            authStore.setAuthEnabled(false);
        }

        keycloak
            ?.init({ onLoad: initOptions.onLoad })
            .then(async (auth: boolean) => {
                if (!auth) {
                    window.location.reload();
                } else {
                    // console.info("Authenticated");
                    resolve();
                    const authStore = useAuthStore();
                    authStore.setToken(keycloak.token);
                    authStore.setRefreshToken(keycloak.refreshToken);
                    authStore.setAuthStatus(true);
                    const refreshIntervalId = window.setInterval(() => {
                        keycloak
                            .updateToken(70)
                            .then((refreshed: boolean) => {
                                if (refreshed) {
                                    // console.log('Token refreshed');
                                    authStore.setToken(keycloak.token);
                                    authStore.setRefreshToken(keycloak.refreshToken);
                                }
                                authStore.setAuthStatus(true);
                            })
                            .catch(() => {
                                console.error('Failed to refresh token');
                                authStore.setAuthStatus(false);
                                authStore.setUser(null);
                            });
                    }, 60000);

                    // send the refresh interval id to the auth store
                    authStore.setRefreshIntervalId(refreshIntervalId);
                }
            })
            .catch((error: any) => {
                console.error('Failed to authenticate with Keycloak', error);
                const authStore = useAuthStore();
                authStore.setAuthStatus(false);
                authStore.setUser(null);
                reject();
            });
    });
}
