import { jsonization } from '@aas-core-works/aas-core3.0-typescript';
import { computed } from 'vue';
import { useRequestHandling } from '@/composables/RequestHandling';
import { useNavigationStore } from '@/store/NavigationStore';
import * as descriptorTypes from '@/types/Descriptors';
import { base64Encode } from '@/utils/EncodeDecodeUtils';
import { removeNullValues } from '@/utils/generalUtils';

export function useSMRegistryClient() {
    const { getRequest, postRequest, putRequest } = useRequestHandling();

    const navigationStore = useNavigationStore();

    const submodelRegistryUrl = computed(() => navigationStore.getSubmodelRegistryURL);

    /**
     * Fetches a list of all available Submodel (SM) Descriptors.
     *
     * @returns {Promise<Array<any>>} A promise that resolves to an array of SM Descriptors.
     * An empty array is returned if the request fails or no SM Descriptors are found.
     */
    async function fetchSmDescriptorList(): Promise<Array<any>> {
        const failResponse = [] as Array<any>;

        let smRegistryUrl = submodelRegistryUrl.value;
        if (smRegistryUrl.trim() === '') return failResponse;
        if (!smRegistryUrl.includes('/submodel-descriptors')) {
            smRegistryUrl += '/submodel-descriptors';
        }

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
        } catch {
            return failResponse;
        }
        return failResponse;
    }

    /**
     * Fetches a Submodel (SM)  Descriptor by the provided SM ID.
     *
     * @param {string} smId - The ID of the SM Descriptor to fetch.
     */
    async function fetchSmDescriptorById(smId: string): Promise<any> {
        const failResponse = {} as any;

        if (!smId) return failResponse;

        smId = smId.trim();

        if (smId === '') return failResponse;

        let smRegistryUrl = submodelRegistryUrl.value;
        if (smRegistryUrl.trim() === '') return failResponse;
        if (!smRegistryUrl.includes('/submodel-descriptors')) {
            smRegistryUrl += '/submodel-descriptors';
        }

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
        } catch {
            return failResponse;
        }
        return failResponse;
    }

    /**
     * Checks if Submodel (SM) Descriptor with provided ID is available (in registry).
     *
     * @param {string} smId - The ID of the SM to check.
     * @returns {Promise<boolean>} - A promise that resolves to `true` if SM with provided ID is available, otherwise `false`.
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

    async function postSubmodelDescriptor(submodelDescriptor: descriptorTypes.SubmodelDescriptor): Promise<void> {
        let submodelRegUrl = submodelRegistryUrl.value;
        if (!submodelRegUrl.includes('/submodel-descriptors')) {
            submodelRegUrl += '/submodel-descriptors';
        }

        const context = 'updating Submodel Descriptor';
        const disableMessage = false;
        const path = submodelRegUrl;
        const headers = new Headers();
        headers.append('Content-Type', 'application/json');
        const body = JSON.stringify(submodelDescriptor);

        await postRequest(path, body, headers, context, disableMessage);
    }

    async function putSubmodelDescriptor(submodelDescriptor: descriptorTypes.SubmodelDescriptor): Promise<void> {
        let submodelRegUrl = submodelRegistryUrl.value;
        if (!submodelRegUrl.includes('/submodel-descriptors')) {
            submodelRegUrl += '/submodel-descriptors';
        }

        const context = 'updating Submodel Descriptor';
        const disableMessage = false;
        const path = submodelRegUrl + '/' + base64Encode(submodelDescriptor.id);
        const headers = new Headers();
        headers.append('Content-Type', 'application/json');
        const body = JSON.stringify(submodelDescriptor);

        await putRequest(path, body, headers, context, disableMessage);
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
        fetchSmDescriptorList,
        fetchSmDescriptorById,
        isAvailableById,
        postSubmodelDescriptor,
        putSubmodelDescriptor,
        createDescriptorFromSubmodel,
    };
}
