import type { InfrastructureConfig } from '@/types/Infrastructure';
import { type Ref, ref } from 'vue';

/**
 * Composable for managing Basic Authentication and Bearer Token form state
 */
export function useBasicAuthForm(): {
    basicAuthUsername: Ref<string>;
    basicAuthPassword: Ref<string>;
    bearerToken: Ref<string>;
    loadFromInfrastructure: (infra: InfrastructureConfig) => void;
    saveToInfrastructure: (infra: InfrastructureConfig) => void;
    resetForm: () => void;
} {
    // Form fields
    const basicAuthUsername = ref<string>('');
    const basicAuthPassword = ref<string>('');
    const bearerToken = ref<string>('');

    /**
     * Load authentication configuration from infrastructure
     */
    function loadFromInfrastructure(infra: InfrastructureConfig): void {
        const auth = infra.auth;

        if (!auth) {
            resetForm();
            return;
        }

        // Load Basic Auth
        if (auth.basicAuth) {
            basicAuthUsername.value = auth.basicAuth.username || '';
            basicAuthPassword.value = auth.basicAuth.password || '';
        } else {
            basicAuthUsername.value = '';
            basicAuthPassword.value = '';
        }

        // Load Bearer Token
        if (auth.bearerToken) {
            bearerToken.value = auth.bearerToken.token || '';
        } else {
            bearerToken.value = '';
        }
    }

    /**
     * Save authentication configuration to infrastructure
     */
    function saveToInfrastructure(infra: InfrastructureConfig): void {
        if (!infra.auth) return;

        const securityType = infra.auth.securityType;

        if (securityType === 'Basic Authentication') {
            infra.auth.basicAuth = {
                username: basicAuthUsername.value || '',
                password: basicAuthPassword.value || '',
            };
        } else if (securityType === 'Bearer Token') {
            infra.auth.bearerToken = {
                token: bearerToken.value || '',
            };
        }
    }

    /**
     * Reset form to initial state
     */
    function resetForm(): void {
        basicAuthUsername.value = '';
        basicAuthPassword.value = '';
        bearerToken.value = '';
    }

    return {
        // Form fields
        basicAuthUsername,
        basicAuthPassword,
        bearerToken,
        // Methods
        loadFromInfrastructure,
        saveToInfrastructure,
        resetForm,
    };
}
