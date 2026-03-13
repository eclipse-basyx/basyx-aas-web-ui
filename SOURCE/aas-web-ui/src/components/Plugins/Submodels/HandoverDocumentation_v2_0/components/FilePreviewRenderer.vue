<template>
    <div>
        <template v-if="props.file">
            <ImagePreview v-if="isImageFile(props.file)" :submodel-element-data="props.file" />
            <PDFPreview v-else-if="isPdfFile(props.file)" :submodel-element-data="props.file" />
            <CADPreview v-else-if="isCADFile(props.file)" :submodel-element-data="props.file" />
            <v-alert
                v-else
                text="No preview available for this file type"
                density="compact"
                type="warning"
                variant="outlined"
                class="mt-3" />

            <v-card-actions v-if="showDownloadButton(props.file)" class="pt-4 pb-0 pr-0">
                <v-spacer />
                <v-btn
                    size="small"
                    color="primary"
                    variant="elevated"
                    prepend-icon="mdi-download"
                    class="text-buttonText"
                    @click="downloadFile(props.file)">
                    {{ props.downloadLabel }}
                </v-btn>
            </v-card-actions>
        </template>
        <v-alert v-else text="No file available" density="compact" type="warning" variant="outlined" />
    </div>
</template>
<script lang="ts" setup>
    import type { SubmodelElementLike } from '../types';
    import { useSMEFile } from '@/composables/AAS/SubmodelElements/File';

    defineOptions({
        name: 'FilePreviewRenderer',
    });

    const { downloadFile } = useSMEFile();

    const props = withDefaults(
        defineProps<{
            file?: SubmodelElementLike | null;
            downloadLabel?: string;
        }>(),
        {
            file: null,
            downloadLabel: 'Download File',
        }
    );

    function getContentType(file: SubmodelElementLike | null | undefined): string {
        return file?.contentType?.toLowerCase() ?? '';
    }

    function isImageFile(file: SubmodelElementLike | null | undefined): boolean {
        return getContentType(file).includes('image');
    }

    function isPdfFile(file: SubmodelElementLike | null | undefined): boolean {
        return getContentType(file).includes('pdf');
    }

    function isCADFile(file: SubmodelElementLike | null | undefined): boolean {
        const contentType = getContentType(file);
        return ['sla', 'stl', 'model', 'obj', 'gltf'].some((type) => contentType.includes(type));
    }

    function showDownloadButton(file: SubmodelElementLike | null | undefined): boolean {
        return !!file?.value;
    }
</script>
