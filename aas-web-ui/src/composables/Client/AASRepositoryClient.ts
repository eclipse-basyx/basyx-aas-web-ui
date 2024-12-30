import { types as aasTypes } from '@aas-core-works/aas-core3.0-typescript';
import { jsonization } from '@aas-core-works/aas-core3.0-typescript';
import { computed } from 'vue';
import { useAASRegistryClient } from '@/composables/Client/AASRegistryClient';
import { useRequestHandling } from '@/composables/RequestHandling';
import { useAASStore } from '@/store/AASDataStore';
import { useNavigationStore } from '@/store/NavigationStore';
import { extractEndpointHref } from '@/utils/DescriptorUtils';

export function useAASRepositoryClient() {
    const { getRequest, postRequest } = useRequestHandling();
    const { fetchAasDescriptorById } = useAASRegistryClient();

    const aasStore = useAASStore();
    const navigationStore = useNavigationStore();

    const aasRepositoryUrl = computed(() => navigationStore.getAASRepoURL);

    const uploadURL = computed(() => {
        const aasRepoURL = navigationStore.getAASRepoURL;
        // remove '/shells' AAS Repository URL and add '/upload' to construct the upload URL
        // TODO: This is a workaround, as the AAS Repository does not provide an upload endpoint but rather the AAS Environment. This should be changed in the future.
        return aasRepoURL.replace('/shells', '') + '/upload';
    });

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

    // Upload an AAS to the AAS Repository
    async function uploadAas(aasFile: File) {
        const context = 'uploading AAS';
        const disableMessage = false;
        const path = uploadURL.value;
        const headers = new Headers();
        const formData = new FormData();
        formData.append('file', aasFile);

        // Send Request to upload the file
        postRequest(path, formData, headers, context, disableMessage).then((response: any) => {
            if (response.success) {
                navigationStore.dispatchSnackbar({
                    status: true,
                    timeout: 4000,
                    color: 'success',
                    btnColor: 'buttonText',
                    text: 'AASX-File uploaded.',
                }); // Show Success Snackbar
                navigationStore.dispatchTriggerAASListReload(true); // Reload AAS List
            }
        });
    }

    async function postAas(aas: aasTypes.AssetAdministrationShell) {
        // Convert AAS to JSON
        const jsonAas = jsonization.toJsonable(aas);
        console.log('postAas()', jsonAas);

        const context = 'creating AAS';
        const disableMessage = false;
        const path = aasRepositoryUrl.value;
        const headers = new Headers();
        headers.append('Content-Type', 'application/json');
        const body = JSON.stringify(jsonAas);

        // Send Request to upload the file
        postRequest(path, body, headers, context, disableMessage).then((response: any) => {
            if (response.success) {
                navigationStore.dispatchSnackbar({
                    status: true,
                    timeout: 4000,
                    color: 'success',
                    btnColor: 'buttonText',
                    text: 'AAS successfully created',
                }); // Show Success Snackbar
                navigationStore.dispatchTriggerAASListReload(true); // Reload AAS List
            }
        });
    }

    return {
        fetchAasList,
        fetchAasById,
        fetchAas,
        fetchAndDispatchAas,
        uploadAas,
        postAas,
    };
}
