import { useAASRepositoryClient } from '@/composables/Client/AASRepositoryClient';
import { useSMEHandling } from '@/composables/SMEHandling';
import { useSMHandling } from '@/composables/SMHandling';
import { useSMEFile } from '@/composables/SubmodelElements/File';
import { extractId as extractIdFromReference } from '@/utils/ReferenceUtils';
import { checkSemanticId } from '@/utils/SemanticIdUtils';

export function useTechnicalData_v1_2Utils() {
    // Composables
    const { getSubmodelRefsById: getSubmodelRefsByIdFromRepo } = useAASRepositoryClient();
    const { fetchSmDescriptor, fetchSmById, getSmEndpointById } = useSMHandling();
    const { fetchSme } = useSMEHandling();
    const { valueUrl: smeFileValueUrl } = useSMEFile();

    const semanticId = 'https://admin-shell.io/ZVEI/TechnicalData/Submodel/1/2';

    async function getSmTechnicalDataId(aasId: string): Promise<string> {
        const failResponse = '';

        if (!aasId) return failResponse;

        aasId = aasId.trim();

        if (aasId === '') return failResponse;

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

    async function getProductImageUrl(aasId: string): Promise<string> {
        const failResponse = '';

        if (!aasId) return failResponse;

        aasId = aasId.trim();

        if (aasId === '') return failResponse;

        if (!aasId || aasId.trim() === '') return failResponse;

        aasId = aasId.trim();

        // First attempt directly via smePath (smId => smEndpoint + SmePathSuffix (including idShorts))
        const fileProductImageSmePathSuffix = 'GeneralInformation.ProductImage';

        const smTechnicalDataId = await getSmTechnicalDataId(aasId);
        const smTechnicalDataEndpoint = await getSmEndpointById(smTechnicalDataId);
        const fileProductImageSmePath = smTechnicalDataEndpoint + '/submodel-elements/' + fileProductImageSmePathSuffix;
        const fileProductImage = await fetchSme(fileProductImageSmePath);

        if (fileProductImage && Object.keys(fileProductImage).length > 0) {
            return smeFileValueUrl(fileProductImage);
        } else {
            // Second attempt via semanticIds
            const smcGeneralInformationSemanticId = 'https://admin-shell.io/ZVEI/TechnicalData/GeneralInformation/1/1';
            const fileProductImageSemanticId = 'https://admin-shell.io/ZVEI/TechnicalData/ProductImage/1/1';

            const smTechnicalData = await fetchSmById(smTechnicalDataId);

            if (smTechnicalData && Object.keys(smTechnicalData).length > 0) {
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
        }

        return failResponse;
    }

    return { semanticId, getProductImageUrl };
}
