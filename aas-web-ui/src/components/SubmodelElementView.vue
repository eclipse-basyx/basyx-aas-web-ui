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
                        submodelElementData &&
                        Object.keys(submodelElementData).length > 0
                    ">
                    <!-- Detailed View of the selected SubmodelElement (e.g. Property, Operation, etc.) -->
                    <v-card :class="conceptDescriptions.length > 0 ? 'mb-3' : ''">
                        <v-list nav>
                            <!-- SM/SME Identification -->
                            <IdentificationElement :identification-object="submodelElementData" />
                            <!-- SM/SME further information as expandable panels -->
                            <v-expansion-panels v-model="openPanels" multiple class="mb-n2">
                                <!-- SM/SME Administrative Information-->
                                <template v-if="hasAdministrativeInformation">
                                    <v-divider />
                                    <AdministrativeInformationElement
                                        :administrative-information-object="submodelElementData.administration" />
                                </template>
                                <!-- SM/SME DisplayName -->
                                <template v-if="hasDisplayName">
                                    <v-divider />
                                    <DisplayNameElement :display-name-array="submodelElementData.displayName" />
                                </template>
                                <!-- SM/SME Description -->
                                <template v-if="hasDescription">
                                    <v-divider />
                                    <DescriptionElement :description-array="submodelElementData.description" />
                                </template>
                                <!-- SM/SME SemanticId -->
                                <template v-if="hasSemanticId">
                                    <v-divider />
                                    <SemanticIdElement :semantic-id-object="submodelElementData.semanticId" />
                                </template>
                                <!-- SM/SME SupplementalSemanticIds -->
                                <template v-if="hasSupplementalSemanticIds">
                                    <v-divider />
                                    <SupplementalSemanticIDsElement
                                        :supplemental-semantic-ids-array="
                                            submodelElementData.supplementalSemanticIds
                                        " />
                                </template>
                            </v-expansion-panels>
                        </v-list>
                        <v-divider />
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
                                :is-editable="editMode"
                                @update-value="initializeView()"></Property>
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
                                :is-editable="editMode"
                                @update-path="initializeView()"></File>
                            <Blob
                                v-else-if="submodelElementData.modelType === 'Blob'"
                                :blob-object="submodelElementData"
                                :is-editable="editMode"
                                @update-blob="initializeView"></Blob>
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
                    <template v-for="(conceptDescription, index) in conceptDescriptions" :key="conceptDescription.id">
                        <ConceptDescription :concept-description-object="conceptDescription"></ConceptDescription>
                        <v-divider v-if="index !== conceptDescriptions.length - 1" class="mt-2"></v-divider>
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
    const { getConceptDescriptions } = useConceptDescriptionHandling();
    const { fetchAndDispatchSme } = useSMEHandling();

    // Data
    const submodelElementData = ref({} as any);
    const conceptDescriptions = ref([] as Array<any>);
    const autoSyncInterval = ref<number | undefined>(undefined); // interval to send requests to the AAS
    const openPanels = ref<number[]>([]);

    // Computed Properties
    const aasRegistryServerURL = computed(() => navigationStore.getAASRegistryURL);
    const submodelRegistryServerURL = computed(() => navigationStore.getSubmodelRegistryURL);
    const selectedAAS = computed(() => aasStore.getSelectedAAS);
    const selectedNode = computed(() => aasStore.getSelectedNode);
    const autoSync = computed(() => navigationStore.getAutoSync);
    const editMode = computed(() => route.name === 'AASEditor');
    const singleAas = computed(() => envStore.getSingleAas);
    const hasAdministrativeInformation = computed(() =>
        submodelElementData.value?.administration && Object.keys(submodelElementData.value?.administration).length > 0
            ? true
            : false
    );
    const hasDisplayName = computed(() =>
        submodelElementData.value.displayName &&
        Array.isArray(submodelElementData.value.displayName) &&
        submodelElementData.value.displayName.length > 0
            ? true
            : false
    );
    const hasDescription = computed(() =>
        submodelElementData.value.description &&
        Array.isArray(submodelElementData.value.description) &&
        submodelElementData.value.description.length > 0
            ? true
            : false
    );
    const hasSemanticId = computed(
        () =>
            submodelElementData.value.semanticId &&
            submodelElementData.value.semanticId.keys &&
            Array.isArray(submodelElementData.value.semanticId.keys) &&
            submodelElementData.value.semanticId.keys.length > 0
    );
    const hasSupplementalSemanticIds = computed(
        () =>
            submodelElementData.value.supplementalSemanticIds &&
            Array.isArray(submodelElementData.value.supplementalSemanticIds) &&
            submodelElementData.value.supplementalSemanticIds.length > 0
    );
    const openPanelNumber = computed(() =>
        hasDescription.value ? 0 + (hasAdministrativeInformation.value ? 1 : 0) + (hasDisplayName.value ? 1 : 0) : null
    );

    // Watchers
    // Resets the SubmodelElementView when the AAS Registry changes
    watch(
        () => aasRegistryServerURL.value,
        async () => {
            if (!aasRegistryServerURL.value) {
                await initializeView();
            }
        }
    );

    // Resets the SubmodelElementView when the Submodel Registry changes
    watch(
        () => submodelRegistryServerURL.value,
        async () => {
            if (!submodelRegistryServerURL.value) {
                await initializeView();
            }
        }
    );

    // Resets the SubmodelElementView when the AAS changes
    watch(
        () => selectedAAS.value,
        async () => {
            await initializeView();
        }
    );

    // Watch for changes in the selected Node and (re-)initialize the Component
    watch(
        () => selectedNode.value,
        async () => {
            await initializeView(true);
        },
        { deep: true }
    );

    watch(
        () => submodelElementData.value,
        async () => {
            openPanels.value = openPanelNumber.value === null ? [] : [openPanelNumber.value];
        },
        { deep: true }
    );

    // watch for changes in the autoSync state and create or clear the autoSyncInterval
    watch(
        () => autoSync.value,
        (autoSyncValue) => {
            if (autoSyncValue.state) {
                window.clearInterval(autoSyncInterval.value); // clear old interval
                // create new interval
                autoSyncInterval.value = window.setInterval(async () => {
                    if (selectedNode.value && Object.keys(selectedNode.value).length > 0) {
                        // Note: Not only fetchSme() (like in AASListDetails). Dispatching needed for ComponentVisualization
                        await fetchAndDispatchSme(selectedNode.value.path, false);
                    }
                }, autoSyncValue.interval);
            } else {
                window.clearInterval(autoSyncInterval.value);
            }
        },
        { deep: true }
    );

    onMounted(async () => {
        if (autoSync.value.state) {
            // create new interval
            autoSyncInterval.value = window.setInterval(async () => {
                if (selectedNode.value && Object.keys(selectedNode.value).length > 0) {
                    // Note: Not only fetchSme() (like in AASListDetails). Dispatching needed for ComponentVisualization
                    await fetchAndDispatchSme(selectedNode.value.path, false);
                }
            }, autoSync.value.interval);
        }
        await initializeView(true);
    });

    onBeforeUnmount(() => {
        window.clearInterval(autoSyncInterval.value); // clear old interval
    });

    async function initializeView(withConceptDescriptions: boolean = false): Promise<void> {
        if (!selectedNode.value || Object.keys(selectedNode.value).length === 0) {
            submodelElementData.value = {};
            conceptDescriptions.value = [];
            return;
        }

        submodelElementData.value = { ...selectedNode.value }; // create local copy
        conceptDescriptions.value = [];

        if (withConceptDescriptions) {
            if (
                selectedNode.value?.conceptDescriptions &&
                Array.isArray(selectedNode.value.conceptDescriptions) &&
                selectedNode.value.conceptDescriptions.length > 0
            ) {
                conceptDescriptions.value = { ...selectedNode.value.conceptDescriptions };
            }

            if (
                !conceptDescriptions.value ||
                !Array.isArray(conceptDescriptions.value) ||
                conceptDescriptions.value.length === 0
            ) {
                conceptDescriptions.value = await getConceptDescriptions(submodelElementData.value);
            }
        }
    }
</script>
