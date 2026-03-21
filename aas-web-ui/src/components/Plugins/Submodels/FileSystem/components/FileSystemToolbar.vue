<template>
  <v-toolbar class="pr-2" color="cardHeader">
    <!-- Selection Actions -->
    <v-sheet v-if="hasSelection" border class="d-flex flex-row align-center ml-3" rounded="xl">
      <v-btn icon="mdi-close" size="small" variant="text" @click="handleDeselectAll" />
      <v-toolbar-title class="ml-2 text-subtitle-2">{{ selectedCount }} selected</v-toolbar-title>
      <v-btn
        class="ml-2"
        icon="mdi-delete"
        size="small"
        variant="text"
        @click="handleDeleteSelected"
      />
    </v-sheet>
    <v-toolbar-title v-else>{{ selectedView === 0 ? 'Gallery' : 'File Explorer' }}</v-toolbar-title>
    <v-spacer />

    <!-- Switch between list and grid view -->
    <v-btn-toggle
      v-model="internalSelectedView"
      border
      class="mr-3"
      density="compact"
      divided
      mandatory
      rounded="lg"
    >
      <v-btn class="px-5" icon="mdi-view-grid" />
      <v-btn class="px-5" icon="mdi-view-list" />
    </v-btn-toggle>

    <!-- New File/Folder Menu -->
    <FileSystemNewMenu
      class="mr-3"
      @create-folder="handleCreateFolder"
      @open-upload-dialog="handleOpenUploadDialog"
    />
  </v-toolbar>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import FileSystemNewMenu from './FileSystemNewMenu.vue'

  interface Props {
    selectedView: number
    hasSelection?: boolean
    selectedCount?: number
  }

  const props = withDefaults(defineProps<Props>(), {
    hasSelection: false,
    selectedCount: 0,
  })

  const emit = defineEmits<{
    (e: 'update:selected-view', value: number): void
    (e: 'open-upload-dialog'): void
    (e: 'create-folder'): void
    (e: 'deselect-all'): void
    (e: 'delete-selected'): void
  }>()

  const handleOpenUploadDialog = (): void => emit('open-upload-dialog')
  const handleCreateFolder = (): void => emit('create-folder')
  const handleDeselectAll = (): void => emit('deselect-all')
  const handleDeleteSelected = (): void => emit('delete-selected')

  const internalSelectedView = computed({
    get: () => props.selectedView,
    set: (value: number) => emit('update:selected-view', value),
  })
</script>
