// import { getEquivalentEclassSemanticIds, getEquivalentIriSemanticIds } from '@/utils/SemanticIdUtils';
import { useCDRepositoryClient } from '@/composables/Client/CDRepositoryClient';
import { formatDate } from '@/utils/DateUtils';

export function useConceptDescriptionHandling() {
    // Composables
    const { fetchCd: fetchCdFromRepo, fetchCdById: fetchCdByIdFromRepo, getCdEndpointById } = useCDRepositoryClient();

    /**
     * Retrieves and returns the unit suffix for a given Submodel Element (SME).
     *
     * The function takes a SME object and checks if it has concept descriptions.
     * If not, it attempts to fetch them. Then, it looks through the concept descriptions
     * to find and return the first found unit specification from the embedded data specifications.
     *
     * @param {object} sme - The SME object containing concept descriptions.
     * @param {Array} [sme.conceptDescriptions] - Optional concept descriptions array.
     * @returns {string} Returns the unit suffix if found, otherwise an empty string.
     */
    function unitSuffix(sme: any): string {
        const failResponse = '';

        if (!sme || Object.keys(sme).length === 0) return failResponse;

        if (
            !sme.conceptDescriptions ||
            !Array.isArray(sme.conceptDescriptions) ||
            sme.conceptDescriptions.length == 0
        ) {
            return failResponse;
        }

        for (const conceptDescription of sme.conceptDescriptions) {
            if (!conceptDescription.embeddedDataSpecifications) continue;

            for (const embeddedDataSpecification of conceptDescription.embeddedDataSpecifications) {
                if (
                    embeddedDataSpecification.dataSpecificationContent &&
                    embeddedDataSpecification.dataSpecificationContent.unit
                ) {
                    // Returns first found unit specification
                    return embeddedDataSpecification.dataSpecificationContent.unit;
                }
            }
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
    async function fetchCdById(cdId: string, endpoint?: string): Promise<any> {
        const failResponse = {};

        if (!cdId) return failResponse;

        cdId = cdId.trim();

        if (cdId === '') return failResponse;

        const cd = await fetchCdByIdFromRepo(cdId, endpoint);

        if (!cd || Object.keys(cd).length === 0) {
            console.warn("Fetching CD (id = '" + cdId + "') failed!");
            return failResponse;
        }

        cd.timestamp = formatDate(new Date());
        cd.path = getCdEndpointById(cdId);

        return cd;
    }

    /**
     * Fetches a Concept Description (CD) by the provided CD endpoint.
     *
     * @async
     * @param {string} cdEndpoint - The endpoint URL of the CD to fetch.
     * @returns {Promise<any>} A promise that resolves to a CD.
     */
    async function fetchCd(cdEndpoint: string): Promise<any> {
        const failResponse = {};

        if (!cdEndpoint) return failResponse;

        cdEndpoint = cdEndpoint.trim();

        if (cdEndpoint === '') return failResponse;

        const cd = await fetchCdFromRepo(cdEndpoint);

        if (!cd || Object.keys(cd).length === 0) {
            console.warn('Fetching CD (' + cdEndpoint + ') failed!');
            return failResponse;
        }

        cd.timestamp = formatDate(new Date());
        cd.path = cdEndpoint;

        return cd;
    }

    /**
     * Fetches all Concept Descriptions (CDs) of an SubmodelElement (SME)
     *
     * @async
     * @param {string} cdEndpoint - The endpoint URL of the CD to fetch.
     * @param {object} sme - The SME object to fetch all CDs
     * @returns {Promise<Array<any>>} A promise that resolves to an array of CDs.
     */
    async function fetchCds(sme: any, endpoint?: string): Promise<Array<any>> {
        const failResponse = [] as Array<any>;

        if (
            !sme ||
            ((!sme.semanticId || !sme.semanticId.keys || sme.semanticId.keys.length === 0) &&
                (!sme.supplementalSemanticIds ||
                    !Array.isArray(sme.supplementalSemanticIds) ||
                    sme.supplementalSemanticIds.length === 0))
        ) {
            return failResponse;
        }

        const semanticIdsToFetch = sme?.semanticId?.keys
            ? sme.semanticId.keys.map((key: any) => {
                  return key.value;
              })
            : ([] as Array<string>);

        const supplementalSemanticIdsToFetch = sme.supplementalSemanticIds
            ? sme.supplementalSemanticIds
                  .map((supplementalSemanticId: any) => {
                      return supplementalSemanticId.keys.map((key: any) => {
                          return key.value;
                      });
                  })
                  .flat()
            : ([] as Array<string>);

        // NOTE deactivated till improvement is implemented to avoid /massive request to CD repo
        // Push equivalent semanticIds (e.g. to take into account the possible spellings of an Eclass IRDI)
        // IMPROVE This leads to multiple requests to the CD repo. Most of them get failed, which leads to a bad performance; Possible solution: Prefetched and stored list of all available CD IDs in the store + precheck which semanticId exist in the CD ID list
        // semanticIdsToFetch.forEach((semanticId: string) => {
        //     if (
        //         semanticId.startsWith('0173-1#') ||
        //         semanticId.startsWith('0173/1///') ||
        //         semanticId.startsWith('https://api.eclass-cdp.com/0173-1')
        //     ) {
        //         semanticIdsToFetch.push(...getEquivalentEclassSemanticIds(semanticId));
        //     } else if (semanticId.startsWith('http://') || semanticId.startsWith('https://')) {
        //         semanticIdsToFetch.push(...getEquivalentIriSemanticIds(semanticId));
        //     }
        // });

        const combinedSemanticIdsToFetch = [...semanticIdsToFetch, ...supplementalSemanticIdsToFetch];

        const semanticIdsUniqueToFetch = Array.from(new Set(combinedSemanticIdsToFetch));

        const cdPromises = semanticIdsUniqueToFetch.map(async (semanticId: string) => {
            return await fetchCdById(semanticId, endpoint);
        });

        let conceptDescriptions = await Promise.all(cdPromises);

        // Filter empty objects and errors
        conceptDescriptions = conceptDescriptions.filter(
            (conceptDescription: any) =>
                conceptDescription && Object.keys(conceptDescription).length !== 0 && !Array.isArray(conceptDescription)
        );

        return conceptDescriptions;
    }

    // Get the Definition from the EmbeddedDataSpecification of the ConceptDescription of the Property (if available)
    /**
     * Retrieves and returns the Concept Description definition for a given Submodel Element (SME).
     *
     * The function takes a SME object and checks if it has concept descriptions.
     * If not, it attempts to fetch them. Then, it looks through the concept descriptions
     * to find and return the first found unit specification from the embedded data specifications.
     *
     * @async
     * @param {object} sme - The SME object containing concept descriptions.
     * @param {Array} [sme.conceptDescriptions] - Optional concept descriptions array.
     * @returns {Promise<string>} A promise that resolves to the description if found, otherwise an empty string.
     */
    function cdDefinition(sme: any, language: string = 'en'): string {
        const failResponse = '';

        if (!sme || Object.keys(sme).length === 0) return failResponse;

        if (
            !sme.conceptDescriptions ||
            !Array.isArray(sme.conceptDescriptions) ||
            sme.conceptDescriptions.length == 0
        ) {
            return failResponse;
        }

        for (const conceptDescription of sme.conceptDescriptions) {
            if (!conceptDescription.embeddedDataSpecifications) continue;

            for (const embeddedDataSpecification of conceptDescription.embeddedDataSpecifications) {
                if (
                    embeddedDataSpecification.dataSpecificationContent &&
                    embeddedDataSpecification.dataSpecificationContent.definition
                ) {
                    const definition = embeddedDataSpecification.dataSpecificationContent.definition.find(
                        (definition: any) => {
                            return definition.language === language && definition.text.trim() !== '';
                        }
                    );
                    if (definition && definition.text) {
                        return definition.text;
                    }
                } else {
                    return failResponse;
                }
            }
        }
        return failResponse;
    }

    /**
     * Retrieves the Concept Description (CD) endpoint URL of a CD.
     *
     * @param {string} cd - The CD to retrieve the endpoint for.
     * @returns {string} A promise that resolves to a CD endpoint.
     */
    function getCdEndpoint(cd: any): string {
        const failResponse = '';

        if (!cd || Object.keys(cd).length === 0 || !cd.id || cd.id.trim() === '') return failResponse;

        return getCdEndpointById(cd.id) || failResponse;
    }

    return {
        fetchCdById,
        fetchCd,
        fetchCds,
        unitSuffix,
        cdDefinition,
        getCdEndpoint,
    };
}
