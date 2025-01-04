<template>
    <v-dialog v-model="uploadAASDialog" width="600">
        <v-card :loading="loadingUpload">
            <v-card-title>
                <span class="text-subtile-1">Upload AAS to Environment</span>
            </v-card-title>
            <v-divider></v-divider>
            <v-card-text>
                <!-- AAS File Input -->
                <v-file-input
                    v-model="aasFile"
                    variant="outlined"
                    density="compact"
                    :multiple="false"
                    clearable
                    class="my-1 mt-3"
                    label="AAS File Upload"
                    :accept="['.aasx', '.xml', '.json']">
                    <template #append-inner>
                        <v-btn
                            size="small"
                            variant="elevated"
                            color="primary"
                            class="text-buttonText"
                            style="right: -4px"
                            @click.stop="uploadAASFile()"
                            >Upload</v-btn
                        >
                    </template>
                </v-file-input>
            </v-card-text>
        </v-card>
    </v-dialog>
</template>

<script lang="ts" setup>
    import { ref, watch } from 'vue';
    import { useAASRepositoryClient } from '@/composables/Client/AASRepositoryClient';

    const { uploadAas } = useAASRepositoryClient();

    const props = defineProps<{
        modelValue: boolean;
    }>();

    const emit = defineEmits<{
        (event: 'update:modelValue', value: boolean): void;
    }>();

    const uploadAASDialog = ref(false);
    const aasFile = ref(null as File | null);
    const loadingUpload = ref(false);

    watch(
        () => props.modelValue,
        (value) => {
            uploadAASDialog.value = value;
        }
    );

    watch(
        () => uploadAASDialog.value,
        (value) => {
            emit('update:modelValue', value);
        }
    );

    async function uploadAASFile() {
        if (!aasFile.value) return;
        loadingUpload.value = true;

        await uploadAas(aasFile.value);

        aasFile.value = null;
        uploadAASDialog.value = false;
        loadingUpload.value = false;
    }
</script>
