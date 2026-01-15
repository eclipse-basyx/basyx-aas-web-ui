import type { InfrastructureConfig } from '@/types/Infrastructure';

/**
 * Composable for managing infrastructure authentication and token refresh
 * Handles token refresh for OAuth2 authentication
 */
export function useInfrastructureAuth(): {
    refreshInfrastructureTokens: (
        infrastructures: InfrastructureConfig[],
        infrastructureId?: string
    ) => Promise<Array<{ infraName: string; error: string }>>;
    setAuthenticationStatusForInfrastructure: (
        infrastructures: InfrastructureConfig[],
        infrastructureId: string,
        state: boolean
    ) => void;
} {
    /**
     * Refreshes expired or expiring tokens for all infrastructures with OAuth2 authentication.
     * Tokens are refreshed if they expire within 5 minutes (300 seconds).
     * @param infrastructures Array of infrastructure configurations
     * @param infrastructureId Optional specific infrastructure ID to refresh
     * @returns Array of failed refresh attempts with infrastructure info
     */
    async function refreshInfrastructureTokens(
        infrastructures: InfrastructureConfig[],
        infrastructureId?: string
    ): Promise<Array<{ infraName: string; error: string }>> {
        const failures: Array<{ infraName: string; error: string }> = [];
        const TOKEN_REFRESH_BUFFER = 5 * 60 * 1000; // 5 minutes in milliseconds
        const now = Date.now();

        for (const infrastructure of infrastructures) {
            if (infrastructureId && infrastructure.id !== infrastructureId) {
                continue; // Skip if a specific infrastructureId is provided and doesn't match
            }
            const auth = infrastructure.auth;
            const token = infrastructure.token;

            // Check if infrastructure uses OAuth2 and has a token
            if (auth?.securityType !== 'OAuth2' || !token?.accessToken) {
                continue;
            }

            // Check if token is expired or expiring soon
            if (!token.expiresAt || token.expiresAt > now + TOKEN_REFRESH_BUFFER) {
                infrastructure.isAuthenticated = true; // Token is still valid
                continue;
            }

            // Token needs refresh - set to false
            infrastructure.isAuthenticated = false;

            // Attempt token refresh
            try {
                if (!token.refreshToken) {
                    // No refresh token available (e.g., client credentials flow)
                    // If is OAuth2 client-credentials, we can re-authenticate
                    if (auth.oauth2?.authFlow === 'client-credentials') {
                        const { authenticateOAuth2ClientCredentials } = await import('@/composables/Auth/OAuth2Auth');
                        const result = await authenticateOAuth2ClientCredentials(auth.oauth2);
                        // Update token in infrastructure
                        infrastructure.token = {
                            accessToken: result.accessToken,
                            refreshToken: result.refreshToken,
                            expiresAt: result.expiresAt,
                            idToken: result.idToken,
                        };
                        infrastructure.isAuthenticated = true;
                        if (process.env.NODE_ENV === 'development') {
                            console.warn(
                                `[useInfrastructureAuth] Re-authenticated (OAuth2 client-credentials) for ${infrastructure.name}`
                            );
                        }
                        continue;
                    }
                    failures.push({
                        infraName: infrastructure.name,
                        error: 'No refresh token available - re-authentication required',
                    });
                    continue;
                }

                // Handle OAuth2 token refresh
                else if (auth.securityType === 'OAuth2') {
                    if (!auth.oauth2) {
                        failures.push({
                            infraName: infrastructure.name,
                            error: 'Missing OAuth2 configuration',
                        });
                        continue;
                    }

                    // Fetch token endpoint from well-known configuration
                    const wellKnownUrl = `${auth.oauth2.host}/.well-known/openid-configuration`;
                    let tokenEndpoint;

                    try {
                        const wellKnownResponse = await fetch(wellKnownUrl);

                        if (wellKnownResponse.ok) {
                            const wellKnownConfig = await wellKnownResponse.json();
                            tokenEndpoint = wellKnownConfig.token_endpoint;
                        }
                    } catch (error) {
                        console.warn(
                            `[useInfrastructureAuth] Failed to fetch .well-known configuration for ${infrastructure.name}, using fallback`,
                            error
                        );
                    }

                    // Fallback to host + /token if well-known config is not available
                    if (!tokenEndpoint) {
                        const normalizedHost = auth.oauth2.host.endsWith('/')
                            ? auth.oauth2.host.slice(0, -1)
                            : auth.oauth2.host;
                        tokenEndpoint = `${normalizedHost}/token`;
                    }

                    const { refreshOAuth2Token } = await import('@/composables/Auth/OAuth2Auth');
                    const result = await refreshOAuth2Token({
                        tokenEndpoint,
                        clientId: auth.oauth2.clientId,
                        refreshToken: token.refreshToken,
                        clientSecret: auth.oauth2.clientSecret,
                    });

                    // Update token in infrastructure
                    infrastructure.token = {
                        accessToken: result.accessToken,
                        refreshToken: result.refreshToken,
                        expiresAt: result.expiresAt,
                        idToken: result.idToken,
                    };
                    infrastructure.isAuthenticated = true;
                    if (process.env.NODE_ENV === 'development') {
                        console.warn(`[useInfrastructureAuth] Refreshed OAuth2 token for ${infrastructure.name}`);
                    }
                }
            } catch (error) {
                failures.push({
                    infraName: infrastructure.name,
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }

        return failures;
    }

    /**
     * Sets the authentication status for a specific infrastructure
     * @param infrastructures Array of infrastructure configurations
     * @param infrastructureId Infrastructure ID to update
     * @param state New authentication state
     */
    function setAuthenticationStatusForInfrastructure(
        infrastructures: InfrastructureConfig[],
        infrastructureId: string,
        state: boolean
    ): void {
        const infrastructure = infrastructures.find((i) => i.id === infrastructureId);
        if (!infrastructure) {
            return;
        }
        infrastructure.isAuthenticated = state;
    }

    return {
        refreshInfrastructureTokens,
        setAuthenticationStatusForInfrastructure,
    };
}
