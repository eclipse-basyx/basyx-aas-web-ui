<template>
  <v-list class="pa-0 bg-transparent">
    <v-list-item
      v-for="(model, index) in models"
      :key="model.key"
      :active="model.key === selectedKey"
      border
      class="mb-2 pa-2"
      color="primary"
      rounded
      variant="tonal"
      @click="emit('select', model.key)"
    >
      <template #prepend>
        <v-sheet
          border
          class="mr-3 overflow-hidden"
          height="56"
          rounded
          width="56"
        >
          <Models3DPreviewImage :file="displayVersion(model)?.previewFile ?? null" />
        </v-sheet>
      </template>

      <v-list-item-title class="text-body-medium font-weight-medium">
        {{ versionTitle(displayVersion(model), model, index) }}
      </v-list-item-title>

      <div class="d-flex flex-wrap align-center ga-1 mt-1">
        <v-chip v-if="formatLabel(displayVersion(model))" border label size="x-small">
          {{ formatLabel(displayVersion(model)) }}
        </v-chip>

        <v-chip v-if="displayVersion(model)?.status" border label size="x-small">
          {{ displayVersion(model)?.status }}
        </v-chip>

        <v-chip v-if="model.isPrimary" color="primary" label size="x-small">Primary</v-chip>
      </div>

      <div v-if="levelOfDetail(model)" class="mt-1 text-body-small text-subtitleText text-truncate">
        {{ levelOfDetail(model) }}
      </div>
    </v-list-item>
  </v-list>
</template>

<script lang="ts" setup>
  import type { Model3DEntry, Model3DVersion } from '../types'
  import { formatLabel, levelOfDetail } from '../utils/detailSections'
  import { latestVersion, versionTitle } from '../utils/parseModel3D'

  // Props
  defineProps<{
    models: Model3DEntry[]
    selectedKey: string
  }>()

  // Emits
  const emit = defineEmits<{ (e: 'select', key: string): void }>()

  // Methods
  function displayVersion (model: Model3DEntry): Model3DVersion | undefined {
    return latestVersion(model.versions)
  }
</script>
