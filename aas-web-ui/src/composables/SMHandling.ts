import { useSMRegistryClient } from '@/composables/Client/SMRegistryClient';
import { useSMRepositoryClient } from '@/composables/Client/SMRepositoryClient';
import { useConceptDescriptionHandling } from '@/composables/ConceptDescriptionHandling';
import { useAASStore } from '@/store/AASDataStore';
import { formatDate } from '@/utils/DateUtils';
import { extractEndpointHref } from '@/utils/DescriptorUtils';

export function useSMHandling() {
    // Composables
    const { fetchSmDescriptorById } = useSMRegistryClient();
    const { fetchSm, fetchSme } = useSMRepositoryClient();
    const { getConceptDescriptions } = useConceptDescriptionHandling();

    // Stores
    const aasStore = useAASStore();

    // Fetch and dispatch SME
    async function fetchAndDispatchSm(smEndpoint: string, withConceptDescriptions = false): Promise<void> {
        // console.log('fetchAndDispatchSm()', smEndpoint);

        smEndpoint = smEndpoint.trim();

        if (smEndpoint === '') return;

        let smOrSme = {} as any;
        if (smEndpoint.includes('/submodel-elements/')) {
            // smEndoint seems to be an SME endpoint
            smOrSme = await fetchSme(smEndpoint);

            // Note usage of fetchAndDispatchSme() (SMHandling) not possible
            // Reciprocal import of SMHandling/SMEHandling leads to error "Maximum call stack size exceeded"
        } else {
            smOrSme = await fetchSm(smEndpoint);
        }

        if (!smOrSme || Object.keys(smOrSme).length === 0) {
            console.warn('Fetched empty SM/SME');
            aasStore.dispatchSelectedNode({});
            return;
        }

        smOrSme.timestamp = formatDate(new Date());
        smOrSme.path = smEndpoint;
        smOrSme.isActive = true;

        if (withConceptDescriptions) {
            smOrSme.conceptDescriptions = await getConceptDescriptions(smOrSme.value);
        }

        aasStore.dispatchSelectedNode(smOrSme);
    }

    async function getEndpointById(smId: string): Promise<string> {
        const failResponse = '';

        if (smId.trim() === '') return failResponse;

        const smDescriptor = await fetchSmDescriptorById(smId);

        return getEndpoint(smDescriptor);
    }

    async function getEndpoint(sm: any): Promise<string> {
        const failResponse = '';

        if (!sm || Object.keys(sm).length === 0 || !sm.id || sm.id.trim() === '') return failResponse;

        return extractEndpointHref(sm, 'SUBMODEL-3.0');
    }

    return { fetchAndDispatchSm, getEndpointById, getEndpoint };
}
