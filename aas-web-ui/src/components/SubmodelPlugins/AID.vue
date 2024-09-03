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
                    <v-list-item class="pa-0 pr-4 d-flex align-center">
                        <v-list-item-title v-if="!collection.isEditing" class="text-subtitle-1">
                            {{ collection.idShort || 'No title available' }}
                        </v-list-item-title>
                        <v-list-item-title v-else class="mr-344 text-subtitle-1">
                            <v-text-field
                                v-model="collection.idShort"
                                class="text-subtitle-1 bg-red textfield"
                                style="min-width: -webkit-fill-available"
                                label="Title"></v-text-field>
                        </v-list-item-title>
                    </v-list-item>
                    <v-icon small @click="toggleCollectionEdit(collection)">
                        {{ collection.isEditing ? 'mdi-check' : 'mdi-pencil' }}
                    </v-icon>
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                    <!-- Dynamically display each property's metadata and endpoint -->
                    <v-card v-for="property in collection.properties" :key="property.idShort" class="pb-4">
                        <v-row flex>
                            <v-col cols="12" md="10">
                                <!-- Title -->
                                <div class="d-flex align-center">
                                    <div v-if="!property.isEditing" class="text-subtitle-1">
                                        {{ property.title || 'No title available' }}
                                    </div>
                                    <v-text-field v-else v-model="property.title" label="Title" dense></v-text-field>
                                </div>
                                <!-- Unit -->
                                <div class="d-flex align-center" style="font-size: 14px">
                                    <div v-if="!property.isEditing">
                                        {{ property.unit ? 'Unit: ' + property.unit : '' }}
                                    </div>
                                    <v-text-field v-else v-model="property.unit" label="Unit" dense></v-text-field>
                                </div>

                                <!-- Endpoint -->
                                <div class="d-flex align-center" style="font-size: 14px">
                                    <div v-if="!property.isEditing">Endpoint: {{ property.endpoint }}</div>
                                    <v-text-field
                                        v-else
                                        v-model="property.endpoint"
                                        label="Endpoint"
                                        dense></v-text-field>
                                </div>
                            </v-col>
                            <v-col class="d-flex align-center justify-center">
                                <!-- Checkbox for selecting multiple properties -->
                                <v-checkbox
                                    v-model="property.selected"
                                    color="primary"
                                    hide-details
                                    dense
                                    @change="updateSelectedProperties"></v-checkbox>
                                <!-- Edit icon for toggling edit mode -->
                                <v-icon small @click="toggleEdit(property)">
                                    {{ property.isEditing ? 'mdi-check' : 'mdi-pencil' }}
                                </v-icon>
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
        <!-- Delete Selected Properties Button -->
        <v-btn v-if="isAnyPropertySelected" color="red darken-1" class="my-4" @click="openDeleteDialog">
            Delete Selected
        </v-btn>
        <!-- Confirm Deletion Dialog -->
        <v-dialog v-model="deleteDialog" max-width="500px" persistent>
            <v-card>
                <v-card-title class="headline">Confirm Deletion</v-card-title>
                <v-card-text>Are you sure you want to delete the selected properties?</v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="green darken-1" @click="closeDeleteDialog"> Cancel </v-btn>
                    <v-btn color="red darken-1" @click="confirmDelete"> Delete </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </v-container>
</template>

<script lang="ts">
    import { computed, defineComponent } from 'vue';
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
        isEditing: boolean;
        selected: boolean; // Added to track checkbox selection
    }

    interface SubmodelElementCollection {
        idShort: string;
        properties: Property[];
        isEditing: boolean;
    }

    export default defineComponent({
        name: 'AssetInterfacesDescription',
        components: {},
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

            // Access AAS details dynamically
            const selectedAAS = computed(() => aasStore.getSelectedAAS);

            return {
                theme,
                navigationStore,
                aasStore,
                selectedAAS,
            };
        },
        data() {
            return {
                submodelElementCollections: [] as Array<SubmodelElementCollection>,
                deleteDialog: false,
                collectionToDelete: null as SubmodelElementCollection | null,
                propertyIndexToDelete: -1,
            };
        },
        computed: {
            isAnyPropertySelected() {
                // Check if any property is selected across all collections
                return this.submodelElementCollections.some((collection) =>
                    collection.properties.some((property) => property.selected)
                );
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
                // Find all SubmodelElementCollection
                const submodelElementCollections = this.submodelElementData.submodelElements.filter(
                    (element: any) => element.modelType === 'SubmodelElementCollection'
                );

                // Fetch details for each collection
                submodelElementCollections.forEach((collection: any) => {
                    const propertiesCollection = this.findNestedElement(collection.value, 'properties');
                    if (propertiesCollection) {
                        const propertyDefinitions = propertiesCollection.value;
                        const baseEndpoint = this.getEndpointBase(collection);

                        const properties = propertyDefinitions.map((propertyDefinition: any) => {
                            return {
                                idShort: propertyDefinition.idShort,
                                title: this.getPropertyValue(propertyDefinition, 'title'),
                                unit: this.getPropertyValue(propertyDefinition, 'unit'),
                                endpoint: `${baseEndpoint}${this.getPropertyValue(propertyDefinition, 'href')}`,
                                semanticId: propertyDefinition.semanticId?.value || '',
                                isEditing: false, // Initialize to false
                                selected: false, // Initialize checkbox selection to false
                            } as Property;
                        });

                        this.submodelElementCollections.push({
                            idShort: collection.idShort,
                            properties,
                            isEditing: false, // Initialize to false
                        });
                    }
                });
            },
            toggleEdit(property: Property) {
                property.isEditing = !property.isEditing;
                if (!property.isEditing) {
                    // Save changes when exiting edit mode
                    this.saveChanges();
                }
            },
            toggleCollectionEdit(collection: SubmodelElementCollection) {
                collection.isEditing = !collection.isEditing;
                if (!collection.isEditing) {
                    // Save changes when exiting edit mode
                    this.saveChanges();
                }
            },
            deleteSelectedProperties() {
                // Delete all selected properties
                this.submodelElementCollections.forEach((collection) => {
                    collection.properties = collection.properties.filter((property) => !property.selected);
                });
                this.saveChanges();
            },
            updateSelectedProperties() {
                // Hide or show the "Delete Selected" button based on checkbox selections
            },
            openDeleteDialog() {
                this.deleteDialog = true;
            },
            closeDeleteDialog() {
                this.deleteDialog = false; // Close the dialog after deletion
            },
            confirmDelete() {
                this.deleteSelectedProperties();
                this.closeDeleteDialog();
            },
            saveChanges() {
                console.log('Saving changes:', this.submodelElementCollections);
                const submodelPath = this.selectedAAS?.endpoints[0].protocolInformation.href;

                if (submodelPath) {
                    // Create a Headers object for the request
                    const headers = new Headers({
                        'Content-Type': 'application/json', // Set the content type to JSON
                        Authorization: 'Bearer your-auth-token', // Example, add your auth token here
                    });

                    const context = 'Updating SubmodelElement'; // Context of the request
                    const disableMessage = false;

                    // Call the putRequest method with correct argument types
                    this.putRequest(
                        submodelPath,
                        this.submodelElementCollections,
                        headers,
                        context,
                        disableMessage
                    ).then((response: any) => {
                        if (response.success) {
                            console.log('Changes saved successfully.');
                        } else {
                            console.error('Failed to save changes.');
                        }
                    });
                }
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
            findNestedElement(elements: any[], idShort: string): any {
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
