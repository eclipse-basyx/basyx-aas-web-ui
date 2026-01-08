import type { InfrastructureConfig, InfrastructureStorage, OAuth2ConnectionData } from '@/types/Infrastructure';
import { authenticateOAuth2ClientCredentials } from '@/composables/Auth/OAuth2Auth';
import { useInfrastructureConfigLoader } from '@/composables/Infrastructure/useInfrastructureConfigLoader';
import { useNavigationStore } from '@/store/NavigationStore';

/**
 * Computes a simple hash of infrastructure configuration for change detection
 * Used to detect when YAML configurations have been updated
 */
function computeInfrastructureHash(infra: InfrastructureConfig): string {
    // Create stable string representation of configuration (excluding runtime fields)
    const configForHashing = {
        name: infra.name,
        components: infra.components,
        auth: infra.auth,
        // Exclude: id (stable), token (runtime), isDefault (user preference), yamlConfigOutdated (runtime flag)
    };
    const configString = JSON.stringify(configForHashing);

    // Simple hash function (djb2)
    let hash = 5381;
    for (let i = 0; i < configString.length; i++) {
        hash = (hash << 5) + hash + configString.charCodeAt(i); // hash * 33 + c
    }
    return hash.toString(36);
}

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
            oidcActive?: boolean;
            oidcUrl?: string;
            oidcScope?: string;
            oidcClientId?: string;
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
            oidcActive?: boolean;
            oidcUrl?: string;
            oidcScope?: string;
            oidcClientId?: string;
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
     * Generates a deterministic infrastructure ID based on configuration
     * Used when endpointConfigAvailable=false to ensure stable IDs across reloads
     */
    function generateDeterministicInfrastructureId(envConfig: {
        aasDiscoveryPath?: string;
        aasRegistryPath?: string;
        submodelRegistryPath?: string;
        aasRepoPath?: string;
        submodelRepoPath?: string;
        conceptDescriptionRepoPath?: string;
        keycloakUrl?: string;
        keycloakRealm?: string;
        keycloakClientId?: string;
        oidcUrl?: string;
        oidcScope?: string;
        oidcClientId?: string;
    }): string {
        // Create a stable hash from the configuration
        const configString = JSON.stringify({
            aasDiscovery: envConfig.aasDiscoveryPath || '',
            aasRegistry: envConfig.aasRegistryPath || '',
            submodelRegistry: envConfig.submodelRegistryPath || '',
            aasRepo: envConfig.aasRepoPath || '',
            submodelRepo: envConfig.submodelRepoPath || '',
            cdRepo: envConfig.conceptDescriptionRepoPath || '',
            keycloakUrl: envConfig.keycloakUrl || '',
            keycloakRealm: envConfig.keycloakRealm || '',
            keycloakClientId: envConfig.keycloakClientId || '',
            oidcUrl: envConfig.oidcUrl || '',
            oidcScope: envConfig.oidcScope || '',
            oidcClientId: envConfig.oidcClientId || '',
        });

        // Simple hash function to create a deterministic ID
        let hash = 0;
        for (let i = 0; i < configString.length; i++) {
            const char = configString.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash |= 0; // Convert to 32-bit integer
        }

        return 'infra_env_' + Math.abs(hash).toString(36);
    }

    /**
     * Authenticates using OAuth2 client credentials flow and updates infrastructure token
     */
    async function authenticateAndSetToken(
        infrastructure: InfrastructureConfig,
        oauth2Config: OAuth2ConnectionData,
        refreshTokensCallback?: (infrastructureId: string) => Promise<void>
    ): Promise<void> {
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
     * @param envConfig Environment configuration object containing endpoint paths and identity provider settings
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
            oidcActive?: boolean;
            oidcUrl?: string;
            oidcScope?: string;
            oidcClientId?: string;
            preconfiguredAuth?: boolean;
            preconfiguredAuthClientSecret?: string;
        },
        refreshTokensCallback?: (infrastructureId: string) => Promise<void>
    ): Promise<InfrastructureConfig> {
        const infrastructure = createEmptyInfrastructure('Default Infrastructure');
        infrastructure.isDefault = true;

        // Use deterministic ID based on configuration for stability across reloads
        infrastructure.id = generateDeterministicInfrastructureId(envConfig);

        // Populate from environment variables
        if (envConfig.aasDiscoveryPath) infrastructure.components.AASDiscovery.url = envConfig.aasDiscoveryPath;
        if (envConfig.aasRegistryPath) infrastructure.components.AASRegistry.url = envConfig.aasRegistryPath;
        if (envConfig.submodelRegistryPath)
            infrastructure.components.SubmodelRegistry.url = envConfig.submodelRegistryPath;
        if (envConfig.aasRepoPath) infrastructure.components.AASRepo.url = envConfig.aasRepoPath;
        if (envConfig.submodelRepoPath) infrastructure.components.SubmodelRepo.url = envConfig.submodelRepoPath;
        if (envConfig.conceptDescriptionRepoPath)
            infrastructure.components.ConceptDescriptionRepo.url = envConfig.conceptDescriptionRepoPath;

        // Precedence logic: Keycloak takes precedence over generic OIDC if both are configured
        const hasKeycloakConfig =
            envConfig.keycloakActive ||
            (envConfig.keycloakUrl && envConfig.keycloakRealm && envConfig.keycloakClientId);
        const hasOidcConfig = envConfig.oidcActive || (envConfig.oidcUrl && envConfig.oidcClientId);

        if (hasKeycloakConfig) {
            // Use Keycloak configuration (takes precedence)
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
                await authenticateAndSetToken(infrastructure, oauth2Config, refreshTokensCallback);
            }
        } else if (hasOidcConfig) {
            // Use generic OIDC configuration (only if Keycloak is not configured)
            const oauth2Config: OAuth2ConnectionData = {
                host: envConfig.oidcUrl!,
                clientId: envConfig.oidcClientId!,
                authFlow: 'auth-code',
            };

            // Store scope for potential use in OAuth2 flow
            if (envConfig.oidcScope) {
                oauth2Config.scope = envConfig.oidcScope;
            }

            if (envConfig.preconfiguredAuth) {
                oauth2Config.clientSecret = envConfig.preconfiguredAuthClientSecret;
                oauth2Config.authFlow = 'client-credentials';
            }

            infrastructure.auth = {
                securityType: 'OAuth2',
                oauth2: oauth2Config,
            };

            if (envConfig.preconfiguredAuth && oauth2Config) {
                await authenticateAndSetToken(infrastructure, oauth2Config, refreshTokensCallback);
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
     * Handles YAML configuration merge with localStorage
     * Implements precedence rules based on ENDPOINT_CONFIG_AVAILABLE
     */
    async function handleYamlConfigurationMerge(
        yamlConfig: { infrastructures: InfrastructureConfig[]; defaultInfrastructureId: string | null },
        envConfig: { endpointConfigAvailable?: boolean },
        refreshTokensCallback?: (infrastructureId: string) => Promise<void>
    ): Promise<{ infrastructures: InfrastructureConfig[]; selectedInfrastructureId: string | null }> {
        // ENDPOINT_CONFIG_AVAILABLE=false: YAML takes full precedence
        if (envConfig.endpointConfigAvailable === false) {
            // Check localStorage for stored tokens and selected infrastructure
            let selectedId: string | null =
                yamlConfig.defaultInfrastructureId || yamlConfig.infrastructures[0]?.id || null;
            const stored = window.localStorage.getItem('basyxInfrastructures');

            if (stored) {
                try {
                    const storage: InfrastructureStorage = JSON.parse(stored);

                    // Restore tokens and authentication status from localStorage into YAML infrastructures
                    for (const yamlInfra of yamlConfig.infrastructures) {
                        const storedInfra = storage.infrastructures.find((infra) => infra.id === yamlInfra.id);
                        if (storedInfra) {
                            // Restore token if it exists and has at least the required structure
                            if (storedInfra.token) {
                                const candidateToken: unknown = storedInfra.token;
                                if (
                                    candidateToken &&
                                    typeof candidateToken === 'object' &&
                                    typeof (candidateToken as any).accessToken === 'string'
                                ) {
                                    yamlInfra.token = candidateToken as typeof yamlInfra.token;
                                } else {
                                    console.warn(
                                        'Ignoring invalid token data from localStorage for infrastructure:',
                                        yamlInfra.id
                                    );
                                }
                            }
                            // Restore authentication status
                            if (storedInfra.isAuthenticated !== undefined) {
                                yamlInfra.isAuthenticated = storedInfra.isAuthenticated;
                            }
                        }
                    }

                    // Use stored selection if it's one of the available YAML infrastructures
                    if (
                        storage.selectedInfrastructureId &&
                        yamlConfig.infrastructures.some((infra) => infra.id === storage.selectedInfrastructureId)
                    ) {
                        selectedId = storage.selectedInfrastructureId;
                    }
                } catch (err) {
                    console.warn('Failed to parse localStorage for infrastructure data:', err);
                }
            }

            // Authenticate client credentials flows if configured and no token exists
            for (const infra of yamlConfig.infrastructures) {
                if (
                    infra.auth?.securityType === 'OAuth2' &&
                    infra.auth.oauth2?.authFlow === 'client-credentials' &&
                    infra.auth.oauth2.clientSecret &&
                    !infra.token // Only authenticate if no token exists (not restored from storage)
                ) {
                    await authenticateAndSetToken(infra, infra.auth.oauth2, refreshTokensCallback);
                }
            }

            return {
                infrastructures: yamlConfig.infrastructures,
                selectedInfrastructureId: selectedId,
            };
        }

        // ENDPOINT_CONFIG_AVAILABLE=true: Merge YAML with localStorage
        // Note: User edits in localStorage take precedence over YAML updates.
        // This is by design for user modifications, but means YAML updates won't
        // automatically apply to user-edited infrastructures. We detect this case
        // and flag it for potential UI warnings.
        const stored = window.localStorage.getItem('basyxInfrastructures');
        const yamlInfraMap = new Map(yamlConfig.infrastructures.map((infra) => [infra.id, infra]));
        const mergedInfrastructures: InfrastructureConfig[] = [];
        let selectedId: string | null = null;
        const navigationStore = useNavigationStore();

        if (stored) {
            try {
                const storage: InfrastructureStorage = JSON.parse(stored);

                // Merge YAML infrastructures with localStorage edits
                for (const yamlInfra of yamlConfig.infrastructures) {
                    const storedInfra = storage.infrastructures.find((infra) => infra.id === yamlInfra.id);
                    if (storedInfra) {
                        // User has edited this YAML infrastructure - preserve their changes
                        // But check if the YAML source has been updated
                        const currentYamlHash = computeInfrastructureHash(yamlInfra);
                        const storedYamlHash = storedInfra.yamlHash;

                        if (storedYamlHash && storedYamlHash !== currentYamlHash) {
                            // YAML configuration has changed since user last edited
                            // Mark the infrastructure as potentially outdated
                            storedInfra.yamlConfigOutdated = true;

                            navigationStore.dispatchSnackbar({
                                status: true,
                                timeout: 8000,
                                color: 'warning',
                                btnColor: 'buttonText',
                                text: `YAML configuration for "${storedInfra.name}" has been updated, but your local edits take precedence. Review changes in Infrastructure Management.`,
                            });
                        }

                        mergedInfrastructures.push(storedInfra);
                    } else {
                        // New or unmodified YAML infrastructure
                        // Store hash for future change detection
                        yamlInfra.yamlHash = computeInfrastructureHash(yamlInfra);
                        mergedInfrastructures.push(yamlInfra);
                    }
                }

                // Add user-created infrastructures (not from YAML)
                for (const storedInfra of storage.infrastructures) {
                    if (!yamlInfraMap.has(storedInfra.id)) {
                        mergedInfrastructures.push(storedInfra);
                    }
                }

                // Determine selected infrastructure
                if (
                    storage.selectedInfrastructureId &&
                    mergedInfrastructures.some((infra) => infra.id === storage.selectedInfrastructureId)
                ) {
                    selectedId = storage.selectedInfrastructureId;
                } else {
                    // Fallback to YAML default or first infrastructure
                    selectedId = yamlConfig.defaultInfrastructureId || mergedInfrastructures[0]?.id || null;
                }
            } catch (err) {
                console.warn('Failed to parse localStorage, using YAML config only:', err);
                mergedInfrastructures.push(...yamlConfig.infrastructures);
                selectedId = yamlConfig.defaultInfrastructureId || yamlConfig.infrastructures[0]?.id || null;
            }
        } else {
            // No localStorage - use YAML config
            mergedInfrastructures.push(...yamlConfig.infrastructures);
            selectedId = yamlConfig.defaultInfrastructureId || yamlConfig.infrastructures[0]?.id || null;
        }

        // Authenticate client credentials flows
        for (const infra of mergedInfrastructures) {
            if (
                infra.auth?.securityType === 'OAuth2' &&
                infra.auth.oauth2?.authFlow === 'client-credentials' &&
                infra.auth.oauth2.clientSecret &&
                !infra.token // Only authenticate if no token exists
            ) {
                await authenticateAndSetToken(infra, infra.auth.oauth2, refreshTokensCallback);
            }
        }

        // Ensure at least one infrastructure is marked as default
        const hasDefault = mergedInfrastructures.some((infra) => infra.isDefault);
        if (!hasDefault && mergedInfrastructures.length > 0) {
            const selectedInfra = mergedInfrastructures.find((infra) => infra.id === selectedId);
            if (selectedInfra) {
                selectedInfra.isDefault = true;
            } else {
                mergedInfrastructures[0].isDefault = true;
            }
        }

        return {
            infrastructures: mergedInfrastructures,
            selectedInfrastructureId: selectedId,
        };
    }

    /**
     * Handles traditional configuration (env vars and localStorage) without YAML
     */
    async function handleTraditionalConfiguration(
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
            oidcActive?: boolean;
            oidcUrl?: string;
            oidcScope?: string;
            oidcClientId?: string;
            preconfiguredAuth?: boolean;
            preconfiguredAuthClientSecret?: string;
            endpointConfigAvailable?: boolean;
        },
        refreshTokensCallback?: (infrastructureId: string) => Promise<void>
    ): Promise<{ infrastructures: InfrastructureConfig[]; selectedInfrastructureId: string | null }> {
        // If endpointConfigAvailable is false, use environment config but preserve existing infrastructure
        // Strategy: When endpoint configuration is locked (e.g., in production), we need to:
        // 1. Always use URLs and auth settings from environment variables (non-editable by users)
        // 2. BUT preserve the infrastructure ID and token from localStorage if a match exists
        // 3. This ensures OAuth2 flows work correctly (state parameter contains stable infrastructure ID)
        // 4. And user authentication persists across page reloads (token is preserved)
        if (envConfig.endpointConfigAvailable === false) {
            const stored = window.localStorage.getItem('basyxInfrastructures');
            let matchingInfra: InfrastructureConfig | null = null;

            if (stored) {
                try {
                    const storage: InfrastructureStorage = JSON.parse(stored);

                    // Find an infrastructure that matches the environment configuration
                    // Matching criteria: URLs and auth config must match env vars
                    // If found, we reuse it (preserving its ID and token)
                    matchingInfra =
                        storage.infrastructures.find((infra) => {
                            // Helper to check if a URL is defined and non-empty
                            const isNonEmptyUrl = (value?: string): boolean =>
                                typeof value === 'string' && value.trim().length > 0;

                            // Ensure at least one URL is configured in env vars (prevents matching empty configs)
                            const hasAnyEnvUrl =
                                isNonEmptyUrl(envConfig.aasDiscoveryPath) ||
                                isNonEmptyUrl(envConfig.aasRegistryPath) ||
                                isNonEmptyUrl(envConfig.submodelRegistryPath) ||
                                isNonEmptyUrl(envConfig.aasRepoPath) ||
                                isNonEmptyUrl(envConfig.submodelRepoPath) ||
                                isNonEmptyUrl(envConfig.conceptDescriptionRepoPath);

                            if (!hasAnyEnvUrl) {
                                return false;
                            }

                            // Check if all non-empty URLs in env config match the infrastructure's URLs
                            // Only URLs that are defined in env vars are compared (allows partial configuration)
                            const urlsMatch =
                                (!isNonEmptyUrl(envConfig.aasDiscoveryPath) ||
                                    infra.components.AASDiscovery.url === envConfig.aasDiscoveryPath) &&
                                (!isNonEmptyUrl(envConfig.aasRegistryPath) ||
                                    infra.components.AASRegistry.url === envConfig.aasRegistryPath) &&
                                (!isNonEmptyUrl(envConfig.submodelRegistryPath) ||
                                    infra.components.SubmodelRegistry.url === envConfig.submodelRegistryPath) &&
                                (!isNonEmptyUrl(envConfig.aasRepoPath) ||
                                    infra.components.AASRepo.url === envConfig.aasRepoPath) &&
                                (!isNonEmptyUrl(envConfig.submodelRepoPath) ||
                                    infra.components.SubmodelRepo.url === envConfig.submodelRepoPath) &&
                                (!isNonEmptyUrl(envConfig.conceptDescriptionRepoPath) ||
                                    infra.components.ConceptDescriptionRepo.url ===
                                        envConfig.conceptDescriptionRepoPath);

                            // Check if auth configuration matches (Keycloak takes precedence over OIDC)
                            const hasKeycloakConfig =
                                !!envConfig.keycloakActive &&
                                typeof envConfig.keycloakUrl === 'string' &&
                                envConfig.keycloakUrl.trim().length > 0 &&
                                typeof envConfig.keycloakRealm === 'string' &&
                                envConfig.keycloakRealm.trim().length > 0 &&
                                typeof envConfig.keycloakClientId === 'string' &&
                                envConfig.keycloakClientId.trim().length > 0;

                            const hasOidcUrlAndClientId =
                                typeof envConfig.oidcUrl === 'string' &&
                                envConfig.oidcUrl.trim().length > 0 &&
                                typeof envConfig.oidcClientId === 'string' &&
                                envConfig.oidcClientId.trim().length > 0;

                            const hasOidcConfig =
                                !hasKeycloakConfig && // Only check OIDC if Keycloak is not configured
                                (!!envConfig.oidcActive || hasOidcUrlAndClientId) &&
                                hasOidcUrlAndClientId;

                            if (hasKeycloakConfig) {
                                // Keycloak configured: verify OAuth2 settings match
                                const expectedHost = envConfig.keycloakUrl + '/realms/' + envConfig.keycloakRealm;
                                const expectedAuthFlow = envConfig.preconfiguredAuth
                                    ? 'client-credentials'
                                    : 'auth-code';

                                const authMatches =
                                    infra.auth?.securityType === 'OAuth2' &&
                                    infra.auth.oauth2?.host === expectedHost &&
                                    infra.auth.oauth2?.clientId === envConfig.keycloakClientId &&
                                    infra.auth.oauth2?.authFlow === expectedAuthFlow;

                                return urlsMatch && authMatches;
                            } else if (hasOidcConfig) {
                                // Generic OIDC configured: verify OAuth2 settings match
                                const expectedHost = envConfig.oidcUrl;
                                const expectedAuthFlow = envConfig.preconfiguredAuth
                                    ? 'client-credentials'
                                    : 'auth-code';

                                const authMatches =
                                    infra.auth?.securityType === 'OAuth2' &&
                                    infra.auth.oauth2?.host === expectedHost &&
                                    infra.auth.oauth2?.clientId === envConfig.oidcClientId &&
                                    infra.auth.oauth2?.authFlow === expectedAuthFlow &&
                                    (!envConfig.oidcScope || infra.auth.oauth2?.scope === envConfig.oidcScope);

                                return urlsMatch && authMatches;
                            } else {
                                // No auth in env: infrastructure must have no authentication configured
                                const noAuth = !infra.auth || infra.auth.securityType === 'No Authentication';
                                return urlsMatch && noAuth;
                            }
                        }) || null;
                } catch (err) {
                    console.warn('Failed to load infrastructure from storage:', err);
                }
            }

            // Matching infrastructure found: reuse it to preserve token and stable ID
            // This is critical for OAuth2 flows - the ID must remain constant across page reloads
            // so the OAuth2 state parameter matches after redirect from identity provider
            if (matchingInfra) {
                matchingInfra.isDefault = true;
                return {
                    infrastructures: [matchingInfra],
                    selectedInfrastructureId: matchingInfra.id,
                };
            }

            // No matching infrastructure found: create new one from environment variables
            // This happens on first load or when env config changes significantly
            // A deterministic ID is generated based on env config (see generateDeterministicInfrastructureId)
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
            oidcActive?: boolean;
            oidcUrl?: string;
            oidcScope?: string;
            oidcClientId?: string;
            preconfiguredAuth?: boolean;
            preconfiguredAuthClientSecret?: string;
            endpointConfigAvailable?: boolean;
        },
        refreshTokensCallback?: (infrastructureId: string) => Promise<void>
    ): Promise<{ infrastructures: InfrastructureConfig[]; selectedInfrastructureId: string | null }> {
        try {
            // Check if environment variables are configured (backwards compatibility)
            // Environment variables take precedence over YAML to avoid breaking existing deployments
            function isNonEmptyString(value: unknown): value is string {
                return typeof value === 'string' && value.trim().length > 0;
            }

            const hasEnvVars =
                isNonEmptyString(envConfig.aasDiscoveryPath) ||
                isNonEmptyString(envConfig.aasRegistryPath) ||
                isNonEmptyString(envConfig.submodelRegistryPath) ||
                isNonEmptyString(envConfig.aasRepoPath) ||
                isNonEmptyString(envConfig.submodelRepoPath) ||
                isNonEmptyString(envConfig.conceptDescriptionRepoPath) ||
                envConfig.keycloakActive === true ||
                (isNonEmptyString(envConfig.keycloakUrl) &&
                    isNonEmptyString(envConfig.keycloakRealm) &&
                    isNonEmptyString(envConfig.keycloakClientId)) ||
                envConfig.oidcActive === true ||
                (isNonEmptyString(envConfig.oidcUrl) && isNonEmptyString(envConfig.oidcClientId));
            // If environment variables are configured, use traditional configuration (backwards compatibility)
            if (hasEnvVars) {
                return await handleTraditionalConfiguration(envConfig, refreshTokensCallback);
            }

            // No environment variables - try loading YAML configuration
            const { loadInfrastructureConfig } = useInfrastructureConfigLoader();
            const yamlConfig = await loadInfrastructureConfig();

            // If YAML config is available, merge it with localStorage
            if (yamlConfig && yamlConfig.infrastructures.length > 0) {
                return await handleYamlConfigurationMerge(yamlConfig, envConfig, refreshTokensCallback);
            }

            // No env vars and no YAML - proceed with localStorage only
            return await handleTraditionalConfiguration(envConfig, refreshTokensCallback);
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
