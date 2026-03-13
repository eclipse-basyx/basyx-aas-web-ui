<template>
    <v-card
        class="mx-auto draggable-item"
        :class="{ 'selected-item': isSelected }"
        border
        flat
        rounded="lg"
        :draggable="true"
        @dragstart="handleDragStart"
        @dragend="handleDragEnd">
        <v-toolbar density="compact" color="transparent" class="cursor-pointer" @click="handlePreview">
            <v-toolbar-title class="text-truncate text-subtitle-2 ml-2">{{ fullFileName }}</v-toolbar-title>
            <template #prepend>
                <v-checkbox-btn
                    :model-value="isSelected"
                    class="ml-1"
                    density="compact"
                    @update:model-value="handleToggleSelection"
                    @click.stop>
                </v-checkbox-btn>
            </template>
            <template #append>
                <v-btn icon variant="text" size="x-small">
                    <v-icon icon="mdi-dots-vertical" />
                    <v-menu activator="parent" location="top end" origin="overlap" :close-on-content-click="false">
                        <v-sheet border>
                            <v-list dense density="compact" class="py-0" slim>
                                <v-list-item @click="handleDownload">
                                    <template #prepend>
                                        <v-icon size="x-small">mdi-download</v-icon>
                                    </template>
                                    <v-list-item-subtitle>Download File</v-list-item-subtitle>
                                </v-list-item>
                                <v-list-item @click="handleDelete">
                                    <template #prepend>
                                        <v-icon size="x-small">mdi-delete</v-icon>
                                    </template>
                                    <v-list-item-subtitle>Delete File</v-list-item-subtitle>
                                </v-list-item>
                            </v-list>
                        </v-sheet>
                    </v-menu>
                </v-btn>
            </template>
        </v-toolbar>
        <v-card-item class="px-2 pb-2 pt-0 cursor-pointer" @click="handlePreview">
            <v-card flat rounded="lg" border class="media-card">
                <v-img v-if="contentTypeCategory === 'image'" :src="fileUrl" block cover>
                    <template #placeholder>
                        <div class="d-flex align-center justify-center fill-height">
                            <v-progress-circular color="grey-lighten-4" indeterminate></v-progress-circular>
                        </div>
                    </template>
                </v-img>
                <video
                    v-else-if="contentTypeCategory === 'video'"
                    :src="fileUrl"
                    controls
                    class="video-element"></video>
                <v-icon v-else-if="file.contentType === 'application/pdf'" color="red" size="x-large"
                    >mdi-file-pdf-box</v-icon
                >
                <v-icon v-else size="x-large" color="grey">mdi-file</v-icon>
            </v-card>
        </v-card-item>
    </v-card>
</template>

<script setup lang="ts">
    import type { ContentTypeCategory, FileElement } from '../types';
    import { computed } from 'vue';
    import { checkContentType, mimeToExtension } from '@/utils/FileHandling';

    interface Props {
        file: FileElement;
        fileUrl?: string;
        isSelected: boolean;
    }

    const props = withDefaults(defineProps<Props>(), {
        fileUrl: '',
    });

    const emit = defineEmits<{
        (e: 'preview'): void;
        (e: 'download'): void;
        (e: 'delete'): void;
        (e: 'toggle-selection'): void;
        (e: 'change-startscreen', state: boolean): void;
        (e: 'dragstart', event: DragEvent): void;
        (e: 'dragend'): void;
    }>();

    const handlePreview = (): void => emit('preview');
    const handleDownload = (): void => emit('download');
    const handleDelete = (): void => emit('delete');
    const handleToggleSelection = (): void => emit('toggle-selection');
    const handleDragStart = (event: DragEvent): void => emit('dragstart', event);
    const handleDragEnd = (): void => emit('dragend');

    const fullFileName = computed(() => {
        const extension = mimeToExtension(props.file.contentType);
        return `${props.file.idShort}.${extension}`;
    });

    const contentTypeCategory = computed((): ContentTypeCategory => {
        return checkContentType(props.file.contentType) as ContentTypeCategory;
    });
</script>

<style scoped>
    .draggable-item {
        width: 100%;
        cursor: pointer;
    }

    .draggable-item:not(.selected-item):hover {
        background-color: rgba(var(--v-theme-on-surface), 0.08);
    }

    .draggable-item:active {
        opacity: 0.5;
    }

    .media-card {
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        padding-bottom: 56.25%;
        /* 16:9 aspect ratio */
        height: 0;
        overflow: hidden;
    }

    .media-card > * {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .video-element {
        width: 100%;
        height: 100%;
        object-fit: cover;
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
</style>
