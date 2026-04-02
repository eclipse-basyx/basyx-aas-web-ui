import { defineStore } from 'pinia'
import { urlRegex } from '@/composables/UrlUtils'

const isProduction = import.meta.env.MODE === 'production'

// Helper function for extracting initial URL query parameter
function extractInitialUrlQueryParameter (): any {
  const params = new URLSearchParams(window.location.search)
  return Object.fromEntries(params.entries())
}

// Helper function to parse boolean environment variables
// Handles both quoted ("true") and unquoted (true/True/TRUE) YAML values
function parseBooleanEnv (value: string): boolean {
  return value?.toLowerCase() === 'true'
}

function withProductionPlaceholder (value: string | undefined, placeholder: string): string {
  return value || (isProduction ? placeholder : '')
}

export const useEnvStore = defineStore('envStore', () => {
  const initialUrlQueryParameter = ref(extractInitialUrlQueryParameter())

  // States
  const basePath = ref(withProductionPlaceholder(import.meta.env.VITE_BASE_PATH, '/__BASE_PATH_PLACEHOLDER__/'))
  const logoLightPath = ref(withProductionPlaceholder(import.meta.env.VITE_LOGO_LIGHT_PATH, '/__LOGO_LIGHT_PATH_PLACEHOLDER__/'))
  const logoDarkPath = ref(withProductionPlaceholder(import.meta.env.VITE_LOGO_DARK_PATH, '/__LOGO_DARK_PATH_PLACEHOLDER__/'))
  const aasDiscoveryPath = ref(withProductionPlaceholder(import.meta.env.VITE_AAS_DISCOVERY_PATH, '/__AAS_DISCOVERY_PATH_PLACEHOLDER__/'))
  const aasRegistryPath = ref(withProductionPlaceholder(import.meta.env.VITE_AAS_REGISTRY_PATH, '/__AAS_REGISTRY_PATH_PLACEHOLDER__/'))
  const submodelRegistryPath = ref(withProductionPlaceholder(import.meta.env.VITE_SUBMODEL_REGISTRY_PATH, '/__SUBMODEL_REGISTRY_PATH_PLACEHOLDER__/'))
  const aasRepoPath = ref(withProductionPlaceholder(import.meta.env.VITE_AAS_REPO_PATH, '/__AAS_REPO_PATH_PLACEHOLDER__/'))
  const submodelRepoPath = ref(withProductionPlaceholder(import.meta.env.VITE_SUBMODEL_REPO_PATH, '/__SUBMODEL_REPO_PATH_PLACEHOLDER__/'))
  const conceptDescriptionRepoPath = ref(withProductionPlaceholder(import.meta.env.VITE_CD_REPO_PATH, '/__CD_REPO_PATH_PLACEHOLDER__/'))
  const primaryLightColor = ref(withProductionPlaceholder(import.meta.env.VITE_PRIMARY_LIGHT_COLOR, '/__PRIMARY_LIGHT_COLOR_PLACEHOLDER__/'))
  const primaryDarkColor = ref(withProductionPlaceholder(import.meta.env.VITE_PRIMARY_DARK_COLOR, '/__PRIMARY_DARK_COLOR_PLACEHOLDER__/'))
  const influxdbToken = ref(withProductionPlaceholder(import.meta.env.VITE_INFLUXDB_TOKEN, '/__INFLUXDB_TOKEN_PLACEHOLDER__/'))
  const keycloakActive = ref(withProductionPlaceholder(import.meta.env.VITE_KEYCLOAK_ACTIVE, '/__KEYCLOAK_ACTIVE_PLACEHOLDER__/'))
  const keycloakUrl = ref(withProductionPlaceholder(import.meta.env.VITE_KEYCLOAK_URL, '/__KEYCLOAK_URL_PLACEHOLDER__/'))
  const keycloakRealm = ref(withProductionPlaceholder(import.meta.env.VITE_KEYCLOAK_REALM, '/__KEYCLOAK_REALM_PLACEHOLDER__/'))
  const keycloakClientId = ref(withProductionPlaceholder(import.meta.env.VITE_KEYCLOAK_CLIENT_ID, '/__KEYCLOAK_CLIENT_ID_PLACEHOLDER__/'))
  const keycloakFeatureControl = ref(withProductionPlaceholder(import.meta.env.VITE_KEYCLOAK_FEATURE_CONTROL, '/__KEYCLOAK_FEATURE_CONTROL_PLACEHOLDER__/'))
  const keycloakFeatureControlRolePrefix = ref(withProductionPlaceholder(import.meta.env.VITE_KEYCLOAK_FEATURE_CONTROL_ROLE_PREFIX, '/__KEYCLOAK_FEATURE_CONTROL_ROLE_PREFIX_PLACEHOLDER__/'))
  const oidcActive = ref(withProductionPlaceholder(import.meta.env.VITE_OIDC_ACTIVE, '/__OIDC_ACTIVE_PLACEHOLDER__/'))
  const oidcUrl = ref(withProductionPlaceholder(import.meta.env.VITE_OIDC_URL, '/__OIDC_URL_PLACEHOLDER__/'))
  const oidcScope = ref(withProductionPlaceholder(import.meta.env.VITE_OIDC_SCOPE, '/__OIDC_SCOPE_PLACEHOLDER__/'))
  const oidcClientId = ref(withProductionPlaceholder(import.meta.env.VITE_OIDC_CLIENT_ID, '/__OIDC_CLIENT_ID_PLACEHOLDER__/'))
  const preconfiguredAuth = ref(withProductionPlaceholder(import.meta.env.VITE_PRECONFIGURED_AUTH, '/__PRECONFIGURED_AUTH_PLACEHOLDER__/'))
  const preconfiguredAuthClientSecret = ref(withProductionPlaceholder(import.meta.env.VITE_PRECONFIGURED_AUTH_CLIENT_SECRET, '/__PRECONFIGURED_AUTH_CLIENT_SECRET_PLACEHOLDER__/'))
  const endpointConfigAvailable = ref(withProductionPlaceholder(import.meta.env.VITE_ENDPOINT_CONFIG_AVAILABLE, '/__ENDPOINT_CONFIG_AVAILABLE_PLACEHOLDER__/'))
  const singleAas = ref(withProductionPlaceholder(import.meta.env.VITE_SINGLE_AAS, '/__SINGLE_AAS_PLACEHOLDER__/'))
  const singleAasRedirect = ref(withProductionPlaceholder(import.meta.env.VITE_SINGLE_AAS_REDIRECT, '/__SINGLE_AAS_REDIRECT_PLACEHOLDER__/'))
  const smViewerEditor = ref(withProductionPlaceholder(import.meta.env.VITE_SM_VIEWER_EDITOR, '/__SM_VIEWER_EDITOR_PLACEHOLDER__/'))
  const allowEditing = ref(withProductionPlaceholder(import.meta.env.VITE_ALLOW_EDITING, '/__ALLOW_EDITING_PLACEHOLDER__/'))
  const allowUploading = ref(withProductionPlaceholder(import.meta.env.VITE_ALLOW_UPLOADING, '/__ALLOW_UPLOADING_PLACEHOLDER__/'))
  const allowLogout = ref(withProductionPlaceholder(import.meta.env.VITE_ALLOW_LOGOUT, '/__ALLOW_LOGOUT_PLACEHOLDER__/'))
  const basicAuthActive = ref(withProductionPlaceholder(import.meta.env.VITE_BASIC_AUTH_ACTIVE, '/__BASIC_AUTH_ACTIVE_PLACEHOLDER__/'))
  const basicAuthUsername = ref(withProductionPlaceholder(import.meta.env.VITE_BASIC_AUTH_USERNAME, '/__BASIC_AUTH_USERNAME_PLACEHOLDER__/'))
  const basicAuthPassword = ref(withProductionPlaceholder(import.meta.env.VITE_BASIC_AUTH_PASSWORD, '/__BASIC_AUTH_PASSWORD_PLACEHOLDER__/'))
  const editorIdPrefix = ref(withProductionPlaceholder(import.meta.env.VITE_EDITOR_ID_PREFIX, '/__EDITOR_ID_PREFIX_PLACEHOLDER__/'))
  const authorizationPrefix = ref(withProductionPlaceholder(import.meta.env.VITE_AUTHORIZATION_HEADER_PREFIX, '/__AUTHORIZATION_HEADER_PREFIX_PLACEHOLDER__/'))
  const authorizationDescriptionEndpointExemption = ref(withProductionPlaceholder(import.meta.env.VITE_AUTHORIZATION_HEADER_DESCRIPTION_ENDPOINT_EXEMPTION, '/__AUTHORIZATION_HEADER_DESCRIPTION_ENDPOINT_EXEMPTION_PLACEHOLDER__/'))
  const startPageRouteName = ref(withProductionPlaceholder(import.meta.env.VITE_START_PAGE_ROUTE_NAME, '/__START_PAGE_ROUTE_NAME_PLACEHOLDER__/'))

  // Getters
  const getEnvBasePath = computed(() => basePath.value)
  const getEnvLogoLightPath = computed(() => logoLightPath.value)
  const getEnvLogoDarkPath = computed(() => logoDarkPath.value)
  const getEnvAASDiscoveryPath = computed(() => aasDiscoveryPath.value)
  const getEnvAASRegistryPath = computed(() => aasRegistryPath.value)
  const getEnvSubmodelRegistryPath = computed(() => submodelRegistryPath.value)
  const getEnvAASRepoPath = computed(() => aasRepoPath.value)
  const getEnvSubmodelRepoPath = computed(() => submodelRepoPath.value)
  const getEnvConceptDescriptionRepoPath = computed(() => conceptDescriptionRepoPath.value)
  const getEnvPrimaryLightColor = computed(() => primaryLightColor.value)
  const getEnvPrimaryDarkColor = computed(() => primaryDarkColor.value)
  const getEnvInfluxdbToken = computed(() => influxdbToken.value)
  const getKeycloakActive = computed(() => parseBooleanEnv(keycloakActive.value))
  const getKeycloakUrl = computed(() => keycloakUrl.value)
  const getKeycloakRealm = computed(() => keycloakRealm.value)
  const getKeycloakClientId = computed(() => keycloakClientId.value)
  const getKeycloakFeatureControl = computed(() => parseBooleanEnv(keycloakFeatureControl.value))
  const getKeycloakFeatureControlRolePrefix = computed(() => keycloakFeatureControlRolePrefix.value)
  const getOidcActive = computed(() => parseBooleanEnv(oidcActive.value))
  const getOidcUrl = computed(() => oidcUrl.value)
  const getOidcScope = computed(() => oidcScope.value)
  const getOidcClientId = computed(() => oidcClientId.value)
  const getPreconfiguredAuth = computed(
    () =>
      !Object.hasOwn(initialUrlQueryParameter.value, 'ignorePreConfAuth')
      && parseBooleanEnv(preconfiguredAuth.value),
  )
  const getPreconfiguredAuthClientSecret = computed(() => preconfiguredAuthClientSecret.value)
  const getEndpointConfigAvailable = computed(() => parseBooleanEnv(endpointConfigAvailable.value))
  const getSingleAas = computed(() => parseBooleanEnv(singleAas.value))
  const getSingleAasRedirect = computed(() => {
    if (parseBooleanEnv(singleAas.value) && singleAasRedirect.value) {
      if (urlRegex.test(singleAasRedirect.value)) {
        return singleAasRedirect.value
      }
      return undefined
    }
    return undefined
  })
  const getSmViewerEditor = computed(() => parseBooleanEnv(smViewerEditor.value))
  const getAllowEditing = computed(() => parseBooleanEnv(allowEditing.value))
  const getAllowUploading = computed(() => parseBooleanEnv(allowUploading.value))
  const getAllowLogout = computed(() => parseBooleanEnv(allowLogout.value))
  const getBasicAuthActive = computed(() => parseBooleanEnv(basicAuthActive.value))
  const getBasicAuthUsername = computed(() => basicAuthUsername.value)
  const getBasicAuthPassword = computed(() => basicAuthPassword.value)
  const getEditorIdPrefix = computed(() => {
    editorIdPrefix.value = editorIdPrefix.value.trim()

    // Ensures editorIdPrefix ends with '/'
    if (editorIdPrefix.value !== '' && !editorIdPrefix.value.endsWith('/')) {
      editorIdPrefix.value += '/'
    }
    return editorIdPrefix.value
  })
  const getAuthorizationPrefix = computed(() => authorizationPrefix.value)
  const getAuthorizationDescriptionEndpointExemption = computed(() =>
    parseBooleanEnv(authorizationDescriptionEndpointExemption.value),
  )

  const getStartPageRouteName = computed(() => {
    const value = (startPageRouteName.value || '').trim()
    if (value === '' || value.includes('PLACEHOLDER')) {
      return ''
    }
    return value
  })

  // Actions
  function setSingleAas (singleAasValue: string): void {
    singleAas.value = singleAasValue
  }

  function setSmViewerEditor (smViewerEditorValue: string): void {
    smViewerEditor.value = smViewerEditorValue
  }

  function setAllowEditing (allowEditingValue: string): void {
    allowEditing.value = allowEditingValue
  }

  function setAllowUploading (allowUploadingValue: string): void {
    allowUploading.value = allowUploadingValue
  }

  function setAllowLogout (allowLogoutValue: string): void {
    allowLogout.value = allowLogoutValue
  }

  function setEndpointConfigAvailable (endpointConfigAvailableValue: string): void {
    endpointConfigAvailable.value = endpointConfigAvailableValue
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
    getStartPageRouteName,

    // Actions
    setSingleAas,
    setSmViewerEditor,
    setAllowEditing,
    setAllowUploading,
    setAllowLogout,
    setEndpointConfigAvailable,
  }
})
