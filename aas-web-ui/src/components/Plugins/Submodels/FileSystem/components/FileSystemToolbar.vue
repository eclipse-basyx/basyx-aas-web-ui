<template>
    <v-toolbar color="cardHeader" class="pr-2">
        <v-toolbar-title>{{ selectedView === 0 ? 'Gallery' : 'File Explorer' }}</v-toolbar-title>
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
    }

    const props = defineProps<Props>();

    const emit = defineEmits<{
        (e: 'update:selected-view', value: number): void;
        (e: 'open-upload-dialog'): void;
        (e: 'create-folder'): void;
    }>();

    const handleOpenUploadDialog = (): void => emit('open-upload-dialog');
    const handleCreateFolder = (): void => emit('create-folder');

    const internalSelectedView = computed({
        get: () => props.selectedView,
        set: (value: number) => emit('update:selected-view', value),
    });
</script>
