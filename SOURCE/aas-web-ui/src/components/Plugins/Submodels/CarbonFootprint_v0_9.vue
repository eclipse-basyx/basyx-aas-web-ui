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
                                    v-for="pcfLifeCyclePhase in pcfSMC.value.filter(
                                        (sme: any) =>
                                            checkIdShort(sme, 'PCFLifeCyclePhase', true) ||
                                            checkIdShort(sme, 'PCFLiveCyclePhase', true) || // just for compatibility cause of a typo in a previous specification document
                                            checkSemanticId(sme, '0173-1#02-ABG858#001')
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
                                                    checkIdShort(sme, 'PCFCO2eq') ||
                                                    checkSemanticId(sme, '0173-1#02-ABG855#001')
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
                                                    checkIdShort(sme, 'PCFQuantityOfMeasureForCalculation') ||
                                                    checkSemanticId(sme, '0173-1#02-ABG857#001')
                                            )
                                        )
                                    }}
                                    {{
                                        valueToDisplay(
                                            pcfSMC.value.find(
                                                (sme: any) =>
                                                    checkIdShort(sme, 'PCFReferenceValueForCalculation') ||
                                                    checkSemanticId(sme, '0173-1#02-ABG856#001')
                                            )
                                        )
                                    }}
                                    (<template
                                        v-for="(pcfCalculationMethod, index) in pcfSMC.value.filter(
                                            (sme: any) =>
                                                checkIdShort(sme, 'PCFCalculationMethod', true) ||
                                                checkSemanticId(sme, '0173-1#02-ABG854#002')
                                        )"
                                        :key="pcfCalculationMethod.idShort">
                                        <span>
                                            {{
                                                valueToDisplay(pcfCalculationMethod) +
                                                (index !==
                                                pcfSMC.value.filter(
                                                    (sme: any) =>
                                                        checkIdShort(sme, 'PCFCalculationMethod', true) ||
                                                        checkSemanticId(sme, '0173-1#02-ABG854#002')
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
                                                    checkIdShort(sme, 'ExpirationnDate') ||
                                                    checkSemanticId(
                                                        sme,
                                                        'https://admin-shell.io/idta/CarbonFootprint/ExpirationnDate/1/0'
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
                                                            'https://admin-shell.io/idta/CarbonFootprint/ExpirationnDate/1/0'
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
                                                checkIdShort(sme, 'PCFGoodsAddressHandover') ||
                                                checkSemanticId(sme, '0173-1#02-ABI497#001')
                                        )
                                    "
                                    class="text-caption text-medium-emphasis">
                                    <v-icon size="small" class="mr-1">mdi-map-marker-outline</v-icon>
                                    <span>
                                        {{
                                            determineAddress(
                                                pcfSMC.value.find(
                                                    (sme: any) =>
                                                        checkIdShort(sme, 'PCFGoodsAddressHandover') ||
                                                        checkSemanticId(sme, '0173-1#02-ABI497#001')
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

            <v-card v-if="transportCarbonFootprints && Object.keys(transportCarbonFootprints).length > 0" class="mb-4">
                <v-card-title class="text-subtitle-1">
                    {{ 'Transport Carbon Footprint' + (Object.keys(productCarbonFootprints).length > 1 ? 's' : '') }}
                </v-card-title>
                <v-card-text>
                    <v-timeline
                        v-if="transportCarbonFootprints"
                        direction="vertical"
                        side="start"
                        class="border rounded">
                        <v-timeline-item
                            v-for="tcfSMC in transportCarbonFootprints"
                            :key="tcfSMC.idShort"
                            dot-color="primary"
                            icon="mdi-truck"
                            icon-color="background">
                            <template #opposite>
                                <template
                                    v-for="tcfProcessesForGreenhouseGasEmissionInATransportService in tcfSMC.value.filter(
                                        (sme: any) =>
                                            checkIdShort(
                                                sme,
                                                'TCFProcessesForGreenhouseGasEmissionInATransportService',
                                                true
                                            ) || checkSemanticId(sme, '0173-1#02-ABG863#002')
                                    )"
                                    :key="tcfProcessesForGreenhouseGasEmissionInATransportService.idShort">
                                    <p
                                        v-if="
                                            tcfProcessesForGreenhouseGasEmissionInATransportService?.valueId?.keys &&
                                            Array.isArray(
                                                tcfProcessesForGreenhouseGasEmissionInATransportService?.valueId?.keys
                                            ) &&
                                            tcfProcessesForGreenhouseGasEmissionInATransportService?.valueId?.keys
                                                .length > 0
                                        "
                                        style="white-space: pre-wrap">
                                        {{
                                            getTcfProcessesForGreenhouseGasEmissionInATransportServiceFromId(
                                                tcfProcessesForGreenhouseGasEmissionInATransportService?.valueId
                                                    ?.keys[0]?.value
                                            )?.value.replaceAll(', ', '\n')
                                        }}
                                    </p>
                                    <p v-else style="white-space: pre-wrap">
                                        {{
                                            valueToDisplay(
                                                tcfProcessesForGreenhouseGasEmissionInATransportService
                                            ).replaceAll(', ', '\n')
                                        }}
                                    </p>
                                </template>
                            </template>
                            <div>
                                <div class="text-h6">
                                    {{
                                        valueToDisplay(
                                            tcfSMC.value.find(
                                                (sme: any) =>
                                                    checkIdShort(sme, 'TCFCO2eq') ||
                                                    checkSemanticId(sme, '0173-1#02-ABG860#001')
                                            )
                                        )
                                    }}
                                    <span class="">CO<sub>2</sub>eq</span>
                                </div>
                                <p class="text-caption text-medium-emphasis">
                                    <span> per </span>
                                    {{
                                        valueToDisplay(
                                            tcfSMC.value.find(
                                                (sme: any) =>
                                                    checkIdShort(sme, 'TCFQuantityOfMeasureForCalculation') ||
                                                    checkSemanticId(sme, '0173-1#02-ABG862#001')
                                            )
                                        )
                                    }}
                                    {{
                                        valueToDisplay(
                                            tcfSMC.value.find(
                                                (sme: any) =>
                                                    checkIdShort(sme, 'TCFReferenceValueForCalculation') ||
                                                    checkSemanticId(sme, '0173-1#02-ABG861#002')
                                            )
                                        )
                                    }}
                                    (<template
                                        v-for="(tcfCalculationMethod, index) in tcfSMC.value.filter(
                                            (sme: any) =>
                                                checkIdShort(sme, 'TCFCalculationMethod', true) ||
                                                checkSemanticId(sme, '0173-1#02-ABG859#002')
                                        )"
                                        :key="tcfCalculationMethod.idShort">
                                        <span>
                                            {{
                                                valueToDisplay(tcfCalculationMethod) +
                                                (index !==
                                                tcfSMC.value.filter(
                                                    (sme: any) =>
                                                        checkIdShort(sme, 'TCFCalculationMethod', true) ||
                                                        checkSemanticId(sme, '0173-1#02-ABG859#002')
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
                                                tcfSMC.value.find(
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
                                            tcfSMC.value.find(
                                                (sme: any) =>
                                                    checkIdShort(sme, 'ExpirationnDate') ||
                                                    checkSemanticId(
                                                        sme,
                                                        'https://admin-shell.io/idta/CarbonFootprint/ExpirationnDate/1/0'
                                                    )
                                            )
                                        ">
                                        <span>till </span>
                                        {{
                                            valueToDisplay(
                                                tcfSMC.value.find(
                                                    (sme: any) =>
                                                        checkIdShort(sme, 'ExpirationDate') ||
                                                        checkSemanticId(
                                                            sme,
                                                            'https://admin-shell.io/idta/CarbonFootprint/ExpirationnDate/1/0'
                                                        )
                                                )
                                            )
                                        }}
                                    </span>
                                </p>
                                <p
                                    v-if="
                                        tcfSMC.value.find(
                                            (sme: any) =>
                                                checkIdShort(sme, 'TCFGoodsTransportAddressTakeover') ||
                                                checkSemanticId(sme, '0173-1#02-ABI499#001')
                                        )
                                    "
                                    class="text-caption text-medium-emphasis">
                                    <v-icon size="small" class="mr-1">mdi-map-marker-outline</v-icon>
                                    <span>
                                        {{
                                            determineAddress(
                                                tcfSMC.value.find(
                                                    (sme: any) =>
                                                        checkIdShort(sme, 'TCFGoodsTransportAddressTakeover') ||
                                                        checkSemanticId(sme, '0173-1#02-ABI499#001')
                                                )
                                            )
                                        }}
                                    </span>
                                </p>
                                <p
                                    v-if="
                                        tcfSMC.value.find(
                                            (sme: any) =>
                                                checkIdShort(sme, 'TCFGoodsTransportAddressHandover') ||
                                                checkSemanticId(sme, '0173-1#02-ABI498#001')
                                        )
                                    "
                                    class="text-caption text-medium-emphasis">
                                    <v-icon size="small">mdi-map-marker-outline</v-icon>
                                    <span>
                                        {{
                                            determineAddress(
                                                tcfSMC.value.find(
                                                    (sme: any) =>
                                                        checkIdShort(sme, 'TCFGoodsTransportAddressHandover') ||
                                                        checkSemanticId(sme, '0173-1#02-ABI498#001')
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
    import { onMounted, ref } from 'vue';
    import { useReferableUtils } from '@/composables/AAS/ReferableUtils';
    import { useSMHandling } from '@/composables/AAS/SMHandling';
    import { useSME } from '@/composables/AAS/SubmodelElements/SubmodelElement';
    import { useCarbonFootprint_v0_9Utils } from '@/composables/AAS/SubmodelTemplates/CarbonFootprint_v0_9Utils';
    import { useContactInformation_v1_0Utils } from '@/composables/AAS/SubmodelTemplates/ContactInformation_v1_0Utils';
    import { checkSemanticId } from '@/utils/AAS/SemanticIdUtils';

    // Options
    defineOptions({
        name: 'CarbonFootprint',
        semanticId: 'https://admin-shell.io/idta/CarbonFootprint/CarbonFootprint/0/9',
    });

    // Composables
    const { setData } = useSMHandling();
    const { checkIdShort } = useReferableUtils();
    const { valueToDisplay } = useSME();
    const {
        semanticIdSMCProductCarbonFootprint,
        semanticIdSMCTransportCarbonFootprint,
        getPcfLifeCyclePhaseFromId,
        getTcfProcessesForGreenhouseGasEmissionInATransportServiceFromId,
    } = useCarbonFootprint_v0_9Utils();
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
    const transportCarbonFootprints = ref({} as any);

    onMounted(() => {
        initializeVisualization();
    });

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

        productCarbonFootprints.value = carbonFootprintData.value.submodelElements.filter((sme: any) => {
            return (
                checkIdShort(sme, 'ProductCarbonFootprint') || checkSemanticId(sme, semanticIdSMCProductCarbonFootprint)
            );
        });

        transportCarbonFootprints.value = carbonFootprintData.value.submodelElements.filter((sme: any) => {
            return (
                checkIdShort(sme, 'TransportCarbonFootprint') ||
                checkSemanticId(sme, semanticIdSMCTransportCarbonFootprint)
            );
        });

        isLoading.value = false;
    }
</script>
