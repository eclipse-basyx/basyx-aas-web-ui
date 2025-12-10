import type { AuthTokenState, InfrastructureConfig, KeycloakConnectionData } from '@/types/Infrastructure';
import { type Ref, ref } from 'vue';
import { authenticateKeycloak } from '@/composables/Auth/KeycloakAuth';
import { useNavigationStore } from '@/store/NavigationStore';

/**
 * Composable for managing Keycloak authentication form state and logic
 */
export function useKeycloakForm(): {
    serverUrl: Ref<string>;
    realm: Ref<string>;
    clientId: Ref<string>;
    authFlow: Ref<KeycloakConnectionData['authFlow']>;
    clientSecret: Ref<string>;
    username: Ref<string>;
    password: Ref<string>;
    token: Ref<AuthTokenState | null>;
    loading: Ref<boolean>;
    error: Ref<string>;
    loadFromInfrastructure: (infra: InfrastructureConfig) => void;
    saveToInfrastructure: (infra: InfrastructureConfig) => void;
    authenticate: () => Promise<void>;
    resetForm: () => void;
} {
    const navigationStore = useNavigationStore();

    // Form fields
    const serverUrl = ref<string>('');
    const realm = ref<string>('');
    const clientId = ref<string>('');
    const authFlow = ref<KeycloakConnectionData['authFlow']>('auth-code');
    const clientSecret = ref<string>('');
    const username = ref<string>('');
    const password = ref<string>('');

    // State
    const token = ref<AuthTokenState | null>(null);
    const loading = ref<boolean>(false);
    const error = ref<string>('');

    /**
     * Load Keycloak configuration from infrastructure
     */
    function loadFromInfrastructure(infra: InfrastructureConfig): void {
        const auth = infra.auth;
        const tokenData = infra.token;

        if (!auth?.keycloakConfig) {
            resetForm();
            return;
        }

        serverUrl.value = auth.keycloakConfig.serverUrl || '';
        realm.value = auth.keycloakConfig.realm || '';
        clientId.value = auth.keycloakConfig.clientId || '';
        authFlow.value = auth.keycloakConfig.authFlow || 'auth-code';
        clientSecret.value = auth.keycloakConfig.clientSecret || '';
        username.value = auth.keycloakConfig.username || '';
        password.value = auth.keycloakConfig.password || '';

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
     * Save Keycloak configuration to infrastructure
     */
    function saveToInfrastructure(infra: InfrastructureConfig): void {
        if (!infra.auth) return;

        infra.auth.keycloakConfig = {
            serverUrl: serverUrl.value || '',
            realm: realm.value || '',
            clientId: clientId.value || '',
            authFlow: authFlow.value || 'auth-code',
            clientSecret: clientSecret.value,
            username: username.value,
            password: password.value,
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
     * Authenticate with Keycloak
     */
    async function authenticate(): Promise<void> {
        loading.value = true;
        error.value = '';

        const config: KeycloakConnectionData = {
            serverUrl: serverUrl.value,
            realm: realm.value,
            clientId: clientId.value,
            authFlow: authFlow.value,
            clientSecret: clientSecret.value,
            username: username.value,
            password: password.value,
        };

        if (!config.serverUrl || !config.realm || !config.clientId || !config.authFlow) {
            error.value = 'Please fill in all required Keycloak fields';
            loading.value = false;
            return;
        }

        try {
            const result = await authenticateKeycloak(config);
            token.value = {
                accessToken: result.accessToken,
                refreshToken: result.refreshToken,
                expiresAt: result.expiresAt,
                idToken: result.idToken,
            };
            navigationStore.dispatchTriggerAASListReload();
            navigationStore.dispatchTriggerTreeviewReload();
        } catch (err: unknown) {
            error.value = err instanceof Error ? err.message : 'Authentication failed';
        } finally {
            loading.value = false;
        }
    }

    /**
     * Reset form to initial state
     */
    function resetForm(): void {
        serverUrl.value = '';
        realm.value = '';
        clientId.value = '';
        authFlow.value = 'auth-code';
        clientSecret.value = '';
        username.value = '';
        password.value = '';
        token.value = null;
        error.value = '';
    }

    return {
        // Form fields
        serverUrl,
        realm,
        clientId,
        authFlow,
        clientSecret,
        username,
        password,
        // State
        token,
        loading,
        error,
        // Methods
        loadFromInfrastructure,
        saveToInfrastructure,
        authenticate,
        resetForm,
    };
}
