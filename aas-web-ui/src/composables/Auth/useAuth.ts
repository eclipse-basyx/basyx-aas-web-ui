import { type Router } from 'vue-router';
import { useInfrastructureStore } from '@/store/InfrastructureStore';
import { useNavigationStore } from '@/store/NavigationStore';

/**
 * Composable for handling authentication logic
 * Centralizes login and logout functionality for OAuth2
 */
export function useAuth(router?: Router) {
    const infrastructureStore = useInfrastructureStore();
    const navStore = useNavigationStore();

    /**
     * Perform login for the current infrastructure
     * Handles OAuth2 (both flows) authentication
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
                        return;
                    }

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
     * Handles OAuth2 logout flow
     */
    async function logout(): Promise<void> {
        const infra = infrastructureStore.getSelectedInfrastructure;
        if (!infra) return;
        // Handle OAuth2 logout
        if (infra.auth?.oauth2) {
            const host = infra.auth.oauth2.host;
            if (!host) {
                return;
            }
            let logoutUrl;
            try {
                // Fetch end_session_endpoint from well-known configuration
                const wellKnownUrl = `${host}/.well-known/openid-configuration`;
                let endSessionEndpoint;

                try {
                    const wellKnownResponse = await fetch(wellKnownUrl);

                    if (wellKnownResponse.ok) {
                        const wellKnownConfig = await wellKnownResponse.json();
                        endSessionEndpoint = wellKnownConfig.end_session_endpoint;
                    }
                } catch (error) {
                    console.warn('[useAuth] Failed to fetch .well-known configuration for logout', error);
                }

                if (!endSessionEndpoint) {
                    // Fallback to host + /logout if well-known config doesn't provide end_session_endpoint
                    const normalizedHost = host.endsWith('/') ? host.slice(0, -1) : host;
                    endSessionEndpoint = `${normalizedHost}/logout`;
                }

                logoutUrl = new URL(endSessionEndpoint);
                logoutUrl.searchParams.set(
                    'post_logout_redirect_uri',
                    window.location.origin + window.location.pathname
                );

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
            clearLocalToken();
            window.location.href = logoutUrl.toString();
            return;
        } else {
            // No logout URL - just clear local token
            clearLocalToken();
            return;
        }
    }

    return {
        login,
        logout,
        clearLocalToken,
    };
}
