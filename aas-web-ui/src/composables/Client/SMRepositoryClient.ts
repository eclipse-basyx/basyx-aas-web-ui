import { computed } from 'vue';
import { useSMRegistryClient } from '@/composables/Client/SMRegistryClient';
import { useRequestHandling } from '@/composables/RequestHandling';
import { useNavigationStore } from '@/store/NavigationStore';
import { extractEndpointHref } from '@/utils/DescriptorUtils';

export function useSMRepositoryClient() {
    const { getRequest } = useRequestHandling();
    const { fetchSmDescriptorById, isAvailableById: isAvailableByIdInRegistry } = useSMRegistryClient();

    const navigationStore = useNavigationStore();

    const submodelRepoUrl = computed(() => navigationStore.getSubmodelRepoURL);

    /**
     * Fetches a list of all available Submodels (SM).
     *
     * @returns {Promise<Array<any>>} A promise that resolves to an array of Submodels (SMs).
     * An empty array is returned if the request fails or no Submodels are found.
     */
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
            return failResponse;
        }

        return failResponse;
    }

    /**
     * Fetches a Submodel (SM) by the provided SM ID.
     *
     * @param {string} smId - The ID of the SM to fetch.
     */
    async function fetchSmById(smId: string): Promise<any> {
        const failResponse = {} as any;

        if (!smId || smId.trim() === '') return failResponse;
        smId = smId.trim();

        // TODO fetchSmById just with the repository (e.g. if registry is not available)
        const smDescriptor = await fetchSmDescriptorById(smId);

        if (smDescriptor && Object.keys(smDescriptor).length > 0) {
            const smEndpoint = extractEndpointHref(smDescriptor, 'SUBMODEL-3.0');
            return fetchSm(smEndpoint);
        }

        return failResponse;
    }

    /**
     * Fetches a Submodel (SM) by the provided SM endpoint.
     *
     * @param {string} smEndpoint - The endpoint URL of the SM to fetch.
     */
    async function fetchSm(smEndpoint: string): Promise<any> {
        const failResponse = {} as any;

        if (smEndpoint.trim() === '') return failResponse;

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
     * @param {string} smePath - The path URL of the SME to fetch.
     */
    async function fetchSme(smePath: string): Promise<any> {
        const failResponse = {} as any;

        if (!smePath || smePath.trim() === '') return failResponse;
        smePath = smePath.trim();

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
     * @param {string} smId - The ID of the SM to check.
     * @returns {Promise<boolean>} - A promise that resolves to `true` if SM with provided ID is available, otherwise `false`.
     */
    async function isAvailableById(smId: string): Promise<boolean> {
        const failResponse = false;

        if (!smId || smId.trim() === '') return failResponse;
        smId = smId.trim();

        // First check the registry
        if (await isAvailableByIdInRegistry(smId)) return true;
        // Second check the repository (e.g. if registry is no available)
        if (await isAvailableByIdInRepo(smId)) return true;

        return failResponse;
    }

    /**
     * Checks if Submodel with provided ID is available (in registry)
     *
     * @param {string} smId - The ID of the SM to check.
     * @returns {Promise<boolean>} - A promise that resolves to `true` if SM with provided ID is available, otherwise `false`.
     */
    async function isAvailableByIdInRepo(smId: string): Promise<boolean> {
        const failResponse = false;

        if (!smId || smId.trim() === '') return failResponse;
        smId = smId.trim();

        const sm = await fetchSmById(smId);

        if (sm && Object.keys(sm).length > 0) return true;

        return failResponse;
    }

    /**
     * Checks if Submodel (SM) ius available (in repository) by the provided SM endpoint
     *
     * @param {string} smEndpopint - The endpoint URL of the SM to check.
     * @returns {Promise<boolean>} - A promise that resolves to `true` if SM with provided ID is available, otherwise `false`.
     */
    async function isAvailable(smEndpopint: string): Promise<boolean> {
        const failResponse = false;

        if (!smEndpopint || smEndpopint.trim() === '') return failResponse;
        smEndpopint = smEndpopint.trim();

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
        fetchSmList,
        fetchSmById,
        fetchSm,
        fetchSme,
        isAvailableById,
        isAvailableByIdInRepo,
        isAvailable,
        smNotFound,
    };
}
