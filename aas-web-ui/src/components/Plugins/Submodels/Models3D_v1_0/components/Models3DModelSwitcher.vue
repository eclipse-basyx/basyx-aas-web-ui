<template>
  <v-slide-group class="models3d-switcher" show-arrows>
    <v-slide-group-item v-for="(model, index) in models" :key="model.key">
      <v-sheet
        :aria-pressed="model.key === selectedKey"
        border
        class="d-flex align-center ga-3 pa-2 mr-2 cursor-pointer models3d-switcher__item"
        :class="{ 'border-primary border-opacity-100 border-md': model.key === selectedKey }"
        role="button"
        rounded
        tabindex="0"
        @click="emit('select', model.key)"
        @keydown.enter.prevent="emit('select', model.key)"
        @keydown.space.prevent="emit('select', model.key)"
      >
        <v-sheet
          border
          class="flex-shrink-0 overflow-hidden"
          height="44"
          rounded
          width="44"
        >
          <Models3DPreviewImage :file="displayVersion(model)?.previewFile ?? null" icon-size="22" />
        </v-sheet>

        <div class="flex-grow-1" style="min-width: 0">
          <div class="text-body-small font-weight-medium text-truncate">
            {{ versionTitle(displayVersion(model), model, index) }}
          </div>

          <div class="text-body-small text-subtitleText text-truncate">
            {{ [formatLabel(displayVersion(model)), model.objectType].filter(Boolean).join(' · ') }}
          </div>
        </div>

        <v-icon
          v-if="model.isPrimary && showPrimary"
          class="flex-shrink-0"
          color="primary"
          size="16"
          title="Primary model"
        >
          mdi-star
        </v-icon>
      </v-sheet>
    </v-slide-group-item>
  </v-slide-group>
</template>

<script lang="ts" setup>
  import type { Model3DEntry, Model3DVersion } from '../types'
  import { latestVersion, versionTitle } from '../utils/parseModel3D'
  import { formatLabel } from '../utils/presentation'

  // Props
  const props = defineProps<{
    models: Model3DEntry[]
    selectedKey: string
  }>()

  // Emits
  const emit = defineEmits<{ (e: 'select', key: string): void }>()

  // Computed properties
  /** The primary marker only tells something if not every model is primary */
  const showPrimary = computed(() => props.models.some(model => !model.isPrimary))

  // Methods
  function displayVersion (model: Model3DEntry): Model3DVersion | undefined {
    return latestVersion(model.versions)
  }
</script>

<style scoped>
  .models3d-switcher__item {
    width: 224px;
  }
</style>
