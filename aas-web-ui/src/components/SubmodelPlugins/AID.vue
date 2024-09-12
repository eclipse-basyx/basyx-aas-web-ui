<!-- TODO: Add deleting icon and function for the whole collection. Add a confirmation dialog for deleting the collection.
Save change in title when edit. Implement backedn endpoint 
NOTE: "watch" makes visible the data but gets duplicate-->
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
                                <!-- Trash Icon for Delete Property -->
                                <v-col cols="12" class="d-flex justify-end">
                                    <v-icon color="red" @click="confirmDeleteProperty(index)"
                                        >mdi-trash-can-outline</v-icon
                                    >
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

        <!-- Delete Confirmation Dialog -->
        <v-dialog v-model="deleteConfirmationDialog" max-width="400px">
            <v-card>
                <v-card-title class="headline">Confirm Delete</v-card-title>
                <v-card-text>Are you sure you want to delete this property?</v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="green darken-1" @click="closeDeleteConfirmationDialog">Cancel</v-btn>
                    <v-btn color="red darken-1" @click="deleteProperty">Delete</v-btn>
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
                deleteConfirmationDialog: false,
                selectedCollection: null as SubmodelElementCollection | null,
                propertyToDeleteIndex: null as number | null,
            };
        },
        computed: {
            selectedAAS() {
                return this.aasStore.getSelectedAAS;
            },
        },
        watch: {
            submodelElementData: {
                handler() {
                    this.fetchData();
                },
                immediate: true, // Run on component mount
                deep: true, // Watch deeply for nested changes
            },
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
                    console.log('Processing collection:', collection); // Debugging output
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
                        console.log('Properties for collection:', properties); // Debugging output
                    } else {
                        console.warn('No properties collection found for:', collection);
                    }
                });

                console.log('Final submodelElementCollections:', this.submodelElementCollections); // Debugging output
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
            openEditDialog(collection: SubmodelElementCollection) {
                this.selectedCollection = { ...collection };
                this.editDialog = true;
            },
            closeEditDialog() {
                this.editDialog = false;
                this.selectedCollection = null;
            },
            async saveChanges() {
                console.log('Saving changes:', this.selectedCollection);
                if (this.selectedCollection) {
                    const index = this.submodelElementCollections.findIndex(
                        (col) => col.idShort === this.selectedCollection?.idShort
                    );
                    if (index !== -1) {
                        this.submodelElementCollections[index] = { ...this.selectedCollection };
                        // Call backend to save updated collection
                        await this.saveCollection(this.selectedCollection); // Backend call
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
            confirmDeleteProperty(index: number) {
                this.propertyToDeleteIndex = index;
                this.deleteConfirmationDialog = true;
            },
            closeDeleteConfirmationDialog() {
                this.deleteConfirmationDialog = false;
                this.propertyToDeleteIndex = null;
            },
            deleteProperty() {
                if (this.selectedCollection && this.propertyToDeleteIndex !== null) {
                    this.selectedCollection.properties.splice(this.propertyToDeleteIndex, 1);
                    this.closeDeleteConfirmationDialog();
                }
            },
            async saveCollection(collection: SubmodelElementCollection) {
                try {
                    const apiUrl = '/api/aasx/updateCollection';
                    const payload = {
                        aasId: this.selectedAAS?.id,
                        submodelId: this.submodelElementData?.id,
                        collection: collection,
                    };

                    const response = await fetch(apiUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(payload),
                    });

                    if (!response.ok) {
                        throw new Error(`Failed to update collection: ${response.statusText}`);
                    }

                    const result = await response.json();
                    console.log('Collection updated successfully:', result);
                    this.$emit('showNotification', 'Collection updated successfully.');
                } catch (error) {
                    console.error('Error updating collection:', error);
                    this.$emit('showNotification', `Error: ${(error as Error).message}`);
                }
            },
        },
    });
</script>

<style scoped>
    .d-flex {
        display: flex;
    }
    .justify-end {
        justify-content: flex-end;
    }
    .text-truncate {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
</style>
