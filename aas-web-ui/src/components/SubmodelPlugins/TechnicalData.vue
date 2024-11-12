<template>
    <v-container fluid class="pa-0">
        <!-- Header -->
        <v-card class="mb-4">
            <v-card-title>
                <div class="text-subtitle-1">{{ 'Technical Data:' }}</div>
            </v-card-title>
        </v-card>
        <!-- Technical Data Collections -->
        <v-card v-if="loading">
            <v-skeleton-loader
                type="list-item-avatar, divider, list-item-avatar, divider, list-item-avatar, divider, list-item-avatar"
                :height="288"></v-skeleton-loader>
        </v-card>
        <v-expansion-panels v-else v-model="panel" multiple>
            <!-- General Information -->
            <v-expansion-panel>
                <v-expansion-panel-title>
                    <v-list-item class="pa-0">
                        <template #prepend>
                            <v-icon size="small">mdi-file-document-outline</v-icon>
                        </template>
                        <v-list-item-title>{{ 'General Information' }}</v-list-item-title>
                    </v-list-item>
                </v-expansion-panel-title>
                <v-divider v-if="panel.includes(0)"></v-divider>
                <v-expansion-panel-text>
                    <v-table>
                        <tbody>
                            <tr
                                v-for="(generalProperty, index) in generalProperties"
                                :key="generalProperty.idShort"
                                :class="index % 2 === 0 ? 'tableEven' : 'bg-tableOdd'">
                                <td>
                                    <div class="text-subtitleText text-caption">
                                        <span>{{ nameToDisplay(generalProperty) }}</span>
                                        <v-tooltip
                                            v-if="generalProperty.description && generalProperty.description.length > 0"
                                            activator="parent"
                                            open-delay="600"
                                            transition="slide-y-transition"
                                            max-width="360px"
                                            location="bottom">
                                            <div
                                                v-for="(description, i) in generalProperty.description"
                                                :key="i"
                                                class="text-caption">
                                                <span class="font-weight-bold">{{ description.language + ': ' }}</span
                                                >{{ description.text }}
                                            </div>
                                        </v-tooltip>
                                    </div>
                                </td>
                                <td>
                                    <!-- Files -->
                                    <v-img
                                        v-if="checkIdShort(generalProperty, 'ManufacturerLogo')"
                                        :src="ManufacturerLogoUrl"
                                        max-width="100%"
                                        max-height="100%"
                                        contain
                                        class="my-2"></v-img>
                                    <v-img
                                        v-else-if="checkIdShort(generalProperty, 'ProductImage')"
                                        :src="ProductImageUrl"
                                        max-width="100%"
                                        max-height="100%"
                                        contain
                                        class="my-2"></v-img>
                                    <!-- MultiLanguageProperties -->
                                    <template v-else-if="generalProperty.modelType == 'MultiLanguageProperty'">
                                        <v-list-item class="pl-0">
                                            <v-list-item-title class="text-caption">{{
                                                generalProperty.value[0].text
                                            }}</v-list-item-title>
                                        </v-list-item>
                                    </template>
                                    <!-- Default -->
                                    <span v-else class="text-caption">{{ generalProperty.value }}</span>
                                </td>
                            </tr>
                        </tbody>
                    </v-table>
                </v-expansion-panel-text>
            </v-expansion-panel>
            <!-- Product Classifications -->
            <v-expansion-panel>
                <v-expansion-panel-title>
                    <v-list-item class="pa-0">
                        <template #prepend>
                            <v-icon size="small">mdi-package-variant-closed</v-icon>
                        </template>
                        <v-list-item-title>{{ 'Product Classifications' }}</v-list-item-title>
                    </v-list-item>
                </v-expansion-panel-title>
                <v-divider v-if="panel.includes(1)"></v-divider>
                <v-expansion-panel-text>
                    <v-card v-if="productClassifications.length > 0" variant="outlined" class="mt-3">
                        <v-table>
                            <thead>
                                <tr v-if="productClassifications.length > 0">
                                    <th
                                        v-for="classificationProperty in productClassifications[0].value"
                                        :key="classificationProperty.idShort">
                                        <v-list-item class="pl-0">
                                            <v-list-item-title class="text-caption">{{
                                                nameToDisplay(classificationProperty)
                                            }}</v-list-item-title>
                                        </v-list-item>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr
                                    v-for="(productClassification, index) in productClassifications"
                                    :key="productClassification.idShort"
                                    :class="index % 2 === 0 ? 'bg-tableOdd' : 'bg-tableEven'">
                                    <td
                                        v-for="classificationProperty in productClassification.value"
                                        :key="classificationProperty.idShort">
                                        <!-- MultiLanguageProperties -->
                                        <template v-if="classificationProperty.modelType == 'MultiLanguageProperty'">
                                            <v-list-item class="pl-0">
                                                <span class="text-caption text-subtitleText">{{
                                                    classificationProperty.value[0].text
                                                }}</span>
                                            </v-list-item>
                                        </template>
                                        <!-- Default -->
                                        <span v-else class="text-caption text-subtitleText">{{
                                            classificationProperty.value
                                        }}</span>
                                    </td>
                                </tr>
                            </tbody>
                        </v-table>
                    </v-card>
                </v-expansion-panel-text>
            </v-expansion-panel>
            <!-- Technical Properties -->
            <v-expansion-panel>
                <v-expansion-panel-title v-slot="{ expanded }">
                    <v-list-item class="pa-0">
                        <template #prepend>
                            <v-icon size="small">mdi-cog-outline</v-icon>
                        </template>
                        <v-list-item-title>{{ 'Technical Properties' }}</v-list-item-title>
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
            <!-- Further Information -->
            <v-expansion-panel>
                <v-expansion-panel-title>
                    <v-list-item class="pa-0">
                        <template #prepend>
                            <v-icon size="small">mdi-information-outline</v-icon>
                        </template>
                        <v-list-item-title>{{ 'Further Information' }}</v-list-item-title>
                    </v-list-item>
                </v-expansion-panel-title>
                <v-divider v-if="panel.includes(3)"></v-divider>
                <v-expansion-panel-text>
                    <v-table v-if="furtherInformation.length > 0">
                        <tbody>
                            <tr
                                v-for="(furtherInfo, index) in furtherInformation"
                                :key="furtherInfo.idShort"
                                :class="index % 2 === 0 ? 'tableEven' : 'bg-tableOdd'">
                                <td>
                                    <div class="text-subtitleText text-caption">
                                        <span>{{ nameToDisplay(furtherInfo) }}</span>
                                        <v-tooltip
                                            v-if="furtherInfo.description && furtherInfo.description.length > 0"
                                            activator="parent"
                                            open-delay="600"
                                            transition="slide-y-transition"
                                            max-width="360px"
                                            location="bottom">
                                            <div
                                                v-for="(description, i) in furtherInfo.description"
                                                :key="i"
                                                class="text-caption">
                                                <span class="font-weight-bold">{{ description.language + ': ' }}</span
                                                >{{ description.text }}
                                            </div>
                                        </v-tooltip>
                                    </div>
                                </td>
                                <td>
                                    <!-- MultiLanguageProperties -->
                                    <template v-if="furtherInfo.modelType == 'MultiLanguageProperty'">
                                        <v-list-item class="pl-0">
                                            <v-list-item-title class="text-caption">{{
                                                furtherInfo.value[0].text
                                            }}</v-list-item-title>
                                        </v-list-item>
                                    </template>
                                    <!-- Default -->
                                    <span v-else class="text-caption">{{ furtherInfo.value }}</span>
                                </td>
                            </tr>
                        </tbody>
                    </v-table>
                </v-expansion-panel-text>
            </v-expansion-panel>
        </v-expansion-panels>
    </v-container>
