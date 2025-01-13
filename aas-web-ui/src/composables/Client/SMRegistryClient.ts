import { computed } from 'vue';
import { useRequestHandling } from '@/composables/RequestHandling';
import { useNavigationStore } from '@/store/NavigationStore';
import { URLEncode } from '@/utils/EncodeDecodeUtils';

export function useSMRegistryClient() {
    const { getRequest } = useRequestHandling();

    const navigationStore = useNavigationStore();

    const submodelRegistryUrl = computed(() => navigationStore.getSubmodelRegistryURL);

    // Fetch List of all available SM Descriptors
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
            // handle error
            return failResponse;
        }
        return failResponse;
    }

    // Fetch SM Descriptor by SM ID with SM Registry
    async function fetchSmDescriptorById(smId: string): Promise<any> {
        const failResponse = {} as any;

        let smRegistryUrl = submodelRegistryUrl.value;
        if (smRegistryUrl.trim() === '') return failResponse;
        if (!smRegistryUrl.includes('/submodel-descriptors')) {
            smRegistryUrl += '/submodel-descriptors';
        }

        const smRegistryPath = smRegistryUrl + '/' + URLEncode(smId).replace(/%3D/g, '');
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
            // handle error
            return failResponse;
        }
        return failResponse;
    }

    return {
        fetchSmDescriptorList,
        fetchSmDescriptorById,
    };
}
