import type { AuthTokenState, InfrastructureConfig, OAuth2FormData } from '@/types/Infrastructure';
import { type Ref, ref } from 'vue';
import {
    authenticateOAuth2ClientCredentials,
    initiateOAuth2AuthorizationCodeFlow,
} from '@/composables/Auth/OAuth2Auth';
import { useNavigationStore } from '@/store/NavigationStore';

/**
 * Composable for managing OAuth2 authentication form state and logic
 */
export function useOAuth2Form(): {
    formData: Ref<OAuth2FormData>;
    authFlow: Ref<string>;
    token: Ref<AuthTokenState | null>;
    loading: Ref<boolean>;
    loadFromInfrastructure: (infra: InfrastructureConfig) => void;
    saveToInfrastructure: (infra: InfrastructureConfig) => void;
    authenticate: (infrastructureId: string) => Promise<void>;
    resetForm: () => void;
} {
    const navigationStore = useNavigationStore();

    // Form data
    const formData = ref<OAuth2FormData>({
        scope: '',
        host: '',
        clientId: '',
        clientSecret: '',
        username: '',
        password: '',
    });

    const authFlow = ref<string>('');

    // State
    const token = ref<AuthTokenState | null>(null);
    const loading = ref<boolean>(false);

    /**
     * Load OAuth2 configuration from infrastructure
     */
    function loadFromInfrastructure(infra: InfrastructureConfig): void {
        const auth = infra.auth;
        const tokenData = infra.token;

        if (!auth?.oauth2) {
            resetForm();
            return;
        }

        formData.value.host = auth.oauth2.host || '';
        formData.value.clientId = auth.oauth2.clientId || '';
        formData.value.clientSecret = auth.oauth2.clientSecret || '';
        formData.value.scope = auth.oauth2.scope || '';
        formData.value.username = '';
        formData.value.password = '';
        authFlow.value = auth.oauth2.authFlow || 'client-credentials';

        // Load existing token if available
        if (tokenData) {
            token.value = {
                accessToken: tokenData.accessToken,
                refreshToken: tokenData.refreshToken,
                expiresAt: tokenData.expiresAt,
                idToken: tokenData.idToken,
            };
        } else {
            token.value = null;
        }
    }

    /**
     * Save OAuth2 configuration to infrastructure
     */
    function saveToInfrastructure(infra: InfrastructureConfig): void {
        if (!infra.auth) return;

        infra.auth.oauth2 = {
            host: formData.value.host || '',
            clientId: formData.value.clientId || '',
            clientSecret: formData.value.clientSecret || '',
            scope: formData.value.scope || '',
            authFlow: authFlow.value as 'client-credentials' | 'auth-code',
        };

        // Save token data if authenticated
        if (token.value) {
            infra.token = {
                accessToken: token.value.accessToken,
                refreshToken: token.value.refreshToken,
                expiresAt: token.value.expiresAt,
                idToken: token.value.idToken,
            };
        }
    }

    /**
     * Authenticate with OAuth2
     * @param infrastructureId - The ID of the infrastructure being authenticated (used as state parameter for auth-code flow)
     */
    async function authenticate(infrastructureId: string): Promise<void> {
        if (!formData.value.host || !formData.value.clientId) {
            navigationStore.dispatchSnackbar({
                status: true,
                timeout: 4000,
                color: 'error',
                btnColor: 'buttonText',
                text: 'Please fill in OAuth2 host and client ID',
            });
            return;
        }

        if (authFlow.value === 'client-credentials') {
            if (!formData.value.clientSecret) {
                navigationStore.dispatchSnackbar({
                    status: true,
                    timeout: 4000,
                    color: 'error',
                    btnColor: 'buttonText',
                    text: 'Client secret is required for client credentials flow',
                });
                return;
            }

            loading.value = true;
            try {
                const tokenResult = await authenticateOAuth2ClientCredentials({
                    host: formData.value.host,
                    clientId: formData.value.clientId,
                    clientSecret: formData.value.clientSecret,
                    scope: formData.value.scope || '',
                });

                // Store token in local state
                token.value = {
                    accessToken: tokenResult.accessToken,
                    refreshToken: tokenResult.refreshToken,
                    expiresAt: tokenResult.expiresAt,
                    idToken: tokenResult.idToken,
                };

                navigationStore.dispatchSnackbar({
                    status: true,
                    timeout: 4000,
                    color: 'success',
                    btnColor: 'buttonText',
                    text: 'OAuth2 authentication successful. Save infrastructure to persist.',
                });

                navigationStore.dispatchTriggerAASListReload();
                navigationStore.dispatchTriggerTreeviewReload();
            } catch (error) {
                navigationStore.dispatchSnackbar({
                    status: true,
                    timeout: 8000,
                    color: 'error',
                    btnColor: 'buttonText',
                    text: 'OAuth2 authentication failed',
                    extendedError: error instanceof Error ? error.message : 'Unknown error occurred',
                });
            } finally {
                loading.value = false;
            }
        } else if (authFlow.value === 'auth-code') {
            // Authorization Code Flow with PKCE
            loading.value = true;
            try {
                // Fetch well-known configuration to get authorization endpoint
                const wellKnownUrl = `${formData.value.host}/.well-known/openid-configuration`;
                let authorizationEndpoint;

                try {
                    const wellKnownResponse = await fetch(wellKnownUrl);

                    if (wellKnownResponse.ok) {
                        const wellKnownConfig = await wellKnownResponse.json();
                        authorizationEndpoint = wellKnownConfig.authorization_endpoint;
                    }
                } catch (error) {
                    console.warn('[useOAuth2Form] Failed to fetch .well-known configuration, using fallback', error);
                }

                // Fallback to host + /authorize if well-known config is not available
                if (!authorizationEndpoint) {
                    const normalizedHost = formData.value.host.endsWith('/')
                        ? formData.value.host.slice(0, -1)
                        : formData.value.host;
                    authorizationEndpoint = `${normalizedHost}/authorize`;
                }

                // Use infrastructure ID as state parameter so router can find the infrastructure after callback
                const state = infrastructureId;

                // Normalize redirect URI (remove trailing slash for root path)
                const pathname = window.location.pathname;
                const redirectUri = `${window.location.origin}${pathname}`;

                // Initiate authorization code flow (will redirect to OAuth2 provider)
                await initiateOAuth2AuthorizationCodeFlow({
                    authorizationEndpoint,
                    clientId: formData.value.clientId,
                    redirectUri,
                    scope: formData.value.scope || 'openid profile email',
                    state,
                });
            } catch (error) {
                loading.value = false;
                navigationStore.dispatchSnackbar({
                    status: true,
                    timeout: 8000,
                    color: 'error',
                    btnColor: 'buttonText',
                    text: 'Failed to initiate OAuth2 authorization flow',
                    extendedError: error instanceof Error ? error.message : 'Unknown error occurred',
                });
            }
        }
    }

    /**
     * Reset form to initial state
     */
    function resetForm(): void {
        formData.value = {
            scope: '',
            host: '',
            clientId: '',
            clientSecret: '',
            username: '',
            password: '',
        };
        authFlow.value = '';
        token.value = null;
    }

    return {
        // Form data
        formData,
        authFlow,
        // State
        token,
        loading,
        // Methods
        loadFromInfrastructure,
        saveToInfrastructure,
        authenticate,
        resetForm,
    };
}
