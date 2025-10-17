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
    const username = ref('' as string | undefined);

    // Getters
    const getToken = computed(() => token.value);
    const getRefreshToken = computed(() => refreshToken.value);
    const getAuthStatus = computed(() => authStatus.value);
    const getAuthEnabled = computed(() => authEnabled.value);
    const getKeycloak = computed(() => keycloak.value);
    const getRefreshIntervalId = computed(() => refreshIntervalId.value);
    const getUsername = computed(() => username.value);

    // Initialize from localStorage on store creation
    function initializeFromStorage(): void {
        const storedToken = localStorage.getItem('auth_token');
        const storedRefreshToken = localStorage.getItem('auth_refresh_token');
        const storedAuthStatus = localStorage.getItem('auth_status');
        const storedUsername = localStorage.getItem('auth_username');

        if (storedToken && storedAuthStatus === 'true') {
            token.value = storedToken;
            refreshToken.value = storedRefreshToken || undefined;
            authStatus.value = true;
            authEnabled.value = true;
            username.value = storedUsername || undefined;
        }
    }

    // Actions
    function setToken(tokenValue: string | undefined): void {
        token.value = tokenValue;
        if (tokenValue) {
            localStorage.setItem('auth_token', tokenValue);
        } else {
            localStorage.removeItem('auth_token');
        }
    }

    function setRefreshToken(refreshTokenValue: string | undefined): void {
        refreshToken.value = refreshTokenValue;
        if (refreshTokenValue) {
            localStorage.setItem('auth_refresh_token', refreshTokenValue);
        } else {
            localStorage.removeItem('auth_refresh_token');
        }
    }

    function setAuthStatus(authStatusValue: boolean): void {
        authStatus.value = authStatusValue;
        localStorage.setItem('auth_status', authStatusValue.toString());
        if (!authStatusValue) {
            // Clear all auth data when status is false
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_refresh_token');
            localStorage.removeItem('auth_username');
        }
    }

    function setAuthEnabled(authEnabledValue: boolean): void {
        authEnabled.value = authEnabledValue;
    }

    function setKeycloak(keycloakValue: Keycloak | null): void {
        keycloak.value = keycloakValue;
    }

    function setRefreshIntervalId(refreshIntervalIdValue: number | undefined): void {
        // Clear existing interval only when:
        // 1. Setting to undefined (clearing the interval)
        // 2. Replacing with a different interval ID
        if (
            refreshIntervalId.value &&
            (refreshIntervalIdValue === undefined || refreshIntervalId.value !== refreshIntervalIdValue)
        ) {
            window.clearInterval(refreshIntervalId.value);
        }
        refreshIntervalId.value = refreshIntervalIdValue;
    }

    function setUsername(usernameValue: string | undefined): void {
        username.value = usernameValue;
        if (usernameValue) {
            localStorage.setItem('auth_username', usernameValue);
        } else {
            localStorage.removeItem('auth_username');
        }
    }

    // Initialize from localStorage when store is created
    initializeFromStorage();

    return {
        // Getters
        getToken,
        getRefreshToken,
        getAuthStatus,
        getAuthEnabled,
        getKeycloak,
        getRefreshIntervalId,
        getUsername,

        // Actions
        setToken,
        setRefreshToken,
        setAuthStatus,
        setAuthEnabled,
        setKeycloak,
        setRefreshIntervalId,
        setUsername,
    };
});
