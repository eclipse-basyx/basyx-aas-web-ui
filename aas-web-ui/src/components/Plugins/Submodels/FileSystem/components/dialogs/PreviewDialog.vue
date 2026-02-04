<template>
    <v-dialog v-model="dialog" fullscreen :opacity="0.84">
        <v-card color="transparent" class="d-flex flex-column">
            <v-toolbar class="pl-3" color="transparent">
                <v-icon :color="fileTypeIcon.color">{{ fileTypeIcon.icon }}</v-icon>
                <v-toolbar-title class="text-body-2 text-md-h6 text-white">
                    {{ fileName }}
                </v-toolbar-title>
                <v-spacer></v-spacer>
                <v-btn v-if="!loading && !error" icon="mdi-download" color="white" @click="handleDownload"></v-btn>
                <v-btn icon="mdi-close" color="white" @click="closeDialog"></v-btn>
            </v-toolbar>

            <v-card-text class="d-flex flex-column fill-height" @click.self="closeDialog">
                <!-- Loading State -->
                <div v-if="loading" class="d-flex align-center justify-center fill-height" @click.self="closeDialog">
                    <v-progress-circular color="primary" indeterminate size="64"></v-progress-circular>
                </div>

                <!-- Error State -->
                <div v-else-if="error" class="d-flex align-center justify-center fill-height" @click.self="closeDialog">
                    <v-sheet class="mx-auto pa-6" rounded="lg" max-width="500" elevation="8">
                        <v-empty-state
                            icon="mdi-alert-circle"
                            title="Failed to Load File"
                            :text="errorMessage"
                            color="error"></v-empty-state>
                    </v-sheet>
                </div>

                <!-- Content Container with click to close -->
                <div v-else class="d-flex align-center justify-center fill-height" @click.self="closeDialog">
                    <!-- Image Preview -->
                    <img
                        v-if="fileContentType === 'image'"
                        :src="previewFileUrl"
                        :alt="fileName"
                        class="preview-image" />

                    <!-- PDF Preview -->
                    <iframe
                        v-else-if="fileContentType === 'pdf'"
                        :src="previewFileUrl"
                        type="application/pdf"
                        class="preview-pdf"
                        frameborder="0"></iframe>

                    <!-- JSON Preview -->
                    <v-sheet v-else-if="fileContentType === 'json'" class="preview-code" rounded="lg" elevation="4">
                        <JSONPreview :submodel-element-data="submodelElementData"></JSONPreview>
                    </v-sheet>

                    <!-- XML Preview -->
                    <v-sheet v-else-if="fileContentType === 'xml'" class="preview-code" rounded="lg" elevation="4">
                        <XMLPreview :submodel-element-data="submodelElementData"></XMLPreview>
                    </v-sheet>

                    <!-- Video Preview -->
                    <video
                        v-else-if="fileContentType === 'video'"
                        :src="previewFileUrl"
                        controls
                        class="preview-video"></video>

                    <!-- Unsupported File Type -->
                    <v-sheet v-else class="mx-auto pa-6" rounded="lg" max-width="500" elevation="8">
                        <v-empty-state
                            icon="mdi-file-eye-outline"
                            title="No Preview Available"
                            text="This file type cannot be previewed in the browser, but you can download it to view it locally.">
                            <template #actions>
                                <v-btn
                                    color="primary"
                                    text="Download File"
                                    class="text-buttonText"
                                    prepend-icon="mdi-download"
                                    rounded="lg"
                                    @click="handleDownload" />
                            </template>
                        </v-empty-state>
                    </v-sheet>
                </div>
            </v-card-text>

            <v-toolbar color="transparent"></v-toolbar>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
    import { computed, ref, watch } from 'vue';
    import { useRoute } from 'vue-router';
    import JSONPreview from '@/components/Plugins/JSONPreview.vue';
    import XMLPreview from '@/components/Plugins/XMLPreview.vue';
    import { useSMEFile } from '@/composables/AAS/SubmodelElements/File';
    import { useSMRepositoryClient } from '@/composables/Client/SMRepositoryClient';
    import { checkContentType, mimeToExtension } from '@/utils/FileHandling';

    // Props
    interface Props {
        previewDialog: boolean;
        previewFile: {
            idShort: string;
            contentType: string;
        } | null;
        fileSubmodel: {
            path: string;
        };
    }

    const props = defineProps<Props>();

    // Emits
    const emit = defineEmits<{
        'update:previewDialog': [value: boolean];
    }>();

    // Composables
    const route = useRoute();
    const { fetchAttachmentFile } = useSMRepositoryClient();
    const { downloadFile: downloadSMEFile } = useSMEFile();

    // State
    const dialog = ref(false);
    const previewFileUrl = ref('');
    const fileBlob = ref<Blob | null>(null);
    const loading = ref(false);
    const error = ref(false);
    const errorMessage = ref('');

    // Computed Properties
    const fileContentType = computed(() => {
        if (!props.previewFile?.contentType) return 'unknown';
        const contentType = props.previewFile.contentType.toLowerCase();
        if (contentType === 'application/pdf') return 'pdf';
        if (contentType.includes('json')) return 'json';
        if (contentType.includes('xml')) return 'xml';
        return checkContentType(contentType);
    });

    const fileTypeIcon = computed(() => {
        switch (fileContentType.value) {
            case 'pdf':
                return { icon: 'mdi-file-pdf-box', color: 'red' };
            case 'image':
                return { icon: 'mdi-image', color: 'blue-darken-2' };
            case 'video':
                return { icon: 'mdi-video', color: 'orange-darken-1' };
            case 'json':
                return { icon: 'mdi-code-json', color: 'yellow-darken-2' };
            case 'xml':
                return { icon: 'mdi-xml', color: 'green-darken-2' };
            default:
                return { icon: 'mdi-file', color: 'grey' };
        }
    });

    const fileName = computed(() => {
        if (!props.previewFile?.idShort) return 'Unknown File';
        const extension = mimeToExtension(props.previewFile.contentType);
        return `${props.previewFile.idShort}.${extension}`;
    });

    const filePath = computed(() => {
        if (!props.previewFile) return '';
        const currentPath = (route.query.filePath as string) || '';
        const idShortPath = currentPath ? `${currentPath}.${props.previewFile.idShort}` : props.previewFile.idShort;
        return `${props.fileSubmodel.path}/submodel-elements/${idShortPath}`;
    });

    /**
     * Constructs a SubmodelElement-like object that can be passed to the Preview components.
     * The Preview components expect an object with modelType, contentType, and path.
     */
    const submodelElementData = computed(() => ({
        modelType: 'File',
        idShort: props.previewFile?.idShort || '',
        contentType: props.previewFile?.contentType || '',
        value: filePath.value + '/attachment',
        path: filePath.value,
    }));

    /**
     * Determines if the file type requires blob loading (image, video, pdf).
     * JSON and XML previews handle their own loading via the Preview components.
     */
    const requiresBlobLoading = computed(() => {
        return ['image', 'video', 'pdf'].includes(fileContentType.value);
    });

    // Watchers
    watch(
        () => props.previewDialog,
        (newValue) => {
            dialog.value = newValue;
            if (newValue) {
                loadFile();
            } else {
                resetState();
            }
        }
    );

    watch(dialog, (newValue) => {
        emit('update:previewDialog', newValue);
        if (!newValue) {
            resetState();
        }
    });

    // Methods
    async function loadFile(): Promise<void> {
        // Guard against null previewFile
        if (!props.previewFile) {
            loading.value = false;
            return;
        }

        // Only load blob for types that need direct blob URL (image, video, pdf)
        // JSON/XML previews handle their own loading
        if (!requiresBlobLoading.value) {
            loading.value = false;
            return;
        }

        loading.value = true;
        error.value = false;
        errorMessage.value = '';

        try {
            const blob = await fetchAttachmentFile(filePath.value);

            if (blob) {
                fileBlob.value = blob;
                // Create blob URL with correct MIME type for proper browser handling
                const blobWithType = new Blob([blob], { type: props.previewFile.contentType });
                previewFileUrl.value = URL.createObjectURL(blobWithType);
            } else {
                error.value = true;
                errorMessage.value = 'Could not retrieve the file. Please check if the file exists and try again.';
            }
        } catch (err) {
            console.error('Error loading file:', err);
            error.value = true;
            errorMessage.value = 'An unexpected error occurred while loading the file.';
        } finally {
            loading.value = false;
        }
    }

    function handleDownload(): void {
        downloadSMEFile(submodelElementData.value);
    }

    function closeDialog(): void {
        dialog.value = false;
    }

    function resetState(): void {
        if (previewFileUrl.value) {
            URL.revokeObjectURL(previewFileUrl.value);
            previewFileUrl.value = '';
        }
        fileBlob.value = null;
        error.value = false;
        errorMessage.value = '';
    }
</script>

<style scoped>
    .preview-image {
        max-height: calc(100vh - 168px);
        max-width: calc(100vw - 64px);
        width: auto;
        height: auto;
        object-fit: contain;
    }

    .preview-video {
        max-height: calc(100vh - 168px);
        max-width: calc(100vw - 64px);
        object-fit: contain;
    }

    .preview-pdf {
        width: 100%;
        max-width: 1000px;
        height: calc(100vh - 168px);
    }

    .preview-code {
        width: 100%;
        max-width: 1200px;
        max-height: calc(100vh - 168px);
        overflow: auto;
    }
</style>
