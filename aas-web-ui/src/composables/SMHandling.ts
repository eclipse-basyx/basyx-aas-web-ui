import { useSMRepositoryClient } from '@/composables/Client/SMRepositoryClient';
import { useConceptDescriptionHandling } from '@/composables/ConceptDescriptionHandling';
import { useAASStore } from '@/store/AASDataStore';
import { formatDate } from '@/utils/DateUtils';
import { extractEndpointHref } from '@/utils/DescriptorUtils';
import { useSMRegistryClient } from './Client/SMRegistryClient';

export function useSMHandling() {
    // Composables
    const { fetchSmDescriptorById: fetchSmDescriptorByIdFromRegistry } = useSMRegistryClient();
    const {
        fetchSmById: fetchSmByIdFromRepo,
        fetchSm: fetchSmFromRepo,
        fetchSme: fetchSmeFromRepo,
    } = useSMRepositoryClient();
    const { getConceptDescriptions } = useConceptDescriptionHandling();

    // Stores
    const aasStore = useAASStore();

    // Fetch and dispatch SME
    async function fetchAndDispatchSm(smEndpoint: string, withConceptDescriptions = false): Promise<void> {
        smEndpoint = smEndpoint.trim();

        if (smEndpoint === '') return;

        const smOrSme = await fetchSm(smEndpoint, withConceptDescriptions);

        aasStore.dispatchSelectedNode(smOrSme);
    }

    // Fetch and dispatch SME
    async function fetchAndDispatchSmById(smId: string, withConceptDescriptions = false): Promise<void> {
        smId = smId.trim();

        if (smId === '') return;

        const sm = await fetchSmById(smId, withConceptDescriptions);

        aasStore.dispatchSelectedNode(sm);
    }

    // Fetch SME
    async function fetchSm(smEndpoint: string, withConceptDescriptions = false): Promise<any> {
        const failResponse = {};

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

    // Fetch SME
    async function fetchSmById(smId: string, withConceptDescriptions = false): Promise<any> {
        const failResponse = {};

        smId = smId.trim();

        if (smId === '') return failResponse;

        const sm = await fetchSmByIdFromRepo(smId);

        if (!sm || Object.keys(sm).length === 0) {
            console.warn('Fetched empty SM');
            aasStore.dispatchSelectedNode({});
            return failResponse;
        }

        const smEndpoint = extractEndpointHref(sm, 'SUBMODEL-3.0');

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

    async function getSmEndpointById(smId: string): Promise<string> {
        const failResponse = '';

        smId = smId.trim();

        if (smId === '') return failResponse;

        const smDescriptor = await fetchSmDescriptorByIdFromRegistry(smId);
        const smEndpoint = getSmEndpoint(smDescriptor);

        return smEndpoint;
    }

    function getSmEndpoint(sm: any): string {
        const failResponse = '';

        if (!sm || Object.keys(sm).length === 0 || !sm.id || sm.id.trim() === '') return failResponse;

        return extractEndpointHref(sm, 'SUBMODEL-3.0');
    }

    return { fetchAndDispatchSm, fetchAndDispatchSmById, fetchSm, fetchSmById, getSmEndpoint, getSmEndpointById };
}
