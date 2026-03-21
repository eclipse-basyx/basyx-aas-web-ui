<template>
  <v-card
    border
    class="mx-auto draggable-item"
    :class="{
      'drop-zone-active': isDragOver,
      'selected-item': isSelected,
    }"
    :draggable="true"
    flat
    rounded="lg"
    @dragend="handleDragEnd"
    @dragleave="handleDragLeave"
    @dragover.prevent="handleDragOver"
    @dragstart="handleDragStart"
    @drop="handleDrop"
  >
    <v-toolbar class="cursor-pointer" color="transparent" density="compact" @click="handleClick">
      <v-toolbar-title class="text-truncate text-subtitle-2 ml-2">{{ displayName }}</v-toolbar-title>
      <template #prepend>
        <v-checkbox-btn
          class="ml-1"
          density="compact"
          :model-value="isSelected"
          @click.stop
          @update:model-value="handleToggleSelection"
        />
      </template>
      <template #append>
        <v-btn icon size="x-small" variant="text">
          <v-icon icon="mdi-dots-vertical" />
          <v-menu activator="parent">
            <v-sheet border>
              <v-list class="py-0" dense density="compact" slim>
                <v-list-item @click="handleEdit">
                  <template #prepend>
                    <v-icon size="x-small">mdi-folder-edit</v-icon>
                  </template>
                  <v-list-item-subtitle>Rename Folder</v-list-item-subtitle>
                </v-list-item>
                <v-list-item @click="handleDelete">
                  <template #prepend>
                    <v-icon size="x-small">mdi-delete</v-icon>
                  </template>
                  <v-list-item-subtitle>Delete Folder</v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-sheet>
          </v-menu>
        </v-btn>
      </template>
    </v-toolbar>
  </v-card>
</template>

<script setup lang="ts">
  import type { FolderElement } from '../types'

  interface Props {
    folder: FolderElement
    displayName: string
    isSelected: boolean
    isDragOver: boolean
  }

  defineProps<Props>()

  const emit = defineEmits<{
    (e: 'click'): void
    (e: 'edit'): void
    (e: 'delete'): void
    (e: 'toggle-selection'): void
    (e: 'dragstart', event: DragEvent): void
    (e: 'dragend'): void
    (e: 'dragover', event: DragEvent): void
    (e: 'dragleave', event: DragEvent): void
    (e: 'drop', event: DragEvent): void
  }>()

  const handleClick = (): void => emit('click')
  const handleEdit = (): void => emit('edit')
  const handleDelete = (): void => emit('delete')
  const handleToggleSelection = (): void => emit('toggle-selection')
  const handleDragStart = (event: DragEvent): void => emit('dragstart', event)
  const handleDragEnd = (): void => emit('dragend')
  const handleDragOver = (event: DragEvent): void => emit('dragover', event)
  const handleDragLeave = (event: DragEvent): void => emit('dragleave', event)
  const handleDrop = (event: DragEvent): void => emit('drop', event)
</script>

<style scoped>
    .draggable-item {
        width: 100%;
        cursor: move;
    }

    .draggable-item:not(.selected-item):not(.drop-zone-active):hover {
        background-color: rgba(var(--v-theme-on-surface), 0.08);
    }

    .draggable-item:active {
        opacity: 0.5;
    }

    /* Drop zone state */
    .drop-zone-active {
        background-color: rgba(var(--v-theme-primary), 0.1);
        outline: 2px dashed rgb(var(--v-theme-primary));
        outline-offset: -2px;
        transition: none;
    }

    /* Selected state */
    .selected-item {
        background-color: rgba(var(--v-theme-primary), 0.15);
        outline: 2px solid rgb(var(--v-theme-primary));
        outline-offset: -2px;
    }

    .selected-item:hover {
        background-color: rgba(var(--v-theme-primary), 0.2);
    }

    /* Combined: selected + drop zone (dropping into a selected folder) */
    .selected-item.drop-zone-active {
        background-color: rgba(var(--v-theme-primary), 0.2);
        outline: 2px dashed rgb(var(--v-theme-primary));
        outline-offset: -2px;
        transition: none;
    }
</style>
