<template>
    <v-container fluid class="pa-0">
        <VisualizationHeader :submodel-element-data="submodelElementData" default-title="Handover Documentation" />
        <!-- Loading -->
        <v-card v-if="isLoading" class="mb-4">
            <v-skeleton-loader type="list-item-avatar, divider, list-item-avatar" :height="144" />
        </v-card>
        <template v-else>
            <v-expansion-panels v-if="documents.length > 0" v-model="panel">
                <v-expansion-panel v-for="(document, i) in documents" :key="document.idShort ?? i">
                    <v-expansion-panel-title>
                        <v-list-item class="pa-0">
                            <template #prepend>
                                <v-icon size="small">mdi-file-outline</v-icon>
                            </template>

                            <v-list-item-title>
                                {{ nameToDisplay(document) }}
                                <DescriptionTooltip :description-array="document?.description" />
                            </v-list-item-title>
                        </v-list-item>
                    </v-expansion-panel-title>

                    <v-divider v-if="panel === i" />

                    <v-expansion-panel-text class="pt-4">
                        <!-- DocumentIds -->
                        <DocumentIdsTable :document-ids="document.documentIds" />

                        <!-- Document Versions -->
                        <template v-if="(document.documentVersionInfo ?? []).length > 0">
                            <div class="text-caption text-subtitleText">
                                <template v-if="(document.documentVersionInfo ?? []).length > 0">
                                    <!-- Tabs for document versions-  -->
                                    <v-tabs
                                        :model-value="getVersionTab(document)"
                                        density="comfortable"
                                        color="primary"
                                        class="mt-2"
                                        @update:model-value="(val) => setVersionTab(document, val)">
                                        <v-tab
                                            v-for="(versionSmc, v) in document.documentVersionInfo ?? []"
                                            :key="versionSmc.id ?? versionSmc.idShort ?? `version-${v}`"
                                            :value="v">
                                            {{ nameToDisplay(versionSmc) }}
                                        </v-tab>
                                    </v-tabs>
                                    <v-divider class="mt-2" />
                                    <v-window :model-value="getVersionTab(document)" class="mt-3">
                                        <v-window-item
                                            v-for="(versionSmc, v) in document.documentVersionInfo ?? []"
                                            :key="versionSmc.id ?? versionSmc.idShort ?? `version-${v}`"
                                            :value="v">
                                            <div class="pt-4">
                                                <!-- Table for Version Metadata -->
                                                <VersionMetadataTable :version-smc="versionSmc" />

                                                <!-- Tabs for File and Digital Files -->
                                                <VersionAttachments
                                                    :version-smc="versionSmc"
                                                    :version-index="Number(v)" />
                                            </div>
                                        </v-window-item>
                                    </v-window>
                                </template>
                            </div>
                        </template>

                        <v-alert
                            v-else
                            class="mt-3"
                            density="compact"
                            type="warning"
                            variant="outlined"
                            text="No Document Versions available" />
                        <!-- <div class="mt-6 text-subtitle-2">Document Classifications (TODO)</div> -->
                        <!-- <div class="mt-3 text-subtitle-2">Documented Entities (TODO)</div> -->
                    </v-expansion-panel-text>
                </v-expansion-panel>
            </v-expansion-panels>

            <v-alert
                v-else
                class="mt-3"
                density="compact"
                type="info"
                variant="outlined"
                text="No Documents available" />
        </template>
    </v-container>
</template>

<script lang="ts" setup>
    import { onMounted, ref } from 'vue';
    import { useReferableUtils } from '@/composables/AAS/ReferableUtils';
    import { useSMHandling } from '@/composables/AAS/SMHandling';
    import { useSME } from '@/composables/AAS/SubmodelElements/SubmodelElement';
    import { getSubmodelElementBySemanticId, getSubmodelElementsBySemanticId } from '@/utils/AAS/SemanticIdUtils';

    defineOptions({
        name: 'HandoverDocumentation',
        semanticId: '0173-1#01-AHF578#003',
    });
    // Composables
    const { setData } = useSMHandling();
    const { nameToDisplay } = useReferableUtils();
    const { hasValue } = useSME();

    // Properties
    const props = defineProps({
        submodelElementData: {
            type: Object as any,
            default: {} as any,
        },
    });

    // Data
    const isLoading = ref(false);
    const handoverDocumentationData = ref({} as any);
    const panel = ref(null as number | null);
    const documents = ref([] as any);
    const documentsSml = ref<any>(null);
    const versionTab = ref<Record<string, number>>({});

    onMounted(() => {
        initializeVisualization();
    });

    async function initializeVisualization(): Promise<void> {
        isLoading.value = true;

        if (!props.submodelElementData || Object.keys(props.submodelElementData).length === 0) {
            handoverDocumentationData.value = {};
            isLoading.value = false;
            return;
        }

        handoverDocumentationData.value = await setData(
            { ...props.submodelElementData },
            props.submodelElementData.path
        );

        //  Get Documents SML
        documentsSml.value = getSubmodelElementBySemanticId('0173-1#02-ABI500#003', handoverDocumentationData.value);
        if (
            !documentsSml.value?.value ||
            !Array.isArray(documentsSml.value.value) ||
            documentsSml.value.value.length === 0
        ) {
            documents.value = [];
            isLoading.value = false;
            return;
        }
        //  Get Document SMC entries (many)
        const documentSmcs = getSubmodelElementsBySemanticId(
            '0173-1#02-ABI500#003/0173-1#01-AHF579#003',
            documentsSml.value
        );
        documents.value = documentSmcs;

        //  For each Document → get Document data
        documents.value.forEach((doc: any) => {
            //function for Document Versions
            extractDocumentVersionInfo(doc);

            //function for DocumentIds
            // Get DocumentIds SML (container, one per document)
            const documentIdsSml = getSubmodelElementBySemanticId('0173-1#02-ABI501#003', doc);
            if (!documentIdsSml || !documentIdsSml.value) {
                doc.documentIds = [];
                return;
            }

            // Get DocumentId SMC entries (many)
            const documentIdSmcs = getSubmodelElementsBySemanticId(
                '0173-1#02-ABI501#003/0173-1#01-AHF580#003',
                documentIdsSml
            );

            doc.documentIds = documentIdSmcs;
        });
        isLoading.value = false;
    }

    function extractDocumentVersionInfo(doc: any): void {
        // Get Document Version Info SML (container, one per document)
        const documentVersionInfoSml = getSubmodelElementBySemanticId('0173-1#02-ABI503#003', doc);

        if (
            !documentVersionInfoSml ||
            !Array.isArray(documentVersionInfoSml.value) ||
            documentVersionInfoSml.value.length === 0
        ) {
            doc.documentVersionInfo = [];
            return;
        }
        // Get Document Version Info SMC entries (many)
        const documentVersionInfoSmcs = getSubmodelElementsBySemanticId(
            '0173-1#02-ABI503#003/0173-1#01-AHF582#003',
            documentVersionInfoSml
        ).filter((sme: any) => hasValue(sme));

        doc.documentVersionInfo = documentVersionInfoSmcs;
        return;
    }
    function getVersionTab(document: any): number {
        const key = document?.id ?? document?.idShort ?? 'doc';
        return versionTab.value[key] ?? 0;
    }
    function setVersionTab(document: any, index: number): void {
        const key = document?.id ?? document?.idShort ?? 'doc';
        versionTab.value[key] = index;
    }
</script>
