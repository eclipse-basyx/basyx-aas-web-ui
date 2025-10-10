<template>
    <v-container fluid class="pa-0">
        <VisualizationHeader
            :submodel-element-data="submodelElementData"
            default-title="Technical Data for Industrial Equipment in Manufacturing"></VisualizationHeader>
        <!-- Loading -->
        <v-card v-if="isLoading" class="mb-4">
            <v-skeleton-loader
                type="list-item-avatar, divider, list-item-avatar, divider, list-item-avatar, divider, list-item-avatar"
                :height="288"></v-skeleton-loader>
        </v-card>
        <template v-else-if="Object.keys(technicalData).length > 0">
            <v-expansion-panels v-model="panel" multiple>
                <!-- General Information -->
                <template v-if="generalInformationProperties.length > 0">
                    <v-expansion-panel>
                        <v-expansion-panel-title>
                            <v-list-item class="pa-0">
                                <template #prepend>
                                    <v-icon size="small">mdi-file-document-outline</v-icon>
                                </template>
                                <v-list-item-title>
                                    {{ nameToDisplay(generalInformationSMC, 'en', 'General Information') }}
                                    <DescriptionTooltip :description-array="generalInformationSMC?.description" />
                                </v-list-item-title>
                            </v-list-item>
                        </v-expansion-panel-title>
                        <v-divider v-if="panel.includes(0)"></v-divider>
                        <v-expansion-panel-text class="pt-4 pb-2">
                            <v-sheet border rounded>
                                <v-table>
                                    <tbody>
                                        <tr
                                            v-for="(generalProperty, index) in generalInformationProperties"
                                            :key="generalProperty.idShort"
                                            :class="index % 2 === 0 ? 'bg-tableEven' : 'bg-tableOdd'">
                                            <td>
                                                <div class="text-subtitleText text-caption">
                                                    <span>{{ nameToDisplay(generalProperty) }}</span>
                                                    <DescriptionTooltip
                                                        :description-array="generalProperty?.description" />
                                                </div>
                                            </td>
                                            <td>
                                                <!-- Files -->
                                                <v-img
                                                    v-if="
                                                        checkIdShort(generalProperty, 'ManufacturerLogo') ||
                                                        checkIdShort(generalProperty, 'ProductImage') ||
                                                        checkSemanticId(
                                                            generalProperty,
                                                            'https://admin-shell.io/ZVEI/TechnicalData/ManufacturerLogo/1/1'
                                                        ) ||
                                                        checkSemanticId(
                                                            generalProperty,
                                                            'https://admin-shell.io/ZVEI/TechnicalData/ProductImage/1/1'
                                                        )
                                                    "
                                                    :src="getBlobUrl(generalProperty)"
                                                    max-width="300px"
                                                    max-height="300px"
                                                    contain
                                                    class="my-2"></v-img>
                                                <!-- MultiLanguageProperties -->
                                                <template
                                                    v-else-if="generalProperty.modelType == 'MultiLanguageProperty'">
                                                    <!-- Show english value, if available -->
                                                    <div v-if="valueToDisplay(generalProperty)" class="text-caption">
                                                        {{ valueToDisplay(generalProperty) }}
                                                    </div>
                                                    <!-- Otherwise show all available values -->
                                                    <template
                                                        v-for="(langStringSet, j) in generalProperty.value"
                                                        v-else
                                                        :key="j">
                                                        <div v-if="langStringSet?.text.length > 0" class="text-caption">
                                                            <v-chip size="x-small" label class="mr-1">{{
                                                                langStringSet.language
                                                            }}</v-chip>
                                                            {{ langStringSet?.text }}
                                                        </div>
                                                    </template>
                                                </template>
                                                <!-- Default -->
                                                <span v-else class="text-caption">
                                                    {{ valueToDisplay(generalProperty) }}
                                                </span>
                                            </td>
                                        </tr>
                                    </tbody>
                                </v-table>
                            </v-sheet>
                        </v-expansion-panel-text>
                    </v-expansion-panel>
                </template>
                <!-- Product Classifications -->
                <template v-if="productClassifications.length > 0">
                    <v-expansion-panel>
                        <v-expansion-panel-title>
                            <v-list-item class="pa-0">
                                <template #prepend>
                                    <v-icon size="small">mdi-package-variant-closed</v-icon>
                                </template>
                                <v-list-item-title>
                                    {{ nameToDisplay(productClassificationsSMC, 'en', 'Product Classifications') }}
                                    <DescriptionTooltip :description-array="productClassificationsSMC?.description" />
                                </v-list-item-title>
                            </v-list-item>
                        </v-expansion-panel-title>
                        <v-divider v-if="panel.includes(1)"></v-divider>
                        <v-expansion-panel-text class="pb-2">
                            <v-card variant="outlined" class="mt-3">
                                <v-table>
                                    <thead>
                                        <tr v-if="productClassifications.length > 0">
                                            <th
                                                v-for="classificationProperty in productClassifications[0].value"
                                                :key="classificationProperty.idShort">
                                                <div class="text-caption">
                                                    <span>{{ nameToDisplay(classificationProperty) }}</span>
                                                    <DescriptionTooltip
                                                        :description-array="classificationProperty?.description" />
                                                </div>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <template
                                            v-for="(productClassification, index) in productClassifications"
                                            :key="productClassification.idShort">
                                            <tr
                                                v-if="hasValue(productClassification)"
                                                :class="index % 2 === 0 ? 'bg-tableEven' : 'bg-tableOdd'">
                                                <td
                                                    v-for="classificationProperty in productClassification.value"
                                                    :key="classificationProperty.idShort">
                                                    <!-- MultiLanguageProperties -->
                                                    <template
                                                        v-if="
                                                            classificationProperty.modelType == 'MultiLanguageProperty'
                                                        ">
                                                        <!-- Show english value, if available -->
                                                        <div
                                                            v-if="valueToDisplay(classificationProperty)"
                                                            class="text-caption text-subtitleText">
                                                            {{ valueToDisplay(classificationProperty) }}
                                                        </div>
                                                        <!-- Otherwise show all available values -->
                                                        <template
                                                            v-for="(langStringSet, k) in classificationProperty.value"
                                                            v-else
                                                            :key="k">
                                                            <div
                                                                v-if="langStringSet?.text.length > 0"
                                                                class="text-caption">
                                                                <v-chip size="x-small" label class="mr-1">{{
                                                                    langStringSet.language
                                                                }}</v-chip>
                                                                {{ langStringSet?.text }}
                                                            </div>
                                                        </template>
                                                    </template>
                                                    <!-- Default -->
                                                    <span v-else class="text-caption text-subtitleText">
                                                        {{ valueToDisplay(classificationProperty) }}
                                                    </span>
                                                </td>
                                            </tr>
                                        </template>
                                    </tbody>
                                </v-table>
                            </v-card>
                        </v-expansion-panel-text>
                    </v-expansion-panel>
                </template>
                <!-- Technical Properties -->
                <template v-if="technicalProperties.length > 0">
                    <v-expansion-panel>
                        <v-expansion-panel-title v-slot="{ expanded }">
                            <v-list-item class="pa-0">
                                <template #prepend>
                                    <v-icon size="small">mdi-cog-outline</v-icon>
                                </template>
                                <v-list-item-title>
                                    {{ nameToDisplay(technicalPropertiesSMC, 'en', 'Technical Properties') }}
                                    <DescriptionTooltip :description-array="technicalPropertiesSMC?.description" />
                                </v-list-item-title>
                                <template #append>
                                    <v-switch
                                        v-if="expanded"
                                        v-model="tableView"
                                        color="primary"
                                        label="Table view"
                                        hide-details
                                        density="compact"
                                        class="ml-5"
                                        @click.stop></v-switch>
                                </template>
                            </v-list-item>
                        </v-expansion-panel-title>
                        <v-divider v-if="panel.includes(2)"></v-divider>
                        <v-expansion-panel-text class="pb-2">
                            <GenericDataVisu
                                v-if="!tableView"
                                class="mt-3"
                                :submodel-element-data="technicalProperties"></GenericDataVisu>
                            <template v-else>
                                <v-card border class="mt-3">
                                    <v-table density="comfortable" hover>
                                        <thead class="bg-tableHeader">
                                            <tr>
                                                <th class="text-titleText">SubmodelElement</th>
                                                <th class="text-titleText">Description</th>
                                                <th class="text-titleText">Definition</th>
                                                <th class="text-titleText">Value</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <GenericDataTableView
                                                class="mt-3"
                                                :submodel-element-data="technicalProperties"
                                                :level="0"></GenericDataTableView>
                                        </tbody>
                                    </v-table>
                                </v-card>
                            </template>
                        </v-expansion-panel-text>
                    </v-expansion-panel>
                </template>
                <!-- Further Information -->
                <template v-if="furtherInformation.length > 0">
                    <v-expansion-panel>
                        <v-expansion-panel-title>
                            <v-list-item class="pa-0">
                                <template #prepend>
                                    <v-icon size="small">mdi-information-outline</v-icon>
                                </template>
                                <v-list-item-title>
                                    {{ nameToDisplay(furtherInformationSMC, 'en', 'Further Information') }}
                                    <DescriptionTooltip :description-array="furtherInformationSMC?.description" />
                                </v-list-item-title>
                            </v-list-item>
                        </v-expansion-panel-title>
                        <v-divider v-if="panel.includes(3)"></v-divider>
                        <v-expansion-panel-text class="pt-4 pb-2">
                            <v-sheet border rounded>
                                <v-table v-if="furtherInformation.length > 0">
                                    <tbody>
                                        <template
                                            v-for="(furtherInfo, index) in furtherInformation"
                                            :key="furtherInfo.idShort">
                                            <tr
                                                v-if="hasValue(furtherInfo)"
                                                :class="index % 2 === 0 ? 'bg-tableEven' : 'bg-tableOdd'">
                                                <td>
                                                    <div class="text-subtitleText text-caption">
                                                        <span>{{ nameToDisplay(furtherInfo) }}</span>
                                                        <DescriptionTooltip
                                                            :description-array="furtherInfo?.description" />
                                                    </div>
                                                </td>
                                                <td>
                                                    <!-- MultiLanguageProperties -->
                                                    <template v-if="furtherInfo.modelType == 'MultiLanguageProperty'">
                                                        <!-- Show english value, if available -->
                                                        <div v-if="valueToDisplay(furtherInfo)" class="text-caption">
                                                            {{ valueToDisplay(furtherInfo) }}
                                                        </div>
                                                        <!-- Otherwise show all available values -->
                                                        <template
                                                            v-for="(langStringSet, k) in furtherInfo.value"
                                                            v-else
                                                            :key="k">
                                                            <div
                                                                v-if="langStringSet?.text.length > 0"
                                                                class="text-caption">
                                                                <v-chip size="x-small" label class="mr-1">{{
                                                                    langStringSet.language
                                                                }}</v-chip>
                                                                {{ langStringSet?.text }}
                                                            </div>
                                                        </template>
                                                    </template>
                                                    <!-- Default -->
                                                    <span v-else class="text-caption">
                                                        {{ valueToDisplay(furtherInfo) }}
                                                    </span>
                                                </td>
                                            </tr>
                                        </template>
                                    </tbody>
                                </v-table>
                            </v-sheet>
                        </v-expansion-panel-text>
                    </v-expansion-panel>
                </template>
            </v-expansion-panels>
        </template>
    </v-container>
