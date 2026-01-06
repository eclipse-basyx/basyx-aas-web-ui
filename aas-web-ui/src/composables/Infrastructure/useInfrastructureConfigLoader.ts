import type { ParsedInfrastructureConfig, YamlInfrastructuresConfig } from '@/types/Infrastructure';
import yaml from 'js-yaml';
import { useInfrastructureYamlParser } from './useInfrastructureYamlParser';

/**
 * Composable for loading infrastructure configuration
 * In production: Loads JSON file generated from YAML at container startup
 * In development: Loads and parses YAML file directly
 */
export function useInfrastructureConfigLoader(): {
    loadInfrastructureConfig: () => Promise<ParsedInfrastructureConfig | null>;
} {
    const { parseYamlConfig, validateYamlConfig } = useInfrastructureYamlParser();

    /**
     * Tries to load YAML configuration file (development mode)
     */
    async function loadYamlConfig(): Promise<ParsedInfrastructureConfig | null> {
        try {
            const response = await fetch('/config/basyx-infra.yml', {
                method: 'GET',
            });

            if (!response.ok) {
                return null;
            }

            const yamlText = await response.text();
            const yamlConfig = yaml.load(yamlText) as YamlInfrastructuresConfig;

            // Validate the configuration structure
            if (!validateYamlConfig(yamlConfig)) {
                console.error('Invalid YAML infrastructure configuration format');
                return null;
            }

            // Parse the configuration
            return parseYamlConfig(yamlConfig);
        } catch (error) {
            console.error('Error loading YAML infrastructure configuration:', error);
            return null;
        }
    }

    /**
     * Tries to load JSON configuration file (production mode)
     */
    async function loadJsonConfig(): Promise<ParsedInfrastructureConfig | null> {
        try {
            const response = await fetch('/config/infrastructure-config.json', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                return null;
            }

            const jsonConfig = await response.json();

            // Validate the configuration structure
            if (!validateYamlConfig(jsonConfig)) {
                console.error('Invalid JSON infrastructure configuration format');
                return null;
            }

            // Parse the configuration
            return parseYamlConfig(jsonConfig as YamlInfrastructuresConfig);
        } catch (error) {
            console.error('Error loading JSON infrastructure configuration:', error);
            return null;
        }
    }

    /**
     * Fetches and parses the infrastructure configuration file
     * Tries JSON first (production), then YAML (development)
     * Returns null if no configuration file exists (will fall back to env vars)
     */
    async function loadInfrastructureConfig(): Promise<ParsedInfrastructureConfig | null> {
        // Try JSON first (production mode)
        let config = await loadJsonConfig();
        if (config) {
            return config;
        }

        // Fall back to YAML (development mode)
        config = await loadYamlConfig();
        if (config) {
            return config;
        }

        // No configuration file found - application will fall back to env vars
        return null;
    }

    return {
        loadInfrastructureConfig,
    };
}
