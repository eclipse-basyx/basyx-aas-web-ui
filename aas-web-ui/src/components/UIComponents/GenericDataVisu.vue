<template>
    <v-container fluid class="pa-0">
        <v-expansion-panels multiple class="mt-3">
            <v-expansion-panel v-for="(submodelElement, index) in localSubmodelElementData" :key="submodelElement.id">
                <v-expansion-panel-title color="elevatedCard">
                    <span v-if="submodelElement.idShort">{{ nameToDisplay(submodelElement) }}</span>
                    <span v-else>{{ 'Element ' + (index + 1) }}</span>
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                    <GenericDataVisu
                        v-if="Array.isArray(submodelElement.value) && submodelElement.value.length > 0"
                        :submodelElementData="submodelElement.value"></GenericDataVisu>
                    <v-list v-else nav class="px-4 pt-0 pb-0">
                        <!-- SubmodelELement Representation for different modelTypes -->
                        <Property
                            v-if="submodelElement.modelType === 'Property'"
                            :propertyObject="submodelElement"></Property>
                        <MultyLanguageProperty
                            v-else-if="submodelElement.modelType === 'MultiLanguageProperty'"
                            :multiLanguagePropertyObject="submodelElement"></MultyLanguageProperty>
                        <Operation
                            v-else-if="submodelElement.modelType === 'Operation'"
                            :operationObject="submodelElement"></Operation>
                        <File v-else-if="submodelElement.modelType === 'File'" :fileObject="submodelElement"></File>
                        <Blob v-else-if="submodelElement.modelType === 'Blob'" :blobObject="submodelElement"></Blob>
                        <ReferenceElement
                            v-else-if="submodelElement.modelType === 'ReferenceElement'"
                            :referenceElementObject="submodelElement"></ReferenceElement>
                        <Range v-else-if="submodelElement.modelType === 'Range'" :rangeObject="submodelElement"></Range>
                        <Entity
                            v-else-if="submodelElement.modelType === 'Entity'"
                            :entityObject="submodelElement"></Entity>
                        <RelationshipElement
                            v-else-if="submodelElement.modelType === 'RelationshipElement'"
                            :relationshipElementObject="submodelElement"></RelationshipElement>
                        <AnnotatedRelationshipElement
                            v-else-if="submodelElement.modelType === 'AnnotatedRelationshipElement'"
                            :annotatedRelationshipElementObject="submodelElement"></AnnotatedRelationshipElement>
                        <InvalidElement v-else :invalidElementObject="submodelElement"></InvalidElement>
                    </v-list>
                </v-expansion-panel-text>
            </v-expansion-panel>
        </v-expansion-panels>
    </v-container>
</template>

<script lang="ts">
    import { defineComponent } from 'vue';
    import { useTheme } from 'vuetify';
    import { useAASStore } from '@/store/AASDataStore';
    import RequestHandling from '@/mixins/RequestHandling';
    import SubmodelElementHandling from '@/mixins/SubmodelElementHandling';

    import IdentificationElement from '@/components/UIComponents/IdentificationElement.vue';
    import DescriptionElement from '@/components/UIComponents/DescriptionElement.vue';

    import SubmodelElementList from '@/components/SubmodelElements/SubmodelElementList.vue';
    import Property from '@/components/SubmodelElements/Property.vue';
    import MultyLanguageProperty from '@/components/SubmodelElements/MultiLanguageProperty.vue';
    import Operation from '@/components/SubmodelElements/Operation.vue';
    import File from '@/components/SubmodelElements/File.vue';
    import Blob from '@/components/SubmodelElements/Blob.vue';
    import ReferenceElement from '@/components/SubmodelElements/ReferenceElement.vue';
    import Range from '@/components/SubmodelElements/Range.vue';
    import Entity from '@/components/SubmodelElements/Entity.vue';
    import RelationshipElement from '@/components/SubmodelElements/RelationshipElement.vue';
    import AnnotatedRelationshipElement from '@/components/SubmodelElements/AnnotatedRelationshipElement.vue';
    import InvalidElement from '@/components/SubmodelElements/InvalidElement.vue';

    export default defineComponent({
        name: 'GenericDataVisu',
        components: {
            RequestHandling, // Mixin to handle the requests to the AAS

            // UI Components
            IdentificationElement,
            DescriptionElement,

            // SubmodelElements
            SubmodelElementList,
            Property,
            MultyLanguageProperty,
            Operation,
            File,
            Blob,
            ReferenceElement,
            Range,
            Entity,
            RelationshipElement,
            AnnotatedRelationshipElement,
            InvalidElement,
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
                localSubmodelElementData: [] as Array<any>, // SubmodelElement Data
                // conceptDescriptions: {}, // Data of Concept Descriptions
            };
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
                if (Object.keys(this.submodelElementData).length == 0) {
                    this.localSubmodelElementData = []; // Reset the SubmodelElement Data when no Node is selected
                    return;
                }
                let submodelElementData = [...this.submodelElementData];
                // console.log('SubmodelElementData: ', submodelElementData);
                this.localSubmodelElementData = submodelElementData;
            },
        },
    });
</script>
