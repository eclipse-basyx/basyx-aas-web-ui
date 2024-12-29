<template>
    <v-container fluid class="pa-0">
        <VisualizationHeader
            :submodel-element-data="submodelElementData"
            default-title="Technical Data for Industrial Equipment in Manufacturing"></VisualizationHeader>
        <!-- Loading -->
        <v-card v-if="isLoading">
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
                                </v-list-item-title>
                            </v-list-item>
                        </v-expansion-panel-title>
                        <v-divider v-if="panel.includes(0)"></v-divider>
                        <v-expansion-panel-text>
                            <v-table>
                                <tbody>
                                    <tr
                                        v-for="(generalProperty, index) in generalInformationProperties"
                                        :key="generalProperty.idShort"
                                        :class="index % 2 === 0 ? 'bg-tableEven' : 'bg-tableOdd'">
                                        <td>
                                            <div class="text-subtitleText text-caption">
                                                <span>{{ nameToDisplay(generalProperty) }}</span>
                                                <v-tooltip
                                                    v-if="descriptionToDisplay(generalProperty)"
                                                    activator="parent"
                                                    open-delay="600"
                                                    transition="slide-y-transition"
                                                    max-width="360px"
                                                    location="bottom">
                                                    <div class="text-caption">
                                                        {{ descriptionToDisplay(generalProperty) }}
                                                    </div>
                                                </v-tooltip>
                                                <!-- Otherwise show all available descriptions -->
                                                <v-tooltip
                                                    v-else-if="
                                                        generalProperty.description &&
                                                        generalProperty.description.length > 0
                                                    "
                                                    activator="parent"
                                                    open-delay="600"
                                                    transition="slide-y-transition"
                                                    max-width="360px"
                                                    location="bottom">
                                                    <div
                                                        v-for="(description, i) in generalProperty.description"
                                                        :key="i"
                                                        class="text-caption">
                                                        <span class="font-weight-thin">
                                                            {{
                                                                (getLanguageName(description.language)
                                                                    ? getLanguageName(description.language)
                                                                    : description.language) + ': '
                                                            }}
                                                        </span>
                                                        {{ description.text }}
                                                    </div>
                                                </v-tooltip>
                                            </div>
                                        </td>
                                        <td>
                                            <!-- Files -->
                                            <v-img
                                                v-if="
                                                    checkIdShort(generalProperty, 'ManufacturerLogo') ||
                                                    checkIdShort(generalProperty, 'ProductImage')
                                                "
                                                :src="valueUrl(generalProperty)"
                                                max-width="100%"
                                                max-height="100%"
                                                contain
                                                class="my-2"></v-img>
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
                                                        <span class="font-weight-thin">
                                                            {{
                                                                (getLanguageName(langStringSet?.language)
                                                                    ? getLanguageName(langStringSet?.language)
                                                                    : langStringSet?.language) + ': '
                                                            }}
                                                        </span>
                                                        {{ langStringSet.text }}
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
                                </v-list-item-title>
                            </v-list-item>
                        </v-expansion-panel-title>
                        <v-divider v-if="panel.includes(1)"></v-divider>
                        <v-expansion-panel-text>
                            <v-card variant="outlined" class="mt-3">
                                <v-table>
                                    <thead>
                                        <tr v-if="productClassifications.length > 0">
                                            <th
                                                v-for="classificationProperty in productClassifications[0].value"
                                                :key="classificationProperty.idShort">
                                                <div class="text-caption">
                                                    <span>{{ nameToDisplay(classificationProperty) }}</span>
                                                    <!-- Show english description, if available -->
                                                    <v-tooltip
                                                        v-if="descriptionToDisplay(classificationProperty)"
                                                        activator="parent"
                                                        open-delay="600"
                                                        transition="slide-y-transition"
                                                        max-width="360px"
                                                        location="bottom">
                                                        <div class="text-caption">
                                                            {{ descriptionToDisplay(classificationProperty) }}
                                                        </div>
                                                    </v-tooltip>
                                                    <!-- Otherwise show all available descriptions -->
                                                    <v-tooltip
                                                        v-else-if="
                                                            classificationProperty.description &&
                                                            classificationProperty.description.length > 0
                                                        "
                                                        activator="parent"
                                                        open-delay="600"
                                                        transition="slide-y-transition"
                                                        max-width="360px"
                                                        location="bottom">
                                                        <div
                                                            v-for="(
                                                                description, j
                                                            ) in classificationProperty.description"
                                                            :key="j"
                                                            class="text-caption">
                                                            <span class="font-weight-thin">
                                                                {{
                                                                    (getLanguageName(description.language)
                                                                        ? getLanguageName(description.language)
                                                                        : description.language) + ': '
                                                                }}
                                                            </span>
                                                            {{ description.text }}
                                                        </div>
                                                    </v-tooltip>
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
                                                                class="text-caption text-subtitleText">
                                                                <span class="font-weight-thin">
                                                                    {{
                                                                        (getLanguageName(langStringSet?.language)
                                                                            ? getLanguageName(langStringSet?.language)
                                                                            : langStringSet?.language) + ': '
                                                                    }}
                                                                </span>
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
                        <v-expansion-panel-text>
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
                                </v-list-item-title>
                            </v-list-item>
                        </v-expansion-panel-title>
                        <v-divider v-if="panel.includes(3)"></v-divider>
                        <v-expansion-panel-text>
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
                                                    <!-- Show english description, if available -->
                                                    <v-tooltip
                                                        v-if="descriptionToDisplay(furtherInfo)"
                                                        activator="parent"
                                                        open-delay="600"
                                                        transition="slide-y-transition"
                                                        max-width="360px"
                                                        location="bottom">
                                                        <div class="text-caption">
                                                            {{ descriptionToDisplay(furtherInfo) }}
                                                        </div>
                                                    </v-tooltip>
                                                    <!-- Otherwise show all available descriptions -->
                                                    <v-tooltip
                                                        v-else-if="
                                                            furtherInfo.description &&
                                                            furtherInfo.description.length > 0
                                                        "
                                                        activator="parent"
                                                        open-delay="600"
                                                        transition="slide-y-transition"
                                                        max-width="360px"
                                                        location="bottom">
                                                        <div
                                                            v-for="(description, k) in furtherInfo.description"
                                                            :key="k"
                                                            class="text-caption">
                                                            <span class="font-weight-thin">
                                                                {{
                                                                    (getLanguageName(description.language)
                                                                        ? getLanguageName(description.language)
                                                                        : description.language) + ': '
                                                                }}
                                                            </span>
                                                            {{ description.text }}
                                                        </div>
                                                    </v-tooltip>
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
                                                            <span class="font-weight-thin">
                                                                {{
                                                                    (getLanguageName(langStringSet?.language)
                                                                        ? getLanguageName(langStringSet?.language)
                                                                        : langStringSet?.language) + ': '
                                                                }}
                                                            </span>
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
                        </v-expansion-panel-text>
                    </v-expansion-panel>
                </template>
            </v-expansion-panels>
        </template>
    </v-container>
