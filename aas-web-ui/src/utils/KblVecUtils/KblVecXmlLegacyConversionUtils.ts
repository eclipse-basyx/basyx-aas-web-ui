import { types as aasTypes } from '@aas-core-works/aas-core3.1-typescript';
import { XMLParser } from 'fast-xml-parser';
import {
    extractXmlId,
    getAttributeEntries,
    getXmlElementEntries,
    isXmlObject,
    isXmlProcessingInstructionKey,
    isXmlScalar,
    toSubmodelElementIdShort,
    type XmlObject,
    type XmlValue,
} from '@/utils/KblVecUtils/KblVecXmlConversionUtils';
import { normalizeForLookup } from '@/utils/KblVecUtils/KblVecUploadUtils';
import { addTypedPropertyToCollection, ensureUniqueIdShortForCollection } from '@/utils/KblVecUtils/KblVecSubmodelElementUtils';

export async function parseStructuredXmlForConversion(file: File): Promise<{ rootName: string; rootValue: XmlValue }> {
    const xmlText = await file.text();
    const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '@_',
        textNodeName: '#text',
        trimValues: true,
        parseTagValue: false,
        parseAttributeValue: false,
    });

    const parsedUnknown = parser.parse(xmlText) as unknown;
    if (!isXmlObject(parsedUnknown)) {
        throw new Error('Could not parse KBL/VEC XML for conversion.');
    }

    const rootEntry = Object.entries(parsedUnknown).find(([key]) => !isXmlProcessingInstructionKey(key) && key !== '#text');
    if (!rootEntry) {
        throw new Error('KBL/VEC XML does not contain a valid root element after removing XML headers.');
    }

    return { rootName: rootEntry[0], rootValue: rootEntry[1] };
}

export function buildSubmodelsFromParsedXml(
    aasId: string,
    rootName: string,
    rootValue: XmlValue
): { submodels: aasTypes.Submodel[]; dataPointCount: number } {
    const submodels: aasTypes.Submodel[] = [];
    const usedSubmodelIds = new Set<string>();
    let dataPointCount = 0;

    const topLevelEntries: Array<{ elementName: string; elementValue: XmlValue }> = [];
    if (isXmlObject(rootValue)) {
        for (const [elementName, elementValue] of getXmlElementEntries(rootValue)) {
            topLevelEntries.push({ elementName, elementValue });
        }
    }

    if (topLevelEntries.length === 0) {
        topLevelEntries.push({ elementName: rootName, elementValue: rootValue });
    }

    for (const entry of topLevelEntries) {
        const items = Array.isArray(entry.elementValue) ? entry.elementValue : [entry.elementValue];

        for (let index = 0; index < items.length; index++) {
            const created = createSubmodelFromTopLevelElement(aasId, entry.elementName, items[index], index + 1);
            if (!created) continue;

            let uniqueSubmodelId = created.submodel.id;
            if (usedSubmodelIds.has(uniqueSubmodelId)) {
                let suffix = 2;
                while (usedSubmodelIds.has(`${created.submodel.id}_${suffix}`)) {
                    suffix++;
                }
                uniqueSubmodelId = `${created.submodel.id}_${suffix}`;
            }

            created.submodel.id = uniqueSubmodelId;
            usedSubmodelIds.add(uniqueSubmodelId);
            submodels.push(created.submodel);
            dataPointCount += created.dataPointCount;
        }
    }

    return { submodels, dataPointCount };
}

function createSubmodelFromTopLevelElement(
    aasId: string,
    elementName: string,
    elementValue: XmlValue,
    occurrenceIndex: number
): { submodel: aasTypes.Submodel; dataPointCount: number } | null {
    const extractedId = extractXmlId(elementValue);
    const shortIdCandidate = extractedId !== '' ? extractedId : `${elementName}_${occurrenceIndex}`;
    const idSuffix = toSubmodelElementIdShort(`${elementName}_${shortIdCandidate}`).toLowerCase();
    const displayLanguage = inferLanguageCodeForNode(elementValue);

    const submodel = new aasTypes.Submodel(`${aasId}/submodels/${idSuffix}`);
    submodel.idShort = toSubmodelElementIdShort(shortIdCandidate);
    submodel.displayName = [
        new aasTypes.LangStringNameType(
            displayLanguage,
            extractedId !== '' ? `${elementName} (${extractedId})` : `${elementName} [${occurrenceIndex}]`
        ),
    ];

    const rootCollection = new aasTypes.SubmodelElementCollection();
    rootCollection.idShort = 'Data';
    rootCollection.value = [];

    const createdDataPoints = appendNodeIntoCollection(rootCollection, elementName, elementValue, elementName);
    if ((rootCollection.value?.length ?? 0) === 0) {
        return null;
    }

    submodel.submodelElements = rootCollection.value;
    return { submodel, dataPointCount: createdDataPoints };
}

