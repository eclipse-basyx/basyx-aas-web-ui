<template>
    <v-container fluid class="pa-0">
        <v-card :variant="cardStyle ? cardStyle : 'elevated'">
            <v-list nav class="pt-0">
                <MultiLanguageProperty
                    v-if="SubmodelElementObject.modelType == 'MultiLanguageProperty'"
                    :multiLanguagePropertyObject="SubmodelElementObject"></MultiLanguageProperty>
                <Property
                    v-if="SubmodelElementObject.modelType == 'Property'"
                    :propertyObject="SubmodelElementObject"
                    @updateValue="updatePropertyValue"></Property>
                <File v-if="SubmodelElementObject.modelType == 'File'" :fileObject="SubmodelElementObject"></File>
                <Blob v-if="SubmodelElementObject.modelType == 'Blob'" :blobObject="SubmodelElementObject"></Blob>
                <Operation
                    v-if="SubmodelElementObject.modelType == 'Operation'"
                    :operationObject="SubmodelElementObject"></Operation>
                <ReferenceElement
                    v-if="SubmodelElementObject.modelType == 'ReferenceElement'"
                    :referenceElementObject="SubmodelElementObject"></ReferenceElement>
                <Range v-if="SubmodelElementObject.modelType == 'Range'" :rangeObject="SubmodelElementObject"></Range>
                <RelationshipElement
                    v-if="SubmodelElementObject.modelType == 'RelationshipElement'"
                    :relationshipElementObject="SubmodelElementObject"></RelationshipElement>
                <AnnotatedRelationshipElement
                    v-if="SubmodelElementObject.modelType == 'AnnotatedRelationshipElement'"
                    :annotatedRelationshipElementObject="SubmodelElementObject"></AnnotatedRelationshipElement>
            </v-list>
        </v-card>
    </v-container>
</template>

<script lang="ts">
    import { defineComponent } from 'vue';

    import Property from '@/components/SubmodelElements/Property.vue';
    import MultiLanguageProperty from '@/components/SubmodelElements/MultiLanguageProperty.vue';
    import File from '@/components/SubmodelElements/File.vue';
    import Blob from '@/components/SubmodelElements/Blob.vue';
    import Operation from '@/components/SubmodelElements/Operation.vue';
    import ReferenceElement from '@/components/SubmodelElements/ReferenceElement.vue';
    import Range from '@/components/SubmodelElements/Range.vue';
    import RelationshipElement from '@/components/SubmodelElements/RelationshipElement.vue';
    import AnnotatedRelationshipElement from '@/components/SubmodelElements/AnnotatedRelationshipElement.vue';

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
