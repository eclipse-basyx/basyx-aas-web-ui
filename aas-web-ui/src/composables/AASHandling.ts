import { useAASRegistryClient } from '@/composables/Client/AASRegistryClient';
import { useAASRepositoryClient } from '@/composables/Client/AASRepositoryClient';
import { useAASStore } from '@/store/AASDataStore';
import { extractEndpointHref } from '@/utils/DescriptorUtils';

export function useAASHandling() {
    // Composables
    const { fetchAasDescriptorById } = useAASRegistryClient();
    const { fetchAas, fetchAasById } = useAASRepositoryClient();

    // Stores
    const aasStore = useAASStore();

    // Fetch and dispatch AAS
    async function fetchAndDispatchAas(aasEndpoint: string): Promise<void> {
        aasEndpoint = aasEndpoint.trim();

        if (aasEndpoint === '') return;

        const aas = await fetchAas(aasEndpoint);
        // console.log('fetchAndDispatchAas()', aasEndpoint, 'aas', aas);

        aasStore.dispatchSelectedAAS(aas);
    }

    // Fetch and dispatch AAS
    async function fetchAndDispatchAasById(aasId: string): Promise<void> {
        aasId = aasId.trim();

        if (aasId === '') return;

        const aas = await fetchAasById(aasId);
        // console.log('fetchAndDispatchAasById()', aasId, 'aas:', aas);

        aasStore.dispatchSelectedAAS(aas);
    }

    async function getEndpointById(aasId: string): Promise<string> {
        const failResponse = '';

        aasId = aasId.trim();

        if (aasId === '') return failResponse;

        const aasDescriptor = await fetchAasDescriptorById(aasId);
        const aasEndpoint = getEndpoint(aasDescriptor);

        return aasEndpoint;
    }

    function getEndpoint(aas: any): string {
        const failResponse = '';

        if (!aas || Object.keys(aas).length === 0 || !aas.id || aas.id.trim() === '') return failResponse;

        return extractEndpointHref(aas, 'AAS-3.0');
    }

    return { fetchAndDispatchAas, fetchAndDispatchAasById, getEndpointById, getEndpoint };
}
