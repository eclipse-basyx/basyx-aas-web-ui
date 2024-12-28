<template>
    <v-container fluid class="pa-0">
        <VisualizationHeader
            :submodel-element-data="submodelElementData"
            default-title="Handover Documentation"></VisualizationHeader>
        <!-- Loading -->
        <v-card v-if="isLoading">
            <v-skeleton-loader type="list-item-avatar, divider, list-item-avatar" :height="144"></v-skeleton-loader>
        </v-card>
        <v-expansion-panels v-else v-model="panel">
            <!-- Documents -->
            <v-expansion-panel v-for="(documentSMC, i) in documentSMCs" :key="documentSMC.idShort">
                <v-expansion-panel-title>
                    <v-list-item class="pa-0">
                        <template #prepend>
                            <v-icon size="small">mdi-file-outline</v-icon>
                        </template>
                        <v-list-item-title>{{ nameToDisplay(documentSMC) }}</v-list-item-title>
                    </v-list-item>
                </v-expansion-panel-title>
                <v-divider v-if="panel === i"></v-divider>
                <v-expansion-panel-text>
                    <template
                        v-for="documentVersionSMC in documentSMC.documentVersions"
                        :key="documentVersionSMC.idShort">
                        <!-- General Document Information (DocumentVersion) -->
                        <v-table>
                            <tbody>
                                <template
                                    v-for="(metaProperty, j) in documentVersionSMC.meta"
                                    :key="metaProperty.idShort">
                                    <tr
                                        v-if="hasValue(metaProperty)"
                                        :class="j % 2 === 0 ? 'bg-tableEven' : 'bg-tableOdd'">
                                        <td>
                                            <div class="text-subtitleText text-caption">
                                                <span>{{ nameToDisplay(metaProperty) }}</span>
                                                <!-- Show english description, if available -->
                                                <v-tooltip
                                                    v-if="descriptionToDisplay(metaProperty)"
                                                    activator="parent"
                                                    open-delay="600"
                                                    transition="slide-y-transition"
                                                    max-width="360px"
                                                    location="bottom">
                                                    <div class="text-caption">
                                                        {{ descriptionToDisplay(metaProperty) }}
                                                    </div>
                                                </v-tooltip>
                                                <!-- Otherwise show all available descriptions -->
                                                <v-tooltip
                                                    v-else-if="
                                                        metaProperty.description && metaProperty.description.length > 0
                                                    "
                                                    activator="parent"
                                                    open-delay="600"
                                                    transition="slide-y-transition"
                                                    max-width="360px"
                                                    location="bottom">
                                                    <div
                                                        v-for="(description, k) in metaProperty.description"
                                                        :key="k"
                                                        class="text-caption">
                                                        <span class="font-weight-bold">
                                                            {{ description.language + ': ' }}
                                                        </span>
                                                        {{ description.text }}
                                                    </div>
                                                </v-tooltip>
                                            </div>
                                        </td>
                                        <td>
                                            <!-- Language -->
                                            <template v-if="checkIdShort(metaProperty, 'Language')">
                                                <div v-if="valueToDisplay(metaProperty)" class="text-caption">
                                                    <template v-if="getLanguageName(valueToDisplay(metaProperty))">
                                                        {{ getLanguageName(valueToDisplay(metaProperty)) }}
                                                        ({{ valueToDisplay(metaProperty) }})
                                                    </template>
                                                    <template v-else>{{ valueToDisplay(metaProperty) }}</template>
                                                </div>
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
                                                        <span class="font-weight-bold">
                                                            {{ langStringSet?.language + ': ' }}
                                                        </span>
                                                        {{ langStringSet?.text }}
                                                    </div>
                                                </template>
                                            </template>
                                            <!-- Default -->
                                            <span v-else class="text-caption">{{ valueToDisplay(metaProperty) }}</span>
                                        </td>
                                    </tr>
                                </template>
                            </tbody>
                        </v-table>
                        <!-- Switcher for File Preview/Digital File -->
                        <v-row justify="center" class="mt-3">
                            <v-col cols="auto">
                                <v-btn-toggle
                                    v-model="documentVersionSMC.fileToggle"
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
                        <template v-if="documentVersionSMC.fileToggle === 'preview'">
                            <div v-if="documentVersionSMC.previewFile" class="mt-3">
                                <ImagePreview
                                    v-if="
                                        documentVersionSMC.previewFile.contentType &&
                                        documentVersionSMC.previewFile.contentType.includes('image')
                                    "
                                    :submodel-element-data="documentVersionSMC.previewFile"></ImagePreview>
                                <PDFPreview
                                    v-if="
                                        documentVersionSMC.previewFile.contentType &&
                                        documentVersionSMC.previewFile.contentType.includes('pdf')
                                    "
                                    :submodel-element-data="documentVersionSMC.previewFile"></PDFPreview>
                                <CADPreview
                                    v-if="
                                        documentVersionSMC.previewFile.contentType &&
                                        (documentVersionSMC.previewFile.contentType.includes('sla') ||
                                            documentVersionSMC.previewFile.contentType.includes('stl') ||
                                            documentVersionSMC.previewFile.contentType.includes('model') ||
                                            documentVersionSMC.previewFile.contentType.includes('obj') ||
                                            documentVersionSMC.previewFile.contentType.includes('gltf'))
                                    "
                                    :submodel-element-data="documentVersionSMC.previewFile"></CADPreview>
                            </div>
                            <!-- Download Button -->
                            <v-btn
                                v-if="documentVersionSMC.previewFile"
                                class="mt-3"
                                block
                                color="primary"
                                variant="tonal"
                                @click="downloadFile(documentVersionSMC.previewFile)">
                                <v-icon left>mdi-download</v-icon>
                                <span>Download Preview File</span>
                            </v-btn>
                            <v-alert
                                v-else
                                text="No available preview file"
                                class="mt-3"
                                density="compact"
                                type="warning"
                                variant="outlined"></v-alert>
                        </template>
                        <!-- File Preview (DigitalFile) -->
                        <template v-else-if="documentVersionSMC.fileToggle === 'digital'">
                            <div v-if="documentVersionSMC.digitalFile" class="mt-3">
                                <ImagePreview
                                    v-if="
                                        documentVersionSMC.digitalFile.contentType &&
                                        documentVersionSMC.digitalFile.contentType.includes('image')
                                    "
                                    :submodel-element-data="documentVersionSMC.digitalFile"></ImagePreview>
                                <PDFPreview
                                    v-if="
                                        documentVersionSMC.digitalFile.contentType &&
                                        documentVersionSMC.digitalFile.contentType.includes('pdf')
                                    "
                                    :submodel-element-data="documentVersionSMC.digitalFile"></PDFPreview>
                                <CADPreview
                                    v-if="
                                        documentVersionSMC.digitalFile.contentType &&
                                        (documentVersionSMC.digitalFile.contentType.includes('sla') ||
                                            documentVersionSMC.digitalFile.contentType.includes('stl') ||
                                            documentVersionSMC.digitalFile.contentType.includes('model') ||
                                            documentVersionSMC.digitalFile.contentType.includes('obj') ||
                                            documentVersionSMC.digitalFile.contentType.includes('gltf'))
                                    "
                                    :submodel-element-data="documentVersionSMC.digitalFile"></CADPreview>
                            </div>
                            <!-- Download Button -->
                            <v-btn
                                v-if="documentVersionSMC.digitalFile"
                                class="mt-3"
                                block
                                color="primary"
                                variant="tonal"
                                @click="downloadFile(documentVersionSMC.digitalFile)">
                                <v-icon left>mdi-download</v-icon>
                                <span>Download Digital File</span>
                            </v-btn>
                            <v-alert
                                v-else
                                text="No available digital file"
                                class="mt-3"
                                density="compact"
                                type="warning"
                                variant="outlined"></v-alert>
                        </template>
                    </template>
                    <!-- DocumentClassifications -->
                    <v-card variant="outlined" class="mt-3">
                        <v-table>
                            <thead>
                                <tr v-if="documentSMC.documentClassifications.length > 0">
                                    <th
                                        v-for="classificationProperty in documentSMC.documentClassifications[0].value"
                                        :key="classificationProperty.idShort">
                                        <div class="text-caption">
                                            <span>{{ nameToDisplay(classificationProperty) }}</span>
                                            <!-- Show english description, if available -->
                                            <v-tooltip
                                                v-if="descriptionToDisplay(classificationProperty)"
                                                activator="parent"
                                                open-delay="600"
                                                transition="slide-y-transition"
                                                max-width="360px"
                                                location="bottom">
                                                <div class="text-caption">
                                                    {{ descriptionToDisplay(classificationProperty) }}
                                                </div>
                                            </v-tooltip>
                                            <!-- Otherwise show all available descriptions -->
                                            <v-tooltip
                                                v-else-if="
                                                    classificationProperty.description &&
                                                    classificationProperty.description.length > 0
                                                "
                                                activator="parent"
                                                open-delay="600"
                                                transition="slide-y-transition"
                                                max-width="360px"
                                                location="bottom">
                                                <div
                                                    v-for="(description, j) in classificationProperty.description"
                                                    :key="j"
                                                    class="text-caption">
                                                    <span class="font-weight-bold">
                                                        {{ description.language + ': ' }}
                                                    </span>
                                                    {{ description.text }}
                                                </div>
                                            </v-tooltip>
                                        </div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                <template
                                    v-for="(documentClassificationSMC, j) in documentSMC.documentClassifications"
                                    :key="documentClassificationSMC.idShort">
                                    <tr
                                        v-if="hasValue(documentClassificationSMC)"
                                        :class="j % 2 === 0 ? 'bg-tableEven' : 'bg-tableOdd'">
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
                                                    <div
                                                        v-if="langStringSet?.text.length > 0"
                                                        class="text-caption text-subtitleText">
                                                        <span class="font-weight-bold">
                                                            {{ langStringSet?.language + ': ' }}
                                                        </span>
                                                        {{ langStringSet?.text }}
                                                    </div>
                                                </template>
                                            </template>
                                            <!-- Default -->
                                            <span v-else class="text-caption text-subtitleText">{{
                                                valueToDisplay(classificationProperty)
                                            }}</span>
                                        </td>
                                    </tr>
                                </template>
                            </tbody>
                        </v-table>
                    </v-card>
                    <!-- DocumentIds -->
                    <v-card variant="outlined" class="mt-3">
                        <v-table>
                            <thead>
                                <tr v-if="documentSMC.documentIds.length > 0">
                                    <th
                                        v-for="idProperty in documentSMC.documentIds[0].value"
                                        :key="idProperty.idShort">
                                        <div class="text-caption">
                                            <span>{{ nameToDisplay(idProperty) }}</span>
                                            <!-- Show english description, if available -->
                                            <v-tooltip
                                                v-if="descriptionToDisplay(idProperty)"
                                                activator="parent"
                                                open-delay="600"
                                                transition="slide-y-transition"
                                                max-width="360px"
                                                location="bottom">
                                                <div class="text-caption">
                                                    {{ descriptionToDisplay(idProperty) }}
                                                </div>
                                            </v-tooltip>
                                            <!-- Otherwise show all available descriptions -->
                                            <v-tooltip
                                                v-else-if="idProperty.description && idProperty.description.length > 0"
                                                activator="parent"
                                                open-delay="600"
                                                transition="slide-y-transition"
                                                max-width="360px"
                                                location="bottom">
                                                <div
                                                    v-for="(description, j) in idProperty.description"
                                                    :key="j"
                                                    class="text-caption">
                                                    <span class="font-weight-bold">
                                                        {{ description.language + ': ' }}
                                                    </span>
                                                    {{ description.text }}
                                                </div>
                                            </v-tooltip>
                                        </div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                <template
                                    v-for="(documentIdSMC, j) in documentSMC.documentIds"
                                    :key="documentIdSMC.idShort">
                                    <tr
                                        v-if="hasValue(documentIdSMC)"
                                        :class="j % 2 === 0 ? 'bg-tableEven' : 'bg-tableOdd'">
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
                                                    <div
                                                        v-if="langStringSet?.text.length > 0"
                                                        class="text-caption text-subtitleText">
                                                        <span class="font-weight-bold">
                                                            {{ langStringSet?.language + ': ' }}
                                                        </span>
                                                        {{ langStringSet?.text }}
                                                    </div>
                                                </template>
                                            </template>
                                            <!-- Default -->
                                            <span v-else class="text-caption text-subtitleText">{{
                                                valueToDisplay(idProperty)
                                            }}</span>
                                        </td>
                                    </tr>
                                </template>
                            </tbody>
                        </v-table>
                    </v-card>
                </v-expansion-panel-text>
            </v-expansion-panel>
        </v-expansion-panels>
    </v-container>
