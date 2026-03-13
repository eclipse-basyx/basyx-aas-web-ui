<template>
    <div>
        <!-- Empty State -->
        <v-empty-state v-if="fileObjects.length === 0" icon="mdi-folder-open-outline" title="No files or folders">
            <template #actions>
                <FileSystemNewMenu @open-upload-dialog="handleOpenUploadDialog" @create-folder="handleCreateFolder" />
            </template>
        </v-empty-state>

        <!-- Folders and Navigation Elements -->
        <div v-else class="d-flex flex-wrap mt-5 ga-3">
            <div
                v-for="element in foldersAndNavigation"
                :key="element.idShort"
                class="flex-grow-0 flex-shrink-0"
                style="width: 220px">
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
                        :folder="element"
                        :display-name="getFolderName(element)"
                        :is-selected="isItemSelected(element)"
                        :is-drag-over="dragOverFolder === element.idShort"
                        @click="handleFolderClick(element)"
                        @edit="handleEditFolder(element)"
                        @delete="handleDelete(element)"
                        @toggle-selection="handleToggleSelection(element)"
                        @dragstart="(e) => handleDragStart(e, element)"
                        @dragend="handleDragEnd"
                        @dragover="(e) => handleDragOver(e, element)"
                        @dragleave="(e) => handleDragLeave(e, element)"
                        @drop="(e) => handleDrop(e, element)" />
                </v-lazy>
            </div>
        </div>

        <!-- Files -->
        <div v-if="fileObjects.length > 0" class="d-flex flex-wrap mt-3 ga-3">
            <div v-for="file in files" :key="file.idShort" class="flex-grow-0 flex-shrink-0" style="width: 220px">
                <v-lazy>
                    <FileCard
                        :file="file"
                        :file-url="fileUrls[file.idShort]"
                        :is-selected="isItemSelected(file)"
                        @preview="handlePreview(file)"
                        @download="handleDownload(file)"
                        @delete="handleDelete(file)"
                        @toggle-selection="handleToggleSelection(file)"
                        @dragstart="(e) => handleDragStart(e, file)"
                        @dragend="handleDragEnd" />
                </v-lazy>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import type { FileSystemElement, FileUrlsMap } from '../types';
    import { computed } from 'vue';

    interface Props {
        fileObjects: FileSystemElement[];
        fileUrls: FileUrlsMap;
        dragOverFolder: string | null;
        isItemSelected: (item: FileSystemElement) => boolean;
        getFolderName: (element: FileSystemElement) => string;
    }

    const props = withDefaults(defineProps<Props>(), {});

    const emit = defineEmits<{
        (e: 'folder-click', element: FileSystemElement): void;
        (e: 'preview', file: FileSystemElement): void;
        (e: 'download', file: FileSystemElement): void;
        (e: 'edit-folder', element: FileSystemElement): void;
        (e: 'delete', element: FileSystemElement): void;
        (e: 'toggle-selection', element: FileSystemElement): void;
        (e: 'change-startscreen', state: boolean, file: FileSystemElement): void;
        (e: 'navigate-up'): void;
        (e: 'open-upload-dialog'): void;
        (e: 'create-folder'): void;
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
    const handleEditFolder = (element: FileSystemElement): void => emit('edit-folder', element);
    const handleDelete = (element: FileSystemElement): void => emit('delete', element);
    const handleToggleSelection = (element: FileSystemElement): void => emit('toggle-selection', element);
    const handleOpenUploadDialog = (): void => emit('open-upload-dialog');
    const handleCreateFolder = (): void => emit('create-folder');
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
