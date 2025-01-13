import { useAASRepositoryClient } from '@/composables/Client/AASRepositoryClient';
import { extractId as extractIdFromReference } from '@/utils/ReferenceUtils';
import { useSMRegistryClient } from '../Client/SMRegistryClient';

export function useTechnicalData_v1_2Utils() {
    // Composables
    const { getSubmodelRefsById: getSubmodelRefsByIdFromRepo } = useAASRepositoryClient();
    const { fetchSmDescriptorById } = useSMRegistryClient();

    const semanticId = 'https://admin-shell.io/ZVEI/TechnicalData/Submodel/1/2';

    // function getSmTechnicalData(aasEndpoint: string): any {
    //     const failResponse = {};

    //     if (!aasEndpoint || aasEndpoint.trim() === '') return failResponse;

    //     aasEndpoint = aasEndpoint.trim();

    //     return failResponse;
    // }

    async function getSmTechnicalDataByAasId(aasId: string): Promise<any> {
        console.log('getSmTechnicalDataByAasId()');
        const failResponse = {};

        if (!aasId || aasId.trim() === '') return failResponse;

        aasId = aasId.trim();

        const submodelRefs = await getSubmodelRefsByIdFromRepo(aasId);

        for (const submodelRef of submodelRefs) {
            const smId = extractIdFromReference(submodelRef, 'Submodel');
            console.log(smId);
            const smDescriptor = await fetchSmDescriptorById(smId);
            if (
                smDescriptor &&
                Object.keys(smDescriptor).length > 0 &&
                smDescriptor.semanticIds &&
                Array.isArray(smDescriptor.semanticIds) &&
                smDescriptor.semanticIds.length > 0
            ) {
                const semanticIds = smDescriptor.semanticId;
                const foundSemanticId = semanticIds.includes((semanticIdOfSmDescriptor: any) => {
                    return semanticIdOfSmDescriptor?.value === semanticId;
                });
                console.log('foobar', foundSemanticId);
            }
        }

        return failResponse;
    }

    async function getProductImageUrl(aasId: string): Promise<string> {
        console.log('getSmTechnicalDataByAasId()');
        const failResponse = '';

        if (!aasId || aasId.trim() === '') return failResponse;

        aasId = aasId.trim();

        const smTechnicalData = await getSmTechnicalDataByAasId(aasId);
        return failResponse;
        console.log(smTechnicalData);

        return failResponse;
    }

    return { semanticId, getProductImageUrl };
}
