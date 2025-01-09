import { useAASStore } from '@/store/AASDataStore';
import { formatDate } from '@/utils/DateUtils';
import { useSMRepositoryClient } from './Client/SMRepositoryClient';

// Composables
const smRepoClient = useSMRepositoryClient();

// Stores
const aasStore = useAASStore();

export function useSMEHandling(): any {
    // Fetch and dispatch SME
    async function fetchAndDispatchSme(submodelElementPath: string): Promise<void> {
        // console.log('fetchAndDispatchSme()', submodelElementPath);

        if (submodelElementPath.trim() === '') return;

        const sme = await smRepoClient.fetchSme(submodelElementPath);
        sme.timestamp = formatDate(new Date());
        sme.path = submodelElementPath;
        sme.isActive = true;

        aasStore.dispatchNode(sme);
    }

    return { fetchAndDispatchSme };
}
