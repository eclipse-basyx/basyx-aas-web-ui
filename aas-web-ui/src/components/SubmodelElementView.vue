<template>
    <v-container fluid class="pa-0">
        <v-card color="rgba(0,0,0,0)" elevation="0">
            <v-card-title style="padding: 15px 16px 16px">Element Details</v-card-title>
            <v-divider></v-divider>
            <v-card-text style="overflow-y: auto; height: calc(100vh - 170px)">
                <!-- Detailed View of the selected SubmodelElement (e.g. Property, Operation, etc.) -->
                <v-card
                    v-if="
                        selectedAAS &&
                        Object.keys(selectedAAS).length > 0 &&
                        submodelElementData &&
                        Object.keys(submodelElementData).length > 0
                    ">
                    <v-list nav>
                        <!-- SubmodelELement Identification -->
                        <IdentificationElement
                            :identification-object="submodelElementData"
                            :model-type="submodelElementData.modelType"
                            :id-type="'Identification (ID)'"
                            :name-type="'idShort'"></IdentificationElement>
                        <!-- Submodel Administrative Information-->
                        <v-divider
                            v-if="
                                submodelElementData.administration &&
                                (submodelElementData.administration.revision != '' ||
                                    submodelElementData.administration.version != '')
                            "
                            class="mt-2"></v-divider>
                        <AdministrativeInformationElement
                            v-if="submodelElementData.administration"
                            :administrative-information-object="submodelElementData.administration"
                            :administrative-information-title="'Administrative Information'"
                            :small="false"></AdministrativeInformationElement>
                        <v-divider
                            v-if="
                                submodelElementData.displayName && submodelElementData.displayName.length > 0
                            "></v-divider>
                        <!-- SubmodelELement DisplayName -->
                        <DisplayNameElement
                            v-if="submodelElementData.displayName && submodelElementData.displayName.length > 0"
                            :display-name-object="submodelElementData.displayName"
                            :display-name-title="'Display Name'"
                            :small="false"></DisplayNameElement>
                        <v-divider
                            v-if="submodelElementData.description && submodelElementData.description.length > 0"
                            class="mt-2"></v-divider>
                        <!-- SubmodelELement Description -->
                        <DescriptionElement
                            v-if="submodelElementData.description && submodelElementData.description.length > 0"
                            :description-object="submodelElementData.description"
                            :description-title="'Description'"
                            :small="false"></DescriptionElement>
                        <v-divider
                            v-if="
                                submodelElementData.semanticId &&
                                submodelElementData.semanticId.keys &&
                                submodelElementData.semanticId.keys.length > 0
                            "
                            class="mt-2"></v-divider>
                        <!-- SubmodelELement SemanticID -->
                        <SemanticID
                            v-if="
                                submodelElementData.semanticId &&
                                submodelElementData.semanticId.keys &&
                                submodelElementData.semanticId.keys.length > 0
                            "
                            :semantic-id-object="submodelElementData.semanticId"
                            :semantic-title="'Semantic ID'"
                            :small="false"></SemanticID>
                        <v-divider
                            v-if="
                                submodelElementData.supplementalSemanticIds &&
                                submodelElementData.supplementalSemanticIds.length > 0
                            "
                            class="mt-2"></v-divider>
                        <!-- SubmodelELement SupplementalSemanticID -->
                        <SupplementalSemanticID
                            v-if="
                                submodelElementData.supplementalSemanticIds &&
                                submodelElementData.supplementalSemanticIds.length > 0
                            "
                            :supplemental-semantic-ids-array="submodelElementData.supplementalSemanticIds"
                            :supplemental-semantic-ids-title="'Supplemental Semantic ID'"></SupplementalSemanticID>
                    </v-list>
                    <v-divider></v-divider>
                    <v-list nav class="px-4 pt-0 pb-5">
                        <!-- SubmodelELement Representation for different modelTypes -->
                        <Submodel
                            v-if="submodelElementData.modelType === 'Submodel'"
                            :submodel-object="submodelElementData"></Submodel>
                        <SubmodelElementCollection
                            v-else-if="submodelElementData.modelType === 'SubmodelElementCollection'"
                            :submodel-element-collection-object="submodelElementData"></SubmodelElementCollection>
                        <SubmodelElementList
                            v-else-if="submodelElementData.modelType === 'SubmodelElementList'"
                            :submodel-element-list-object="submodelElementData"></SubmodelElementList>
                        <Property
                            v-else-if="submodelElementData.modelType === 'Property'"
                            :property-object="submodelElementData"
                            @update-value="initializeView()"></Property>
                        <MultiLanguageProperty
                            v-else-if="submodelElementData.modelType === 'MultiLanguageProperty'"
                            :multi-language-property-object="submodelElementData"></MultiLanguageProperty>
                        <Operation
                            v-else-if="submodelElementData.modelType === 'Operation'"
                            :operation-object="submodelElementData"></Operation>
                        <File
                            v-else-if="submodelElementData.modelType === 'File'"
                            :file-object="submodelElementData"
                            @update-path="initializeView()"></File>
                        <Blob
                            v-else-if="submodelElementData.modelType === 'Blob'"
                            :blob-object="submodelElementData"
                            @update-blob="initializeView"></Blob>
                        <ReferenceElement
                            v-else-if="submodelElementData.modelType === 'ReferenceElement'"
                            :reference-element-object="submodelElementData"></ReferenceElement>
                        <Range
                            v-else-if="submodelElementData.modelType === 'Range'"
                            :range-object="submodelElementData"></Range>
                        <Entity
                            v-else-if="submodelElementData.modelType === 'Entity'"
                            :entity-object="submodelElementData"></Entity>
                        <RelationshipElement
                            v-else-if="submodelElementData.modelType === 'RelationshipElement'"
                            :relationship-element-object="submodelElementData"></RelationshipElement>
                        <AnnotatedRelationshipElement
                            v-else-if="submodelElementData.modelType === 'AnnotatedRelationshipElement'"
                            :annotated-relationship-element-object="submodelElementData"></AnnotatedRelationshipElement>
                        <InvalidElement v-else :invalid-element-object="submodelElementData"></InvalidElement>
                    </v-list>
                    <!-- ConceptDescriptions -->
                    <v-divider
                        v-if="
                            submodelElementData.conceptDescriptions &&
                            submodelElementData.conceptDescriptions.length > 0
                        "></v-divider>
                    <v-list
                        v-if="
                            submodelElementData.conceptDescriptions &&
                            submodelElementData.conceptDescriptions.length > 0
                        "
                        nav>
                        <v-list-item
                            v-for="(conceptDescription, index) in submodelElementData.conceptDescriptions"
                            :key="conceptDescription.id">
                            <ConceptDescription :concept-description-object="conceptDescription"></ConceptDescription>
                            <v-divider
                                v-if="index !== submodelElementData.conceptDescriptions.length - 1"
                                class="mt-2"></v-divider>
                        </v-list-item>
                    </v-list>
                    <!-- Last Sync -->
                    <v-divider></v-divider>
                    <v-list class="py-0">
                        <v-list-item>
                            <v-list-item-subtitle>
                                <span class="text-caption">{{ 'Last sync: ' }}</span>
                                <span
                                    class="text-caption"
                                    :class="
                                        submodelElementData.timestamp == 'no sync' ? 'text-error' : 'text-subtitleText'
                                    "
                                    >{{ submodelElementData.timestamp }}</span
                                >
                            </v-list-item-subtitle>
                        </v-list-item>
                    </v-list>
                </v-card>
                <v-empty-state
                    v-else-if="!selectedAAS || Object.keys(selectedAAS).length === 0"
                    title="No selected AAS"
                    class="text-divider"></v-empty-state>
                <v-empty-state
                    v-else-if="!selectedNode || Object.keys(selectedNode).length === 0"
                    title="No selected Submodel / Submodel Element"
                    text="Select a Submodel / Submodel Element to view"
                    class="text-divider"></v-empty-state>
            </v-card-text>
        </v-card>
    </v-container>
