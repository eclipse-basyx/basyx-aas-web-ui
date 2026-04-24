import { types as aasTypes } from '@aas-core-works/aas-core3.1-typescript';

export type XmlScalar = string | number | boolean;
export type XmlValue = XmlScalar | XmlObject | XmlValue[] | null;

export interface XmlObject {
    [key: string]: XmlValue;
}

export function isXmlObject(value: unknown): value is XmlObject {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isXmlScalar(value: unknown): value is XmlScalar {
    return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
}

export function isXmlProcessingInstructionKey(key: string): boolean {
    const normalized = key.trim();
    return normalized.startsWith('?');
}

export function getXmlElementEntries(node: XmlObject): Array<[string, XmlValue]> {
    return Object.entries(node).filter(([key]) => key !== '#text' && !key.startsWith('@_'));
}

export function getAttributeEntries(node: XmlObject): Array<[string, string]> {
    return Object.entries(node)
        .filter(([key]) => key.startsWith('@_'))
        .map(([key, value]) => [key.slice(2), String(value ?? '')]);
}

export function extractXmlId(node: XmlValue): string {
    if (!isXmlObject(node)) return '';

    const idKeys = ['@_id', '@_Id', '@_ID'];
    for (const idKey of idKeys) {
        const value = node[idKey];
        if (!isXmlScalar(value)) continue;

        const normalized = String(value).trim();
        if (normalized !== '') return normalized;
    }

    return '';
}

export function buildAttachmentSmePath(smEndpoint: string, idShortPath: string[]): string {
    const encodedPath = idShortPath.map((segment) => encodeURIComponent(segment)).join('.');
    return `${smEndpoint}/submodel-elements/${encodedPath}`;
}

export function toSubmodelElementIdShort(label: string): string {
    const sanitized = label
        .replace(/[^a-zA-Z0-9_]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '');
    let base = sanitized;

    if (base === '') {
        base = 'Element';
    }

    if (/^[0-9]/.test(base)) {
        base = `E_${base}`;
    }

    const maxBaseLength = 120;
    if (base.length > maxBaseLength) {
        base = base.slice(0, maxBaseLength);
    }

    return base;
}

export function inferTypedValue(value: string): { valueType: aasTypes.DataTypeDefXsd; normalizedValue: string } {
    const trimmed = value.trim();
    if (trimmed === '') {
        return { valueType: aasTypes.DataTypeDefXsd.String, normalizedValue: '' };
    }

    if (/^(true|false|1|0)$/i.test(trimmed)) {
        return {
            valueType: aasTypes.DataTypeDefXsd.Boolean,
            normalizedValue: /^(true|1)$/i.test(trimmed) ? 'true' : 'false',
        };
    }

    if (/^[+-]?\d+$/.test(trimmed)) {
        return { valueType: aasTypes.DataTypeDefXsd.Integer, normalizedValue: trimmed };
    }

    if (/^[+-]?(?:\d+\.\d*|\.\d+|\d+)(?:[eE][+-]?\d+)?$/.test(trimmed) && /[.eE]/.test(trimmed)) {
        return { valueType: aasTypes.DataTypeDefXsd.Double, normalizedValue: trimmed };
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        return { valueType: aasTypes.DataTypeDefXsd.Date, normalizedValue: trimmed };
    }

    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?$/.test(trimmed)) {
        return { valueType: aasTypes.DataTypeDefXsd.DateTime, normalizedValue: trimmed };
    }

    if (/^(https?:\/\/|urn:)/i.test(trimmed)) {
        return { valueType: aasTypes.DataTypeDefXsd.AnyUri, normalizedValue: trimmed };
    }

    return { valueType: aasTypes.DataTypeDefXsd.String, normalizedValue: trimmed };
}

export function normalizeAssetKind(input: string): aasTypes.AssetKind {
    const normalized = input.trim().toLowerCase();
    if (normalized === 'type') return aasTypes.AssetKind.Type;
    if (normalized === 'role') return aasTypes.AssetKind.Role;
    if (normalized === 'notapplicable' || normalized === 'not applicable') return aasTypes.AssetKind.NotApplicable;
    return aasTypes.AssetKind.Instance;
}
