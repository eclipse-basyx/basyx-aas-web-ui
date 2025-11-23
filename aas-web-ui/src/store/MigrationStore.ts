/**
 * MigrationStore.ts
 *
 * Pinia store for managing migration authentication and tokens
 */

import { defineStore } from 'pinia';

export type SecurityType = 'Basic Authentication' | 'Keycloak' | 'Bearer Token';
export type ComponentType = 'aas' | 'submodel' | 'conceptDescription';

export interface KeycloakConnectionData {
    serverUrl: string;
    realm: string;
    clientId: string;
    authFlow: 'auth-code' | 'client-credentials' | 'password';
    clientSecret?: string;
    username?: string;
    password?: string;
}

export interface BasicAuthData {
    username: string;
    password: string;
}

export interface BearerTokenData {
    token: string;
}

export interface ComponentConnectionData {
    endpoint: string;
    securityEnabled: boolean;
    securityType: SecurityType;
    keycloakConfig?: KeycloakConnectionData;
    basicAuth?: BasicAuthData;
    bearerToken?: BearerTokenData;
}

export interface TokenData {
    accessToken: string;
    refreshToken?: string;
    expiresAt?: number;
}

interface MigrationState {
    // Source components
    sourceAasConnection: ComponentConnectionData | null;
    sourceAasToken: TokenData | null;
    sourceSubmodelConnection: ComponentConnectionData | null;
    sourceSubmodelToken: TokenData | null;
    sourceConceptDescriptionConnection: ComponentConnectionData | null;
    sourceConceptDescriptionToken: TokenData | null;

    // Destination components
    destinationAasConnection: ComponentConnectionData | null;
    destinationAasToken: TokenData | null;
    destinationSubmodelConnection: ComponentConnectionData | null;
    destinationSubmodelToken: TokenData | null;
    destinationConceptDescriptionConnection: ComponentConnectionData | null;
    destinationConceptDescriptionToken: TokenData | null;
}

