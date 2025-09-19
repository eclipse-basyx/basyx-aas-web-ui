<template>
    <v-container fluid class="pa-0">
        <v-expansion-panels multiple class="mt-3">
            <v-expansion-panel v-for="(submodelElement, index) in localSubmodelElementData" :key="submodelElement.id">
                <v-expansion-panel-title color="elevatedCard">
                    <span v-if="submodelElement.idShort">{{ nameToDisplay(submodelElement) }}</span>
                    <span v-else>{{ 'Element ' + (index + 1) }}</span>
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                    <DescriptionElement
                        v-if="submodelElement.description && submodelElement.description.length > 0"
                        :description-array="submodelElement.description"
                        :description-title="'Description'"
                        :small="false"></DescriptionElement>
                    <GenericDataVisu
                        v-if="
                            Array.isArray(submodelElement.value) &&
                            submodelElement.value.length > 0 &&
                            submodelElement.modelType !== 'MultiLanguageProperty'
                        "
                        :submodel-element-data="submodelElement.value"></GenericDataVisu>
                    <v-list v-else nav class="px-4 pt-0 pb-0">
                        <!-- SubmodelELement Representation for different modelTypes -->
                        <Property
                            v-if="submodelElement.modelType === 'Property'"
                            :property-object="submodelElement"
                            :is-editable="false"></Property>
                        <MultiLanguageProperty
                            v-else-if="submodelElement.modelType === 'MultiLanguageProperty'"
                            :multi-language-property-object="submodelElement"
                            :is-editable="false"></MultiLanguageProperty>
                        <Operation
                            v-else-if="submodelElement.modelType === 'Operation'"
                            :operation-object="submodelElement"
                            :is-editable="false"></Operation>
                        <File
                            v-else-if="submodelElement.modelType === 'File'"
                            :file-object="submodelElement"
                            :is-editable="false"></File>
                        <Blob
                            v-else-if="submodelElement.modelType === 'Blob'"
                            :blob-object="submodelElement"
                            :is-editable="false"></Blob>
                        <ReferenceElement
                            v-else-if="submodelElement.modelType === 'ReferenceElement'"
                            :reference-element-object="submodelElement"
                            :is-editable="false"></ReferenceElement>
                        <Range
                            v-else-if="submodelElement.modelType === 'Range'"
                            :range-object="submodelElement"></Range>
                        <Entity
                            v-else-if="submodelElement.modelType === 'Entity'"
                            :entity-object="submodelElement"></Entity>
                        <RelationshipElement
                            v-else-if="submodelElement.modelType === 'RelationshipElement'"
                            :relationship-element-object="submodelElement"></RelationshipElement>
                        <AnnotatedRelationshipElement
                            v-else-if="submodelElement.modelType === 'AnnotatedRelationshipElement'"
                            :annotated-relationship-element-object="submodelElement"
                            :is-editable="false"></AnnotatedRelationshipElement>
                        <InvalidElement v-else :invalid-element-object="submodelElement"></InvalidElement>
                    </v-list>
                </v-expansion-panel-text>
            </v-expansion-panel>
        </v-expansion-panels>
    </v-container>
</template>

<script lang="ts" setup>
    import { onMounted, ref, watch } from 'vue';
    import { useReferableUtils } from '@/composables/AAS/ReferableUtils';

    const props = defineProps({
        submodelElementData: {
            type: Object as any,
            default: {} as any,
        },
    });

    const { nameToDisplay } = useReferableUtils();

    const localSubmodelElementData = ref<Array<any>>([]);

    watch(
        () => props.submodelElementData,
        () => {
            initializeSubmodelElementData();
        },
        { deep: true }
    );

    onMounted(() => {
        initializeSubmodelElementData();
    });

    function initializeSubmodelElementData(): void {
        if (!props.submodelElementData) return;

        if (Object.keys(props.submodelElementData).length === 0) {
            localSubmodelElementData.value = [];
            return;
        }
        let submodelElementData = [...props.submodelElementData];
        localSubmodelElementData.value = submodelElementData;
    }
</script>
