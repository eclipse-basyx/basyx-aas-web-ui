<template>
    <v-dialog v-model="internalDialog" :width="600">
        <template #default>
            <v-sheet border rounded="lg">
                <v-card-title class="bg-cardHeader">Upload Images/Videos</v-card-title>
                <v-divider></v-divider>
                <v-progress-linear v-if="loading" color="primary" indeterminate></v-progress-linear>
                <v-card-text>
                    <v-file-input
                        v-model="selectedFiles"
                        label="Select Files"
                        :accept="acceptedFiles"
                        variant="outlined"
                        density="compact"
                        prepend-icon=""
                        prepend-inner-icon="$file"
                        multiple></v-file-input>
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
                        text="Upload"
                        @click="handleUpload" />
                </v-card-actions>
            </v-sheet>
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
