import { computed } from 'vue';
import { useSMRegistryClient } from '@/composables/Client/SMRegistryClient';
import { useRequestHandling } from '@/composables/RequestHandling';
import { useAASStore } from '@/store/AASDataStore';
import { useNavigationStore } from '@/store/NavigationStore';
import { formatDate } from '@/utils/DateUtils';
import { extractEndpointHref } from '@/utils/DescriptorUtils';

export function useSMRepositoryClient() {
    const { getRequest } = useRequestHandling();
    const { fetchSmDescriptorById } = useSMRegistryClient();

    const navigationStore = useNavigationStore();
    const aasStore = useAASStore();

    const submodelRepoUrl = computed(() => navigationStore.getSubmodelRepoURL);

    // Fetch List of all available SM
    async function fetchSmList(): Promise<Array<any>> {
        const failResponse = [] as Array<any>;

        let smRepoUrl = submodelRepoUrl.value;
        if (smRepoUrl.trim() === '') return failResponse;
        if (!smRepoUrl.includes('/submodels')) {
            smRepoUrl += '/submodels';
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

    // Fetch SME from (SM Repo) Endpoint
    async function fetchSme(submodelElementPath: string): Promise<any> {
        // console.log('fetchSme()', submodelElementPath);
        const failResponse = {} as any;

        if (submodelElementPath.trim() === '') return failResponse;

        const smRepoPath = submodelElementPath;
        const smRepoContext = 'retrieving SubmodelElement';
        const disableMessage = true;
        try {
            const smRepoResponse = await getRequest(smRepoPath, smRepoContext, disableMessage);
            if (smRepoResponse?.success && smRepoResponse?.data && Object.keys(smRepoResponse?.data).length > 0) {
                const sme = smRepoResponse.data;

                return sme;
            }
        } catch {
            navigationStore.dispatchSnackbar({
                status: true,
                timeout: 60000,
                color: 'error',
                btnColor: 'buttonText',
                text: 'No valid SubmodelElement under the given Path',
            });
            return failResponse;
        }

        return failResponse;
    }

    // Fetch and Dispatch AAS from (AAS Repo) Endpoint
    async function fetchAndDispatchSme(submodelElementPath: string) {
        // console.log('fetchAndDispatchSme()', submodelElementPath);
        if (submodelElementPath.trim() === '') return;

        const sme = await fetchSme(submodelElementPath);
        sme.timestamp = formatDate(new Date());
        sme.path = submodelElementPath;
        sme.isActive = true;

        aasStore.dispatchNode(sme);
    }

    function smNotFound(response: any, submodelId: string, path: string, text: string): any {
        // Check if response contains a "messages" array with a "403" or "401" code
        const messages = response.data?.messages || [];
        const authorizationError = messages.some((message: any) => message.code === '403' || message.code === '401');

        if (authorizationError) {
            const submodel = {
                id: submodelId,
                idShort: 'Submodel Not Authorized!',
                modelType: 'Submodel',
                semanticId: null,
                description: [],
                displayName: [],
                submodelElements: [],
                isActive: false,
                path: path,
                authorizationError: true,
            };

            return submodel;
        }

        if (text.trim().length > 0) {
            navigationStore.dispatchSnackbar({
                status: true,
                timeout: 60000,
                color: 'error',
                btnColor: 'buttonText',
                text: text,
            });
        }
        const submodel = {
            id: submodelId,
            idShort: 'Submodel not found',
            modelType: 'Submodel',
            semanticId: null,
            description: [],
            displayName: [],
            submodelElements: [],
            isActive: false,
            path: path,
            authorizationError: false,
        };
        return submodel;
    }

    return {
        fetchSmList,
        fetchSmById,
        fetchSm,
        fetchSme,
        fetchAndDispatchSme,
        smNotFound,
    };
}
