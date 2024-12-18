import { computed } from 'vue';
import { useAASRegistryClient } from '@/composables/Client/AASRegistryClient';
import { useRequestHandling } from '@/composables/RequestHandling';
import { useAASStore } from '@/store/AASDataStore';
import { useNavigationStore } from '@/store/NavigationStore';
import { extractEndpointHref } from '@/utils/DescriptorUtils';

export function useAASRepositoryClient() {
    const { getRequest } = useRequestHandling();
    const { fetchAasDescriptorById } = useAASRegistryClient();

    const aasStore = useAASStore();
    const navigationStore = useNavigationStore();

    const aasRepositoryUrl = computed(() => navigationStore.getAASRepoURL);

    // Fetch List of all available AAS
    async function fetchAasList(): Promise<Array<any>> {
        const failResponse = [] as Array<any>;

        let aasRepoUrl = aasRepositoryUrl.value;
        if (aasRepoUrl.trim() === '') return failResponse;
        if (!aasRepoUrl.includes('/shells')) {
            aasRepoUrl += '/shells';
        }

        const aasRepoPath = aasRepoUrl;
        const aasRepoContext = 'retrieving all AAS';
        const disableMessage = false;
        try {
            const aasRepoResponse = await getRequest(aasRepoPath, aasRepoContext, disableMessage);
            if (aasRepoResponse.success && aasRepoResponse.data.result && aasRepoResponse.data.result.length > 0) {
                return aasRepoResponse.data.result;
            }
        } catch {
            // handle error
            return failResponse;
        }
        return failResponse;
    }

    // Fetch AAS from AAS Repo (with the help of the AAS Registry)
    async function fetchAasById(aasId: string): Promise<any> {
        const failResponse = {} as any;

        if (aasId.trim() === '') return failResponse;

        const aasDescriptor = await fetchAasDescriptorById(aasId);

        if (aasDescriptor && Object.keys(aasDescriptor).length > 0) {
            const aasEndpoint = extractEndpointHref(aasDescriptor, 'AAS-3.0');
            return fetchAas(aasEndpoint);
        }

        return failResponse;
    }

    // Fetch AAS from (AAS Repo) Endpoint
    async function fetchAas(aasEndpoint: string): Promise<any> {
        // console.log('fetchAas()', aasEndpoint);
        const failResponse = {} as any;

        if (aasEndpoint.trim() === '') return failResponse;

        const aasRepoPath = aasEndpoint;
        const aasRepoContext = 'retrieving AAS Data';
        const disableMessage = true;
        try {
            const aasRepoResponse = await getRequest(aasRepoPath, aasRepoContext, disableMessage);
            if (aasRepoResponse?.success && aasRepoResponse?.data && Object.keys(aasRepoResponse?.data).length > 0) {
                const aas = aasRepoResponse.data;
                // console.log('fetchAas()', aasEndpoint, 'aas', aas);

                // Add endpoint to AAS
                aas.endpoints = [{ protocolInformation: { href: aasEndpoint }, interface: 'AAS-3.0' }];

                return aas;
            }
        } catch {
            return failResponse;
        }

        return failResponse;
    }

    // Fetch and Dispatch AAS from (AAS Repo) Endpoint
    async function fetchAndDispatchAas(aasEndpoint: string) {
        if (aasEndpoint.trim() === '') return;

        const aas = await fetchAas(aasEndpoint);
        // console.log('fetchAndDispatchAas()', aasEndpoint, 'aas', aas);

        aasStore.dispatchSelectedAAS(aas);
    }

    return {
        fetchAasList,
        fetchAasById,
        fetchAas,
        fetchAndDispatchAas,
    };
}
