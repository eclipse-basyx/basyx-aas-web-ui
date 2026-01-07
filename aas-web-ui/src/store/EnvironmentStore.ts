import { defineStore } from 'pinia';
import { urlRegex } from '@/composables/UrlUtils';

const isProduction = import.meta.env.MODE === 'production';

// Helper function for extracting initial URL query parameter
function extractInitialUrlQueryParameter(): any {
    const params = new URLSearchParams(window.location.search);
    return Object.fromEntries(params.entries());
}

// Helper function to parse boolean environment variables
// Handles both quoted ("true") and unquoted (true/True/TRUE) YAML values
function parseBooleanEnv(value: string): boolean {
    return value?.toLowerCase() === 'true';
}

export const useEnvStore = defineStore('envStore', () => {
    const initialUrlQueryParameter = ref(extractInitialUrlQueryParameter());

    // States
    const basePath = ref(import.meta.env.VITE_BASE_PATH || (isProduction ? '/__BASE_PATH_PLACEHOLDER__/' : ''));
    const logoLightPath = ref(
        import.meta.env.VITE_LOGO_LIGHT_PATH || (isProduction ? '/__LOGO_LIGHT_PATH_PLACEHOLDER__/' : '')
    );
    const logoDarkPath = ref(
        import.meta.env.VITE_LOGO_DARK_PATH || (isProduction ? '/__LOGO_DARK_PATH_PLACEHOLDER__/' : '')
    );
    const aasDiscoveryPath = ref(
        import.meta.env.VITE_AAS_DISCOVERY_PATH || (isProduction ? '/__AAS_DISCOVERY_PATH_PLACEHOLDER__/' : '')
    );
    const aasRegistryPath = ref(
        import.meta.env.VITE_AAS_REGISTRY_PATH || (isProduction ? '/__AAS_REGISTRY_PATH_PLACEHOLDER__/' : '')
    );
    const submodelRegistryPath = ref(
        import.meta.env.VITE_SUBMODEL_REGISTRY_PATH || (isProduction ? '/__SUBMODEL_REGISTRY_PATH_PLACEHOLDER__/' : '')
    );
    const aasRepoPath = ref(
        import.meta.env.VITE_AAS_REPO_PATH || (isProduction ? '/__AAS_REPO_PATH_PLACEHOLDER__/' : '')
    );
    const submodelRepoPath = ref(
        import.meta.env.VITE_SUBMODEL_REPO_PATH || (isProduction ? '/__SUBMODEL_REPO_PATH_PLACEHOLDER__/' : '')
    );
    const conceptDescriptionRepoPath = ref(
        import.meta.env.VITE_CD_REPO_PATH || (isProduction ? '/__CD_REPO_PATH_PLACEHOLDER__/' : '')
    );
    const primaryLightColor = ref(
        import.meta.env.VITE_PRIMARY_LIGHT_COLOR || (isProduction ? '/__PRIMARY_LIGHT_COLOR_PLACEHOLDER__/' : '')
    );
    const primaryDarkColor = ref(
        import.meta.env.VITE_PRIMARY_DARK_COLOR || (isProduction ? '/__PRIMARY_DARK_COLOR_PLACEHOLDER__/' : '')
    );
    const influxdbToken = ref(
        import.meta.env.VITE_INFLUXDB_TOKEN || (isProduction ? '/__INFLUXDB_TOKEN_PLACEHOLDER__/' : '')
    );
    const keycloakActive = ref(
        import.meta.env.VITE_KEYCLOAK_ACTIVE || (isProduction ? '/__KEYCLOAK_ACTIVE_PLACEHOLDER__/' : '')
    );
    const keycloakUrl = ref(
        import.meta.env.VITE_KEYCLOAK_URL || (isProduction ? '/__KEYCLOAK_URL_PLACEHOLDER__/' : '')
    );
    const keycloakRealm = ref(
        import.meta.env.VITE_KEYCLOAK_REALM || (isProduction ? '/__KEYCLOAK_REALM_PLACEHOLDER__/' : '')
    );
    const keycloakClientId = ref(
        import.meta.env.VITE_KEYCLOAK_CLIENT_ID || (isProduction ? '/__KEYCLOAK_CLIENT_ID_PLACEHOLDER__/' : '')
    );
    const keycloakFeatureControl = ref(
        import.meta.env.VITE_KEYCLOAK_FEATURE_CONTROL ||
            (isProduction ? '/__KEYCLOAK_FEATURE_CONTROL_PLACEHOLDER__/' : '')
    );
    const keycloakFeatureControlRolePrefix = ref(
        import.meta.env.VITE_KEYCLOAK_FEATURE_CONTROL_ROLE_PREFIX ||
            (isProduction ? '/__KEYCLOAK_FEATURE_CONTROL_ROLE_PREFIX_PLACEHOLDER__/' : '')
    );
    const oidcActive = ref(import.meta.env.VITE_OIDC_ACTIVE || (isProduction ? '/__OIDC_ACTIVE_PLACEHOLDER__/' : ''));
    const oidcUrl = ref(import.meta.env.VITE_OIDC_URL || (isProduction ? '/__OIDC_URL_PLACEHOLDER__/' : ''));
    const oidcScope = ref(import.meta.env.VITE_OIDC_SCOPE || (isProduction ? '/__OIDC_SCOPE_PLACEHOLDER__/' : ''));
    const oidcClientId = ref(
        import.meta.env.VITE_OIDC_CLIENT_ID || (isProduction ? '/__OIDC_CLIENT_ID_PLACEHOLDER__/' : '')
    );
    const preconfiguredAuth = ref(
        import.meta.env.VITE_PRECONFIGURED_AUTH || (isProduction ? '/__PRECONFIGURED_AUTH_PLACEHOLDER__/' : '')
    );
    const preconfiguredAuthClientSecret = ref(
        import.meta.env.VITE_PRECONFIGURED_AUTH_CLIENT_SECRET ||
            (isProduction ? '/__PRECONFIGURED_AUTH_CLIENT_SECRET_PLACEHOLDER__/' : '')
    );
    const endpointConfigAvailable = ref(
        import.meta.env.VITE_ENDPOINT_CONFIG_AVAILABLE ||
            (isProduction ? '/__ENDPOINT_CONFIG_AVAILABLE_PLACEHOLDER__/' : '')
    );
    const singleAas = ref(import.meta.env.VITE_SINGLE_AAS || (isProduction ? '/__SINGLE_AAS_PLACEHOLDER__/' : ''));
    const singleAasRedirect = ref(
        import.meta.env.VITE_SINGLE_AAS_REDIRECT || (isProduction ? '/__SINGLE_AAS_REDIRECT_PLACEHOLDER__/' : '')
    );
    const smViewerEditor = ref(
        import.meta.env.VITE_SM_VIEWER_EDITOR || (isProduction ? '/__SM_VIEWER_EDITOR_PLACEHOLDER__/' : '')
    );
    const allowEditing = ref(
        import.meta.env.VITE_ALLOW_EDITING || (isProduction ? '/__ALLOW_EDITING_PLACEHOLDER__/' : '')
    );
    const allowUploading = ref(
        import.meta.env.VITE_ALLOW_UPLOADING || (isProduction ? '/__ALLOW_UPLOADING_PLACEHOLDER__/' : '')
    );
    const allowLogout = ref(
        import.meta.env.VITE_ALLOW_LOGOUT || (isProduction ? '/__ALLOW_LOGOUT_PLACEHOLDER__/' : '')
    );
    const basicAuthActive = ref(
        import.meta.env.VITE_BASIC_AUTH_ACTIVE || (isProduction ? '/__BASIC_AUTH_ACTIVE_PLACEHOLDER__/' : '')
    );
    const basicAuthUsername = ref(
        import.meta.env.VITE_BASIC_AUTH_USERNAME || (isProduction ? '/__BASIC_AUTH_USERNAME_PLACEHOLDER__/' : '')
    );
    const basicAuthPassword = ref(
        import.meta.env.VITE_BASIC_AUTH_PASSWORD || (isProduction ? '/__BASIC_AUTH_PASSWORD_PLACEHOLDER__/' : '')
    );
    const editorIdPrefix = ref(
        import.meta.env.VITE_EDITOR_ID_PREFIX || (isProduction ? '/__EDITOR_ID_PREFIX_PLACEHOLDER__/' : '')
    );
    const authorizationPrefix = ref(
        import.meta.env.VITE_AUTHORIZATION_HEADER_PREFIX ||
            (isProduction ? '/__AUTHORIZATION_HEADER_PREFIX_PLACEHOLDER__/' : '')
    );
    const authorizationDescriptionEndpointExemption = ref(
        import.meta.env.VITE_AUTHORIZATION_HEADER_DESCRIPTION_ENDPOINT_EXEMPTION ||
            (isProduction ? '/__AUTHORIZATION_HEADER_DESCRIPTION_ENDPOINT_EXEMPTION_PLACEHOLDER__/' : '')
    );

    // Getters
    const getEnvBasePath = computed(() => basePath.value);
    const getEnvLogoLightPath = computed(() => logoLightPath.value);
    const getEnvLogoDarkPath = computed(() => logoDarkPath.value);
    const getEnvAASDiscoveryPath = computed(() => aasDiscoveryPath.value);
    const getEnvAASRegistryPath = computed(() => aasRegistryPath.value);
    const getEnvSubmodelRegistryPath = computed(() => submodelRegistryPath.value);
    const getEnvAASRepoPath = computed(() => aasRepoPath.value);
    const getEnvSubmodelRepoPath = computed(() => submodelRepoPath.value);
    const getEnvConceptDescriptionRepoPath = computed(() => conceptDescriptionRepoPath.value);
    const getEnvPrimaryLightColor = computed(() => primaryLightColor.value);
    const getEnvPrimaryDarkColor = computed(() => primaryDarkColor.value);
    const getEnvInfluxdbToken = computed(() => influxdbToken.value);
    const getKeycloakActive = computed(() => parseBooleanEnv(keycloakActive.value));
    const getKeycloakUrl = computed(() => keycloakUrl.value);
    const getKeycloakRealm = computed(() => keycloakRealm.value);
    const getKeycloakClientId = computed(() => keycloakClientId.value);
    const getKeycloakFeatureControl = computed(() => parseBooleanEnv(keycloakFeatureControl.value));
    const getKeycloakFeatureControlRolePrefix = computed(() => keycloakFeatureControlRolePrefix.value);
    const getOidcActive = computed(() => parseBooleanEnv(oidcActive.value));
    const getOidcUrl = computed(() => oidcUrl.value);
    const getOidcScope = computed(() => oidcScope.value);
    const getOidcClientId = computed(() => oidcClientId.value);
    const getPreconfiguredAuth = computed(
        () =>
            !Object.hasOwn(initialUrlQueryParameter.value, 'ignorePreConfAuth') &&
            parseBooleanEnv(preconfiguredAuth.value)
    );
    const getPreconfiguredAuthClientSecret = computed(() => preconfiguredAuthClientSecret.value);
    const getEndpointConfigAvailable = computed(() => parseBooleanEnv(endpointConfigAvailable.value));
    const getSingleAas = computed(() => parseBooleanEnv(singleAas.value));
    const getSingleAasRedirect = computed(() => {
        if (parseBooleanEnv(singleAas.value) && singleAasRedirect.value) {
            if (urlRegex.test(singleAasRedirect.value)) {
                return singleAasRedirect.value;
            }
            return undefined;
        }
        return undefined;
    });
    const getSmViewerEditor = computed(() => parseBooleanEnv(smViewerEditor.value));
    const getAllowEditing = computed(() => parseBooleanEnv(allowEditing.value));
    const getAllowUploading = computed(() => parseBooleanEnv(allowUploading.value));
    const getAllowLogout = computed(() => parseBooleanEnv(allowLogout.value));
    const getBasicAuthActive = computed(() => parseBooleanEnv(basicAuthActive.value));
    const getBasicAuthUsername = computed(() => basicAuthUsername.value);
    const getBasicAuthPassword = computed(() => basicAuthPassword.value);
    const getEditorIdPrefix = computed(() => {
        editorIdPrefix.value = editorIdPrefix.value.trim();

        // Ensures editorIdPrefix ends with '/'
        if (editorIdPrefix.value !== '' && !editorIdPrefix.value.endsWith('/')) {
            editorIdPrefix.value += '/';
        }
        return editorIdPrefix.value;
    });
    const getAuthorizationPrefix = computed(() => authorizationPrefix.value);
    const getAuthorizationDescriptionEndpointExemption = computed(() =>
        parseBooleanEnv(authorizationDescriptionEndpointExemption.value)
    );

    // Actions
    function setSingleAas(singleAasValue: string): void {
        singleAas.value = singleAasValue;
    }

    function setSmViewerEditor(smViewerEditorValue: string): void {
        smViewerEditor.value = smViewerEditorValue;
    }

    function setAllowEditing(allowEditingValue: string): void {
        allowEditing.value = allowEditingValue;
    }

    function setAllowUploading(allowUploadingValue: string): void {
        allowUploading.value = allowUploadingValue;
    }

    function setAllowLogout(allowLogoutValue: string): void {
        allowLogout.value = allowLogoutValue;
    }

    function setEndpointConfigAvailable(endpointConfigAvailableValue: string): void {
        endpointConfigAvailable.value = endpointConfigAvailableValue;
    }

    return {
        // Getters
        getEnvBasePath,
        getEnvLogoLightPath,
        getEnvLogoDarkPath,
        getEnvAASDiscoveryPath,
        getEnvAASRegistryPath,
        getEnvSubmodelRegistryPath,
        getEnvAASRepoPath,
        getEnvSubmodelRepoPath,
        getEnvConceptDescriptionRepoPath,
        getEnvPrimaryLightColor,
        getEnvPrimaryDarkColor,
        getEnvInfluxdbToken,
        getKeycloakActive,
        getKeycloakUrl,
        getKeycloakRealm,
        getKeycloakClientId,
        getKeycloakFeatureControl,
        getKeycloakFeatureControlRolePrefix,
        getOidcActive,
        getOidcUrl,
        getOidcScope,
        getOidcClientId,
        getPreconfiguredAuth,
        getPreconfiguredAuthClientSecret,
        getEndpointConfigAvailable,
        getSingleAas,
        getSingleAasRedirect,
        getSmViewerEditor,
        getAllowEditing,
        getAllowUploading,
        getAllowLogout,
        getBasicAuthActive,
        getBasicAuthUsername,
        getBasicAuthPassword,
        getEditorIdPrefix,
        getAuthorizationPrefix,
        getAuthorizationDescriptionEndpointExemption,

        // Actions
        setSingleAas,
        setSmViewerEditor,
        setAllowEditing,
        setAllowUploading,
        setAllowLogout,
        setEndpointConfigAvailable,
    };
});
