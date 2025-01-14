import { computed } from 'vue';
import { useRequestHandling } from '@/composables/RequestHandling';
import { useNavigationStore } from '@/store/NavigationStore';
import { base64Encode } from '@/utils/EncodeDecodeUtils';

export function useSMRegistryClient() {
    const { getRequest } = useRequestHandling();

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

        if (!smId || smId.trim() === '') return failResponse;
        smId = smId.trim();

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

        if (!smId || smId.trim() === '') return failResponse;
        smId = smId.trim();

        const smDescriptor = await fetchSmDescriptorById(smId);

        if (smDescriptor && Object.keys(smDescriptor).length > 0) {
            return true;
        }

        return failResponse;
    }

    return {
        fetchSmDescriptorList,
        fetchSmDescriptorById,
        isAvailableById,
    };
}
