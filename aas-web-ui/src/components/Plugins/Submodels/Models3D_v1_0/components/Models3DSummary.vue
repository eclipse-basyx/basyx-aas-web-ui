<template>
  <div class="d-flex flex-column ga-4">
    <div v-if="lod">
      <div class="d-flex align-center mb-1 text-body-small text-subtitleText">
        <v-icon class="mr-2" size="16">mdi-layers-triple-outline</v-icon>
        Level of detail
      </div>

      <div class="text-body-medium">{{ lod }}</div>

      <div v-if="model.simplification?.reducedElements.length" class="d-flex flex-wrap align-center ga-1 mt-2">
        <span class="text-body-small text-subtitleText">Reduced:</span>

        <v-chip
          v-for="element in model.simplification.reducedElements"
          :key="element"
          border
          label
          size="x-small"
        >
          {{ element }}
        </v-chip>
      </div>
    </div>

    <div v-if="model.positivePurposes.length > 0 || model.negativePurposes.length > 0">
      <div class="d-flex align-center mb-1 text-body-small text-subtitleText">
        <v-icon class="mr-2" size="16">mdi-bullseye-arrow</v-icon>
        Intended use
      </div>

      <div class="d-flex flex-wrap ga-1">
        <v-chip
          v-for="purpose in model.positivePurposes"
          :key="'pos-' + purpose"
          color="success"
          label
          prepend-icon="mdi-check"
          size="x-small"
          variant="tonal"
        >
          {{ purpose }}
        </v-chip>

        <v-chip
          v-for="purpose in model.negativePurposes"
          :key="'neg-' + purpose"
          color="error"
          label
          prepend-icon="mdi-close"
          size="x-small"
          variant="tonal"
        >
          {{ purpose }}
        </v-chip>
      </div>
    </div>

    <Models3DDefinitionList v-if="facts.length > 0" :rows="facts" />
  </div>
</template>

<script lang="ts" setup>
  import type { Model3DEntry } from '../types'
  import { levelOfDetail, modelFacts } from '../utils/presentation'

  // Props
  const props = defineProps<{ model: Model3DEntry }>()

  // Computed properties
  const lod = computed(() => levelOfDetail(props.model))
  const facts = computed(() => modelFacts(props.model))
</script>
