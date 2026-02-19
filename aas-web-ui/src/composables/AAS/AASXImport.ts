import * as aasCore from '@aas-core-works/aas-core3.1-typescript';
import { NewPackaging, type Part } from 'aasx-package-ts';
import mime from 'mime';
import { useSMEFile } from '@/composables/AAS/SubmodelElements/File';
import { useAASRepositoryClient } from '@/composables/Client/AASRepositoryClient';
import { useCDRepositoryClient } from '@/composables/Client/CDRepositoryClient';
import { useSMRepositoryClient } from '@/composables/Client/SMRepositoryClient';
import { deserializeXml } from '../../../node_modules/basyx-typescript-sdk/dist/lib/aas-dataformat-xml/xmlization.js';

type JsonRecord = Record<string, unknown>;

type AttachmentUpload = {
    submodelId: string;
    idShortPath: string[];
    bytes: Uint8Array;
    fileName: string;
    contentType: string;
};

type ThumbnailUpload = {
    bytes: Uint8Array;
    fileName: string;
    contentType: string;
};

type ParsedAASX = {
    aasById: Map<string, { core: aasCore.types.AssetAdministrationShell; json: JsonRecord }>;
    submodelById: Map<string, { core: aasCore.types.Submodel; json: JsonRecord }>;
    cdById: Map<string, { core: aasCore.types.ConceptDescription; json: JsonRecord }>;
    attachments: AttachmentUpload[];
    thumbnail: ThumbnailUpload | null;
};

export type ClientAASXImportResult = {
    importedAas: JsonRecord[];
    importedSubmodels: JsonRecord[];
    importedConceptDescriptions: JsonRecord[];
    importedAasIds: string[];
    warnings: string[];
};

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

