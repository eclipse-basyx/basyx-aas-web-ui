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
                <template #thumb-label="{ modelValue }">
                    <span style="white-space: nowrap">{{ modelValue + ' ' + unitSuffix(rangeObject) }}</span>
                </template>
            </v-range-slider>
        </v-card>
    </v-container>
</template>

<script lang="ts" setup>
    import { computed } from 'vue';
    import { useConceptDescriptionHandling } from '@/composables/AAS/ConceptDescriptionHandling';

    const props = defineProps({
        rangeObject: {
            type: Object,
            default: () => ({}),
        },
    });

    // Composables
    const { unitSuffix } = useConceptDescriptionHandling();

    // Returns the range as an Array [min, max]
    const range = computed(() => {
        if (props.rangeObject) {
            return [parseInt(props.rangeObject.min), parseInt(props.rangeObject.max)];
        }
        return [0, 0];
    });

    // Returns the min value - 10% of the range
    const min = computed(() => {
        if (props.rangeObject) {
            return (
                parseInt(props.rangeObject.min) -
                (parseInt(props.rangeObject.max) - parseInt(props.rangeObject.min)) * 0.1
            );
        }
        return 0;
    });

    // Returns the max value + 10% of the range
    const max = computed(() => {
        if (props.rangeObject) {
            return (
                parseInt(props.rangeObject.max) +
                (parseInt(props.rangeObject.max) - parseInt(props.rangeObject.min)) * 0.1
            );
        }
        return 0;
    });
</script>
