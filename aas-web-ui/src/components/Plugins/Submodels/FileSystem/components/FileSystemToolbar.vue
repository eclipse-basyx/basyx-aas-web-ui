<template>
    <v-toolbar color="cardHeader" class="pr-2">
        <!-- Selection Actions -->
        <v-sheet v-if="hasSelection" class="d-flex flex-row align-center ml-3" rounded="xl" border>
            <v-btn icon="mdi-close" variant="text" size="small" @click="handleDeselectAll"></v-btn>
            <v-toolbar-title class="ml-2 text-subtitle-2">{{ selectedCount }} selected</v-toolbar-title>
            <v-btn icon="mdi-delete" variant="text" size="small" class="ml-2" @click="handleDeleteSelected"></v-btn>
        </v-sheet>
        <v-toolbar-title v-else>{{ selectedView === 0 ? 'Gallery' : 'File Explorer' }}</v-toolbar-title>
        <v-spacer></v-spacer>

        <!-- Switch between list and grid view -->
        <v-btn-toggle
            v-model="internalSelectedView"
            border
            density="compact"
            divided
            rounded="lg"
            class="mr-3"
            mandatory>
            <v-btn icon="mdi-view-grid" class="px-5"></v-btn>
            <v-btn icon="mdi-view-list" class="px-5"></v-btn>
        </v-btn-toggle>

        <!-- New File/Folder Menu -->
        <FileSystemNewMenu
            class="mr-3"
            @open-upload-dialog="handleOpenUploadDialog"
            @create-folder="handleCreateFolder" />
    </v-toolbar>
</template>

<script setup lang="ts">
    import { computed } from 'vue';
    import FileSystemNewMenu from './FileSystemNewMenu.vue';

    interface Props {
        selectedView: number;
        hasSelection?: boolean;
        selectedCount?: number;
    }

    const props = withDefaults(defineProps<Props>(), {
        hasSelection: false,
        selectedCount: 0,
    });

    const emit = defineEmits<{
        (e: 'update:selected-view', value: number): void;
        (e: 'open-upload-dialog'): void;
        (e: 'create-folder'): void;
        (e: 'deselect-all'): void;
        (e: 'delete-selected'): void;
    }>();

    const handleOpenUploadDialog = (): void => emit('open-upload-dialog');
    const handleCreateFolder = (): void => emit('create-folder');
    const handleDeselectAll = (): void => emit('deselect-all');
    const handleDeleteSelected = (): void => emit('delete-selected');

    const internalSelectedView = computed({
        get: () => props.selectedView,
        set: (value: number) => emit('update:selected-view', value),
    });
</script>
