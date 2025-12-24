<template>
    <v-container fluid class="pa-0">
        <VisualizationHeader
            :submodel-element-data="submodelElementData"
            default-title="Handover Documentation"></VisualizationHeader>
        <!-- Loading -->
        <v-card v-if="isLoading" class="mb-4">
            <v-skeleton-loader type="list-item-avatar, divider, list-item-avatar" :height="144"></v-skeleton-loader>
        </v-card>
        <v-expansion-panels v-else-if="documents.length > 0" v-model="panel">
            <!-- Documents -->
            <v-expansion-panel v-for="(document, i) in documents" :key="document.idShort">
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
                <v-divider v-if="panel === i"></v-divider>
                <v-expansion-panel-text class="pt-4">
                    <template v-for="documentVersion in document.documentVersions" :key="documentVersion.idShort">
                        <!-- General Document Information (DocumentVersion) -->
                        <v-sheet border rounded>
                            <v-table>
                                <tbody>
                                    <template
                                        v-for="(metaProperty, j) in documentVersion.meta"
                                        :key="metaProperty.idShort">
                                        <tr
                                            v-if="hasValue(metaProperty)"
                                            :class="(j as number) % 2 === 0 ? 'bg-tableEven' : 'bg-tableOdd'">
                                            <td>
                                                <div class="text-subtitleText text-caption">
                                                    <span>{{ nameToDisplay(metaProperty) }}</span>
                                                    <DescriptionTooltip
                                                        :description-array="metaProperty?.description" />
                                                </div>
                                            </td>
                                            <td>
                                                <!-- Language -->
                                                <template v-if="checkIdShort(metaProperty, 'Language')">
                                                    <!-- Show english value, if available -->
                                                    <div v-if="valueToDisplay(metaProperty)" class="text-caption">
                                                        <template v-if="getLanguageName(valueToDisplay(metaProperty))">
                                                            {{ getLanguageName(valueToDisplay(metaProperty)) }}
                                                            ({{ valueToDisplay(metaProperty) }})
                                                        </template>
                                                        <template v-else>{{ valueToDisplay(metaProperty) }}</template>
                                                    </div>
                                                    <!-- Otherwise show all available values -->
                                                    <template
                                                        v-for="(langStringSet, k) in metaProperty.value"
                                                        v-else
                                                        :key="k">
                                                        <div v-if="langStringSet?.text.length > 0" class="text-caption">
                                                            <v-chip size="x-small" label class="mr-1">{{
                                                                langStringSet.language
                                                            }}</v-chip>
                                                            {{ langStringSet?.text }}
                                                        </div>
                                                    </template>
                                                </template>
                                                <!-- MultiLanguageProperties -->
                                                <template v-else-if="metaProperty.modelType == 'MultiLanguageProperty'">
                                                    <!-- Show english value, if available -->
                                                    <div v-if="valueToDisplay(metaProperty)" class="text-caption">
                                                        {{ valueToDisplay(metaProperty) }}
                                                    </div>
                                                    <!-- Otherwise show all available values -->
                                                    <template
                                                        v-for="(langStringSet, k) in metaProperty.value"
                                                        v-else
                                                        :key="k">
                                                        <div v-if="langStringSet?.text.length > 0" class="text-caption">
                                                            <v-chip size="x-small" label class="mr-1">{{
                                                                langStringSet.language
                                                            }}</v-chip>
                                                            {{ langStringSet?.text }}
                                                        </div>
                                                    </template>
                                                </template>
                                                <!-- Default -->
                                                <span v-else class="text-caption">
                                                    {{ valueToDisplay(metaProperty) }}
                                                </span>
                                            </td>
                                        </tr>
                                    </template>
                                </tbody>
                            </v-table>
                        </v-sheet>
                        <!-- Switcher for File Preview/Digital File -->
                        <v-row justify="center" class="my-1">
                            <v-col cols="auto">
                                <v-btn-toggle
                                    v-model="documentVersion.fileToggle"
                                    color="primary"
                                    variant="outlined"
                                    divided
                                    density="compact">
                                    <v-btn value="preview">
                                        <span>Preview File</span>
                                    </v-btn>
                                    <v-btn value="digital">
                                        <span>Digital File</span>
                                    </v-btn>
                                </v-btn-toggle>
                            </v-col>
                        </v-row>
                        <!-- File Preview (PreviewFile) -->
                        <template v-if="documentVersion.fileToggle === 'preview'">
                            <div v-if="documentVersion.previewFile">
                                <ImagePreview
                                    v-if="
                                        documentVersion.previewFile.contentType &&
                                        documentVersion.previewFile.contentType.includes('image')
                                    "
                                    :submodel-element-data="documentVersion.previewFile"></ImagePreview>
                                <PDFPreview
                                    v-else-if="
                                        documentVersion.previewFile.contentType &&
                                        documentVersion.previewFile.contentType.includes('pdf')
                                    "
                                    :submodel-element-data="documentVersion.previewFile"></PDFPreview>
                                <CADPreview
                                    v-else-if="
                                        documentVersion.previewFile.contentType &&
                                        (documentVersion.previewFile.contentType.includes('sla') ||
                                            documentVersion.previewFile.contentType.includes('stl') ||
                                            documentVersion.previewFile.contentType.includes('model') ||
                                            documentVersion.previewFile.contentType.includes('obj') ||
                                            documentVersion.previewFile.contentType.includes('gltf'))
                                    "
                                    :submodel-element-data="documentVersion.previewFile"></CADPreview>
                                <v-alert
                                    v-else
                                    text="No preview available for this file type"
                                    class="mt-3"
                                    density="compact"
                                    type="warning"
                                    variant="outlined"></v-alert>
                            </div>
                            <!-- Download Button -->
                            <v-card-actions class="pt-4 pb-0 pr-0">
                                <v-spacer></v-spacer>
                                <v-btn
                                    v-if="documentVersion.previewFile"
                                    size="small"
                                    color="primary"
                                    variant="elevated"
                                    prepend-icon="mdi-download"
                                    class="text-buttonText"
                                    @click="downloadFile(documentVersion.previewFile)">
                                    Download Preview File
                                </v-btn>
                                <v-alert
                                    v-else
                                    text="No available preview file"
                                    class="mt-3"
                                    density="compact"
                                    type="warning"
                                    variant="outlined"></v-alert>
                            </v-card-actions>
                        </template>
                        <!-- File Preview (DigitalFile) -->
                        <template v-else-if="documentVersion.fileToggle === 'digital'">
                            <div v-if="documentVersion.digitalFile" class="mt-3">
                                <ImagePreview
                                    v-if="
                                        documentVersion.digitalFile.contentType &&
                                        documentVersion.digitalFile.contentType.includes('image')
                                    "
                                    :submodel-element-data="documentVersion.digitalFile"></ImagePreview>
                                <PDFPreview
                                    v-else-if="
                                        documentVersion.digitalFile.contentType &&
                                        documentVersion.digitalFile.contentType.includes('pdf')
                                    "
                                    :submodel-element-data="documentVersion.digitalFile"></PDFPreview>
                                <CADPreview
                                    v-else-if="
                                        documentVersion.digitalFile.contentType &&
                                        (documentVersion.digitalFile.contentType.includes('sla') ||
                                            documentVersion.digitalFile.contentType.includes('stl') ||
                                            documentVersion.digitalFile.contentType.includes('model') ||
                                            documentVersion.digitalFile.contentType.includes('obj') ||
                                            documentVersion.digitalFile.contentType.includes('gltf'))
                                    "
                                    :submodel-element-data="documentVersion.digitalFile"></CADPreview>
                                <v-alert
                                    v-else
                                    text="No preview available for this file type"
                                    class="mt-3"
                                    density="compact"
                                    type="warning"
                                    variant="outlined"></v-alert>
                            </div>
                            <!-- Download Button -->
                            <v-card-actions class="pt-4 pb-0 pr-0">
                                <v-spacer></v-spacer>
                                <v-btn
                                    v-if="documentVersion.digitalFile"
                                    size="small"
                                    color="primary"
                                    variant="elevated"
                                    prepend-icon="mdi-download"
                                    class="text-buttonText"
                                    @click="downloadFile(documentVersion.digitalFile)">
                                    Download Digital File
                                </v-btn>
                                <v-alert
                                    v-else
                                    text="No available digital file"
                                    class="mt-3"
                                    density="compact"
                                    type="warning"
                                    variant="outlined"></v-alert>
                            </v-card-actions>
                        </template>
                    </template>
                    <!-- DocumentClassifications -->
                    <template v-if="document.documentClassificationSMCs.length > 0">
                        <v-card variant="outlined" class="mt-3">
                            <v-table>
                                <thead>
                                    <tr>
                                        <th
                                            v-for="classificationProperty in document.documentClassificationSMCs[0]
                                                .value"
                                            :key="classificationProperty.idShort">
                                            <div class="text-caption">
                                                <span>{{ nameToDisplay(classificationProperty) }}</span>
                                                <DescriptionTooltip
                                                    :description-array="classificationProperty?.description" />
                                            </div>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <template
                                        v-for="(documentClassificationSMC, j) in document.documentClassificationSMCs"
                                        :key="documentClassificationSMC.idShort">
                                        <tr
                                            v-if="hasValue(documentClassificationSMC)"
                                            :class="(j as number) % 2 === 0 ? 'bg-tableEven' : 'bg-tableOdd'">
                                            <td
                                                v-for="classificationProperty in documentClassificationSMC.value"
                                                :key="classificationProperty.idShort">
                                                <!-- MultiLanguageProperties -->
                                                <template
                                                    v-if="classificationProperty.modelType == 'MultiLanguageProperty'">
                                                    <!-- Show english value, if available -->
                                                    <div
                                                        v-if="valueToDisplay(classificationProperty)"
                                                        class="text-caption text-subtitleText">
                                                        {{ valueToDisplay(classificationProperty) }}
                                                    </div>
                                                    <!-- Otherwise show all available values -->
                                                    <template
                                                        v-for="(langStringSet, k) in classificationProperty.value"
                                                        v-else
                                                        :key="k">
                                                        <div v-if="langStringSet?.text.length > 0" class="text-caption">
                                                            <v-chip size="x-small" label class="mr-1">{{
                                                                langStringSet.language
                                                            }}</v-chip>
                                                            {{ langStringSet?.text }}
                                                        </div>
                                                    </template>
                                                </template>
                                                <!-- Default -->
                                                <span v-else class="text-caption text-subtitleText">
                                                    {{ valueToDisplay(classificationProperty) }}
                                                </span>
                                            </td>
                                        </tr>
                                    </template>
                                </tbody>
                            </v-table>
                        </v-card>
                    </template>
                    <!-- DocumentIds -->
                    <template v-if="document.documentIds.length > 0">
                        <v-card variant="outlined" class="mt-3">
                            <v-table>
                                <thead>
                                    <tr>
                                        <th
                                            v-for="idProperty in document.documentIds[0].value"
                                            :key="idProperty.idShort">
                                            <div class="text-caption">
                                                <span>{{ nameToDisplay(idProperty) }}</span>
                                                <DescriptionTooltip :description-array="idProperty?.description" />
                                            </div>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <template
                                        v-for="(documentIdSMC, j) in document.documentIds"
                                        :key="documentIdSMC.idShort">
                                        <tr
                                            v-if="hasValue(documentIdSMC)"
                                            :class="(j as number) % 2 === 0 ? 'bg-tableEven' : 'bg-tableOdd'">
                                            <td v-for="idProperty in documentIdSMC.value" :key="idProperty.idShort">
                                                <!-- MultiLanguageProperties -->
                                                <template v-if="idProperty.modelType == 'MultiLanguageProperty'">
                                                    <!-- Show english value, if available -->
                                                    <div
                                                        v-if="valueToDisplay(idProperty)"
                                                        class="text-caption text-subtitleText">
                                                        {{ valueToDisplay(idProperty) }}
                                                    </div>
                                                    <!-- Otherwise show all available values -->
                                                    <template
                                                        v-for="(langStringSet, k) in idProperty.value"
                                                        v-else
                                                        :key="k">
                                                        <div v-if="langStringSet?.text.length > 0" class="text-caption">
                                                            <v-chip size="x-small" label class="mr-1">{{
                                                                langStringSet.language
                                                            }}</v-chip>
                                                            {{ langStringSet?.text }}
                                                        </div>
                                                    </template>
                                                </template>
                                                <!-- Default -->
                                                <span v-else class="text-caption text-subtitleText">
                                                    {{ valueToDisplay(idProperty) }}
                                                </span>
                                            </td>
                                        </tr>
                                    </template>
                                </tbody>
                            </v-table>
                        </v-card>
                    </template>
                </v-expansion-panel-text>
            </v-expansion-panel>
        </v-expansion-panels>
    </v-container>
