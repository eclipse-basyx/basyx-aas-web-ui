import { verification } from '@aas-core-works/aas-core3.1-typescript';

export interface VerificationOptions {
    maxErrors?: number;
    fieldAliases?: Record<string, string>;
}

export interface VerificationResult {
    isValid: boolean;
    totalErrors: number;
    reportedErrors: number;
    truncated: boolean;
    fieldErrors: Map<string, string>;
    globalErrors: string[];
}

const defaultFieldAliases: Record<string, string> = {
    idShort: 'idShort',
    category: 'category',
    description: 'description',
    displayName: 'displayName',
    semanticId: 'semanticId',
    first: 'first',
    second: 'second',
    value: 'value',
    valueType: 'valueType',
    min: 'min',
    max: 'max',
    valueId: 'valueId',
    contentType: 'contentType',
    kind: 'kind',
    entityType: 'entityType',
    globalAssetId: 'globalAssetId',
    specificAssetIds: 'specificAssetIds',
};

function normalizePath(path: string | null | undefined): string {
    if (!path) {
        return '';
    }

    const decoded = path.replaceAll('%5B', '[').replaceAll('%5D', ']');
    if (decoded.startsWith('.')) {
        return decoded.slice(1);
    }

    return decoded;
}

function tryMapField(path: string, fieldAliases: Record<string, string>): string | null {
    if (!path) {
        return null;
    }

    const parts = path.split('.').filter((part) => part.length > 0);
    const lastPart = parts.at(-1);

    if (!lastPart) {
        return null;
    }

    const normalizedLastPart = lastPart.replace(/\[[^\]]*\]/g, '');

    return fieldAliases[normalizedLastPart] ?? null;
}

export function verifyForEditor(element: object, options?: VerificationOptions): VerificationResult {
    const maxErrors = options?.maxErrors ?? 10;
    const fieldAliases = { ...defaultFieldAliases, ...(options?.fieldAliases ?? {}) };

    const fieldErrors = new Map<string, string>();
    const globalErrors: string[] = [];

    let totalErrors = 0;
    let reportedErrors = 0;

    for (const error of verification.verify(element as any)) {
        totalErrors += 1;

        if (totalErrors > maxErrors) {
            break;
        }

        reportedErrors += 1;

        const normalizedPath = normalizePath(String(error.path));
        const mappedField = tryMapField(normalizedPath, fieldAliases);

        if (mappedField && !fieldErrors.has(mappedField)) {
            fieldErrors.set(mappedField, error.message);
            continue;
        }

        const prefix = normalizedPath ? `${normalizedPath}: ` : '';
        globalErrors.push(`${prefix}${error.message}`);
    }

    return {
        isValid: totalErrors === 0,
        totalErrors,
        reportedErrors,
        truncated: totalErrors > maxErrors,
        fieldErrors,
        globalErrors,
    };
}

export function applyFieldErrors(targetErrors: Map<string, string>, sourceErrors: Map<string, string>): void {
    for (const [field, message] of sourceErrors.entries()) {
        targetErrors.set(field, message);
    }
}

export function buildVerificationSummary(result: VerificationResult): string {
    if (result.totalErrors <= 0) {
        return '';
    }

    const shown = result.reportedErrors;
    if (result.truncated) {
        return `Validation found ${result.totalErrors} issues. Showing first ${shown}.`;
    }

    return `Validation found ${shown} issue${shown === 1 ? '' : 's'}.`;
}