function appendNodeIntoCollection(
    targetCollection: aasTypes.SubmodelElementCollection,
    nodeName: string,
    nodeValue: XmlValue,
    parentElementName: string
): number {
    if (Array.isArray(nodeValue)) {
        return appendArrayNodeIntoCollection(targetCollection, nodeName, nodeValue, parentElementName);
    }

    if (isXmlObject(nodeValue)) {
        return appendObjectNodeIntoCollection(targetCollection, nodeName, nodeValue);
    }

    if (isXmlScalar(nodeValue)) {
        const valueText = String(nodeValue).trim();
        if (valueText === '') return 0;
        addTypedPropertyToCollection(targetCollection, nodeName, valueText);
        return 1;
    }

    return 0;
}

function appendArrayNodeIntoCollection(
    targetCollection: aasTypes.SubmodelElementCollection,
    nodeName: string,
    nodeValues: XmlValue[],
    parentElementName: string
): number {
    const localizedSelection = selectLocalizedArrayValue(nodeValues);
    if (localizedSelection !== null) {
        addTypedPropertyToCollection(targetCollection, nodeName, localizedSelection);
        return 1;
    }

    let createdProperties = 0;
    const axisNames = getCoordinateAxisNames(nodeName, nodeValues.length, parentElementName);

    for (let index = 0; index < nodeValues.length; index++) {
        const item = nodeValues[index];
        const itemName = axisNames[index] || (nodeValues.length === 1 ? nodeName : `${nodeName}_${index + 1}`);

        if (isXmlScalar(item)) {
            const scalarValue = String(item).trim();
            if (scalarValue === '') continue;
            addTypedPropertyToCollection(targetCollection, itemName, scalarValue);
            createdProperties++;
            continue;
        }

        const nestedCollection = new aasTypes.SubmodelElementCollection();
        const extractedId = extractXmlId(item);
        nestedCollection.idShort = ensureUniqueIdShortForCollection(targetCollection, extractedId !== '' ? extractedId : itemName);
        nestedCollection.value = [];

        const nestedCreated = appendNodeIntoCollection(nestedCollection, nodeName, item, nodeName);
        if (nestedCreated > 0) {
            if (!targetCollection.value) targetCollection.value = [];
            targetCollection.value.push(nestedCollection);
            createdProperties += nestedCreated;
        }
    }

    return createdProperties;
}

function appendObjectNodeIntoCollection(
    targetCollection: aasTypes.SubmodelElementCollection,
    nodeName: string,
    nodeObject: XmlObject
): number {
    let createdProperties = 0;

    for (const [attributeName, attributeValue] of getAttributeEntries(nodeObject)) {
        if (normalizeForLookup(attributeName) === 'id') continue;
        const valueText = attributeValue.trim();
        if (valueText === '') continue;
        addTypedPropertyToCollection(targetCollection, `Attr_${attributeName}`, valueText);
        createdProperties++;
    }

    const textValue = nodeObject['#text'];
    if (isXmlScalar(textValue)) {
        const trimmedText = String(textValue).trim();
        if (trimmedText !== '') {
            addTypedPropertyToCollection(targetCollection, nodeName, trimmedText);
            createdProperties++;
        }
    }

    const localizedObjectValue = extractLocalizedObjectValue(nodeObject);
    if (localizedObjectValue !== null) {
        addTypedPropertyToCollection(targetCollection, nodeName, localizedObjectValue.value);
        return createdProperties + 1;
    }

    for (const [childName, childValue] of getXmlElementEntries(nodeObject)) {
        if (isLanguageMetadataKey(childName)) {
            continue;
        }

        const localizedArrayValue = Array.isArray(childValue) ? selectLocalizedArrayValue(childValue) : null;
        if (localizedArrayValue !== null) {
            addTypedPropertyToCollection(targetCollection, childName, localizedArrayValue);
            createdProperties++;
            continue;
        }

        const localizedChildValue = extractLocalizedObjectValue(childValue);
        if (localizedChildValue !== null) {
            addTypedPropertyToCollection(targetCollection, childName, localizedChildValue.value);
            createdProperties++;
            continue;
        }

        if (Array.isArray(childValue) || isXmlObject(childValue)) {
            const childCollection = new aasTypes.SubmodelElementCollection();
            const extractedId = extractXmlId(childValue);
            childCollection.idShort = ensureUniqueIdShortForCollection(targetCollection, extractedId !== '' ? extractedId : childName);
            childCollection.value = [];

            const nestedCreated = appendNodeIntoCollection(childCollection, childName, childValue, nodeName);
            if (nestedCreated > 0) {
                if (!targetCollection.value) targetCollection.value = [];
                targetCollection.value.push(childCollection);
                createdProperties += nestedCreated;
            }
            continue;
        }

        if (!isXmlScalar(childValue)) continue;
        const scalarValue = String(childValue).trim();
        if (scalarValue === '') continue;
        addTypedPropertyToCollection(targetCollection, childName, scalarValue);
        createdProperties++;
    }

    return createdProperties;
}

