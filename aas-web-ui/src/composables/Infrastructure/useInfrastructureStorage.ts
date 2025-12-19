import type { InfrastructureConfig, InfrastructureStorage, OAuth2ConnectionData } from '@/types/Infrastructure';
import { authenticateOAuth2ClientCredentials } from '@/composables/Auth/OAuth2Auth';
/**
 * Composable for managing infrastructure storage operations
 * Handles loading/saving from localStorage, legacy migration, and default infrastructure creation
 */
export function useInfrastructureStorage(): {
    generateInfrastructureId: () => string;
    createEmptyInfrastructure: (name?: string) => InfrastructureConfig;
    createDefaultInfrastructureFromEnv: (
        envConfig: {
            aasDiscoveryPath?: string;
            aasRegistryPath?: string;
            submodelRegistryPath?: string;
            aasRepoPath?: string;
            submodelRepoPath?: string;
            conceptDescriptionRepoPath?: string;
            keycloakActive?: boolean;
            keycloakUrl?: string;
            keycloakRealm?: string;
            keycloakClientId?: string;
            preconfiguredAuth?: boolean;
            preconfiguredAuthClientSecret?: string;
        },
        refreshTokensCallback?: (infrastructureId: string) => Promise<void>
    ) => Promise<InfrastructureConfig>;
    createInfrastructureFromLegacyStorage: () => InfrastructureConfig;
    loadInfrastructuresFromStorage: (
        envConfig: {
            aasDiscoveryPath?: string;
            aasRegistryPath?: string;
            submodelRegistryPath?: string;
            aasRepoPath?: string;
            submodelRepoPath?: string;
            conceptDescriptionRepoPath?: string;
            keycloakActive?: boolean;
            keycloakUrl?: string;
            keycloakRealm?: string;
            keycloakClientId?: string;
            preconfiguredAuth?: boolean;
            preconfiguredAuthClientSecret?: string;
            endpointConfigAvailable?: boolean;
        },
        refreshTokensCallback?: (infrastructureId: string) => Promise<void>
    ) => Promise<{ infrastructures: InfrastructureConfig[]; selectedInfrastructureId: string | null }>;
    saveInfrastructuresToStorage: (
        infrastructures: InfrastructureConfig[],
        selectedInfrastructureId: string | null
    ) => void;
} {
    /**
     * Generates a unique infrastructure ID
     */
    function generateInfrastructureId(): string {
        return 'infra_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    }

    /**
     * Creates an empty infrastructure configuration with default values
     */
    function createEmptyInfrastructure(name: string = 'New Infrastructure'): InfrastructureConfig {
        return {
            id: generateInfrastructureId(),
            name,
            auth: { securityType: 'No Authentication' },
            components: {
                AASDiscovery: {
                    url: '',
                },
                AASRegistry: {
                    url: '',
                },
                SubmodelRegistry: {
                    url: '',
                },
                AASRepo: {
                    url: '',
                },
                SubmodelRepo: {
                    url: '',
                },
                ConceptDescriptionRepo: {
                    url: '',
                },
            },
        };
    }

    /**
     * Creates a default infrastructure from environment variables
     * @param envConfig Environment configuration object containing endpoint paths and Keycloak settings
     * @param refreshTokensCallback Optional callback to refresh tokens for the created infrastructure
     */
    async function createDefaultInfrastructureFromEnv(
        envConfig: {
            aasDiscoveryPath?: string;
            aasRegistryPath?: string;
            submodelRegistryPath?: string;
            aasRepoPath?: string;
            submodelRepoPath?: string;
            conceptDescriptionRepoPath?: string;
            keycloakActive?: boolean;
            keycloakUrl?: string;
            keycloakRealm?: string;
            keycloakClientId?: string;
            preconfiguredAuth?: boolean;
            preconfiguredAuthClientSecret?: string;
        },
        refreshTokensCallback?: (infrastructureId: string) => Promise<void>
    ): Promise<InfrastructureConfig> {
        const infrastructure = createEmptyInfrastructure('Default Infrastructure');
        infrastructure.isDefault = true;

        // Populate from environment variables
        if (envConfig.aasDiscoveryPath) infrastructure.components.AASDiscovery.url = envConfig.aasDiscoveryPath;
        if (envConfig.aasRegistryPath) infrastructure.components.AASRegistry.url = envConfig.aasRegistryPath;
        if (envConfig.submodelRegistryPath)
            infrastructure.components.SubmodelRegistry.url = envConfig.submodelRegistryPath;
        if (envConfig.aasRepoPath) infrastructure.components.AASRepo.url = envConfig.aasRepoPath;
        if (envConfig.submodelRepoPath) infrastructure.components.SubmodelRepo.url = envConfig.submodelRepoPath;
        if (envConfig.conceptDescriptionRepoPath)
            infrastructure.components.ConceptDescriptionRepo.url = envConfig.conceptDescriptionRepoPath;

        if (
            envConfig.keycloakActive ||
            (envConfig.keycloakUrl && envConfig.keycloakRealm && envConfig.keycloakClientId)
        ) {
            const oauth2Config: OAuth2ConnectionData = {
                host: envConfig.keycloakUrl! + '/realms/' + envConfig.keycloakRealm!,
                clientId: envConfig.keycloakClientId!,
                authFlow: 'auth-code',
            };

            if (envConfig.preconfiguredAuth) {
                oauth2Config.clientSecret = envConfig.preconfiguredAuthClientSecret;
                oauth2Config.authFlow = 'client-credentials';
            }

            infrastructure.auth = {
                securityType: 'OAuth2',
                oauth2: oauth2Config,
            };

            if (envConfig.preconfiguredAuth && oauth2Config) {
                // Trigger client-credentials flow
                if (refreshTokensCallback) {
                    await refreshTokensCallback(infrastructure.id);
                }
                const result = await authenticateOAuth2ClientCredentials(oauth2Config);
                infrastructure.token = {
                    accessToken: result.accessToken,
                    refreshToken: result.refreshToken,
                    expiresAt: result.expiresAt,
                    idToken: result.idToken,
                };
            }
        }

        return infrastructure;
    }

    /**
     * Creates an infrastructure from legacy localStorage keys
     * Migrates data from old storage format to new infrastructure format
     */
    function createInfrastructureFromLegacyStorage(): InfrastructureConfig {
        const infrastructure = createEmptyInfrastructure('Legacy Infrastructure');

        // Try to load from old localStorage keys
        const legacyAASDiscoveryURL = window.localStorage.getItem('AASDiscoveryURL');
        const legacyAASRegistryURL = window.localStorage.getItem('AASRegistryURL');
        const legacySubmodelRegistryURL = window.localStorage.getItem('SubmodelRegistryURL');
        const legacyAASRepoURL = window.localStorage.getItem('AASRepoURL');
        const legacySubmodelRepoURL = window.localStorage.getItem('SubmodelRepoURL');
        const legacyConceptDescriptionRepoURL = window.localStorage.getItem('ConceptDescriptionRepoURL');

        if (legacyAASDiscoveryURL) infrastructure.components.AASDiscovery.url = legacyAASDiscoveryURL;
        if (legacyAASRegistryURL) infrastructure.components.AASRegistry.url = legacyAASRegistryURL;
        if (legacySubmodelRegistryURL) infrastructure.components.SubmodelRegistry.url = legacySubmodelRegistryURL;
        if (legacyAASRepoURL) infrastructure.components.AASRepo.url = legacyAASRepoURL;
        if (legacySubmodelRepoURL) infrastructure.components.SubmodelRepo.url = legacySubmodelRepoURL;
        if (legacyConceptDescriptionRepoURL)
            infrastructure.components.ConceptDescriptionRepo.url = legacyConceptDescriptionRepoURL;

        return infrastructure;
    }

    /**
     * Loads infrastructures from localStorage
     * @param envConfig Environment configuration for creating default infrastructure
     * @param refreshTokensCallback Optional callback to refresh tokens
     * @returns Object containing loaded infrastructures and selected infrastructure ID
     */
    async function loadInfrastructuresFromStorage(
        envConfig: {
            aasDiscoveryPath?: string;
            aasRegistryPath?: string;
            submodelRegistryPath?: string;
            aasRepoPath?: string;
            submodelRepoPath?: string;
            conceptDescriptionRepoPath?: string;
            keycloakActive?: boolean;
            keycloakUrl?: string;
            keycloakRealm?: string;
            keycloakClientId?: string;
            preconfiguredAuth?: boolean;
            preconfiguredAuthClientSecret?: string;
            endpointConfigAvailable?: boolean;
        },
        refreshTokensCallback?: (infrastructureId: string) => Promise<void>
    ): Promise<{ infrastructures: InfrastructureConfig[]; selectedInfrastructureId: string | null }> {
        try {
            // If endpointConfigAvailable is false, always use environment config
            if (envConfig.endpointConfigAvailable === false) {
                const defaultInfra = await createDefaultInfrastructureFromEnv(envConfig, refreshTokensCallback);
                return {
                    infrastructures: [defaultInfra],
                    selectedInfrastructureId: defaultInfra.id,
                };
            }

            const stored = window.localStorage.getItem('basyxInfrastructures');
            if (stored) {
                const storage: InfrastructureStorage = JSON.parse(stored);

                // Determine which infrastructure should be selected
                let targetInfraId: string | null = null;
                if (
                    storage.selectedInfrastructureId &&
                    storage.infrastructures.some((infra) => infra.id === storage.selectedInfrastructureId)
                ) {
                    targetInfraId = storage.selectedInfrastructureId;
                } else if (storage.infrastructures.length > 0) {
                    // Fallback: select default infrastructure or first available one
                    const defaultInfra = storage.infrastructures.find((infra) => infra.isDefault);
                    targetInfraId = defaultInfra ? defaultInfra.id : storage.infrastructures[0].id;
                }

                // Ensure at least one infrastructure is marked as default
                const hasDefault = storage.infrastructures.some((infra) => infra.isDefault);
                if (!hasDefault && storage.infrastructures.length > 0) {
                    storage.infrastructures[0].isDefault = true;
                }

                return {
                    infrastructures: storage.infrastructures,
                    selectedInfrastructureId: targetInfraId,
                };
            } else {
                // Migration from legacy storage
                const legacyInfra = createInfrastructureFromLegacyStorage();

                // Check if any legacy URLs exist
                const hasLegacyData = Object.values(legacyInfra.components).some((comp) => comp.url.trim() !== '');

                if (hasLegacyData) {
                    return {
                        infrastructures: [legacyInfra],
                        selectedInfrastructureId: legacyInfra.id,
                    };
                } else {
                    // Create default from environment
                    const defaultInfra = await createDefaultInfrastructureFromEnv(envConfig, refreshTokensCallback);
                    return {
                        infrastructures: [defaultInfra],
                        selectedInfrastructureId: defaultInfra.id,
                    };
                }
            }
        } catch (error) {
            console.error('Error loading infrastructures from storage:', error);
            // Fallback to default
            const defaultInfra = await createDefaultInfrastructureFromEnv(envConfig, refreshTokensCallback);
            return {
                infrastructures: [defaultInfra],
                selectedInfrastructureId: defaultInfra.id,
            };
        }
    }

    /**
     * Saves infrastructures to localStorage
     */
    function saveInfrastructuresToStorage(
        infrastructures: InfrastructureConfig[],
        selectedInfrastructureId: string | null
    ): void {
        try {
            const storage: InfrastructureStorage = {
                infrastructures,
                selectedInfrastructureId,
            };

            localStorage.setItem('basyxInfrastructures', JSON.stringify(storage));
        } catch (error) {
            console.error('Error saving infrastructures to storage:', error);
        }
    }

    return {
        generateInfrastructureId,
        createEmptyInfrastructure,
        createDefaultInfrastructureFromEnv,
        createInfrastructureFromLegacyStorage,
        loadInfrastructuresFromStorage,
        saveInfrastructuresToStorage,
    };
}
