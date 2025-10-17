import { computed } from 'vue';
import { useRequestHandling } from '@/composables/RequestHandling';
import { useNavigationStore } from '@/store/NavigationStore';
import { base64Encode } from '@/utils/EncodeDecodeUtils';
import { stripLastCharacter } from '@/utils/StringUtils';

export function useCDRepositoryClient() {
    // Stores
    const navigationStore = useNavigationStore();

    // Composables
    const { getRequest } = useRequestHandling();

    const endpointPath = '/concept-descriptions';

    // Computed Properties
    const conceptDescriptionRepoUrl = computed(() => navigationStore.getConceptDescriptionRepoURL);

    /**
     * Fetches a list of all available Concept Descriptions (CDs).
     *
     * @async
     * @returns {Promise<Array<any>>} A promise that resolves to an array of CDs.
     * An empty array is returned if the request fails or no CDs are found.
     */
    async function fetchCdList(): Promise<Array<any>> {
        const failResponse = [] as Array<any>;

        if (conceptDescriptionRepoUrl.value.trim() === '') return failResponse;

        let cdRepoUrl = conceptDescriptionRepoUrl.value;
        if (cdRepoUrl.trim() === '') return failResponse;
        if (cdRepoUrl.endsWith('/')) cdRepoUrl = stripLastCharacter(cdRepoUrl);
        if (!cdRepoUrl.endsWith(endpointPath)) cdRepoUrl += endpointPath;

        const cdRepoPath = cdRepoUrl;
        const cdRepoContext = 'retrieving all CDs';
        const disableMessage = false;
        try {
            const cdRepoResponse = await getRequest(cdRepoPath, cdRepoContext, disableMessage);
            if (cdRepoResponse.success && cdRepoResponse.data.result && cdRepoResponse.data.result.length > 0) {
                return cdRepoResponse.data.result;
            }
        } catch (e) {
            console.warn(e);
            return failResponse;
        }

        return failResponse;
    }

    /**
     * Fetches a Concept Description (CD) by the provided CD ID.
     *
     * @async
     * @param {string} cdId - The ID of the CD to fetch.
     * @returns {Promise<any>} A promise that resolves to a CD.
     */
    async function fetchCdById(cdId: string): Promise<any> {
        const failResponse = {} as any;

        if (!cdId) return failResponse;

        cdId = cdId.trim();

        if (cdId === '') return failResponse;

        if (conceptDescriptionRepoUrl.value.trim() === '') return failResponse;

        let cdRepoUrl = conceptDescriptionRepoUrl.value;
        if (cdRepoUrl.trim() === '') return failResponse;
        if (cdRepoUrl.endsWith('/')) cdRepoUrl = stripLastCharacter(cdRepoUrl);
        if (!cdRepoUrl.endsWith(endpointPath)) cdRepoUrl += endpointPath;

        const cdEndpoint = cdRepoUrl + '/' + base64Encode(cdId);
        return fetchCd(cdEndpoint);
    }

    /**
     * Fetches a Concept Description (CD) by the provided CD endpoint.
     *
     * @async
     * @param {string} cdEndpoint - The endpoint URL of the CD to fetch.
     * @returns {Promise<any>} A promise that resolves to a CD.
     */
    async function fetchCd(cdEndpoint: string): Promise<any> {
        const failResponse = {} as any;

        if (!cdEndpoint) return failResponse;

        cdEndpoint = cdEndpoint.trim();

        if (cdEndpoint === '') return failResponse;

        const cdRepoPath = cdEndpoint;
        const cdRepoContext = 'retrieving CD';
        const disableMessage = true;
        try {
            const cdRepoResponse = await getRequest(cdRepoPath, cdRepoContext, disableMessage);
            if (cdRepoResponse?.success && cdRepoResponse?.data && Object.keys(cdRepoResponse?.data).length > 0) {
                const cd = cdRepoResponse.data;

                // Add endpoint to CD
                // Note: not specified and standardized in IDTA-01001-3-0-1 Specification Asset Administration Shell Part 1 Metamodel
                cd.endpoints = [{ protocolInformation: { href: cdRepoPath }, interface: 'CONCEPTDESCRIPTION-3.0' }];

                return cd;
            }
        } catch (e) {
            console.warn(e);
            return failResponse;
        }

        return failResponse;
    }

    /**
     * Checks if Concept Description with provided ID is available (in repository)
     *
     * @async
     * @param {string} cdId - The ID of the CD to check.
     * @returns {Promise<boolean>} A promise that resolves to `true` if CD with provided ID is available, otherwise `false`.
     */
    async function isAvailableByIdInRepo(cdId: string): Promise<boolean> {
        const failResponse = false;

        if (!cdId) return failResponse;

        cdId = cdId.trim();

        if (cdId === '') return failResponse;

        const cd = await fetchCdById(cdId);

        if (cd && Object.keys(cd).length > 0) return true;

        return failResponse;
    }

    /**
     * Checks if Concept Description (CD) is available (in repository) by the provided CD endpoint
     *
     * @async
     * @param {string} cdEndpoint - The endpoint URL of the CD to check.
     * @returns {Promise<boolean>} A promise that resolves to `true` if CD with provided ID is available, otherwise `false`.
     */
    async function isAvailable(cdEndpoint: string): Promise<boolean> {
        const failResponse = false;

        if (!cdEndpoint) return failResponse;

        cdEndpoint = cdEndpoint.trim();

        if (cdEndpoint === '') return failResponse;

        const cdRepoPath = cdEndpoint;
        const cdRepoContext = 'evaluating CD Status';
        const disableMessage = true;

        try {
            const cdRepoResponse = await getRequest(cdRepoPath, cdRepoContext, disableMessage);
            if (cdRepoResponse?.success && cdRepoResponse?.data && Object.keys(cdRepoResponse?.data).length > 0) {
                return true;
            }
        } catch (e) {
            console.warn(e);
            return failResponse;
        }

        return failResponse;
    }

    /**
     * Retrieves the Concept Description (CD) endpoint URL by its ID.
     *
     * @param {string} cdId - The ID of the CD to retrieve the endpoint for.
     * @returns {string} A CD endpoint.
     */
    function getCdEndpointById(cdId: string): string {
        const failResponse = '';

        if (!cdId) return failResponse;

        cdId = cdId.trim();

        if (cdId === '') return failResponse;

        if (conceptDescriptionRepoUrl.value.trim() === '') return failResponse;

        let cdRepoUrl = conceptDescriptionRepoUrl.value;
        if (cdRepoUrl.trim() === '') return failResponse;
        if (cdRepoUrl.endsWith('/')) cdRepoUrl = stripLastCharacter(cdRepoUrl);
        if (!cdRepoUrl.endsWith(endpointPath)) cdRepoUrl += endpointPath;

        const cdEndpoint = cdRepoUrl + '/' + base64Encode(cdId);

        return cdEndpoint || failResponse;
    }

    return {
        endpointPath,
        fetchCdList,
        fetchCdById,
        fetchCd,
        isAvailableByIdInRepo,
        isAvailable,
        getCdEndpointById,
    };
}
