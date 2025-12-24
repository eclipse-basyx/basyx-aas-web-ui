<template>
    <v-container fluid class="pa-0">
        <VisualizationHeader
            :submodel-element-data="submodelElementData"
            default-title="Carbon Footprint"></VisualizationHeader>
        <!-- Loading -->
        <v-sheet v-if="isLoading" class="mb-4" color="transparent">
            <v-card class="mb-4">
                <v-skeleton-loader type="subtitle" />
                <v-skeleton-loader type="image" />
            </v-card>
            <v-card>
                <v-skeleton-loader type="subtitle" />
                <v-skeleton-loader type="image" />
            </v-card>
        </v-sheet>
        <template v-else-if="Object.keys(carbonFootprintData).length > 0">
            <!-- Pie Chart -->
            <v-card v-if="showPieChart && pieChartData && pieChartData.length > 0" class="mb-4">
                <v-card-title class="text-subtitle-1">Carbon Footprint Distribution</v-card-title>
                <v-card-text>
                    <PieChart :chart-data="pieChartData" />
                </v-card-text>
            </v-card>
            <!-- Pie Chart Warning -->
            <v-card v-else-if="pieChartWarning" class="mb-4">
                <v-card-text>
                    <v-alert type="info" variant="tonal" icon="mdi-information-outline">
                        {{ pieChartWarning }}
                    </v-alert>
                </v-card-text>
            </v-card>
            <!-- Timeline -->
            <v-card v-if="productCarbonFootprints && Object.keys(productCarbonFootprints).length > 0" class="mb-4">
                <v-card-title class="text-subtitle-1">
                    {{ 'Product Carbon Footprint' + (Object.keys(productCarbonFootprints).length > 1 ? 's' : '') }}
                </v-card-title>
                <v-card-text>
                    <v-timeline direction="vertical" side="start" class="border rounded">
                        <v-timeline-item
                            v-for="pcfSMC in productCarbonFootprints"
                            :key="pcfSMC.idShort"
                            dot-color="primary"
                            icon="mdi-leaf"
                            icon-color="background">
                            <template #opposite>
                                <div
                                    v-for="pcfLifeCyclePhase in pcfSMC.value
                                        .find(
                                            (sme: any) =>
                                                checkIdShort(sme, 'LifeCyclePhases') ||
                                                checkSemanticId(
                                                    sme,
                                                    'https://admin-shell.io/idta/CarbonFootprint/LifeCyclePhases/1/0'
                                                )
                                        )
                                        .value.filter(
                                            (sme: any) =>
                                                checkIdShort(sme, 'LifeCyclePhase') ||
                                                checkSemanticId(sme, '0173-1#02-ABG858#003')
                                        )"
                                    :key="pcfLifeCyclePhase.idShort"
                                    class="pr-6">
                                    <p
                                        v-if="
                                            pcfLifeCyclePhase?.valueId?.keys &&
                                            Array.isArray(pcfLifeCyclePhase?.valueId?.keys) &&
                                            pcfLifeCyclePhase?.valueId?.keys.length > 0
                                        ">
                                        {{
                                            getPcfLifeCyclePhaseFromId(
                                                pcfLifeCyclePhase?.valueId?.keys[0]?.value
                                            )?.value.replaceAll(', ', '\n')
                                        }}
                                    </p>
                                    <p v-else>
                                        {{ valueToDisplay(pcfLifeCyclePhase).replaceAll(', ', '\n') }}
                                    </p>
                                </div>
                            </template>
                            <div class="pl-6">
                                <div class="text-h6">
                                    {{
                                        valueToDisplay(
                                            pcfSMC.value.find(
                                                (sme: any) =>
                                                    checkIdShort(sme, 'PcfCO2eq') ||
                                                    checkSemanticId(sme, '0173-1#02-ABG855#003')
                                            )
                                        )
                                    }}
                                    <span class="">CO<sub>2</sub>eq</span>
                                </div>
                                <p class="text-caption text-medium-emphasis">
                                    <span> per </span>
                                    {{
                                        valueToDisplay(
                                            pcfSMC.value.find(
                                                (sme: any) =>
                                                    checkIdShort(sme, 'QuantityOfMeasureForCalculation') ||
                                                    checkSemanticId(sme, '0173-1#02-ABG857#003')
                                            )
                                        )
                                    }}
                                    {{
                                        valueToDisplay(
                                            pcfSMC.value.find(
                                                (sme: any) =>
                                                    checkIdShort(sme, 'ReferenceImpactUnitForCalculation') ||
                                                    checkSemanticId(sme, '0173-1#02-ABG856#003')
                                            )
                                        )
                                    }}
                                    (<template
                                        v-for="(pcfCalculationMethod, index) in pcfSMC.value
                                            .find(
                                                (sme: any) =>
                                                    checkIdShort(sme, 'PcfCalculationMethods') ||
                                                    checkSemanticId(
                                                        sme,
                                                        'https://admin-shell.io/idta/CarbonFootprint/PcfCalculationMethods/1/0'
                                                    )
                                            )
                                            .value.filter(
                                                (sme: any) =>
                                                    checkIdShort(sme, 'PcfCalculationMethod', true) ||
                                                    checkSemanticId(sme, '0173-1#02-ABG854#003')
                                            )"
                                        :key="pcfCalculationMethod.idShort">
                                        <span>
                                            {{
                                                valueToDisplay(pcfCalculationMethod) +
                                                (index !==
                                                pcfSMC.value
                                                    .find(
                                                        (sme: any) =>
                                                            checkIdShort(sme, 'PcfCalculationMethods') ||
                                                            checkSemanticId(
                                                                sme,
                                                                'https://admin-shell.io/idta/CarbonFootprint/PcfCalculationMethods/1/0'
                                                            )
                                                    )
                                                    .value.filter(
                                                        (sme: any) =>
                                                            checkIdShort(sme, 'PcfCalculationMethod', true) ||
                                                            checkSemanticId(sme, '0173-1#02-ABG854#003')
                                                    ).length -
                                                    1
                                                    ? ', '
                                                    : '')
                                            }}
                                        </span> </template
                                    >)
                                </p>
                                <p class="text-caption text-medium-emphasis">
                                    <v-icon size="small" class="mr-1">mdi-calendar</v-icon>
                                    <span>valid from </span>
                                    <span>
                                        {{
                                            valueToDisplay(
                                                pcfSMC.value.find(
                                                    (sme: any) =>
                                                        checkIdShort(sme, 'PublicationDate') ||
                                                        checkSemanticId(
                                                            sme,
                                                            'https://admin-shell.io/idta/CarbonFootprint/PublicationDate/1/0'
                                                        )
                                                )
                                            )
                                        }}
                                    </span>
                                    <span
                                        v-if="
                                            pcfSMC.value.find(
                                                (sme: any) =>
                                                    checkIdShort(sme, 'ExpirationDate') ||
                                                    checkSemanticId(
                                                        sme,
                                                        'https://admin-shell.io/idta/CarbonFootprint/ExpirationDate/1/0'
                                                    )
                                            )
                                        ">
                                        <span class="text-medium-emphasis">till </span>
                                        {{
                                            valueToDisplay(
                                                pcfSMC.value.find(
                                                    (sme: any) =>
                                                        checkIdShort(sme, 'ExpirationDate') ||
                                                        checkSemanticId(
                                                            sme,
                                                            'https://admin-shell.io/idta/CarbonFootprint/ExpirationDate/1/0'
                                                        )
                                                )
                                            )
                                        }}
                                    </span>
                                </p>
                                <p
                                    v-if="
                                        pcfSMC.value.find(
                                            (sme: any) =>
                                                checkIdShort(sme, 'GoodsHandoverAddress') ||
                                                checkSemanticId(
                                                    sme,
                                                    'https://admin-shell.io/zvei/nameplate/1/0/ContactInformations/AddressInformation'
                                                )
                                        )
                                    "
                                    class="text-caption text-medium-emphasis">
                                    <v-icon size="small" class="mr-1">mdi-map-marker-outline</v-icon>
                                    <span>
                                        {{
                                            determineAddress(
                                                pcfSMC.value.find(
                                                    (sme: any) =>
                                                        checkIdShort(sme, 'GoodsHandoverAddress') ||
                                                        checkSemanticId(
                                                            sme,
                                                            'https://admin-shell.io/zvei/nameplate/1/0/ContactInformations/AddressInformation'
                                                        )
                                                )
                                            )
                                        }}
                                    </span>
                                </p>
                            </div>
                        </v-timeline-item>
                    </v-timeline>
                </v-card-text>
            </v-card>
        </template>
    </v-container>
