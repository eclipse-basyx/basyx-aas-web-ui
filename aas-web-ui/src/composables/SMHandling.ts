import { useSMRegistryClient } from '@/composables/Client/SMRegistryClient';
import { useSMRepositoryClient } from '@/composables/Client/SMRepositoryClient';
import { useConceptDescriptionHandling } from '@/composables/ConceptDescriptionHandling';
import { useAASStore } from '@/store/AASDataStore';
import { formatDate } from '@/utils/DateUtils';
import { extractEndpointHref } from '@/utils/DescriptorUtils';
import { useIDUtils } from './IDUtils';

export function useSMHandling() {
    // Composables
    const { fetchSmDescriptorById: fetchSmDescriptorByIdFromRegistry } = useSMRegistryClient();
    const {
        fetchSmById: fetchSmByIdFromRepo,
        fetchSm: fetchSmFromRepo,
        fetchSme: fetchSmeFromRepo,
    } = useSMRepositoryClient();
    const { getConceptDescriptions } = useConceptDescriptionHandling();
    const { generateUUIDV4 } = useIDUtils();

    // Stores
    const aasStore = useAASStore();

    /**
     * Fetches a Submodel (SM) by the provided SM endpoint
     * and dispatches it to the AAS store.
     *
     * @param {string} smEndpoint - The endpoint URL of the SM to fetch.
     */
    async function fetchAndDispatchSm(smEndpoint: string, withConceptDescriptions = false): Promise<void> {
        if (!smEndpoint) return;

        smEndpoint = smEndpoint.trim();

        if (smEndpoint === '') return;

        const smOrSme = await fetchSm(smEndpoint, withConceptDescriptions);

        aasStore.dispatchSelectedNode(smOrSme);
    }

    /**
     * Fetches a Submodel (SM) by the provided SM ID
     * and dispatches it to the AAS store.
     *
     * @param {string} smId - The ID of the SM to fetch.
     */
    async function fetchAndDispatchSmById(smId: string, withConceptDescriptions = false): Promise<void> {
        if (!smId) return;

        smId = smId.trim();

        if (smId === '') return;

        const sm = await fetchSmById(smId, withConceptDescriptions);

        aasStore.dispatchSelectedNode(sm);
    }

    /**
     * Fetches a Submodel (SM) by the provided SM endpoint.
     *
     * @param {string} smEndpoint - The endpoint URL of the SM to fetch.
     */
    async function fetchSm(smEndpoint: string, withConceptDescriptions = false): Promise<any> {
        const failResponse = {};

        if (!smEndpoint) return failResponse;

        smEndpoint = smEndpoint.trim();

        if (smEndpoint === '') return failResponse;

        let smOrSme = {} as any;
        if (smEndpoint.includes('/submodel-elements/')) {
            // smEndoint seems to be an SME endpoint
            smOrSme = await fetchSmeFromRepo(smEndpoint);

            // Note usage of fetchAndDispatchSme() (SMHandling) not possible
            // Reciprocal import of SMHandling/SMEHandling leads to error "Maximum call stack size exceeded"
        } else {
            smOrSme = await fetchSmFromRepo(smEndpoint);
        }

        if (!smOrSme || Object.keys(smOrSme).length === 0) {
            console.warn('Fetched empty SM/SME');
            aasStore.dispatchSelectedNode({});
            return failResponse;
        }

        smOrSme.timestamp = formatDate(new Date());
        smOrSme.path = smEndpoint;
        smOrSme.isActive = true;

        if (withConceptDescriptions) {
            smOrSme.conceptDescriptions = await getConceptDescriptions(smOrSme);
        } else {
            smOrSme.conceptDescriptions = [];
        }

        return smOrSme;
    }

    /**
     * Fetches a Submodel (SM) by the provided SM ID.
     *
     * @param {string} smId - The ID of the SM to fetch.
     */
    async function fetchSmById(smId: string, withConceptDescriptions = false): Promise<any> {
        const failResponse = {};

        if (!smId) return failResponse;

        smId = smId.trim();

        if (smId === '') return failResponse;

        const sm = await fetchSmByIdFromRepo(smId);

        if (!sm || Object.keys(sm).length === 0) {
            console.warn('Fetched empty SM');
            aasStore.dispatchSelectedNode({});
            return failResponse;
        }

        const smEndpoint = getSmEndpoint(sm);

        sm.timestamp = formatDate(new Date());
        sm.path = smEndpoint;
        sm.isActive = true;

        if (withConceptDescriptions) {
            sm.conceptDescriptions = await getConceptDescriptions(sm);
        } else {
            sm.conceptDescriptions = [];
        }

        return sm;
    }

    /**
     * Retrieves the Submodel (SM) endpoint URL by its ID.
     *
     * @param {string} aasId - The ID of the AAS to retrieve the endpoint for.
     */
    async function getSmEndpointById(smId: string): Promise<string> {
        const failResponse = '';

        if (!smId) return failResponse;

        smId = smId.trim();

        if (smId === '') return failResponse;

        const smDescriptor = await fetchSmDescriptorByIdFromRegistry(smId);
        const smEndpoint = getSmEndpoint(smDescriptor);

        return smEndpoint || failResponse;
    }

    /**
     * Retrieves the Submodel (SM) endpoint URL of a SM descriptor.
     *
     * @param {string} sm - The SM descriptor to retrieve the endpoint for.
     */
    function getSmEndpoint(smDescriptor: any): string {
        // TODO Replace extractEndpointHref(smDescriptor), 'SUBMODEL-3.0') by getSmEndpoint(smDescriptor) in all components
        const failResponse = '';

        if (
            !smDescriptor ||
            Object.keys(smDescriptor).length === 0 ||
            !smDescriptor.id ||
            smDescriptor.id.trim() === ''
        )
            return failResponse;

        const smEndpoint = extractEndpointHref(smDescriptor, 'SUBMODEL-3.0');

        return smEndpoint || failResponse;
    }

    /**
     * Recursively calculates and sets the paths of SubmodelElements (SMEs) within a given Submodel (SM) or SubmodelElement (SME).
     * The function modifies the `parent` object by:
     * - Setting the `path` property to the constructed string based on the `startPath`.
     * - Assigning a unique `id` to the `parent` using `generateUUIDV4()`.
     *
     * The function handles different types of parent structures:
     * - For **Submodel**, it iterates over `submodelElements` and appends their `idShort` to the path.
     * - For **SubmodelElementCollection**, it processes the items in its `value` array.
     * - For **SubmodelElementList**, it uses array index notation (`[index]`).
     * - For **Entity**, it processes `statements` similarly.
     *
     * @param {any} parent - The parent Submodel or SubmodelElement object to process, which will have its `path` set and potentially modified.
     * @param {string} startPath - The base path string to build upon recursively.
     * @returns {Promise<any>} A promise that resolves with the modified `parent` object, including calculated paths.
     */
    async function calculateSMEPathes(parent: any, startPath: string): Promise<any> {
        parent.path = startPath;
        parent.id = generateUUIDV4();
        // parent.conceptDescriptions = await this.getConceptDescriptions(parent);

        if (parent.submodelElements && parent.submodelElements.length > 0) {
            for (const element of parent.submodelElements) {
                await calculateSMEPathes(element, startPath + '/submodel-elements/' + element.idShort);
            }
        } else if (
            parent.value &&
            Array.isArray(parent.value) &&
            parent.value.length > 0 &&
            parent.modelType == 'SubmodelElementCollection'
        ) {
            for (const element of parent.value) {
                await calculateSMEPathes(element, startPath + '.' + element.idShort);
            }
        } else if (
            parent.value &&
            Array.isArray(parent.value) &&
            parent.value.length > 0 &&
            parent.modelType == 'SubmodelElementList'
        ) {
            for (const [index, element] of parent.value.entries()) {
                await calculateSMEPathes(
                    element,
                    startPath + encodeURIComponent('[') + index + encodeURIComponent(']')
                );
            }
        } else if (
            parent.statements &&
            Array.isArray(parent.statements) &&
            parent.statements.length > 0 &&
            parent.modelType == 'Entity'
        ) {
            for (const element of parent.value) {
                await calculateSMEPathes(element, startPath + '.' + element.idShort);
            }
        }

        return parent;
    }

    return {
        fetchAndDispatchSm,
        fetchAndDispatchSmById,
        fetchSm,
        fetchSmById,
        getSmEndpoint,
        getSmEndpointById,
        calculateSMEPathes,
    };
}
