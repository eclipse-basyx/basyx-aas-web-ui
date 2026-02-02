<template>
    <v-dialog v-model="internalDialog" :width="600">
        <template #default="{ isActive }">
            <v-sheet border rounded="lg">
                <v-card-title class="bg-cardHeader">Name Folder</v-card-title>
                <v-divider></v-divider>
                <v-card-text>
                    <v-form v-model="isFormValid" @submit.prevent>
                        <v-text-field
                            v-model="folderName"
                            density="compact"
                            variant="outlined"
                            label="Folder Name"
                            :rules="folderNameRules"
                            validate-on="eager input"></v-text-field>
                    </v-form>
                </v-card-text>
                <v-divider></v-divider>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn text="Cancel" rounded="lg" @click="handleCancel" />
                    <v-btn
                        color="primary"
                        variant="flat"
                        rounded="lg"
                        class="text-buttonText"
                        text="Save"
                        :disabled="!isFormValid"
                        @click="handleSave(isActive)" />
                </v-card-actions>
            </v-sheet>
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
    const isFormValid = ref(false);

    // Folder name validation rules following macOS and Windows conventions
    const folderNameRules = [
        (v: string) => !!v || 'Folder name is required',
        (v: string) => v.trim().length > 0 || 'Folder name cannot be empty or only spaces',
        (v: string) => v.trim().length <= 255 || 'Folder name must be 255 characters or less',
        (v: string) => !/[/\\:*?"<>|]/.test(v) || 'Folder name cannot contain: / \\ : * ? " < > |',
        (v: string) => (v !== '.' && v !== '..') || 'Folder name cannot be "." or ".."',
        (v: string) => v === v.trim() || 'Folder name cannot start or end with spaces',
    ];

    const internalDialog = computed({
        get: () => props.modelValue,
        set: (value: boolean) => emit('update:model-value', value),
    });

    // Initialize folder name when dialog opens
    watch(
        () => props.modelValue,
        (isOpen) => {
            if (isOpen && props.folder) {
                const nameEntry = props.folder.displayName?.find((name) => name.language === 'en');
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
