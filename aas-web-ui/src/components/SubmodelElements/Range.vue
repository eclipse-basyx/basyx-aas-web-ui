<template>
  <v-container class="pa-0" fluid>
    <v-list-item class="px-1 pb-1 pt-0">
      <v-list-item-title class="text-title-small mt-2">{{ 'Range: ' }}</v-list-item-title>
    </v-list-item>
    <v-card v-if="rangeObject" class="pt-10 pb-5 px-3" color="elevatedCard">
      <v-range-slider
        v-model="range"
        class="align-center"
        color="primary"
        hide-details
        :max="max"
        :min="min"
        readonly
        thumb-label="always"
      >
        <template #thumb-label="{ modelValue }">
          <span style="white-space: nowrap">{{ modelValue + ' ' + unitSuffix(rangeObject) }}</span>
        </template>
      </v-range-slider>
    </v-card>
  </v-container>
</template>

<script lang="ts" setup>
  import { computed } from 'vue'
  import { useConceptDescriptionHandling } from '@/composables/AAS/ConceptDescriptionHandling'

  const props = defineProps({
    rangeObject: {
      type: Object,
      default: () => ({}),
    },
  })

  // Composables
  const { unitSuffix } = useConceptDescriptionHandling()

  // Returns the range as an Array [min, max]
  const range = computed(() => {
    if (props.rangeObject) {
      return [Number.parseInt(props.rangeObject.min), Number.parseInt(props.rangeObject.max)]
    }
    return [0, 0]
  })

  // Returns the min value - 10% of the range
  const min = computed(() => {
    if (props.rangeObject) {
      return (
        Number.parseInt(props.rangeObject.min)
        - (Number.parseInt(props.rangeObject.max) - Number.parseInt(props.rangeObject.min)) * 0.1
      )
    }
    return 0
  })

  // Returns the max value + 10% of the range
  const max = computed(() => {
    if (props.rangeObject) {
      return (
        Number.parseInt(props.rangeObject.max)
        + (Number.parseInt(props.rangeObject.max) - Number.parseInt(props.rangeObject.min)) * 0.1
      )
    }
    return 0
  })
</script>
