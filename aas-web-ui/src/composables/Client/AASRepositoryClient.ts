import { types as aasTypes } from '@aas-core-works/aas-core3.0-typescript';
import { jsonization } from '@aas-core-works/aas-core3.0-typescript';
import { computed } from 'vue';
import { useAASRegistryClient } from '@/composables/Client/AASRegistryClient';
import { useIDUtils } from '@/composables/IDUtils';
import { useRequestHandling } from '@/composables/RequestHandling';
import { useNavigationStore } from '@/store/NavigationStore';
import { extractEndpointHref } from '@/utils/DescriptorUtils';
import { base64Encode } from '@/utils/EncodeDecodeUtils';
import { downloadFile } from '@/utils/generalUtils';

export function useAASRepositoryClient() {
    const { getRequest, postRequest, putRequest, deleteRequest } = useRequestHandling();
    const { fetchAasDescriptorById, isAvailableById: isAvailableByIdInRegistry } = useAASRegistryClient();

    // Composables
    const { generateUUIDFromString } = useIDUtils();

    const navigationStore = useNavigationStore();

    const aasRepositoryUrl = computed(() => navigationStore.getAASRepoURL);

    const uploadURL = computed(() => {
        const aasRepoURL = navigationStore.getAASRepoURL;
        // remove '/shells' AAS Repository URL and add '/upload' to construct the upload URL
        // TODO: This is a workaround, as the AAS Repository does not provide an upload endpoint but rather the AAS Environment. This should be changed in the future.
        return aasRepoURL.replace('/shells', '') + '/upload';
    });

    /**
     * Fetches a list of all available Asset Administration Shells (AAS).
     *
     * @async
     * @returns {Promise<Array<any>>} A promise that resolves to an array of Asset Administration Shells.
     * An empty array is returned if the request fails or no AAS are found.
     */
    async function fetchAasList(): Promise<Array<any>> {
        const failResponse = [] as Array<any>;

        if (aasRepositoryUrl.value.trim() === '') return failResponse;

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
                const aasList = aasRepoResponse.data.result;
                return aasList;
            }
        } catch {
            return failResponse;
        }
        return failResponse;
    }

    /**
     * Fetches a Asset Administration Shell (AAS) by the provided AAS ID.
     *
     * @async
     * @param {string} aasId - The ID of the AAS to fetch.
     * @returns {Promise<any>} A promise that resolves to an AAS.
     */
    async function fetchAasById(aasId: string): Promise<any> {
        const failResponse = {} as any;

        if (!aasId) return failResponse;

        aasId = aasId.trim();

        if (aasId === '') return failResponse;

        // TODO fetchAasById just with the repository (e.g. if registry is not available)
        const aasDescriptor = await fetchAasDescriptorById(aasId);

        if (aasDescriptor && Object.keys(aasDescriptor).length > 0) {
            const aasEndpoint = extractEndpointHref(aasDescriptor, 'AAS-3.0');
            return fetchAas(aasEndpoint);
        }

        return failResponse;
    }

    /**
     * Fetches a Asset Administration Shell (AAS) by the provided AAS endpoint.
     *
     * @async
     * @param {string} aasEndpoint - The endpoint URL of the AAS to fetch.
     * @returns {Promise<any>} A promise that resolves to the AAS.
     */
    async function fetchAas(aasEndpoint: string): Promise<any> {
        const failResponse = {} as any;

        if (!aasEndpoint) return failResponse;

        aasEndpoint = aasEndpoint.trim();

        if (aasEndpoint === '') return failResponse;

        const aasRepoPath = aasEndpoint;
        const aasRepoContext = 'retrieving AAS';
        const disableMessage = true;
        try {
            const aasRepoResponse = await getRequest(aasRepoPath, aasRepoContext, disableMessage);
            if (aasRepoResponse?.success && aasRepoResponse?.data && Object.keys(aasRepoResponse?.data).length > 0) {
                const aas = aasRepoResponse.data;

                // Add endpoint to AAS
                aas.endpoints = [{ protocolInformation: { href: aasEndpoint }, interface: 'AAS-3.0' }];

                return aas;
            }
        } catch {
            return failResponse;
        }

        return failResponse;
    }

    /**
     * Checks if Asset Administration Shell (AAS) with provided ID is available (in registry or repository).
     *
     * @async
     * @param {string} aasId - The ID of the AAS to check.
     * @returns {Promise<boolean>} A promise that resolves to `true` if AAS with provided ID is available, otherwise `false`.
     */
    async function isAvailableById(aasId: string): Promise<boolean> {
        const failResponse = false;

        if (!aasId) return failResponse;

        aasId = aasId.trim();

        if (aasId === '') return failResponse;

        // First check the registry
        if (await isAvailableByIdInRegistry(aasId)) return true;
        // Second check the repository (e.g. if registry is no available)
        if (await isAvailableByIdInRepo(aasId)) return true;

        return failResponse;
    }

    /**
     * Checks if Asset Administration Shell with provided ID is available (in repository)
     *
     * @async
     * @param {string} aasId - The ID of the AAS to check.
     * @returns {Promise<boolean>} A promise that resolves to `true` if AAS with provided ID is available, otherwise `false`.
     */
    async function isAvailableByIdInRepo(aasId: string): Promise<boolean> {
        const failResponse = false;

        if (!aasId) return failResponse;

        aasId = aasId.trim();

        if (aasId === '') return failResponse;

        const aas = await fetchAasById(aasId);

        if (aas && Object.keys(aas).length > 0) return true;

        return failResponse;
    }

    /**
     * Checks if Asset Administration Shell (AAS) is available (in repository) by the provided AAS endpoint
     *
     * @async
     * @param {string} aasEndpoint - The endpoint URL of the AAS to check.
     * @returns {Promise<boolean>} A promise that resolves to `true` if AAS with provided ID is available, otherwise `false`.
     */
    async function isAvailable(aasEndpoint: string): Promise<boolean> {
        const failResponse = false;

        if (!aasEndpoint) return failResponse;

        aasEndpoint = aasEndpoint.trim();

        if (aasEndpoint === '') return failResponse;

        const aasRepoPath = aasEndpoint;
        const aasRepoContext = 'evaluating AAS Status';
        const disableMessage = true;
        try {
            const aasRepoResponse = await getRequest(aasRepoPath, aasRepoContext, disableMessage);
            if (aasRepoResponse?.success && aasRepoResponse?.data && Object.keys(aasRepoResponse?.data).length > 0) {
                return true;
            }
        } catch {
            return failResponse;
        }

        return failResponse;
    }

    /**
     * Fetches asset information by Asset Administration Shell (AAS) ID.
     *
     * @async
     * @param {string} aasId - The ID of the AAS to check.
     * @returns {Promise<any>} A promise that resolves to the asset information if found, otherwise an empty object.
     */
    async function fetchAssetInformationById(aasId: string): Promise<any> {
        const failResponse = {} as any;

        if (!aasId) return failResponse;

        aasId = aasId.trim();

        if (aasId === '') return failResponse;

        const aasDescriptor = await fetchAasDescriptorById(aasId);

        if (!aasDescriptor || Object.keys(aasDescriptor).length === 0) return failResponse;

        const aasEndpoint = extractEndpointHref(aasDescriptor, 'AAS-3.0');

        return fetchAssetInformation(aasEndpoint) || failResponse;
    }

    /**
     * Fetches asset information by Asset Administration Shell (AAS) endpoint URL.
     *
     * @async
     * @param {string} aasEndpoint - The endpoint URL of the AAS.
     * @returns {Promise<any>} A promise that resolves to the asset information if found, otherwise an empty object.
     */
    async function fetchAssetInformation(aasEndpoint: string): Promise<any> {
        const failResponse = {} as any;

        if (!aasEndpoint) return failResponse;

        aasEndpoint = aasEndpoint.trim();

        if (aasEndpoint === '') return failResponse;

        const assetInformationEndpoint = aasEndpoint + '/asset-information';

        const aasRepoPath = assetInformationEndpoint;
        const aasRepoContext = 'retrieving asset information';
        const disableMessage = true;
        try {
            const aasRepoResponse = await getRequest(aasRepoPath, aasRepoContext, disableMessage);
            if (aasRepoResponse?.success && aasRepoResponse?.data && Object.keys(aasRepoResponse?.data).length > 0) {
                const assetInformation = aasRepoResponse.data;
                if (
                    assetInformation.defaultThumbnail &&
                    assetInformation.defaultThumbnail.path &&
                    !assetInformation.defaultThumbnail.path.startsWith('http')
                ) {
                    // TODO: This does not work with active keycloak because there the thumbnail would have to be fetched with a token
                    const assetInformationThumbnailEndpoint = assetInformationEndpoint + '/thumbnail';
                    assetInformation.defaultThumbnail.path = assetInformationThumbnailEndpoint;
                }

                return assetInformation;
            }
        } catch {
            return failResponse;
        }

        return failResponse;
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
        const response = await postRequest(path, formData, headers, context, disableMessage);
        if (response.success) {
            navigationStore.dispatchSnackbar({
                status: true,
                timeout: 4000,
                color: 'success',
                btnColor: 'buttonText',
                text: 'AASX-File uploaded.',
            }); // Show Success Snackbar
            navigationStore.dispatchTriggerAASListReload(); // Reload AAS List
        }

        return response;
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

        const response = await postRequest(path, body, headers, context, disableMessage);
        if (response.success) {
            navigationStore.dispatchSnackbar({
                status: true,
                timeout: 4000,
                color: 'success',
                btnColor: 'buttonText',
                text: 'AAS successfully created',
            }); // Show Success Snackbar
            navigationStore.dispatchTriggerAASListReload(); // Reload AAS List
        }
    }

    async function putAas(aas: aasTypes.AssetAdministrationShell) {
        // Convert AAS to JSON
        const jsonAas = jsonization.toJsonable(aas);
        // console.log('putAas()', jsonAas);

        const context = 'updating AAS';
        const disableMessage = false;
        const path = aasRepositoryUrl.value + '/' + base64Encode(aas.id);
        const headers = new Headers();
        headers.append('Content-Type', 'application/json');
        const body = JSON.stringify(jsonAas);

        const response = await putRequest(path, body, headers, context, disableMessage);
        if (response.success) {
            navigationStore.dispatchSnackbar({
                status: true,
                timeout: 4000,
                color: 'success',
                btnColor: 'buttonText',
                text: 'AAS successfully updated',
            }); // Show Success Snackbar
        }
    }

    async function putThumbnail(thumbnail: File, aasId: string) {
        if (!aasId) return;

        aasId = aasId.trim();

        if (aasId === '') return;

        // Create formData
        const formData = new FormData();
        formData.append('file', thumbnail);

        const context = 'uploading thumbnail';
        const disableMessage = false;
        const path =
            aasRepositoryUrl.value +
            '/' +
            base64Encode(aasId) +
            '/asset-information/thumbnail' +
            '?fileName=' +
            thumbnail.name;
        const headers = new Headers();
        const body = formData;

        // Send Request to upload the file
        await putRequest(path, body, headers, context, disableMessage);
    }

    async function getSubmodelRefsById(aasId: string): Promise<Array<any>> {
        const failResponse = [] as Array<any>;

        if (!aasId) return failResponse;

        aasId = aasId.trim();

        if (aasId === '') return failResponse;

        const aasDescriptor = await fetchAasDescriptorById(aasId);

        if (!aasDescriptor || Object.keys(aasDescriptor).length === 0) return failResponse;

        const aasEndpoint = extractEndpointHref(aasDescriptor, 'AAS-3.0');
        return getSubmodelRefs(aasEndpoint) || failResponse;
    }

    async function getSubmodelRefs(aasEndpoint: string): Promise<Array<any>> {
        const failResponse = [] as Array<any>;

        if (!aasEndpoint) return failResponse;

        aasEndpoint = aasEndpoint.trim();

        if (aasEndpoint === '') return failResponse;

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

    async function deleteSubmodelRef(aasPath: string, submodelId: string): Promise<void> {
        if (aasPath.trim() === '' || submodelId.trim() === '') return;

        const path = aasPath + '/submodel-refs/' + base64Encode(submodelId);
        const context = 'deleting Submodel Reference';
        const disableMessage = false;
        await deleteRequest(path, context, disableMessage);
    }

    async function downloadAasx(aas: any): Promise<void> {
        if (!aas || Object.keys(aas).length === 0 || !aas.id) return;

        let aasId = aas.id;

        if (!aasId) return;

        aasId = aasId.trim();

        if (aasId === '') return;

        const submodelRefList = await getSubmodelRefsById(aasId);

        if (Array.isArray(submodelRefList) && submodelRefList.length > 0) {
            const submodelIds = submodelRefList.map((submodelRef: any) => submodelRef?.keys[0]?.value);

            let aasSerializationPath = aasRepositoryUrl.value.substring(0, aasRepositoryUrl.value.lastIndexOf('/')); // strips everything after the last slash from aasRepositoryUrl (http://localhost:8081/shells -> http://localhost:8081)

            // e.g. http://localhost:8081/serialization?aasIds=abc&submodelIds=def&submodelIds=ghi&includeConceptDescriptions=true)
            aasSerializationPath +=
                '/serialization?aasIds=' +
                base64Encode(aasId) +
                '&submodelIds=' +
                submodelIds.map((submodelId: string) => base64Encode(submodelId)).join('&submodelIds=') +
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

    async function downloadAasxByEndpoint(aasEndpoint: string): Promise<void> {
        if (!aasEndpoint) return;

        aasEndpoint = aasEndpoint.trim();

        if (aasEndpoint === '') return;

        const aas = fetchAas(aasEndpoint);

        if (!aas || Object.keys(aas).length === 0) return;

        downloadAasx(aas);
    }

    async function downloadAasxById(aasId: any): Promise<void> {
        if (!aasId) return;

        aasId = aasId.trim();

        if (aasId === '') return;

        const aas = fetchAasById(aasId);

        if (!aas || Object.keys(aas).length === 0) return;

        downloadAasx(aas);
    }

    return {
        fetchAasList,
        fetchAasById,
        fetchAas,
        isAvailableById,
        isAvailableByIdInRepo,
        isAvailable,
        fetchAssetInformation,
        fetchAssetInformationById,
        uploadAas,
        postAas,
        putAas,
        putThumbnail,
        downloadAasx,
        downloadAasxByEndpoint,
        downloadAasxById,
        getSubmodelRefs,
        getSubmodelRefsById,
        deleteSubmodelRef,
    };
}
