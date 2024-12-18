import { computed } from 'vue';
import { useRequestHandling } from '@/composables/RequestHandling';
import { useNavigationStore } from '@/store/NavigationStore';
import { URLEncode } from '@/utils/EncodeDecodeUtils';

export function useAASRegistryClient() {
    const { getRequest } = useRequestHandling();

    const navigationStore = useNavigationStore();

    const aasRegistryUrl = computed(() => navigationStore.getAASRegistryURL);

    // Fetch List of all available AAS Descriptors
    async function fetchAasDescriptorList(): Promise<Array<any>> {
        // console.log('fetchAasDescriptorList()');

        const failResponse = [] as Array<any>;

        let aasRegUrl = aasRegistryUrl.value;
        if (aasRegUrl.trim() === '') return failResponse;
        if (!aasRegUrl.includes('/shell-descriptors')) {
            aasRegUrl += '/shell-descriptors';
        }

        const aasRegistryPath = aasRegUrl;
        const aasRegistryContext = 'retrieving all AAS Descriptors';
        const disableMessage = false;
        try {
            const aasRegistryResponse = await getRequest(aasRegistryPath, aasRegistryContext, disableMessage);
            if (
                aasRegistryResponse.success &&
                aasRegistryResponse.data.result &&
                aasRegistryResponse.data.result.length > 0
            ) {
                return aasRegistryResponse.data.result;
            }
        } catch {
            // handle error
            return failResponse;
        }

        return failResponse;
    }

    // Fetch AAS Descriptor by AAS ID with AAS Registry
    async function fetchAasDescriptorById(aasId: string): Promise<any> {
        // console.log('fetchAasDescriptorById()', aasId);

        const failResponse = {} as any;

        let aasRegUrl = aasRegistryUrl.value;
        if (aasRegUrl.trim() === '') return failResponse;
        if (!aasRegUrl.includes('/shell-descriptors')) {
            aasRegUrl += '/shell-descriptors';
        }

        const aasRegistryPath = aasRegUrl + '/' + URLEncode(aasId);
        const aasRegistryContext = 'retrieving AAS Descriptor';
        const disableMessage = false;
        try {
            const aasRegistryResponse = await getRequest(aasRegistryPath, aasRegistryContext, disableMessage);
            if (
                aasRegistryResponse?.success &&
                aasRegistryResponse?.data &&
                Object.keys(aasRegistryResponse?.data).length > 0
            ) {
                return aasRegistryResponse.data;
            }
        } catch {
            // handle error
            return failResponse;
        }
        return failResponse;
    }

    return {
        fetchAasDescriptorList,
        fetchAasDescriptorById,
    };
}
