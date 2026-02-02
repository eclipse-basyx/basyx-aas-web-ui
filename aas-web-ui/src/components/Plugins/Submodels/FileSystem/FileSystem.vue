<template>
    <v-container class="pa-0" fluid>
        <!-- Selection Bar (bottom) -->
        <SelectionBar
            v-if="selection.hasSelection.value"
            :selected-count="selection.selectionCount.value"
            @delete-selected="confirmDeleteSelected" />

        <!-- Main Content -->
        <v-container class="pa-0" fluid>
            <v-card>
                <!-- Toolbar -->
                <FileSystemToolbar
                    v-model:selected-view="selectedView"
                    @open-upload-dialog="uploadDialog = true"
                    @create-folder="operations.createFolder" />

                <v-divider></v-divider>

                <!-- Card Content -->
                <v-card-text
                    style="height: 600px"
                    class="overflow-y-auto"
                    :class="{ 'external-drop-zone-active': dragDrop.isExternalDragOver.value }"
                    @dragover.prevent="dragDrop.handleExternalDragOver"
                    @dragleave="dragDrop.handleExternalDragLeave"
                    @drop.prevent="dragDrop.handleExternalDrop">
                    <!-- Upload Progress Overlay -->
                    <v-overlay
                        :model-value="operations.isUploading.value"
                        contained
                        persistent
                        class="align-center justify-center">
                        <ProgressOverlay title="Files are being uploaded" :progress="operations.uploadProgress.value" />
                    </v-overlay>

                    <!-- Moving Progress Overlay -->
                    <v-overlay
                        :model-value="operations.isMoving.value"
                        contained
                        persistent
                        class="align-center justify-center">
                        <ProgressOverlay title="Items are being moved" :progress="operations.moveProgress.value" />
                    </v-overlay>

                    <!-- Breadcrumbs -->
                    <FileSystemBreadcrumbs
                        :breadcrumbs="breadCrumbs"
                        :can-go-up="operations.isOnASubpath()"
                        @go-up="goUp" />

                    <!-- Grid View -->
                    <FileGridView
                        v-if="selectedView === 0"
                        :file-objects="operations.fileObjects.value"
                        :file-urls="operations.fileUrls.value"
                        :drag-over-folder="dragDrop.dragOverFolder.value"
                        :allow-startscreen="allowStartscreen"
                        :is-item-selected="selection.isItemSelected"
                        :get-folder-name="operations.getFolderName"
                        :get-preview-state="operations.getPreviewState"
                        @folder-click="handleFolderClick"
                        @preview="previewFile"
                        @download="downloadFile"
                        @edit-folder="editFolderName"
                        @delete="confirmDeleteElement"
                        @toggle-selection="selection.toggleItemSelection"
                        @change-startscreen="handleChangeStartscreen"
                        @navigate-up="navigateOneUp"
                        @open-upload-dialog="uploadDialog = true"
                        @create-folder="operations.createFolder"
                        @dragstart="dragDrop.handleDragStart"
                        @dragend="dragDrop.handleDragEnd"
                        @dragover="dragDrop.handleDragOver"
                        @dragleave="dragDrop.handleDragLeave"
                        @drop="dragDrop.handleDrop" />

                    <!-- List View -->
                    <FileListView
                        v-else
                        :file-objects="operations.fileObjects.value"
                        :headers="tableHeaders"
                        :drag-over-folder="dragDrop.dragOverFolder.value"
                        :is-on-subpath="operations.isOnASubpath()"
                        :has-selection="selection.hasSelection.value"
                        :is-all-selected="selection.isAllSelected.value"
                        :is-some-selected="selection.isSomeSelected.value"
                        :is-item-selected="selection.isItemSelected"
                        :get-folder-name="operations.getFolderName"
                        :get-folder-element-count="operations.getFolderElementCount"
                        @row-click="handleRowClick"
                        @toggle-select-all="selection.toggleSelectAll"
                        @toggle-selection="selection.toggleItemSelection"
                        @navigate-up="navigateOneUp"
                        @move-up="operations.moveElementUp"
                        @edit-folder="editFolderName"
                        @download="downloadFile"
                        @delete="confirmDeleteElement"
                        @dragstart="dragDrop.handleDragStart"
                        @dragend="dragDrop.handleDragEnd"
                        @dragover="dragDrop.handleDragOver"
                        @dragleave="dragDrop.handleDragLeave"
                        @drop="dragDrop.handleDrop" />
                </v-card-text>
            </v-card>
        </v-container>

        <!-- Dialogs -->
        <UploadDialog
            v-model="uploadDialog"
            :accepted-files="acceptedFiles"
            :loading="operations.loading.value"
            @upload="handleUpload" />

        <FolderNamingDialog v-model="folderNamingDialog" :folder="editingFolder" @save="handleSaveFolderName" />

        <DeleteConfirmDialog
            v-model="deleteElementDialog"
            :elements-to-delete="elementsToDelete"
            :get-folder-name="operations.getFolderName"
            @confirm-delete="handleConfirmDelete" />

        <PreviewDialog
            :preview-dialog="previewDialog"
            :preview-file="previewElement"
            :file-submodel="submodelElementData"
            @update:preview-dialog="previewDialog = $event" />
    </v-container>
