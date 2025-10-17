<template>
    <v-container fluid class="pa-0">
        <v-card :variant="cardStyle ? cardStyle : 'elevated'">
            <v-list nav class="pt-0">
                <MultiLanguageProperty
                    v-if="submodelElementObject.modelType == 'MultiLanguageProperty'"
                    :multi-language-property-object="submodelElementObject"
                    :is-editable="isEditable"></MultiLanguageProperty>
                <Property
                    v-if="submodelElementObject.modelType == 'Property'"
                    :property-object="submodelElementObject"
                    :is-editable="isEditable"
                    @update-value="updatePropertyValue"></Property>
                <File
                    v-if="submodelElementObject.modelType == 'File'"
                    :file-object="submodelElementObject"
                    :is-editable="isEditable"></File>
                <Blob v-if="submodelElementObject.modelType == 'Blob'" :blob-object="submodelElementObject"></Blob>
                <Operation
                    v-if="submodelElementObject.modelType == 'Operation'"
                    :operation-object="submodelElementObject"
                    :is-editable="isEditable"></Operation>
                <ReferenceElement
                    v-if="submodelElementObject.modelType == 'ReferenceElement'"
                    :reference-element-object="submodelElementObject"
                    :is-editable="isEditable"></ReferenceElement>
                <Range v-if="submodelElementObject.modelType == 'Range'" :range-object="submodelElementObject"></Range>
                <RelationshipElement
                    v-if="submodelElementObject.modelType == 'RelationshipElement'"
                    :relationship-element-object="submodelElementObject"></RelationshipElement>
                <AnnotatedRelationshipElement
                    v-if="submodelElementObject.modelType == 'AnnotatedRelationshipElement'"
                    :annotated-relationship-element-object="submodelElementObject"
                    :is-editable="isEditable"></AnnotatedRelationshipElement>
            </v-list>
        </v-card>
    </v-container>
</template>

<script lang="ts" setup>
    type Variant = 'elevated' | 'outlined' | 'flat' | 'text' | 'tonal' | 'plain' | undefined;

    defineProps({
        submodelElementObject: {
            type: Object as any,
            default: {} as any,
        },
        cardStyle: {
            type: String as () => Variant,
            default: 'elevated',
        },
        isEditable: {
            type: Boolean,
            default: true,
        },
    });

    const emit = defineEmits<{
        (e: 'updateValue', submodelElement: any): void;
    }>();

    function updatePropertyValue(submodelElement: any): void {
        emit('updateValue', submodelElement);
    }
</script>
