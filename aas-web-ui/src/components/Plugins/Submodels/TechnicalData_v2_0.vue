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
                                                <DescriptionTooltip :description-array="generalProperty?.description" />
                                            </div>
                                        </td>
                                        <td>
                                            <!-- File -->
                                            <v-img
                                                v-if="
                                                    checkIdShort(generalProperty, 'CompanyLogo') ||
                                                    checkSemanticId(generalProperty, '0173-1#02-ABI776#002')
                                                "
                                                :src="getBlobUrl(generalProperty)"
                                                max-width="300px"
                                                max-height="300px"
                                                contain
                                                class="my-2"></v-img>
                                            <!-- Submodel List Items -->
                                            <!-- Product Images -->
                                            <template
                                                v-else-if="
                                                    generalProperty.modelType === 'SubmodelElementList' &&
                                                    checkIdShort(generalProperty, 'ProductImages')
                                                ">
                                                <div
                                                    v-if="
                                                        Array.isArray(generalProperty.value) &&
                                                        generalProperty.value.length > 0
                                                    ">
                                                    <v-card
                                                        v-for="(imgEntry, k) in generalProperty.value"
                                                        :key="imgEntry.id || imgEntry.idShort || k"
                                                        class="my-2 pa-2">
                                                        <!-- find ImageFile inside imgEntry.value -->
                                                        <v-img
                                                            v-if="getImageFile(imgEntry)"
                                                            :src="getBlobUrl(getImageFile(imgEntry))"
                                                            max-width="300px"
                                                            max-height="300px"
                                                            contain
                                                            class="my-2" />
                                                        <!-- Image note -->
                                                        <div v-if="getImageNote(imgEntry)" class="text-caption">
                                                            {{ valueToDisplay(getImageNote(imgEntry)) }}
                                                        </div>
                                                    </v-card>
                                                </div>
                                                <div v-else class="text-caption text-medium-emphasis">
                                                    (no product images)
                                                </div>
                                            </template>
                                            <!-- MultiLanguageProperties -->
                                            <template v-else-if="generalProperty.modelType == 'MultiLanguageProperty'">
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
                                {{ nameToDisplay(productClassificationsSML, 'en', 'Product Classifications') }}
                                <DescriptionTooltip :description-array="productClassificationsSML?.description" />
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
                                                    v-if="classificationProperty.modelType == 'MultiLanguageProperty'">
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
                                                        <div v-if="langStringSet?.text.length > 0" class="text-caption">
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
            <!-- Technical Property Areas -->
            <template v-if="technicalProperties.length > 0">
                <v-expansion-panel>
                    <v-expansion-panel-title v-slot="{ expanded }">
                        <v-list-item class="pa-0">
                            <template #prepend>
                                <v-icon size="small">mdi-cog-outline</v-icon>
                            </template>
                            <v-list-item-title>
                                {{ nameToDisplay(technicalPropertiesSML, 'en', 'Technical Properties') }}
                                <DescriptionTooltip :description-array="technicalPropertiesSML?.description" />
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
            <!-- Further Information  -->
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
                                                    <DescriptionTooltip :description-array="furtherInfo?.description" />
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
            <!-- Specific Description  -->
            <template v-if="specificDescriptionelements.length > 0">
                <v-expansion-panel>
                    <v-expansion-panel-title v-slot="{ expanded }">
                        <v-list-item class="pa-0">
                            <template #prepend>
                                <v-icon size="small">mdi-cogs</v-icon>
                            </template>
                            <v-list-item-title>
                                {{ nameToDisplay(specificDescriptionSML, 'en', 'Specific Description') }}
                                <DescriptionTooltip :description-array="specificDescriptionSML?.description" />
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
                            :submodel-element-data="specificDescriptionelements"></GenericDataVisu>
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
                                            :submodel-element-data="specificDescriptionelements"
                                            :level="0"></GenericDataTableView>
                                    </tbody>
                                </v-table>
                            </v-card>
                        </template>
                    </v-expansion-panel-text>
                </v-expansion-panel>
            </template>
        </v-expansion-panels>
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
    //define the component
    defineOptions({
        name: 'TechnicalData',
        semanticId: '0173-1#01-AHX837#002',
    });
    // Properties
    const props = defineProps({
        submodelElementData: {
            type: Object as any,
            default: {} as any,
        },
    });
    // Stores
    const aasStore = useAASStore();

    // Composables
    const { setData } = useSMHandling();
    const { nameToDisplay, checkIdShort } = useReferableUtils();
    const { hasValue, valueToDisplay } = useSME();
    const { valueBlob } = useSMEFile();

    //Data
    const technicalData = ref({} as any);
    const isLoading = ref(false);
    const panel = ref([] as Array<number>);
    const generalInformationSMC = ref({} as any);
    const generalInformationProperties = ref([] as Array<any>);
    const productClassificationsSML = ref({} as any);
    const productClassifications = ref([] as Array<any>);
    const technicalPropertiesSML = ref({} as any);
    const technicalProperties = ref([] as Array<any>);
    const furtherInformationSMC = ref({} as any);
    const furtherInformation = ref([] as Array<any>);
    const specificDescriptionSML = ref({} as any);
    const specificDescriptionelements = ref([] as Array<any>);
    const blobUrls = ref<Record<string, string>>({});
    const tableView = ref(true as boolean);

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
        extractSpecificDescription(technicalData.value);

        isLoading.value = false;
    }

    function extractGeneralInformation(technicalData: any): void {
        let generalInformationSMC_local = getSubmodelElementBySemanticId(
            '0173-1#02-ABK161#002/0173-1#01-AHX838#002',
            technicalData
        );

        if (hasValue(generalInformationSMC_local)) {
            generalInformationSMC.value = generalInformationSMC_local;
            generalInformationProperties.value = generalInformationSMC_local.value;
        }
    }
    function extractFurtherInformation(technicalData: any): void {
        let furtherInformationSMC_local = getSubmodelElementBySemanticId('0173-1#02-ABK164#002', technicalData);

        if (hasValue(furtherInformationSMC_local)) {
            furtherInformationSMC.value = furtherInformationSMC_local;
            furtherInformation.value = furtherInformationSMC_local.value;
        }
    }

    function extractProductClassifications(technicalData: any): void {
        let productClassificationsSML_local = getSubmodelElementBySemanticId('0173-1#02-ABK162#002', technicalData);

        if (hasValue(productClassificationsSML_local)) {
            productClassificationsSML.value = productClassificationsSML_local;
            productClassifications.value = productClassificationsSML_local.value;
        }
    }

    function extractTechnicalProperties(technicalData: any): void {
        let technicalPropertiesSML_local = getSubmodelElementBySemanticId('0173-1#02-ABK163#002', technicalData);

        if (hasValue(technicalPropertiesSML_local)) {
            technicalPropertiesSML.value = technicalPropertiesSML_local;
            technicalProperties.value = technicalPropertiesSML_local.value;
        }
    }

    function extractSpecificDescription(technicalData: any): void {
        let specificDescriptionSML_local = getSubmodelElementBySemanticId('0173-1#02-ABM221#001', technicalData);

        if (hasValue(specificDescriptionSML_local)) {
            specificDescriptionSML.value = specificDescriptionSML_local;
            specificDescriptionelements.value = specificDescriptionSML_local.value;
        }
    }

    function getBlobUrl(property: any): string {
        if (blobUrls.value[property.idShort]) return blobUrls.value[property.idShort];

        valueBlob(property).then((url: string) => {
            blobUrls.value[property.idShort] = url;
        });

        return '';
    }

    function getImageFile(imgEntry: any): any | null {
        if (!imgEntry || !Array.isArray(imgEntry.value)) return null;
        return imgEntry.value.find((x: any) => x?.modelType === 'File' && checkIdShort(x, 'ImageFile'));
    }

    function getImageNote(imgEntry: any): any | null {
        if (!imgEntry || !Array.isArray(imgEntry.value)) return null;
        return (
            imgEntry.value.find((x: any) => x?.modelType === 'MultiLanguageProperty' && checkIdShort(x, 'ImageNote')) ||
            null
        );
    }
</script>
