import { useAASStore } from '@/store/AASDataStore';
import { formatDate } from '@/utils/DateUtils';
import { useSMRepositoryClient } from './Client/SMRepositoryClient';

export function useSMEHandling(): any {
    // Fetch and dispatch SME
    async function fetchAndDispatchSme(submodelElementPath: string): Promise<void> {
        // console.log('fetchAndDispatchSme()', submodelElementPath);

        // Composables
        const smRepoClient = useSMRepositoryClient();

        // Stores
        const aasStore = useAASStore();

        if (submodelElementPath.trim() === '') return;

        const sme = await smRepoClient.fetchSme(submodelElementPath);
        sme.timestamp = formatDate(new Date());
        sme.path = submodelElementPath;
        sme.isActive = true;

        aasStore.dispatchNode(sme);
    }

    return { fetchAndDispatchSme };
}
