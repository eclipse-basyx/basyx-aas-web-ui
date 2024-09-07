<!-- TODO: inclue the title to be editable - backend logic
Add logic to the backend
Create inside the edit dialog a button to delete the property and to add a new one - delete needs confirmation
Add a button to add a new collection
Logic to the backend -->
<template>
    <v-container fluid class="pa-0">
        <!-- Header -->
        <v-card class="mb-4">
            <v-card-title>
                <div class="text-subtitle-1">{{ 'Asset Interfaces Description:' }}</div>
            </v-card-title>
        </v-card>

        <v-expansion-panels>
            <!-- Iterate through each SubmodelElementCollection -->
            <v-expansion-panel
                v-for="collection in submodelElementCollections"
                :key="collection.idShort"
                min-width="100%">
                <v-expansion-panel-title>
                    <div class="d-flex align-center" style="width: 93%">
                        <div class="flex-grow-1 text-truncate">
                            <v-list-item-title class="text-subtitle-1">
                                {{ collection.idShort || 'No title available' }}
                            </v-list-item-title>
                        </div>
                    </div>
                    <!-- Single Edit Icon for Collection -->
                    <v-icon small @click="openEditDialog(collection)" @click.stop>mdi-pencil</v-icon>
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                    <!-- Dynamically display each property's metadata and endpoint -->
                    <v-card v-for="property in collection.properties" :key="property.idShort" class="pb-4">
                        <v-row flex>
                            <v-col cols="12" md="10">
                                <!-- Display Property Details -->
                                <div class="text-subtitle-1">
                                    {{ property.title || 'No title available' }}
                                </div>
                                <div style="font-size: 14px">
                                    {{ property.unit ? 'Unit: ' + property.unit : '' }}
                                </div>
                                <div style="font-size: 14px">Endpoint: {{ property.endpoint }}</div>
                            </v-col>
                        </v-row>
                    </v-card>
                </v-expansion-panel-text>
            </v-expansion-panel>
        </v-expansion-panels>

        <!-- Handle case when no properties are available -->
        <v-card v-if="!submodelElementCollections.length" class="mb-4 py-8">
            <v-row flex align="center" justify="center">
                <div>No data available</div>
            </v-row>
        </v-card>

        <!-- Add New Collection Button -->
        <v-btn color="primary" @click="addNewCollection">Add New Collection</v-btn>

        <!-- Edit Properties Dialog -->
        <v-dialog v-model="editDialog" max-width="600px" persistent>
            <v-card>
                <v-card-title class="headline">Edit Properties</v-card-title>
                <v-card-text>
                    <v-form v-if="selectedCollection">
                        <v-container>
                            <!-- Editable Title Field -->
                            <v-row>
                                <v-col cols="12">
                                    <v-text-field
                                        v-model="selectedCollection.idShort"
                                        label="Title"
                                        dense></v-text-field>
                                </v-col>
                            </v-row>

                            <!-- Iterate through each property of the selected collection -->
                            <v-row v-for="(property, index) in selectedCollection.properties" :key="property.idShort">
                                <v-col cols="12" sm="6">
                                    <v-text-field v-model="property.title" label="Title" dense></v-text-field>
                                </v-col>
                                <v-col cols="12" sm="6">
                                    <v-text-field v-model="property.unit" label="Unit" dense></v-text-field>
                                </v-col>
                                <v-col cols="12">
                                    <v-text-field v-model="property.endpoint" label="Endpoint" dense></v-text-field>
                                </v-col>
                                <!-- Delete Property Button -->
                                <v-col cols="12">
                                    <v-btn color="red" @click="deleteProperty(index)">Delete Property</v-btn>
                                </v-col>
                            </v-row>

                            <!-- Add New Property Button -->
                            <v-btn color="primary" @click="addNewProperty">Add New Property</v-btn>
                        </v-container>
                    </v-form>
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="green darken-1" @click="closeEditDialog">Cancel</v-btn>
                    <v-btn color="blue darken-1" @click="saveChanges">Save</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </v-container>
</template>

