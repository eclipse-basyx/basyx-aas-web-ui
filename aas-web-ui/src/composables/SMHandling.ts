import { useAASStore } from '@/store/AASDataStore';
import { formatDate } from '@/utils/DateUtils';
import { useSMRepositoryClient } from './Client/SMRepositoryClient';

export function useSMHandling() {
    // Composables
    const smRepoClient = useSMRepositoryClient();

    // Stores
    const aasStore = useAASStore();

    // Fetch and dispatch SME
    async function fetchAndDispatchSm(smEndpoint: string): Promise<void> {
        // console.log('fetchAndDispatchSm()', smEndpoint);

        if (smEndpoint.trim() === '') return;

        const sm = await smRepoClient.fetchSm(smEndpoint);
        sm.timestamp = formatDate(new Date());
        sm.path = smEndpoint;
        sm.isActive = true;

        aasStore.dispatchSelectedNode(sm);
    }

    return { fetchAndDispatchSm };
}
