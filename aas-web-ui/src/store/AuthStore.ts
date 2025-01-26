import type Keycloak from 'keycloak-js';
import { defineStore } from 'pinia';

export const useAuthStore = defineStore('authStore', () => {
    // State Variables
    const token = ref('' as string);
    const refreshToken = ref('' as string);
    const authStatus = ref(false as boolean);
    const authEnabled = ref(false as boolean);
    const keycloak = ref(null as Keycloak | null);

    // Getters
    const getToken = computed(() => token.value);
    const getRefreshToken = computed(() => refreshToken.value);
    const getAuthStatus = computed(() => authStatus.value);
    const getAuthEnabled = computed(() => authEnabled.value);
    const getKeycloak = computed(() => keycloak.value);

    // Actions
    function setToken(tokenState: string): void {
        token.value = tokenState;
    }
    function setRefreshToken(refreshTokenState: string): void {
        token.value = refreshTokenState;
    }
    function setAuthStatus(authStatusState: boolean): void {
        authStatus.value = authStatusState;
    }
    function setAuthEnabled(authEnabledState: boolean): void {
        authEnabled.value = authEnabledState;
    }
    function setKeycloak(keycloakState: Keycloak | null): void {
        keycloak.value = keycloakState;
    }

    return {
        // Getters
        getToken,
        getRefreshToken,
        getAuthStatus,
        getAuthEnabled,
        getKeycloak,

        // Actions
        setToken,
        setRefreshToken,
        setAuthStatus,
        setAuthEnabled,
        setKeycloak,
    };
});
