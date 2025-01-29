import { useSMEHandling } from '@/composables/SMEHandling';
import { useSMHandling } from '@/composables/SMHandling';
import { useFileUtils } from '@/composables/SubmodelElements/FileUtils';
import { checkIdShort } from '@/utils/ReferableUtils';
import { checkSemanticId } from '@/utils/SemanticIdUtils';

export function useTechnicalData_v1_2Utils() {
    // Composables
    const { getSmIdOfAasIdBySemanticId, fetchSmById, getSmEndpointById } = useSMHandling();
    const { fetchSme } = useSMEHandling();
    const { valueUrl: smeFileValueUrl } = useFileUtils();

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
    async function getProductImageUrlByAasId(aasId: string): Promise<string> {
        const failResponse = '';

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

    function getProductImageURL(smTechnicalData: any): string {
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

        return '';
    }

    return { smSemanticId, smIdShort, getSm, getProductImageUrlByAasId, getProductImageURL };
}
