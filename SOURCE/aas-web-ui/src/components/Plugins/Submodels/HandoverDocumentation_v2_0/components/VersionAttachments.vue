<template>
    <div v-if="hasAttachments(versionSmc)" class="mt-4">
        <v-tabs :model-value="fileTab" density="compact" color="primary" @update:model-value="onFileTabUpdate">
            <v-tab value="preview">Preview File</v-tab>
            <v-tab value="digital">Digital Files</v-tab>
        </v-tabs>

        <v-divider class="mt-2" />

        <v-window :model-value="fileTab" class="mt-3">
            <!-- Preview File -->
            <v-window-item value="preview">
                <!-- Render preview based on contentType -->
                <FilePreviewRenderer
                    v-if="previewFile?.value"
                    :file="previewFile"
                    download-label="Download Preview File" />

                <v-alert v-else text="No available preview file" density="compact" type="warning" variant="outlined" />
            </v-window-item>

            <!-- Digital Files-->
            <v-window-item value="digital">
                <template v-if="digitalFiles.length > 0">
                    <v-expansion-panels variant="accordion">
                        <v-expansion-panel
                            v-for="(fileEl, f) in digitalFiles"
                            :key="fileEl.id ?? fileEl.path ?? fileEl.idShort ?? `digital-${f}`">
                            <v-expansion-panel-title>
                                <v-list-item class="pa-0">
                                    <template #prepend>
                                        <v-icon size="small">mdi-attachment</v-icon>
                                    </template>
                                    <v-list-item-title>
                                        {{ nameToDisplay(fileEl) || fileEl.idShort || `Digital file ${f + 1}` }}
                                    </v-list-item-title>
                                </v-list-item>
                            </v-expansion-panel-title>

                            <v-expansion-panel-text class="pt-4">
                                <FilePreviewRenderer
                                    v-if="fileEl?.value"
                                    :file="fileEl"
                                    download-label="Download Digital File" />
                                <v-alert
                                    v-else
                                    class="w-100"
                                    text="No available digital file"
                                    density="compact"
                                    type="warning"
                                    variant="outlined" />
                            </v-expansion-panel-text>
                        </v-expansion-panel>
                    </v-expansion-panels>
                </template>
                <v-alert
                    v-else
                    class="w-100"
                    text="No available digital file"
                    density="compact"
                    type="warning"
                    variant="outlined" />
            </v-window-item>
        </v-window>
    </div>
</template>
<script lang="ts" setup>
    import type { FileTab, SubmodelElementLike } from '../types';
    import { computed, ref } from 'vue';
    import { useReferableUtils } from '@/composables/AAS/ReferableUtils';
    import { getDigitalFiles, getPreviewFile, hasAttachments } from '../utils/submodelElementUtils';

    defineOptions({
        name: 'VersionAttachments',
    });

    const { nameToDisplay } = useReferableUtils();

    const props = defineProps<{
        versionSmc?: SubmodelElementLike | null;
    }>();

    const fileTab = ref<FileTab>('preview');
    const versionSmc = computed(() => props.versionSmc ?? null);
    const previewFile = computed(() => getPreviewFile(versionSmc.value));
    const digitalFiles = computed(() => getDigitalFiles(versionSmc.value));

    function onFileTabUpdate(tab: unknown): void {
        fileTab.value = tab === 'digital' ? 'digital' : 'preview';
    }
</script>
