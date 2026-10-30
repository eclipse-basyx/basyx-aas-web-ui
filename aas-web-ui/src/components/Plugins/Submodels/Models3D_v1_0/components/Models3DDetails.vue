<template>
  <v-sheet v-if="groups.length > 0" border rounded>
    <v-btn
      block
      class="justify-start px-3"
      :prepend-icon="open ? 'mdi-chevron-down' : 'mdi-chevron-right'"
      size="large"
      variant="text"
      @click="open = !open"
    >
      <span class="text-title-small">Technical details</span>
    </v-btn>

    <v-expand-transition>
      <div v-show="open">
        <div v-for="group in groups" :key="group.key" class="px-3 pb-3">
          <v-divider class="mb-3" />

          <div class="d-flex align-center mb-2 text-body-small text-subtitleText">
            <v-icon class="mr-2" size="16">{{ group.icon }}</v-icon>
            {{ group.title }}
          </div>

          <Models3DDefinitionList :rows="group.rows" />
        </div>
      </div>
    </v-expand-transition>
  </v-sheet>
</template>

<script lang="ts" setup>
  import type { Model3DEntry, Model3DVersion } from '../types'
  import { technicalGroups } from '../utils/presentation'

  // Props
  const props = defineProps<{
    model: Model3DEntry
    version: Model3DVersion | undefined
  }>()

  // Reactive data
  const open = ref(false)

  // Computed properties
  const groups = computed(() => technicalGroups(props.model, props.version))
</script>