</template>

<script lang="ts" setup>
    import { onMounted, ref, watch } from 'vue';
    import { useReferableUtils } from '@/composables/AAS/ReferableUtils';
    import { useSMHandling } from '@/composables/AAS/SMHandling';
    import { useSME } from '@/composables/AAS/SubmodelElements/SubmodelElement';
    import { useCarbonFootprint_v1_0Utils } from '@/composables/AAS/SubmodelTemplates/CarbonFootprint_v1_0Utils';
    import { useContactInformation_v1_0Utils } from '@/composables/AAS/SubmodelTemplates/ContactInformation_v1_0Utils';
    import { checkSemanticId } from '@/utils/AAS/SemanticIdUtils';

    // Options
    defineOptions({
        name: 'CarbonFootprint',
        semanticId: 'https://admin-shell.io/idta/CarbonFootprint/CarbonFootprint/1/0',
    });

    // Composables
    const { setData } = useSMHandling();
    const { checkIdShort } = useReferableUtils();
    const { valueToDisplay } = useSME();
    const { semanticIdSmcProductCarbonFootprint, semanticIdSmlProductCarbonFootprints, getPcfLifeCyclePhaseFromId } =
        useCarbonFootprint_v1_0Utils();
    const { determineAddress } = useContactInformation_v1_0Utils();

    // Properties
    const props = defineProps({
        submodelElementData: {
            type: Object as any,
            default: {} as any,
        },
    });

    // Data
    const isLoading = ref(false);
    const carbonFootprintData = ref({} as any);
    const productCarbonFootprints = ref({} as any);
    const pieChartData = ref([] as Array<{ label: string; value: number }>);
    const showPieChart = ref(false);
    const pieChartWarning = ref('');

    onMounted(() => {
        initializeVisualization();
    });

    watch(
        () => props.submodelElementData?.id,
        () => {
            initializeVisualization();
        }
    );

    async function initializeVisualization(): Promise<void> {
        isLoading.value = true;

        if (!props.submodelElementData || Object.keys(props.submodelElementData).length === 0) {
            carbonFootprintData.value = {};
            isLoading.value = false;
            return;
        }

        carbonFootprintData.value = await setData(
            { ...props.submodelElementData },
            props.submodelElementData.path,
            true
        );

        if (!carbonFootprintData.value?.submodelElements) {
            isLoading.value = false;
            return;
        }

        const productCarbonFootprintsSml = carbonFootprintData.value.submodelElements.find((sme: any) => {
            return (
                checkIdShort(sme, 'ProductCarbonFootprint') || // Wrong semanticId was specified in SMT Spec v1.0
                checkIdShort(sme, 'ProductCarbonFootprints') ||
                checkSemanticId(sme, semanticIdSmlProductCarbonFootprints)
            );
        });

        if (productCarbonFootprintsSml && Object.keys(productCarbonFootprintsSml).length > 0) {
            productCarbonFootprints.value = productCarbonFootprintsSml.value.filter((sme: any) => {
                return (
                    checkIdShort(sme, 'ProductCarbonFootprint') ||
                    checkSemanticId(sme, semanticIdSmcProductCarbonFootprint)
                );
            });
        }

        // Prepare pie chart data
        preparePieChartData();

        isLoading.value = false;
    }

    function preparePieChartData(): void {
        pieChartData.value = [];
        showPieChart.value = false;
        pieChartWarning.value = '';

        if (!productCarbonFootprints.value || productCarbonFootprints.value.length === 0) {
            return;
        }

        // Only show pie chart if there are multiple PCFs
        if (productCarbonFootprints.value.length < 2) {
            return;
        }

        // Check compatibility of all PCFs
        const pcfMetadata: Array<{
            calculationMethods: string[];
            referenceUnit: string;
            quantity: string;
        }> = [];

        productCarbonFootprints.value.forEach((pcfSMC: any) => {
            // Extract calculation methods
            const pcfCalculationMethodsSml = pcfSMC.value.find(
                (sme: any) =>
                    checkIdShort(sme, 'PcfCalculationMethods') ||
                    checkSemanticId(sme, 'https://admin-shell.io/idta/CarbonFootprint/PcfCalculationMethods/1/0')
            );

            const calculationMethods =
                pcfCalculationMethodsSml?.value
                    ?.filter(
                        (sme: any) =>
                            checkIdShort(sme, 'PcfCalculationMethod', true) ||
                            checkSemanticId(sme, '0173-1#02-ABG854#003')
                    )
                    .map((method: any) => valueToDisplay(method))
                    .sort() || [];

            // Extract reference unit
            const referenceUnitElement = pcfSMC.value.find(
                (sme: any) =>
                    checkIdShort(sme, 'ReferenceImpactUnitForCalculation') ||
                    checkSemanticId(sme, '0173-1#02-ABG856#003')
            );
            const referenceUnit = referenceUnitElement ? valueToDisplay(referenceUnitElement) : '';

            // Extract quantity
            const quantityElement = pcfSMC.value.find(
                (sme: any) =>
                    checkIdShort(sme, 'QuantityOfMeasureForCalculation') || checkSemanticId(sme, '0173-1#02-ABG857#003')
            );
            const quantity = quantityElement ? valueToDisplay(quantityElement) : '';

            pcfMetadata.push({
                calculationMethods,
                referenceUnit,
                quantity,
            });
        });

        // Check if all PCFs are compatible
        const firstPcf = pcfMetadata[0];
        const allCompatible = pcfMetadata.every(
            (pcf) =>
                JSON.stringify(pcf.calculationMethods) === JSON.stringify(firstPcf.calculationMethods) &&
                pcf.referenceUnit === firstPcf.referenceUnit &&
                pcf.quantity === firstPcf.quantity
        );

        if (!allCompatible) {
            pieChartWarning.value =
                'Pie chart unavailable: Product Carbon Footprints use different calculation methods or reference units and cannot be directly compared.';
            return;
        }

        // If compatible, prepare pie chart data
        productCarbonFootprints.value.forEach((pcfSMC: any) => {
            // Extract PcfCO2eq value
            const pcfCO2eqElement = pcfSMC.value.find(
                (sme: any) => checkIdShort(sme, 'PcfCO2eq') || checkSemanticId(sme, '0173-1#02-ABG855#003')
            );

            if (!pcfCO2eqElement) return;

            const pcfValue = parseFloat(valueToDisplay(pcfCO2eqElement));

            if (isNaN(pcfValue)) return;

            // Extract lifecycle phases for label
            const lifeCyclePhasesSml = pcfSMC.value.find(
                (sme: any) =>
                    checkIdShort(sme, 'LifeCyclePhases') ||
                    checkSemanticId(sme, 'https://admin-shell.io/idta/CarbonFootprint/LifeCyclePhases/1/0')
            );

            let label = pcfSMC.idShort || 'PCF';

            if (lifeCyclePhasesSml && lifeCyclePhasesSml.value) {
                const lifeCyclePhases = lifeCyclePhasesSml.value.filter(
                    (sme: any) => checkIdShort(sme, 'LifeCyclePhase') || checkSemanticId(sme, '0173-1#02-ABG858#003')
                );

                if (lifeCyclePhases && lifeCyclePhases.length > 0) {
                    const phaseLabels = lifeCyclePhases
                        .map((phase: any) => {
                            if (
                                phase?.valueId?.keys &&
                                Array.isArray(phase?.valueId?.keys) &&
                                phase?.valueId?.keys.length > 0
                            ) {
                                const phaseInfo = getPcfLifeCyclePhaseFromId(phase.valueId.keys[0].value);
                                return phaseInfo?.identifier || valueToDisplay(phase);
                            }
                            return valueToDisplay(phase);
                        })
                        .filter((label: string) => label && label.trim() !== '');

                    if (phaseLabels.length > 0) {
                        label = phaseLabels.join(', ');
                    }
                }
            }

            pieChartData.value.push({
                label: label,
                value: pcfValue,
            });
        });

        showPieChart.value = pieChartData.value.length > 0;
    }
</script>
