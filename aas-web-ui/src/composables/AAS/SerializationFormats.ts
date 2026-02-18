export type SerializationFormat = 'plain-json' | 'plain-xml' | 'aasx-json' | 'aasx-xml';

export type SerializationFormatConfig = {
    title: string;
    extension: string;
    acceptHeader: string;
    blobContentType: string;
    isPlain: boolean;
    isAasx: boolean;
    specFileName?: string;
    specContentType?: string;
};

const serializationFormatConfigMap: Record<SerializationFormat, SerializationFormatConfig> = {
    'plain-json': {
        title: 'Plain JSON',
        extension: 'json',
        acceptHeader: 'application/json',
        blobContentType: 'application/json',
        isPlain: true,
        isAasx: false,
    },
    'plain-xml': {
        title: 'Plain XML',
        extension: 'xml',
        acceptHeader: 'application/xml',
        blobContentType: 'application/xml',
        isPlain: true,
        isAasx: false,
    },
    'aasx-json': {
        title: 'AASX (JSON content)',
        extension: 'aasx',
        acceptHeader: 'application/asset-administration-shell-package',
        blobContentType: 'application/asset-administration-shell-package',
        isPlain: false,
        isAasx: true,
        specFileName: 'environment.json',
        specContentType: 'application/json',
    },
    'aasx-xml': {
        title: 'AASX (XML content)',
        extension: 'aasx',
        acceptHeader: 'application/asset-administration-shell-package+xml',
        blobContentType: 'application/asset-administration-shell-package+xml',
        isPlain: false,
        isAasx: true,
        specFileName: 'environment.xml',
        specContentType: 'application/xml',
    },
};

export const serializationFormatOptions: Array<{ title: string; value: SerializationFormat }> = (
    Object.entries(serializationFormatConfigMap) as Array<[SerializationFormat, SerializationFormatConfig]>
).map(([value, config]) => ({
    title: config.title,
    value,
}));

export const defaultSerializationFormat: SerializationFormat = 'aasx-json';

export function getSerializationFormatConfig(format: SerializationFormat): SerializationFormatConfig {
    return serializationFormatConfigMap[format];
}

export function isPlainSerializationFormat(format: SerializationFormat): boolean {
    return getSerializationFormatConfig(format).isPlain;
}

export function getSerializationFileExtension(format: SerializationFormat): string {
    return getSerializationFormatConfig(format).extension;
}

export function detectImportFileKind(fileName: string): 'aasx' | 'json' | 'xml' | 'unknown' {
    const normalized = fileName.trim().toLowerCase();

    if (normalized.endsWith('.aasx')) return 'aasx';
    if (normalized.endsWith('.json')) return 'json';
    if (normalized.endsWith('.xml')) return 'xml';

    return 'unknown';
}