function selectLocalizedArrayValue(nodeValues: XmlValue[]): string | null {
    const candidates = nodeValues
        .map((item) => extractLocalizedObjectValue(item))
        .filter((item): item is { language: string; value: string } => item !== null);

    if (candidates.length === 0) return null;

    const preferredLanguage = getPreferredLanguageCode();
    const exact = candidates.find((candidate) => candidate.language === preferredLanguage);
    if (exact) return exact.value;

    const sameFamily = candidates.find((candidate) => candidate.language.startsWith(`${preferredLanguage}-`));
    if (sameFamily) return sameFamily.value;

    const english = candidates.find((candidate) => candidate.language === 'en' || candidate.language.startsWith('en-'));
    if (english) return english.value;

    return candidates[0].value;
}

function extractLocalizedObjectValue(value: XmlValue): { language: string; value: string } | null {
    if (!isXmlObject(value)) return null;

    let languageCode = '';
    let textValue = '';

    for (const [entryName, entryValue] of Object.entries(value)) {
        if (!isXmlScalar(entryValue)) continue;

        const normalizedName = normalizeForLookup(entryName);
        const normalizedValue = String(entryValue).trim();
        if (normalizedValue === '') continue;

        if (isLanguageMetadataKey(normalizedName)) {
            languageCode = normalizeLanguageCode(normalizedValue);
            continue;
        }

        if (isLocalizedValueKey(normalizedName)) {
            textValue = normalizedValue;
        }
    }

    if (languageCode === '' || textValue === '') return null;
    return { language: languageCode, value: textValue };
}

function isLanguageMetadataKey(name: string): boolean {
    const normalized = normalizeForLookup(name);
    return (
        normalized === 'language' ||
        normalized === 'languagecode' ||
        normalized === 'lang' ||
        normalized === 'xmllang' ||
        normalized === 'atlang' ||
        normalized === 'atlanguage' ||
        normalized === 'atlanguagecode' ||
        normalized === 'locale' ||
        normalized === 'localecode' ||
        normalized === 'countrycode' ||
        normalized === 'ietfcode' ||
        normalized === 'isocode' ||
        normalized === 'isolangcode' ||
        normalized === 'isolanguagecode'
    );
}

function isLocalizedValueKey(name: string): boolean {
    return (
        name === 'value' ||
        name === 'text' ||
        name === 'label' ||
        name === 'name' ||
        name === 'description' ||
        name === 'designation'
    );
}

function normalizeLanguageCode(value: string): string {
    return value.trim().toLowerCase().replace('_', '-');
}

function inferLanguageCodeForNode(node: XmlValue): string {
    const found = findLanguageCodeInNode(node);
    if (found !== '') return found;
    return 'en';
}

function findLanguageCodeInNode(node: XmlValue): string {
    if (Array.isArray(node)) {
        for (const item of node) {
            const found = findLanguageCodeInNode(item);
            if (found !== '') return found;
        }
        return '';
    }

    if (!isXmlObject(node)) {
        return '';
    }

    for (const [entryName, entryValue] of Object.entries(node)) {
        if (isLanguageMetadataKey(entryName) && isXmlScalar(entryValue)) {
            const candidate = normalizeLanguageCode(String(entryValue));
            if (candidate !== '') return candidate;
        }
    }

    for (const childValue of Object.values(node)) {
        const found = findLanguageCodeInNode(childValue);
        if (found !== '') return found;
    }

    return '';
}

function getPreferredLanguageCode(): string {
    if (typeof navigator === 'undefined' || !navigator.language) {
        return 'en';
    }

    const normalized = normalizeLanguageCode(navigator.language);
    if (normalized === '') return 'en';
    return normalized;
}

function getCoordinateAxisNames(nodeName: string, itemCount: number, parentElementName: string): string[] {
    const normalizedNode = normalizeForLookup(nodeName);
    const normalizedParent = normalizeForLookup(parentElementName);
    if (!(normalizedNode === 'coordinates' && normalizedParent.includes('cartesian'))) {
        return [];
    }

    const canonicalAxes = ['x', 'y', 'z'];
    const axisNames: string[] = [];
    for (let i = 0; i < itemCount; i++) {
        axisNames.push(canonicalAxes[i] || `coordinate_${i + 1}`);
    }

    return axisNames;
}
