<template>
    <v-card
        :class="{ 'drop-zone-active': isDragOver }"
        rounded="lg"
        border
        flat
        @dragover.prevent="handleDragOver"
        @dragleave="handleDragLeave"
        @drop="handleDrop">
        <v-toolbar
            density="compact"
            color="transparent"
            :title="displayName"
            class="cursor-pointer"
            @click="handleNavigateUp">
        </v-toolbar>
    </v-card>
</template>

<script setup lang="ts">
    interface Props {
        displayName: string;
        isDragOver: boolean;
    }

    defineProps<Props>();

    const emit = defineEmits<{
        (e: 'navigate-up'): void;
        (e: 'dragover', event: DragEvent): void;
        (e: 'dragleave', event: DragEvent): void;
        (e: 'drop', event: DragEvent): void;
    }>();

    const handleNavigateUp = (): void => emit('navigate-up');
    const handleDragOver = (event: DragEvent): void => emit('dragover', event);
    const handleDragLeave = (event: DragEvent): void => emit('dragleave', event);
    const handleDrop = (event: DragEvent): void => emit('drop', event);
</script>

<style scoped>
    .v-card {
        width: 100%;
        cursor: pointer;
        transition: background-color 0.2s ease;
    }

    .v-card:hover {
        background-color: rgba(var(--v-theme-on-surface), 0.08);
    }

    .drop-zone-active {
        outline: 2px dashed rgb(var(--v-theme-primary));
        outline-offset: -2px;
    }
</style>
