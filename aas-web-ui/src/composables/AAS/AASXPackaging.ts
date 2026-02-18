import * as aasCore from '@aas-core-works/aas-core3.0-typescript';
import { NewPackaging, type ReadWriteSeeker } from 'aasx-package-ts';
import mime from 'mime';
import { useAASHandling } from '@/composables/AAS/AASHandling';
import { useConceptDescriptionHandling } from '@/composables/AAS/ConceptDescriptionHandling';
import { useSMHandling } from '@/composables/AAS/SMHandling';
import { useSMEFile } from '@/composables/AAS/SubmodelElements/File';
import { useAASRepositoryClient } from '@/composables/Client/AASRepositoryClient';
import { useSMRepositoryClient } from '@/composables/Client/SMRepositoryClient';
import { useRequestHandling } from '@/composables/RequestHandling';
import { extractId as extractIdFromReference } from '@/utils/AAS/ReferenceUtil';
import { base64Encode } from '@/utils/EncodeDecodeUtils';

type JsonRecord = Record<string, unknown>;

type FileBinding = {
    raw: JsonRecord;
    clean: JsonRecord;
};

type SupplementaryPart = {
    uri: URL;
    contentType: string;
    bytes: Uint8Array;
};

type CreateClientAASXOptions = {
    aasId: string;
    selectedSubmodelIds: string[];
    includeConceptDescriptions: boolean;
};

type CreateClientAASXResult = {
    blob: Blob;
    warnings: string[];
};

const runtimeKeys = new Set(['path', 'timestamp', 'id', 'conceptDescriptions', 'endpoints', 'isExternal']);
const identifiableModelTypes = new Set(['AssetAdministrationShell', 'Submodel', 'ConceptDescription']);

class InMemoryReadWriteSeeker implements ReadWriteSeeker {
    private bytes: Uint8Array = new Uint8Array();

    readAll(): Uint8Array {
        return this.bytes.slice();
    }

    writeAll(data: Uint8Array): void {
        this.bytes = data.slice();
    }
}

function asRecord(value: unknown): JsonRecord | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    return value as JsonRecord;
}

function asArray(value: unknown): unknown[] {
    return Array.isArray(value) ? value : [];
}

function asString(value: unknown): string {
    return typeof value === 'string' ? value : '';
}

function hasKeys(value: unknown): value is JsonRecord {
    const record = asRecord(value);
    return record !== null && Object.keys(record).length > 0;
}

function shouldPreservePath(record: JsonRecord, key: string): boolean {
    if (key !== 'path') return false;

    const hasContentType = typeof record.contentType === 'string' && record.contentType.trim() !== '';
    const hasModelType = typeof record.modelType === 'string' && record.modelType.trim() !== '';

    return hasContentType && !hasModelType;
}

function shouldPreserveId(record: JsonRecord, key: string): boolean {
    if (key !== 'id') return false;

    const modelType = asString(record.modelType).trim();
    return identifiableModelTypes.has(modelType);
}

function stringifyUnknown(value: unknown): string {
    if (value instanceof Error) return value.message;
    if (typeof value === 'string') return value;

    try {
        return JSON.stringify(value);
    } catch {
        return String(value);
    }
}

function buildSubmodelReferences(submodelIds: string[]): JsonRecord[] {
    return submodelIds.map((submodelId) => ({
        type: 'ModelReference',
        keys: [{ type: 'Submodel', value: submodelId }],
    }));
}

async function toBytes(payload: unknown): Promise<Uint8Array> {
    if (payload instanceof Uint8Array) return payload;

    if (payload instanceof ArrayBuffer) {
        return new Uint8Array(payload);
    }

    if (ArrayBuffer.isView(payload)) {
        const view = payload as ArrayBufferView;
        return new Uint8Array(view.buffer, view.byteOffset, view.byteLength);
    }

    if (payload instanceof Blob) {
        return new Uint8Array(await payload.arrayBuffer());
    }

    if (typeof payload === 'string') {
        return new TextEncoder().encode(payload);
    }

    if (payload === null || payload === undefined) {
        throw new TypeError('Attachment payload is empty.');
    }

    return new TextEncoder().encode(JSON.stringify(payload));
}

