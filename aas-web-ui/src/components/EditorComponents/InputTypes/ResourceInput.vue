<template>
    <v-divider></v-divider>
    <v-list-item class="pl-0 pt-0">
        <template #title>
            <div class="text-subtitle-2">{{ label }}</div>
        </template>
    </v-list-item>
    <!-- Toggle between File and URL -->
    <v-btn-toggle v-model="toggle" color="primary" variant="outlined" divided density="compact" class="mb-3">
        <v-btn value="none">
            <span>None</span>
        </v-btn>
        <v-btn value="file">
            <span>File</span>
        </v-btn>
        <v-btn value="url">
            <span>URL</span>
        </v-btn>
    </v-btn-toggle>
    <!-- URL based thumbnail -->
    <v-list-item v-if="toggle === 'url' && resourceValue !== null" class="px-0">
        <template #prepend>
            <v-combobox
                v-model="resourceValue.contentType"
                :items="contentTypeOptions"
                label="Content Type"
                variant="outlined"
                density="comfortable"
                :width="200"
                class="mr-3 mt-2"></v-combobox>
        </template>
        <v-text-field
            v-model="resourceValue.path"
            variant="outlined"
            density="comfortable"
            label="Path"
            class="mt-2"
            @update:model-value="
                errorLoadingImage = false;
                updateThumbnailPreview();
            "></v-text-field>
    </v-list-item>
    <!-- URL thumbnail preview -->
    <v-sheet
        v-if="toggle === 'url' && resourceValue?.path && resourceValue.path.length > 0"
        border
        rounded
        class="mb-4">
        <v-img
            v-if="!errorLoadingImage"
            :src="thumbnailPreviewPath"
            max-width="100%"
            max-height="100%"
            contain
            rounded
            @error="errorLoadingImage = true"></v-img>
        <v-alert
            v-else
            text="No Image found at given Path!"
            density="compact"
            type="warning"
            variant="outlined"></v-alert>
    </v-sheet>
    <v-file-upload v-if="toggle === 'file'" v-model="fileThumbnail" clearable density="default"></v-file-upload>
</template>

<script lang="ts" setup>
    import { types as aasTypes } from '@aas-core-works/aas-core3.0-typescript';
    import { onMounted, ref, watch } from 'vue';
    import { useUrlUtils } from '@/composables/UrlUtils';
    import { extractEndpointHref } from '@/utils/AAS/DescriptorUtils';

    const props = defineProps<{
        label: string;
        newShell: boolean;
        aas: any;
        modelValue: aasTypes.Resource | null;
    }>();

    const emit = defineEmits<{
        (event: 'update:modelValue', value: aasTypes.Resource | null): void;
        (event: 'update:fileThumbnail', value: File | undefined): void;
    }>();

    // Composables
    const { getBlobUrl } = useUrlUtils();

    const resourceValue = ref<aasTypes.Resource | null>(props.modelValue);
    const toggle = ref<string>('none');
    const errorLoadingImage = ref<boolean>(false);
    const fileThumbnail = ref<File>();
    const thumbnailPreviewPath = ref<string>('');
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

    watch(resourceValue, (newValue) => {
        if (toggle.value === 'none') {
            emit('update:modelValue', null);
            return;
        }
        emit('update:modelValue', newValue);
        updateThumbnailPreview();
    });

    watch(fileThumbnail, (newValue) => {
        if (newValue === null) {
            return;
        }
        emit('update:fileThumbnail', newValue);
    });

    watch(
        () => props.modelValue,
        (newValue) => {
            if (newValue === null) {
                resourceValue.value = new aasTypes.Resource('', '');
            } else {
                resourceValue.value = newValue;
                // Set toggle to 'url' if it's not a new shell and has a valid path
                if (!props.newShell && newValue.path && newValue.path.trim().length > 0) {
                    toggle.value = 'url';
                }
            }
            updateThumbnailPreview();
        }
    );

    watch(
        () => toggle.value,
        (newValue) => {
            if (newValue === 'none') {
                resourceValue.value = null;
                fileThumbnail.value = undefined;
                emit('update:fileThumbnail', undefined);
                thumbnailPreviewPath.value = '';
            } else if (newValue === 'url') {
                fileThumbnail.value = undefined;
                emit('update:fileThumbnail', undefined);
                if (resourceValue.value === null) {
                    resourceValue.value = new aasTypes.Resource('', '');
                }
                updateThumbnailPreview();
            } else if (newValue === 'file') {
                resourceValue.value = null;
                emit('update:modelValue', null);
                thumbnailPreviewPath.value = '';
            }
        }
    );

    onMounted(() => {
        // Initialize resourceValue if modelValue is null
        if (props.modelValue === null) {
            resourceValue.value = new aasTypes.Resource('', '');
        }
        updateThumbnailPreview();
    });

    async function updateThumbnailPreview(): Promise<void> {
        if (resourceValue.value === null || !resourceValue.value.path || resourceValue.value.path.trim() === '') {
            thumbnailPreviewPath.value = '';
            errorLoadingImage.value = false;
            return;
        }

        // Reset error state when updating preview
        errorLoadingImage.value = false;

        try {
            if (resourceValue.value.path.startsWith('http')) {
                // External URL - return it directly for external URLs
                thumbnailPreviewPath.value = resourceValue.value.path;
            } else if (props.aas) {
                // Internal path - construct the API endpoint and use getBlobUrl with authentication
                const apiPath = extractEndpointHref(props.aas, 'AAS-3.0') + '/asset-information/thumbnail';
                thumbnailPreviewPath.value = await getBlobUrl(apiPath, false);
            } else {
                thumbnailPreviewPath.value = '';
            }
        } catch (error) {
            console.error('Error updating thumbnail preview:', error);
            thumbnailPreviewPath.value = '';
            errorLoadingImage.value = true;
        }
    }
</script>
