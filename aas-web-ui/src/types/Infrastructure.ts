import type { BaSyxComponentKey } from '@/types/BaSyx'

/**
 * Security types supported for infrastructure authentication
 */
export type SecurityType = 'No Authentication' | 'Basic Authentication' | 'Bearer Token' | 'OAuth2'

/**
 * Supported infrastructure topology templates
 */
export type InfrastructureTemplate = 'full' | 'identifiable' | 'mono-repo' | 'mono-all' | 'catena-x'

/**
 * Basic authentication credentials
 */
export interface BasicAuthData {
  username: string
  password: string
}

/**
 * Bearer token authentication
 */
export interface BearerTokenData {
  token: string
}

/**
 * OAuth2 configuration for authentication
 */
export interface OAuth2ConnectionData {
  host: string
  clientId: string
  authFlow?: 'client-credentials' | 'auth-code'
  clientSecret?: string
  scope?: string
  tokenEndpoint?: string
  authorizationEndpoint?: string
}

/**
 * Authentication configuration for a single component
 */
export interface InfrastructureAuth {
  securityType: SecurityType
  basicAuth?: BasicAuthData
  bearerToken?: BearerTokenData
  oauth2?: OAuth2ConnectionData
}

/**
 * Token data with expiration
 */
export interface TokenData {
  accessToken: string
  refreshToken?: string
  idToken?: string
  expiresAt?: number
}

/**
 * Configuration for a single BaSyx component within an infrastructure
 */
export interface ComponentConfig {
  url: string
  hasRegistryIntegration?: boolean
  hasDiscoveryIntegration?: boolean
}

/**
 * Public Catena-X EDC metadata. This deliberately contains no Management API
 * URL or API key; those belong to the server-side EDC proxy configuration.
 */
export interface CatenaXEdcConfig {
  proxyId: string
  defaultCounterPartyId?: string
  defaultCounterPartyAddress?: string
}

export interface CatenaXConfig {
  edc?: CatenaXEdcConfig
}

/**
 * Complete infrastructure configuration
 */
export interface InfrastructureConfig {
  id: string
  name: string
  template: InfrastructureTemplate
  isDefault?: boolean
  auth?: InfrastructureAuth
  token?: TokenData
  isAuthenticated?: boolean
  components: {
    [key in BaSyxComponentKey]: ComponentConfig;
  }
  catenaX?: CatenaXConfig
  /**
   * Hash of the original YAML configuration (if loaded from YAML)
   * Used to detect when YAML file has been updated
   */
  yamlHash?: string
  /**
   * Flag indicating that the YAML source has been updated but user has local edits
   * When true, UI should warn user that their edits may override newer YAML config
   */
  yamlConfigOutdated?: boolean
}

/**
 * Storage schema for infrastructures in localStorage
 */
export interface InfrastructureStorage {
  infrastructures: InfrastructureConfig[]
  selectedInfrastructureId: string | null
}

export type UserData = {
  username: string
  name?: string
  given_name?: string
  family_name?: string
  email?: string
  roles?: string[]
}

/**
 * Auth flow option for dropdown selections
 */
export interface AuthFlowOption {
  text: string
  value: string
}

/**
 * Connection status for BaSyx components during testing
 */
export type ComponentConnectionStatus = Record<BaSyxComponentKey, boolean | null>

/**
 * Form data structure for OAuth2 authentication
 */
export interface OAuth2FormData {
  scope: string
  host: string
  clientId: string
  clientSecret: string
  username: string
  password: string
}

/**
 * Token state used in forms
 */
export interface AuthTokenState {
  accessToken: string
  refreshToken?: string
  expiresAt?: number
  idToken?: string
}

/**
 * Loading state for component connection testing
 */
export type ComponentTestingLoading = Record<BaSyxComponentKey, boolean>

/**
 * YAML Configuration Types
 * These types represent the structure of the basyx-infra.yml file
 */

/**
 * Component configuration in YAML format (uses camelCase and baseUrl)
 */
export interface YamlComponentConfig {
  baseUrl: string
  hasRegistryIntegration?: boolean
  hasDiscoveryIntegration?: boolean
}

/**
 * Security configuration in YAML format
 */
export interface YamlSecurityConfig {
  type: 'none' | 'basic' | 'bearer' | 'oauth2'
  config?: {
    // Basic auth
    username?: string
    password?: string
    // Bearer token
    token?: string
    // OAuth2
    flow?: 'auth_code' | 'client_credentials'
    issuer?: string
    clientId?: string
    clientSecret?: string
    scope?: string
  }
}

/**
 * Single infrastructure configuration in YAML format
 */
export interface YamlInfrastructureConfig {
  name?: string
  template?: InfrastructureTemplate | string
  components: {
    aasDiscovery?: YamlComponentConfig
    aasRegistry?: YamlComponentConfig
    submodelRegistry?: YamlComponentConfig
    aasRepository?: YamlComponentConfig
    submodelRepository?: YamlComponentConfig
    conceptDescriptionRepository?: YamlComponentConfig
    aasEnvironment?: YamlComponentConfig
    digitalTwinRegistry?: YamlComponentConfig
    submodelService?: YamlComponentConfig
  }
  catenaX?: {
    edc?: {
      proxyId?: string
      defaultCounterPartyId?: string
      defaultCounterPartyAddress?: string
    }
  }
  security: YamlSecurityConfig
}

/**
 * Root YAML configuration structure
 */
export interface YamlInfrastructuresConfig {
  infrastructures: {
    [key: string]: YamlInfrastructureConfig | string | undefined
    default?: string
  }
}

/**
 * Parsed infrastructure configuration ready for use in the app
 */
export interface ParsedInfrastructureConfig {
  infrastructures: InfrastructureConfig[]
  defaultInfrastructureId: string | null
}
