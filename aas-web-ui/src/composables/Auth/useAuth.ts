import { type Router } from 'vue-router';
import { authenticateKeycloak } from '@/composables/Auth/KeycloakAuth';
import { usePopupOverlay } from '@/composables/PopupOverlay';
import { useInfrastructureStore } from '@/store/InfrastructureStore';
import { useNavigationStore } from '@/store/NavigationStore';

/**
 * Composable for handling authentication logic
 * Centralizes login and logout functionality for OAuth2 and Keycloak
 */
export function useAuth(router?: Router) {
    const infrastructureStore = useInfrastructureStore();
    const navStore = useNavigationStore();
    const { showOverlay, hideOverlay } = usePopupOverlay();

    /**
     * Perform login for the current infrastructure
     * Handles OAuth2 (both flows) and Keycloak authentication
     */
    async function login(): Promise<void> {
        const infra = infrastructureStore.getSelectedInfrastructure;

        if (!infra) {
            navStore.dispatchSnackbar({
                status: true,
                timeout: 4000,
                color: 'error',
                btnColor: 'buttonText',
                text: 'No infrastructure selected',
            });
            return;
        }

        // Handle OAuth2 login - authenticate directly without opening full dialog
        if (infra.auth?.oauth2) {
            const config = infra.auth.oauth2;

            if (!config.host || !config.clientId) {
                navStore.dispatchSnackbar({
                    status: true,
                    timeout: 4000,
                    color: 'error',
                    btnColor: 'buttonText',
                    text: 'OAuth2 configuration incomplete. Please configure in settings.',
                });
                infrastructureStore.dispatchTriggerInfrastructureDialog(true);
                return;
            }

            try {
                // For client-credentials, authenticate directly
                if (config.authFlow === 'client-credentials') {
                    if (!config.clientSecret) {
                        navStore.dispatchSnackbar({
                            status: true,
                            timeout: 4000,
                            color: 'error',
                            btnColor: 'buttonText',
                            text: 'Client secret is required. Please configure in settings.',
                        });
                        infrastructureStore.dispatchTriggerInfrastructureDialog(true);
                        return;
                    }

                    showOverlay();
                    const { authenticateOAuth2ClientCredentials } = await import('@/composables/Auth/OAuth2Auth');
                    const result = await authenticateOAuth2ClientCredentials(config);

                    // Update infrastructure with new token
                    const updatedInfra = {
                        ...infra,
                        token: {
                            accessToken: result.accessToken,
                            refreshToken: result.refreshToken,
                            idToken: result.idToken,
                            expiresAt: result.expiresAt,
                        },
                    };
                    infrastructureStore.dispatchUpdateInfrastructure(updatedInfra);
                    infrastructureStore.setAuthenticationStatusForInfrastructure(infra.id, true);
                    navStore.dispatchTriggerAASListReload();
                    navStore.dispatchTriggerTreeviewReload();

                    navStore.dispatchSnackbar({
                        status: true,
                        timeout: 4000,
                        color: 'success',
                        btnColor: 'buttonText',
                        text: 'Successfully authenticated with OAuth2',
                    });
                    hideOverlay();
                } else {
                    // For authorization-code flow, use the form composable which handles the redirect flow
                    const { useOAuth2Form } = await import('@/composables/Auth/useOAuth2Form');
                    const oauth2Form = useOAuth2Form();

                    // Load current infrastructure config
                    oauth2Form.loadFromInfrastructure(infra);

                    // Authenticate - this will redirect the page for auth-code flow
                    await oauth2Form.authenticate(infra.id);
                }
            } catch (error: unknown) {
                hideOverlay();
                navStore.dispatchSnackbar({
                    status: true,
                    timeout: 4000,
                    color: 'error',
                    btnColor: 'buttonText',
                    text: 'OAuth2 authentication failed',
                    extendedError: error instanceof Error ? error.message : 'Unknown error',
                });
            }
            return;
        }

        // Handle Keycloak login
        if (infra.auth?.keycloakConfig) {
            const config = infra.auth.keycloakConfig;

            if (!config.serverUrl || !config.realm || !config.clientId || !config.authFlow) {
                navStore.dispatchSnackbar({
                    status: true,
                    timeout: 4000,
                    color: 'error',
                    btnColor: 'buttonText',
                    text: 'Keycloak configuration incomplete',
                });
                return;
            }

            try {
                if (config.authFlow === 'auth-code') {
                    const result = await authenticateKeycloak(config);

                    // Update infrastructure with new token
                    const updatedInfra = {
                        ...infra,
                        token: {
                            accessToken: result.accessToken,
                            refreshToken: result.refreshToken,
                            idToken: result.idToken,
                            expiresAt: result.expiresAt,
                        },
                    };
                    infrastructureStore.dispatchUpdateInfrastructure(updatedInfra);
                    infrastructureStore.setAuthenticationStatusForInfrastructure(infra.id, true);
                    navStore.dispatchTriggerAASListReload();
                    navStore.dispatchTriggerTreeviewReload();

                    navStore.dispatchSnackbar({
                        status: true,
                        timeout: 4000,
                        color: 'success',
                        btnColor: 'buttonText',
                        text: 'Successfully authenticated',
                    });
                } else {
                    // For client-credentials and password flows, need to open the dialog
                    infrastructureStore.dispatchTriggerInfrastructureDialog(true);
                }
            } catch (error: unknown) {
                navStore.dispatchSnackbar({
                    status: true,
                    timeout: 4000,
                    color: 'error',
                    btnColor: 'buttonText',
                    text: 'Authentication failed',
                    extendedError: error instanceof Error ? error.message : 'Unknown error',
                });
            }
            return;
        }

        // No authentication configured
        navStore.dispatchSnackbar({
            status: true,
            timeout: 4000,
            color: 'warning',
            btnColor: 'buttonText',
            text: 'No authentication configured for this infrastructure',
        });
    }

    /**
     * Clear local token and update UI
     */
    function clearLocalToken(): void {
        const infra = infrastructureStore.getSelectedInfrastructure;
        if (infra) {
            infrastructureStore.setAuthenticationStatusForInfrastructure(infra.id, false);
            const updatedInfra = { ...infra, token: undefined };
            infrastructureStore.dispatchUpdateInfrastructure(updatedInfra);
            navStore.dispatchClearAASList();
            navStore.dispatchClearTreeview();

            // Clear query params if router is available
            if (router) {
                router.push({ query: {} });
            }

            navStore.dispatchSnackbar({
                status: true,
                timeout: 3000,
                color: 'success',
                btnColor: 'buttonText',
                text: 'Logged out successfully',
            });
        }
    }

    /**
     * Perform logout for the current infrastructure
     * Handles OAuth2 and Keycloak logout flows
     */
    async function logout(): Promise<void> {
        const infra = infrastructureStore.getSelectedInfrastructure;
        if (!infra) return;

        // Open popup window
        const width = 500;
        const height = 600;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;

        let logoutUrl: URL;
        const redirectUri = `${window.location.origin}/keycloak-logout.html`;

        // Handle OAuth2 logout
        if (infra.auth?.oauth2) {
            const host = infra.auth.oauth2.host;
            if (!host) {
                return;
            }

            try {
                // Fetch end_session_endpoint from well-known configuration
                const wellKnownUrl = `${host}/.well-known/openid-configuration`;
                const wellKnownResponse = await fetch(wellKnownUrl);

                if (!wellKnownResponse.ok) {
                    throw new Error('Failed to fetch OpenID configuration');
                }

                const wellKnownConfig = await wellKnownResponse.json();
                const endSessionEndpoint = wellKnownConfig.end_session_endpoint;

                if (!endSessionEndpoint) {
                    // If no end_session_endpoint, just clear local token
                    clearLocalToken();
                    return;
                }

                logoutUrl = new URL(endSessionEndpoint);
                logoutUrl.searchParams.set('post_logout_redirect_uri', redirectUri);

                // Add id_token_hint if available (required by some OAuth2 providers)
                const idToken = infra.token?.idToken;
                if (idToken) {
                    logoutUrl.searchParams.set('id_token_hint', idToken);
                } else {
                    // Some providers accept client_id instead of id_token_hint
                    if (infra.auth.oauth2?.clientId) {
                        logoutUrl.searchParams.set('client_id', infra.auth.oauth2.clientId);
                    }
                }
            } catch (error) {
                navStore.dispatchSnackbar({
                    status: true,
                    timeout: 4000,
                    color: 'error',
                    btnColor: 'buttonText',
                    text: 'Failed to initiate logout',
                    extendedError: error instanceof Error ? error.message : 'Unknown error',
                });
                // Fallback: just clear local token
                clearLocalToken();
                return;
            }
        }
        // Handle Keycloak logout
        else if (infra.auth?.keycloakConfig) {
            const serverUrl = infra.auth.keycloakConfig.serverUrl;
            const realm = infra.auth.keycloakConfig.realm;
            const idToken = infra.token?.idToken;

            if (!serverUrl || !realm) {
                return;
            }

            // Build Keycloak logout URL
            logoutUrl = new URL(`${serverUrl.replace(/\/$/, '')}/realms/${realm}/protocol/openid-connect/logout`);
            logoutUrl.searchParams.set('post_logout_redirect_uri', redirectUri);
            if (idToken) {
                logoutUrl.searchParams.set('id_token_hint', idToken);
            }
        } else {
            return;
        }

        // Show overlay before opening popup
        showOverlay();

        const keycloakPopup = window.open(
            logoutUrl.toString(),
            'keycloak-logout',
            `width=${width},height=${height},left=${left},top=${top},popup=yes,resizable=yes,scrollbars=yes`
        );

        if (!keycloakPopup) {
            hideOverlay();
            throw new Error('Failed to open logout popup. Please allow popups for this site.');
        }

        // Listen for messages from popup
        const messageHandler = async (event: MessageEvent): Promise<void> => {
            if (event.origin !== window.location.origin) return;
            if (event.data && event.data.type === 'keycloak-logout-complete') {
                const currentInfra = infrastructureStore.getSelectedInfrastructure;
                if (currentInfra) {
                    infrastructureStore.setAuthenticationStatusForInfrastructure(currentInfra.id, false);
                    // Remove token from infrastructure
                    const updatedInfra = { ...currentInfra, token: undefined };
                    infrastructureStore.dispatchUpdateInfrastructure(updatedInfra);
                    navStore.dispatchClearAASList();
                    navStore.dispatchClearTreeview();

                    // Clear query params if router is available
                    if (router) {
                        router.push({ query: {} });
                    }
                }
                hideOverlay();
                window.removeEventListener('message', messageHandler);
                if (keycloakPopup && !keycloakPopup.closed) {
                    keycloakPopup.close();
                }
            }
        };

        window.addEventListener('message', messageHandler);

        // Monitor if popup is closed manually
        const popupCheckInterval = setInterval(() => {
            if (keycloakPopup && keycloakPopup.closed) {
                clearInterval(popupCheckInterval);
                hideOverlay();
                window.removeEventListener('message', messageHandler);
                // Don't remove token if popup was just closed without completing logout
            }
        }, 500);
    }

    return {
        login,
        logout,
        clearLocalToken,
    };
}
