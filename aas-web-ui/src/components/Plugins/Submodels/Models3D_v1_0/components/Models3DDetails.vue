<template>
  <div>
    <v-sheet
      v-for="(section, index) in sections"
      :key="section.key"
      border
      class="pa-3"
      :class="{ 'mt-4': index > 0 }"
      rounded
    >
      <div class="d-flex align-center mb-3">
        <v-icon class="mr-2" color="primary" size="small">{{ section.icon }}</v-icon>
        <div class="text-title-small">{{ section.title }}</div>
      </div>

      <Models3DFieldGrid v-if="section.fields.length > 0" :fields="section.fields" />

      <template v-for="group in section.chipGroups" :key="group.label">
        <div v-if="group.items.length > 0" class="mt-3">
          <div class="mb-1 text-body-small text-subtitleText">{{ group.label }}</div>

          <div class="d-flex flex-wrap ga-1">
            <v-chip
              v-for="item in group.items"
              :key="item"
              :border="!group.color"
              :color="group.color"
              label
              size="x-small"
              :variant="group.color ? 'tonal' : 'flat'"
            >
              {{ item }}
            </v-chip>
          </div>
        </div>
      </template>
    </v-sheet>
  </div>
</template>

<script lang="ts" setup>
  import type { Model3DEntry, Model3DVersion } from '../types'
  import { buildDetailSections } from '../utils/detailSections'

  // Props
  const props = defineProps<{
    model: Model3DEntry
    version: Model3DVersion | undefined
  }>()

  // Computed properties
  const sections = computed(() => buildDetailSections(props.model, props.version))
</script>
