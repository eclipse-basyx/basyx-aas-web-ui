<template>
    <v-container fluid class="pa-0">
        <v-card v-if="conceptDescriptionObject && Object.keys(conceptDescriptionObject).length > 0">
            <v-list nav>
                <!-- ConceptDescription Identification -->
                <IdentificationElement :identification-object="conceptDescriptionObject" />
                <!-- ConceptDescription DisplayName -->
                <template
                    v-if="
                        conceptDescriptionObject.displayName &&
                        Array.isArray(conceptDescriptionObject.displayName) &&
                        conceptDescriptionObject.displayName.length > 0
                    ">
                    <v-divider class="mt-2" />
                    <DisplayNameElement :display-names="conceptDescriptionObject.displayName" />
                </template>
                <!-- ConceptDescription Description -->
                <template
                    v-if="
                        conceptDescriptionObject.description &&
                        Array.isArray(conceptDescriptionObject.description) &&
                        conceptDescriptionObject.description.length > 0
                    ">
                    <v-divider class="mt-2"></v-divider>
                    <DescriptionElement :descriptions="conceptDescriptionObject.description" />
                </template>
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
                        <template
                            v-if="
                                embeddedDataSpecification.dataSpecification &&
                                embeddedDataSpecification.dataSpecification.keys &&
                                Array.isArray(embeddedDataSpecification.dataSpecification.keys) &&
                                embeddedDataSpecification.dataSpecification.keys.length > 0
                            ">
                            <SemanticIdElement
                                :semantic-id-object="embeddedDataSpecification.dataSpecification"
                                :semantic-title="'Data Specification'"
                                class="mb-2" />
                        </template>
                        <template
                            v-if="
                                embeddedDataSpecification.dataSpecificationContent &&
                                Object.keys(embeddedDataSpecification.dataSpecificationContent).length > 0
                            ">
                            <v-divider class="mt-2" />
                            <!-- dataSpecificationContent -->
                            <DataSpecificationContent
                                :data-specification-object="embeddedDataSpecification.dataSpecificationContent" />
                        </template>
                    </v-list>
                </v-card>
            </v-list>
            <!-- Last Sync -->
            <v-divider></v-divider>
            <LastSyncElement :timestamp="conceptDescriptionObject.timestamp" />
        </v-card>
    </v-container>
</template>

<script lang="ts" setup>
    // Properties
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
