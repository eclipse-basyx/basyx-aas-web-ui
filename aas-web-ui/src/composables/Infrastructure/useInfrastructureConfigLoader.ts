import type { ParsedInfrastructureConfig, YamlInfrastructuresConfig } from '@/types/Infrastructure';
import yaml from 'js-yaml';
import { useEnvStore } from '@/store/EnvironmentStore';
import { useInfrastructureYamlParser } from './useInfrastructureYamlParser';

/**
 * Composable for loading infrastructure configuration from YAML
 * Works in both development and production modes
 */
export function useInfrastructureConfigLoader(): {
    loadInfrastructureConfig: () => Promise<ParsedInfrastructureConfig | null>;
} {
    const { parseYamlConfig, validateYamlConfig } = useInfrastructureYamlParser();
    const envStore = useEnvStore();

    /**
     * Fetches and parses the infrastructure configuration YAML file
     * Returns null if no configuration file exists (will fall back to env vars)
     */
    async function loadInfrastructureConfig(): Promise<ParsedInfrastructureConfig | null> {
        try {
            // Use BASE_URL to support custom base paths
            // In production: use runtime base path from env store
            // In development: use build-time base URL from Vite
            const basePath = import.meta.env.MODE === 'production' ? envStore.getEnvBasePath : import.meta.env.BASE_URL;

            let configPath = '/config/';
            if (basePath && basePath.trim() !== '' && !basePath.includes('PLACEHOLDER')) {
                const normalizedBasePath = basePath.endsWith('/') ? basePath : basePath + '/';
                configPath = `${normalizedBasePath}config/`;
            }

            const configUrl = `${configPath}basyx-infra.yml`;
            const response = await fetch(configUrl, {
                method: 'GET',
            });

            // File doesn't exist - fall back to env vars
            if (!response.ok) {
                if (response.status === 404) {
                    // No infrastructure config file found - this is normal if using env vars
                    return null;
                }
                console.warn('Failed to fetch infrastructure configuration:', response.statusText);
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
            console.error('Error loading infrastructure configuration:', error);
            return null;
        }
    }

    return {
        loadInfrastructureConfig,
    };
}
