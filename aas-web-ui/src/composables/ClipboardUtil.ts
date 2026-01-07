import type { JsonValue } from '@aas-core-works/aas-core3.0-typescript/jsonization';
import { jsonization, types as aasTypes } from '@aas-core-works/aas-core3.0-typescript';
import { useRoute, useRouter } from 'vue-router';
import { useAASRepositoryClient } from '@/composables/Client/AASRepositoryClient';
import { useSMRepositoryClient } from '@/composables/Client/SMRepositoryClient';
import { useIDUtils } from '@/composables/IDUtils';
import { useAASStore } from '@/store/AASDataStore';
import { useClipboardStore } from '@/store/ClipboardStore';
import { useInfrastructureStore } from '@/store/InfrastructureStore';
import { useNavigationStore } from '@/store/NavigationStore';
import { base64Decode, base64Encode } from '@/utils/EncodeDecodeUtils';

export function useClipboardUtil() {
    // Vue Router
    const route = useRoute();
    const router = useRouter();

    // Store
    const aasStore = useAASStore();
    const clipboardStore = useClipboardStore();
    const navigationStore = useNavigationStore();
    const infrastructureStore = useInfrastructureStore();

    // composables
    const { postSubmodel, postSubmodelElement } = useSMRepositoryClient();
    const { putAas } = useAASRepositoryClient();
    const { generateIri } = useIDUtils();

    // Computed properties
    const selectedAAS = computed(() => aasStore.getSelectedAAS);
    const submodelRepoUrl = computed(() => infrastructureStore.getSubmodelRepoURL);

    function copyToClipboard(value: string, valueName: string, iconReference: { value: string }): void {
        if (!value) return;

        iconReference.value = 'mdi-check';

        // copy value to clipboard
        try {
            navigator.clipboard.writeText(value);
        } catch {
            navigationStore.dispatchSnackbar({
                status: true,
                timeout: 4000,
                color: 'false',
                btnColor: 'buttonText',
                text: 'Failed to copy JSON to Clipboard.',
            });
        }

        // set the clipboard tooltip to false after 1.5 seconds
        setTimeout(() => {
            iconReference.value = 'mdi-clipboard-file-outline';
        }, 2000);

        // open Snackbar to inform the user that the path was copied to the clipboard
        navigationStore.dispatchSnackbar({
            status: true,
            timeout: 2000,
            color: 'success',
            btnColor: 'buttonText',
            text: (valueName.trim() !== '' ? valueName : "'" + value + "'") + ' copied to Clipboard.',
        });
    }

    function copyJsonToClipboard(value: unknown, valueName: string, iconReference: { value: string }): void {
        if (!value) return;

        // Clean the JSON object recursively
        const cleanedValue = cleanObjectRecursively(value);

        iconReference.value = 'mdi-check';

        // copy value to clipboard
        try {
            navigator.clipboard.writeText(JSON.stringify(cleanedValue, null, 2));
        } catch {
            navigationStore.dispatchSnackbar({
                status: true,
                timeout: 4000,
                color: 'false',
                btnColor: 'buttonText',
                text: 'Failed to copy JSON to Clipboard.',
            });
        }

        // set the clipboard tooltip to false after 1.5 seconds
        setTimeout(() => {
            iconReference.value = 'mdi-clipboard-text-outline';
        }, 2000);

        // open Snackbar to inform the user that the path was copied to the clipboard
        navigationStore.dispatchSnackbar({
            status: true,
            timeout: 2000,
            color: 'success',
            btnColor: 'buttonText',
            text:
                (valueName.trim() !== ''
                    ? valueName
                    : typeof cleanedValue === 'object' && cleanedValue !== null && 'modelType' in cleanedValue
                      ? (cleanedValue as { modelType?: string }).modelType || 'JSON'
                      : 'JSON') + ' copied to Clipboard.',
        });
    }

    function pasteElement(item?: unknown): void {
        const clipboardElement = clipboardStore.getClipboardContent() as any;

        if (!clipboardElement) return;

        if (clipboardElement.modelType === 'Submodel') {
            insertSubmodel(clipboardElement);
        } else {
            insertSubmodelElement(clipboardElement, item);
        }
    }

    async function insertSubmodel(json: JsonValue): Promise<void> {
        // Parse JSON to Submodel
        const instanceOrError = jsonization.submodelFromJsonable(json);
        if (instanceOrError.error !== null) {
            navigationStore.dispatchSnackbar({
                status: true,
                timeout: 4000,
                color: 'error',
                btnColor: 'buttonText',
                text: 'Error parsing Submodel: ' + instanceOrError.error,
            });
            return;
        }
        const submodel = instanceOrError.mustValue();

        // Create new unique ID for the Submodel
        submodel.id = generateIri('Submodel');

        // Create Submodel
        await postSubmodel(submodel);
        // Add Submodel Reference to AAS
        await addSubmodelReferenceToAas(submodel);
        // Fetch and dispatch Submodel
        const query = structuredClone(route.query);
        query.path = submodelRepoUrl.value + '/' + base64Encode(submodel.id);
        router.push({ query: query });

        navigationStore.dispatchTriggerTreeviewReload();
    }

    async function insertSubmodelElement(json: JsonValue, parentElement: any): Promise<void> {
        if (!parentElement) return;

        const instanceOrError = jsonization.submodelElementFromJsonable(json);
        if (instanceOrError.error !== null) {
            navigationStore.dispatchSnackbar({
                status: true,
                timeout: 4000,
                color: 'error',
                btnColor: 'buttonText',
                text: 'Error parsing SubmodelElement: ' + instanceOrError.error,
            });
            return;
        }
        const submodelElement = instanceOrError.mustValue();

        // In case the SubmodelElement has an idShort, add "_copy" to the end
        if (submodelElement.idShort) {
            submodelElement.idShort += '_copy';
        }

        if (parentElement.modelType === 'Submodel') {
            // Create the property on the parent Submodel
            await postSubmodelElement(submodelElement, parentElement.id);

            // Navigate to the new property
            const query = structuredClone(route.query);
            query.path = parentElement.path + '/submodel-elements/' + submodelElement.idShort;
            router.push({
                query: query,
            });
        } else {
            // Extract the submodel ID and the idShortPath from the parentElement path
            const splitted = parentElement.path.split('/submodel-elements/');
            const submodelId = base64Decode(splitted[0].split('/submodels/')[1]);
            const idShortPath = splitted[1];

            // Create the property on the parent element
            await postSubmodelElement(submodelElement, submodelId, idShortPath);

            // Navigate to the new property
            if (parentElement.modelType === 'SubmodelElementCollection') {
                const query = structuredClone(route.query);
                query.path = parentElement.path + '.' + submodelElement.idShort;
                router.push({
                    query: query,
                });
            }
        }

        navigationStore.dispatchTriggerTreeviewReload();
    }

    async function addSubmodelReferenceToAas(submodel: aasTypes.Submodel): Promise<void> {
        if (selectedAAS.value === null) return;
        const localAAS = { ...selectedAAS.value };
        const instanceOrError = jsonization.assetAdministrationShellFromJsonable(localAAS);
        if (instanceOrError.error !== null) {
            console.error('Error parsing AAS: ', instanceOrError.error);
            return;
        }
        const aas = instanceOrError.mustValue();
        // Create new SubmodelReference
        const submodelReference = new aasTypes.Reference(aasTypes.ReferenceTypes.ExternalReference, [
            new aasTypes.Key(aasTypes.KeyTypes.Submodel, submodel.id),
        ]);
        // Check if Submodels are null
        if (aas.submodels === null || aas.submodels === undefined) {
            aas.submodels = [submodelReference];
            localAAS.submodels = [jsonization.toJsonable(submodelReference)];
        } else {
            aas.submodels.push(submodelReference);
            localAAS.submodels.push(jsonization.toJsonable(submodelReference));
        }
        await putAas(aas);

        // Update AAS in Store
        aasStore.dispatchSelectedAAS(localAAS);
    }

    function cleanObjectRecursively(obj: unknown): unknown {
        if (obj === null || obj === undefined) {
            return obj;
        }

        // If it's an array, recursively clean each element
        if (Array.isArray(obj)) {
            return obj.map((item) => cleanObjectRecursively(item));
        }

        // If it's an object, create a copy and recursively clean it
        if (typeof obj === 'object') {
            const cleaned = { ...(obj as Record<string, unknown>) };

            // Remove tree-specific properties that were added by prepareForTree
            delete cleaned.showChildren;
            delete cleaned.parent;
            delete cleaned.path;
            delete cleaned.timestamp;
            delete cleaned.listIndex;
            delete cleaned.conceptDescriptions;
            delete cleaned.idLower;
            delete cleaned.idShortLower;
            delete cleaned.nameLower;
            delete cleaned.descLower;
            delete cleaned.endpoints;

            // Remove id property for all elements except Submodels
            if (cleaned.modelType !== 'Submodel') {
                delete cleaned.id;
            }

            // Restore original structure based on modelType
            if (cleaned.modelType === 'Submodel' && Array.isArray(cleaned.children)) {
                // For Submodels, children should go back to submodelElements
                cleaned.submodelElements = cleanObjectRecursively(cleaned.children);
                delete cleaned.children;
            } else if (
                ['SubmodelElementCollection', 'SubmodelElementList'].includes(cleaned.modelType as string) &&
                Array.isArray(cleaned.children)
            ) {
                // For Collections and Lists, children should go back to value
                cleaned.value = cleanObjectRecursively(cleaned.children);
                delete cleaned.children;
            } else if (cleaned.modelType === 'Entity' && Array.isArray(cleaned.children)) {
                // For Entities, children should go back to statements
                cleaned.statements = cleanObjectRecursively(cleaned.children);
                delete cleaned.children;
            } else {
                // Remove children property if it exists but doesn't match any known pattern
                delete cleaned.children;
            }

            // Recursively clean all remaining properties
            for (const key in cleaned) {
                if (Object.prototype.hasOwnProperty.call(cleaned, key)) {
                    cleaned[key] = cleanObjectRecursively(cleaned[key]);
                }
            }

            return cleaned;
        }

        // For primitive types, return as is
        return obj;
    }

    return {
        copyToClipboard,
        copyJsonToClipboard,
        cleanObjectRecursively,
        pasteElement,
    };
}