</template>

<script setup lang="ts">
    import type { BreadcrumbItem, FileElement, FileSystemElement, FolderElement, TableHeader } from './types';
    import { nextTick, onMounted, ref, watch } from 'vue';
    import { useRoute, useRouter } from 'vue-router';
    import { mimeToExtension } from '@/utils/FileHandling';
    import {
        DeleteConfirmDialog,
        FileGridView,
        FileListView,
        FileSystemBreadcrumbs,
        FileSystemToolbar,
        FolderNamingDialog,
        ProgressOverlay,
        SelectionBar,
        UploadDialog,
    } from './components';
    import { useDragAndDrop, useFileSystemOperations, useSelection } from './composables';
    import PreviewDialog from './PreviewDialog.vue';

    // Options
    defineOptions({
        name: 'FileSystem',
        semanticId: 'https://basyx.org/FileSystem/FileSystem/0/1',
    });

    // Props
    interface Props {
        defaultView?: number;
        submodelElementData: {
            id?: string;
            path: string;
            submodelElements?: FileSystemElement[];
        };
        acceptedFiles?: string;
        allowStartscreen?: boolean;
        title?: string;
    }

    const props = withDefaults(defineProps<Props>(), {
        defaultView: 0,
        acceptedFiles: undefined,
        allowStartscreen: false,
        title: 'File Explorer',
    });

    // Router
    const route = useRoute();
    const router = useRouter();

    // Composables
    const operations = useFileSystemOperations(() => props.submodelElementData);
    const selection = useSelection({ fileObjects: operations.fileObjects });
    const dragDrop = useDragAndDrop({
        selectedItems: selection.selectedItems,
        acceptedFiles: props.acceptedFiles,
        onMoveItems: handleMoveItems,
        onExternalFileDrop: handleExternalFileDrop,
        isItemSelected: selection.isItemSelected,
    });

    // Local State
    const selectedView = ref(0);
    const uploadDialog = ref(false);
    const folderNamingDialog = ref(false);
    const deleteElementDialog = ref(false);
    const previewDialog = ref(false);
    const editingFolder = ref<FolderElement | null>(null);
    const previewElement = ref<FileElement | null>(null);
    const elementsToDelete = ref<FileSystemElement[]>([]);
    const breadCrumbs = ref<BreadcrumbItem[]>([]);

    // Table headers
    const tableHeaders: TableHeader[] = [
        { title: '', key: 'selection', sortable: false, width: '50px' },
        { title: 'Name', key: 'idShort' },
        { title: 'Type', key: 'contentType' },
        { title: 'Actions', key: 'actions', sortable: false, align: 'end', width: '200px' },
    ];

    // Navigation Methods
    const goUp = (): void => {
        const filePath = route.query.filePath || '';
        if (filePath) {
            const splitted = filePath.toString().split('.');
            splitted.pop();
            const newFilePath = splitted.join('.');
            router.push({ query: { ...route.query, filePath: newFilePath } });
        }
    };

    const navigateOneUp = (): void => {
        goUp();
    };

    const handleFolderClick = (element: FileSystemElement): void => {
        const currentFilePath = route.query.filePath || '';
        const newFilePath = currentFilePath ? `${currentFilePath}.${element.idShort}` : element.idShort;
        router.push({ query: { ...route.query, filePath: newFilePath } });
    };

    const handleRowClick = (item: FileSystemElement): void => {
        if (item.modelType === 'File') {
            previewFile(item);
        } else if (item.modelType === 'SubmodelElementCollection') {
            handleFolderClick(item);
        }
    };

    // File Operations
    async function handleUpload(files: File[]): Promise<void> {
        await operations.uploadFiles(files);
        uploadDialog.value = false;
    }

    async function handleExternalFileDrop(files: File[]): Promise<void> {
        await operations.uploadFiles(files);
    }

    async function handleMoveItems(items: FileSystemElement[], targetFolder: FileSystemElement): Promise<void> {
        await operations.moveItems(items, targetFolder);
        selection.clearSelection();
    }

    const handleChangeStartscreen = (state: boolean, file: FileSystemElement): void => {
        operations.changeStartscreenState(state, file as FileElement);
    };

    const downloadFile = (element: FileSystemElement): void => {
        const fileElement = element as FileElement;
        const url = operations.fileUrls.value[fileElement.idShort];
        if (!url) return;

        const extension = mimeToExtension(fileElement.contentType);
        const fileName = `${fileElement.idShort}.${extension}`;

        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Preview
    const previewFile = (element: FileSystemElement): void => {
        previewDialog.value = true;
        previewElement.value = element as FileElement;
    };

    // Folder Editing
    const editFolderName = (element: FileSystemElement): void => {
        editingFolder.value = element as FolderElement;
        folderNamingDialog.value = true;
    };

    const handleSaveFolderName = async (newName: string): Promise<void> => {
        if (editingFolder.value) {
            await operations.saveFolderName(editingFolder.value, newName);
            folderNamingDialog.value = false;
            editingFolder.value = null;
        }
    };

    // Delete Operations
    const confirmDeleteElement = (element: FileSystemElement): void => {
        elementsToDelete.value = [element];
        deleteElementDialog.value = true;
    };

    const confirmDeleteSelected = (): void => {
        elementsToDelete.value = [...selection.selectedItems.value];
        deleteElementDialog.value = true;
    };

    const handleConfirmDelete = async (): Promise<void> => {
        if (elementsToDelete.value.length === 1) {
            await operations.deleteElement(elementsToDelete.value[0]);
        } else {
            await operations.deleteElements(elementsToDelete.value);
        }
        selection.clearSelection();
        elementsToDelete.value = [];
    };

    // Breadcrumbs
    const setBreadcrumbItems = async (): Promise<void> => {
        const filePath = route.query.filePath || '';
        breadCrumbs.value = [];

        breadCrumbs.value.push({
            title: props.title ?? 'Root',
            disabled: !filePath,
            to: { query: { ...route.query, filePath: '' } },
            index: 0,
        });

        const splitted = filePath.toString().split('.');
        if (splitted.length === 1 && splitted[0] === '') {
            return;
        }

        for (let index = 0; index < splitted.length; index++) {
            const path = splitted.slice(0, index + 1).join('.');
            const fullPathForCurrentElement = splitted.slice(0, index + 1).join('.');
            const displayName = await operations.getDisplayNameByPath(fullPathForCurrentElement);

            breadCrumbs.value.push({
                title: displayName,
                disabled: path === filePath,
                to: { query: { ...route.query, filePath: path } },
                index: index + 1,
            });
        }

        breadCrumbs.value.sort((a, b) => a.index - b.index);
    };

    // Watchers
    watch(
        () => route.query.filePath,
        (newFilePath) => {
            operations.fetchFiles(newFilePath as string);
        }
    );

    watch(operations.fileObjects, () => {
        setBreadcrumbItems();
    });

    // Lifecycle
    onMounted(() => {
        selectedView.value = props.defaultView;
        nextTick(() => {
            const filePath = route.query.filePath || '';
            operations.fetchFiles(filePath as string);
        });
    });
</script>

<style scoped>
    .external-drop-zone-active {
        background-color: rgba(76, 175, 80, 0.1);
        border: 3px dashed #4caf50;
        border-radius: 8px;
        position: relative;
    }

    .external-drop-zone-active::after {
        content: 'Dateien hier ablegen zum Hochladen';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 1.5rem;
        color: #4caf50;
        font-weight: 500;
        pointer-events: none;
        background-color: rgba(255, 255, 255, 0.9);
        padding: 1rem 2rem;
        border-radius: 8px;
        z-index: 10;
    }
</style>
