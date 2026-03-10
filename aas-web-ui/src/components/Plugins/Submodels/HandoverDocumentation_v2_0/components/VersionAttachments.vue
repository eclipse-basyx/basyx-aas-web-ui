<template>
    <div v-if="hasAttachments(props.versionSmc)" class="mt-4">
        <v-tabs
            :model-value="getFileTab(props.versionSmc, props.versionIndex)"
            density="compact"
            color="primary"
            @update:model-value="(val) => setFileTab(props.versionSmc, props.versionIndex, val)">
            <v-tab value="preview">Preview File</v-tab>
            <v-tab value="digital">Digital Files</v-tab>
        </v-tabs>

        <v-divider class="mt-2" />

        <v-window :model-value="getFileTab(props.versionSmc, props.versionIndex)" class="mt-3">
            <!-- Preview File -->
            <v-window-item value="preview">
                <template v-for="pf in [getPreviewFile(props.versionSmc)]" :key="pf?.id ?? pf?.path ?? 'pf'">
                    <!-- Render preview based on contentType -->
                    <FilePreviewRenderer v-if="pf?.value" :file="pf" download-label="Download Preview File" />

                    <v-alert
                        v-else
                        text="No available preview file"
                        density="compact"
                        type="warning"
                        variant="outlined" />
                </template>
            </v-window-item>

            <!-- Digital Files-->
            <v-window-item value="digital">
                <template
                    v-for="(dfs, dfsIndex) in [getDigitalFiles(props.versionSmc)]"
                    :key="`dfs-${versionKey(props.versionSmc, dfsIndex)}-${dfsIndex}`">
                    <template v-if="dfs.length > 0">
                        <v-expansion-panels variant="accordion">
                            <v-expansion-panel
                                v-for="(fileEl, f) in dfs"
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
                        text="No available digital file"
                        density="compact"
                        type="warning"
                        variant="outlined" />
                </template>
            </v-window-item>
        </v-window>
    </div>
</template>
<script lang="ts" setup>
    import { ref } from 'vue';
    import { useReferableUtils } from '@/composables/AAS/ReferableUtils';

    defineOptions({
        name: 'VersionAttachments',
    });

    const { nameToDisplay } = useReferableUtils();

    type FileTab = 'preview' | 'digital';

    const props = defineProps({
        versionSmc: {
            type: Object as any,
            default: null,
        },
        versionIndex: {
            type: Number,
            required: true,
        },
    });

    const versionFileTab = ref<Record<string, FileTab>>({});

    function hasAttachments(versionSmc: any): boolean {
        return !!getPreviewFile(versionSmc) || getDigitalFiles(versionSmc).length > 0;
    }
    function getFileTab(versionSmc: any, index?: number): FileTab {
        const key = versionKey(versionSmc, index);
        return versionFileTab.value[key] ?? 'preview';
    }

    function setFileTab(versionSmc: any, index: number, tab: FileTab): void {
        const key = versionKey(versionSmc, index);
        versionFileTab.value[key] = tab;
    }
    function getPreviewFile(versionSmc: any): any | null {
        const children = versionSmc?.value ?? [];
        return children.find((c: any) => c?.modelType === 'File' && c?.idShort === 'PreviewFile') ?? null;
    }

    function getDigitalFiles(versionSmc: any): any[] {
        const children = versionSmc?.value ?? [];
        const digitalFilesSml = children.find(
            (c: any) => c?.modelType === 'SubmodelElementList' && c?.idShort === 'DigitalFiles'
        );
        return Array.isArray(digitalFilesSml?.value) ? digitalFilesSml.value : [];
    }
    function versionKey(versionSmc: any, index?: number): string {
        return versionSmc?.id ?? versionSmc?.path ?? versionSmc?.idShort ?? `version-${index ?? 'unknown'}`;
    }
</script>
