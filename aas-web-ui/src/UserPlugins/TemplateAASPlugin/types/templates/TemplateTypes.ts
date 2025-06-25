import { types as aasTypes } from '@aas-core-works/aas-core3.0-typescript';

export interface AASTemplateMetadata {
    id: string;
    name: string;
    description?: string;
    version: string; // Format: major.minor (e.g. "1.2", "1.0", "0.9")
    aasVersion: string;
    category: string;
    tags?: string[];
}

export interface SubmodelTemplateRef {
    id: string;
    name: string;
    semanticId: string;
    version: string; // Format: major.minor (e.g. "1.2", "1.0", "0.9")
    required: boolean;
    elements?: SubmodelElementTemplate[];
}

export interface SubmodelElementTemplate {
    idShort: string;
    type:
        | 'Property'
        | 'MultiLanguageProperty'
        | 'Range'
        | 'File'
        | 'Blob'
        | 'SubmodelElementCollection'
        | 'SubmodelElementList';
    required?: boolean;
    description?: string | aasTypes.LangStringTextType[];
    semanticId?: string;
    valueType?: string;
    value?: string | number | boolean | aasTypes.LangStringTextType[];
    min?: string | number;
    max?: string | number;
    children?: SubmodelElementTemplate[];
}

export interface AASTemplate extends AASTemplateMetadata {
    submodels: SubmodelTemplateRef[];
    extends?: string; // ID of parent template for inheritance
    defaults?: {
        idShort?: string;
        semanticId?: string;
        displayName?: Array<{ language: string; text: string }>;
        description?: Array<{ language: string; text: string }>;
        [key: string]: unknown;
    };
}

export interface TemplateValidationError {
    code: string;
    message: string;
    path?: string;
}

export interface ValidationResult {
    isValid: boolean;
    errors: TemplateValidationError[];
}

export class TemplateError extends Error {
    constructor(
        message: string,
        public code: string,
        public details?: unknown // Changed from any to unknown
    ) {
        super(message);
        this.name = 'TemplateError';
    }
}

// Helper function to check if a version string is in major.minor format
export function isValidTemplateVersion(version: string): boolean {
    // Matches format major.minor (e.g. "1.2", "1.0", "0.9")
    return /^\d+\.\d+$/.test(version);
}

// Helper function to compare AAS versions
export function compareAASVersions(v1: string, v2: string): number {
    const [major1, minor1] = v1.split('.').map(Number);
    const [major2, minor2] = v2.split('.').map(Number);

    if (major1 !== major2) {
        return major1 - major2;
    }
    return minor1 - minor2;
}
