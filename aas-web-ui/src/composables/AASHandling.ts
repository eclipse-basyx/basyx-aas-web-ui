import { useAASStore } from '@/store/AASDataStore';
import { formatDate } from '@/utils/DateUtils';
import { extractEndpointHref } from '@/utils/DescriptorUtils';
import { useAASRepositoryClient } from './Client/AASRepositoryClient';

export function useAASHandling() {
    // Composables
    const { fetchAas: fetchAasFromRepo, fetchAasById: fetchAasByIdFromRepo } = useAASRepositoryClient();

    // Stores
    const aasStore = useAASStore();

    // Fetch and dispatch AAS
    async function fetchAndDispatchAas(aasEndpoint: string): Promise<any> {
        // console.log('fetchAndDispatchAas()', aasEndpoint);

        const aas = await fetchAas(aasEndpoint);

        aasStore.dispatchSelectedAAS(aas);

        return aas;
    }

    // Fetch and dispatch AAS
    async function fetchAndDispatchAasById(aasId: string): Promise<any> {
        // console.log('fetchAndDispatchAasById()', aasId);

        const aas = await fetchAasById(aasId);
        // console.log('fetchAndDispatchAasById()', aasId, 'aas:', aas);

        aasStore.dispatchSelectedAAS(aas);

        return aas;
    }

    // Fetch and dispatch AAS
    async function fetchAas(aasEndpoint: string): Promise<any> {
        // console.log('fetchAndDispatchAas()', aasEndpoint);

        aasEndpoint = aasEndpoint.trim();

        if (aasEndpoint === '') return;

        const aas = await fetchAasFromRepo(aasEndpoint);

        aas.timestamp = formatDate(new Date());
        aas.path = aasEndpoint;
        aas.isActive = true;

        return aas;
    }

    // Fetch and dispatch AAS
    async function fetchAasById(aasId: string): Promise<any> {
        // console.log('fetchAasById()', aasEndpoint);

        aasId = aasId.trim();

        if (aasId === '') return {};

        const aas = await fetchAasByIdFromRepo(aasId);

        aas.timestamp = formatDate(new Date());
        aas.path = extractEndpointHref(aas, 'AAS-3.0');
        aas.isActive = true;

        return aas;
    }

    return { fetchAas, fetchAasById, fetchAndDispatchAas, fetchAndDispatchAasById };
}
