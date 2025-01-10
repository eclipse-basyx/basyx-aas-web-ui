import { useAASStore } from '@/store/AASDataStore';
import { useAASRepositoryClient } from './Client/AASRepositoryClient';

export function useAASHandling() {
    // Composables
    const aasRepoClient = useAASRepositoryClient();

    // Stores
    const aasStore = useAASStore();

    // Fetch and dispatch AAS
    async function fetchAndDispatchAas(aasEndpoint: string): Promise<void> {
        // console.log('fetchAndDispatchAas()', aasEndpoint);

        aasEndpoint = aasEndpoint.trim();

        if (aasEndpoint === '') return;

        const aas = await aasRepoClient.fetchAas(aasEndpoint);
        // console.log('fetchAndDispatchAas()', aasEndpoint, 'aas', aas);

        aasStore.dispatchSelectedAAS(aas);
    }

    // Fetch and dispatch AAS
    async function fetchAndDispatchAasById(aasId: string): Promise<void> {
        // console.log('fetchAndDispatchAasById()', aasId);

        if (aasId.trim() === '') return;

        const aas = await aasRepoClient.fetchAasById(aasId);
        // console.log('fetchAndDispatchAasById()', aasId, 'aas:', aas);

        aasStore.dispatchSelectedAAS(aas);
    }

    return { fetchAndDispatchAas, fetchAndDispatchAasById };
}
