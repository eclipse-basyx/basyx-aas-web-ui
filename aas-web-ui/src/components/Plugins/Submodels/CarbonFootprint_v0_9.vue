<template>
    <v-container fluid class="pa-0">
        <VisualizationHeader
            :submodel-element-data="submodelElementData"
            default-title="Digital Nameplate for industrial equipment"></VisualizationHeader>
        <!-- Loading -->
        <v-card v-if="isLoading" class="mb-4">
            <v-skeleton-loader type="list-item" />
            <v-skeleton-loader type="divider" />
            <v-skeleton-loader type="list-item" />
        </v-card>
        <template v-else-if="Object.keys(carbonFootprintData).length > 0">
            <v-timeline v-if="productCarbonFootprints" direction="vertical" side="start">
                <v-timeline-item
                    v-for="pcfSMC in productCarbonFootprints"
                    :key="pcfSMC.idShort"
                    dot-color="primary"
                    icon="mdi-leaf">
                    <template #opposite>
                        <template
                            v-for="pcfLifeCyclePhase in pcfSMC.value.filter(
                                (sme: any) =>
                                    checkIdShort(sme, 'PCFLifeCyclePhase', true) ||
                                    checkIdShort(sme, 'PCFLiveCyclePhase', true) || // just for compatibility cause of a typo in a previous specification document
                                    checkSemanticId(sme, '0173-1#02-ABG858#001')
                            )"
                            :key="pcfLifeCyclePhase.idShort">
                            <p
                                v-if="
                                    pcfLifeCyclePhase?.valueId?.keys &&
                                    Array.isArray(pcfLifeCyclePhase?.valueId?.keys) &&
                                    pcfLifeCyclePhase?.valueId?.keys.length > 0
                                "
                                v-html="
                                    getPcfLifeCyclePhaseFromId(
                                        pcfLifeCyclePhase?.valueId?.keys[0]?.value
                                    )?.value.replaceAll(', ', '<br />')
                                "></p>
                            <p v-else v-html="valueToDisplay(pcfLifeCyclePhase).replaceAll(', ', '<br />')"></p>
                        </template>
                    </template>
                    <div>
                        <div class="text-h5 font-weight-bold">
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
                        <p>
                            <span class="text-caption"> per </span>
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
                        <p>
                            <v-icon size="small">mdi-calendar</v-icon>
                            <span class="text-caption">valid from </span>
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
                                <span class="text-caption">till </span>
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
                            ">
                            <v-icon size="small">mdi-map-marker-outline</v-icon>
                            <span class="text-caption">
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

            <v-divider class="my-4" />

            <v-timeline v-if="transportCarbonFootprints" direction="vertical" side="start">
                <v-timeline-item
                    v-for="tcfSMC in transportCarbonFootprints"
                    :key="tcfSMC.idShort"
                    dot-color="primary"
                    icon="mdi-truck">
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
                                    tcfProcessesForGreenhouseGasEmissionInATransportService?.valueId?.keys.length > 0
                                "
                                v-html="
                                    getTcfProcessesForGreenhouseGasEmissionInATransportServiceFromId(
                                        tcfProcessesForGreenhouseGasEmissionInATransportService?.valueId?.keys[0]?.value
                                    )?.value.replaceAll(', ', '<br />')
                                "></p>
                            <p
                                v-else
                                v-html="
                                    valueToDisplay(tcfProcessesForGreenhouseGasEmissionInATransportService).replaceAll(
                                        ', ',
                                        '<br />'
                                    )
                                "></p>
                        </template>
                    </template>
                    <div>
                        <div class="text-h5 font-weight-bold">
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
                        <p>
                            <span class="text-caption"> per </span>
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
                        <p>
                            <v-icon size="small">mdi-calendar</v-icon>
                            <span class="text-caption">valid from </span>
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
                                <span class="text-caption">till </span>
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
                            ">
                            <v-icon size="small">mdi-map-marker-outline</v-icon>
                            <span class="text-caption">
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
                            ">
                            <v-icon size="small">mdi-map-marker-outline</v-icon>
                            <span class="text-caption">
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

        // isLoading.value = false;
    }
</script>
