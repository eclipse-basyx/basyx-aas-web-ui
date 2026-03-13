import type { BaSyxComponentKey } from '@/types/BaSyx';
import type { InfrastructureConfig } from '@/types/Infrastructure';

/**
 * Get human-readable label for a BaSyx component key
 */
export function getComponentLabel(key: BaSyxComponentKey): string {
    const labels: Record<BaSyxComponentKey, string> = {
        AASDiscovery: 'AAS Discovery',
        AASRegistry: 'AAS Registry',
        SubmodelRegistry: 'Submodel Registry',
        AASRepo: 'AAS Repository',
        SubmodelRepo: 'Submodel Repository',
        ConceptDescriptionRepo: 'Concept Description Repository',
    };
    return labels[key];
}

/**
 * Get summary text for infrastructure configuration
 * Returns count of configured components vs total
 */
export function getInfrastructureSummary(infra: InfrastructureConfig, totalComponents: number = 6): string {
    const configuredCount = Object.values(infra.components).filter((comp) => comp.url.trim() !== '').length;
    return `${configuredCount} of ${totalComponents} components configured`;
}

/**
 * Form validation rule for required fields
 */
export function requiredRule(value: string): string | boolean {
    return !!value || 'This field is required';
}

/**
 * Get OAuth2 redirect URI for the current application
 */
export function getRedirectUri(): string {
    return `${window.location.origin}${window.location.pathname}/oauth2/callback`;
}

/**
 * List of all BaSyx component keys in display order
 */
export const BASYX_COMPONENT_KEYS: BaSyxComponentKey[] = [
    'AASDiscovery',
    'AASRegistry',
    'SubmodelRegistry',
    'AASRepo',
    'SubmodelRepo',
    'ConceptDescriptionRepo',
];
