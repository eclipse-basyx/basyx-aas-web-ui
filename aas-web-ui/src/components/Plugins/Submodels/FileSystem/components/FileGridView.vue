<template>
    <div>
        <!-- Folders and Navigation Elements -->
        <v-row class="mt-2">
            <v-col v-for="element in foldersAndNavigation" :key="element.idShort" cols="12" xl="2" lg="3" md="4" sm="6">
                <!-- Navigation Element (go up) -->
                <v-lazy v-if="element.modelType === 'NavigationElement'">
                    <NavigationCard
                        :display-name="getFolderName(element)"
                        :is-drag-over="dragOverFolder === element.idShort"
                        @navigate-up="handleNavigateUp"
                        @dragover="(e) => handleDragOver(e, element)"
                        @dragleave="(e) => handleDragLeave(e, element)"
                        @drop="(e) => handleDrop(e, element)" />
                </v-lazy>

                <!-- Folder -->
                <v-lazy v-else-if="element.modelType === 'SubmodelElementCollection'">
                    <FolderCard
                        :folder="element as FolderElement"
                        :display-name="getFolderName(element)"
                        :is-selected="isItemSelected(element)"
                        :is-drag-over="dragOverFolder === element.idShort"
                        @click="handleFolderClick(element)"
                        @delete="handleDelete(element)"
                        @toggle-selection="handleToggleSelection(element)"
                        @dragstart="(e) => handleDragStart(e, element)"
                        @dragend="handleDragEnd"
                        @dragover="(e) => handleDragOver(e, element)"
                        @dragleave="(e) => handleDragLeave(e, element)"
                        @drop="(e) => handleDrop(e, element)" />
                </v-lazy>
            </v-col>
        </v-row>

        <!-- Files -->
        <v-row class="mt-2">
            <v-col v-for="file in files" :key="file.idShort" cols="12" xl="2" lg="3" md="4" sm="6">
                <v-lazy>
                    <FileCard
                        :file="file as FileElement"
                        :file-url="fileUrls[file.idShort]"
                        :is-selected="isItemSelected(file)"
                        :allow-startscreen="allowStartscreen"
                        :preview-state="getPreviewState(file as FileElement)"
                        @preview="handlePreview(file)"
                        @download="handleDownload(file)"
                        @delete="handleDelete(file)"
                        @toggle-selection="handleToggleSelection(file)"
                        @change-startscreen="(state) => handleChangeStartscreen(state, file)"
                        @dragstart="(e) => handleDragStart(e, file)"
                        @dragend="handleDragEnd" />
                </v-lazy>
            </v-col>
        </v-row>
    </div>
</template>

<script setup lang="ts">
    import type { FileElement, FileSystemElement, FileUrlsMap, FolderElement } from '../types';
    import { computed } from 'vue';
    import FileCard from './FileCard.vue';
    import FolderCard from './FolderCard.vue';
    import NavigationCard from './NavigationCard.vue';

    interface Props {
        fileObjects: FileSystemElement[];
        fileUrls: FileUrlsMap;
        dragOverFolder: string | null;
        allowStartscreen?: boolean;
        isItemSelected: (item: FileSystemElement) => boolean;
        getFolderName: (element: FileSystemElement) => string;
        getPreviewState: (file: FileElement) => boolean;
    }

    const props = withDefaults(defineProps<Props>(), {
        allowStartscreen: false,
    });

    const emit = defineEmits<{
        (e: 'folder-click', element: FileSystemElement): void;
        (e: 'preview', file: FileSystemElement): void;
        (e: 'download', file: FileSystemElement): void;
        (e: 'delete', element: FileSystemElement): void;
        (e: 'toggle-selection', element: FileSystemElement): void;
        (e: 'change-startscreen', state: boolean, file: FileSystemElement): void;
        (e: 'navigate-up'): void;
        (e: 'dragstart', event: DragEvent, element: FileSystemElement): void;
        (e: 'dragend'): void;
        (e: 'dragover', event: DragEvent, element: FileSystemElement): void;
        (e: 'dragleave', event: DragEvent, element: FileSystemElement): void;
        (e: 'drop', event: DragEvent, element: FileSystemElement): void;
    }>();

    const handleNavigateUp = (): void => emit('navigate-up');
    const handleFolderClick = (element: FileSystemElement): void => emit('folder-click', element);
    const handlePreview = (file: FileSystemElement): void => emit('preview', file);
    const handleDownload = (file: FileSystemElement): void => emit('download', file);
    const handleDelete = (element: FileSystemElement): void => emit('delete', element);
    const handleToggleSelection = (element: FileSystemElement): void => emit('toggle-selection', element);
    const handleChangeStartscreen = (state: boolean, file: FileSystemElement): void =>
        emit('change-startscreen', state, file);
    const handleDragStart = (event: DragEvent, element: FileSystemElement): void => emit('dragstart', event, element);
    const handleDragEnd = (): void => emit('dragend');
    const handleDragOver = (event: DragEvent, element: FileSystemElement): void => emit('dragover', event, element);
    const handleDragLeave = (event: DragEvent, element: FileSystemElement): void => emit('dragleave', event, element);
    const handleDrop = (event: DragEvent, element: FileSystemElement): void => emit('drop', event, element);

    const foldersAndNavigation = computed(() => {
        return props.fileObjects.filter(
            (element) => element.modelType === 'SubmodelElementCollection' || element.modelType === 'NavigationElement'
        );
    });

    const files = computed(() => {
        return props.fileObjects.filter((element) => element.modelType === 'File');
    });
</script>
