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
                    <!-- ConceptDescriptions -->
                    <v-divider v-if="conceptDescriptions && conceptDescriptions.length > 0"></v-divider>
                    <v-list v-if="conceptDescriptions && conceptDescriptions.length > 0" nav>
                        <v-list-item
                            v-for="(conceptDescription, index) in conceptDescriptions"
                            :key="conceptDescription.id">
                            <ConceptDescription :concept-description-object="conceptDescription"></ConceptDescription>
                            <v-divider v-if="index !== conceptDescriptions.length - 1" class="mt-2"></v-divider>
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
    import { useRoute } from 'vue-router';
    import { useConceptDescriptionHandling } from '@/composables/ConceptDescriptionHandling';
    import { useSMEHandling } from '@/composables/SMEHandling';
    import { useAASStore } from '@/store/AASDataStore';
    import { useNavigationStore } from '@/store/NavigationStore';

    // Vue Router
    const route = useRoute();

    // Stores
    const navigationStore = useNavigationStore();
    const aasStore = useAASStore();

    // Composables
    const { getConceptDescriptions } = useConceptDescriptionHandling();
    const { fetchAndDispatchSme } = useSMEHandling();

    // Data
    const submodelElementData = ref({} as any);
    const conceptDescriptions = ref([] as Array<any>);
    const requestInterval = ref<number | undefined>(undefined); // interval to send requests to the AAS

    // Computed Properties
    const aasRegistryServerURL = computed(() => navigationStore.getAASRegistryURL);
    const submodelRegistryServerURL = computed(() => navigationStore.getSubmodelRegistryURL);
    const selectedAAS = computed(() => aasStore.getSelectedAAS);
    const selectedNode = computed(() => aasStore.getSelectedNode);
    const autoSync = computed(() => navigationStore.getAutoSync);
    const editMode = computed(() => route.name === 'AASEditor');

    // Watchers
    // Resets the SubmodelElementView when the AAS Registry changes
    watch(
        () => aasRegistryServerURL.value,
        () => {
            if (!aasRegistryServerURL.value) {
                initializeView();
            }
        }
    );

    // Resets the SubmodelElementView when the Submodel Registry changes
    watch(
        () => submodelRegistryServerURL.value,
        () => {
            if (!submodelRegistryServerURL.value) {
                initializeView();
            }
        }
    );

    // Resets the SubmodelElementView when the AAS changes
    watch(
        () => selectedAAS.value,
        () => {
            initializeView();
        }
    );

    // Watch for changes in the selected Node and (re-)initialize the Component
    watch(
        () => selectedNode.value,
        () => {
            initializeView();
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
                        fetchAndDispatchSme(selectedNode.value.path, false);
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
                    fetchAndDispatchSme(selectedNode.value.path, false);
                }
            }, autoSync.value.interval);
        } else {
            initializeView();
        }
    });

    onBeforeUnmount(() => {
        window.clearInterval(requestInterval.value); // clear old interval
    });

    async function initializeView(): Promise<void> {
        if (Object.keys(selectedNode.value).length === 0) {
            submodelElementData.value = {};
            return;
        }

        submodelElementData.value = { ...selectedNode.value }; // create local copy

        if (
            !conceptDescriptions.value ||
            !Array.isArray(conceptDescriptions.value) ||
            conceptDescriptions.value.length === 0
        ) {
            conceptDescriptions.value = await getConceptDescriptions(selectedNode.value);
        }
    }
</script>
