import { types as aasTypes } from '@aas-core-works/aas-core3.0-typescript';
import { jsonization } from '@aas-core-works/aas-core3.0-typescript';
import { computed } from 'vue';
import { useSMRegistryClient } from '@/composables/Client/SMRegistryClient';
import { useRequestHandling } from '@/composables/RequestHandling';
import { useNavigationStore } from '@/store/NavigationStore';
import { extractEndpointHref } from '@/utils/AAS/DescriptorUtils';
import { base64Encode } from '@/utils/EncodeDecodeUtils';
import { stripLastCharacter } from '@/utils/StringUtils';

export function useSMRepositoryClient() {
    // Stores
    const navigationStore = useNavigationStore();

    // Composables
    const { getRequest, postRequest, putRequest, deleteRequest } = useRequestHandling();
    const { fetchSmDescriptorById, isAvailableById: isAvailableByIdInRegistry } = useSMRegistryClient();

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

        if (submodelRepoUrl.value.trim() === '') return failResponse;

        let smRepoUrl = submodelRepoUrl.value;
        if (smRepoUrl.trim() === '') return failResponse;
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
        } catch {
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

        const smDescriptor = await fetchSmDescriptorById(smId);

        if (smDescriptor && Object.keys(smDescriptor).length > 0) {
            // SM Descriptor found in registry
            const smEndpoint = extractEndpointHref(smDescriptor, 'SUBMODEL-3.0');
            const sm = await fetchSm(smEndpoint);
            sm.path = smEndpoint;
            return sm;
        } else if (!smDescriptor || Object.keys(smDescriptor).length === 0) {
            const smEndpoint = getSmEndpointById(smId);
            return fetchSm(smEndpoint);
        }

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
            if (smRepoResponse?.success && smRepoResponse?.data && Object.keys(smRepoResponse?.data).length > 0) {
                const sm = smRepoResponse.data;

                // Add endpoint to SM
                sm.endpoints = [{ protocolInformation: { href: smEndpoint }, interface: 'SUBMODEL-3.0' }];

                return sm;
            }
        } catch {
            return failResponse;
        }

        return failResponse;
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
        } catch {
            return failResponse;
        }

        return failResponse;
    }

    /**
     * Checks if Submodel with provided ID is available (in registry or repository).
     *
     * @async
     * @param {string} smId - The ID of the SM to check.
     * @returns {Promise<boolean>} A promise that resolves to `true` if SM with provided ID is available, otherwise `false`.
     */
    async function isAvailableById(smId: string): Promise<boolean> {
        const failResponse = false;

        if (!smId) return failResponse;

        smId = smId.trim();

        if (smId === '') return failResponse;

        // First check the registry
        if (await isAvailableByIdInRegistry(smId)) return true;
        // Second check the repository (e.g. if registry is no available)
        if (await isAvailableByIdInRepo(smId)) return true;

        return failResponse;
    }

    /**
     * Checks if Submodel with provided ID is available (in repository)
     *
     * @async
     * @param {string} smId - The ID of the SM to check.
     * @returns {Promise<boolean>} A promise that resolves to `true` if SM with provided ID is available, otherwise `false`.
     */
    async function isAvailableByIdInRepo(smId: string): Promise<boolean> {
        const failResponse = false;

        if (!smId) return failResponse;

        smId = smId.trim();

        if (smId === '') return failResponse;

        const sm = await fetchSmById(smId);

        if (sm && Object.keys(sm).length > 0) return true;

        return failResponse;
    }

    /**
     * Checks if Submodel (SM) is available (in repository) by the provided SM endpoint
     *
     * @async
     * @param {string} smEndpopint - The endpoint URL of the SM to check.
     * @returns {Promise<boolean>} A promise that resolves to `true` if SM with provided ID is available, otherwise `false`.
     */
    async function isAvailable(smEndpopint: string): Promise<boolean> {
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
        } catch {
            return failResponse;
        }

        return failResponse;
    }

    /**
     * Retrieves the Submodel (SM) endpoint URL by its ID.
     *
     * @param {string} smId - The ID of the SM to retrieve the endpoint for.
     * @returns {string} The SM endpoint.
     */
    function getSmEndpointById(smId: string): string {
        const failResponse = '';

        if (!smId) return failResponse;

        smId = smId.trim();

        if (smId === '') return failResponse;

        // AAS Descriptor not found in registry or registry not available
        if (submodelRepoUrl.value.trim() === '') return failResponse;

        let smRepoUrl = submodelRepoUrl.value;
        if (smRepoUrl.trim() === '') return failResponse;
        if (smRepoUrl.endsWith('/')) smRepoUrl = stripLastCharacter(smRepoUrl);
        if (!smRepoUrl.endsWith(endpointPath)) smRepoUrl += endpointPath;

        const smEndpoint = smRepoUrl + '/' + base64Encode(smId);

        return smEndpoint || failResponse;
    }

    async function postSubmodel(submodel: aasTypes.Submodel): Promise<boolean> {
        const failResponse = false;

        if (submodelRepoUrl.value.trim() === '') return failResponse;

        let smRepoUrl = submodelRepoUrl.value;
        if (smRepoUrl.trim() === '') return failResponse;
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

        if (submodelRepoUrl.value.trim() === '') return failResponse;

        let smRepoUrl = submodelRepoUrl.value;
        if (smRepoUrl.trim() === '') return failResponse;
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

        if (submodelRepoUrl.value.trim() === '') return failResponse;

        let smRepoUrl = submodelRepoUrl.value;
        if (smRepoUrl.trim() === '') return failResponse;
        if (smRepoUrl.endsWith('/')) smRepoUrl = stripLastCharacter(smRepoUrl);
        if (!smRepoUrl.endsWith(endpointPath)) smRepoUrl += endpointPath;

        const context = 'deleting Submodel';
        const disableMessage = false;
        const path = smRepoUrl + '/' + base64Encode(submodelId);

        const response = await deleteRequest(path, context, disableMessage);
        return response.success;
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
            // TODO should be moved to SMHandling/SMEHandling
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
        endpointPath,
        fetchSmList,
        fetchSmById,
        fetchSm,
        fetchSme,
        isAvailableById,
        isAvailableByIdInRepo,
        isAvailable,
        getSmEndpointById,
        postSubmodel,
        putSubmodel,
        deleteSubmodel,
        smNotFound,
    };
}