function cloneWithoutRuntimeFields(value: unknown): unknown {
    if (Array.isArray(value)) {
        return value.map((item) => cloneWithoutRuntimeFields(item));
    }

    const record = asRecord(value);
    if (record) {
        const result: JsonRecord = {};
        for (const [key, item] of Object.entries(record)) {
            if (runtimeKeys.has(key) && !shouldPreservePath(record, key) && !shouldPreserveId(record, key)) continue;
            result[key] = cloneWithoutRuntimeFields(item);
        }
        return result;
    }

    return value;
}

function normalizeId(id: string): string {
    return id?.trim() || '';
}

function safeSegment(value: string, fallback: string): string {
    const cleaned = value
        ?.trim()
        .replace(/[^a-zA-Z0-9._-]/g, '-')
        .replace(/-+/g, '-');
    return cleaned && cleaned !== '' ? cleaned : fallback;
}

function isExternalHttpUrl(path: string): boolean {
    if (!path || path.trim() === '') return false;

    try {
        const parsed = new URL(path);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
        return false;
    }
}

function traverseObjects(root: unknown, visitor: (node: unknown) => void): void {
    if (!root || typeof root !== 'object') return;

    const visited = new WeakSet<object>();

    const recurse = (node: unknown): void => {
        if (!node || typeof node !== 'object') return;
        if (visited.has(node as object)) return;
        visited.add(node as object);

        visitor(node);

        if (Array.isArray(node)) {
            for (const item of node) recurse(item);
            return;
        }

        const record = asRecord(node);
        if (!record) return;

        for (const value of Object.values(record)) {
            recurse(value);
        }
    };

    recurse(root);
}

function collectSemanticIds(submodel: JsonRecord): string[] {
    const semanticIds = new Set<string>();

    const collectFromReference = (reference: unknown): void => {
        const record = asRecord(reference);
        if (!record) return;

        for (const key of asArray(record.keys)) {
            const keyRecord = asRecord(key);
            const value = asString(keyRecord?.value).trim();
            if (value !== '') semanticIds.add(value);
        }
    };

    traverseObjects(submodel, (node: unknown) => {
        const record = asRecord(node);
        if (!record) return;

        collectFromReference(record.semanticId);

        for (const supplementalSemanticId of asArray(record.supplementalSemanticIds)) {
            collectFromReference(supplementalSemanticId);
        }
    });

    return Array.from(semanticIds);
}

function collectFileBindings(raw: unknown, clean: unknown, bindings: FileBinding[]): void {
    if (!raw || !clean || typeof raw !== 'object' || typeof clean !== 'object') return;

    if (Array.isArray(raw) && Array.isArray(clean)) {
        const length = Math.min(raw.length, clean.length);
        for (let index = 0; index < length; index++) {
            collectFileBindings(raw[index], clean[index], bindings);
        }
        return;
    }

    const rawRecord = asRecord(raw);
    const cleanRecord = asRecord(clean);
    if (!rawRecord || !cleanRecord) return;

    if (asString(rawRecord.modelType) === 'File') {
        bindings.push({ raw: rawRecord, clean: cleanRecord });
    }

    for (const key of Object.keys(cleanRecord)) {
        if (!(key in rawRecord)) continue;
        collectFileBindings(rawRecord[key], cleanRecord[key], bindings);
    }
}

function resolveAttachmentFilename(file: JsonRecord, index: number, contentType: string): string {
    const value = asString(file.value);
    const idShort = asString(file.idShort) || `file-${index + 1}`;

    const fromValue = value.split('/').pop();
    if (fromValue && fromValue.includes('.')) {
        return safeSegment(fromValue, `${safeSegment(idShort, 'file')}-${index + 1}`);
    }

    const extension = mime.getExtension(contentType) || 'bin';
    return `${safeSegment(idShort, 'file')}-${index + 1}.${extension}`;
}

export function resolveAttachmentFetchPath(path: unknown): string {
    return asString(path).trim();
}

