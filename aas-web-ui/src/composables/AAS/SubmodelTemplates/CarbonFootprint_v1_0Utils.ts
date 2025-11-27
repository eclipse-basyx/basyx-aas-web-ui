import { useAASHandling } from '@/composables/AAS/AASHandling';
import { useReferableUtils } from '@/composables/AAS/ReferableUtils';
import { useSMHandling } from '@/composables/AAS/SMHandling';
import { useSME } from '@/composables/AAS/SubmodelElements/SubmodelElement';
import { checkSemanticId } from '@/utils/AAS/SemanticIdUtils';

export function useCarbonFootprint_v1_0Utils() {
    // Composables
    const { getSmIdOfAasIdBySemanticId } = useAASHandling();
    const { fetchSmById } = useSMHandling();
    const { checkIdShort } = useReferableUtils();
    const { valueToDisplay } = useSME();

    const semanticId = 'https://admin-shell.io/idta/CarbonFootprint/CarbonFootprint/1/0';

    const semanticIdSmlProductCarbonFootprints =
        'https://admin-shell.io/idta/CarbonFootprint/ProductCarbonFootprints/1/0';

    const semanticIdSmcProductCarbonFootprint =
        'https://admin-shell.io/idta/CarbonFootprint/ProductCarbonFootprint/1/0';

    const pcfLifeCyclePhases = [
        {
            valueId: '0173-1#07-ABU208#003',
            value: 'A1 - raw material supply (and upstream production)',
            identifier: 'A1',
            icon: 'mdi-raw',
        },
        {
            valueId: '0173-1#07-ABU209#003',
            value: 'A2 - cradle-to-gate transport to factory',
            identifier: 'A2',
            icon: 'mdi-truck-outline',
        },
        {
            valueId: '0173-1#07-ABU210#003',
            value: 'A3 - production',
            identifier: 'A3',
            icon: 'mdi-robot-industrial',
        },
        {
            valueId: '0173-1#07-ABU211#003',
            value: 'A4 - transport to final destination',
            identifier: 'A4',
            icon: 'mdi-truck-outline',
        },
        {
            valueId: '0173-1#07-ACC016#001',
            value: 'A5 - Installation',
            identifier: 'A5',
            icon: 'mdi-truck-outline',
        },
        {
            valueId: '0173-1#07-ABU212#003',
            value: 'B1 - usage phase',
            identifier: 'B1',
            icon: '',
        },
        {
            valueId: '0173-1#07-ABV498#003',
            value: 'B2 - maintenance',
            identifier: 'B2',
            icon: 'mdi-wrench-clock',
        },
        {
            valueId: '0173-1#07-ABV497#003',
            value: 'B3 - repair',
            identifier: 'B3',
            icon: 'mdi-wrench',
        },
        {
            valueId: '0173-1#07-ACC017#001',
            value: 'B4 - replacement',
            identifier: 'B4',
            icon: 'mdi-update',
        },
        {
            valueId: '0173-1#07-ABV499#003',
            value: 'B5 - update/upgrade, refurbishing',
            identifier: 'B5',
            icon: 'mdi-update',
        },
        {
            valueId: '0173-1#07-ABV500#003',
            value: 'B6 - usage energy consumption',
            identifier: 'B6',
            icon: 'mdi-flash-outline',
        },
        {
            valueId: '0173-1#07-ABV501#003',
            value: 'B7 - usage water consumption',
            identifier: 'B7',
            icon: 'mdi-water-outline',
        },
        {
            valueId: '0173-1#07-ABV502#003',
            value: 'C1 - reassembly',
            identifier: 'C1',
            icon: 'mdi-robot-industrial',
        },
        {
            valueId: '0173-1#07-ABU213#003',
            value: 'C2 - transport to recycler',
            identifier: 'C2',
            icon: 'mdi-truck-outline',
        },
        {
            valueId: '0173-1#07-ABV503#003',
            value: 'C3 - recycling, waste treatment',
            identifier: 'C3',
            icon: 'mdi-recycle',
        },
        {
            valueId: '0173-1#07-ABV504#003',
            value: 'C4 - landfill',
            identifier: 'C4',
            icon: '',
        },
        {
            valueId: '0173-1#07-ABU214#003',
            value: 'D - reuse',
            identifier: 'D',
            icon: '',
        },
        {
            valueId: '0173-1#07-ABZ789#003',
            value: 'A1 - raw material supply (and upstream production), A2 - cradle-to-gate transport to factory, A3 - production',
            identifier: 'A1-A3',
            icon: '',
        },
        {
            valueId: '0173-1#07-ACC013#001',
            value: 'A4 - raw material supply (and upstream production), A5 - cradle-to-gate transport to factory',
            identifier: 'A4-A5',
            icon: '',
        },
        {
            valueId: '0173-1#07-ACC014#001',
            value: 'B1 - usage phase, B2 - maintenance, B3 - repair, B4 - replacement, B5 - update/upgrade, refurbishing, B6 - usage energy consumption, B7 - usage water consumption',
            identifier: 'B1-B7',
            icon: '',
        },
        {
            valueId: '0173-1#07-ACC015#001',
            value: 'C1 - reassembly, C2 - transport to recycler, C3 - recycling, waste treatment, C4 - landfill',
            identifier: 'C1-C4',
            icon: '',
        },
        {
            valueId: '0173-1#07-ACC018#001',
            value: 'C2 - transport to recycler, C3 - recycling, waste treatment, C4 - landfill',
            identifier: 'C2-C4',
            icon: '',
        },
    ];

    /**
     * Retrieves PCF Submodel (SM) of an Asset Administration Shell (AAS).
     *
     * @async
     * @param {string} aasId - The ID of the AAS to retrieve its PCF SM.
     * @param {boolean} withConceptDescriptions - Flag to specify if SM should be fetched with ConceptDescriptions (CDs)
     * @returns {Promise<any>} A promise that resolves to a PCF SM.
     */
    async function getSm(aasId: string, withConceptDescriptions: boolean = false): Promise<any> {
        const failResponse = {};

        if (!aasId) return failResponse;

        aasId = aasId.trim();

        if (aasId === '') return failResponse;

        const smTechnicalDataId = await getSmIdOfAasIdBySemanticId(aasId, semanticId);
        const smTechnicalData = await fetchSmById(smTechnicalDataId, withConceptDescriptions);

        return smTechnicalData;
    }

    function extractProductCarbonFootprint(productCarbonFootprintSmc: any): {
        pcfCalculationMethods: Array<string>;
        pcfco2eq: string;
        pcfReferenceValueForCalculation: string;
        quantityOfMeasureForCalculation: string;
        pcfLifeCyclePhases: Array<string>;
        publicationDate: string;
        expirationDate: string;
    } {
        const failResponse = {
            pcfCalculationMethods: [],
            pcfco2eq: '',
            pcfReferenceValueForCalculation: '',
            quantityOfMeasureForCalculation: '',
            pcfLifeCyclePhases: [],
            publicationDate: '',
            expirationDate: '',
        };

        if (!productCarbonFootprintSmc || Object.keys(productCarbonFootprintSmc).length === 0) return failResponse;

        if (
            !checkSemanticId(productCarbonFootprintSmc, semanticIdSmlProductCarbonFootprints) ||
            !checkIdShort(productCarbonFootprintSmc, 'productCarbonFootprint')
        )
            return failResponse;

        const pcfCalculationMethodsSml = productCarbonFootprintSmc.value.find(
            (sme: any) =>
                checkIdShort(sme, 'PcfCalculationMethod', true) || // mistake in specification
                checkIdShort(sme, 'PcfCalculationMethods', true) ||
                checkSemanticId(sme, 'https://admin-shell.io/idta/CarbonFootprint/PcfCalculationMethods/1/0')
        );

        const pcfCalculationMethods =
            pcfCalculationMethodsSml?.value?.filter(
                (sme: any) =>
                    checkIdShort(sme, 'PcfCalculationMethod', true) || // mistake in specification
                    checkSemanticId(sme, 'https://admin-shell.io/idta/CarbonFootprint/PcfCalculationMethod/1/0')
            ) || [];

        const pcfco2eq = productCarbonFootprintSmc.value.find(
            (sme: any) => checkIdShort(sme, 'PcfCO2eq') || checkSemanticId(sme, '0173-1#02-ABG855#001')
        );

        const referenceImpactUnitForCalculation = productCarbonFootprintSmc.value.find(
            (sme: any) =>
                checkIdShort(sme, 'ReferenceImpactUnitForCalculation') || checkSemanticId(sme, '0173-1#02-ABG856#003')
        );

        const quantityOfMeasureForCalculation = productCarbonFootprintSmc.value.find(
            (sme: any) =>
                checkIdShort(sme, 'QuantityOfMeasureForCalculation') || checkSemanticId(sme, '0173-1#02-ABG857#003')
        );

        const lifeCyclePhasesSml = productCarbonFootprintSmc.value.find(
            (sme: any) =>
                checkIdShort(sme, 'LifeCyclePhases', true) ||
                checkSemanticId(sme, 'https://admin-shell.io/idta/CarbonFootprint/LifeCyclePhases/1/0')
        );

        const lifeCyclePhases =
            lifeCyclePhasesSml?.value?.filter(
                (sme: any) =>
                    checkIdShort(sme, 'LifeCyclePhase', true) || // mistake in specification
                    checkSemanticId(sme, 'https://admin-shell.io/idta/CarbonFootprint/LifeCyclePhase/1/0')
            ) || [];

        const publicationDate = productCarbonFootprintSmc.value.find(
            (sme: any) =>
                checkIdShort(sme, 'PublicationDate') ||
                checkSemanticId(sme, 'https://admin-shell.io/idta/CarbonFootprint/PublicationDate/1/0')
        );

        const expirationDate = productCarbonFootprintSmc.value.find(
            (sme: any) =>
                checkIdShort(sme, 'ExpirationDate') ||
                checkSemanticId(sme, 'https://admin-shell.io/idta/CarbonFootprint/ExpirationDate/1/0')
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
                referenceImpactUnitForCalculation &&
                Object.keys(referenceImpactUnitForCalculation).length > 0 &&
                valueToDisplay(referenceImpactUnitForCalculation)
                    ? valueToDisplay(referenceImpactUnitForCalculation)
                    : '',
            quantityOfMeasureForCalculation:
                quantityOfMeasureForCalculation &&
                Object.keys(quantityOfMeasureForCalculation).length > 0 &&
                valueToDisplay(quantityOfMeasureForCalculation)
                    ? valueToDisplay(quantityOfMeasureForCalculation)
                    : '',
            pcfLifeCyclePhases:
                lifeCyclePhases && Array.isArray(lifeCyclePhases) && lifeCyclePhases.length > 0
                    ? lifeCyclePhases.map((lifeCyclePhase: any) => {
                          return lifeCyclePhase && Object.keys(lifeCyclePhase).length > 0
                              ? valueToDisplay(lifeCyclePhase)
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

    function getPcfLifeCyclePhaseFromId(pcfLifeCyclePhaseId: string): any {
        const failResponse = {};

        if (!pcfLifeCyclePhaseId || pcfLifeCyclePhaseId.trim() === '') return failResponse;

        const pcfLifeCyclePhase = pcfLifeCyclePhases.find(
            (pcfLifeCyclePhase: any) =>
                pcfLifeCyclePhase.identifier === pcfLifeCyclePhaseId ||
                pcfLifeCyclePhase.valueId === pcfLifeCyclePhaseId
        );

        if (pcfLifeCyclePhase && Object.keys(pcfLifeCyclePhase).length > 0) return pcfLifeCyclePhase;

        return failResponse;
    }

    return {
        semanticId,
        semanticIdSmlProductCarbonFootprints,
        semanticIdSmcProductCarbonFootprint,
        pcfLifeCyclePhases,
        getSm,
        getPcfLifeCyclePhaseFromId,
        extractProductCarbonFootprint,
    };
}
