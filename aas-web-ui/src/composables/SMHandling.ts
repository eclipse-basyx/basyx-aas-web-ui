import { useSMRegistryClient } from '@/composables/Client/SMRegistryClient';
import { useSMRepositoryClient } from '@/composables/Client/SMRepositoryClient';
import { useConceptDescriptionHandling } from '@/composables/ConceptDescriptionHandling';
import { useAASStore } from '@/store/AASDataStore';
import { formatDate } from '@/utils/DateUtils';
import { extractEndpointHref } from '@/utils/DescriptorUtils';

export function useSMHandling() {
    // Stores
    const aasStore = useAASStore();

    // Composables
    const { fetchSmDescriptorById: fetchSmDescriptorByIdFromRegistry } = useSMRegistryClient();
    const {
        fetchSmById: fetchSmByIdFromRepo,
        fetchSm: fetchSmFromRepo,
        fetchSme: fetchSmeFromRepo,
    } = useSMRepositoryClient();
    const { getConceptDescriptions } = useConceptDescriptionHandling();

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

    return { fetchAndDispatchSm, fetchAndDispatchSmById, fetchSm, fetchSmById, getSmEndpoint, getSmEndpointById };
}
