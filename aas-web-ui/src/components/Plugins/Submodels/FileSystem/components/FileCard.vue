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
                        <v-list slim>
                            <v-list-subheader>Aktionen</v-list-subheader>
                            <v-list-item link title="Herunterladen" @click="handleDownload" />
                            <v-list-item link title="Löschen" @click="handleDelete" />
                            <v-checkbox
                                v-if="allowStartscreen"
                                label="Auf Hauptseite"
                                hide-details
                                class="mr-2"
                                :model-value="previewState"
                                @update:model-value="handleChangeStartscreen" />
                        </v-list>
                    </v-menu>
                </v-btn>
            </template>
        </v-toolbar>
        <v-card-item class="px-2 pb-2 pt-0">
            <v-card flat rounded="lg" border class="media-card">
                <v-img
                    v-if="contentTypeCategory === 'image'"
                    :src="fileUrl"
                    block
                    cover
                    class="cursor-pointer"
                    @click="handlePreview">
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
                <v-icon
                    v-else-if="file.contentType === 'application/pdf'"
                    color="red"
                    size="x-large"
                    class="cursor-pointer"
                    @click="handlePreview"
                    >mdi-file-pdf-box</v-icon
                >
                <v-icon v-else size="x-large" color="grey" class="cursor-pointer" @click="handlePreview"
                    >mdi-file</v-icon
                >
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
        allowStartscreen?: boolean;
        previewState?: boolean;
    }

    const props = withDefaults(defineProps<Props>(), {
        fileUrl: '',
        allowStartscreen: false,
        previewState: false,
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
    const handleChangeStartscreen = (state: boolean | null): void => emit('change-startscreen', state ?? false);
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

    .draggable-item {
        cursor: move;
    }

    .draggable-item:active {
        opacity: 0.5;
    }

    .selected-item {
        background-color: rgba(33, 150, 243, 0.15);
        border-color: #2196f3 !important;
    }
</style>
