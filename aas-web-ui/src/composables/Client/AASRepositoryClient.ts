import { types as aasTypes } from '@aas-core-works/aas-core3.0-typescript';
import { jsonization } from '@aas-core-works/aas-core3.0-typescript';
import { computed } from 'vue';
import { useIDUtils } from '@/composables/IDUtils';
import { useRequestHandling } from '@/composables/RequestHandling';
import { useNavigationStore } from '@/store/NavigationStore';
import { base64Encode } from '@/utils/EncodeDecodeUtils';
import { downloadFile } from '@/utils/generalUtils';
import { stripLastCharacter } from '@/utils/StringUtils';

export function useAASRepositoryClient() {
    // Stores
    const navigationStore = useNavigationStore();

    // Composables
    const { getRequest, postRequest, putRequest, deleteRequest } = useRequestHandling();
    const { generateUUIDFromString } = useIDUtils();

    const endpointPath = '/shells';

    // Computed Properties
    const aasRepositoryUrl = computed(() => navigationStore.getAASRepoURL);
    const uploadURL = computed(() => {
        let aasRepoUrl = aasRepositoryUrl.value.trim();
        if (aasRepoUrl === '') return '';
        if (aasRepoUrl.endsWith('/')) aasRepoUrl = stripLastCharacter(aasRepoUrl);

        // remove '/shells' AAS Repository URL and add '/upload' to construct the upload URL
        // TODO: This is a workaround, as the AAS Repository does not provide an upload endpoint but rather the AAS Environment. This should be changed in the future.
        return aasRepoUrl.replace(endpointPath, '') + '/upload';
    });

    /**
     * Fetches a list of all available Asset Administration Shells (AAS).
     *
     * @async
     * @returns {Promise<Array<any>>} A promise that resolves to an array of AAS.
     * An empty array is returned if the request fails or no AAS are found.
     */
    async function fetchAasList(): Promise<Array<any>> {
        const failResponse = [] as Array<any>;

        let aasRepoUrl = aasRepositoryUrl.value.trim();
        if (aasRepoUrl === '') return failResponse;
        if (aasRepoUrl.endsWith('/')) aasRepoUrl = stripLastCharacter(aasRepoUrl);
        if (!aasRepoUrl.endsWith(endpointPath)) aasRepoUrl += endpointPath;

        const aasRepoPath = aasRepoUrl;
        const aasRepoContext = 'retrieving all AAS';
        const disableMessage = false;
        try {
            const aasRepoResponse = await getRequest(aasRepoPath, aasRepoContext, disableMessage);
            if (aasRepoResponse?.success && aasRepoResponse.data.result && aasRepoResponse.data.result.length > 0) {
                const aasList = aasRepoResponse.data.result;
                return aasList;
            }
        } catch (e) {
            console.warn(e);
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

        const aasEndpoint = getAasEndpointById(aasId);

        if (aasEndpoint && aasEndpoint.trim() !== '') return fetchAas(aasEndpoint.trim());

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
            const aasRepoMessages = aasRepoResponse.data?.messages || [];
            const aasRepoAuthorizationError = aasRepoMessages.some(
                (message: any) => message.code === '403' || message.code === '401'
            );

            if (aasRepoAuthorizationError) {
                return {
                    id: generateUUIDFromString(aasEndpoint),
                    idShort: 'AAS Not Authorized!',
                    modelType: 'AAS',
                    semanticId: null,
                    description: [],
                    displayName: [],
                    path: aasEndpoint,
                    endpoints: [{ protocolInformation: { href: aasEndpoint }, interface: 'AAS-3.0' }],
                };
            }

            if (aasRepoResponse?.success && aasRepoResponse?.data && Object.keys(aasRepoResponse?.data).length > 0) {
                const aas = aasRepoResponse.data;

                // Add endpoint to AAS
                aas.endpoints = [{ protocolInformation: { href: aasEndpoint }, interface: 'AAS-3.0' }];

                return aas;
            } else {
                return {
                    id: generateUUIDFromString(aasEndpoint),
                    idShort: 'AAS not found',
                    modelType: 'AAS',
                    semanticId: null,
                    description: [],
                    displayName: [],
                    submodelElements: [],
                    path: aasEndpoint,
                    endpoints: [{ protocolInformation: { href: aasEndpoint }, interface: 'AAS-3.0' }],
                };
            }
        } catch (e) {
            console.warn(e);
            return failResponse;
        }
    }

    /**
     * Checks if Asset Administration Shell with provided ID is available
     *
     * @async
     * @param {string} aasId - The ID of the AAS to check.
     * @returns {Promise<boolean>} A promise that resolves to `true` if AAS with provided ID is available, otherwise `false`.
     */
    async function aasIsAvailableById(aasId: string): Promise<boolean> {
        const failResponse = false;

        if (!aasId) return failResponse;

        aasId = aasId.trim();

        if (aasId === '') return failResponse;

        const aasEndpoint = getAasEndpointById(aasId);

        if (aasEndpoint && aasEndpoint.trim() !== '') return await aasIsAvailable(aasEndpoint.trim());

        return failResponse;
    }

    /**
     * Checks if Asset Administration Shell (AAS) is available for provided AAS endpoint
     *
     * @async
     * @param {string} aasEndpoint - The endpoint URL of the AAS to check.
     * @returns {Promise<boolean>} A promise that resolves to `true` if AAS with provided ID is available, otherwise `false`.
     */
    async function aasIsAvailable(aasEndpoint: string): Promise<boolean> {
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
        } catch (e) {
            console.warn(e);
            return failResponse;
        }

        return failResponse;
    }

    /**
     * Retrieves the Asset Administration Shell (AAS) endpoint URL by its ID.
     *
     * Just concats SM repository URL (from the store) with the Base64UrlEncoded provided AAS ID.
     *
     * @param {string} aasId - The ID of the AAS to retrieve the endpoint for.
     * @returns {string} The AAS endpoint.
     */
    function getAasEndpointById(aasId: string): string {
        const failResponse = '';

        if (!aasId) return failResponse;

        aasId = aasId.trim();

        if (aasId === '') return failResponse;

        let aasRepoUrl = aasRepositoryUrl.value.trim();
        if (aasRepoUrl === '') return failResponse;
        if (aasRepoUrl.endsWith('/')) aasRepoUrl = stripLastCharacter(aasRepoUrl);
        if (!aasRepoUrl.endsWith(endpointPath)) aasRepoUrl += endpointPath;

        const aasEndpoint = aasRepoUrl + '/' + base64Encode(aasId);

        return aasEndpoint || failResponse;
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

        const aasEndpoint = getAasEndpointById(aasId);

        if (aasEndpoint && aasEndpoint.trim() !== '') fetchAssetInformation(aasEndpoint.trim());

        return failResponse;
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
                    const assetInformationThumbnailEndpoint = assetInformationEndpoint + '/thumbnail';
                    assetInformation.defaultThumbnail.path = assetInformationThumbnailEndpoint;
                    assetInformation.defaultThumbnail.isExternal = false;
                } else if (assetInformation.defaultThumbnail) {
                    assetInformation.defaultThumbnail.isExternal = true;
                }

                return assetInformation;
            }
        } catch (e) {
            console.warn(e);
            return failResponse;
        }

        return failResponse;
    }

    // Upload an AAS to the AAS Repository
    async function uploadAas(aasFile: File, ignoreDuplicates: boolean): Promise<any> {
        const context = 'uploading AAS';
        const disableMessage = false;
        let path = uploadURL.value;
        if (ignoreDuplicates) path += '?ignore-duplicates=true';
        const headers = new Headers();
        const formData = new FormData();
        formData.append('file', aasFile);

        // Send Request to upload the file
        const response = await postRequest(path, formData, headers, context, disableMessage);
        return response;
    }

    async function postAas(aas: aasTypes.AssetAdministrationShell): Promise<boolean> {
        const failResponse = false;

        let aasRepoUrl = aasRepositoryUrl.value.trim();
        if (aasRepoUrl === '') return failResponse;
        if (aasRepoUrl.endsWith('/')) aasRepoUrl = stripLastCharacter(aasRepoUrl);
        if (!aasRepoUrl.endsWith(endpointPath)) aasRepoUrl += endpointPath;

        // Convert AAS to JSON
        const jsonAas = jsonization.toJsonable(aas);
        // console.log('postAas()', jsonAas);

        const context = 'creating AAS';
        const disableMessage = false;
        const path = aasRepoUrl;
        const headers = new Headers();
        headers.append('Content-Type', 'application/json');
        const body = JSON.stringify(jsonAas);

        const response = await postRequest(path, body, headers, context, disableMessage);
        return response.success;
    }

    async function putAas(aas: aasTypes.AssetAdministrationShell): Promise<boolean> {
        const failResponse = false;

        let aasRepoUrl = aasRepositoryUrl.value.trim();
        if (aasRepoUrl === '') return failResponse;
        if (aasRepoUrl.endsWith('/')) aasRepoUrl = stripLastCharacter(aasRepoUrl);
        if (!aasRepoUrl.endsWith(endpointPath)) aasRepoUrl += endpointPath;

        // Convert AAS to JSON
        const jsonAas = jsonization.toJsonable(aas);

        const context = 'updating AAS';
        const disableMessage = false;
        const path = aasRepoUrl + '/' + base64Encode(aas.id);
        const headers = new Headers();
        headers.append('Content-Type', 'application/json');
        const body = JSON.stringify(jsonAas);

        const response = await putRequest(path, body, headers, context, disableMessage);
        return response.success;
    }

    async function putThumbnail(thumbnail: File, aasId: string): Promise<boolean> {
        const failResponse = false;

        if (!aasId) return failResponse;

        aasId = aasId.trim();

        if (aasId === '') return failResponse;

        let aasRepoUrl = aasRepositoryUrl.value.trim();
        if (aasRepoUrl === '') return failResponse;
        if (aasRepoUrl.endsWith('/')) aasRepoUrl = stripLastCharacter(aasRepoUrl);
        if (!aasRepoUrl.endsWith(endpointPath)) aasRepoUrl += endpointPath;

        // Create formData
        const formData = new FormData();
        formData.append('file', thumbnail);

        const context = 'uploading thumbnail';
        const disableMessage = false;
        const path =
            aasRepoUrl + '/' + base64Encode(aasId) + '/asset-information/thumbnail' + '?fileName=' + thumbnail.name;
        const headers = new Headers();
        const body = formData;

        // Send Request to upload the file
        const response = await putRequest(path, body, headers, context, disableMessage);
        return response.success;
    }

    async function getSubmodelRefsById(aasId: string): Promise<Array<any>> {
        const failResponse = [] as Array<any>;

        if (!aasId) return failResponse;

        aasId = aasId.trim();

        if (aasId === '') return failResponse;

        const aasEndpoint = getAasEndpointById(aasId);

        if (aasEndpoint && aasEndpoint.trim() !== '') return getSubmodelRefs(aasEndpoint.trim());

        return failResponse;
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
        } catch (e) {
            console.warn(e);
            return failResponse;
        }

        return failResponse;
    }

    async function deleteSubmodelRef(aasPath: string, submodelId: string): Promise<void> {
        if (aasPath.trim() === '' || submodelId.trim() === '') return;

        const path = aasPath.trim() + '/submodel-refs/' + base64Encode(submodelId.trim());
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

        let aasRepoUrl = aasRepositoryUrl.value.trim();
        if (aasRepoUrl === '') return;
        if (aasRepoUrl.endsWith('/')) aasRepoUrl = stripLastCharacter(aasRepoUrl);

        const submodelRefList = await getSubmodelRefsById(aasId);

        if (Array.isArray(submodelRefList) && submodelRefList.length > 0) {
            const submodelIds = submodelRefList.map((submodelRef: any) => submodelRef?.keys[0]?.value);

            let aasSerializationPath = aasRepoUrl.substring(0, aasRepoUrl.lastIndexOf('/')); // strips everything after the last slash (http://localhost:8081/shells -> http://localhost:8081)

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
                    (aasIdShort && aasIdShort.trim() !== '' ? aasIdShort.trim() : generateUUIDFromString(aas.id)) +
                    '.aasx';

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
        endpointPath,
        fetchAasList,
        fetchAasById,
        fetchAas,
        aasIsAvailableById,
        aasIsAvailable,
        getAasEndpointById,
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
