<template>
    <v-tooltip open-delay="600" location="bottom" :disabled="isMobile">
        <template #activator="{ props }">
            <v-btn icon="mdi-upload" variant="plain" v-bind="props">
                <v-icon>mdi-upload</v-icon>
                <v-dialog v-model="uploadAASDialog" activator="parent" width="600">
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
            </v-btn>
        </template>
        <span>Upload AAS File to Environment</span>
    </v-tooltip>
</template>

<script lang="ts" setup>
    import { computed, ref } from 'vue';
    import { useAASRepositoryClient } from '@/composables/Client/AASRepositoryClient';
    import { useNavigationStore } from '@/store/NavigationStore';

    const navigationStore = useNavigationStore();

    const { uploadAas } = useAASRepositoryClient();

    const uploadAASDialog = ref(false);
    const aasFile = ref(null as File | null);
    const loadingUpload = ref(false);

    const isMobile = computed(() => navigationStore.getIsMobile);

    async function uploadAASFile() {
        if (!aasFile.value) return;
        loadingUpload.value = true;

        await uploadAas(aasFile.value);

        aasFile.value = null;
        uploadAASDialog.value = false;
        loadingUpload.value = false;
    }
</script>
