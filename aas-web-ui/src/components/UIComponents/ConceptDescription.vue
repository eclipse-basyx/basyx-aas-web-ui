<template>
    <v-container fluid class="pa-0">
        <v-card v-if="conceptDescriptionObject && Object.keys(conceptDescriptionObject).length > 0">
            <v-list nav>
                <!-- ConceptDescription Identification -->
                <IdentificationElement :identification-object="conceptDescriptionObject"></IdentificationElement>
                <!-- ConceptDescription further information as expandable panels -->
                <v-expansion-panels v-model="openPanels" multiple class="mb-n2">
                    <!-- ConceptDescription DisplayName -->
                    <template v-if="hasDisplayName">
                        <v-divider />
                        <DisplayNameElement :display-name-array="conceptDescriptionObject.displayName" />
                    </template>
                    <!-- AAS Description -->
                    <template v-if="hasDescription">
                        <v-divider />
                        <DescriptionElement :description-array="conceptDescriptionObject.description" />
                    </template>
                </v-expansion-panels>
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
                        <SemanticIdElement
                            v-if="
                                embeddedDataSpecification.dataSpecification &&
                                embeddedDataSpecification.dataSpecification.keys &&
                                embeddedDataSpecification.dataSpecification.keys.length > 0
                            "
                            :semantic-id-object="embeddedDataSpecification.dataSpecification"
                            :semantic-title="'Data Specification'"
                            :small="false"
                            class="mb-2" />
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
    import { computed, ref, watch } from 'vue';

    const props = defineProps({
        conceptDescriptionObject: {
            type: Object as any,
            default: {} as any,
        },
        small: {
            type: Boolean,
            default: false,
        },
    });

    //
    const openPanels = ref<number[]>([]);

    // Computed properties
    const hasDisplayName = computed(() =>
        props.conceptDescriptionObject.displayName &&
        Array.isArray(props.conceptDescriptionObject.displayName) &&
        props.conceptDescriptionObject.displayName.length > 0
            ? true
            : false
    );
    const hasDescription = computed(() =>
        props.conceptDescriptionObject.description &&
        Array.isArray(props.conceptDescriptionObject.description) &&
        props.conceptDescriptionObject.description.length > 0
            ? true
            : false
    );
    const openPanelNumber = computed(() => (hasDescription.value ? 0 + (hasDisplayName.value ? 1 : 0) : null));

    watch(
        () => props.conceptDescriptionObject,
        () => {
            openPanels.value = openPanelNumber.value === null ? [] : [openPanelNumber.value];
        },
        { deep: true }
    );
</script>

<style lang="css" scoped>
    .v-expansion-panel-text :deep(.v-expansion-panel-text__wrapper) {
        padding-left: 0px !important;
        padding-right: 0px !important;
        padding-top: 0px !important;
        padding-bottom: 0px !important;
    }
</style>
