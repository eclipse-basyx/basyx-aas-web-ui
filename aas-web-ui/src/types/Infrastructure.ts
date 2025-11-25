import type { BaSyxComponentKey } from '@/types/BaSyx';

/**
 * Security types supported for infrastructure authentication
 */
export type SecurityType = 'No Authentication' | 'Keycloak' | 'Basic Authentication' | 'Bearer Token';

/**
 * Keycloak configuration for authentication
 */
export interface KeycloakConnectionData {
    serverUrl: string;
    realm: string;
    clientId: string;
    authFlow: 'auth-code' | 'client-credentials' | 'password';
    clientSecret?: string;
    username?: string;
    password?: string;
}

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
 * Authentication configuration for a single component
 */
export interface InfrastructureAuth {
    securityType: SecurityType;
    keycloakConfig?: KeycloakConnectionData;
    basicAuth?: BasicAuthData;
    bearerToken?: BearerTokenData;
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