</template>

<script lang="ts" setup>
    import { computed, onMounted, ref } from 'vue';
    import { useAASStore } from '@/store/AASDataStore';
    import { getLanguageName } from '@/utils/LocaleUtils';
    import { checkIdShort, descriptionToDisplay, nameToDisplay } from '@/utils/ReferableUtils';
    import { getSubmodelElementBySemanticId, getSubmodelElementsBySemanticId } from '@/utils/SemanticIdUtils';
    import { downloadFile } from '@/utils/SubmodelElements/FileUtils';
    import {
        calculateSubmodelElementPaths,
        hasValue,
        valueToDisplay,
    } from '@/utils/SubmodelElements/SubmodelElementUtils';

    // Define component options such as custom static properties
    defineOptions({
        name: 'HandoverDocumentation',
        semanticId: '0173-1#01-AHF578#001',
    });

    // Stores
    const aasStore = useAASStore();

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
    const documentSMCs = ref([] as Array<any>);

    // Computed Properties
    const selectedNode = computed(() => aasStore.getSelectedNode);

    onMounted(() => {
        initializeVisualization();
    });

    async function initializeVisualization() {
        // console.log('initializeVisualization()', 'props', props);
        isLoading.value = true;

        if (!props.submodelElementData || Object.keys(props.submodelElementData).length === 0) {
            handoverDocumentationData.value = {};
            isLoading.value = false;
            return;
        }

        handoverDocumentationData.value = await calculateSubmodelElementPaths(
            { ...props.submodelElementData },
            selectedNode.value.path
        );

        documentSMCs.value = getSubmodelElementsBySemanticId(
            '0173-1#02-ABI500#001/0173-1#01-AHF579#001',
            handoverDocumentationData.value
        );

        documentSMCs.value.forEach((documentSMC: any) => {
            extractDocumentVersions(documentSMC);

            // Extract Document IDs
            documentSMC.documentIds = getSubmodelElementsBySemanticId(
                '0173-1#02-ABI501#001/0173-1#01-AHF580#001',
                documentSMC
            );

            // Extract Document Classifications
            documentSMC.documentClassifications = getSubmodelElementsBySemanticId(
                '0173-1#02-ABI502#001/0173-1#01-AHF581#001*02',
                documentSMC
            );
        });

        isLoading.value = false;
    }

    function extractDocumentVersions(documentSMC: any) {
        // Extract Document Version
        documentSMC.documentVersions = getSubmodelElementsBySemanticId(
            '0173-1#02-ABI503#001/0173-1#01-AHF582#001',
            documentSMC
        );

        // Extract Digital File / Preview File / Meta data for each Document Version
        documentSMC.documentVersions.forEach((documentVersionSMC: any) => {
            // Extract the Digital File
            documentVersionSMC.digitalFile = getSubmodelElementBySemanticId('0173-1#02-ABI504', documentVersionSMC);

            // Extract the Preview File
            documentVersionSMC.previewFile = getSubmodelElementBySemanticId('0173-1#02-ABI505', documentVersionSMC);

            // Extract Meta Data
            documentVersionSMC.meta = documentVersionSMC.value.filter((documentVersionSME: any) => {
                return (
                    checkIdShort(documentVersionSME, 'Language') ||
                    checkIdShort(documentVersionSME, 'Title') ||
                    checkIdShort(documentVersionSME, 'SubTitle') ||
                    checkIdShort(documentVersionSME, 'Summary') ||
                    checkIdShort(documentVersionSME, 'KeyWords')
                );
            });

            documentVersionSMC.fileToggle = 'preview';
        });
    }
</script>
