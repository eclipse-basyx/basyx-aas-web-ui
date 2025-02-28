/**
 * authService.ts
 *
 * Contains functions to handle authentication with Keycloak
 */

import Keycloak from 'keycloak-js';
import { KeycloakOnLoad } from 'keycloak-js';
import { useAuthStore } from '@/store/AuthStore';

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
        authStore.setToken(data.access_token);
        authStore.setRefreshToken(data.refresh_token);
        authStore.setAuthStatus(true);
        authStore.setAuthEnabled(true);

        // Setup token refresh interval (adjust timing as needed)
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
            }
        }, 60000); // refresh every minute

        // send the refresh interval id to the auth store
        authStore.setRefreshIntervalId(refreshIntervalId);
    } catch (error) {
        console.error('Auto login failed:', error);
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
                reject();
            });
    });
}
