<template>
  <v-card
    border
    :class="{ 'drop-zone-active': isDragOver }"
    flat
    rounded="lg"
    @dragleave="handleDragLeave"
    @dragover.prevent="handleDragOver"
    @drop="handleDrop"
  >
    <v-toolbar
      class="cursor-pointer"
      color="transparent"
      density="compact"
      :title="displayName"
      @click="handleNavigateUp"
    />
  </v-card>
</template>

<script setup lang="ts">
  interface Props {
    displayName: string
    isDragOver: boolean
  }

  defineProps<Props>()

  const emit = defineEmits<{
    (e: 'navigate-up'): void
    (e: 'dragover', event: DragEvent): void
    (e: 'dragleave', event: DragEvent): void
    (e: 'drop', event: DragEvent): void
  }>()

  const handleNavigateUp = (): void => emit('navigate-up')
  const handleDragOver = (event: DragEvent): void => emit('dragover', event)
  const handleDragLeave = (event: DragEvent): void => emit('dragleave', event)
  const handleDrop = (event: DragEvent): void => emit('drop', event)
</script>

<style scoped>
    .v-card {
        width: 100%;
        cursor: pointer;
    }

    .v-card:not(.drop-zone-active):hover {
        background-color: rgba(var(--v-theme-on-surface), 0.08);
    }

    /* Drop zone state */
    .drop-zone-active {
        background-color: rgba(var(--v-theme-primary), 0.1);
        outline: 2px dashed rgb(var(--v-theme-primary));
        outline-offset: -2px;
        transition: none;
    }
</style>
