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
                        smeData &&
                        Object.keys(smeData).length > 0
                    ">
                    <!-- Detailed View of the selected SubmodelElement (e.g. Property, Operation, etc.) -->
                    <v-card>
                        <v-list nav>
                            <!-- SubmodelELement Identification -->
                            <IdentificationElement :identification-object="smeData"></IdentificationElement>
                            <!-- Submodel Administrative Information-->
                            <v-divider
                                v-if="
                                    smeData.administration &&
                                    (smeData.administration.revision != '' || smeData.administration.version != '')
                                "
                                class="mt-2"></v-divider>
                            <AdministrativeInformationElement
                                v-if="smeData.administration"
                                :administrative-information-object="smeData.administration"
                                :administrative-information-title="'Administrative Information'"
                                :small="false"></AdministrativeInformationElement>
                            <v-divider
                                v-if="smeData.displayName && smeData.displayName.length > 0"
                                class="mt-2"></v-divider>
                            <!-- SubmodelELement DisplayName -->
                            <DisplayNameElement
                                v-if="smeData.displayName && smeData.displayName.length > 0"
                                :display-name-object="smeData.displayName"
                                :display-name-title="'Display Name'"
                                :small="false"></DisplayNameElement>
                            <v-divider
                                v-if="smeData.description && smeData.description.length > 0"
                                class="mt-2"></v-divider>
                            <!-- SubmodelELement Description -->
                            <DescriptionElement
                                v-if="smeData.description && smeData.description.length > 0"
                                :description-object="smeData.description"
                                :description-title="'Description'"
                                :small="false"></DescriptionElement>
                            <v-divider
                                v-if="
                                    smeData.semanticId && smeData.semanticId.keys && smeData.semanticId.keys.length > 0
                                "
                                class="mt-2"></v-divider>
                            <!-- SubmodelELement SemanticID -->
                            <SemanticID
                                v-if="
                                    smeData.semanticId && smeData.semanticId.keys && smeData.semanticId.keys.length > 0
                                "
                                :semantic-id-object="smeData.semanticId"
                                :semantic-title="'Semantic ID'"
                                :small="false"></SemanticID>
                            <v-divider
                                v-if="smeData.supplementalSemanticIds && smeData.supplementalSemanticIds.length > 0"
                                class="mt-2"></v-divider>
                            <!-- SubmodelELement SupplementalSemanticID -->
                            <SupplementalSemanticID
                                v-if="smeData.supplementalSemanticIds && smeData.supplementalSemanticIds.length > 0"
                                :supplemental-semantic-ids-array="smeData.supplementalSemanticIds"
                                :supplemental-semantic-ids-title="'Supplemental Semantic ID'"></SupplementalSemanticID>
                        </v-list>
                        <v-divider></v-divider>
                        <v-list nav class="px-4 pt-0 pb-5">
                            <!-- SubmodelELement Representation for different modelTypes -->
                            <Submodel v-if="smeData.modelType === 'Submodel'" :submodel-object="smeData"></Submodel>
                            <SubmodelElementCollection
                                v-else-if="smeData.modelType === 'SubmodelElementCollection'"
                                :submodel-element-collection-object="smeData"></SubmodelElementCollection>
                            <SubmodelElementList
                                v-else-if="smeData.modelType === 'SubmodelElementList'"
                                :submodel-element-list-object="smeData"></SubmodelElementList>
                            <Property
                                v-else-if="smeData.modelType === 'Property'"
                                :property-object="smeData"
                                :is-editable="editMode"
                                @update-value="initializeView()"></Property>
                            <MultiLanguageProperty
                                v-else-if="smeData.modelType === 'MultiLanguageProperty'"
                                :multi-language-property-object="smeData"
                                :is-editable="editMode"></MultiLanguageProperty>
                            <Operation
                                v-else-if="smeData.modelType === 'Operation'"
                                :operation-object="smeData"
                                :is-editable="editMode"></Operation>
                            <File
                                v-else-if="smeData.modelType === 'File'"
                                :file-object="smeData"
                                :is-editable="editMode"
                                @update-path="initializeView()"></File>
                            <Blob
                                v-else-if="smeData.modelType === 'Blob'"
                                :blob-object="smeData"
                                :is-editable="editMode"
                                @update-blob="initializeView"></Blob>
                            <ReferenceElement
                                v-else-if="smeData.modelType === 'ReferenceElement'"
                                :reference-element-object="smeData"
                                :is-editable="editMode"></ReferenceElement>
                            <Range v-else-if="smeData.modelType === 'Range'" :range-object="smeData"></Range>
                            <Entity v-else-if="smeData.modelType === 'Entity'" :entity-object="smeData"></Entity>
                            <RelationshipElement
                                v-else-if="smeData.modelType === 'RelationshipElement'"
                                :relationship-element-object="smeData"></RelationshipElement>
                            <AnnotatedRelationshipElement
                                v-else-if="smeData.modelType === 'AnnotatedRelationshipElement'"
                                :annotated-relationship-element-object="smeData"
                                :is-editable="editMode"></AnnotatedRelationshipElement>
                            <InvalidElement v-else :invalid-element-object="smeData"></InvalidElement>
                        </v-list>
                        <!-- Last Sync -->
                        <v-divider></v-divider>
                        <LastSync :timestamp="smeData.timestamp"></LastSync>
                    </v-card>
                    <v-sheet v-if="Array.isArray(cdData) && cdData.length > 0">
                        <template v-for="cd in cdData" :key="cd.id">
                            <ConceptDescription :concept-description-object="cd" class="mt-4"></ConceptDescription>
                        </template>
                    </v-sheet>
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
    import { useConceptDescriptionHandling } from '@/composables/ConceptDescriptionHandling';
    import { useSMEHandling } from '@/composables/SMEHandling';
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
    const smeData = ref({} as any);
    const cdData = ref([] as Array<any>);
    const autoSyncInterval = ref<number | undefined>(undefined); // interval to send requests to the AAS

    // Computed Properties
    const aasRegistryServerURL = computed(() => navigationStore.getAASRegistryURL);
    const submodelRegistryServerURL = computed(() => navigationStore.getSubmodelRegistryURL);
    const selectedAAS = computed(() => aasStore.getSelectedAAS);
    const selectedNode = computed(() => aasStore.getSelectedNode);
    const autoSync = computed(() => navigationStore.getAutoSync);
    const editMode = computed(() => route.name === 'AASEditor');
    const singleAas = computed(() => envStore.getSingleAas);

    // Watchers
    watch(
        () => aasRegistryServerURL.value,
        async () => {
            if (!aasRegistryServerURL.value) {
                await initializeView(true);
            }
        }
    );

    watch(
        () => submodelRegistryServerURL.value,
        async () => {
            if (!submodelRegistryServerURL.value) {
                await initializeView(true);
            }
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
                        await updateLocalData(await fetchSme(selectedNode.value.path, true), true);
                    }, autoSync.value.interval);
                }
            }

            await initializeView(true);
        }
    );

    watch(
        () => selectedNode.value,
        async () => {
            window.clearInterval(autoSyncInterval.value); // clear old interval
            if (autoSync.value.state) {
                if (selectedNode.value && Object.keys(selectedNode.value).length > 0) {
                    // create new interval
                    autoSyncInterval.value = window.setInterval(async () => {
                        // Note: Not only fetchSme() (like in AASListDetails). Dispatching needed for ComponentVisualization
                        await updateLocalData(await fetchSme(selectedNode.value.path, true), true);
                    }, autoSync.value.interval);
                }
            }

            await initializeView(true);
        },
        { deep: true }
    );

    watch(
        () => autoSync.value,
        async (autoSyncValue) => {
            window.clearInterval(autoSyncInterval.value); // clear old interval
            if (autoSyncValue.state) {
                if (selectedNode.value && Object.keys(selectedNode.value).length > 0) {
                    await updateLocalData(await fetchSme(selectedNode.value.path, true), true);

                    // create new interval
                    autoSyncInterval.value = window.setInterval(async () => {
                        // Note: Not only fetchSme() (like in AASListDetails). Dispatching needed for ComponentVisualization
                        await updateLocalData(await fetchSme(selectedNode.value.path, true), true);
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
                    await updateLocalData(await fetchSme(selectedNode.value.path, true), true);
                }, autoSync.value.interval);
            }
        }

        // await initializeView(true); // Not needed, cause this component does not stand alone
    });

    onBeforeUnmount(() => {
        window.clearInterval(autoSyncInterval.value); // clear old interval
    });

    async function initializeView(withConceptDescriptions: boolean = true): Promise<void> {
        if (!selectedNode.value || Object.keys(selectedNode.value).length === 0) {
            smeData.value = {};
            cdData.value = [];
            return;
        }

        await updateLocalData(selectedNode.value, withConceptDescriptions);
    }

    async function updateLocalData(updatedSMEData: any, withConceptDescriptions: boolean = true) {
        smeData.value = { ...updatedSMEData }; // create local copy

        if (withConceptDescriptions) {
            if (
                smeData.value?.conceptDescriptions &&
                Array.isArray(smeData.value.conceptDescriptions) &&
                smeData.value.conceptDescriptions.length > 0
            ) {
                cdData.value = [...smeData.value.conceptDescriptions];
                return;
            }

            if (!cdData.value || !Array.isArray(cdData.value) || cdData.value.length === 0) {
                cdData.value = await fetchCds(smeData.value);
                return;
            }

            cdData.value = [];
        }
    }
</script>
