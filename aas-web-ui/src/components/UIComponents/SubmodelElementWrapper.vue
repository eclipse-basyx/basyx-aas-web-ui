<template>
    <v-container fluid class="pa-0">
        <v-card :variant="cardStyle ? cardStyle : 'elevated'">
            <v-list nav class="pt-0">
                <MultiLanguageProperty
                    v-if="SubmodelElementObject.modelType == 'MultiLanguageProperty'"
                    :multi-language-property-object="SubmodelElementObject"></MultiLanguageProperty>
                <Property
                    v-if="SubmodelElementObject.modelType == 'Property'"
                    :property-object="SubmodelElementObject"
                    @update-value="updatePropertyValue"></Property>
                <File v-if="SubmodelElementObject.modelType == 'File'" :file-object="SubmodelElementObject"></File>
                <Blob v-if="SubmodelElementObject.modelType == 'Blob'" :blob-object="SubmodelElementObject"></Blob>
                <Operation
                    v-if="SubmodelElementObject.modelType == 'Operation'"
                    :operation-object="SubmodelElementObject"></Operation>
                <ReferenceElement
                    v-if="SubmodelElementObject.modelType == 'ReferenceElement'"
                    :reference-element-object="SubmodelElementObject"></ReferenceElement>
                <Range v-if="SubmodelElementObject.modelType == 'Range'" :range-object="SubmodelElementObject"></Range>
                <RelationshipElement
                    v-if="SubmodelElementObject.modelType == 'RelationshipElement'"
                    :relationship-element-object="SubmodelElementObject"></RelationshipElement>
                <AnnotatedRelationshipElement
                    v-if="SubmodelElementObject.modelType == 'AnnotatedRelationshipElement'"
                    :annotated-relationship-element-object="SubmodelElementObject"></AnnotatedRelationshipElement>
            </v-list>
        </v-card>
    </v-container>
</template>

<script lang="ts">
    import { defineComponent } from 'vue';
    import AnnotatedRelationshipElement from '@/components/SubmodelElements/AnnotatedRelationshipElement.vue';
    import Blob from '@/components/SubmodelElements/Blob.vue';
    import File from '@/components/SubmodelElements/File.vue';
    import MultiLanguageProperty from '@/components/SubmodelElements/MultiLanguageProperty.vue';
    import Operation from '@/components/SubmodelElements/Operation.vue';
    import Property from '@/components/SubmodelElements/Property.vue';
    import Range from '@/components/SubmodelElements/Range.vue';
    import ReferenceElement from '@/components/SubmodelElements/ReferenceElement.vue';
    import RelationshipElement from '@/components/SubmodelElements/RelationshipElement.vue';

    export default defineComponent({
        name: 'SubmodelELementWrapper',
        components: {
            // SubmodelElements
            Property,
            MultiLanguageProperty,
            File,
            Blob,
            Operation,
            ReferenceElement,
            Range,
            RelationshipElement,
            AnnotatedRelationshipElement,
        },
        props: ['SubmodelElementObject', 'cardStyle'],

        methods: {
            // Function to update the value of a property
            updatePropertyValue(submodelElement: any) {
                this.$emit('updateValue', submodelElement);
            },
        },
    });
</script>
