import { getElementPath, normalizeForLookup, tokenizePath } from '@/utils/KblVecUtils/KblVecUploadUtils';

export type RequiredFieldKey = 'shortId' | 'aasId' | 'assetId' | 'aasName' | 'aasDescription' | 'assetKind';

export type RequiredFieldDefinition = {
    key: RequiredFieldKey;
    label: string;
    aliases: string[];
};

export type RequiredFieldValues = Record<RequiredFieldKey, string>;
export type RequiredFieldPaths = Record<RequiredFieldKey, string>;

export type ExtractedDataPointLike = {
    label: string;
    value: string;
};

export const requiredFieldDefinitions: RequiredFieldDefinition[] = [
    { key: 'shortId', label: 'ShortID', aliases: ['shortid', 'idshort', 'shortname'] },
    {
        key: 'aasId',
        label: 'AAS Id',
        aliases: ['aasid', 'assetadministrationshellid', 'shellid', 'administrationshellid'],
    },
    { key: 'assetId', label: 'Asset ID', aliases: ['assetid', 'globalassetid', 'assetidentifier'] },
    { key: 'aasName', label: 'AAS Name', aliases: ['aasname', 'assetadministrationshellname', 'name'] },
    {
        key: 'aasDescription',
        label: 'AAS Description',
        aliases: ['aasdescription', 'assetadministrationshelldescription', 'description', 'desc'],
    },
    { key: 'assetKind', label: 'Asset Kind', aliases: ['assetkind', 'kind'] },
];

export function createEmptyRequiredFieldValues(): RequiredFieldValues {
    return {
        shortId: '',
        aasId: '',
        assetId: '',
        aasName: '',
        aasDescription: '',
        assetKind: 'Instance',
    };
}

export function createEmptyRequiredFieldPaths(): RequiredFieldPaths {
    return {
        shortId: '',
        aasId: '',
        assetId: '',
        aasName: '',
        aasDescription: '',
        assetKind: '',
    };
}

export function deriveShortIdFromFileName(fileName: string): string {
    const trimmed = fileName.trim();
    const baseName = trimmed.replace(/\.[^/.]+$/, '').trim();
    const sanitized = baseName
        .replace(/[^a-zA-Z0-9_]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '');

    let shortId = sanitized || 'UploadedKblVec';

    if (/^[0-9]/.test(shortId)) {
        shortId = `E_${shortId}`;
    }

    const maxLength = 120;
    if (shortId.length > maxLength) {
        shortId = shortId.slice(0, maxLength);
    }

    return shortId;
}

export function inferRequiredFieldValues(
    points: ExtractedDataPointLike[],
    doc: Document,
    sourceFileName: string,
    maxElementScan: number
): { values: RequiredFieldValues; paths: RequiredFieldPaths } {
    const values = createEmptyRequiredFieldValues();
    const paths = createEmptyRequiredFieldPaths();

    for (const definition of requiredFieldDefinitions) {
        if (definition.key === 'assetKind') {
            continue;
        }

        const fromPoints = findMatchingDataPoint(points, definition.key, definition.aliases);
        if (fromPoints !== null) {
            values[definition.key] = fromPoints.value;
            paths[definition.key] = fromPoints.path;
            continue;
        }

        const fromElements = findElementTextByAliases(doc, definition.key, definition.aliases, maxElementScan);
        if (fromElements.value !== '') {
            values[definition.key] = fromElements.value;
            paths[definition.key] = fromElements.path;
        }
    }

    values.shortId = deriveShortIdFromFileName(sourceFileName);
    values.assetKind = 'Instance';
    paths.assetKind = '';

    return { values, paths };
}

function findMatchingDataPoint(
    points: ExtractedDataPointLike[],
    fieldKey: RequiredFieldKey,
    aliases: string[]
): { path: string; value: string } | null {
    const normalizedAliases = aliases.map((alias) => normalizeForLookup(alias));
    const contextTokensByField: Record<RequiredFieldKey, string[]> = {
        shortId: ['shell', 'aas', 'assetadministrationshell'],
        aasId: ['shell', 'aas', 'assetadministrationshell', 'identification'],
        assetId: ['asset', 'instance', 'identification'],
        aasName: ['shell', 'aas', 'assetadministrationshell'],
        aasDescription: ['shell', 'aas', 'assetadministrationshell'],
        assetKind: ['asset', 'information'],
    };

    let bestMatch: { path: string; value: string; score: number } | null = null;

    for (const point of points) {
        const tokens = tokenizePath(point.label);
        const labelNormalized = normalizeForLookup(point.label);
        let score = 0;

        for (const alias of normalizedAliases) {
            if (tokens.includes(alias)) score += 6;
            else if (labelNormalized.includes(alias)) score += 3;
        }

        for (const token of contextTokensByField[fieldKey]) {
            if (tokens.includes(token)) score += 1;
        }

        if (score > 0 && (!bestMatch || score > bestMatch.score)) {
            bestMatch = { path: point.label, value: point.value.trim(), score };
        }
    }

    return bestMatch ? { path: bestMatch.path, value: bestMatch.value } : null;
}

function findElementTextByAliases(
    doc: Document,
    fieldKey: RequiredFieldKey,
    aliases: string[],
    maxElementScan: number
): { path: string; value: string } {
    const normalizedAliases = aliases.map((alias) => normalizeForLookup(alias));
    const contextTokensByField: Record<RequiredFieldKey, string[]> = {
        shortId: ['shell', 'aas', 'assetadministrationshell'],
        aasId: ['shell', 'aas', 'assetadministrationshell', 'identification'],
        assetId: ['asset', 'instance', 'identification'],
        aasName: ['shell', 'aas', 'assetadministrationshell'],
        aasDescription: ['shell', 'aas', 'assetadministrationshell'],
        assetKind: ['asset', 'information'],
    };

    const allElements = doc.getElementsByTagName('*');
    let best: { path: string; value: string; score: number } | null = null;
    const maxScan = Math.min(allElements.length, maxElementScan);

    for (let index = 0; index < maxScan; index++) {
        const element = allElements.item(index);
        if (!element) continue;

        const path = getElementPath(element);
        const pathTokens = tokenizePath(path);
        const normalizedName = normalizeForLookup(element.localName ?? element.tagName ?? '');

        let score = 0;
        for (const alias of normalizedAliases) {
            if (normalizedName === alias || pathTokens.includes(alias)) score += 5;
            else if (normalizeForLookup(path).includes(alias)) score += 2;
        }
        for (const token of contextTokensByField[fieldKey]) {
            if (pathTokens.includes(token)) score += 1;
        }

        if (score <= 0) continue;

        const textValue = element.textContent?.trim() ?? '';
        if (textValue !== '' && (!best || score > best.score)) {
            best = { path, value: textValue, score };
        }

        for (const attr of Array.from(element.attributes)) {
            const attrName = normalizeForLookup(attr.name);
            const attrValue = attr.value?.trim() ?? '';
            const attrScore = normalizedAliases.includes(attrName) ? score + 2 : score;
            if (attrValue !== '' && attrScore > 0 && (!best || attrScore > best.score)) {
                best = { path: `${path}.@${attr.name}`, value: attrValue, score: attrScore };
            }
        }
    }

    return best ? { path: best.path, value: best.value } : { path: '', value: '' };
}
