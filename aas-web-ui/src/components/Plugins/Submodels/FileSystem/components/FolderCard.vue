<template>
    <v-card
        class="mx-auto draggable-item"
        :class="{
            'drop-zone-active': isDragOver,
            'selected-item': isSelected,
        }"
        rounded="lg"
        border
        flat
        :draggable="true"
        @dragstart="handleDragStart"
        @dragend="handleDragEnd"
        @dragover.prevent="handleDragOver"
        @dragleave="handleDragLeave"
        @drop="handleDrop">
        <v-toolbar density="compact" color="transparent" class="cursor-pointer" @click="handleClick">
            <v-toolbar-title class="text-truncate text-subtitle-2 ml-2">{{ displayName }}</v-toolbar-title>
            <template #prepend>
                <v-checkbox-btn
                    :model-value="isSelected"
                    density="compact"
                    class="ml-1"
                    @update:model-value="handleToggleSelection"
                    @click.stop>
                </v-checkbox-btn>
            </template>
            <template #append>
                <v-btn icon variant="text" size="x-small">
                    <v-icon icon="mdi-dots-vertical" />
                    <v-menu activator="parent">
                        <v-sheet border>
                            <v-list dense density="compact" class="py-0" slim>
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
    import type { FolderElement } from '../types';

    interface Props {
        folder: FolderElement;
        displayName: string;
        isSelected: boolean;
        isDragOver: boolean;
    }

    defineProps<Props>();

    const emit = defineEmits<{
        (e: 'click'): void;
        (e: 'edit'): void;
        (e: 'delete'): void;
        (e: 'toggle-selection'): void;
        (e: 'dragstart', event: DragEvent): void;
        (e: 'dragend'): void;
        (e: 'dragover', event: DragEvent): void;
        (e: 'dragleave', event: DragEvent): void;
        (e: 'drop', event: DragEvent): void;
    }>();

    const handleClick = (): void => emit('click');
    const handleEdit = (): void => emit('edit');
    const handleDelete = (): void => emit('delete');
    const handleToggleSelection = (): void => emit('toggle-selection');
    const handleDragStart = (event: DragEvent): void => emit('dragstart', event);
    const handleDragEnd = (): void => emit('dragend');
    const handleDragOver = (event: DragEvent): void => emit('dragover', event);
    const handleDragLeave = (event: DragEvent): void => emit('dragleave', event);
    const handleDrop = (event: DragEvent): void => emit('drop', event);
</script>

<style scoped>
    .draggable-item {
        width: 100%;
        cursor: move;
        transition: background-color 0.2s ease;
    }

    .draggable-item:not(.selected-item):hover {
        background-color: rgba(var(--v-theme-on-surface), 0.08);
    }

    .draggable-item:active {
        opacity: 0.5;
    }

    .drop-zone-active {
        outline: 2px dashed rgb(var(--v-theme-primary));
        outline-offset: -2px;
    }

    .selected-item {
        background-color: rgba(var(--v-theme-primary), 0.15);
        outline: 2px solid rgb(var(--v-theme-primary));
        outline-offset: -2px;
    }
</style>
