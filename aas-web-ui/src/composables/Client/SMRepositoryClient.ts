import { types as aasTypes } from '@aas-core-works/aas-core3.0-typescript';
import { jsonization } from '@aas-core-works/aas-core3.0-typescript';
import { computed } from 'vue';
import { useIDUtils } from '@/composables/IDUtils';
import { useRequestHandling } from '@/composables/RequestHandling';
import { useNavigationStore } from '@/store/NavigationStore';
import { base64Encode } from '@/utils/EncodeDecodeUtils';
import { stripLastCharacter } from '@/utils/StringUtils';

export function useSMRepositoryClient() {
    // Stores
    const navigationStore = useNavigationStore();

    // Composables
    const { getRequest, postRequest, putRequest, deleteRequest } = useRequestHandling();
    const { generateUUIDFromString } = useIDUtils();

    const endpointPath = '/submodels';

    // Computed Properties
    const submodelRepoUrl = computed(() => navigationStore.getSubmodelRepoURL);

    /**
     * Fetches a list of all available Submodels (SMs).
     *
     * @async
     * @returns {Promise<Array<any>>} A promise that resolves to an array of SMs.
     * An empty array is returned if the request fails or no SMs are found.
     */
    async function fetchSmList(): Promise<Array<any>> {
        const failResponse = [] as Array<any>;

        let smRepoUrl = submodelRepoUrl.value.trim();
        if (smRepoUrl === '') return failResponse;
        if (smRepoUrl.endsWith('/')) smRepoUrl = stripLastCharacter(smRepoUrl);
        if (!smRepoUrl.endsWith(endpointPath)) smRepoUrl += endpointPath;

        const smRepoPath = smRepoUrl;
        const smRepoContext = 'retrieving all SMs';
        const disableMessage = false;
        try {
            const smRepoResponse = await getRequest(smRepoPath, smRepoContext, disableMessage);
            if (smRepoResponse.success && smRepoResponse.data.result && smRepoResponse.data.result.length > 0) {
                return smRepoResponse.data.result;
            }
        } catch (e) {
            console.warn(e);
            return failResponse;
        }

        return failResponse;
    }

    /**
     * Fetches a Submodel (SM) by the provided SM ID.
     *
     * @async
     * @param {string} smId - The ID of the SM to fetch.
     * @returns {Promise<any>} A promise that resolves to a SM.
     */
    async function fetchSmById(smId: string): Promise<any> {
        const failResponse = {} as any;

        if (!smId) return failResponse;

        smId = smId.trim();

        if (smId === '') return failResponse;

        const smEndpoint = getSmEndpointById(smId);

        if (smEndpoint && smEndpoint.trim() !== '') return fetchSm(smEndpoint.trim());

        return failResponse;
    }

    /**
     * Fetches a Submodel (SM) by the provided SM endpoint.
     *
     * @async
     * @param {string} smEndpoint - The endpoint URL of the SM to fetch.
     * @returns {Promise<any>} A promise that resolves to a SM.
     */
    async function fetchSm(smEndpoint: string): Promise<any> {
        const failResponse = {} as any;

        if (!smEndpoint) return failResponse;

        smEndpoint = smEndpoint.trim();

        if (smEndpoint === '') return failResponse;

        if (smEndpoint.includes('/submodel-elements/')) {
            // smEndoint seems to be an SME endpoint
            return fetchSme(smEndpoint);
        }

        const smRepoPath = smEndpoint;
        const smRepoContext = 'retrieving SM';
        const disableMessage = true;
        try {
            const smRepoResponse = await getRequest(smRepoPath, smRepoContext, disableMessage);
            const smRepoMessages = smRepoResponse.data?.messages || [];
            const smRepoAuthorizationError = smRepoMessages.some(
                (message: any) => message.code === '403' || message.code === '401'
            );

            if (smRepoAuthorizationError) {
                return {
                    id: generateUUIDFromString(smEndpoint),
                    idShort: 'Submodel Not Authorized!',
                    modelType: 'Submodel',
                    semanticId: null,
                    description: [],
                    displayName: [],
                    submodelElements: [],
                    path: smEndpoint,
                    endpoints: [{ protocolInformation: { href: smEndpoint }, interface: 'SUBMODEL-3.0' }],
                };
            }

            if (smRepoResponse?.success && smRepoResponse?.data && Object.keys(smRepoResponse?.data).length > 0) {
                const sm = smRepoResponse.data;

                // Add endpoint to SM
                sm.endpoints = [{ protocolInformation: { href: smEndpoint }, interface: 'SUBMODEL-3.0' }];

                return sm;
            } else {
                return {
                    id: generateUUIDFromString(smEndpoint),
                    idShort: 'Submodel not found',
                    modelType: 'Submodel',
                    semanticId: null,
                    description: [],
                    displayName: [],
                    submodelElements: [],
                    path: smEndpoint,
                    endpoints: [{ protocolInformation: { href: smEndpoint }, interface: 'SUBMODEL-3.0' }],
                };
            }
        } catch (e) {
            console.warn(e);
            return failResponse;
        }
    }

    /**
     * Fetches a Submodel Element (SME) by the provided SME path.
     *
     * @async
     * @param {string} smePath - The path URL of the SME to fetch.
     * @returns {Promise<any>} A promise that resolves to a SM.
     */
    async function fetchSme(smePath: string): Promise<any> {
        const failResponse = {} as any;

        if (!smePath) return failResponse;

        smePath = smePath.trim();

        if (smePath === '') return failResponse;

        if (!smePath.includes('/submodel-elements/')) {
            // No valid SME path, maybe just SM endpoint
            return fetchSm(smePath);
        }

        const smRepoPath = smePath;
        const smRepoContext = 'retrieving SME';
        const disableMessage = true;
        try {
            const smRepoResponse = await getRequest(smRepoPath, smRepoContext, disableMessage);
            if (smRepoResponse?.success && smRepoResponse?.data && Object.keys(smRepoResponse?.data).length > 0) {
                const sme = smRepoResponse.data;
                return sme;
            }
        } catch (e) {
            console.warn(e);
            return failResponse;
        }

        return failResponse;
    }

    /**
     * Checks if Submodel with provided ID is available (in repository)
     *
     * @async
     * @param {string} smId - The ID of the SM to check.
     * @returns {Promise<boolean>} A promise that resolves to `true` if SM with provided ID is available, otherwise `false`.
     */
    async function smIsAvailableById(smId: string): Promise<boolean> {
        const failResponse = false;

        if (!smId) return failResponse;

        smId = smId.trim();

        if (smId === '') return failResponse;

        const smEndpoint = getSmEndpointById(smId);

        if (smEndpoint && smEndpoint.trim() !== '') return await smIsAvailable(smEndpoint.trim());

        return failResponse;
    }

    /**
     * Checks if Submodel (SM) is available for provided SM endpoint
     *
     * @async
     * @param {string} smEndpopint - The endpoint URL of the SM to check.
     * @returns {Promise<boolean>} A promise that resolves to `true` if SM with provided endpoint is available, otherwise `false`.
     */
    async function smIsAvailable(smEndpopint: string): Promise<boolean> {
        const failResponse = false;

        if (!smEndpopint) return failResponse;

        smEndpopint = smEndpopint.trim();

        if (smEndpopint === '') return failResponse;

        const smRepoPath = smEndpopint;
        const smRepoContext = 'evaluating SM Status';
        const disableMessage = true;

        try {
            const smRepoResponse = await getRequest(smRepoPath, smRepoContext, disableMessage);
            if (smRepoResponse?.success && smRepoResponse?.data && Object.keys(smRepoResponse?.data).length > 0) {
                return true;
            }
        } catch (e) {
            console.warn(e);
            return failResponse;
        }

        return failResponse;
    }

    /**
     * Checks if Submodel Element (SME) is available for provided SME path
     *
     * @async
     * @param {string} smePath - The path of the SME to check.
     * @returns {Promise<boolean>} A promise that resolves to `true` if SME with provided path is available, otherwise `false`.
     */
    async function smeIsAvailable(smePath: string): Promise<boolean> {
        return smIsAvailable(smePath);
    }

    /**
     * Retrieves the Submodel (SM) endpoint URL by its ID.
     *
     * Just concats SM repository URL (from the store) with the Base64UrlEncoded provided SM ID.
     *
     * @param {string} smId - The ID of the SM to retrieve the endpoint for.
     * @returns {string} The SM endpoint.
     */
    function getSmEndpointById(smId: string): string {
        const failResponse = '';

        if (!smId) return failResponse;

        smId = smId.trim();

        if (smId === '') return failResponse;

        let smRepoUrl = submodelRepoUrl.value.trim();
        if (smRepoUrl === '') return failResponse;
        if (smRepoUrl.endsWith('/')) smRepoUrl = stripLastCharacter(smRepoUrl);
        if (!smRepoUrl.endsWith(endpointPath)) smRepoUrl += endpointPath;

        const smEndpoint = smRepoUrl + '/' + base64Encode(smId);

        return smEndpoint || failResponse;
    }

    async function postSubmodel(submodel: aasTypes.Submodel): Promise<boolean> {
        const failResponse = false;

        let smRepoUrl = submodelRepoUrl.value.trim();
        if (smRepoUrl === '') return failResponse;
        if (smRepoUrl.endsWith('/')) smRepoUrl = stripLastCharacter(smRepoUrl);
        if (!smRepoUrl.endsWith(endpointPath)) smRepoUrl += endpointPath;

        // Convert Submodel to JSON
        const jsonSubmodel = jsonization.toJsonable(submodel);
        // console.log('postSubmodel()', jsonSubmodel);

        const context = 'creating Submodel';
        const disableMessage = false;
        const path = smRepoUrl;
        const headers = new Headers();
        headers.append('Content-Type', 'application/json');
        const body = JSON.stringify(jsonSubmodel);

        const response = await postRequest(path, body, headers, context, disableMessage);
        return response.success;
    }

    async function putSubmodel(submodel: aasTypes.Submodel): Promise<boolean> {
        const failResponse = false;

        let smRepoUrl = submodelRepoUrl.value.trim();
        if (smRepoUrl === '') return failResponse;
        if (smRepoUrl.endsWith('/')) smRepoUrl = stripLastCharacter(smRepoUrl);
        if (!smRepoUrl.endsWith(endpointPath)) smRepoUrl += endpointPath;

        // Convert Submodel to JSON
        const jsonSubmodel = jsonization.toJsonable(submodel);
        // console.log('putSubmodel()', jsonSubmodel);

        const context = 'updating Submodel';
        const disableMessage = false;
        const path = smRepoUrl + '/' + base64Encode(submodel.id);
        const headers = new Headers();
        headers.append('Content-Type', 'application/json');
        const body = JSON.stringify(jsonSubmodel);

        const response = await putRequest(path, body, headers, context, disableMessage);
        return response.success;
    }

    async function deleteSubmodel(submodelId: string): Promise<boolean> {
        const failResponse = false;

        let smRepoUrl = submodelRepoUrl.value;
        if (smRepoUrl === '') return failResponse;
        if (smRepoUrl.endsWith('/')) smRepoUrl = stripLastCharacter(smRepoUrl);
        if (!smRepoUrl.endsWith(endpointPath)) smRepoUrl += endpointPath;

        const context = 'deleting Submodel';
        const disableMessage = false;
        const path = smRepoUrl + '/' + base64Encode(submodelId);

        const response = await deleteRequest(path, context, disableMessage);
        return response.success;
    }

    return {
        endpointPath,
        fetchSmList,
        fetchSmById,
        fetchSm,
        fetchSme,
        smIsAvailableById,
        smIsAvailable,
        smeIsAvailable,
        getSmEndpointById,
        postSubmodel,
        putSubmodel,
        deleteSubmodel,
    };
}
