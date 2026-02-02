<template>
    <v-data-table
        :headers="tableHeaders"
        :items="fileObjects"
        class="bg-transparent"
        hide-default-footer
        hover
        @click:row="handleRowClick">
        <!-- Selection header -->
        <template #[`header.selection`]>
            <v-checkbox-btn
                :model-value="isAllSelected"
                :indeterminate="isSomeSelected && !isAllSelected"
                @update:model-value="handleToggleSelectAll"
                @click.stop>
            </v-checkbox-btn>
        </template>

        <!-- Selection column -->
        <template #[`item.selection`]="{ item }">
            <v-checkbox-btn
                v-if="item.modelType !== 'NavigationElement'"
                :model-value="isItemSelected(item)"
                @update:model-value="handleToggleSelection(item)"
                @click.stop>
            </v-checkbox-btn>
        </template>

        <!-- Name column -->
        <template #[`item.idShort`]="{ item }">
            <!-- File item -->
            <v-list-item
                v-if="item.modelType === 'File'"
                lines="one"
                :draggable="true"
                :class="['draggable-item', { 'selected-item': isItemSelected(item) }]"
                @dragstart="(e: any) => handleDragStart(e, item)"
                @dragend="handleDragEnd">
                <template #prepend>
                    <v-icon v-if="(item as FileElement).contentType === 'application/pdf'" color="red"
                        >mdi-file-pdf-box</v-icon
                    >
                    <v-icon
                        v-else-if="checkContentType((item as FileElement).contentType) === 'image'"
                        color="blue-darken-2"
                        >mdi-image</v-icon
                    >
                    <v-icon
                        v-else-if="checkContentType((item as FileElement).contentType) === 'video'"
                        color="orange-darken-1"
                        >mdi-video</v-icon
                    >
                    <v-icon v-else color="grey">mdi-file</v-icon>
                </template>
                <v-list-item-title class="text-subtitle-2">{{ item.idShort }}</v-list-item-title>
            </v-list-item>

            <!-- Folder item -->
            <v-list-item
                v-else-if="item.modelType === 'SubmodelElementCollection'"
                :draggable="true"
                :class="[
                    'draggable-item',
                    {
                        'drop-zone-active': dragOverFolder === item.idShort,
                        'selected-item': isItemSelected(item),
                    },
                ]"
                @dragstart="(e: any) => handleDragStart(e, item)"
                @dragend="handleDragEnd"
                @dragover.prevent="(e: any) => handleDragOver(e, item)"
                @dragleave="(e: any) => handleDragLeave(e, item)"
                @drop="(e: any) => handleDrop(e, item)">
                <template #prepend>
                    <v-icon color="yellow darken-2">mdi-folder</v-icon>
                </template>
                <v-list-item-title class="text-subtitle-2">
                    {{ getFolderDisplayName(item) }}
                    <span class="text-caption text-medium-emphasis ml-2">({{ getFolderElementCount(item) }})</span>
                </v-list-item-title>
            </v-list-item>

            <!-- Navigation item -->
            <v-list-item
                v-else-if="item.modelType === 'NavigationElement'"
                :class="['draggable-item', { 'drop-zone-active': dragOverFolder === item.idShort }]"
                @click="handleNavigateUp"
                @dragover.prevent="(e: any) => handleDragOver(e, item)"
                @dragleave="(e: any) => handleDragLeave(e, item)"
                @drop="(e: any) => handleDrop(e, item)">
                <template #prepend>
                    <v-icon color="yellow darken-2">mdi-folder</v-icon>
                </template>
                <v-list-item-title class="text-subtitle-2">...</v-list-item-title>
            </v-list-item>
        </template>

        <!-- Content type column -->
        <template #[`item.contentType`]="{ item }">
            <span v-if="item.modelType === 'File'">{{ `.${mimeToExtension((item as FileElement).contentType)}` }}</span>
            <span v-else-if="item.modelType === 'SubmodelElementCollection'">Ordner</span>
        </template>

        <!-- Actions column -->
        <template #[`item.actions`]="{ item }">
            <v-btn
                v-if="isOnSubpath && item.modelType !== 'NavigationElement'"
                icon="mdi-arrow-up-bold"
                variant="plain"
                size="small"
                :disabled="hasSelection"
                @click.stop="handleMoveUp(item)" />
            <v-btn
                v-if="item.modelType === 'SubmodelElementCollection'"
                icon="mdi-pencil"
                variant="plain"
                size="small"
                :disabled="hasSelection"
                @click.stop="handleEditFolder(item)" />
            <v-btn
                v-if="item.modelType === 'File'"
                icon="mdi-tray-arrow-down"
                variant="plain"
                size="small"
                :disabled="hasSelection"
                @click.stop="handleDownload(item)" />
            <v-btn
                v-if="item.modelType !== 'NavigationElement'"
                icon="mdi-delete"
                variant="plain"
                size="small"
                :disabled="hasSelection"
                @click.stop="handleDelete(item)" />
        </template>
    </v-data-table>
