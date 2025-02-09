<template>
    <v-container fluid class="pa-0">
        <v-card v-if="conceptDescriptionObject && Object.keys(conceptDescriptionObject).length > 0">
            <v-list nav>
                <!-- ConceptDescription Identification -->
                <IdentificationElement :identification-object="conceptDescriptionObject"></IdentificationElement>
                <v-divider
                    v-if="conceptDescriptionObject.displayName && conceptDescriptionObject.displayName.length > 0"
                    class="mt-2"></v-divider>
                <!-- ConceptDescription DisplayName -->
                <DisplayNameElement
                    v-if="conceptDescriptionObject.displayName && conceptDescriptionObject.displayName.length > 0"
                    :display-name-array="conceptDescriptionObject.displayName"
                    :display-name-title="'Display Name'"
                    :small="false"></DisplayNameElement>
                <v-divider
                    v-if="conceptDescriptionObject.description && conceptDescriptionObject.description.length > 0"
                    class="mt-2"></v-divider>
                <!-- ConceptDescription Description -->
                <DescriptionElement
                    v-if="conceptDescriptionObject.description && conceptDescriptionObject.description.length > 0"
                    :description-array="conceptDescriptionObject.description"
                    :description-title="'Description'"
                    :small="false"></DescriptionElement>
            </v-list>
            <v-divider
                v-if="
                    conceptDescriptionObject.embeddedDataSpecifications &&
                    conceptDescriptionObject.embeddedDataSpecifications.length > 0
                "></v-divider>
            <v-list
                v-if="
                    conceptDescriptionObject.embeddedDataSpecifications &&
                    conceptDescriptionObject.embeddedDataSpecifications.length > 0
                "
                nav
                class="px-4 pt-2 pb-4">
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
                        <v-divider v-if="embeddedDataSpecification.dataSpecificationContent" class="mt-2"></v-divider>
                        <!-- dataSpecificationContent -->
                        <DataSpecificationContent
                            v-if="embeddedDataSpecification.dataSpecificationContent"
                            :data-specification-object="
                                embeddedDataSpecification.dataSpecificationContent
                            "></DataSpecificationContent>
                    </v-list>
                </v-card>
            </v-list>
            <!-- Last Sync -->
            <v-divider></v-divider>
            <LastSync :timestamp="conceptDescriptionObject.timestamp"></LastSync>
        </v-card>
    </v-container>
</template>

<script lang="ts" setup>
    defineProps({
        small: {
            type: Boolean,
            default: false,
        },
        conceptDescriptionObject: {
            type: Object as any,
            default: {} as any,
        },
    });
</script>
