import { useAASStore } from '@/store/AASDataStore';
import { extractEndpointHref } from '@/utils/DescriptorUtils';
import { useAASRegistryClient } from './Client/AASRegistryClient';
import { useAASRepositoryClient } from './Client/AASRepositoryClient';

export function useAASHandling() {
    // Composables
    const { fetchAasDescriptorById } = useAASRegistryClient();
    const { fetchAas, fetchAasById } = useAASRepositoryClient();

    // Stores
    const aasStore = useAASStore();

    // Fetch and dispatch AAS
    async function fetchAndDispatchAas(aasEndpoint: string): Promise<void> {
        // console.log('fetchAndDispatchAas()', aasEndpoint);

        aasEndpoint = aasEndpoint.trim();

        if (aasEndpoint === '') return;

        const aas = await fetchAas(aasEndpoint);
        // console.log('fetchAndDispatchAas()', aasEndpoint, 'aas', aas);

        aasStore.dispatchSelectedAAS(aas);
    }

    // Fetch and dispatch AAS
    async function fetchAndDispatchAasById(aasId: string): Promise<void> {
        // console.log('fetchAndDispatchAasById()', aasId);

        if (aasId.trim() === '') return;

        const aas = await fetchAasById(aasId);
        // console.log('fetchAndDispatchAasById()', aasId, 'aas:', aas);

        aasStore.dispatchSelectedAAS(aas);
    }

    async function getEndpointById(aasId: string): Promise<string> {
        const failReponse = '';

        if (aasId.trim() === '') return failReponse;

        const aasDescriptor = await fetchAasDescriptorById(aasId);

        return getEndpoint(aasDescriptor);
    }

    async function getEndpoint(aas: any): Promise<string> {
        const failReponse = '';

        if (!aas || Object.keys(aas).length === 0 || !aas.id || aas.id.trim() === '') return failReponse;

        return extractEndpointHref(aas, 'AAS-3.0');
    }

    return { fetchAndDispatchAas, fetchAndDispatchAasById, getEndpointById, getEndpoint };
}
