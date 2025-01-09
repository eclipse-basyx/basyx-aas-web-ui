import { useAASStore } from '@/store/AASDataStore';
import { formatDate } from '@/utils/DateUtils';
import { useSMRepositoryClient } from './Client/SMRepositoryClient';

export function useSMHandling() {
    // Composables
    const smRepoClient = useSMRepositoryClient();

    // Stores
    const aasStore = useAASStore();

    // Fetch and dispatch Submodel
    async function fetchAndDispatchSm(smEndpoint: string): Promise<void> {
        // console.log('fetchAndDispatchSm()', smEndpoint);

        if (smEndpoint.trim() === '') return;

        const sm = await smRepoClient.fetchSm(smEndpoint);
        sm.timestamp = formatDate(new Date());
        sm.path = smEndpoint;
        sm.isActive = true;

        aasStore.dispatchSelectedNode(sm);
    }

    // Fetch and dispatch Submodel by ID
    async function fetchAndDispatchSmById(submodelId: string): Promise<void> {
        // console.log('fetchAndDispatchSmById()', submodelId);

        if (submodelId.trim() === '') return;

        const submodel = await smRepoClient.fetchSmById(submodelId);
        // console.log('fetchAndDispatchSmById()', submodelId, 'Submodel:', submodel);

        aasStore.dispatchSelectedNode(submodel);
    }

    return {
        fetchAndDispatchSm,
        fetchAndDispatchSmById,
    };
}
