<template>
    <v-container fluid class="pa-0">

        <v-card v-if="easyViewState" v-for="(submodelElement, index) in localSubmodelElementData" :key="submodelElement.id">
            <Property  v-if="submodelElement.modelType === 'Property'" :property-object="submodelElement"
                :is-editable="false" class="pa-1">
            </Property>
            <MultiLanguageProperty v-else-if="submodelElement.modelType === 'MultiLanguageProperty'"
                :multi-language-property-object="submodelElement" :is-editable="false" class="pa-1">
            </MultiLanguageProperty>
        </v-card>

        <v-expansion-panels multiple class="mt-3" v-model="expandedPanels">
            <v-expansion-panel v-for="(submodelElement, index) in (easyViewState ? filteredSubmodelElements : localSubmodelElementData)" :key="submodelElement.id" >
                <v-expansion-panel-title color="elevatedCard">
                    <span v-if="submodelElement.idShort">{{ nameToDisplay(submodelElement) }}</span>
                    <span v-else>{{ 'Element ' + (index + 1) }}</span>
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                    <DescriptionElement v-if="submodelElement.description && submodelElement.description.length > 0"
                        :description-array="submodelElement.description" :description-title="'Description'"
                        :small="false"></DescriptionElement>

                    <GenericDataVisu v-if="
                            Array.isArray(submodelElement.value) &&
                            submodelElement.value.length > 0 &&
                            submodelElement.modelType !== 'MultiLanguageProperty'
                        " :submodel-element-data="submodelElement.value"></GenericDataVisu>

                    <v-list v-else nav class="px-4 pt-0 pb-0">
                        <!-- SubmodelELement Representation for different modelTypes -->
                        <Property v-if="submodelElement.modelType === 'Property'" :property-object="submodelElement"
                            :is-editable="false"></Property>
                        <MultiLanguageProperty v-else-if="submodelElement.modelType === 'MultiLanguageProperty'"
                            :multi-language-property-object="submodelElement" :is-editable="false">
                        </MultiLanguageProperty>
                        <Operation v-else-if="submodelElement.modelType === 'Operation'"
                            :operation-object="submodelElement" :is-editable="false"></Operation>
                        <File v-else-if="submodelElement.modelType === 'File'" :file-object="submodelElement"
                            :is-editable="false"></File>
                        <Blob v-else-if="submodelElement.modelType === 'Blob'" :blob-object="submodelElement"
                            :is-editable="false"></Blob>
                        <ReferenceElement v-else-if="submodelElement.modelType === 'ReferenceElement'"
                            :reference-element-object="submodelElement" :is-editable="false"></ReferenceElement>
                        <Range v-else-if="submodelElement.modelType === 'Range'" :range-object="submodelElement">
                        </Range>
                        <Entity v-else-if="submodelElement.modelType === 'Entity'" :entity-object="submodelElement">
                        </Entity>
                        <RelationshipElement v-else-if="submodelElement.modelType === 'RelationshipElement'"
                            :relationship-element-object="submodelElement"></RelationshipElement>
                        <AnnotatedRelationshipElement
                            v-else-if="submodelElement.modelType === 'AnnotatedRelationshipElement'"
                            :annotated-relationship-element-object="submodelElement" :is-editable="false">
                        </AnnotatedRelationshipElement>
                        <InvalidElement v-else :invalid-element-object="submodelElement"></InvalidElement>
                        
                    </v-list>
                </v-expansion-panel-text>
            </v-expansion-panel>
        </v-expansion-panels>
    </v-container>
</template>

// TODO Transfer to composition API
<script lang="ts">
    import { defineComponent } from 'vue';
    import { useTheme } from 'vuetify';
    import { useReferableUtils } from '@/composables/AAS/ReferableUtils';
    import { useRequestHandling } from '@/composables/RequestHandling';
    import { useAASStore } from '@/store/AASDataStore';
    import { useNavigationStore } from '@/store/NavigationStore';

    export default defineComponent({
        name: 'GenericDataVisu',
        props: ['submodelElementData'],

        setup() {
            const theme = useTheme();
            const aasStore = useAASStore();

            const navigationStore = useNavigationStore();
            const easyViewState = computed(() => navigationStore.getEasyViewState)

            const { nameToDisplay } = useReferableUtils();
            const { putRequest } = useRequestHandling();

            return {
                theme, // Theme Object
                aasStore, // AASStore Object
                nameToDisplay,
                putRequest,
                easyViewState,
            };
        },

        data() {
            return {
                localSubmodelElementData: [] as Array<any>, // SubmodelElement Data
                expandedPanels: [] as Array<number>, // Tracks the indices of expanded panels
                // conceptDescriptions: {}, // Data of Concept Descriptions
            };
        },
        computed: {
                    filteredSubmodelElements() {
                        return this.localSubmodelElementData.filter(
                            (element) => element.modelType !== 'Property'
                        );
                    },
                },
        watch: {
            submodelElementData: {
                handler() {
                    this.initializeSubmodelElementData();
                },
                deep: true,
            },
        },

        mounted() {
            this.initializeSubmodelElementData();
        },

        methods: {
            // Initialize the SubmodelElement Data
            initializeSubmodelElementData() {
                if (!this.submodelElementData) return;

                // console.log('SubmodelElementData: ', this.submodelElementData)
                if (Object.keys(this.submodelElementData).length === 0) {
                    this.localSubmodelElementData = []; // Reset the SubmodelElement Data when no Node is selected
                    return;
                }
                let submodelElementData = [...this.submodelElementData];
                // console.log('SubmodelElementData: ', submodelElementData);
                this.localSubmodelElementData = submodelElementData;
            },

            togglPanel(index: number): void {
                const panelIndex = this.expandedPanels.indexOf(index);
                if (panelIndex === -1) {
                    // If the panel is not expanded, add it to the expandedPanels array
                    this.expandedPanels.push(index);
                } else {
                    // If the panel is already expanded, remove it from the expandedPanels array
                    this.expandedPanels.splice(panelIndex, 1);
                }
            },

            // Expand all panels
            expandAllPanels(): void {
                const expandRecursive = (elements: any[], indices: number[] = []): number[] => {
                    elements.forEach((element, index) => {
                        indices.push(index); // Add the current index to the expanded panels
                        if (Array.isArray(element.value) && element.value.length > 0) {
                            // Recursively expand subelements
                            expandRecursive(element.value, indices);
                        }
                    });
                    return indices;
                };

                this.expandedPanels = expandRecursive(this.localSubmodelElementData);
            },

            // Collapse all panels
            collapseAllPanels(): void {
                this.expandedPanels = [];
            },
        },
    });
</script>