<script lang="ts">
    import { defineComponent } from 'vue';
    import { useTheme } from 'vuetify';
    import { useAASStore } from '@/store/AASDataStore';
    import { useNavigationStore } from '@/store/NavigationStore';
    import RequestHandling from '../../mixins/RequestHandling';
    import SubmodelElementHandling from '../../mixins/SubmodelElementHandling';

    interface Property {
        idShort: string;
        title: string;
        unit: string;
        endpoint: string;
        semanticId?: string;
    }

    interface SubmodelElementCollection {
        idShort: string;
        properties: Property[];
    }

    export default defineComponent({
        name: 'AssetInterfacesDescription',
        mixins: [RequestHandling, SubmodelElementHandling],
        props: {
            submodelElementData: {
                type: Object,
                required: true,
            },
        },
        setup() {
            const theme = useTheme();
            const navigationStore = useNavigationStore();
            const aasStore = useAASStore();

            return {
                theme,
                navigationStore,
                aasStore,
            };
        },
        data() {
            return {
                submodelElementCollections: [] as Array<SubmodelElementCollection>,
                editDialog: false,
                selectedCollection: null as SubmodelElementCollection | null,
            };
        },
        computed: {
            selectedAAS() {
                return this.aasStore.getSelectedAAS;
            },
        },
        mounted() {
            this.fetchData();
        },
        methods: {
            fetchData() {
                if (!this.submodelElementData?.submodelElements) {
                    console.warn('SubmodelElementData or submodelElements is not defined');
                    return;
                }
                console.log('Component Mounted. SubmodelElementData:', this.submodelElementData);
                const submodelElementCollections = this.submodelElementData.submodelElements.filter(
                    (element: any) => element.modelType === 'SubmodelElementCollection'
                );

                submodelElementCollections.forEach((collection: any) => {
                    const propertiesCollection = this.findNestedElement(collection.value, 'properties');
                    if (propertiesCollection) {
                        const propertyDefinitions = propertiesCollection.value;
                        const baseEndpoint = this.getEndpointBase(collection);

                        const properties = propertyDefinitions.map((propertyDefinition: any) => ({
                            idShort: propertyDefinition.idShort,
                            title: this.getPropertyValue(propertyDefinition, 'title'),
                            unit: this.getPropertyValue(propertyDefinition, 'unit'),
                            endpoint: `${baseEndpoint}${this.getPropertyValue(propertyDefinition, 'href')}`,
                            semanticId: propertyDefinition.semanticId?.value || '',
                        }));

                        this.submodelElementCollections.push({
                            idShort: collection.idShort,
                            properties,
                        });
                    }
                });
            },
            openEditDialog(collection: SubmodelElementCollection) {
                this.selectedCollection = { ...collection };
                this.editDialog = true;
            },
            closeEditDialog() {
                this.editDialog = false;
                this.selectedCollection = null;
            },
            saveChanges() {
                console.log('Saving changes:', this.selectedCollection);
                if (this.selectedCollection) {
                    const index = this.submodelElementCollections.findIndex(
                        (col) => col.idShort === this.selectedCollection?.idShort
                    );
                    if (index !== -1) {
                        this.submodelElementCollections[index] = { ...this.selectedCollection };
                        // Add logic to save updated collection to backend here
                        this.saveCollection(this.selectedCollection); // Example backend call
                        this.closeEditDialog();
                    }
                }
            },
            addNewCollection() {
                const newCollection: SubmodelElementCollection = {
                    idShort: 'New Collection',
                    properties: [],
                };
                this.submodelElementCollections.push(newCollection);
            },
            addNewProperty() {
                if (this.selectedCollection) {
                    this.selectedCollection.properties.push({
                        idShort: 'New Property',
                        title: '',
                        unit: '',
                        endpoint: '',
                    });
                }
            },
            deleteProperty(index: number) {
                if (this.selectedCollection) {
                    this.selectedCollection.properties.splice(index, 1);
                }
            },
            saveCollection(collection: SubmodelElementCollection) {
                // Implement backend call to save collection
                console.log('Saving collection to backend:', collection);
            },
            getEndpointBase(submodelElementCollection: any): string {
                const endpointMetadata = submodelElementCollection.value.find(
                    (property: any) => property.idShort === 'EndpointMetadata'
                );
                if (!endpointMetadata) {
                    console.warn('EndpointMetadata not found in SubmodelElementCollection');
                    return '';
                }

                const baseProperty = endpointMetadata.value.find((property: any) => property.idShort === 'base');
                return baseProperty?.value || '';
            },
            getPropertyValue(propertyCollection: any, idShort: string): string {
                const directProperty = propertyCollection.value?.find((prop: any) => prop.idShort === idShort);
                if (directProperty) {
                    return directProperty.value || '';
                }

                const propertyWithForms = propertyCollection.value?.find((prop: any) => prop.idShort === 'forms');
                if (propertyWithForms) {
                    const formProperty = propertyWithForms.value.find((form: any) => form.idShort === idShort);
                    return formProperty?.value || '';
                }
                return '';
            },
            findNestedElement(elements: any[], idShort: string): any | null {
                for (const element of elements) {
                    if (element.idShort === idShort) {
                        return element;
                    }
                    if (Array.isArray(element.value)) {
                        const nestedElement = this.findNestedElement(element.value, idShort);
                        if (nestedElement) {
                            return nestedElement;
                        }
                    }
                }
                return null;
            },
        },
    });
</script>
