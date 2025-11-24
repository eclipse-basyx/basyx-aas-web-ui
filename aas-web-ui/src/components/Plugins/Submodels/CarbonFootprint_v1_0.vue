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
                                                    checkIdShort(sme, '0173-1#02-ABG856#003')
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
                                                    checkIdShort(sme, 'PCFCalculationMethod', true) ||
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
                                                            checkIdShort(sme, 'PCFCalculationMethod', true) ||
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
    import { onMounted, ref } from 'vue';
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

        isLoading.value = false;
    }
</script>