</template>

<script setup lang="ts">
    import type { FileElement, FileSystemElement, TableHeader } from '../types';
    import { computed } from 'vue';
    import { useDisplay } from 'vuetify';
    import { checkContentType, mimeToExtension } from '@/utils/FileHandling';

    interface Props {
        fileObjects: FileSystemElement[];
        headers: TableHeader[];
        dragOverFolder: string | null;
        isOnSubpath: boolean;
        hasSelection: boolean;
        isAllSelected: boolean;
        isSomeSelected: boolean;
        isItemSelected: (item: FileSystemElement) => boolean;
        getFolderName: (element: FileSystemElement) => string;
        getFolderElementCount: (folder: FileSystemElement) => number;
    }

    const props = defineProps<Props>();

    const emit = defineEmits<{
        (e: 'row-click', item: FileSystemElement): void;
        (e: 'toggle-select-all'): void;
        (e: 'toggle-selection', item: FileSystemElement): void;
        (e: 'navigate-up'): void;
        (e: 'move-up', item: FileSystemElement): void;
        (e: 'edit-folder', item: FileSystemElement): void;
        (e: 'download', item: FileSystemElement): void;
        (e: 'delete', item: FileSystemElement): void;
        (e: 'dragstart', event: DragEvent, item: FileSystemElement): void;
        (e: 'dragend'): void;
        (e: 'dragover', event: DragEvent, item: FileSystemElement): void;
        (e: 'dragleave', event: DragEvent, item: FileSystemElement): void;
        (e: 'drop', event: DragEvent, item: FileSystemElement): void;
    }>();

    const handleToggleSelectAll = (): void => emit('toggle-select-all');
    const handleToggleSelection = (item: FileSystemElement): void => emit('toggle-selection', item);
    const handleNavigateUp = (): void => emit('navigate-up');
    const handleMoveUp = (item: FileSystemElement): void => emit('move-up', item);
    const handleEditFolder = (item: FileSystemElement): void => emit('edit-folder', item);
    const handleDownload = (item: FileSystemElement): void => emit('download', item);
    const handleDelete = (item: FileSystemElement): void => emit('delete', item);
    const handleDragStart = (event: DragEvent, item: FileSystemElement): void => emit('dragstart', event, item);
    const handleDragEnd = (): void => emit('dragend');
    const handleDragOver = (event: DragEvent, item: FileSystemElement): void => emit('dragover', event, item);
    const handleDragLeave = (event: DragEvent, item: FileSystemElement): void => emit('dragleave', event, item);
    const handleDrop = (event: DragEvent, item: FileSystemElement): void => emit('drop', event, item);

    const { mdAndUp } = useDisplay();

    const tableHeaders = computed(() => {
        if (mdAndUp.value) {
            return props.headers;
        }
        return props.headers.filter((header) => header.key !== 'contentType');
    });

    const getFolderDisplayName = (item: FileSystemElement): string => {
        if (item.displayName) {
            const nameEntry = item.displayName.find((name) => name.language === 'de');
            if (nameEntry) return nameEntry.text;
        }
        return item.idShort;
    };

    const handleRowClick = (_event: Event, { item }: { item: FileSystemElement }): void => {
        emit('row-click', item);
    };
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
