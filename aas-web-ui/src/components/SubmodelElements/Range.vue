<template>
    <v-container fluid class="pa-0">
        <v-list-item class="px-1 pb-1 pt-0">
            <v-list-item-title class="text-subtitle-2 mt-2">{{ 'Range: ' }}</v-list-item-title>
        </v-list-item>
        <v-card color="elevatedCard" v-if="rangeObject" class="pt-10 pb-5 px-3">
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
                <template v-slot:thumb-label="{ modelValue }">
                    {{ modelValue + unitSuffix(rangeObject) }}
                </template>
            </v-range-slider>
        </v-card>
    </v-container>
</template>

<script lang="ts">
    import { defineComponent } from 'vue';
    import { useAASStore } from '@/store/AASDataStore';
    import RequestHandling from '@/mixins/RequestHandling';
    import SubmodelElementHandling from '@/mixins/SubmodelElementHandling';

    export default defineComponent({
        name: 'Range',
        components: {
            RequestHandling, // Mixin to handle the requests to the AAS
            SubmodelElementHandling, // Mixin to handle the SubmodelElements
        },
        mixins: [RequestHandling, SubmodelElementHandling],
        props: ['rangeObject'],

        setup() {
            const aasStore = useAASStore();

            return {
                aasStore, // AASStore Object
            };
        },

        data() {
            return {};
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
