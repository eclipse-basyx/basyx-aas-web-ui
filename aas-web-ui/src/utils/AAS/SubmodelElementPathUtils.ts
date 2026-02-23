const dataElementModelTypes = [
    'Property',
    'MultiLanguageProperty',
    'Range',
    'Blob',
    'File',
    'ReferenceElement',
] as const;

export type DataElementModelType = (typeof dataElementModelTypes)[number];

export function getDataElementModelTypes(): Array<DataElementModelType> {
    return [...dataElementModelTypes];
}

function normalizeModelType(modelType: unknown): string | undefined {
    if (typeof modelType === 'string') {
        return modelType;
    }

    if (typeof modelType === 'function') {
        const resolvedModelType = modelType();
        if (typeof resolvedModelType === 'string') {
            return resolvedModelType;
        }

        if (resolvedModelType !== undefined && resolvedModelType !== null) {
            return String(resolvedModelType);
        }
    }

    return undefined;
}

export function isDataElementModelType(modelType: unknown): boolean {
    const normalizedModelType = normalizeModelType(modelType);
    if (!normalizedModelType) {
        return false;
    }

    return dataElementModelTypes.includes(normalizedModelType as DataElementModelType);
}

export function getCreatedSubmodelElementPath(
    parentElement: { modelType?: string; path?: string; value?: Array<unknown> } | undefined,
    elementIdShort: string | null | undefined
): string | undefined {
    if (!parentElement?.path || !parentElement?.modelType) {
        return undefined;
    }

    if (parentElement.modelType === 'Submodel') {
        if (!elementIdShort) {
            return undefined;
        }

        return `${parentElement.path}/submodel-elements/${elementIdShort}`;
    }

    if (parentElement.modelType === 'SubmodelElementList') {
        if (!Array.isArray(parentElement.value)) {
            return undefined;
        }

        return `${parentElement.path}%5B${parentElement.value.length}%5D`;
    }

    if (!elementIdShort) {
        return undefined;
    }

    return `${parentElement.path}.${elementIdShort}`;
}
