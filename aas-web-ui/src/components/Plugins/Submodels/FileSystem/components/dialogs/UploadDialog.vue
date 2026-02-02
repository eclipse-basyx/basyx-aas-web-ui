<template>
    <v-dialog v-model="internalDialog" :width="600">
        <template #default>
            <v-card>
                <v-card-title>Upload Images/Videos</v-card-title>
                <v-divider></v-divider>
                <v-progress-linear v-if="loading" color="primary" indeterminate></v-progress-linear>
                <v-card-text>
                    <v-file-input
                        v-model="selectedFiles"
                        label="Select Files"
                        :accept="acceptedFiles"
                        variant="outlined"
                        prepend-icon=""
                        prepend-inner-icon="$file"
                        multiple></v-file-input>
                </v-card-text>
                <v-divider></v-divider>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn text="Cancel" @click="handleCancel"></v-btn>
                    <v-btn color="primary" variant="flat" @click="handleUpload">Upload</v-btn>
                </v-card-actions>
            </v-card>
        </template>
    </v-dialog>
</template>

<script setup lang="ts">
    import { computed, ref } from 'vue';

    interface Props {
        modelValue: boolean;
        acceptedFiles?: string;
        loading?: boolean;
    }

    const props = withDefaults(defineProps<Props>(), {
        acceptedFiles: undefined,
        loading: false,
    });

    const emit = defineEmits<{
        (e: 'update:model-value', value: boolean): void;
        (e: 'upload', files: File[]): void;
    }>();

    const selectedFiles = ref<File[] | null>(null);

    const internalDialog = computed({
        get: () => props.modelValue,
        set: (value: boolean) => emit('update:model-value', value),
    });

    const handleCancel = (): void => {
        emit('update:model-value', false);
    };

    const handleUpload = (): void => {
        if (selectedFiles.value && selectedFiles.value.length > 0) {
            emit('upload', selectedFiles.value);
            selectedFiles.value = null;
        }
    };
</script>
