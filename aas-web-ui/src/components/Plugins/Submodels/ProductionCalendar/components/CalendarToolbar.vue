<template>
  <div class="d-flex align-center flex-wrap ga-2">
    <v-btn-group density="comfortable" variant="outlined">
      <v-btn aria-label="Previous" icon="mdi-chevron-left" @click="emit('prev')" />
      <v-btn @click="emit('today')">Today</v-btn>
      <v-btn aria-label="Next" icon="mdi-chevron-right" @click="emit('next')" />
    </v-btn-group>

    <span class="text-title-medium">{{ title }}</span>

    <v-spacer />

    <v-btn-toggle
      v-model="viewMode"
      density="comfortable"
      divided
      mandatory
      variant="outlined"
    >
      <v-btn value="week">Week</v-btn>
      <v-btn value="month">Month</v-btn>
    </v-btn-toggle>
  </div>
</template>

<script lang="ts" setup>
  import type { ViewMode } from '../types'

  // Properties
  defineProps<{
    title: string
  }>()

  // Emits
  const emit = defineEmits<{
    prev: []
    today: []
    next: []
  }>()

  // Reactive state
  const viewMode = defineModel<ViewMode>('viewMode', { required: true })
</script>
