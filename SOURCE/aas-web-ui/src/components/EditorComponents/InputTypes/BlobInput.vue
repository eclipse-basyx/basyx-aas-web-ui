<template>
    <!-- Toggle between None and Blob -->
    <v-btn-toggle v-model="toggle" color="primary" variant="outlined" divided density="compact" class="mb-3">
        <v-btn value="none">
            <span>None</span>
        </v-btn>
        <v-btn value="blob">
            <span>Blob</span>
        </v-btn>
    </v-btn-toggle>
    <!-- Content Type Selection -->
    <v-combobox
        v-if="toggle === 'blob'"
        v-model="contentTypeValue"
        :items="contentTypeOptions"
        label="Content Type"
        variant="outlined"
        density="comfortable"
        placeholder="Select or enter Content Type"
        class="mt-2"></v-combobox>
    <!-- Blob File Upload -->
    <v-file-upload
        v-if="toggle === 'blob'"
        v-model="blob"
        clearable
        density="default"
        :multiple="false"></v-file-upload>
    <!-- Blob Preview -->
    <v-sheet
        v-if="toggle === 'blob' && contentValue && contentValue.length > 0 && contentTypeValue.includes('image')"
        border
        class="mt-6"
        rounded>
        <v-img
            v-if="!errorLoadingImage"
            :src="blobPreviewPath"
            max-width="100%"
            max-height="100%"
            contain
            rounded
            @error="errorLoadingImage = true"></v-img>
        <v-alert v-else text="No Blob preview available" density="compact" type="warning" variant="outlined"></v-alert>
    </v-sheet>
    <!-- Blob Content Summary -->
    <v-card v-if="toggle === 'blob' && contentValue" class="mt-6" border>
        <v-card-text>
            <div class="d-flex align-center justify-space-between">
                <div><strong>Blob Size:</strong> {{ formatFileSize(contentValue.length) }}</div>
                <v-btn
                    v-if="!showFullContent"
                    variant="text"
                    color="primary"
                    :disabled="contentValue.length > maxSafeSize"
                    @click="showFullContent = true">
                    Show Content
                </v-btn>
                <v-btn v-else variant="text" color="primary" @click="showFullContent = false"> Hide Content </v-btn>
            </div>

            <v-alert
                v-if="contentValue.length > maxSafeSize"
                type="warning"
                density="compact"
                variant="tonal"
                class="mt-2">
                Blob content is too large to display safely ({{ formatFileSize(contentValue.length) }}).
            </v-alert>
        </v-card-text>
    </v-card>

    <!-- Optimized Textarea (only displayed when explicitly requested) -->
    <v-textarea
        v-if="toggle === 'blob' && showFullContent && contentValue && contentValue.length <= maxSafeSize"
        v-model="displayedContent"
        label="Blob Content"
        variant="outlined"
        density="comfortable"
        clearable
        hide-details
        readonly
        class="mt-3"
        :loading="isContentLoading"></v-textarea>
</template>

<script lang="ts" setup>
    import { computed, onMounted, ref, watch } from 'vue';

    const props = defineProps<{
        content: Uint8Array | null;
        contentType: string;
        newBlob: boolean;
    }>();

    const emit = defineEmits<{
        (event: 'update:content', value: Uint8Array | null): void;
        (event: 'update:contentType', value: string): void;
        (event: 'update:blob', value: File | undefined): void;
    }>();

    const contentValue = ref<Uint8Array | null>(props.content);
    const contentTypeValue = ref<string>(props.contentType);
    const blob = ref<File | undefined>(undefined);
    const toggle = ref<string>('none');
    const errorLoadingImage = ref<boolean>(false);
    const isContentLoading = ref<boolean>(false);
    const showFullContent = ref<boolean>(false);
    const displayedContent = ref<string>('');
    const maxSafeSize = 1024 * 1024; // 1MB threshold for safe display
    const contentTypeOptions = ref<string[]>([
        'image/png',
        'image/jpeg',
        'image/svg+xml',
        'image/gif',
        'image/webp',
        'image/tiff',
        'image/bmp',
        'image/x-icon',
        'image/vnd.microsoft.icon',
        'image/heic',
        'image/heif',
    ]);

    watch(contentValue, (newValue) => {
        if (toggle.value === 'none') {
            emit('update:content', null);
            return;
        }
        emit('update:content', newValue);
    });

    watch(contentTypeValue, (newValue) => {
        if (newValue === null) {
            return;
        }
        emit('update:contentType', newValue);
    });

    watch(
        () => props.content,
        (newValue) => {
            contentValue.value = newValue;
        }
    );

    watch(
        () => props.contentType,
        (newValue) => {
            contentTypeValue.value = newValue;
        }
    );

    watch(
        () => toggle.value,
        (newValue) => {
            if (newValue === 'none') {
                contentValue.value = null;
                contentTypeValue.value = 'application/unknown';
                blob.value = undefined;
            }
        }
    );

    watch(blob, (newValue) => {
        if (newValue === null) {
            return;
        }
        convertToBlob(newValue);
        emit('update:blob', newValue);
    });

    watch(showFullContent, async (show) => {
        if (show && contentValue.value) {
            isContentLoading.value = true;
            // Using nextTick and setTimeout to not block the UI
            await new Promise((resolve) => setTimeout(resolve, 0));
            try {
                // Decode the blob content if it seems to be text
                if (isTextContentType(contentTypeValue.value)) {
                    const decoder = new TextDecoder('utf-8');
                    displayedContent.value = decoder.decode(contentValue.value);
                } else {
                    // For binary data, show a hex representation
                    displayedContent.value = Array.from(contentValue.value)
                        .map((b) => b.toString(16).padStart(2, '0'))
                        .join(' ');
                }
            } catch (error) {
                console.error('Error rendering content:', error);
                displayedContent.value = 'Error rendering content';
            } finally {
                isContentLoading.value = false;
            }
        }
    });

    onMounted(() => {
        if (
            !props.newBlob &&
            props.content &&
            props.content.length > 0 &&
            props.contentType !== 'application/unknown'
        ) {
            toggle.value = 'blob';
        }
    });

    const blobPreviewPath = computed(() => {
        if (contentValue.value === null || !contentTypeValue.value.includes('image')) {
            return '';
        }
        const uint8Array = new Uint8Array(contentValue.value);
        const blob = new Blob([uint8Array], { type: contentTypeValue.value });
        return URL.createObjectURL(blob);
    });

    function convertToBlob(file: File | undefined): void {
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target && event.target.result) {
                    contentValue.value = new Uint8Array(event.target.result as ArrayBuffer);
                }
            };
            reader.readAsArrayBuffer(file);

            contentTypeValue.value = file.type;
        } else {
            contentValue.value = null;
        }
    }

    function formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    function isTextContentType(contentType: string): boolean {
        return /^text\/|application\/(json|xml|javascript|x-javascript)/i.test(contentType);
    }
</script>
