<template>
    <v-container fluid class="pa-0">
        <v-list nav class="pt-0 px-0">
            <!-- ConceptDescription Identification -->
            <IdentificationElement
                :identification-object="conceptDescriptionObject"
                :model-type="conceptDescriptionObject.modelType"
                :id-type="'Identification (ID)'"
                :name-type="'idShort'"
                :path="conceptDescriptionObject.path"></IdentificationElement>
            <v-divider
                v-if="conceptDescriptionObject.displayName && conceptDescriptionObject.displayName.length > 0"
                class="mt-2"></v-divider>
            <!-- ConceptDescription DisplayName -->
            <DisplayNameElement
                v-if="conceptDescriptionObject.displayName && conceptDescriptionObject.displayName.length > 0"
                :display-name-object="conceptDescriptionObject.displayName"
                :display-name-title="'DisplayName'"
                :small="false"></DisplayNameElement>
            <v-divider
                v-if="conceptDescriptionObject.description && conceptDescriptionObject.description.length > 0"
                class="mt-2"></v-divider>
            <!-- ConceptDescription Description -->
            <DescriptionElement
                v-if="conceptDescriptionObject.description && conceptDescriptionObject.description.length > 0"
                :description-object="conceptDescriptionObject.description"
                :description-title="'Description'"
                :small="false"></DescriptionElement>
            <v-divider
                v-if="
                    conceptDescriptionObject.embeddedDataSpecifications &&
                    conceptDescriptionObject.embeddedDataSpecifications > 0
                "
                class="mt-2"></v-divider>
        </v-list>
        <v-divider
            v-if="
                conceptDescriptionObject.embeddedDataSpecifications &&
                conceptDescriptionObject.embeddedDataSpecifications.length > 0
            "
            class="mt-2"></v-divider>
        <v-list
            v-if="
                conceptDescriptionObject.embeddedDataSpecifications &&
                conceptDescriptionObject.embeddedDataSpecifications.length > 0
            "
            nav>
            <v-card
                v-for="(embeddedDataSpecification, i) in conceptDescriptionObject.embeddedDataSpecifications"
                :key="i"
                color="elevatedCard"
                class="mt-2">
                <v-list nav class="bg-elevatedCard pt-0">
                    <!-- hasDataSpecification -->
                    <SemanticID
                        v-if="
                            embeddedDataSpecification.dataSpecification &&
                            embeddedDataSpecification.dataSpecification.keys &&
                            embeddedDataSpecification.dataSpecification.keys.length > 0
                        "
                        :semantic-id-object="embeddedDataSpecification.dataSpecification"
                        :semantic-title="'Data Specification'"
                        :small="false"
                        class="mb-2"></SemanticID>
                    <v-divider v-if="embeddedDataSpecification.dataSpecificationContent"></v-divider>
                    <!-- dataSpecificationContent -->
                    <DataSpecificationContent
                        v-if="embeddedDataSpecification.dataSpecificationContent"
                        :data-specification-object="
                            embeddedDataSpecification.dataSpecificationContent
                        "></DataSpecificationContent>
                </v-list>
            </v-card>
        </v-list>
    </v-container>
</template>

<script lang="ts">
    import { defineComponent } from 'vue';
    import DataSpecificationContent from './DataSpecificationContent.vue';
    import DescriptionElement from './DescriptionElement.vue';
    import DisplayNameElement from './DisplayNameElement.vue';
    import IdentificationElement from './IdentificationElement.vue';
    import SemanticID from './SemanticID.vue';

    export default defineComponent({
        name: 'ConceptDescription',
        components: {
            IdentificationElement,
            DisplayNameElement,
            DescriptionElement,
            SemanticID,
            DataSpecificationContent,
        },
        props: ['conceptDescriptionObject', 'small'],
    });
</script>
