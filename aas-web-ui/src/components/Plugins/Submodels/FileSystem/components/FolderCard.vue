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
                    <v-menu activator="parent" location="top end" origin="overlap" :close-on-content-click="false">
                        <v-list slim>
                            <v-list-subheader>Actions</v-list-subheader>
                            <v-list-item link title="Delete" @click="handleDelete" />
                        </v-list>
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
        (e: 'delete'): void;
        (e: 'toggle-selection'): void;
        (e: 'dragstart', event: DragEvent): void;
        (e: 'dragend'): void;
        (e: 'dragover', event: DragEvent): void;
        (e: 'dragleave', event: DragEvent): void;
        (e: 'drop', event: DragEvent): void;
    }>();

    const handleClick = (): void => emit('click');
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
        cursor: move;
    }

    .draggable-item:active {
        opacity: 0.5;
    }

    .drop-zone-active {
        background-color: rgba(33, 150, 243, 0.1);
        border: 2px dashed #2196f3;
        border-radius: 8px;
    }

    .selected-item {
        background-color: rgba(33, 150, 243, 0.15);
        border-color: #2196f3 !important;
    }
</style>
