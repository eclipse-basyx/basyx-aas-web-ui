import type { BaSyxComponentKey } from '@/types/BaSyx';

/**
 * Security types supported for infrastructure authentication
 */
export type SecurityType = 'No Authentication' | 'Basic Authentication' | 'Bearer Token' | 'OAuth2';

/**
 * Basic authentication credentials
 */
export interface BasicAuthData {
    username: string;
    password: string;
}

/**
 * Bearer token authentication
 */
export interface BearerTokenData {
    token: string;
}

/**
 * OAuth2 configuration for authentication
 */
export interface OAuth2ConnectionData {
    host: string;
    clientId: string;
    authFlow?: 'client-credentials' | 'auth-code';
    clientSecret?: string;
    scope?: string;
    tokenEndpoint?: string;
    authorizationEndpoint?: string;
}

/**
 * Authentication configuration for a single component
 */
export interface InfrastructureAuth {
    securityType: SecurityType;
    basicAuth?: BasicAuthData;
    bearerToken?: BearerTokenData;
    oauth2?: OAuth2ConnectionData;
}

/**
 * Token data with expiration
 */
export interface TokenData {
    accessToken: string;
    refreshToken?: string;
    idToken?: string;
    expiresAt?: number;
}

/**
 * Configuration for a single BaSyx component within an infrastructure
 */
export interface ComponentConfig {
    url: string;
}

/**
 * Complete infrastructure configuration
 */
export interface InfrastructureConfig {
    id: string;
    name: string;
    isDefault?: boolean;
    auth?: InfrastructureAuth;
    token?: TokenData;
    isAuthenticated?: boolean;
    components: {
        [key in BaSyxComponentKey]: ComponentConfig;
    };
}

/**
 * Storage schema for infrastructures in localStorage
 */
export interface InfrastructureStorage {
    infrastructures: InfrastructureConfig[];
    selectedInfrastructureId: string | null;
}

export type UserData = {
    username: string;
    name?: string;
    given_name?: string;
    family_name?: string;
    email?: string;
    roles?: string[];
};

/**
 * Auth flow option for dropdown selections
 */
export interface AuthFlowOption {
    text: string;
    value: string;
}

/**
 * Connection status for BaSyx components during testing
 */
export type ComponentConnectionStatus = Record<BaSyxComponentKey, boolean | null>;

/**
 * Form data structure for OAuth2 authentication
 */
export interface OAuth2FormData {
    scope: string;
    host: string;
    clientId: string;
    clientSecret: string;
    username: string;
    password: string;
}

/**
 * Token state used in forms
 */
export interface AuthTokenState {
    accessToken: string;
    refreshToken?: string;
    expiresAt?: number;
    idToken?: string;
}

/**
 * Loading state for component connection testing
 */
export type ComponentTestingLoading = Record<BaSyxComponentKey, boolean>;
