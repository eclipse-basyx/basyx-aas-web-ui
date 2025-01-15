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
        const failResponse = {};

        aasEndpoint = aasEndpoint.trim();

        if (aasEndpoint === '') return failResponse;

        const aas = await fetchAas(aasEndpoint);

        aasStore.dispatchSelectedAAS(aas);

        return aas;
    }

    // Fetch and dispatch AAS by ID
    async function fetchAndDispatchAasById(aasId: string): Promise<any> {
        const failResponse = {};

        aasId = aasId.trim();

        if (aasId === '') return failResponse;

        const aas = await fetchAasById(aasId);

        aasStore.dispatchSelectedAAS(aas);

        return aas;
    }

    // Fetch AAS
    async function fetchAas(aasEndpoint: string): Promise<any> {
        const failResponse = {};

        aasEndpoint = aasEndpoint.trim();

        if (aasEndpoint === '') return failResponse;

        const aas = await fetchAasFromRepo(aasEndpoint);

        if (!aas || Object.keys(aas).length === 0) {
            console.warn('Fetched empty AAS');
        }

        aas.timestamp = formatDate(new Date());
        aas.path = aasEndpoint;
        aas.isActive = true;

        return aas;
    }

    // Fetch AAS
    async function fetchAasById(aasId: string): Promise<any> {
        const failResponse = {};

        aasId = aasId.trim();

        if (aasId === '') return failResponse;

        const aas = await fetchAasByIdFromRepo(aasId);

        if (!aas || Object.keys(aas).length === 0) {
            console.warn('Fetched empty AAS');
            return failResponse;
        }

        const aasEndpoint = extractEndpointHref(aas, 'AAS-3.0');

        aas.timestamp = formatDate(new Date());
        aas.path = aasEndpoint;
        aas.isActive = true;

        return aas;
    }

    return {
        fetchAas,
        fetchAasById,
        fetchAndDispatchAas,
        fetchAndDispatchAasById,
    };
}