export function useAASXPackaging(): {
    createClientAASX: (options: CreateClientAASXOptions) => Promise<CreateClientAASXResult>;
    downloadViaBackendSerialization: (
        aasId: string,
        selectedSubmodelIds: string[],
        includeConceptDescriptions: boolean
    ) => Promise<Blob>;
} {
    const { fetchAasById, getAasEndpointById } = useAASHandling();
    const { fetchSmById } = useSMHandling();
    const { fetchCdById } = useConceptDescriptionHandling();
    const { fetchAttachmentFile } = useSMRepositoryClient();
    const { fetchAssetInformation } = useAASRepositoryClient();
    const { getRequest } = useRequestHandling();
    const { determineContentType } = useSMEFile();

    function toCoreworksAAS(aasJson: JsonRecord): aasCore.types.AssetAdministrationShell {
        const aasOrError = aasCore.jsonization.assetAdministrationShellFromJsonable(
            aasJson as aasCore.jsonization.JsonValue
        );
        if (aasOrError.error !== null) {
            const details = stringifyUnknown(aasOrError.error);
            console.error('AASX packaging: failed to parse AAS JSON', {
                details,
                aasJson,
            });
            throw new Error(`Failed to parse AAS: ${details}`);
        }

        return aasOrError.mustValue();
    }

    function toCoreworksSubmodel(submodelJson: JsonRecord, index: number): aasCore.types.Submodel {
        const submodelOrError = aasCore.jsonization.submodelFromJsonable(submodelJson as aasCore.jsonization.JsonValue);
        if (submodelOrError.error !== null) {
            const details = stringifyUnknown(submodelOrError.error);
            console.error('AASX packaging: failed to parse Submodel JSON', {
                index,
                submodelId: asString(submodelJson.id),
                details,
                submodelJson,
            });
            throw new Error(`Failed to parse Submodel '${asString(submodelJson.id) || index}': ${details}`);
        }

        return submodelOrError.mustValue();
    }

    function toCoreworksConceptDescription(cdJson: JsonRecord, index: number): aasCore.types.ConceptDescription {
        const cdOrError = aasCore.jsonization.conceptDescriptionFromJsonable(cdJson as aasCore.jsonization.JsonValue);
        if (cdOrError.error !== null) {
            const details = stringifyUnknown(cdOrError.error);
            console.error('AASX packaging: failed to parse ConceptDescription JSON', {
                index,
                cdId: asString(cdJson.id),
                details,
                cdJson,
            });
            throw new Error(`Failed to parse ConceptDescription '${asString(cdJson.id) || index}': ${details}`);
        }

        return cdOrError.mustValue();
    }

    async function buildConceptDescriptions(semanticIds: string[]): Promise<JsonRecord[]> {
        if (semanticIds.length === 0) return [];

        const cds = await Promise.all(semanticIds.map(async (semanticId) => await fetchCdById(semanticId)));
        const uniqueById = new Set<string>();
        const result: JsonRecord[] = [];

        for (const cd of cds) {
            if (!hasKeys(cd)) continue;
            const cleanCd = cloneWithoutRuntimeFields(cd);
            if (!hasKeys(cleanCd)) continue;

            const cdId = asString(cleanCd.id);
            if (cdId === '' || uniqueById.has(cdId)) continue;

            uniqueById.add(cdId);
            result.push(cleanCd);
        }

        return result;
    }

    async function buildSupplementaryParts(
        fileBindings: FileBinding[],
        warnings: string[]
    ): Promise<SupplementaryPart[]> {
        const supplementaryParts: SupplementaryPart[] = [];

        for (let index = 0; index < fileBindings.length; index++) {
            const fileBinding = fileBindings[index];
            const fileValue = asString(fileBinding.raw.value).trim();
            if (fileValue === '') continue;

            if (isExternalHttpUrl(fileValue)) {
                warnings.push(`Skipped external file URL: ${fileValue}`);
                continue;
            }

            const filePath = resolveAttachmentFetchPath(fileBinding.raw.path);
            if (filePath === '') {
                warnings.push(
                    `Skipped file without attachment path: ${asString(fileBinding.raw.idShort) || fileValue}`
                );
                continue;
            }

            const attachmentPayload = await fetchAttachmentFile(filePath);
            if (!attachmentPayload) {
                warnings.push(`Failed to fetch file attachment: ${asString(fileBinding.raw.idShort) || fileValue}`);
                continue;
            }

            let attachmentBytes: Uint8Array;
            try {
                attachmentBytes = await toBytes(attachmentPayload);
            } catch (error) {
                warnings.push(
                    `Failed to process file attachment bytes: ${asString(fileBinding.raw.idShort) || fileValue} (${stringifyUnknown(error)})`
                );
                continue;
            }

            const attachmentType = attachmentPayload instanceof Blob ? attachmentPayload.type : '';

            const contentType = determineContentType(fileBinding.raw, attachmentType || 'application/octet-stream');
            const fileName = resolveAttachmentFilename(fileBinding.raw, index, contentType);
            const packagePath = `/aasx-suppl/${fileName}`;
            fileBinding.clean.value = packagePath;

            supplementaryParts.push({
                uri: new URL(`https://package.local${packagePath}`),
                contentType,
                bytes: attachmentBytes,
            });
        }

        return supplementaryParts;
    }

    async function fetchThumbnailPart(aas: JsonRecord, warnings: string[]): Promise<SupplementaryPart | null> {
        const aasPath = asString(aas.path).trim();
        if (aasPath === '') return null;

        const assetInformation = await fetchAssetInformation(aasPath);
        if (!hasKeys(assetInformation)) return null;

        const defaultThumbnail = asRecord(assetInformation.defaultThumbnail);
        if (!defaultThumbnail) return null;

        const thumbnailPath = asString(defaultThumbnail.path).trim();
        if (thumbnailPath === '') return null;

        if (isExternalHttpUrl(thumbnailPath)) {
            warnings.push(`Skipped external thumbnail URL: ${thumbnailPath}`);
            return null;
        }

        const thumbnailResponse = await getRequest(thumbnailPath, 'retrieving AAS thumbnail', true);
        if (!thumbnailResponse?.success || !thumbnailResponse.data) {
            warnings.push('Failed to fetch AAS thumbnail.');
            return null;
        }

        const thumbnailPayload = thumbnailResponse.data;
        const thumbnailType = thumbnailPayload instanceof Blob ? thumbnailPayload.type : '';
        const contentType = asString(defaultThumbnail.contentType) || thumbnailType || 'application/octet-stream';
        const extension = mime.getExtension(contentType) || 'bin';

        let thumbnailBytes: Uint8Array;
        try {
            thumbnailBytes = await toBytes(thumbnailPayload);
        } catch (error) {
            warnings.push(`Failed to process AAS thumbnail bytes: ${stringifyUnknown(error)}`);
            return null;
        }

        return {
            uri: new URL(`https://package.local/thumbnail.${extension}`),
            contentType,
            bytes: thumbnailBytes,
        };
    }

    async function createClientAASX(options: CreateClientAASXOptions): Promise<CreateClientAASXResult> {
        const aasId = normalizeId(options.aasId);
        if (aasId === '') {
            throw new Error('AAS ID is required for client-side AASX creation.');
        }

        const selectedSubmodelIds = options.selectedSubmodelIds
            .map((submodelId) => normalizeId(submodelId))
            .filter((submodelId) => submodelId !== '');

        const fetchedAas = await fetchAasById(aasId);
        if (!hasKeys(fetchedAas)) {
            throw new Error(`Failed to fetch AAS: ${aasId}`);
        }

        const aas = fetchedAas as JsonRecord;
        const selectedSubmodelIdSet = new Set(selectedSubmodelIds);
        const aasSubmodelRefs = asArray(aas.submodels);
        const referencedSubmodelIds = aasSubmodelRefs
            .map((submodelRef) => extractIdFromReference(submodelRef, 'Submodel'))
            .filter((submodelId) => selectedSubmodelIdSet.has(submodelId));

        const fetchedSubmodels = await Promise.all(
            selectedSubmodelIds.map(async (submodelId) => await fetchSmById(submodelId, false, true))
        );
        const rawSubmodels = fetchedSubmodels.filter((submodel) => hasKeys(submodel)) as JsonRecord[];

        const fileBindings: FileBinding[] = [];
        const cleanSubmodels: JsonRecord[] = [];
        const semanticIds = new Set<string>();

        for (const rawSubmodel of rawSubmodels) {
            for (const semanticId of collectSemanticIds(rawSubmodel)) {
                semanticIds.add(semanticId);
            }

            const cleanSubmodel = cloneWithoutRuntimeFields(rawSubmodel);
            if (!hasKeys(cleanSubmodel)) continue;

            collectFileBindings(rawSubmodel, cleanSubmodel, fileBindings);
            cleanSubmodels.push(cleanSubmodel as JsonRecord);
        }

        const cleanAas = cloneWithoutRuntimeFields(aas);
        if (!hasKeys(cleanAas)) {
            throw new Error('Failed to build clean AAS payload.');
        }

        (cleanAas as JsonRecord).submodels = buildSubmodelReferences(referencedSubmodelIds);

        const warnings: string[] = [];
        const cleanConceptDescriptions = options.includeConceptDescriptions
            ? await buildConceptDescriptions(Array.from(semanticIds))
            : [];

        const supplementaryParts = await buildSupplementaryParts(fileBindings, warnings);
        const thumbnailPart = await fetchThumbnailPart(aas, warnings);

        const coreworksAas = toCoreworksAAS(cleanAas as JsonRecord);
        const coreworksSubmodels = cleanSubmodels.map((submodel, index) => toCoreworksSubmodel(submodel, index));
        const coreworksConceptDescriptions = cleanConceptDescriptions.map((cd, index) =>
            toCoreworksConceptDescription(cd, index)
        );

        const environment = new aasCore.types.Environment();
        environment.assetAdministrationShells = [coreworksAas];
        environment.submodels = coreworksSubmodels;
        environment.conceptDescriptions = coreworksConceptDescriptions;

        const environmentJson = aasCore.jsonization.toJsonable(environment);
        const specBytes = new TextEncoder().encode(`${JSON.stringify(environmentJson, null, 2)}\n`);

        const packaging = NewPackaging();
        const inMemoryStream = new InMemoryReadWriteSeeker();
        const pkg = await packaging.CreateInStream(inMemoryStream);

        const specPart = await pkg.PutPart(
            new URL('https://package.local/aasx/environment.json'),
            'application/json',
            specBytes
        );
        await pkg.MakeSpec(specPart);

        if (thumbnailPart) {
            const thumbnail = await pkg.PutPart(thumbnailPart.uri, thumbnailPart.contentType, thumbnailPart.bytes);
            await pkg.SetThumbnail(thumbnail);
        }

        for (const supplementaryPart of supplementaryParts) {
            const supplementary = await pkg.PutPart(
                supplementaryPart.uri,
                supplementaryPart.contentType,
                supplementaryPart.bytes
            );
            await pkg.RelateSupplementaryToSpec(supplementary, specPart);
        }

        const packageBytes = await pkg.Flush();
        pkg.Close();

        return {
            blob: new Blob([new Uint8Array(packageBytes)], {
                type: 'application/asset-administration-shell-package+xml',
            }),
            warnings,
        };
    }

    async function downloadViaBackendSerialization(
        aasId: string,
        selectedSubmodelIds: string[],
        includeConceptDescriptions: boolean
    ): Promise<Blob> {
        const normalizedAasId = normalizeId(aasId);
        if (normalizedAasId === '') {
            throw new Error('AAS ID is required for backend serialization download.');
        }

        const aasEndpoint = await getAasEndpointById(normalizedAasId);
        if (!aasEndpoint || aasEndpoint.trim() === '') {
            throw new Error('Failed to retrieve AAS endpoint.');
        }

        const environmentEndpoint = aasEndpoint.split('/shells')[0];
        const params = new URLSearchParams();
        params.append('aasIds', base64Encode(normalizedAasId));

        for (const submodelId of selectedSubmodelIds
            .map((value) => normalizeId(value))
            .filter((value) => value !== '')) {
            params.append('submodelIds', base64Encode(submodelId));
        }

        params.append('includeConceptDescriptions', String(includeConceptDescriptions));

        const serializationPath = `${environmentEndpoint}/serialization?${params.toString()}`;
        const headers = new Headers();
        headers.append('Accept', 'application/asset-administration-shell-package+xml');

        const response = await getRequest(serializationPath, 'retrieving AAS serialization', false, headers);
        if (!response?.success || !response?.data) {
            throw new Error('Failed to retrieve serialized AASX package.');
        }

        return response.data as Blob;
    }

    return {
        createClientAASX,
        downloadViaBackendSerialization,
    };
}
