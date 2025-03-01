import { jsonization } from '@aas-core-works/aas-core3.0-typescript';
import { computed } from 'vue';
import { useRequestHandling } from '@/composables/RequestHandling';
import { useNavigationStore } from '@/store/NavigationStore';
import * as descriptorTypes from '@/types/Descriptors';
import { extractEndpointHref } from '@/utils/AAS/DescriptorUtils';
import { base64Encode } from '@/utils/EncodeDecodeUtils';
import { removeNullValues } from '@/utils/generalUtils';
import { stripLastCharacter } from '@/utils/StringUtils';

export function useSMRegistryClient() {
    // Stores
    const navigationStore = useNavigationStore();

    // Composables
    const { getRequest, postRequest, putRequest } = useRequestHandling();

    const endpointPath = '/submodel-descriptors';

    // Computed Properties
    const submodelRegistryUrl = computed(() => navigationStore.getSubmodelRegistryURL);

    /**
     * Fetches a list of all available Submodel (SM) Descriptors.
     *
     * @async
     * @returns {Promise<Array<any>>} A promise that resolves to an array of SM Descriptors.
     * An empty array is returned if the request fails or no SM Descriptors are found.
     */
    async function fetchSmDescriptorList(): Promise<Array<any>> {
        const failResponse = [] as Array<any>;

        let smRegistryUrl = submodelRegistryUrl.value.trim();
        if (smRegistryUrl === '') return failResponse;
        if (smRegistryUrl.endsWith('/')) smRegistryUrl = stripLastCharacter(smRegistryUrl);
        if (!smRegistryUrl.endsWith(endpointPath)) smRegistryUrl += endpointPath;

        const smRegistryPath = smRegistryUrl;
        const smRegistryContext = 'retrieving all SM Descriptors';
        const disableMessage = false;
        try {
            const smRegistryResponse = await getRequest(smRegistryPath, smRegistryContext, disableMessage);
            if (
                smRegistryResponse.success &&
                smRegistryResponse.data.result &&
                smRegistryResponse.data.result.length > 0
            ) {
                return smRegistryResponse.data.result;
            }
        } catch (e) {
            console.warn(e);
            return failResponse;
        }
        return failResponse;
    }

    /**
     * Fetches a Submodel (SM)  Descriptor by the provided SM ID.
     *
     * @async
     * @param {string} smId - The ID of the SM Descriptor to fetch.
     * @returns {Promise<any>} A promise that resolves to a SM Descriptor.
     */
    async function fetchSmDescriptorById(smId: string): Promise<any> {
        const failResponse = {} as any;

        if (!smId) return failResponse;

        smId = smId.trim();

        if (smId === '') return failResponse;

        let smRegistryUrl = submodelRegistryUrl.value.trim();
        if (smRegistryUrl === '') return failResponse;
        if (smRegistryUrl.endsWith('/')) smRegistryUrl = stripLastCharacter(smRegistryUrl);
        if (!smRegistryUrl.endsWith(endpointPath)) smRegistryUrl += endpointPath;

        const smRegistryPath = smRegistryUrl + '/' + base64Encode(smId);
        const smRegistryContext = 'retrieving SM Descriptor';
        const disableMessage = false;
        try {
            const smRegistryResponse = await getRequest(smRegistryPath, smRegistryContext, disableMessage);
            if (
                smRegistryResponse?.success &&
                smRegistryResponse?.data &&
                Object.keys(smRegistryResponse?.data).length > 0
            ) {
                return smRegistryResponse.data;
            }
        } catch (e) {
            console.warn(e);
            return failResponse;
        }
        return failResponse;
    }

    /**
     * Retrieves the Submodel (Sm) endpoint URL by its ID.
     *
     * @async
     * @param {string} smId - The ID of the SM to retrieve the endpoint for.
     * @returns {Promise<string>} A promise that resolves to an SM endpoint.
     */
    async function getSmEndpointById(smId: string): Promise<string> {
        const failResponse = '';

        if (!smId) return failResponse;

        smId = smId.trim();

        if (smId === '') return failResponse;

        const smDescriptor = await fetchSmDescriptorById(smId);
        const smEndpoint = extractEndpointHref(smDescriptor, 'SUBMODEL-3.0');

        return smEndpoint || failResponse;
    }

    /**
     * Checks if Submodel (SM) Descriptor with provided ID is available (in registry).
     *
     * @async
     * @param {string} smId - The ID of the SM to check.
     * @returns {Promise<boolean>} A promise that resolves to `true` if SM with provided ID is available, otherwise `false`.
     */
    async function isAvailableById(smId: string): Promise<boolean> {
        const failResponse = false;

        if (!smId) return failResponse;

        smId = smId.trim();

        if (smId === '') return failResponse;

        const smDescriptor = await fetchSmDescriptorById(smId);

        if (smDescriptor && Object.keys(smDescriptor).length > 0) {
            return true;
        }

        return failResponse;
    }

    async function postSubmodelDescriptor(submodelDescriptor: descriptorTypes.SubmodelDescriptor): Promise<boolean> {
        const failResponse = false;

        let smRegistryUrl = submodelRegistryUrl.value.trim();
        if (smRegistryUrl === '') return failResponse;
        if (smRegistryUrl.endsWith('/')) smRegistryUrl = stripLastCharacter(smRegistryUrl);
        if (!smRegistryUrl.endsWith(endpointPath)) smRegistryUrl += endpointPath;

        const context = 'updating Submodel Descriptor';
        const disableMessage = false;
        const path = smRegistryUrl;
        const headers = new Headers();
        headers.append('Content-Type', 'application/json');
        const body = JSON.stringify(submodelDescriptor);

        const response = await postRequest(path, body, headers, context, disableMessage);

        return response.success;
    }

    async function putSubmodelDescriptor(submodelDescriptor: descriptorTypes.SubmodelDescriptor): Promise<boolean> {
        const failResponse = false;

        let smRegistryUrl = submodelRegistryUrl.value.trim();
        if (smRegistryUrl === '') return failResponse;
        if (smRegistryUrl.endsWith('/')) smRegistryUrl = stripLastCharacter(smRegistryUrl);
        if (!smRegistryUrl.endsWith(endpointPath)) smRegistryUrl += endpointPath;

        const context = 'updating Submodel Descriptor';
        const disableMessage = false;
        const path = smRegistryUrl + '/' + base64Encode(submodelDescriptor.id);
        const headers = new Headers();
        headers.append('Content-Type', 'application/json');
        const body = JSON.stringify(submodelDescriptor);

        const response = await putRequest(path, body, headers, context, disableMessage);

        return response.success;
    }

    function createDescriptorFromSubmodel(
        submodel: jsonization.JsonObject,
        endpoints: Array<descriptorTypes.Endpoint>
    ): descriptorTypes.SubmodelDescriptor {
        const jsonSubmodel = JSON.stringify(submodel);
        const parsedSubmodel = JSON.parse(jsonSubmodel);
        let descriptor = new descriptorTypes.SubmodelDescriptor(
            endpoints,
            parsedSubmodel.id,
            parsedSubmodel.administration,
            parsedSubmodel.description,
            parsedSubmodel.displayName,
            parsedSubmodel.extensions,
            parsedSubmodel.idShort
        );
        descriptor = removeNullValues(descriptor);
        return descriptor;
    }

    return {
        endpointPath,
        getSmEndpointById,
        fetchSmDescriptorList,
        fetchSmDescriptorById,
        isAvailableById,
        postSubmodelDescriptor,
        putSubmodelDescriptor,
        createDescriptorFromSubmodel,
    };
}