export const useMigrationStore = defineStore('migration', {
    state: (): MigrationState => ({
        sourceAasConnection: null,
        sourceAasToken: null,
        sourceSubmodelConnection: null,
        sourceSubmodelToken: null,
        sourceConceptDescriptionConnection: null,
        sourceConceptDescriptionToken: null,
        destinationAasConnection: null,
        destinationAasToken: null,
        destinationSubmodelConnection: null,
        destinationSubmodelToken: null,
        destinationConceptDescriptionConnection: null,
        destinationConceptDescriptionToken: null,
    }),

    getters: {
        // Source getters
        hasSourceAasConnection: (state): boolean => state.sourceAasConnection !== null,
        hasSourceAasToken: (state): boolean => state.sourceAasToken !== null,
        hasSourceSubmodelConnection: (state): boolean => state.sourceSubmodelConnection !== null,
        hasSourceSubmodelToken: (state): boolean => state.sourceSubmodelToken !== null,
        hasSourceConceptDescriptionConnection: (state): boolean => state.sourceConceptDescriptionConnection !== null,
        hasSourceConceptDescriptionToken: (state): boolean => state.sourceConceptDescriptionToken !== null,

        // Destination getters
        hasDestinationAasConnection: (state): boolean => state.destinationAasConnection !== null,
        hasDestinationAasToken: (state): boolean => state.destinationAasToken !== null,
        hasDestinationSubmodelConnection: (state): boolean => state.destinationSubmodelConnection !== null,
        hasDestinationSubmodelToken: (state): boolean => state.destinationSubmodelToken !== null,
        hasDestinationConceptDescriptionConnection: (state): boolean =>
            state.destinationConceptDescriptionConnection !== null,
        hasDestinationConceptDescriptionToken: (state): boolean => state.destinationConceptDescriptionToken !== null,

        // Access token getters
        getSourceAasAccessToken: (state): string | null => state.sourceAasToken?.accessToken || null,
        getSourceSubmodelAccessToken: (state): string | null => state.sourceSubmodelToken?.accessToken || null,
        getSourceConceptDescriptionAccessToken: (state): string | null =>
            state.sourceConceptDescriptionToken?.accessToken || null,
        getDestinationAasAccessToken: (state): string | null => state.destinationAasToken?.accessToken || null,
        getDestinationSubmodelAccessToken: (state): string | null =>
            state.destinationSubmodelToken?.accessToken || null,
        getDestinationConceptDescriptionAccessToken: (state): string | null =>
            state.destinationConceptDescriptionToken?.accessToken || null,

        // Token expiration getters
        isSourceAasTokenExpired: (state): boolean => {
            if (!state.sourceAasToken?.expiresAt) return true;
            return Date.now() >= state.sourceAasToken.expiresAt;
        },
        isSourceSubmodelTokenExpired: (state): boolean => {
            if (!state.sourceSubmodelToken?.expiresAt) return true;
            return Date.now() >= state.sourceSubmodelToken.expiresAt;
        },
        isSourceConceptDescriptionTokenExpired: (state): boolean => {
            if (!state.sourceConceptDescriptionToken?.expiresAt) return true;
            return Date.now() >= state.sourceConceptDescriptionToken.expiresAt;
        },
        isDestinationAasTokenExpired: (state): boolean => {
            if (!state.destinationAasToken?.expiresAt) return true;
            return Date.now() >= state.destinationAasToken.expiresAt;
        },
        isDestinationSubmodelTokenExpired: (state): boolean => {
            if (!state.destinationSubmodelToken?.expiresAt) return true;
            return Date.now() >= state.destinationSubmodelToken.expiresAt;
        },
        isDestinationConceptDescriptionTokenExpired: (state): boolean => {
            if (!state.destinationConceptDescriptionToken?.expiresAt) return true;
            return Date.now() >= state.destinationConceptDescriptionToken.expiresAt;
        },
    },

    actions: {
        // Set connection data
        setSourceConnection(component: ComponentType, connection: ComponentConnectionData): void {
            if (component === 'aas') this.sourceAasConnection = connection;
            else if (component === 'submodel') this.sourceSubmodelConnection = connection;
            else if (component === 'conceptDescription') this.sourceConceptDescriptionConnection = connection;
        },

        setDestinationConnection(component: ComponentType, connection: ComponentConnectionData): void {
            if (component === 'aas') this.destinationAasConnection = connection;
            else if (component === 'submodel') this.destinationSubmodelConnection = connection;
            else if (component === 'conceptDescription') this.destinationConceptDescriptionConnection = connection;
        },

        // Set tokens
        setSourceToken(component: ComponentType, token: TokenData): void {
            if (component === 'aas') this.sourceAasToken = token;
            else if (component === 'submodel') this.sourceSubmodelToken = token;
            else if (component === 'conceptDescription') this.sourceConceptDescriptionToken = token;
        },

        setDestinationToken(component: ComponentType, token: TokenData): void {
            if (component === 'aas') this.destinationAasToken = token;
            else if (component === 'submodel') this.destinationSubmodelToken = token;
            else if (component === 'conceptDescription') this.destinationConceptDescriptionToken = token;
        },

        // Get connection data
        getSourceConnection(component: ComponentType): ComponentConnectionData | null {
            if (component === 'aas') return this.sourceAasConnection;
            if (component === 'submodel') return this.sourceSubmodelConnection;
            if (component === 'conceptDescription') return this.sourceConceptDescriptionConnection;
            return null;
        },

        getDestinationConnection(component: ComponentType): ComponentConnectionData | null {
            if (component === 'aas') return this.destinationAasConnection;
            if (component === 'submodel') return this.destinationSubmodelConnection;
            if (component === 'conceptDescription') return this.destinationConceptDescriptionConnection;
            return null;
        },

        // Get tokens
        getSourceToken(component: ComponentType): TokenData | null {
            if (component === 'aas') return this.sourceAasToken;
            if (component === 'submodel') return this.sourceSubmodelToken;
            if (component === 'conceptDescription') return this.sourceConceptDescriptionToken;
            return null;
        },

        getDestinationToken(component: ComponentType): TokenData | null {
            if (component === 'aas') return this.destinationAasToken;
            if (component === 'submodel') return this.destinationSubmodelToken;
            if (component === 'conceptDescription') return this.destinationConceptDescriptionToken;
            return null;
        },

        // Clear connections
        clearSourceConnection(component: ComponentType): void {
            if (component === 'aas') {
                this.sourceAasConnection = null;
                this.sourceAasToken = null;
            } else if (component === 'submodel') {
                this.sourceSubmodelConnection = null;
                this.sourceSubmodelToken = null;
            } else if (component === 'conceptDescription') {
                this.sourceConceptDescriptionConnection = null;
                this.sourceConceptDescriptionToken = null;
            }
        },

        clearDestinationConnection(component: ComponentType): void {
            if (component === 'aas') {
                this.destinationAasConnection = null;
                this.destinationAasToken = null;
            } else if (component === 'submodel') {
                this.destinationSubmodelConnection = null;
                this.destinationSubmodelToken = null;
            } else if (component === 'conceptDescription') {
                this.destinationConceptDescriptionConnection = null;
                this.destinationConceptDescriptionToken = null;
            }
        },

        clearAllSource(): void {
            this.sourceAasConnection = null;
            this.sourceAasToken = null;
            this.sourceSubmodelConnection = null;
            this.sourceSubmodelToken = null;
            this.sourceConceptDescriptionConnection = null;
            this.sourceConceptDescriptionToken = null;
        },

        clearAllDestination(): void {
            this.destinationAasConnection = null;
            this.destinationAasToken = null;
            this.destinationSubmodelConnection = null;
            this.destinationSubmodelToken = null;
            this.destinationConceptDescriptionConnection = null;
            this.destinationConceptDescriptionToken = null;
        },

        clearAll(): void {
            this.clearAllSource();
            this.clearAllDestination();
        },

        /**
         * Refresh token for Keycloak authenticated connections
         */
        async refreshToken(mode: 'source' | 'destination', component: ComponentType): Promise<void> {
            const connection =
                mode === 'source' ? this.getSourceConnection(component) : this.getDestinationConnection(component);
            const token = mode === 'source' ? this.getSourceToken(component) : this.getDestinationToken(component);

            if (!connection?.keycloakConfig || !token?.refreshToken) {
                throw new Error('No Keycloak connection or refresh token available');
            }

            const { serverUrl, realm, clientId, clientSecret } = connection.keycloakConfig;
            const tokenEndpoint = `${serverUrl.replace(/\/$/, '')}/realms/${realm}/protocol/openid-connect/token`;

            const params = new URLSearchParams({
                client_id: clientId,
                grant_type: 'refresh_token',
                refresh_token: token.refreshToken,
            });

            if (clientSecret) {
                params.set('client_secret', clientSecret);
            }

            const response = await fetch(tokenEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: params.toString(),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error_description || 'Token refresh failed');
            }

            // Calculate expiration time (usually 5 minutes)
            const expiresIn = data.expires_in || 300;
            const expiresAt = Date.now() + expiresIn * 1000;

            const newToken: TokenData = {
                accessToken: data.access_token,
                refreshToken: data.refresh_token || token.refreshToken,
                expiresAt,
            };

            if (mode === 'source') {
                this.setSourceToken(component, newToken);
            } else {
                this.setDestinationToken(component, newToken);
            }
        },
    },
});
