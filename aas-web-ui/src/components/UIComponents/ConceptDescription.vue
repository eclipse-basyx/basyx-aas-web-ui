<template>
    <v-container fluid class="pa-0">
        <v-card v-if="conceptDescriptionObject && Object.keys(conceptDescriptionObject).length > 0">
            <v-list nav>
                <!-- ConceptDescription Identification -->
                <IdentificationElement :identification-object="conceptDescriptionObject"></IdentificationElement>
                <v-divider
                    v-if="
                        conceptDescriptionObject.displayName &&
                        Array.isArray(conceptDescriptionObject.displayName) &&
                        conceptDescriptionObject.displayName.length > 0
                    "
                    class="mt-2" />
                <!-- ConceptDescription DisplayName -->
                <DisplayNameElement
                    :display-name-array="conceptDescriptionObject.displayName"
                    :display-name-title="'Display Name'" />
                <v-divider
                    v-if="
                        conceptDescriptionObject.description &&
                        Array.isArray(conceptDescriptionObject.description) &&
                        conceptDescriptionObject.description.length > 0
                    "
                    class="mt-2" />
                <!-- ConceptDescription Description -->
                <DescriptionElement
                    :description-array="conceptDescriptionObject.description"
                    :description-title="'Description'" />
            </v-list>
            <v-divider
                v-if="
                    conceptDescriptionObject.embeddedDataSpecifications &&
                    conceptDescriptionObject.embeddedDataSpecifications.length > 0
                " />
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
                            :semantic-id-object="embeddedDataSpecification.dataSpecification"
                            :semantic-title="'Data Specification'"
                            background-color="elevatedCard" />
                        <v-divider v-if="embeddedDataSpecification.dataSpecificationContent" class="mt-2" />
                        <!-- dataSpecificationContent -->
                        <DataSpecificationContent
                            v-if="embeddedDataSpecification.dataSpecificationContent"
                            :data-specification-object="embeddedDataSpecification.dataSpecificationContent"
                            background-color="elevatedCard"></DataSpecificationContent>
                    </v-list>
                </v-card>
            </v-list>
            <!-- Last Sync -->
            <v-divider />
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
