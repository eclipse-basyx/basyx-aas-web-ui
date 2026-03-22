<template>
  <v-menu>
    <template #activator="{ props: menuProps }">
      <v-btn
        class="text-buttonText"
        color="primary"
        prepend-icon="mdi-plus"
        rounded="lg"
        text="New"
        variant="flat"
        v-bind="menuProps"
      />
    </template>
    <v-sheet border>
      <v-list class="py-0" dense density="compact" slim>
        <v-list-item @click="handleCreateFolder">
          <template #prepend>
            <v-icon size="x-small">mdi-folder-plus</v-icon>
          </template>
          <v-list-item-subtitle>Create Folder</v-list-item-subtitle>
        </v-list-item>
        <v-list-item @click="handleOpenUploadDialog">
          <template #prepend>
            <v-icon size="x-small">mdi-file-upload</v-icon>
          </template>
          <v-list-item-subtitle>Upload File</v-list-item-subtitle>
        </v-list-item>
      </v-list>
    </v-sheet>
  </v-menu>
</template>

<script setup lang="ts">
  const emit = defineEmits<{
    'open-upload-dialog': []
    'create-folder': []
  }>()

  const handleOpenUploadDialog = (): void => emit('open-upload-dialog')
  const handleCreateFolder = (): void => emit('create-folder')
</script>
