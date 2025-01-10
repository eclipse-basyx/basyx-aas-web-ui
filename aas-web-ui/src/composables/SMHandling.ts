import { useAASStore } from '@/store/AASDataStore';
import { formatDate } from '@/utils/DateUtils';
import { useSMRepositoryClient } from './Client/SMRepositoryClient';
import { useConceptDescriptionHandling } from './ConceptDescriptionHandling';
import { useSMEHandling } from './SMEHandling';

export function useSMHandling() {
    // Composables
    const { fetchSm } = useSMRepositoryClient();
    const { getConceptDescriptions } = useConceptDescriptionHandling();
    const { fetchAndDispatchSme } = useSMEHandling();

    // Stores
    const aasStore = useAASStore();

    // Fetch and dispatch SME
    async function fetchAndDispatchSm(smEndpoint: string, withConceptDescriptions = false): Promise<void> {
        // console.log('fetchAndDispatchSm()', smEndpoint);

        if (smEndpoint.trim() === '') return;

        if (smEndpoint.includes('/submodel-elements/')) {
            // smEndoint seems to be an SME endpoint
            fetchAndDispatchSme(smEndpoint, withConceptDescriptions);
            return;
        }

        const sm = await fetchSm(smEndpoint);
        sm.timestamp = formatDate(new Date());
        sm.path = smEndpoint;
        sm.isActive = true;

        if (withConceptDescriptions) {
            sm.conceptDescriptions = await getConceptDescriptions(sm.value);
        }

        aasStore.dispatchSelectedNode(sm);
    }

    return { fetchAndDispatchSm };
}