</template>

<script lang="ts" setup>
    import { onMounted, ref } from 'vue';
    import { useReferableUtils } from '@/composables/AAS/ReferableUtils';
    import { useSMHandling } from '@/composables/AAS/SMHandling';
    import { useSMEFile } from '@/composables/AAS/SubmodelElements/File';
    import { useSME } from '@/composables/AAS/SubmodelElements/SubmodelElement';
    import { getSubmodelElementBySemanticId, getSubmodelElementsBySemanticId } from '@/utils/AAS/SemanticIdUtils';
    import { getLanguageName } from '@/utils/LocaleUtils';

    // Options
    defineOptions({
        name: 'HandoverDocumentation',
        semanticId: '0173-1#01-AHF578#001',
    });

    // Composables
    const { setData } = useSMHandling();
    const { checkIdShort, nameToDisplay } = useReferableUtils();
    const { hasValue, valueToDisplay } = useSME();
    const { downloadFile } = useSMEFile();

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
    const documents = ref([] as Array<any>);

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

        documents.value = getSubmodelElementsBySemanticId(
            '0173-1#02-ABI500#001/0173-1#01-AHF579#001',
            handoverDocumentationData.value
        ).filter((sme: any) => {
            return hasValue(sme);
        });

        documents.value.forEach((document: any) => {
            extractDocumentVersions(document);

            // Extract Document IDs
            document.documentIds = getSubmodelElementsBySemanticId(
                '0173-1#02-ABI501#001/0173-1#01-AHF580#001',
                document
            ).filter((sme: any) => {
                return hasValue(sme);
            });

            // Extract Document Classifications
            document.documentClassificationSMCs = getSubmodelElementsBySemanticId(
                '0173-1#02-ABI502#001/0173-1#01-AHF581#001*02',
                document
            ).filter((sme: any) => {
                return hasValue(sme);
            });
        });

        isLoading.value = false;
    }

    function extractDocumentVersions(document: any): void {
        // Extract Document Version
        document.documentVersions = getSubmodelElementsBySemanticId(
            '0173-1#02-ABI503#001/0173-1#01-AHF582#001',
            document
        ).filter((sme: any) => {
            return hasValue(sme);
        });

        // Extract Digital File / Preview File / Meta data for each Document Version
        document.documentVersions.forEach((documentVersion: any) => {
            // Extract the Digital File
            documentVersion.digitalFile = getSubmodelElementBySemanticId('0173-1#02-ABI504', documentVersion);

            // Extract the Preview File
            documentVersion.previewFile = getSubmodelElementBySemanticId('0173-1#02-ABI505', documentVersion);

            // Extract Metadata
            documentVersion.meta = documentVersion.value.filter((documentVersionSME: any) => {
                return (
                    hasValue(documentVersionSME) &&
                    (checkIdShort(documentVersionSME, 'Language') ||
                        checkIdShort(documentVersionSME, 'Title') ||
                        checkIdShort(documentVersionSME, 'SubTitle') ||
                        checkIdShort(documentVersionSME, 'Summary') ||
                        checkIdShort(documentVersionSME, 'KeyWords'))
                );
            });

            documentVersion.fileToggle = 'preview';
        });
    }
</script>
