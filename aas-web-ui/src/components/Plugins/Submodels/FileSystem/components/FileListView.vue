<template>
    <v-data-table
        :headers="tableHeaders"
        :items="fileObjects"
        :row-props="getRowProps"
        class="bg-transparent border rounded-lg mt-5"
        hide-default-footer
        hover
        density="compact"
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
                class="draggable-item pl-0"
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
                class="draggable-item pl-0"
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
                class="draggable-item pl-0"
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
            <span v-else-if="item.modelType === 'SubmodelElementCollection'">Folder</span>
        </template>

        <!-- Actions column -->
        <template #[`item.actions`]="{ item }">
            <div class="d-flex ga-2 justify-end">
                <v-icon
                    v-if="isOnSubpath && item.modelType !== 'NavigationElement'"
                    icon="mdi-arrow-up-bold"
                    size="small"
                    color="medium-emphasis"
                    :disabled="hasSelection"
                    @click.stop="handleMoveUp(item)" />
                <v-icon
                    v-if="item.modelType === 'SubmodelElementCollection'"
                    icon="mdi-pencil"
                    size="small"
                    color="medium-emphasis"
                    :disabled="hasSelection"
                    @click.stop="handleEditFolder(item)" />
                <v-icon
                    v-if="item.modelType === 'File'"
                    icon="mdi-tray-arrow-down"
                    size="small"
                    color="medium-emphasis"
                    :disabled="hasSelection"
                    @click.stop="handleDownload(item)" />
                <v-icon
                    v-if="item.modelType !== 'NavigationElement'"
                    icon="mdi-delete"
                    size="small"
                    color="medium-emphasis"
                    :disabled="hasSelection"
                    @click.stop="handleDelete(item)" />
            </div>
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
            const nameEntry = item.displayName.find((name) => name.language === 'en');
            if (nameEntry) return nameEntry.text;
        }
        return item.idShort;
    };

    const handleRowClick = (_event: Event, { item }: { item: FileSystemElement }): void => {
        if (item.modelType === 'NavigationElement') {
            emit('navigate-up');
        } else {
            emit('row-click', item);
        }
    };

    const getRowProps = ({ item }: { item: FileSystemElement }): Record<string, any> => {
        const classes: string[] = [];
        if (props.isItemSelected(item)) {
            classes.push('selected-item');
        }
        if (props.dragOverFolder === item.idShort) {
            classes.push('drop-zone-active');
        }
        return { class: classes.join(' ') };
    };
</script>

<style scoped>
    .draggable-item:active {
        opacity: 0.5;
    }

    /* Disable v-list-item hover background to use table row hover instead */
    :deep(.v-list-item::before) {
        display: none;
    }

    /* Use :deep() to target Vuetify's internally generated table rows */

    /* Override default hover when selected or drop-zone-active */
    :deep(tr.selected-item:hover),
    :deep(tr.drop-zone-active:hover) {
        background: unset;
    }

    /* Drop zone state */
    :deep(tr.drop-zone-active) {
        background-color: rgba(var(--v-theme-primary), 0.1) !important;
        outline: 2px dashed rgb(var(--v-theme-primary));
        outline-offset: -2px;
    }

    /* Selected state */
    :deep(tr.selected-item) {
        background-color: rgba(var(--v-theme-primary), 0.15);
    }

    :deep(tr.selected-item:hover) {
        background-color: rgba(var(--v-theme-primary), 0.2) !important;
    }

    /* Combined: selected + drop zone (dropping into a selected folder) */
    :deep(tr.selected-item.drop-zone-active) {
        background-color: rgba(var(--v-theme-primary), 0.2) !important;
        outline: 2px dashed rgb(var(--v-theme-primary));
        outline-offset: -2px;
    }
</style>
