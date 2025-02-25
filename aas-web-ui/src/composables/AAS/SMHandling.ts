import { useConceptDescriptionHandling } from '@/composables/AAS/ConceptDescriptionHandling';
import { useSMRegistryClient } from '@/composables/Client/SMRegistryClient';
import { useSMRepositoryClient } from '@/composables/Client/SMRepositoryClient';
import { useIDUtils } from '@/composables/IDUtils';
import { extractEndpointHref } from '@/utils/AAS/DescriptorUtils';
import { formatDate } from '@/utils/DateUtils';

export function useSMHandling() {
    // Composables
    const {
        fetchSmDescriptorById: fetchSmDescriptorByIdFromRegistry,
        fetchSmDescriptorList: fetchSmDescriptorListFromRegistry,
        getSmEndpointById: getSmEndpointByIdFromRegistry,
    } = useSMRegistryClient();
    const {
        fetchSm: fetchSmFromRepo,
        getSmEndpointById: getSmEndpointByIdFromRepo,
        fetchSme: fetchSmeFromRepo,
        smIsAvailable: smIsAvailableInRepo,
    } = useSMRepositoryClient();
    const { fetchCds } = useConceptDescriptionHandling();
    const { generateUUID } = useIDUtils();

    /**
     * Fetches a list of all available Submodel (SM) Descriptors.
     *
     * @async
     * @returns {Promise<Array<any>>} A promise that resolves to an array of SM Descriptors.
     * An empty array is returned if the request fails or no SM Descriptors are found.
     */
    async function fetchSmDescriptorList(): Promise<Array<any>> {
        const failResponse = [] as Array<any>;

        let smDescriptors = await fetchSmDescriptorListFromRegistry();

        if (!smDescriptors || !Array.isArray(smDescriptors) || smDescriptors.length === 0) return failResponse;

        smDescriptors = smDescriptors.map((smDescriptor: any) => {
            smDescriptor.timestamp = formatDate(new Date());
            smDescriptor.path = extractEndpointHref(smDescriptor, 'SUBMODEL-3.0');
            return smDescriptor;
        });

        return smDescriptors;
    }

    /**
     * Fetches an Submodel (SM) Descriptor by the provided SM ID.
     *
     * @async
     * @param {string} smId - The ID of the SM Descriptor to fetch.
     * @returns {Promise<any>} A promise that resolves to a SM Descriptor.
     */
    async function fetchSmDescriptor(smId: string): Promise<any> {
        const failResponse = {};

        smId = smId.trim();

        if (smId === '') return;

        const smDescriptor = await fetchSmDescriptorByIdFromRegistry(smId);

        if (!smDescriptor || Object.keys(smDescriptor).length === 0) {
            console.warn("Fetching SM Descriptor (id = '" + smId + "') failed!");
            return failResponse;
        }

        smDescriptor.timestamp = formatDate(new Date());
        smDescriptor.path = extractEndpointHref(smDescriptor, 'SUBMODEL-3.0');

        return smDescriptor;
    }

    /**
     * Fetches a Submodel (SM) by the provided SM endpoint.
     *
     * @async
     * @param {string} smEndpoint - The endpoint URL of the SM to fetch.
     * @param {boolean} withConceptDescriptions - Flag to specify if SM/SME and its Submodel Elements (SME)
     *                                            should be fetched with ConceptDescriptions (CDs)
     * @param {boolean} setDataFlag - Flag to specify if data (`path`, `timestamp`, ìd`) should be set to
     *                               Submodel Elements (SME) of SM/SME object
     * @returns {Promise<any>} A promise that resolves to a SM.
     */
    async function fetchSm(
        smEndpoint: string,
        withConceptDescriptions = false,
        setDataFlag: boolean = false
    ): Promise<any> {
        const failResponse = {};

        if (!smEndpoint) return failResponse;

        smEndpoint = smEndpoint.trim();

        if (smEndpoint === '') return failResponse;

        let smOrSme = {} as any;
        if (smEndpoint.includes('/submodel-elements/')) {
            // smEndoint seems to be an SME endpoint
            smOrSme = await fetchSmeFromRepo(smEndpoint);

            // Note usage of fetchSme() (SMHandling) not possible
            // Reciprocal import of SMHandling/SMEHandling leads to error "Maximum call stack size exceeded"
        } else {
            smOrSme = await fetchSmFromRepo(smEndpoint);
        }

        if (!smOrSme || Object.keys(smOrSme).length === 0) {
            console.warn('Fetching SM/SME (' + smEndpoint + ') failed!');
            return failResponse;
        }

        smOrSme.timestamp = formatDate(new Date());
        smOrSme.path = smEndpoint;

        if (setDataFlag) {
            smOrSme = await setData({ ...smOrSme }, smOrSme.path, withConceptDescriptions, smOrSme.timestamp);
        }

        if (withConceptDescriptions) {
            smOrSme.conceptDescriptions = await fetchCds(smOrSme);
        } else {
            smOrSme.conceptDescriptions = [];
        }

        return smOrSme;
    }

    /**
     * Fetches a Submodel (SM) by the provided SM ID.
     *
     * @async
     * @param {string} smId - The ID of the SM to fetch.
     * @param {boolean} withConceptDescriptions - Flag to specify if SM and its Submodel Elements (SME)
     *                                            should be fetched with ConceptDescriptions (CDs)
     * @param {boolean} setDataFlag - Flag to specify if data (`path`, `timestamp`, ìd`) should be set to
     *                               Submodel Elements (SME) of SM object
     * @returns {Promise<any>} A promise that resolves to a SM.
     */
    async function fetchSmById(
        smId: string,
        withConceptDescriptions = false,
        setDataFlag: boolean = false
    ): Promise<any> {
        const failResponse = {};

        if (!smId) return failResponse;

        smId = smId.trim();

        if (smId === '') return failResponse;

        const smEndpoint = await getSmEndpointById(smId);

        if (smEndpoint && smEndpoint.trim() !== '') {
            return fetchSm(smEndpoint.trim(), withConceptDescriptions, setDataFlag);
        }

        return failResponse;
    }

    /**
     * Retrieves the Submodel (Sm) endpoint URL by its ID.
     *
     * This function attempts to obtain the SM endpoint using two methods: first by querying
     * the SM registry, and if that fails, it tries to obtain it from the SM repository. If the provided
     * SM ID is invalid or empty, the function returns an empty string.
     *
     * @async
     * @param {string} smId - The ID of the SM to retrieve the endpoint for.
     * @returns {Promise<string>} A promise that resolves to an SM endpoint.
     */
    async function getSmEndpointById(smId: string): Promise<string> {
        const failResponse = '';

        if (!smId) return failResponse;

        smId = smId.trim();

        if (smId === '') return failResponse;

        // First try to determine SM endpoint with the help of the registry
        let smEndpoint = await getSmEndpointByIdFromRegistry(smId);

        if (smEndpoint && smEndpoint.trim() !== '') return smEndpoint.trim();

        // Second try to determine SM endpoint with the help of the repo
        smEndpoint = getSmEndpointByIdFromRepo(smId);

        return smEndpoint.trim() || failResponse;
    }

    /**
     * Recursively calculates and sets data of SubmodelElements (SMEs) within a given Submodel (SM) or SubmodelElement (SME).
     * The function modifies the SM/SME object by:
     * - Assigning a unique `id` property to all SME objects using `generateUUID()`.
     * - Assigning `path` to the SM/SME object.
     * - Assigning `timestamp` to the SM/SME object.
     * - Setting the `conceptDescriptions` property array by fetching Concept Descriptions (CDs)
     *   from repository if `withConceptDescription`is `true`
     *
     * The function handles different types of parent structures:
     * - For **Submodel**, it iterates over `submodelElements` and appends their `idShort` to the path.
     * - For **SubmodelElementCollection**, it processes the items in its `value` array.
     * - For **SubmodelElementList**, it uses array index notation (`[index]`).
     * - For **Entity**, it processes `statements` similarly.
     *
     * @param {any} smOrSme - The Submodel or SubmodelElement object to process, which will have its `path` set and potentially modified.
     * @param {string} path - The base path string.
     * @param {boolean} withConceptDescriptions - Flag to specify if `conceptDescriptions` property array should be set with fetched CDs
     * @param {string} timestamp - The timestamp
     * @returns {Promise<any>} A promise that resolves with the modified SM/SME object.
     */
    async function setData(
        smOrSme: any,
        path: string,
        withConceptDescriptions: boolean = false,
        timestamp: string = ''
    ): Promise<any> {
        const failResponse = {};

        if (!smOrSme || Object.keys(smOrSme).length === 0) return failResponse;

        if (!path || path.trim() === '') return failResponse;

        if (smOrSme.modelType !== 'Submodel') smOrSme.id = generateUUID();
        smOrSme.path = path;
        smOrSme.timestamp = timestamp ? timestamp : formatDate(new Date());

        if (
            withConceptDescriptions &&
            (!smOrSme.conceptDescriptions ||
                !Array.isArray(smOrSme.conceptDescriptions) ||
                smOrSme.conceptDescriptions.length === 1)
        ) {
            smOrSme.conceptDescriptions = await fetchCds(smOrSme);
        }

        if (
            smOrSme.modelType == 'Submodel' &&
            smOrSme.submodelElements &&
            Array.isArray(smOrSme.submodelElements) &&
            smOrSme.submodelElements.length > 0
        ) {
            // Submodel
            for (const sme of smOrSme.submodelElements) {
                await setData(sme, path + '/submodel-elements/' + sme.idShort, withConceptDescriptions, timestamp);
            }
        } else if (
            ['SubmodelElementCollection', 'SubmodelElementList'].includes(smOrSme.modelType) &&
            smOrSme.value &&
            Array.isArray(smOrSme.value) &&
            smOrSme.value.length > 0
        ) {
            switch (smOrSme.modelType) {
                case 'SubmodelElementCollection':
                    // SubmodelElementCollection
                    for (const element of smOrSme.value) {
                        await setData(element, path + '.' + element.idShort, withConceptDescriptions, timestamp);
                    }
                    break;

                case 'SubmodelElementList':
                    // SubmodelElementList
                    for (const [index, element] of smOrSme.value.entries()) {
                        await setData(
                            element,
                            path + encodeURIComponent('[') + index + encodeURIComponent(']'),
                            withConceptDescriptions,
                            timestamp
                        );
                    }
                    break;
            }
        } else if (
            smOrSme.modelType == 'Entity' &&
            smOrSme.statements &&
            Array.isArray(smOrSme.statements) &&
            smOrSme.statements.length > 0
        ) {
            // Entitiy
            for (const element of smOrSme.statements) {
                await setData(element, path + '.' + element.idShort, withConceptDescriptions, timestamp);
            }
        }

        return smOrSme;
    }

    async function smIsAvailableById(smId: string): Promise<boolean> {
        const failResponse = false;

        if (!smId) return failResponse;

        smId = smId.trim();

        if (smId === '') return failResponse;

        const aasEndpoint = await getSmEndpointById(smId);

        return await smIsAvailableInRepo(aasEndpoint);
    }

    return {
        getSmEndpointById,
        smIsAvailableById,
        fetchSm,
        fetchSmById,
        fetchSmDescriptorList,
        fetchSmDescriptor,
        setData,
    };
}
