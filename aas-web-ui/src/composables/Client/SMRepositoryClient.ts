import { computed } from 'vue';
import { useSMRegistryClient } from '@/composables/Client/SMRegistryClient';
import { useRequestHandling } from '@/composables/RequestHandling';
import { useNavigationStore } from '@/store/NavigationStore';
import { extractEndpointHref } from '@/utils/DescriptorUtils';

export function useSMRepositoryClient() {
    const { getRequest } = useRequestHandling();
    const { fetchSmDescriptorById } = useSMRegistryClient();

    const navigationStore = useNavigationStore();

    const submodelRepoUrl = computed(() => navigationStore.getSubmodelRepoURL);

    // Fetch List of all available SM
    async function fetchSmList(): Promise<Array<any>> {
        const failResponse = [] as Array<any>;

        let smRepoUrl = submodelRepoUrl.value;
        if (smRepoUrl.trim() === '') return failResponse;
        if (!smRepoUrl.includes('/shells')) {
            smRepoUrl += '/shells';
        }

        const smRepoPath = smRepoUrl;
        const smRepoContext = 'retrieving all SMs';
        const disableMessage = false;
        try {
            const smRepoResponse = await getRequest(smRepoPath, smRepoContext, disableMessage);
            if (smRepoResponse.success && smRepoResponse.data.result && smRepoResponse.data.result.length > 0) {
                return smRepoResponse.data.result;
            }
        } catch {
            // handle error
            return failResponse;
        }
        return failResponse;
    }

    // Fetch SM from SM Repo (with the help of the SM Registry)
    async function fetchSmById(smId: string): Promise<any> {
        // console.log('fetchAasById()', aasId);
        const failResponse = {} as any;

        if (smId.trim() === '') return failResponse;

        const smDescriptor = await fetchSmDescriptorById(smId);

        if (smDescriptor && Object.keys(smDescriptor).length > 0) {
            const smEndpoint = extractEndpointHref(smDescriptor, 'SUBMODEL-3.0');
            return fetchSm(smEndpoint);
        }

        return failResponse;
    }

    // Fetch SM from (SM Repo) Endpoint
    async function fetchSm(smEndpoint: string): Promise<any> {
        // console.log('fetchSm()', aasEndpoint);
        const failResponse = {} as any;

        if (smEndpoint.trim() === '') return failResponse;

        const smRepoPath = smEndpoint;
        const smRepoContext = 'retrieving SM Data';
        const disableMessage = true;
        try {
            const smRepoResponse = await getRequest(smRepoPath, smRepoContext, disableMessage);
            if (smRepoResponse?.success && smRepoResponse?.data && Object.keys(smRepoResponse?.data).length > 0) {
                const sm = smRepoResponse.data;
                // console.log('fetchSm()', smEndpoint, 'sm', sm);

                // Add endpoint to AAS
                sm.endpoints = [{ protocolInformation: { href: smEndpoint }, interface: 'SUBMODEL-3.0' }];

                return sm;
            }
        } catch {
            return failResponse;
        }

        return failResponse;
    }

    return {
        fetchSmList,
        fetchSmById,
        fetchSm,
    };
}
