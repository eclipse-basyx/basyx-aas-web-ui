import { useAASStore } from '@/store/AASDataStore';
import { formatDate } from '@/utils/DateUtils';
import { useSMRepositoryClient } from './Client/SMRepositoryClient';

// Composables
const smRepoClient = useSMRepositoryClient();

// Stores
const aasStore = useAASStore();

export function useSMHandling(): any {
    // Fetch and dispatch SME
    async function fetchAndDispatchSm(smEndpoint: string): Promise<void> {
        // console.log('fetchAndDispatchSm()', smEndpoint);

        if (smEndpoint.trim() === '') return;

        const sm = await smRepoClient.fetchSm(smEndpoint);
        sm.timestamp = formatDate(new Date());
        sm.path = smEndpoint;
        sm.isActive = true;

        aasStore.dispatchNode(sm);
    }

    return { fetchAndDispatchSm };
}