</template>

<script lang="ts" setup>
    import { computed, onMounted, ref } from 'vue';
    import { useAASStore } from '@/store/AASDataStore';
    import { getLanguageName } from '@/utils/LocaleUtils';
    import { descriptionToDisplay, nameToDisplay } from '@/utils/ReferableUtils';
    import { checkIdShort } from '@/utils/ReferableUtils';
    import { getSubmodelElementBySemanticId } from '@/utils/SemanticIdUtils';
    import { valueUrl } from '@/utils/SubmodelElements/FileUtils';
    import {
        calculateSubmodelElementPaths,
        hasValue,
        valueToDisplay,
    } from '@/utils/SubmodelElements/SubmodelElementUtils';

    // Define component options such as custom static properties
    defineOptions({
        name: 'TechnicalData',
        semanticId: 'https://admin-shell.io/ZVEI/TechnicalData/Submodel/1/2',
    });

    // Stores
    const aasStore = useAASStore();

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
    // ManufacturerLogoUrl: '',
    // ProductImageUrl: '',

    // Computed Properties
    const selectedNode = computed(() => aasStore.getSelectedNode);

    onMounted(() => {
        initializeVisualization();
    });

    async function initializeVisualization() {
        // console.log('initializeVisualization()', 'props', props);
        isLoading.value = true;

        if (!props.submodelElementData || Object.keys(props.submodelElementData).length === 0) {
            technicalData.value = {};
            isLoading.value = false;
            return;
        }

        technicalData.value = await calculateSubmodelElementPaths(
            { ...props.submodelElementData },
            selectedNode.value.path
        );

        extractGeneralInformation(technicalData.value);
        extractProductClassifications(technicalData.value);
        extractTechnicalProperties(technicalData.value);
        extractFurtherInformation(technicalData.value);

        isLoading.value = false;
    }

    function extractGeneralInformation(technicalData: any) {
        let generalInformationSMC_local = getSubmodelElementBySemanticId(
            'https://admin-shell.io/ZVEI/TechnicalData/GeneralInformation/1/1',
            technicalData
        );

        if (hasValue(generalInformationSMC_local)) {
            generalInformationSMC.value = generalInformationSMC_local;
            generalInformationProperties.value = generalInformationSMC_local.value;
        }
    }

    function extractProductClassifications(technicalData: any) {
        let productClassificationsSMC_local = getSubmodelElementBySemanticId(
            'https://admin-shell.io/ZVEI/TechnicalData/ProductClassifications/1/1',
            technicalData
        );

        if (hasValue(productClassificationsSMC_local)) {
            productClassificationsSMC.value = productClassificationsSMC_local;
            productClassifications.value = productClassificationsSMC_local.value;
        }
    }

    function extractTechnicalProperties(technicalData: any) {
        let technicalPropertiesSMC_local = getSubmodelElementBySemanticId(
            'https://admin-shell.io/ZVEI/TechnicalData/TechnicalProperties/1/1',
            technicalData
        );

        if (hasValue(technicalPropertiesSMC_local)) {
            technicalPropertiesSMC.value = technicalPropertiesSMC_local;
            technicalProperties.value = technicalPropertiesSMC_local.value;
        }
    }

    function extractFurtherInformation(technicalData: any) {
        let furtherInformationSMC_local = getSubmodelElementBySemanticId(
            'https://admin-shell.io/ZVEI/TechnicalData/FurtherInformation/1/1',
            technicalData
        );

        if (hasValue(furtherInformationSMC_local)) {
            furtherInformationSMC.value = furtherInformationSMC_local;
            furtherInformation.value = furtherInformationSMC_local.value;
        }
    }
</script>
