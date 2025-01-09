import { useAASStore } from '@/store/AASDataStore';
import { formatDate } from '@/utils/DateUtils';
import { useSMRepositoryClient } from './Client/SMRepositoryClient';

export function useSMEHandling(): any {
    // Composables
    const smRepoClient = useSMRepositoryClient();

    // Stores
    const aasStore = useAASStore();

    // Fetch and dispatch SME
    async function fetchAndDispatchSme(submodelElementPath: string): Promise<void> {
        console.log('fetchAndDispatchSme()', submodelElementPath);

        if (submodelElementPath.trim() === '') return;

        const sme = await smRepoClient.fetchSme(submodelElementPath);
        sme.timestamp = formatDate(new Date());
        sme.path = submodelElementPath;
        sme.isActive = true;

        console.log('fetchAndDispatchSme()', 'sme', sme);

        aasStore.dispatchSelectedNode(sme);
    }

    return { fetchAndDispatchSme };
}
