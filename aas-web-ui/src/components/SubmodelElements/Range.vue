<template>
    <v-container fluid class="pa-0">
        <v-list-item class="px-1 pb-1 pt-0">
            <v-list-item-title class="text-subtitle-2 mt-2">{{ 'Range: ' }}</v-list-item-title>
        </v-list-item>
        <v-card v-if="rangeObject" color="elevatedCard" class="pt-10 pb-5 px-3">
            <v-range-slider
                v-model="range"
                :min="min"
                :max="max"
                hide-details
                class="align-center"
                readonly
                color="primary"
                thumb-label="always">
                <!-- <template v-slot:prepend>
                    <v-text-field v-model="range[0]" hide-details single-line variant="outlined" density="compact" style="width: 90px" readonly></v-text-field>
                </template>
                <template v-slot:append>
                    <v-text-field v-model="range[1]" hide-details single-line variant="outlined" style="width: 90px" density="compact" readonly></v-text-field>
                </template> -->
                <template #thumb-label="{ modelValue }">
                    <span style="white-space: nowrap">{{ modelValue + ' ' + unitSuffix(rangeObject) }}</span>
                </template>
            </v-range-slider>
        </v-card>
    </v-container>
</template>

// TODO Transfer to composition API
<script lang="ts">
    import { defineComponent } from 'vue';
    import { useConceptDescriptionHandling } from '@/composables/ConceptDescriptionHandling';
    import RequestHandling from '@/mixins/RequestHandling';
    import SubmodelElementHandling from '@/mixins/SubmodelElementHandling';
    import { useAASStore } from '@/store/AASDataStore';

    export default defineComponent({
        name: 'Range',
        mixins: [RequestHandling, SubmodelElementHandling],
        props: {
            rangeObject: {
                type: Object,
                default: () => ({}),
            },
        },

        setup() {
            const aasStore = useAASStore();
            const { unitSuffix } = useConceptDescriptionHandling();

            return {
                aasStore, // AASStore Object
                unitSuffix,
            };
        },

        computed: {
            // get selected AAS from Store
            SelectedAAS() {
                return this.aasStore.getSelectedAAS;
            },

            // returns the range as array [min, max]
            range() {
                if (this.rangeObject) {
                    return [parseInt(this.rangeObject.min), parseInt(this.rangeObject.max)];
                }
                return [0, 0];
            },

            // return the min value - 10% of the range
            min() {
                if (this.rangeObject) {
                    return (
                        parseInt(this.rangeObject.min) -
                        (parseInt(this.rangeObject.max) - parseInt(this.rangeObject.min)) * 0.1
                    );
                }
                return 0;
            },

            // return the max value + 10% of the range
            max() {
                if (this.rangeObject) {
                    return (
                        parseInt(this.rangeObject.max) +
                        (parseInt(this.rangeObject.max) - parseInt(this.rangeObject.min)) * 0.1
                    );
                }
                return 0;
            },
        },
    });
</script>
