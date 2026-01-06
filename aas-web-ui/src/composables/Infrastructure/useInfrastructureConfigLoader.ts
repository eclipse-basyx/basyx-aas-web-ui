import type { ParsedInfrastructureConfig, YamlInfrastructuresConfig } from '@/types/Infrastructure';
import { useInfrastructureYamlParser } from './useInfrastructureYamlParser';

/**
 * Composable for loading infrastructure configuration from JSON file
 * The JSON file is generated from YAML at container startup (production)
 * or served directly from public/config (development)
 */
export function useInfrastructureConfigLoader(): {
    loadInfrastructureConfig: () => Promise<ParsedInfrastructureConfig | null>;
} {
    const { parseYamlConfig, validateYamlConfig } = useInfrastructureYamlParser();

    /**
     * Fetches and parses the infrastructure configuration file
     * Returns null if the file doesn't exist or parsing fails
     */
    async function loadInfrastructureConfig(): Promise<ParsedInfrastructureConfig | null> {
        try {
            // Try to fetch the JSON configuration file
            const response = await fetch('/config/infrastructure-config.json', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            // If file doesn't exist, return null (will fall back to env vars)
            if (!response.ok) {
                if (response.status === 404) {
                    // No infrastructure config file found - fall back to env vars
                    return null;
                }
                console.error('Failed to fetch infrastructure configuration:', response.statusText);
                return null;
            }

            const jsonConfig = await response.json();

            // Validate the configuration structure
            if (!validateYamlConfig(jsonConfig)) {
                console.error('Invalid infrastructure configuration format');
                return null;
            }

            // Parse the configuration
            const parsedConfig = parseYamlConfig(jsonConfig as YamlInfrastructuresConfig);

            // Successfully loaded infrastructures from config file
            // Log count for debugging: parsedConfig.infrastructures.length

            return parsedConfig;
        } catch (error) {
            console.error('Error loading infrastructure configuration:', error);
            return null;
        }
    }

    return {
        loadInfrastructureConfig,
    };
}
