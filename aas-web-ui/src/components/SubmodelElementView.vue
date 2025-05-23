<template>
    <v-container fluid class="pa-0">
        <v-card color="rgba(0,0,0,0)" elevation="0">
            <template v-if="!singleAas">
                <!-- Title Bar in the Submodel Element View -->
                <v-card-title style="padding: 15px 16px 16px">Element Details</v-card-title>
                <v-divider></v-divider>
            </template>
            <v-card-text
                style="overflow-y: auto"
                :style="singleAas ? 'height: calc(100svh - 105px)' : 'height: calc(100svh - 170px)'">
                <!-- Detailed View of the selected Submodel/SubmodelElement (e.g. Property, Operation, etc.) -->
                <template
                    v-if="
                        selectedAAS &&
                        Object.keys(selectedAAS).length > 0 &&
                        selectedNode &&
                        Object.keys(selectedNode).length > 0 &&
                        submodelElementData &&
                        Object.keys(submodelElementData).length > 0
                    ">
                    <!-- Detailed View of the selected SubmodelElement (e.g. Property, Operation, etc.) -->
                    <v-card>
                        <v-list nav>
                            <!-- SubmodelELement Identification -->
                            <IdentificationElement :identification-object="submodelElementData"></IdentificationElement>
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
                                v-if="submodelElementData.displayName && submodelElementData.displayName.length > 0"
                                class="mt-2"></v-divider>
                            <!-- SubmodelELement DisplayName -->
                            <DisplayNameElement
                                v-if="submodelElementData.displayName && submodelElementData.displayName.length > 0"
                                :display-name-array="submodelElementData.displayName"
                                :display-name-title="'Display Name'"
                                :small="false"></DisplayNameElement>
                            <v-divider
                                v-if="submodelElementData.description && submodelElementData.description.length > 0"
                                class="mt-2"></v-divider>
                            <!-- SubmodelELement Description -->
                            <DescriptionElement
                                v-if="submodelElementData.description && submodelElementData.description.length > 0"
                                :description-array="submodelElementData.description"
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
                                :is-editable="editMode"></Property>
                            <MultiLanguageProperty
                                v-else-if="submodelElementData.modelType === 'MultiLanguageProperty'"
                                :multi-language-property-object="submodelElementData"
                                :is-editable="editMode"></MultiLanguageProperty>
                            <Operation
                                v-else-if="submodelElementData.modelType === 'Operation'"
                                :operation-object="submodelElementData"
                                :is-editable="editMode"></Operation>
                            <File
                                v-else-if="submodelElementData.modelType === 'File'"
                                :file-object="submodelElementData"
                                :is-editable="editMode"></File>
                            <Blob
                                v-else-if="submodelElementData.modelType === 'Blob'"
                                :blob-object="submodelElementData"
                                :is-editable="editMode"></Blob>
                            <ReferenceElement
                                v-else-if="submodelElementData.modelType === 'ReferenceElement'"
                                :reference-element-object="submodelElementData"
                                :is-editable="editMode"></ReferenceElement>
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
                                :annotated-relationship-element-object="submodelElementData"
                                :is-editable="editMode"></AnnotatedRelationshipElement>
                            <InvalidElement v-else :invalid-element-object="submodelElementData"></InvalidElement>
                        </v-list>
                        <!-- Last Sync -->
                        <v-divider></v-divider>
                        <LastSync :timestamp="submodelElementData.timestamp"></LastSync>
                    </v-card>
                    <template v-if="Array.isArray(conceptDescriptions) && conceptDescriptions.length > 0">
                        <template v-for="cd in conceptDescriptions" :key="cd.id">
                            <ConceptDescription :concept-description-object="cd" class="mt-4"></ConceptDescription>
                        </template>
                    </template>
                </template>
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
    import { useRoute } from 'vue-router';
    import { useConceptDescriptionHandling } from '@/composables/AAS/ConceptDescriptionHandling';
    import { useSMEHandling } from '@/composables/AAS/SMEHandling';
    import { useAASStore } from '@/store/AASDataStore';
    import { useEnvStore } from '@/store/EnvironmentStore';
    import { useNavigationStore } from '@/store/NavigationStore';

    // Vue Router
    const route = useRoute();

    // Stores
    const navigationStore = useNavigationStore();
    const aasStore = useAASStore();
    const envStore = useEnvStore();

    // Composables
    const { fetchCds } = useConceptDescriptionHandling();
    const { fetchSme } = useSMEHandling();

    // Data
    const submodelElementData = ref({} as any);
    const conceptDescriptions = ref([] as Array<any>);
    const autoSyncInterval = ref<number | undefined>(undefined); // interval to send requests to the AAS

    // Computed Properties
    const aasRegistryURL = computed(() => navigationStore.getAASRegistryURL);
    const submodelRegistryURL = computed(() => navigationStore.getSubmodelRegistryURL);
    const selectedAAS = computed(() => aasStore.getSelectedAAS);
    const selectedNode = computed(() => aasStore.getSelectedNode);
    const autoSync = computed(() => navigationStore.getAutoSync);
    const editMode = computed(() => route.name === 'AASEditor');
    const singleAas = computed(() => envStore.getSingleAas);

    // Watchers
    watch(
        () => aasRegistryURL.value,
        () => {
            resetLocalData();
            initialize(selectedNode.value, true);
        }
    );

    watch(
        () => submodelRegistryURL.value,
        () => {
            resetLocalData();
            initialize(selectedNode.value, true);
        }
    );

    watch(
        () => selectedAAS.value,
        async () => {
            window.clearInterval(autoSyncInterval.value); // clear old interval
            if (autoSync.value.state) {
                if (selectedNode.value && Object.keys(selectedNode.value).length > 0) {
                    // create new interval
                    autoSyncInterval.value = window.setInterval(async () => {
                        // Note: Not only fetchSme() (like in AASListDetails). Dispatching needed for ComponentVisualization
                        await initialize(await fetchSme(selectedNode.value.path, true));
                    }, autoSync.value.interval);
                }
            }

            resetLocalData();
            initialize(selectedNode.value, true);
        },
        { deep: true }
    );

    watch(
        () => selectedNode.value,
        async (selectedNodeValue) => {
            window.clearInterval(autoSyncInterval.value); // clear old interval
            if (autoSync.value.state) {
                if (selectedNodeValue && Object.keys(selectedNodeValue).length > 0) {
                    // create new interval
                    autoSyncInterval.value = window.setInterval(async () => {
                        // Note: Not only fetchSme() (like in AASListDetails). Dispatching needed for ComponentVisualization
                        await initialize(await fetchSme(selectedNodeValue.path, true));
                    }, autoSync.value.interval);
                }
            }

            if (selectedNode.value.path === submodelElementData.value.path) {
                // If updated selected node is the same, no need for update concept description
                initialize(selectedNodeValue, false);
            } else {
                resetLocalData();
                initialize(selectedNodeValue, true);
            }
        }
    );

    watch(
        () => autoSync.value,
        async (autoSyncValue) => {
            window.clearInterval(autoSyncInterval.value); // clear old interval
            if (autoSyncValue.state) {
                if (selectedNode.value && Object.keys(selectedNode.value).length > 0) {
                    initialize(await fetchSme(selectedNode.value.path, true));

                    // create new interval
                    autoSyncInterval.value = window.setInterval(async () => {
                        // Note: Not only fetchSme() (like in AASListDetails). Dispatching needed for ComponentVisualization
                        initialize(await fetchSme(selectedNode.value.path, true));
                    }, autoSyncValue.interval);
                }
            }
        },
        { deep: true }
    );

    onMounted(async () => {
        if (autoSync.value.state) {
            if (selectedNode.value && Object.keys(selectedNode.value).length > 0) {
                // create new interval
                autoSyncInterval.value = window.setInterval(async () => {
                    // Note: Not only fetchSme() (like in AASListDetails). Dispatching needed for ComponentVisualization
                    initialize(await fetchSme(selectedNode.value.path, true));
                }, autoSync.value.interval);
            }
        }

        initialize(selectedNode.value, true);
    });

    onBeforeUnmount(() => {
        window.clearInterval(autoSyncInterval.value); // clear old interval
    });

    /**
     * Initializes local data
     *
     * @async
     * @param {any} smeData - The submodel element (SME) data
     * @param {boolean} withConceptDescriptions - Flag to specify if local data should be updated with with ConceptDescriptions (CDs)
     */
    async function initialize(smeData: any, withConceptDescriptions: boolean = true): Promise<void> {
        if (!smeData || Object.keys(smeData).length === 0) {
            resetLocalData();
            return;
        }

        submodelElementData.value = { ...smeData }; // create local copy

        if (withConceptDescriptions) {
            if (
                submodelElementData.value?.conceptDescriptions &&
                Array.isArray(submodelElementData.value.conceptDescriptions) &&
                submodelElementData.value.conceptDescriptions.length > 0
            ) {
                conceptDescriptions.value = [...submodelElementData.value.conceptDescriptions];
                return;
            }

            if (
                !conceptDescriptions.value ||
                !Array.isArray(conceptDescriptions.value) ||
                conceptDescriptions.value.length === 0
            ) {
                const fetchedConceptDescriptions = await fetchCds(submodelElementData.value);
                submodelElementData.value.conceptDescriptions = [...fetchedConceptDescriptions];
                conceptDescriptions.value = [...fetchedConceptDescriptions];
                return;
            }

            conceptDescriptions.value = [];
        }
    }

    /**
     * Resets local data
     */
    function resetLocalData(): void {
        submodelElementData.value = {};
        conceptDescriptions.value = [];
    }
</script>
