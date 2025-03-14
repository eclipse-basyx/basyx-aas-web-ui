import { useAASHandling } from '@/composables/AAS/AASHandling';
import { useReferableUtils } from '@/composables/AAS/ReferableUtils';
import { useSMHandling } from '@/composables/AAS/SMHandling';
import { useSME } from '@/composables/AAS/SubmodelElements/SubmodelElement';
import { checkSemanticId } from '@/utils/AAS/SemanticIdUtils';

export function useCarbonFootprint_v0_9Utils() {
    // Composables
    const { getSmIdOfAasIdBySemanticId } = useAASHandling();
    const { fetchSmById } = useSMHandling();
    const { checkIdShort } = useReferableUtils();
    const { valueToDisplay } = useSME();

    const semanticId = 'https://admin-shell.io/idta/CarbonFootprint/CarbonFootprint/0/9';

    const semanticIdSMCProductCarbonFootprint =
        'https://admin-shell.io/idta/CarbonFootprint/ProductCarbonFootprint/0/9';

    const pcfLifeCyclePhases = [
        {
            valueId: '0173-1#07-ABU208#001',
            value: 'A1 - raw material supply (and upstream production)',
            identifier: 'A1',
            icon: 'mdi-raw',
        },
        {
            valueId: '0173-1#07-ABU209#001',
            value: 'A2 - cradle-to-gate transport to factory',
            identifier: 'A2',
            icon: 'mdi-truck-outline',
        },
        {
            valueId: '0173-1#07-ABU210#001',
            value: 'A3 - production',
            identifier: 'A3',
            icon: 'mdi-robot-industrial',
        },
        {
            valueId: '0173-1#07-ABU211#001',
            value: 'A4 - transport to final destination',
            identifier: 'A4',
            icon: 'mdi-truck-outline',
        },
        {
            valueId: '0173-1#07-ABU212#001',
            value: 'B1 - usage phase',
            identifier: 'B1',
            icon: '',
        },
        {
            valueId: '0173-1#07-ABV498#001',
            value: 'B2 - maintenance',
            identifier: 'B2',
            icon: 'mdi-wrench-clock',
        },
        {
            valueId: '0173-1#07-ABV497#001',
            value: 'B3 - repair',
            identifier: 'B3',
            icon: 'mdi-wrench',
        },
        {
            valueId: '0173-1#07-ABV499#001',
            value: 'B5 - update/upgrade, refurbishing',
            identifier: 'B5',
            icon: 'mdi-update',
        },
        {
            valueId: '0173-1#07-ABV500#001',
            value: 'B6 - usage energy consumption',
            identifier: 'B6',
            icon: 'mdi-flash-outline',
        },
        {
            valueId: '0173-1#07-ABV501#001',
            value: 'B7 - usage water consumption',
            identifier: 'B7',
            icon: 'mdi-water-outline',
        },
        {
            valueId: '0173-1#07-ABV502#001',
            value: 'C1 - reassembly',
            identifier: 'C1',
            icon: 'mdi-robot-industrial',
        },
        {
            valueId: '0173-1#07-ABU213#001',
            value: 'C2 - transport to recycler',
            identifier: 'C2',
            icon: 'mdi-truck-outline',
        },
        {
            valueId: '0173-1#07-ABV503#001',
            value: 'C3 - recycling, waste treatment',
            identifier: 'C3',
            icon: 'mdi-recycle',
        },
        {
            valueId: '0173-1#07-ABV504#001',
            value: 'C4 - landfill',
            identifier: 'C4',
            icon: '',
        },
        {
            valueId: '0173-1#07-ABU214#001',
            value: 'D - reuse',
            identifier: 'D',
            icon: '',
        },
        {
            valueId: '0173-1#07-ABZ789#001',
            value: 'A1 - raw material supply (and upstream production) + A2 - cradle-to-gate transport to factory + A3 - production',
            identifier: 'A1-A3',
            icon: '',
        },
    ];

    /**
     * Retrieves Technical Data Submodel (SM) of an Asset Administration Shell (AAS).
     *
     * @async
     * @param {string} aasId - The ID of the AAS to retrieve its Technical Data SM.
     * @param {boolean} withConceptDescriptions - Flag to specify if SM should be fetched with ConceptDescriptions (CDs)
     * @returns {string} A promise that resolves to a Technical Data SM.
     */
    async function getSm(aasId: string, withConceptDescriptions: boolean = false): Promise<any> {
        const failResponse = {};

        if (!aasId) return failResponse;

        aasId = aasId.trim();

        if (aasId === '') return failResponse;

        aasId = aasId.trim();

        const smTechnicalDataId = await getSmIdOfAasIdBySemanticId(aasId, semanticId);
        const smTechnicalData = await fetchSmById(smTechnicalDataId, withConceptDescriptions);

        return smTechnicalData;
    }

    function extractProductCarbonFootprint(productCarbonFootprintSmc: any): {
        pcfCalculationMethods: Array<string>;
        pcfco2eq: string;
        pcfReferenceValueForCalculation: string;
        pcfQuantityOfMeasureForCalculation: string;
        pcfLifeCyclePhases: Array<string>;
        publicationDate: string;
        expirationDate: string;
    } {
        const failReponse = {
            pcfCalculationMethods: [],
            pcfco2eq: '',
            pcfReferenceValueForCalculation: '',
            pcfQuantityOfMeasureForCalculation: '',
            pcfLifeCyclePhases: [],
            publicationDate: '',
            expirationDate: '',
        };

        if (!productCarbonFootprintSmc || Object.keys(productCarbonFootprintSmc).length === 0) return failReponse;

        if (
            !checkSemanticId(productCarbonFootprintSmc, semanticIdSMCProductCarbonFootprint) ||
            !checkIdShort(productCarbonFootprintSmc, 'productCarbonFootprint')
        )
            return failReponse;

        const pcfCalculationMethods = productCarbonFootprintSmc.value.filter(
            (sme: any) =>
                checkIdShort(sme, 'PCFCalculationMethod', true) || checkSemanticId(sme, '0173-1#02-ABG854#002')
        );

        const pcfco2eq = productCarbonFootprintSmc.value.find(
            (sme: any) => checkIdShort(sme, 'PCFCO2eq') || checkSemanticId(sme, '0173-1#02-ABG855#001')
        );

        const pcfReferenceValueForCalculation = productCarbonFootprintSmc.value.find(
            (sme: any) =>
                checkIdShort(sme, 'PCFReferenceValueForCalculation') || checkSemanticId(sme, '0173-1#02-ABG856#001')
        );

        const pcfQuantityOfMeasureForCalculation = productCarbonFootprintSmc.value.find(
            (sme: any) =>
                checkIdShort(sme, 'PCFQuantityOfMeasureForCalculation') || checkSemanticId(sme, '0173-1#02-ABG857#001')
        );

        const pcfFLifeCyclePhases = productCarbonFootprintSmc.value.filter(
            (sme: any) => checkIdShort(sme, 'PCFLifeCyclePhase', true) || checkSemanticId(sme, '0173-1#02-ABG858#001')
        );

        const publicationDate = productCarbonFootprintSmc.value.find(
            (sme: any) =>
                checkIdShort(sme, 'PublicationDate') ||
                checkSemanticId(sme, 'https://admin-shell.io/idta/CarbonFootprint/PublicationDate/1/0')
        );

        const expirationDate = productCarbonFootprintSmc.value.find(
            (sme: any) =>
                checkIdShort(sme, 'ExpirationDate') ||
                checkSemanticId(sme, 'https://admin-shell.io/idta/CarbonFootprint/ExpirationnDate/1/0')
        );

        const response = {
            pcfCalculationMethods:
                pcfCalculationMethods && Array.isArray(pcfCalculationMethods) && pcfCalculationMethods.length > 0
                    ? pcfCalculationMethods.map((pcfCalculationMethod: any) => {
                          return pcfCalculationMethod && Object.keys(pcfCalculationMethod).length > 0
                              ? valueToDisplay(pcfCalculationMethod)
                              : '';
                      })
                    : [],
            pcfco2eq:
                pcfco2eq && Object.keys(pcfco2eq).length > 0 && valueToDisplay(pcfco2eq)
                    ? valueToDisplay(pcfco2eq)
                    : '',
            pcfReferenceValueForCalculation:
                pcfReferenceValueForCalculation &&
                Object.keys(pcfReferenceValueForCalculation).length > 0 &&
                valueToDisplay(pcfReferenceValueForCalculation)
                    ? valueToDisplay(pcfReferenceValueForCalculation)
                    : '',
            pcfQuantityOfMeasureForCalculation:
                pcfQuantityOfMeasureForCalculation &&
                Object.keys(pcfQuantityOfMeasureForCalculation).length > 0 &&
                valueToDisplay(pcfQuantityOfMeasureForCalculation)
                    ? valueToDisplay(pcfQuantityOfMeasureForCalculation)
                    : '',
            pcfLifeCyclePhases:
                pcfFLifeCyclePhases && Array.isArray(pcfFLifeCyclePhases) && pcfFLifeCyclePhases.length > 0
                    ? pcfFLifeCyclePhases.map((pcfCalculationMethod: any) => {
                          return pcfCalculationMethod && Object.keys(pcfCalculationMethod).length > 0
                              ? valueToDisplay(pcfCalculationMethod)
                              : '';
                      })
                    : [],
            publicationDate:
                publicationDate && Object.keys(publicationDate).length > 0 && valueToDisplay(publicationDate)
                    ? valueToDisplay(publicationDate)
                    : '',
            expirationDate:
                expirationDate && Object.keys(expirationDate).length > 0 && valueToDisplay(expirationDate)
                    ? valueToDisplay(expirationDate)
                    : '',
        };

        return response;
    }

    function getPcfLifeCyclePhase(pcfLifeCyclePhaseId: string): any {
        const failResponse = {};

        if (!pcfLifeCyclePhaseId || pcfLifeCyclePhaseId.trim() === '') return failResponse;

        const pcfLifeCyclePhase = pcfLifeCyclePhases.find(
            (pcfLifeCyclePhase: any) => pcfLifeCyclePhase.identifier === pcfLifeCyclePhaseId
        );

        if (pcfLifeCyclePhase && Object.keys(pcfLifeCyclePhase).length > 0) return pcfLifeCyclePhase;

        return failResponse;
    }

    return {
        semanticId,
        semanticIdSMCProductCarbonFootprint,
        pcfLifeCyclePhases,
        getSm,
        getPcfLifeCyclePhase,
        extractProductCarbonFootprint,
    };
}
