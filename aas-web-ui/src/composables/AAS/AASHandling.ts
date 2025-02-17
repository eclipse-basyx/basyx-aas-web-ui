import { useReferenceUtils } from '@/composables/AAS/ReferenceUtils';
import { useAASRegistryClient } from '@/composables/Client/AASRegistryClient';
import { useAASRepositoryClient } from '@/composables/Client/AASRepositoryClient';
import { useAASStore } from '@/store/AASDataStore';
import { formatDate } from '@/utils/DateUtils';
import { useSMHandling } from './SMHandling';

export function useAASHandling() {
    // Composables
    const {
        fetchAasDescriptorById: fetchAasDescriptorByIdFromRegistry,
        fetchAasDescriptorList: fetchAasDescriptorListFromRegistry,
        getAasEndpoint,
        getAasEndpointById: getAasEndpointByIdFromRegistry,
    } = useAASRegistryClient();
    const {
        fetchAas: fetchAasFromRepo,
        fetchAasById: fetchAasByIdFromRepo,
        getAasEndpointById: getAasEndpointByIdFromRepo,
    } = useAASRepositoryClient();
    const { fetchSmById } = useSMHandling();
    const { extractId } = useReferenceUtils();

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

        aasStore.dispatchSelectedAAS(aas);

        return aas;
    }

    /**
     * Fetches an Asset Administration Shell (AAS) by the provided AAS ID
     * and dispatches it to the AAS store.
     *
     * @async
     * @param {string} aasId - The ID of the AAS to fetch.
     * @returns {Promise<any>} A promise that resolves to an AAS.
     */
    async function fetchAndDispatchAasById(aasId: string): Promise<any> {
        const failResponse = {};

        if (!aasId) return failResponse;

        aasId = aasId.trim();

        if (aasId === '') return failResponse;

        const aas = await fetchAasById(aasId);

        if (!aas || Object.keys(aas).length === 0) return failResponse;

        aasStore.dispatchSelectedAAS(aas);

        return aas;
    }

    /**
     * Fetches a list of all available Asset Administration Shell (AAS) Descriptors.
     *
     * @async
     * @returns {Promise<Array<any>>} A promise that resolves to an array of AAS Descriptors.
     * An empty array is returned if the request fails or no AAS Descriptors are found.
     */
    async function fetchAasDescriptorList(): Promise<Array<any>> {
        const failResponse = [] as Array<any>;

        let aasDescriptors = await fetchAasDescriptorListFromRegistry();

        if (!aasDescriptors || !Array.isArray(aasDescriptors) || aasDescriptors.length === 0) return failResponse;

        aasDescriptors = aasDescriptors.map((aasDescriptor: any) => {
            aasDescriptor.timestamp = formatDate(new Date());
            aasDescriptor.path = getAasEndpoint(aasDescriptor);
            return aasDescriptor;
        });

        return aasDescriptors;
    }

    /**
     * Fetches an Asset Administration Shell (AAS) Descriptor by the provided AAS ID.
     *
     * @async
     * @param {string} aasId - The ID of the AAS Descriptor to fetch.
     * @returns {Promise<any>} A promise that resolves to an AAS Descriptor.
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
        aasDescriptor.path = getAasEndpoint(aasDescriptor);

        return aasDescriptor || failResponse;
    }

    /**
     * Fetches an Asset Administration Shell (AAS) by the provided AAS endpoint.
     *
     * @async
     * @param {string} aasEndpoint - The endpoint URL of the AAS to fetch.
     * @returns {Promise<any>} A promise that resolves to an AAS.
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
     * @async
     * @param {string} aasId - The ID of the AAS to fetch.
     * @returns {Promise<any>} A promise that resolves to an AAS.
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

        aas.timestamp = formatDate(new Date());
        aas.path = getAasEndpointByIdFromRepo(aasId);

        return aas;
    }

    /**
     * Retrieves the Asset Administration Shell (AAS) endpoint URL by its ID.
     *
     * @param {string} aasId - The ID of the AAS to retrieve the endpoint for.
     * @returns {Promise<string>} A promise that resolves to an AAS endpoint.
     */
    async function getAasEndpointById(aasId: string): Promise<string> {
        const failResponse = '';

        if (!aasId) return failResponse;

        aasId = aasId.trim();

        if (aasId === '') return failResponse;

        // First try to determine AAS endpoint with the help of the registry
        const aasEndpoint = await getAasEndpointByIdFromRegistry(aasId);

        if (aasEndpoint && aasEndpoint.trim() !== '') return aasEndpoint;

        // Second try to determine AAS endpoint with the help of the repo
        return getAasEndpointByIdFromRepo(aasId) || failResponse;
    }

    /**
     * Fetches a list of all available Submodel (SM) Descriptors of a specified Asset Administration Shell (AAS).
     *
     * @async
     * @returns {Promise<Array<any>>} A promise that resolves to an array of SM Descriptors.
     * An empty array is returned if the request fails or no SM Descriptors are found.
     */
    async function fetchAasSmListById(aasId: string): Promise<Array<any>> {
        const failResponse = [] as Array<any>;

        if (!aasId) return failResponse;

        aasId = aasId.trim();

        if (aasId === '') return failResponse;

        const aas = await fetchAasById(aasId);

        if (
            aas &&
            Object.keys(aas).length > 0 &&
            aas.submodels &&
            Array.isArray(aas.submodels) &&
            aas.submodels.length > 0
        ) {
            const submodelRefs = aas.submodels;

            const submodelPromises = submodelRefs.map((submodelRef: any) => {
                return fetchSmById(extractId(submodelRef, 'Submodel'), false, true);
            });

            return await Promise.all(submodelPromises);
        }

        return failResponse;
    }

    return {
        fetchAndDispatchAas,
        fetchAndDispatchAasById,
        fetchAasDescriptorList,
        fetchAasDescriptor,
        fetchAas,
        fetchAasById,
        fetchAasSmListById,
        getAasEndpointById,
    };
}
