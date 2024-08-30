import Keycloak from 'keycloak-js';
import { defineStore } from 'pinia';

export const useAuthStore = defineStore({
    id: 'authStore',
    state: () => ({
        token: '' as string | undefined,
        refreshToken: '' as string | undefined,
        authStatus: false as boolean,
        authEnabled: false as boolean,
        keycloak: null as Keycloak | null,
    }),
    getters: {
        getToken: (state) => state.token,
        getRefreshToken: (state) => state.refreshToken,
        getAuthStatus: (state) => state.authStatus,
        getAuthEnabled: (state) => state.authEnabled,
        getKeycloak: (state) => state.keycloak,
    },
    actions: {
        setToken(token: string | undefined) {
            this.token = token;
        },
        setRefreshToken(refreshToken: string | undefined) {
            this.refreshToken = refreshToken;
        },
        setAuthStatus(authStatus: boolean) {
            this.authStatus = authStatus;
        },
        setAuthEnabled(authEnabled: boolean) {
            this.authEnabled = authEnabled;
        },
        setKeycloak(keycloak: Keycloak | null) {
            this.keycloak = keycloak;
        },
    },
});
