import Keycloak from 'keycloak-js';
import { defineStore } from 'pinia';
import { useEnvStore } from '@/store/EnvironmentStore';
import { base64Decode } from '@/utils/EncodeDecodeUtils';

type UserData = {
    username: string;
    name?: string;
    given_name?: string;
    family_name?: string;
    email?: string;
    roles?: string[];
};

export const useAuthStore = defineStore('authStore', () => {
    // States
    const token = ref('' as string | undefined);
    const refreshToken = ref('' as string | undefined);
    const authStatus = ref(false);
    const authEnabled = ref(false);
    const keycloak = ref(null as Keycloak | null);
    const refreshIntervalId = ref(undefined as number | undefined);

    const user = ref(null as UserData | null);

    // Getters
    const getToken = computed(() => token.value);
    const getRefreshToken = computed(() => refreshToken.value);
    const getAuthStatus = computed(() => authStatus.value);
    const getAuthEnabled = computed(() => authEnabled.value);
    const getKeycloak = computed(() => keycloak.value);
    const getRefreshIntervalId = computed(() => refreshIntervalId.value);
    const getUser = computed(() => user.value);

    // Initialize from localStorage on store creation
    function initializeFromStorage(): void {
        const storedToken = localStorage.getItem('auth_token');
        const storedRefreshToken = localStorage.getItem('auth_refresh_token');
        const storedAuthStatus = localStorage.getItem('auth_status');

        if (storedToken && storedAuthStatus === 'true') {
            token.value = storedToken;
            refreshToken.value = storedRefreshToken || undefined;
            authStatus.value = true;
            authEnabled.value = true;

            const accessTokenPayload = JSON.parse(base64Decode(storedToken.split('.')[1]));
            const user = {
                username: accessTokenPayload?.preferred_username,
                name: accessTokenPayload?.name,
                given_name: accessTokenPayload?.given_name,
                family_name: accessTokenPayload?.family_name,
                email: accessTokenPayload?.email,
                roles: accessTokenPayload?.realm_access?.roles,
            };
            setUser(user);
        }
    }

    // Actions
    function setToken(tokenValue: string | undefined): void {
        token.value = tokenValue;
        if (tokenValue) {
            localStorage.setItem('auth_token', tokenValue);
            const accessTokenPayload = JSON.parse(base64Decode(tokenValue.split('.')[1]));
            const user = {
                username: accessTokenPayload?.preferred_username,
                name: accessTokenPayload?.name,
                given_name: accessTokenPayload?.given_name,
                family_name: accessTokenPayload?.family_name,
                email: accessTokenPayload?.email,
                roles: accessTokenPayload?.realm_access?.roles,
            };
            setUser(user);
        } else {
            localStorage.removeItem('auth_token');
            setUser(null);
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

    function setUser(userValue: UserData | null): void {
        user.value = userValue || null;

        const envStore = useEnvStore();

        if (envStore.getKeycloakFeatureControl) {
            const keycloakFeatureControlRolePrefix = envStore.getKeycloakFeatureControlRolePrefix;
            const keycloak_roles_features = [
                {
                    keycloakRole: keycloakFeatureControlRolePrefix + 'multiple-aas',
                    feature: 'SINGLE_AAS',
                    setFunction: 'setSingleAas',
                    setValue: 'false',
                },
                {
                    keycloakRole: keycloakFeatureControlRolePrefix + 'sm-viewer-editor',
                    feature: 'SM_VIEWER_EDITOR',
                    setFunction: 'setSmViewerEditor',
                    setValue: 'true',
                },
                {
                    keycloakRole: keycloakFeatureControlRolePrefix + 'allow-editing',
                    feature: 'ALLOW_EDITING',
                    setFunction: 'setAllowEditing',
                    setValue: 'true',
                },
                {
                    keycloakRole: keycloakFeatureControlRolePrefix + 'allow-uploading',
                    feature: 'ALLOW_UPLOADING',
                    setFunction: 'setAllowUploading',
                    setValue: 'true',
                },
            ];

            keycloak_roles_features.forEach((keycloak_roles_feature: any) => {
                const key = keycloak_roles_feature.setFunction as keyof typeof envStore;
                if (
                    userValue?.roles?.includes(keycloak_roles_feature.keycloakRole) &&
                    envStore &&
                    typeof envStore[key] === 'function'
                ) {
                    envStore[key]('true');
                }
            });
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
        getUser,

        // Actions
        setToken,
        setRefreshToken,
        setAuthStatus,
        setAuthEnabled,
        setKeycloak,
        setRefreshIntervalId,
        setUser,
    };
});
