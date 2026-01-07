import type { BaSyxComponentKey } from '@/types/BaSyx';
import type {
    InfrastructureAuth,
    InfrastructureConfig,
    ParsedInfrastructureConfig,
    YamlInfrastructureConfig,
    YamlInfrastructuresConfig,
    YamlSecurityConfig,
} from '@/types/Infrastructure';

/**
 * Composable for parsing YAML infrastructure configuration
 * Converts YAML format (camelCase, baseUrl) to internal format (PascalCase, url)
 */
export function useInfrastructureYamlParser(): {
    parseYamlConfig: (yamlConfig: YamlInfrastructuresConfig) => ParsedInfrastructureConfig;
    validateYamlConfig: (config: unknown) => config is YamlInfrastructuresConfig;
    generateYamlInfrastructureId: (yamlKey: string) => string;
} {
    /**
     * Maps YAML component keys (camelCase) to internal BaSyx component keys (PascalCase)
     */
    const componentKeyMap: Record<string, BaSyxComponentKey> = {
        aasDiscovery: 'AASDiscovery',
        aasRegistry: 'AASRegistry',
        submodelRegistry: 'SubmodelRegistry',
        aasRepository: 'AASRepo',
        submodelRepository: 'SubmodelRepo',
        conceptDescriptionRepository: 'ConceptDescriptionRepo',
    };

    /**
     * Maps YAML security type to internal security type
     */
    function mapSecurityType(yamlType: string): InfrastructureAuth['securityType'] {
        switch (yamlType) {
            case 'none':
                return 'No Authentication';
            case 'basic':
                return 'Basic Authentication';
            case 'bearer':
                return 'Bearer Token';
            case 'oauth2':
                return 'OAuth2';
            default:
                console.warn(`Unknown security type: ${yamlType}, defaulting to 'No Authentication'`);
                return 'No Authentication';
        }
    }

    /**
     * Maps YAML OAuth2 flow to internal format
     */
    function mapOAuth2Flow(yamlFlow: string): 'auth-code' | 'client-credentials' {
        switch (yamlFlow) {
            case 'auth_code':
                return 'auth-code';
            case 'client_credentials':
                return 'client-credentials';
            default:
                console.warn(`Unknown OAuth2 flow: ${yamlFlow}, defaulting to 'auth-code'`);
                return 'auth-code';
        }
    }

    /**
     * Converts YAML security configuration to internal auth configuration
     */
    function parseSecurityConfig(yamlSecurity: YamlSecurityConfig): InfrastructureAuth {
        const auth: InfrastructureAuth = {
            securityType: mapSecurityType(yamlSecurity.type),
        };

        if (!yamlSecurity.config) {
            return auth;
        }

        const config = yamlSecurity.config;

        switch (yamlSecurity.type) {
            case 'basic':
                if (config.username && config.password) {
                    auth.basicAuth = {
                        username: config.username,
                        password: config.password,
                    };
                } else {
                    console.warn('Basic authentication requires username and password');
                }
                break;

            case 'bearer':
                if (config.token) {
                    auth.bearerToken = {
                        token: config.token,
                    };
                } else {
                    console.warn('Bearer token authentication requires a token');
                }
                break;

            case 'oauth2':
                if (config.issuer && config.clientId) {
                    auth.oauth2 = {
                        host: config.issuer,
                        clientId: config.clientId,
                        authFlow: config.flow ? mapOAuth2Flow(config.flow) : 'auth-code',
                        scope: config.scope || '',
                    };

                    if (config.clientSecret) {
                        auth.oauth2.clientSecret = config.clientSecret;
                    }
                } else {
                    console.warn('OAuth2 authentication requires issuer and clientId');
                }
                break;
        }

        return auth;
    }

    /**
     * Generates a stable infrastructure ID based on YAML key
     */
    function generateYamlInfrastructureId(yamlKey: string): string {
        return `yaml_${yamlKey}`;
    }

    /**
     * Parses a single YAML infrastructure configuration
     */
    function parseInfrastructure(
        yamlKey: string,
        yamlConfig: YamlInfrastructureConfig,
        isDefault: boolean = false
    ): InfrastructureConfig {
        const infrastructure: InfrastructureConfig = {
            id: generateYamlInfrastructureId(yamlKey),
            name: yamlConfig.name || yamlKey,
            isDefault,
            auth: parseSecurityConfig(yamlConfig.security),
            components: {
                AASDiscovery: { url: '' },
                AASRegistry: { url: '' },
                SubmodelRegistry: { url: '' },
                AASRepo: { url: '' },
                SubmodelRepo: { url: '' },
                ConceptDescriptionRepo: { url: '' },
            },
        };

        // Map YAML component configurations to internal structure
        for (const [yamlKey, internalKey] of Object.entries(componentKeyMap)) {
            const yamlComponent = yamlConfig.components[yamlKey as keyof typeof yamlConfig.components];
            if (yamlComponent?.baseUrl) {
                infrastructure.components[internalKey].url = yamlComponent.baseUrl;
            }
        }

        return infrastructure;
    }

    /**
     * Parses the complete YAML configuration
     */
    function parseYamlConfig(yamlConfig: YamlInfrastructuresConfig): ParsedInfrastructureConfig {
        const infrastructures: InfrastructureConfig[] = [];
        let defaultInfrastructureId: string | null = null;

        if (!yamlConfig.infrastructures) {
            console.warn('No infrastructures found in YAML configuration');
            return { infrastructures, defaultInfrastructureId };
        }

        const defaultKey = yamlConfig.infrastructures.default;

        // Parse each infrastructure
        for (const [key, value] of Object.entries(yamlConfig.infrastructures)) {
            // Skip the 'default' key
            if (key === 'default' || typeof value === 'string') {
                continue;
            }

            const yamlInfra = value as YamlInfrastructureConfig;
            const isDefault = key === defaultKey;
            const infrastructure = parseInfrastructure(key, yamlInfra, isDefault);

            infrastructures.push(infrastructure);

            if (isDefault) {
                defaultInfrastructureId = infrastructure.id;
            }
        }

        // If no default was set, use the first infrastructure
        if (!defaultInfrastructureId && infrastructures.length > 0) {
            infrastructures[0].isDefault = true;
            defaultInfrastructureId = infrastructures[0].id;
        }

        return { infrastructures, defaultInfrastructureId };
    }

    /**
     * Validates YAML configuration structure
     */
    function validateYamlConfig(config: unknown): config is YamlInfrastructuresConfig {
        if (!config || typeof config !== 'object') {
            console.error('Invalid YAML configuration: not an object');
            return false;
        }

        const configObj = config as Record<string, unknown>;
        if (!configObj.infrastructures || typeof configObj.infrastructures !== 'object') {
            console.error('Invalid YAML configuration: missing or invalid infrastructures');
            return false;
        }

        return true;
    }

    return {
        parseYamlConfig,
        validateYamlConfig,
        generateYamlInfrastructureId,
    };
}
