import Keycloak from 'keycloak-js';
import { defineStore } from 'pinia';

export const useAuthStore = defineStore('authStore', () => {
    // States
    const token = ref('' as string | undefined);
    const refreshToken = ref('' as string | undefined);
    const authStatus = ref(false);
    const authEnabled = ref(false);
    const keycloak = ref(null as Keycloak | null);
    const refreshIntervalId = ref(undefined as number | undefined);

    // Getters
    const getToken = computed(() => token.value);
    const getRefreshToken = computed(() => refreshToken.value);
    const getAuthStatus = computed(() => authStatus.value);
    const getAuthEnabled = computed(() => authEnabled.value);
    const getKeycloak = computed(() => keycloak.value);
    const getRefreshIntervalId = computed(() => refreshIntervalId.value);

    // Actions
    function setToken(tokenValue: string | undefined): void {
        token.value = tokenValue;
    }

    function setRefreshToken(refreshTokenValue: string | undefined): void {
        refreshToken.value = refreshTokenValue;
    }

    function setAuthStatus(authStatusValue: boolean): void {
        authStatus.value = authStatusValue;
    }

    function setAuthEnabled(authEnabledValue: boolean): void {
        authEnabled.value = authEnabledValue;
    }

    function setKeycloak(keycloakValue: Keycloak | null): void {
        keycloak.value = keycloakValue;
    }

    function setRefreshIntervalId(refreshIntervalIdValue: number): void {
        refreshIntervalId.value = refreshIntervalIdValue;
    }

    return {
        // Getters
        getToken,
        getRefreshToken,
        getAuthStatus,
        getAuthEnabled,
        getKeycloak,
        getRefreshIntervalId,

        // Actions
        setToken,
        setRefreshToken,
        setAuthStatus,
        setAuthEnabled,
        setKeycloak,
        setRefreshIntervalId,
    };
});
