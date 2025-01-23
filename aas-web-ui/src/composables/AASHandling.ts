import { useAASRegistryClient } from '@/composables/Client/AASRegistryClient';
import { useAASRepositoryClient } from '@/composables/Client/AASRepositoryClient';
import { useAASStore } from '@/store/AASDataStore';
import { formatDate } from '@/utils/DateUtils';
import { extractEndpointHref } from '@/utils/DescriptorUtils';

export function useAASHandling() {
    // Composables
    const { fetchAasDescriptorById: fetchAasDescriptorByIdFromRegistry } = useAASRegistryClient();
    const { fetchAas: fetchAasFromRepo, fetchAasById: fetchAasByIdFromRepo } = useAASRepositoryClient();

    // Stores
    const aasStore = useAASStore();

    /**
     * Fetches an Asset Administration Shell (AAS) by the provided AAS endpoint
     * and dispatches it to the AAS store.
     *
     * @async
     * @param {string} aasEndpoint - The endpoint URL of the AAS to fetch.
     * @returns {Promise<any>} A promise that resolves to an AAS.
     */
    async function fetchAndDispatchAas(aasEndpoint: string): Promise<any> {
        const failResponse = {};

        if (!aasEndpoint) return failResponse;

        aasEndpoint = aasEndpoint.trim();

        if (aasEndpoint === '') return failResponse;

        const aas = await fetchAas(aasEndpoint);

        if (!aas || Object.keys(aas).length === 0) return failResponse;

        aas.isActive = true;

        // TODO move router.push to AASDataStore
        // router.push({ query: { aas: aasEndpoint } });
        aasStore.dispatchSelectedAAS(aas);

        return aas;
    }

    /**
     * Fetches an Asset Administration Shell (AAS) by the provided AAS ID
     * and dispatches it to the AAS by ID store.
     *
     * @param {string} aasId - The ID of the AAS to fetch.
     */
    async function fetchAndDispatchAasById(aasId: string): Promise<void> {
        if (!aasId) return;

        aasId = aasId.trim();

        if (aasId === '') return;

        const aas = await fetchAasById(aasId);

        aasStore.dispatchSelectedAAS(aas);
    }

    /**
     * Fetches an Asset Administration Shell (AAS) by the provided AAS endpoint.
     *
     * @param {string} aasEndpoint - The endpoint URL of the AAS to fetch.
     */
    async function fetchAas(aasEndpoint: string): Promise<any> {
        const failResponse = {};

        if (!aasEndpoint) return failResponse;

        aasEndpoint = aasEndpoint.trim();

        if (aasEndpoint === '') return failResponse;

        const aas = await fetchAasFromRepo(aasEndpoint);

        if (!aas || Object.keys(aas).length === 0) {
            console.warn('Fetched empty AAS');
            aasStore.dispatchSelectedNode({});
            return failResponse;
        }

        aas.timestamp = formatDate(new Date());
        aas.path = aasEndpoint;
        aas.isActive = true;

        return aas;
    }

    /**
     * Fetches an Asset Administration Shell (AAS) by the provided AAS ID.
     *
     * @param {string} aasId - The ID of the AAS to fetch.
     */
    async function fetchAasById(aasId: string): Promise<any> {
        const failResponse = {};

        if (!aasId) return failResponse;

        aasId = aasId.trim();

        if (aasId === '') return failResponse;

        const aas = await fetchAasByIdFromRepo(aasId);

        if (!aas || Object.keys(aas).length === 0) {
            console.warn('Fetched empty AAS');
            aasStore.dispatchSelectedNode({});
            return failResponse;
        }

        const aasEndpoint = getAasEndpoint(aas);

        aas.timestamp = formatDate(new Date());
        aas.path = aasEndpoint;
        aas.isActive = true;

        return aas;
    }

    /**
     * Retrieves the Asset Administration Shell (AAS) endpoint URL by its ID.
     *
     * @param {string} aasId - The ID of the AAS to retrieve the endpoint for.
     */
    async function getAasEndpointById(aasId: string): Promise<string> {
        const failResponse = '';

        if (!aasId) return failResponse;

        aasId = aasId.trim();

        if (aasId === '') return failResponse;

        const aasDescriptor = await fetchAasDescriptorByIdFromRegistry(aasId);
        const aasEndpoint = getAasEndpoint(aasDescriptor);

        return aasEndpoint || failResponse;
    }

    /**
     * Retrieves the Asset Administration Shell (AAS) endpoint URL of an AAS descriptor.
     *
     * @param {string} aasDescriptor - The AAS descriptor to retrieve the endpoint for.
     */
    function getAasEndpoint(aasDescriptor: any): string {
        // TODO Replace extractEndpointHref(aasDescriptor, 'AAS-3.0') by getAasEndpoint(aasDescriptor) in all components
        const failResponse = '';

        if (
            !aasDescriptor ||
            Object.keys(aasDescriptor).length === 0 ||
            !aasDescriptor.id ||
            aasDescriptor.id.trim() === ''
        )
            return failResponse;

        const aasEndpoint = extractEndpointHref(aasDescriptor, 'AAS-3.0');

        return aasEndpoint || failResponse;
    }

    return { fetchAndDispatchAas, fetchAndDispatchAasById, fetchAas, fetchAasById, getAasEndpoint, getAasEndpointById };
}
