import { useAASRegistryClient } from '@/composables/Client/AASRegistryClient';
import { useAASRepositoryClient } from '@/composables/Client/AASRepositoryClient';
import { useAASStore } from '@/store/AASDataStore';
import { formatDate } from '@/utils/DateUtils';
import { extractEndpointHref } from '@/utils/DescriptorUtils';

export function useAASHandling() {
    // Composables
    const {
        fetchAasDescriptorById: fetchAasDescriptorByIdFromRegistry,
        fetchAasDescriptorList: fetchAasDescriptorListFromRegistry,
    } = useAASRegistryClient();
    const { fetchAas: fetchAasFromRepo, fetchAasById: fetchAasByIdFromRepo } = useAASRepositoryClient();

    // Stores
    const aasStore = useAASStore();

    /**
     * Fetches an Asset Administration Shell (AAS) by the provided AAS endpoint
     * and dispatches it to the AAS store.
     *
     * @param {string} aasEndpoint - The endpoint URL of the AAS to fetch.
     * @returns {Promise<any>}-  A promise that resolves to an AAS.
     */
    async function fetchAndDispatchAas(aasEndpoint: string): Promise<any> {
        const failResponse = {};

        if (!aasEndpoint) return failResponse;

        aasEndpoint = aasEndpoint.trim();

        if (aasEndpoint === '') return failResponse;

        const aas = await fetchAas(aasEndpoint);

        if (!aas || Object.keys(aas).length === 0) return failResponse;

        aas.isActive = true;

        aasStore.dispatchSelectedAAS(aas);

        return aas;
    }

    /**
     * Fetches an Asset Administration Shell (AAS) by the provided AAS ID
     * and dispatches it to the AAS store.
     *
     * @param {string} aasId - The ID of the AAS to fetch.
     * @returns {Promise<any>} - A promise that resolves to an AAS.
     */
    async function fetchAndDispatchAasById(aasId: string): Promise<any> {
        const failResponse = {};

        if (!aasId) return failResponse;

        aasId = aasId.trim();

        if (aasId === '') return failResponse;

        const aas = await fetchAasById(aasId);

        if (!aas || Object.keys(aas).length === 0) return failResponse;

        aas.isActive = true;

        aasStore.dispatchSelectedAAS(aas);

        return aas;
    }

    /**
     * Fetches a list of all available Asset Administration Shell (AAS) Descriptors.
     *
     * @returns {Promise<Array<any>>} - A promise that resolves to an array of AAS Descriptors.
     * An empty array is returned if the request fails or no AAS Descriptors are found.
     */
    async function fetchAasDescriptorList(): Promise<Array<any>> {
        const failResponse = [] as Array<any>;

        let aasDescriptors = await fetchAasDescriptorListFromRegistry();

        if (!aasDescriptors || !Array.isArray(aasDescriptors) || aasDescriptors.length === 0) return failResponse;

        aasDescriptors = aasDescriptors.map((aasDescriptor: any) => {
            aasDescriptor.timestamp = formatDate(new Date());
            return aasDescriptor;
        });

        return aasDescriptors;
    }

    /**
     * Fetches an Asset Administration Shell (AAS) Descriptor by the provided AAS ID.
     *
     * @param {string} aasId - The ID of the AAS Descriptor to fetch.
     * @returns {Promise<any>} - A promise that resolves to an AAS Descriptor.
     */
    async function fetchAasDescriptor(aasId: string): Promise<any> {
        const failResponse = {};

        if (!aasId) return failResponse;

        aasId = aasId.trim();

        if (aasId === '') return failResponse;

        const aasDescriptor = await fetchAasDescriptorByIdFromRegistry(aasId);

        if (!aasDescriptor || Object.keys(aasDescriptor).length === 0) {
            console.warn("Fetching AAS Descriptor (id = '" + aasId + "') failed!");
            return failResponse;
        }

        aasDescriptor.timestamp = formatDate(new Date());

        return aasDescriptor || failResponse;
    }

    /**
     * Fetches an Asset Administration Shell (AAS) by the provided AAS endpoint.
     *
     * @param {string} aasEndpoint - The endpoint URL of the AAS to fetch.
     * @returns {Promise<any>} - A promise that resolves to an AAS.
     */
    async function fetchAas(aasEndpoint: string): Promise<any> {
        const failResponse = {};

        if (!aasEndpoint) return failResponse;

        aasEndpoint = aasEndpoint.trim();

        if (aasEndpoint === '') return failResponse;

        const aas = await fetchAasFromRepo(aasEndpoint);

        if (!aas || Object.keys(aas).length === 0) {
            console.warn('Fetching AAS (' + aasEndpoint + ') failed!');
            return failResponse;
        }

        aas.timestamp = formatDate(new Date());
        aas.path = aasEndpoint;

        return aas;
    }

    /**
     * Fetches an Asset Administration Shell (AAS) by the provided AAS ID.
     *
     * @param {string} aasId - The ID of the AAS to fetch.
     * @returns {Promise<any>} - A promise that resolves to an AAS.
     */
    async function fetchAasById(aasId: string): Promise<any> {
        const failResponse = {};

        if (!aasId) return failResponse;

        aasId = aasId.trim();

        if (aasId === '') return failResponse;

        const aas = await fetchAasByIdFromRepo(aasId);

        if (!aas || Object.keys(aas).length === 0) {
            console.warn("Fetching AAS (id = '" + aasId + "') failed!");
            return failResponse;
        }

        const aasEndpoint = getAasEndpoint(aas);

        aas.timestamp = formatDate(new Date());
        aas.path = aasEndpoint;

        return aas;
    }

    /**
     * Retrieves the Asset Administration Shell (AAS) endpoint URL by its ID.
     *
     * @param {string} aasId - The ID of the AAS to retrieve the endpoint for.
     * @returns {Promise<string>} - A promise that resolves to an AAS endpoint.
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
     * @returns {string} - A promise that resolves to an AAS endpoint.
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

    return {
        fetchAndDispatchAas,
        fetchAndDispatchAasById,
        fetchAasDescriptorList,
        fetchAasDescriptor,
        fetchAas,
        fetchAasById,
        getAasEndpoint,
        getAasEndpointById,
    };
}
