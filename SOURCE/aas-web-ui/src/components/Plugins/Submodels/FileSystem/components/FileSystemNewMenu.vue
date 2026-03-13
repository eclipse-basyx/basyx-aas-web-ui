<template>
    <v-menu>
        <template #activator="{ props: menuProps }">
            <v-btn
                prepend-icon="mdi-plus"
                text="New"
                variant="flat"
                color="primary"
                class="text-buttonText"
                rounded="lg"
                v-bind="menuProps" />
        </template>
        <v-sheet border>
            <v-list dense density="compact" class="py-0" slim>
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
        (e: 'open-upload-dialog'): void;
        (e: 'create-folder'): void;
    }>();

    const handleOpenUploadDialog = (): void => emit('open-upload-dialog');
    const handleCreateFolder = (): void => emit('create-folder');
</script>