</template>

<script lang="ts" setup>
    import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
    import { useConceptDescriptionHandling } from '@/composables/ConceptDescriptionHandling';
    import { useRequestHandling } from '@/composables/RequestHandling';
    import { useAASStore } from '@/store/AASDataStore';
    import { useNavigationStore } from '@/store/NavigationStore';
    import { formatDate } from '@/utils/DateUtils';

    // Stores
    const navigationStore = useNavigationStore();
    const aasStore = useAASStore();

    // Composables
    const { getConceptDescriptions } = useConceptDescriptionHandling();
    const { getRequest } = useRequestHandling();

    // Data
    const submodelElementData = ref({} as any);
    const requestInterval = ref<number | undefined>(undefined); // interval to send requests to the AAS

    // Computed Properties
    const aasRegistryServerURL = computed(() => navigationStore.getAASRegistryURL);
    const submodelRegistryServerURL = computed(() => navigationStore.getSubmodelRegistryURL);
    const selectedAAS = computed(() => aasStore.getSelectedAAS);
    const selectedNode = computed(() => aasStore.getSelectedNode);
    const autoSync = computed(() => navigationStore.getAutoSync);

    // Watchers
    // Resets the SubmodelElementView when the AAS Registry changes
    watch(
        () => aasRegistryServerURL.value,
        () => {
            if (!aasRegistryServerURL.value) {
                submodelElementData.value = {};
                aasStore.dispatchRealTimeObject(submodelElementData);
            }
        }
    );

    // Resets the SubmodelElementView when the Submodel Registry changes
    watch(
        () => submodelRegistryServerURL.value,
        () => {
            if (!submodelRegistryServerURL.value) {
                submodelElementData.value = {};
                aasStore.dispatchRealTimeObject(submodelElementData);
            }
        }
    );

    // Resets the SubmodelElementView when the AAS changes
    watch(
        () => selectedAAS.value,
        () => {
            submodelElementData.value = {};
            aasStore.dispatchRealTimeObject(submodelElementData);
        }
    );

    // Watch for changes in the selected Node and (re-)initialize the Component
    watch(
        () => selectedNode.value,
        () => {
            // clear old submodelElementData
            submodelElementData.value = {};
            initializeView(true);
        },
        { deep: true }
    );

    // watch for changes in the autoSync state and create or clear the requestInterval
    watch(
        () => autoSync.value,
        () => {
            if (autoSync.value.state) {
                window.clearInterval(requestInterval.value); // clear old interval
                // create new interval
                requestInterval.value = window.setInterval(() => {
                    if (Object.keys(selectedNode.value).length > 0) {
                        initializeView();
                    }
                }, autoSync.value.interval);
            } else {
                window.clearInterval(requestInterval.value);
            }
        },
        { deep: true }
    );

    onMounted(() => {
        if (autoSync.value.state) {
            // create new interval
            requestInterval.value = window.setInterval(() => {
                if (Object.keys(selectedNode.value).length > 0) {
                    initializeView();
                }
            }, autoSync.value.interval);
        } else {
            initializeView(true);
        }
    });

    onBeforeUnmount(() => {
        window.clearInterval(requestInterval.value); // clear old interval
    });

    function initializeView(withConceptDescriptions = false) {
        // console.log('selected Node: ', selectedNode.value);
        // Check if a Node is selected
        if (Object.keys(selectedNode.value).length === 0) {
            submodelElementData.value = {}; // Reset the SubmodelElement Data when no Node is selected
            return;
        }
        // Request the selected SubmodelElement
        const path = selectedNode.value.path;
        const context = 'retrieving SubmodelElement';
        const disableMessage = true;
        getRequest(path, context, disableMessage).then((response: any) => {
            // save Concept Descriptions before overwriting the SubmodelElement Data
            let conceptDescriptions = submodelElementData.value.conceptDescriptions;
            if (response.success && (response.data?.id || response.data?.idShort)) {
                // execute if the Request was successful
                response.data.timestamp = formatDate(new Date()); // add timestamp to the SubmodelElement Data
                response.data.path = selectedNode.value.path; // add the path to the SubmodelElement Data
                // console.log('SubmodelElement Data: ', response.data);
                submodelElementData.value = response.data;
            } else {
                // execute if the Request failed
                // show the static SubmodelElement Data from the store if the Request failed (the timestamp should show that the data is outdated)
                submodelElementData.value = {}; // Reset the SubmodelElement Data when Node couldn't be retrieved
                if (Object.keys(selectedNode.value).length === 0) {
                    // don't copy the static SubmodelElement Data if no Node is selected or Node is invalid
                    navigationStore.dispatchSnackbar({
                        status: true,
                        timeout: 60000,
                        color: 'error',
                        btnColor: 'buttonText',
                        text: 'No valid SubmodelElement under the given Path',
                    }); // Show Error Snackbar
                    return;
                }
                submodelElementData.value = { ...selectedNode.value }; // copy the static SubmodelElement Data from the store
                submodelElementData.value.timestamp = 'no sync';
                submodelElementData.value.path = selectedNode.value.path; // add the path to the SubmodelElement Data
            }
            if (withConceptDescriptions) {
                getCD(); // fetch Concept Descriptions for the SubmodelElement
            } else {
                submodelElementData.value.conceptDescriptions = conceptDescriptions; // add Concept Descriptions to the SubmodelElement Data
            }
            // console.log('SubmodelElement Data (SubmodelElementView): ', this.submodelElementData)
            // add SubmodelElement Data to the store (as RealTimeDataObject)
            aasStore.dispatchRealTimeObject(submodelElementData);
        });
    }

    // Get Concept Descriptions for the SubmodelElement from the ConceptDescription Repository
    function getCD() {
        getConceptDescriptions(selectedNode.value).then((response: any) => {
            // console.log('ConceptDescription: ', response)
            // add ConceptDescription to the SubmodelElement Data
            if (response) {
                submodelElementData.value.conceptDescriptions = response;
            }
        });
    }
</script>
