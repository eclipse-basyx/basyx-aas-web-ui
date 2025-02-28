import { useSMHandling } from '@/composables/AAS/SMHandling';
import { useAASRegistryClient } from '@/composables/Client/AASRegistryClient';
import { useAASRepositoryClient } from '@/composables/Client/AASRepositoryClient';
import { useAASStore } from '@/store/AASDataStore';
import { extractEndpointHref } from '@/utils/AAS/DescriptorUtils';
import { extractId as extractIdFromReference } from '@/utils/AAS/ReferenceUtil';
import { formatDate } from '@/utils/DateUtils';

export function useAASHandling() {
    // Composables
    const {
        fetchAasDescriptorById: fetchAasDescriptorByIdFromRegistry,
        fetchAasDescriptorList: fetchAasDescriptorListFromRegistry,
        getAasEndpointById: getAasEndpointByIdFromRegistry,
    } = useAASRegistryClient();
    const {
        fetchAasList: fetchAasListFromRepo,
        fetchAas: fetchAasFromRepo,
        getAasEndpointById: getAasEndpointByIdFromRepo,
        aasIsAvailable: aasIsAvailableInRepo,
        getSubmodelRefs: getSubmodelRefsFromRepo,
    } = useAASRepositoryClient();
    const { fetchSmDescriptor, fetchSmById } = useSMHandling();

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

        let aasDescriptorList = await fetchAasDescriptorListFromRegistry();

        if (!aasDescriptorList || !Array.isArray(aasDescriptorList) || aasDescriptorList.length === 0)
            return failResponse;

        aasDescriptorList = aasDescriptorList.map((aasDescriptor: any) => {
            aasDescriptor.timestamp = formatDate(new Date());
            aasDescriptor.path = extractEndpointHref(aasDescriptor, 'AAS-3.0');
            return aasDescriptor;
        });

        return aasDescriptorList;
    }

    /**
     * Fetches a list of all available Asset Administration Shell (AAS).
     *
     * @async
     * @returns {Promise<Array<any>>} A promise that resolves to an array of AAS.
     * An empty array is returned if the request fails or no AAS Descriptors are found.
     */
    async function fetchAasList(): Promise<Array<any>> {
        const failResponse = [] as Array<any>;

        let aasList = await fetchAasListFromRepo();

        if (!aasList || !Array.isArray(aasList) || aasList.length === 0) return failResponse;

        aasList = aasList.map((aas: any) => {
            aas.timestamp = formatDate(new Date());
            aas.path = getAasEndpointByIdFromRepo(aas.id);
            return aas;
        });

        return aasList;
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
        aasDescriptor.path = extractEndpointHref(aasDescriptor, 'AAS-3.0');

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

        const aasEndpoint = await getAasEndpointById(aasId);

        if (aasEndpoint && aasEndpoint.trim() !== '') {
            return fetchAas(aasEndpoint.trim());
        }

        return failResponse;
    }

    /**
     * Retrieves the Asset Administration Shell (AAS) endpoint URL by its ID.
     *
     * This function attempts to obtain the AAS endpoint using two methods: first by querying
     * the AAS registry, and if that fails, it tries to obtain it from the AAS repository. If the provided
     * AAS ID is invalid or empty, the function returns an empty string.
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

        if (aasEndpoint && aasEndpoint.trim() !== '') return aasEndpoint.trim();

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
                const smId = extractIdFromReference(submodelRef, 'Submodel');
                return fetchSmById(smId, false, true);
            });

            return await Promise.all(submodelPromises);
        }

        return failResponse;
    }

    async function aasIsAvailableById(aasId: string): Promise<boolean> {
        const failResponse = false;

        if (!aasId) return failResponse;

        aasId = aasId.trim();

        if (aasId === '') return failResponse;

        const aasEndpoint = await getAasEndpointById(aasId);

        return await aasIsAvailableInRepo(aasEndpoint);
    }

    async function getSubmodelRefsById(aasId: string): Promise<Array<any>> {
        const failResponse = [] as Array<any>;

        if (!aasId) return failResponse;

        aasId = aasId.trim();

        if (aasId === '') return failResponse;

        const aasEndpoint = await getAasEndpointById(aasId);

        if (aasEndpoint && aasEndpoint.trim() !== '') return getSubmodelRefsFromRepo(aasEndpoint.trim());

        return failResponse;
    }

    /**
     * Retrieves a Submodel (SM) of an Asset Administration Shell (AAS) SM descriptor.
     *
     * @async
     * @param {string} aasId - The ID of the AAS to retrieve its SM.
     * @param {string} semanticId - The semantic ID of the SM.
     * @returns {string} A promise that resolves to a SM.
     */
    async function getSmIdOfAasIdBySemanticId(aasId: string, semanticId: string): Promise<string> {
        const failResponse = '';

        if (!aasId || !semanticId) return failResponse;

        aasId = aasId.trim();
        semanticId = semanticId.trim();

        if (aasId === '' || semanticId === '') return failResponse;

        const submodelRefs = await getSubmodelRefsById(aasId);

        for (const submodelRef of submodelRefs) {
            const smId = extractIdFromReference(submodelRef, 'Submodel');
            const smDescriptor = await fetchSmDescriptor(smId);
            if (
                smDescriptor &&
                Object.keys(smDescriptor).length > 0 &&
                smDescriptor?.semanticId?.keys &&
                Array.isArray(smDescriptor.semanticId.keys) &&
                smDescriptor.semanticId.keys.length > 0
            ) {
                const semanticIds = smDescriptor.semanticId.keys.map((key: any) => key.value);
                if (semanticIds.includes(semanticId)) {
                    return smId;
                }
            }
        }

        return failResponse;
    }

    return {
        getAasEndpointById,
        getSubmodelRefsById,
        getSmIdOfAasIdBySemanticId,
        aasIsAvailableById,
        fetchAndDispatchAas,
        fetchAndDispatchAasById,
        fetchAasDescriptorList,
        fetchAasDescriptor,
        fetchAasList,
        fetchAas,
        fetchAasById,
        fetchAasSmListById,
    };
}