</template>

<script lang="ts" setup>
    import { computed, onMounted, ref } from 'vue';
    import { useReferableUtils } from '@/composables/AAS/ReferableUtils';
    import { useSMHandling } from '@/composables/AAS/SMHandling';
    import { useSMEFile } from '@/composables/AAS/SubmodelElements/File';
    import { useSME } from '@/composables/AAS/SubmodelElements/SubmodelElement';
    import { useAASStore } from '@/store/AASDataStore';
    import { checkSemanticId, getSubmodelElementBySemanticId } from '@/utils/AAS/SemanticIdUtils';

    // Define component options such as custom static properties
    defineOptions({
        name: 'TechnicalData',
        semanticId: 'https://admin-shell.io/ZVEI/TechnicalData/Submodel/1/2',
    });

    // Stores
    const aasStore = useAASStore();

    // Composables
    const { setData } = useSMHandling();
    const { nameToDisplay, checkIdShort } = useReferableUtils();
    const { hasValue, valueToDisplay } = useSME();
    const { valueBlob } = useSMEFile();

    // Properties
    const props = defineProps({
        submodelElementData: {
            type: Object as any,
            default: {} as any,
        },
    });

    // Data
    const isLoading = ref(false);
    const technicalData = ref({} as any);
    const panel = ref([] as Array<number>);
    const generalInformationSMC = ref({} as any);
    const generalInformationProperties = ref([] as Array<any>);
    const productClassificationsSMC = ref({} as any);
    const productClassifications = ref([] as Array<any>);
    const technicalPropertiesSMC = ref({} as any);
    const technicalProperties = ref([] as Array<any>);
    const furtherInformationSMC = ref({} as any);
    const furtherInformation = ref([] as Array<any>);
    const tableView = ref(true as boolean);
    const blobUrls = ref<Record<string, string>>({});

    // Computed Properties
    const selectedNode = computed(() => aasStore.getSelectedNode);

    onMounted(() => {
        initializeVisualization();
    });

    async function initializeVisualization(): Promise<void> {
        isLoading.value = true;

        if (!props.submodelElementData || Object.keys(props.submodelElementData).length === 0) {
            technicalData.value = {};
            isLoading.value = false;
            return;
        }

        technicalData.value = await setData({ ...props.submodelElementData }, selectedNode.value.path, true);

        extractGeneralInformation(technicalData.value);
        extractProductClassifications(technicalData.value);
        extractTechnicalProperties(technicalData.value);
        extractFurtherInformation(technicalData.value);

        isLoading.value = false;
    }

    function extractGeneralInformation(technicalData: any): void {
        let generalInformationSMC_local = getSubmodelElementBySemanticId(
            'https://admin-shell.io/ZVEI/TechnicalData/GeneralInformation/1/1',
            technicalData
        );

        if (hasValue(generalInformationSMC_local)) {
            generalInformationSMC.value = generalInformationSMC_local;
            generalInformationProperties.value = generalInformationSMC_local.value;
        }
    }

    function extractProductClassifications(technicalData: any): void {
        let productClassificationsSMC_local = getSubmodelElementBySemanticId(
            'https://admin-shell.io/ZVEI/TechnicalData/ProductClassifications/1/1',
            technicalData
        );

        if (hasValue(productClassificationsSMC_local)) {
            productClassificationsSMC.value = productClassificationsSMC_local;
            productClassifications.value = productClassificationsSMC_local.value;
        }
    }

    function extractTechnicalProperties(technicalData: any): void {
        let technicalPropertiesSMC_local = getSubmodelElementBySemanticId(
            'https://admin-shell.io/ZVEI/TechnicalData/TechnicalProperties/1/1',
            technicalData
        );

        if (hasValue(technicalPropertiesSMC_local)) {
            technicalPropertiesSMC.value = technicalPropertiesSMC_local;
            technicalProperties.value = technicalPropertiesSMC_local.value;
        }
    }

    function extractFurtherInformation(technicalData: any): void {
        let furtherInformationSMC_local = getSubmodelElementBySemanticId(
            'https://admin-shell.io/ZVEI/TechnicalData/FurtherInformation/1/1',
            technicalData
        );

        if (hasValue(furtherInformationSMC_local)) {
            furtherInformationSMC.value = furtherInformationSMC_local;
            furtherInformation.value = furtherInformationSMC_local.value;
        }
    }

    function getBlobUrl(property: any): string {
        // Check if we've already resolved this URL
        if (blobUrls.value[property.idShort]) {
            return blobUrls.value[property.idShort];
        }
        // Otherwise, call valueBlob and cache the result
        valueBlob(property).then((url: string) => {
            blobUrls.value[property.idShort] = url;
        });
        // Return an empty string (or a placeholder) until resolved
        return '';
    }
</script>
