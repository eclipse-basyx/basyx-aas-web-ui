import { types as aasTypes } from '@aas-core-works/aas-core3.0-typescript';
import { jsonization } from '@aas-core-works/aas-core3.0-typescript';
import { computed } from 'vue';
import { useAASRegistryClient } from '@/composables/Client/AASRegistryClient';
import { useRequestHandling } from '@/composables/RequestHandling';
import { useAASStore } from '@/store/AASDataStore';
import { useNavigationStore } from '@/store/NavigationStore';
import { extractEndpointHref } from '@/utils/DescriptorUtils';
import { URLEncode } from '@/utils/EncodeDecodeUtils';
import { downloadFile } from '@/utils/generalUtils';
import { generateUUIDFromString } from '@/utils/IDUtils';

export function useAASRepositoryClient() {
    const { getRequest, postRequest, putRequest } = useRequestHandling();
    const { fetchAasDescriptorById, fetchAasDescriptorList } = useAASRegistryClient();

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
            if (aasRepoResponse?.success && aasRepoResponse.data.result && aasRepoResponse.data.result.length > 0) {
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
        // console.log('postAas()', jsonAas);

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

    async function putAas(aas: aasTypes.AssetAdministrationShell) {
        // Convert AAS to JSON
        const jsonAas = jsonization.toJsonable(aas);
        // console.log('putAas()', jsonAas);

        const context = 'updating AAS';
        const disableMessage = false;
        const path = aasRepositoryUrl.value + '/' + URLEncode(aas.id);
        const headers = new Headers();
        headers.append('Content-Type', 'application/json');
        const body = JSON.stringify(jsonAas);

        // Send Request to upload the file
        putRequest(path, body, headers, context, disableMessage).then((response: any) => {
            if (response.success) {
                navigationStore.dispatchSnackbar({
                    status: true,
                    timeout: 4000,
                    color: 'success',
                    btnColor: 'buttonText',
                    text: 'AAS successfully updated',
                }); // Show Success Snackbar
            }
        });
    }

    async function putThumbnail(thumbnail: File, aasId: string) {
        // console.log('putThumbnail()', thumbnail);
        // Create formData
        const formData = new FormData();
        formData.append('file', thumbnail);

        const context = 'uploading thumbnail';
        const disableMessage = false;
        const path =
            aasRepositoryUrl.value +
            '/' +
            URLEncode(aasId) +
            '/asset-information/thumbnail' +
            '?fileName=' +
            thumbnail.name;
        const headers = new Headers();
        const body = formData;

        // Send Request to upload the file
        putRequest(path, body, headers, context, disableMessage);
    }

    // Checks weather an AAS is available
    // Checks availability in AAS Repo
    // Checks availability in AAS Registry and AAS Repo if AAS Registry is available
    async function aasIsAvailableById(aasId: string): Promise<boolean> {
        // console.log('aasIsAvailableById()', aasId);
        const failResponse = false;

        if (aasId.trim() === '') return failResponse;

        const aasDescriptorList = await fetchAasDescriptorList();
        const aasList = await fetchAasList();

        if (aasList && Array.isArray(aasList) && aasList.length > 0) {
            // Check availability of AAS in AAS Repo
            const aasFound = aasList.find((aas: any) => {
                return aas.id == aasId;
            });

            if (aasFound && Object.keys(aasFound).length > 0) {
                if (aasDescriptorList && Array.isArray(aasDescriptorList) && aasDescriptorList.length > 0) {
                    // Check availability of AAS in AAS Registry
                    const aasDescriptorFound = aasDescriptorList.find((aasDescriptor: any) => {
                        return aasDescriptor.id == aasId;
                    });

                    if (aasDescriptorFound && Object.keys(aasDescriptorFound).length > 0) {
                        return true; // AAS found in AAS Registry and AAS Repo
                    }

                    return failResponse;
                }
                return true; // AAS only found in AAS Repo (AAS Registry not available)
            }
        }

        return failResponse;
    }

    async function getSubmodelRefsById(aasId: string): Promise<Array<any>> {
        const failResponse = [] as Array<any>;

        if (aasId.trim() === '') return failResponse;

        const aasDescriptor = await fetchAasDescriptorById(aasId);

        if (aasDescriptor && Object.keys(aasDescriptor).length > 0) {
            const aasEndpoint = extractEndpointHref(aasDescriptor, 'AAS-3.0');
            return getSubmodelRefs(aasEndpoint);
        }

        return failResponse;
    }

    async function getSubmodelRefs(aasEndpoint: string): Promise<Array<any>> {
        const failResponse = [] as Array<any>;

        if (aasEndpoint.trim() === '') return failResponse;

        const aasRepoPath = aasEndpoint + '/submodel-refs';
        const aasRepoContext = 'retrieving Submodel References';
        const disableMessage = true;
        try {
            const aasRepoResponse = await getRequest(aasRepoPath, aasRepoContext, disableMessage);
            if (
                aasRepoResponse?.success &&
                aasRepoResponse?.data &&
                Object.keys(aasRepoResponse?.data).length > 0 &&
                aasRepoResponse?.data?.result &&
                Array.isArray(aasRepoResponse?.data?.result) &&
                aasRepoResponse?.data?.result.length > 0
            ) {
                const submodelRefList = aasRepoResponse.data.result;
                return submodelRefList;
            }
        } catch {
            return failResponse;
        }

        return failResponse;
    }

    async function downloadAasx(aas: any) {
        // console.log('downloadAasx() ', 'aas', aas);
        if (!aas || Object.keys(aas).length === 0 || !aas.id || aas.id.trim() === '') return;

        const aasId = aas.id;

        const submodelRefList = await getSubmodelRefsById(aasId);

        if (Array.isArray(submodelRefList) && submodelRefList.length > 0) {
            const submodelIds = submodelRefList.map((submodelRef: any) => submodelRef?.keys[0]?.value);

            let aasSerializationPath = aasRepositoryUrl.value.substring(0, aasRepositoryUrl.value.lastIndexOf('/')); // strips everything after the last slash from aasRepositoryUrl (http://localhost:8081/shells -> http://localhost:8081)

            // e.g. http://localhost:8081/serialization?aasIds=abc&submodelIds=def&submodelIds=ghi&includeConceptDescriptions=true)
            aasSerializationPath +=
                '/serialization?aasIds=' +
                URLEncode(aasId) +
                '&submodelIds=' +
                submodelIds.map((submodelId: string) => URLEncode(submodelId)).join('&submodelIds=') +
                '&includeConceptDescriptions=true';

            const aasSerializationContext = 'retrieving AAS serialization';
            const disableMessage = false;
            const aasSerializationHeaders = new Headers();
            aasSerializationHeaders.append('Accept', 'application/asset-administration-shell-package+xml');

            const aasSerializationResponse = await getRequest(
                aasSerializationPath,
                aasSerializationContext,
                disableMessage,
                aasSerializationHeaders
            );
            if (aasSerializationResponse.success) {
                const aasSerialization = aasSerializationResponse.data;

                const aasIdShort = aas?.idShort;

                const filename =
                    (aasIdShort && aasIdShort.trim() !== '' ? aasIdShort : generateUUIDFromString(aas.id)) + '.aasx';

                downloadFile(filename, aasSerialization);
            }
        }
    }

    async function downloadAasxByEndpoint(aasEndpoint: any) {
        // console.log('downloadAasxByEndpoint() ', 'aasId', aasId);
        if (aasEndpoint.trim() === '') return;

        const aas = fetchAas(aasEndpoint);

        downloadAasx(aas);
    }

    async function downloadAasxById(aasId: any) {
        // console.log('downloadAasx() ', 'aasId', aasId);
        if (aasId.trim() === '') return;

        const aas = fetchAasById(aasId);

        downloadAasx(aas);
    }

    return {
        fetchAasList,
        fetchAasById,
        fetchAas,
        fetchAndDispatchAas,
        uploadAas,
        aasIsAvailableById,
        postAas,
        putAas,
        putThumbnail,
        downloadAasx,
        downloadAasxByEndpoint,
        downloadAasxById,
        getSubmodelRefs,
        getSubmodelRefsById,
    };
}
