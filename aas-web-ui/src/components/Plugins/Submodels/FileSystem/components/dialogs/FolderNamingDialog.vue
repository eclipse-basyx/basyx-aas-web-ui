<template>
    <v-dialog v-model="internalDialog" :width="600">
        <template #default="{ isActive }">
            <v-card>
                <v-card-title>Name Folder</v-card-title>
                <v-divider></v-divider>
                <v-card-text>
                    <v-text-field
                        v-model="folderName"
                        density="compact"
                        variant="outlined"
                        label="Folder Name"></v-text-field>
                </v-card-text>
                <v-divider></v-divider>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn text="Cancel" @click="handleCancel"></v-btn>
                    <v-btn color="primary" variant="flat" @click="handleSave(isActive)">Save</v-btn>
                </v-card-actions>
            </v-card>
        </template>
    </v-dialog>
</template>

<script setup lang="ts">
    import type { FolderElement } from '../../types';
    import { computed, ref, watch } from 'vue';

    interface Props {
        modelValue: boolean;
        folder: FolderElement | null;
    }

    const props = defineProps<Props>();

    const emit = defineEmits<{
        (e: 'update:model-value', value: boolean): void;
        (e: 'save', folderName: string): void;
    }>();

    const folderName = ref('');

    const internalDialog = computed({
        get: () => props.modelValue,
        set: (value: boolean) => emit('update:model-value', value),
    });

    // Initialize folder name when dialog opens
    watch(
        () => props.modelValue,
        (isOpen) => {
            if (isOpen && props.folder) {
                const nameEntry = props.folder.displayName?.find((name) => name.language === 'de');
                folderName.value = nameEntry?.text || props.folder.idShort;
            }
        }
    );

    const handleCancel = (): void => {
        emit('update:model-value', false);
    };

    const handleSave = (isActive: { value: boolean }): void => {
        emit('save', folderName.value);
        isActive.value = false;
    };
</script>
