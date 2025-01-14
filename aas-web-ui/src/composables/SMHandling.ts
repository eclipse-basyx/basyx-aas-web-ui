import { useSMRepositoryClient } from '@/composables/Client/SMRepositoryClient';
import { useConceptDescriptionHandling } from '@/composables/ConceptDescriptionHandling';
import { useAASStore } from '@/store/AASDataStore';
import { formatDate } from '@/utils/DateUtils';
import { extractEndpointHref } from '@/utils/DescriptorUtils';
import { useSMRegistryClient } from './Client/SMRegistryClient';

export function useSMHandling() {
    // Composables
    const {
        fetchSmDescriptorById: fetchSmDescriptorByIdFromRegistry,
        fetchSmDescriptorList: fetchSmDescriptorListFromRegistry,
    } = useSMRegistryClient();
    const {
        fetchSmById: fetchSmByIdFromRepo,
        fetchSm: fetchSmFromRepo,
        fetchSme: fetchSmeFromRepo,
    } = useSMRepositoryClient();
    const { getConceptDescriptions } = useConceptDescriptionHandling();

    // Stores
    const aasStore = useAASStore();

    /**
     * Fetches a Submodel (SM) by the provided SM endpoint
     * and dispatches it to the AAS store.
     *
     * @param {string} smEndpoint - The endpoint URL of the SM to fetch.
     */
    async function fetchAndDispatchSm(smEndpoint: string, withConceptDescriptions = false): Promise<void> {
        smEndpoint = smEndpoint.trim();

        if (smEndpoint === '') return;

        const smOrSme = await fetchSm(smEndpoint, withConceptDescriptions);

        if (!smOrSme || Object.keys(smOrSme).length === 0) return;

        smOrSme.isActive = true;

        aasStore.dispatchSelectedNode(smOrSme);
    }

    /**
     * Fetches a Submodel (SM) by the provided SM ID
     * and dispatches it to the AAS store.
     *
     * @param {string} smId - The ID of the SM to fetch.
     */
    async function fetchAndDispatchSmById(smId: string, withConceptDescriptions = false): Promise<void> {
        smId = smId.trim();

        if (smId === '') return;

        const sm = await fetchSmById(smId, withConceptDescriptions);

        if (!sm || Object.keys(sm).length === 0) return;

        sm.isActive = true;

        aasStore.dispatchSelectedNode(sm);
    }

    /**
     * Fetches a list of all available Submodel (SM) Descriptors.
     *
     * @returns {Promise<Array<any>>} A promise that resolves to an array of SM Descriptors.
     * An empty array is returned if the request fails or no SM Descriptors are found.
     */
    async function fetchSmDescriptorList(): Promise<Array<any>> {
        const failResponse = [] as Array<any>;

        let smDescriptors = await fetchSmDescriptorListFromRegistry();

        if (!smDescriptors || !Array.isArray(smDescriptors) || smDescriptors.length === 0) return failResponse;

        smDescriptors = smDescriptors.map((smDescriptor: any) => {
            smDescriptor.timestamp = formatDate(new Date());
            return smDescriptor;
        });

        return smDescriptors;
    }

    /**
     * Fetches an Submodel (SM) Descriptor by the provided SM ID.
     *
     * @param {string} smId - The ID of the SM Descriptor to fetch.
     */
    async function fetchSmDescriptor(smId: string): Promise<any> {
        const failResponse = {};

        smId = smId.trim();

        if (smId === '') return failResponse;

        const smDescriptor = await fetchSmDescriptorByIdFromRegistry(smId);

        if (!smDescriptor || Object.keys(smDescriptor).length === 0) {
            console.warn('Fetched empty AAS Descriptor');
            return failResponse;
        }

        smDescriptor.timestamp = formatDate(new Date());

        return smDescriptor;
    }

    /**
     * Fetches a Submodel (SM) by the provided SM endpoint.
     *
     * @param {string} smEndpoint - The endpoint URL of the SM to fetch.
     */
    async function fetchSm(smEndpoint: string, withConceptDescriptions = false): Promise<any> {
        const failResponse = {};

        smEndpoint = smEndpoint.trim();

        if (smEndpoint === '') return failResponse;

        let smOrSme = {} as any;
        if (smEndpoint.includes('/submodel-elements/')) {
            // smEndoint seems to be an SME endpoint
            smOrSme = await fetchSmeFromRepo(smEndpoint);

            // Note usage of fetchSme() (SMHandling) not possible
            // Reciprocal import of SMHandling/SMEHandling leads to error "Maximum call stack size exceeded"
        } else {
            smOrSme = await fetchSmFromRepo(smEndpoint);
        }

        if (!smOrSme || Object.keys(smOrSme).length === 0) {
            console.warn('Fetched empty SM/SME');
            return failResponse;
        }

        smOrSme.timestamp = formatDate(new Date());
        smOrSme.path = smEndpoint;

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

        smId = smId.trim();

        if (smId === '') return failResponse;

        const sm = await fetchSmByIdFromRepo(smId);

        if (!sm || Object.keys(sm).length === 0) {
            console.warn('Fetched empty SM');
            return failResponse;
        }

        const smEndpoint = extractEndpointHref(sm, 'SUBMODEL-3.0');

        sm.timestamp = formatDate(new Date());
        sm.path = smEndpoint;

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

        smId = smId.trim();

        if (smId === '') return failResponse;

        const smDescriptor = await fetchSmDescriptorByIdFromRegistry(smId);
        const smEndpoint = getSmEndpoint(smDescriptor);

        return smEndpoint;
    }

    /**
     * Retrieves the Submodel (SM) endpoint URL of an SM object.
     *
     * @param {string} sm - The ID of the SM to retrieve the endpoint for.
     */
    function getSmEndpoint(sm: any): string {
        const failResponse = '';

        if (!sm || Object.keys(sm).length === 0 || !sm.id || sm.id.trim() === '') return failResponse;

        return extractEndpointHref(sm, 'SUBMODEL-3.0');
    }

    return {
        fetchAndDispatchSm,
        fetchAndDispatchSmById,
        fetchSmDescriptorList,
        fetchSmDescriptor,
        fetchSm,
        fetchSmById,
        getSmEndpoint,
        getSmEndpointById,
    };
}
