import { useAASHandling } from '@/composables/AAS/AASHandling';
import { useReferableUtils } from '@/composables/AAS/ReferableUtils';
import { useSMEHandling } from '@/composables/AAS/SMEHandling';
import { useSMHandling } from '@/composables/AAS/SMHandling';
import { useSMEFile } from '@/composables/AAS/SubmodelElements/File';
import { checkSemanticId } from '@/utils/AAS/SemanticIdUtils';

export function useTechnicalData_v1_2Utils() {
    // Composables
    const { getSmIdOfAasIdBySemanticId } = useAASHandling();
    const { fetchSmById, getSmEndpointById } = useSMHandling();
    const { fetchSme } = useSMEHandling();
    const { checkIdShort } = useReferableUtils();
    const { valueUrl: smeFileValueUrl } = useSMEFile();

    const smSemanticId = 'https://admin-shell.io/ZVEI/TechnicalData/Submodel/1/2';
    const smIdShort = 'TechnicalData';

    const smcGeneralInformationSemanticId = 'https://admin-shell.io/ZVEI/TechnicalData/GeneralInformation/1/1';
    const fileProductImageSemanticId = 'https://admin-shell.io/ZVEI/TechnicalData/ProductImage/1/1';

    /**
     * Retrieves Technical Data Submodel (SM) of an Asset Administration Shell (AAS).
     *
     * @async
     * @param {string} aasId - The ID of the AAS to retrieve its Technical Data SM.
     * @returns {string} A promise that resolves to a Technical Data SM.
     */
    async function getSm(aasId: string): Promise<any> {
        const failResponse = {};

        if (!aasId) return failResponse;

        aasId = aasId.trim();

        if (aasId === '') return failResponse;

        aasId = aasId.trim();

        const smTechnicalDataId = await getSmIdOfAasIdBySemanticId(aasId, smSemanticId);
        const smTechnicalData = await fetchSmById(smTechnicalDataId);

        return smTechnicalData;
    }

    /**
     * Retrieves Product Image URL of Technical Data Submodel (SM) of an Asset Administration Shell (AAS).
     *
     * @async
     * @param {string} aasId - The ID of the AAS to retrieve its Product Image URL.
     * @returns {string} A promise that resolves to  URL of the Product Image.
     */
    async function getProductImageUrlByAasId(aasId: string): Promise<{ url: string; isExternal: boolean }> {
        const failResponse = { url: '', isExternal: false };

        if (!aasId) return failResponse;

        aasId = aasId.trim();

        if (aasId === '') return failResponse;

        aasId = aasId.trim();

        // First attempt directly via smePath (smId => smEndpoint + SmePathSuffix (including idShorts))
        const fileProductImageSmePathSuffix = 'GeneralInformation.ProductImage';

        const smTechnicalDataId = await getSmIdOfAasIdBySemanticId(aasId, smSemanticId);
        const smTechnicalDataEndpoint = await getSmEndpointById(smTechnicalDataId);
        const fileProductImageSmePath = smTechnicalDataEndpoint + '/submodel-elements/' + fileProductImageSmePathSuffix;
        const fileProductImage = await fetchSme(fileProductImageSmePath);

        if (fileProductImage && Object.keys(fileProductImage).length > 0) {
            return smeFileValueUrl(fileProductImage);
        } else {
            // Second attempt via semanticIds
            const smTechnicalData = await fetchSmById(smTechnicalDataId);

            return getProductImageURL(smTechnicalData);
        }

        return failResponse;
    }

    function getProductImageURL(smTechnicalData: any): { url: string; isExternal: boolean } {
        if (
            smTechnicalData &&
            Object.keys(smTechnicalData).length > 0 &&
            (checkSemanticId(smTechnicalData, smSemanticId) || checkIdShort(smTechnicalData, smIdShort))
        ) {
            const smcGeneralInformation = smTechnicalData.submodelElements.find((sme: any) => {
                return checkSemanticId(sme, smcGeneralInformationSemanticId);
            });
            if (smcGeneralInformation && Object.keys(smcGeneralInformation).length > 0) {
                const fileProductImage = smcGeneralInformation.value.find((sme: any) => {
                    return checkSemanticId(sme, fileProductImageSemanticId);
                });
                if (fileProductImage && Object.keys(fileProductImage).length > 0) {
                    return smeFileValueUrl(fileProductImage);
                }
            }
        }

        return { url: '', isExternal: false };
    }

    return { smSemanticId, smIdShort, getSm, getProductImageUrlByAasId, getProductImageURL };
}
