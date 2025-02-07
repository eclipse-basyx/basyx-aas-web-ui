import { useAASRepositoryClient } from '@/composables/Client/AASRepositoryClient';
import { useSMRegistryClient } from '@/composables/Client/SMRegistryClient';
import { useSMRepositoryClient } from '@/composables/Client/SMRepositoryClient';
import { useConceptDescriptionHandling } from '@/composables/ConceptDescriptionHandling';
import { useIDUtils } from '@/composables/IDUtils';
import { useAASStore } from '@/store/AASDataStore';
import { formatDate } from '@/utils/DateUtils';
import { extractEndpointHref } from '@/utils/DescriptorUtils';
import { extractId as extractIdFromReference } from '@/utils/ReferenceUtils';

export function useSMHandling() {
    // Composables
    const { getSubmodelRefsById: getSubmodelRefsByIdFromRepo } = useAASRepositoryClient();
    const {
        fetchSmDescriptorById: fetchSmDescriptorByIdFromRegistry,
        fetchSmDescriptorList: fetchSmDescriptorListFromRegistry,
    } = useSMRegistryClient();
    const {
        fetchSmById: fetchSmByIdFromRepo,
        fetchSm: fetchSmFromRepo,
        fetchSme: fetchSmeFromRepo,
    } = useSMRepositoryClient();
    const { generateUUID } = useIDUtils();
    const { fetchCds } = useConceptDescriptionHandling();

    // Stores
    const aasStore = useAASStore();

    /**
     * Fetches a Submodel (SM) by the provided SM endpoint
     * and dispatches it to the AAS store.
     *
     * @async
     * @param {string} smEndpoint - The endpoint URL of the SM to fetch.
     * @param {boolean} withConceptDescriptions - Flag to specify if SM should be fetched with ConceptDescriptions (CDs)
     * @returns {Promise<any>} A promise that resolves to a SM.
     */
    async function fetchAndDispatchSm(smEndpoint: string, withConceptDescriptions = false): Promise<any> {
        const failResponse = {};

        if (!smEndpoint) return failResponse;

        smEndpoint = smEndpoint.trim();

        if (smEndpoint === '') return failResponse;

        const smOrSme = await fetchSm(smEndpoint, withConceptDescriptions);

        if (!smOrSme || Object.keys(smOrSme).length === 0) return failResponse;

        smOrSme.isActive = true;

        // TODO move router.push to AASDataStore
        // const query = route.query;
        // query.path = smEndpoint;
        // router.push({ query: query });
        aasStore.dispatchSelectedNode(smOrSme);

        return smOrSme;
    }

    /**
     * Fetches a Submodel (SM) by the provided SM ID
     * and dispatches it to the AAS store.
     *
     * @async
     * @param {string} smId - The ID of the SM to fetch.
     * @param {boolean} withConceptDescriptions - Flag to specify if SM should be fetched with ConceptDescriptions (CDs)
     * @returns {Promise<any>} A promise that resolves to a SM.
     */
    async function fetchAndDispatchSmById(smId: string, withConceptDescriptions = false): Promise<any> {
        const failResponse = {};

        if (!smId) return failResponse;

        smId = smId.trim();

        if (smId === '') return failResponse;

        const sm = await fetchSmById(smId, withConceptDescriptions);

        if (!sm || Object.keys(sm).length === 0) return failResponse;

        sm.isActive = true;

        // TODO move router.push to AASDataStore
        // const query = route.query;
        // query.path = getSmEndpoint(sm);
        // router.push({ query: query });
        aasStore.dispatchSelectedNode(sm);

        return sm;
    }

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

        return smDescriptor;
    }

    /**
     * Fetches a Submodel (SM) by the provided SM endpoint.
     *
     * @async
     * @param {string} smEndpoint - The endpoint URL of the SM to fetch.
     * @param {boolean} withConceptDescriptions - Flag to specify if SM should be fetched with ConceptDescriptions (CDs)
     * @returns {Promise<any>} A promise that resolves to a SM.
     */
    async function fetchSm(smEndpoint: string, withConceptDescriptions = false): Promise<any> {
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
     * @param {boolean} withConceptDescriptions - Flag to specify if SM should be fetched with ConceptDescriptions (CDs)
     * @returns {Promise<any>} A promise that resolves to a SM.
     */
    async function fetchSmById(smId: string, withConceptDescriptions = false): Promise<any> {
        const failResponse = {};

        if (!smId) return failResponse;

        smId = smId.trim();

        if (smId === '') return failResponse;

        const sm = await fetchSmByIdFromRepo(smId);

        if (!sm || Object.keys(sm).length === 0) {
            console.warn("Fetching SM (id = '" + smId + "') failed!");
            return failResponse;
        }

        const smEndpoint = getSmEndpoint(sm);

        sm.timestamp = formatDate(new Date());
        sm.path = smEndpoint;

        if (withConceptDescriptions) {
            sm.conceptDescriptions = await fetchCds(sm);
        } else {
            sm.conceptDescriptions = [];
        }

        return sm;
    }

    /**
     * Retrieves the Submodel (SM) endpoint URL by its ID.
     *
     * @async
     * @param {string} smId - The ID of the SM to retrieve the endpoint for.
     * @returns {Promise<string>} A promise that resolves to a SM endpoint.
     */
    async function getSmEndpointById(smId: string): Promise<string> {
        const failResponse = '';

        if (!smId) return failResponse;

        smId = smId.trim();

        if (smId === '') return failResponse;

        const smDescriptor = await fetchSmDescriptorByIdFromRegistry(smId);
        const smEndpoint = getSmEndpoint(smDescriptor);

        return smEndpoint || failResponse;
    }

    /**
     * Retrieves the Submodel (SM) endpoint URL of a SM descriptor.
     *
     * @param {string} smDescriptor - The SM descriptor to retrieve the endpoint for.
     * @returns {string} A promise that resolves to a SM endpoint.
     */
    function getSmEndpoint(smDescriptor: any): string {
        // TODO Replace extractEndpointHref(smDescriptor), 'SUBMODEL-3.0') by getSmEndpoint(smDescriptor) in all components
        const failResponse = '';

        if (
            !smDescriptor ||
            Object.keys(smDescriptor).length === 0 ||
            !smDescriptor.id ||
            smDescriptor.id.trim() === ''
        )
            return failResponse;

        const smEndpoint = extractEndpointHref(smDescriptor, 'SUBMODEL-3.0');

        return smEndpoint || failResponse;
    }

    /**
     * Retrieves a Submodel (SM) of an Asset Administration Shell (AAS) SM descriptor.
     *
     * @async
     * @param {string} aasId - The ID of the AAS to retrieve its SM.
     * @param {string} semanticId - The semantic ID of the SM.
     * @returns {string} A promise that resolves to a SM.
     */
    async function getSmIdOfAasIdBySemanticId(aasId: string, semanticId: string): Promise<string> {
        const failResponse = '';

        if (!aasId || !semanticId) return failResponse;

        aasId = aasId.trim();
        semanticId = semanticId.trim();

        if (aasId === '' || semanticId === '') return failResponse;

        const submodelRefs = await getSubmodelRefsByIdFromRepo(aasId);

        for (const submodelRef of submodelRefs) {
            const smId = extractIdFromReference(submodelRef, 'Submodel');
            const smDescriptor = await fetchSmDescriptor(smId);
            if (
                smDescriptor &&
                Object.keys(smDescriptor).length > 0 &&
                smDescriptor?.semanticId?.keys &&
                Array.isArray(smDescriptor.semanticId.keys) &&
                smDescriptor.semanticId.keys.length > 0
            ) {
                const semanticIds = smDescriptor.semanticId.keys.map((key: any) => key.value);
                if (semanticIds.includes(semanticId)) {
                    return smId;
                }
            }
        }

        return failResponse;
    }

    /**
     * Recursively calculates and sets the paths of SubmodelElements (SMEs) within a given Submodel (SM) or SubmodelElement (SME).
     * The function modifies the `parent` object by:
     * - Setting the `path` property to the constructed string based on the `startPath`.
     * - Assigning a unique `id` to the `parent` using `generateUUID()`.
     * - Setting the `conceptDescriptions` property array by fetching Concept Descriptions (CDs) from repository
     *
     * The function handles different types of parent structures:
     * - For **Submodel**, it iterates over `submodelElements` and appends their `idShort` to the path.
     * - For **SubmodelElementCollection**, it processes the items in its `value` array.
     * - For **SubmodelElementList**, it uses array index notation (`[index]`).
     * - For **Entity**, it processes `statements` similarly.
     *
     * @param {any} parent - The parent Submodel or SubmodelElement object to process, which will have its `path` set and potentially modified.
     * @param {string} startPath - The base path string to build upon recursively.
     * @param {boolean} withConceptDescriptions - Flag to specify if `conceptDescriptions` property array should be set with fetched CDs
     * @returns {Promise<any>} A promise that resolves with the modified `parent` object, including calculated paths.
     */
    async function calculateSMEPathes(
        parent: any,
        startPath: string,
        withConceptDescriptions: boolean = false
    ): Promise<any> {
        const failResponse = {};

        if (!parent || Object.keys(parent).length === 0) return failResponse;

        parent.path = startPath;
        // Just set if it is not available (e.g. for a Submodel it is available!)
        if (!parent?.id) {
            parent.id = generateUUID();
        }

        if (
            withConceptDescriptions &&
            (!parent.conceptDescriptions ||
                !Array.isArray(parent.conceptDescriptions) ||
                parent.conceptDescriptions.length === 1)
        ) {
            parent.conceptDescriptions = await fetchCds(parent);
        }

        if (parent.submodelElements && Array.isArray(parent.submodelElements) && parent.submodelElements.length > 0) {
            // Submodel
            for (const element of parent.submodelElements) {
                await calculateSMEPathes(
                    element,
                    startPath + '/submodel-elements/' + element.idShort,
                    withConceptDescriptions
                );
            }
        } else if (parent.value && Array.isArray(parent.value) && parent.value.length > 0) {
            switch (parent.modelType) {
                // SubmodelElementCollection
                case 'SubmodelElementCollection':
                    for (const element of parent.value) {
                        await calculateSMEPathes(element, startPath + '.' + element.idShort, withConceptDescriptions);
                    }
                    break;
                // SubmodelElementList
                case 'SubmodelElementList':
                    for (const [index, element] of parent.value.entries()) {
                        await calculateSMEPathes(
                            element,
                            startPath + encodeURIComponent('[') + index + encodeURIComponent(']'),
                            withConceptDescriptions
                        );
                    }
                    break;
            }
        } else if (
            parent.statements &&
            Array.isArray(parent.statements) &&
            parent.statements.length > 0 &&
            parent.modelType == 'Entity'
        ) {
            // Entitiy
            for (const element of parent.statements) {
                await calculateSMEPathes(element, startPath + '.' + element.idShort, withConceptDescriptions);
            }
        }

        return parent;
    }

    return {
        fetchAndDispatchSm,
        fetchAndDispatchSmById,
        getSmIdOfAasIdBySemanticId,
        fetchSm,
        fetchSmById,
        getSmEndpoint,
        getSmEndpointById,
        fetchSmDescriptorList,
        fetchSmDescriptor,
        calculateSMEPathes,
    };
}