</template>

<script lang="ts">
    import { defineComponent } from 'vue';
    import { useTheme } from 'vuetify';
    import GenericDataTableView from '@/components/UIComponents/GenericDataTableView.vue';
    import GenericDataVisu from '@/components/UIComponents/GenericDataVisu.vue';
    import RequestHandling from '@/mixins/RequestHandling';
    import SubmodelElementHandling from '@/mixins/SubmodelElementHandling';
    import { useAASStore } from '@/store/AASDataStore';

    export default defineComponent({
        name: 'TechnicalData',
        components: {
            GenericDataVisu,
            GenericDataTableView,
        },
        mixins: [RequestHandling, SubmodelElementHandling],
        props: ['submodelElementData'],

        setup() {
            const theme = useTheme();
            const aasStore = useAASStore();

            return {
                theme, // Theme Object
                aasStore, // AASStore Object
            };
        },

        data() {
            return {
                panel: [] as Array<number>,
                technicalData: {} as any,
                generalProperties: [] as Array<any>,
                productClassifications: [] as Array<any>,
                technicalProperties: [] as Array<any>,
                furtherInformation: [] as Array<any>,
                ManufacturerLogoUrl: '',
                ProductImageUrl: '',
                loading: false,
                tableView: true,
            };
        },

        computed: {
            // Get the selected Treeview Node (SubmodelElement) from the store
            SelectedNode() {
                return this.aasStore.getSelectedNode;
            },
        },

        mounted() {
            this.initTechnicalData();
        },

        methods: {
            async initTechnicalData() {
                this.loading = true;
                // Check if a Node is selected
                if (Object.keys(this.submodelElementData).length == 0) {
                    this.technicalData = {}; // Reset the DigitalNameplate Data when no Node is selected
                    return;
                }
                let technicalData = { ...this.submodelElementData }; // create local copy of the Nameplate Object
                this.technicalData = await this.calculateSubmodelElementPathes(technicalData, this.SelectedNode.path); // Set the DigitalNameplate Data
                this.extractGeneralProperties(technicalData);
                this.extractProductClassifications(technicalData);
                this.extractTechnicalProperties(technicalData);
                this.extractFurtherInformation(technicalData);
                this.loading = false;
            },

            extractGeneralProperties(technicalData: any) {
                // find SubmodelElementCollection with semanticId: https://admin-shell.io/ZVEI/TechnicalData/GeneralInformation/1/1
                let generalInformation = technicalData.submodelElements.find((element: any) => {
                    return (
                        element.semanticId.keys[0].value ===
                        'https://admin-shell.io/ZVEI/TechnicalData/GeneralInformation/1/1'
                    );
                });
                if (!generalInformation) return;
                generalInformation.value.forEach((generalProperty: any) => {
                    if (this.checkIdShort(generalProperty.idShort, 'ManufacturerLogo')) {
                        this.getImageUrl(generalProperty, 'ManufacturerLogoUrl');
                    }
                    if (generalProperty.idShort.includes('ProductImage')) {
                        this.getImageUrl(generalProperty, 'ProductImageUrl');
                    }
                });
                // console.log('General Information:', generalInformation);
                this.generalProperties = generalInformation.value;
            },

            extractProductClassifications(technicalData: any) {
                // find SubmodelElementCollection with semanticId: https://admin-shell.io/ZVEI/TechnicalData/ProductClassifications/1/1
                let productClassifications = technicalData.submodelElements.find((element: any) => {
                    return (
                        element.semanticId.keys[0].value ===
                        'https://admin-shell.io/ZVEI/TechnicalData/ProductClassifications/1/1'
                    );
                });
                // console.log('Product Classifications:', productClassifications);
                if (!productClassifications) return;
                this.productClassifications = productClassifications.value;
            },

            extractTechnicalProperties(technicalData: any) {
                // find SubmodelElementCollection with semanticId: https://admin-shell.io/ZVEI/TechnicalData/TechnicalProperties/1/1
                let technicalProperties = technicalData.submodelElements.find((element: any) => {
                    return (
                        element.semanticId.keys[0].value ===
                        'https://admin-shell.io/ZVEI/TechnicalData/TechnicalProperties/1/1'
                    );
                });
                // console.log('Technical Properties:', technicalProperties);
                this.technicalProperties = technicalProperties.value;
            },

            extractFurtherInformation(technicalData: any) {
                // find SubmodelElementCollection with semanticId: https://admin-shell.io/ZVEI/TechnicalData/FurtherInformation/1/1
                let furtherInformation = technicalData.submodelElements.find((element: any) => {
                    return (
                        element.semanticId.keys[0].value ===
                        'https://admin-shell.io/ZVEI/TechnicalData/FurtherInformation/1/1'
                    );
                });
                // console.log('Further Information:', furtherInformation);
                if (!furtherInformation) return;
                this.furtherInformation = furtherInformation.value;
            },

            getImageUrl(fileProperty: any, dataElementName: string) {
                if (!fileProperty.value) return;
                try {
                    new URL(fileProperty.value);
                    (this as any)[dataElementName] = fileProperty.value;
                } catch {
                    let path = this.getLocalPath(fileProperty.value, fileProperty);
                    let context = 'retrieving Attachment File';
                    let disableMessage = false;
                    this.getRequest(path, context, disableMessage).then((response: any) => {
                        if (response.success) {
                            (this as any)[dataElementName] = URL.createObjectURL(response.data as Blob);
                        }
                    });
                }
            },
        },
    });
</script>
