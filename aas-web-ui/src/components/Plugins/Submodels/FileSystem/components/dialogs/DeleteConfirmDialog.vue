<template>
    <v-dialog v-model="internalDialog" persistent :width="600">
        <template #default="{ isActive }">
            <v-sheet border rounded="lg">
                <!-- Multi-delete title -->
                <v-card-title v-if="isMultiDelete" class="bg-cardHeader">
                    Are you sure you want to delete <b>{{ elementsToDelete.length }}</b> items?
                </v-card-title>
                <!-- Single delete title -->
                <v-card-title v-else-if="singleElement" class="bg-cardHeader">
                    {{ singleElement.modelType === 'SubmodelElementCollection' ? 'Folder' : 'File' }}
                    <b>{{ displayName }}</b>
                    really delete?
                </v-card-title>
                <v-divider></v-divider>

                <!-- Multi-delete content -->
                <v-card-text v-if="isMultiDelete">
                    <div class="mb-2">The following items will be permanently deleted:</div>
                    <v-list density="compact" class="pa-0" style="max-height: 200px; overflow-y: auto">
                        <v-list-item v-for="item in elementsToDelete" :key="item.idShort" class="px-0">
                            <template #prepend>
                                <v-icon
                                    v-if="item.modelType === 'SubmodelElementCollection'"
                                    color="yellow-darken-2"
                                    size="small"
                                    >mdi-folder</v-icon
                                >
                                <v-icon v-else-if="getContentType(item) === 'application/pdf'" color="red" size="small"
                                    >mdi-file-pdf-box</v-icon
                                >
                                <v-icon
                                    v-else-if="checkContentType(getContentType(item)) === 'image'"
                                    color="blue-darken-2"
                                    size="small"
                                    >mdi-image</v-icon
                                >
                                <v-icon
                                    v-else-if="checkContentType(getContentType(item)) === 'video'"
                                    color="orange-darken-1"
                                    size="small"
                                    >mdi-video</v-icon
                                >
                                <v-icon v-else color="grey" size="small">mdi-file</v-icon>
                            </template>
                            <v-list-item-title class="text-body-2">
                                {{ getItemDisplayName(item) }}
                            </v-list-item-title>
                        </v-list-item>
                    </v-list>
                </v-card-text>

                <!-- Single folder delete content -->
                <v-card-text v-else-if="singleElement?.modelType === 'SubmodelElementCollection'">
                    When deleting the folder, <b>all</b> subfolders and files will be permanently deleted.
                </v-card-text>

                <!-- Single file delete content -->
                <v-card-text v-else> The file will be permanently deleted. </v-card-text>

                <v-divider></v-divider>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn text="Cancel" rounded="lg" @click="handleCancel" />
                    <v-btn
                        color="error"
                        variant="flat"
                        rounded="lg"
                        class="text-buttonText"
                        text="Delete"
                        @click="handleDelete(isActive)" />
                </v-card-actions>
            </v-sheet>
        </template>
    </v-dialog>
</template>

<script setup lang="ts">
    import type { FileElement, FileSystemElement } from '../../types';
    import { computed } from 'vue';
    import { checkContentType } from '@/utils/FileHandling';

    interface Props {
        modelValue: boolean;
        elementsToDelete: FileSystemElement[];
        getFolderName: (element: FileSystemElement) => string;
    }

    const props = defineProps<Props>();

    const emit = defineEmits<{
        (e: 'update:model-value', value: boolean): void;
        (e: 'confirm-delete'): void;
    }>();

    const internalDialog = computed({
        get: () => props.modelValue,
        set: (value: boolean) => emit('update:model-value', value),
    });

    const isMultiDelete = computed(() => props.elementsToDelete.length > 1);

    const singleElement = computed(() => {
        if (props.elementsToDelete.length === 1) {
            return props.elementsToDelete[0];
        }
        return null;
    });

    const displayName = computed(() => {
        if (!singleElement.value) return '';
        if (singleElement.value.modelType === 'SubmodelElementCollection') {
            return props.getFolderName(singleElement.value);
        }
        return singleElement.value.idShort;
    });

    const getContentType = (item: FileSystemElement): string => {
        if (item.modelType === 'File') {
            return (item as FileElement).contentType;
        }
        return '';
    };

    const getItemDisplayName = (item: FileSystemElement): string => {
        if (item.modelType === 'SubmodelElementCollection') {
            return props.getFolderName(item);
        }
        return item.idShort;
    };

    const handleCancel = (): void => {
        emit('update:model-value', false);
    };

    const handleDelete = (isActive: { value: boolean }): void => {
        emit('confirm-delete');
        isActive.value = false;
    };
</script>
