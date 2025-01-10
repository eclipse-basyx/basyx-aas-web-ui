import { useAASStore } from '@/store/AASDataStore';
import { formatDate } from '@/utils/DateUtils';
import { useSMRepositoryClient } from './Client/SMRepositoryClient';

export function useSMHandling() {
    // Composables
    const { fetchSm } = useSMRepositoryClient();

    // Stores
    const aasStore = useAASStore();

    // Fetch and dispatch SME
    async function fetchAndDispatchSm(smEndpoint: string, withConceptDescriptions = false): Promise<void> {
        // console.log('fetchAndDispatchSm()', smEndpoint);

        if (smEndpoint.trim() === '') return;

        const sm = await fetchSm(smEndpoint);
        sm.timestamp = formatDate(new Date());
        sm.path = smEndpoint;
        sm.isActive = true;

        if (withConceptDescriptions) {
            sm.conceptDescriptions = await getConceptDescriptions(selectedNode.value);
        }

        aasStore.dispatchSelectedNode(sm);
    }

    return { fetchAndDispatchSm };
}