function stringifyUnknown(value: unknown): string {
    if (value instanceof Error) return value.message;
    if (typeof value === 'string') return value;

    try {
        return JSON.stringify(value);
    } catch {
        return String(value);
    }
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

function normalizePackagePath(path: string): string {
    if (!path) return '';

    let normalized = path.trim();
    if (normalized === '') return '';

    try {
        normalized = new URL(normalized).pathname;
    } catch {
        normalized = normalized.split('?')[0];
    }

    if (!normalized.startsWith('/')) normalized = '/' + normalized;
    return normalized;
}

function packagePathCandidates(path: string): string[] {
    const candidates = new Set<string>();
    const normalized = normalizePackagePath(path);
    if (normalized) candidates.add(normalized);

    if (normalized.startsWith('/')) candidates.add(normalized.slice(1));
    else candidates.add('/' + normalized);

    try {
        const decoded = decodeURIComponent(normalized);
        candidates.add(decoded);
        if (decoded.startsWith('/')) candidates.add(decoded.slice(1));
    } catch {
        // no-op
    }

    return Array.from(candidates).filter((candidate) => candidate.trim() !== '');
}

function buildSupplementaryMap(parts: Part[]): Map<string, Part> {
    const map = new Map<string, Part>();

    for (const part of parts) {
        for (const candidate of packagePathCandidates(part.URI.pathname)) {
            map.set(candidate, part);
        }
    }

    return map;
}

function pickSupplementaryPart(path: string, supplementaryMap: Map<string, Part>): Part | null {
    for (const candidate of packagePathCandidates(path)) {
        const part = supplementaryMap.get(candidate);
        if (part) return part;
    }

    const normalized = normalizePackagePath(path);
    const fileName = normalized.split('/').pop() || '';
    if (fileName === '') return null;

    const matchingParts = Array.from(supplementaryMap.values()).filter(
        (part) => (part.URI.pathname.split('/').pop() || '') === fileName
    );

    return matchingParts.length === 1 ? matchingParts[0] : null;
}

function resolveFileName(path: string, fallbackPrefix: string, index: number, contentType: string): string {
    const pathFileName = path.split('/').pop();
    if (pathFileName && pathFileName.includes('.')) return pathFileName;

    const extension = mime.getExtension(contentType) || 'bin';
    return `${fallbackPrefix}-${index + 1}.${extension}`;
}

function parseAas(aasJson: unknown): { core: aasCore.types.AssetAdministrationShell; json: JsonRecord } {
    const aasOrError = aasCore.jsonization.assetAdministrationShellFromJsonable(
        aasJson as aasCore.jsonization.JsonValue
    );
    if (aasOrError.error !== null) {
        throw new Error(`Failed to parse AAS: ${stringifyUnknown(aasOrError.error)}`);
    }

    const core = aasOrError.mustValue();
    return { core, json: aasCore.jsonization.toJsonable(core) as JsonRecord };
}

function parseSubmodel(submodelJson: unknown): { core: aasCore.types.Submodel; json: JsonRecord } {
    const submodelOrError = aasCore.jsonization.submodelFromJsonable(submodelJson as aasCore.jsonization.JsonValue);
    if (submodelOrError.error !== null) {
        throw new Error(`Failed to parse Submodel: ${stringifyUnknown(submodelOrError.error)}`);
    }

    const core = submodelOrError.mustValue();
    return { core, json: aasCore.jsonization.toJsonable(core) as JsonRecord };
}

function parseConceptDescription(cdJson: unknown): { core: aasCore.types.ConceptDescription; json: JsonRecord } {
    const cdOrError = aasCore.jsonization.conceptDescriptionFromJsonable(cdJson as aasCore.jsonization.JsonValue);
    if (cdOrError.error !== null) {
        throw new Error(`Failed to parse ConceptDescription: ${stringifyUnknown(cdOrError.error)}`);
    }

    const core = cdOrError.mustValue();
    return { core, json: aasCore.jsonization.toJsonable(core) as JsonRecord };
}

function collectAttachmentUploads(
    submodel: JsonRecord,
    supplementaryMap: Map<string, Part>,
    determineContentType: (file: unknown, fallbackType?: string) => string,
    warnings: string[]
): AttachmentUpload[] {
    const uploads: AttachmentUpload[] = [];
    const submodelId = asString(submodel.id).trim();
    if (submodelId === '') return uploads;

    const visited = new WeakSet<object>();

    const visit = (node: unknown, idShortPath: string[]): void => {
        if (!node || typeof node !== 'object') return;
        if (visited.has(node as object)) return;
        visited.add(node as object);

        if (Array.isArray(node)) {
            for (const item of node) visit(item, idShortPath);
            return;
        }

        const record = asRecord(node);
        if (!record) return;

        const modelType = asString(record.modelType).trim();
        const idShort = asString(record.idShort).trim();

        let nextPath = idShortPath;
        if (modelType !== '' && modelType !== 'Submodel' && idShort !== '') {
            nextPath = [...idShortPath, idShort];
        }

        if (modelType === 'File') {
            const fileValue = asString(record.value).trim();
            if (fileValue === '') return;

            if (isExternalHttpUrl(fileValue)) {
                warnings.push(`Skipped external file URL '${fileValue}' in Submodel '${submodelId}'.`);
                return;
            }

            if (nextPath.length === 0) {
                warnings.push(`Skipped file attachment without idShort path in Submodel '${submodelId}'.`);
                return;
            }

            const part = pickSupplementaryPart(fileValue, supplementaryMap);
            if (!part) {
                warnings.push(`Attachment part not found for '${fileValue}' in Submodel '${submodelId}'.`);
                return;
            }

            const contentType = determineContentType(record, part.ContentType || 'application/octet-stream');
            uploads.push({
                submodelId,
                idShortPath: nextPath,
                bytes: part.ReadAllBytes(),
                fileName: resolveFileName(fileValue, idShort || 'file', uploads.length, contentType),
                contentType,
            });
        }

        for (const value of Object.values(record)) {
            visit(value, nextPath);
        }
    };

    visit(submodel, []);

    return uploads;
}

function resolveThumbnail(thumbnailPart: Part | null): ThumbnailUpload | null {
    if (!thumbnailPart) return null;

    const contentType = thumbnailPart.ContentType || 'application/octet-stream';
    const pathFileName = thumbnailPart.URI.pathname.split('/').pop() || '';
    const extension = mime.getExtension(contentType) || 'bin';
    const fileName = pathFileName && pathFileName.includes('.') ? pathFileName : `thumbnail.${extension}`;

    return {
        bytes: thumbnailPart.ReadAllBytes(),
        fileName,
        contentType,
    };
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
    const normalizedBytes = Uint8Array.from(bytes);
    return normalizedBytes.buffer;
}

export function buildAttachmentSmePath(smEndpoint: string, idShortPath: string[]): string {
    const encodedPath = idShortPath.map((segment) => encodeURIComponent(segment)).join('.');
    return `${smEndpoint}/submodel-elements/${encodedPath}`;
}

export function useAASXImport(): {
    importAasxFileClient: (file: File) => Promise<ClientAASXImportResult>;
    importEnvironmentFileClient: (file: File) => Promise<ClientAASXImportResult>;
} {
    const { postAas, putAas, putThumbnail, getAasEndpointById } = useAASRepositoryClient();
    const { postSubmodel, putSubmodel, putAttachmentFile, getSmEndpointById } = useSMRepositoryClient();
    const { postConceptDescription, putConceptDescription } = useCDRepositoryClient();
    const { determineContentType } = useSMEFile();

    function parseEnvironmentText(environmentText: string, sourceLabel: string): JsonRecord {
        const trimmedText = environmentText.trim();
        if (trimmedText === '') {
            throw new Error(`Environment content in '${sourceLabel}' is empty.`);
        }

        try {
            const parsedJson = JSON.parse(trimmedText);
            const environment = asRecord(parsedJson);
            if (!environment) {
                throw new Error(`Environment payload in '${sourceLabel}' is not an object.`);
            }

            return environment;
        } catch {
            try {
                const xmlEnvironment = deserializeXml(trimmedText);
                const environment = aasCore.jsonization.toJsonable(xmlEnvironment as unknown as aasCore.types.Class);
                const environmentRecord = asRecord(environment);
                if (!environmentRecord) {
                    throw new Error(`Environment XML payload in '${sourceLabel}' is invalid.`);
                }

                return environmentRecord;
            } catch (xmlError) {
                throw new Error(
                    `Failed to parse environment in '${sourceLabel}' as JSON or XML: ${stringifyUnknown(xmlError)}`,
                    {
                        cause: xmlError,
                    }
                );
            }
        }
    }

    function collectEnvironmentEntries(
        environment: JsonRecord,
        supplementaryMap: Map<string, Part> | null,
        aasById: Map<string, { core: aasCore.types.AssetAdministrationShell; json: JsonRecord }>,
        submodelById: Map<string, { core: aasCore.types.Submodel; json: JsonRecord }>,
        cdById: Map<string, { core: aasCore.types.ConceptDescription; json: JsonRecord }>,
        attachments: AttachmentUpload[],
        warnings: string[]
    ): void {
        for (const aasEntry of asArray(environment.assetAdministrationShells)) {
            const parsedAas = parseAas(aasEntry);
            const aasId = asString(parsedAas.json.id).trim();
            if (aasId !== '') aasById.set(aasId, parsedAas);
        }

        for (const submodelEntry of asArray(environment.submodels)) {
            const parsedSubmodel = parseSubmodel(submodelEntry);
            const submodelId = asString(parsedSubmodel.json.id).trim();
            if (submodelId === '') continue;

            submodelById.set(submodelId, parsedSubmodel);
            if (!supplementaryMap) continue;

            attachments.push(
                ...collectAttachmentUploads(parsedSubmodel.json, supplementaryMap, determineContentType, warnings)
            );
        }

        for (const cdEntry of asArray(environment.conceptDescriptions)) {
            const parsedCd = parseConceptDescription(cdEntry);
            const cdId = asString(parsedCd.json.id).trim();
            if (cdId !== '') cdById.set(cdId, parsedCd);
        }
    }

    async function parsePackage(file: File, warnings: string[]): Promise<ParsedAASX> {
        const bytes = new Uint8Array(await file.arrayBuffer());
        const packaging = NewPackaging();
        const pkg = await packaging.OpenReadFromBytes(bytes);

        try {
            const specs = await pkg.Specs();
            if (specs.length === 0) {
                throw new Error(`No AAS environment spec found in '${file.name}'.`);
            }

            const aasById = new Map<string, { core: aasCore.types.AssetAdministrationShell; json: JsonRecord }>();
            const submodelById = new Map<string, { core: aasCore.types.Submodel; json: JsonRecord }>();
            const cdById = new Map<string, { core: aasCore.types.ConceptDescription; json: JsonRecord }>();
            const attachments: AttachmentUpload[] = [];

            for (const spec of specs) {
                const environment = parseEnvironmentText(spec.ReadAllText(), `${file.name}:${spec.URI.pathname}`);

                const supplementaryParts = await pkg.SupplementariesFor(spec);
                const supplementaryMap = buildSupplementaryMap(supplementaryParts);

                collectEnvironmentEntries(
                    environment,
                    supplementaryMap,
                    aasById,
                    submodelById,
                    cdById,
                    attachments,
                    warnings
                );
            }

            const thumbnail = resolveThumbnail(await pkg.Thumbnail());

            return {
                aasById,
                submodelById,
                cdById,
                attachments,
                thumbnail,
            };
        } finally {
            pkg.Close();
        }
    }

    async function parsePlainEnvironmentFile(file: File): Promise<ParsedAASX> {
        const environmentText = await file.text();
        const environment = parseEnvironmentText(environmentText, file.name);

        const aasById = new Map<string, { core: aasCore.types.AssetAdministrationShell; json: JsonRecord }>();
        const submodelById = new Map<string, { core: aasCore.types.Submodel; json: JsonRecord }>();
        const cdById = new Map<string, { core: aasCore.types.ConceptDescription; json: JsonRecord }>();
        const attachments: AttachmentUpload[] = [];
        const warnings: string[] = [];

        collectEnvironmentEntries(environment, null, aasById, submodelById, cdById, attachments, warnings);

        return {
            aasById,
            submodelById,
            cdById,
            attachments,
            thumbnail: null,
        };
    }

    async function upsertConceptDescription(conceptDescription: aasCore.types.ConceptDescription): Promise<boolean> {
        const created = await postConceptDescription(conceptDescription);
        if (created) return true;
        return await putConceptDescription(conceptDescription);
    }

    async function upsertSubmodel(submodel: aasCore.types.Submodel): Promise<boolean> {
        const created = await postSubmodel(submodel);
        if (created) return true;
        return await putSubmodel(submodel);
    }

    async function upsertAas(aas: aasCore.types.AssetAdministrationShell): Promise<boolean> {
        const created = await postAas(aas);
        if (created) return true;
        return await putAas(aas);
    }

    async function importParsedPackage(parsedPackage: ParsedAASX, warnings: string[]): Promise<ClientAASXImportResult> {
        for (const { core: conceptDescription, json } of parsedPackage.cdById.values()) {
            const success = await upsertConceptDescription(conceptDescription);
            if (!success) {
                warnings.push(`Failed to create or update Concept Description '${asString(json.id)}'.`);
            }
        }

        for (const { core: submodel, json } of parsedPackage.submodelById.values()) {
            const success = await upsertSubmodel(submodel);
            if (!success) {
                warnings.push(`Failed to create or update Submodel '${asString(json.id)}'.`);
            }
        }

        const importedAasIds: string[] = [];
        for (const { core: aas, json } of parsedPackage.aasById.values()) {
            const success = await upsertAas(aas);
            if (success) {
                importedAasIds.push(asString(json.id));
            } else {
                warnings.push(`Failed to create or update AAS '${asString(json.id)}'.`);
            }
        }

        for (const attachment of parsedPackage.attachments) {
            const smEndpoint = getSmEndpointById(attachment.submodelId);
            if (!smEndpoint || smEndpoint.trim() === '') {
                warnings.push(
                    `Skipped attachment upload: no Submodel endpoint available for '${attachment.submodelId}'.`
                );
                continue;
            }

            const smePath = buildAttachmentSmePath(smEndpoint, attachment.idShortPath);
            const attachmentFile = new File([toArrayBuffer(attachment.bytes)], attachment.fileName, {
                type: attachment.contentType,
            });

            const success = await putAttachmentFile(attachmentFile, smePath);
            if (!success) {
                warnings.push(
                    `Failed to upload attachment for Submodel '${attachment.submodelId}' at '${attachment.idShortPath.join('/')}'.`
                );
            }
        }

        if (parsedPackage.thumbnail && importedAasIds.length > 0) {
            const thumbnailFile = new File(
                [toArrayBuffer(parsedPackage.thumbnail.bytes)],
                parsedPackage.thumbnail.fileName,
                {
                    type: parsedPackage.thumbnail.contentType,
                }
            );

            for (const aasId of importedAasIds) {
                if (!aasId || aasId.trim() === '') continue;

                const aasEndpoint = getAasEndpointById(aasId);
                if (aasEndpoint.trim() === '') {
                    warnings.push(`Skipped thumbnail upload: no AAS endpoint available for '${aasId}'.`);
                    continue;
                }

                const success = await putThumbnail(thumbnailFile, aasId);
                if (!success) {
                    warnings.push(`Failed to upload thumbnail for AAS '${aasId}'.`);
                }
            }
        }

        const importedAas = Array.from(parsedPackage.aasById.values())
            .map((entry) => entry.json)
            .filter(hasKeys);
        const importedSubmodels = Array.from(parsedPackage.submodelById.values())
            .map((entry) => entry.json)
            .filter(hasKeys);
        const importedConceptDescriptions = Array.from(parsedPackage.cdById.values())
            .map((entry) => entry.json)
            .filter(hasKeys);

        return {
            importedAas,
            importedSubmodels,
            importedConceptDescriptions,
            importedAasIds,
            warnings,
        };
    }

    async function importAasxFileClient(file: File): Promise<ClientAASXImportResult> {
        const warnings: string[] = [];
        const parsedPackage = await parsePackage(file, warnings);
        return await importParsedPackage(parsedPackage, warnings);
    }

    async function importEnvironmentFileClient(file: File): Promise<ClientAASXImportResult> {
        const warnings: string[] = [];
        const parsedPackage = await parsePlainEnvironmentFile(file);
        return await importParsedPackage(parsedPackage, warnings);
    }

    return {
        importAasxFileClient,
        importEnvironmentFileClient,
    };
}
