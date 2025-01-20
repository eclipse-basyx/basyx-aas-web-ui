<template>
    <v-container fluid class="pa-0">
        <!-- Header -->
        <v-card class="mb-4">
            <v-card-title>
                <div class="text-subtitle-1">
                    {{ nameToDisplay(submodelElementData, 'en', 'Handover Documentation') }}
                </div>
            </v-card-title>
            <v-card-text v-if="descriptionToDisplay(submodelElementData)" class="pt-0">
                {{ descriptionToDisplay(submodelElementData) }}
            </v-card-text>
        </v-card>
        <!-- Documents -->
        <v-card v-if="loading">
            <v-skeleton-loader type="list-item-avatar, divider, list-item-avatar" :height="144"></v-skeleton-loader>
        </v-card>
        <v-expansion-panels v-else v-model="panel">
            <v-expansion-panel v-for="(document, index) in documents" :key="document.idShort">
                <v-expansion-panel-title>
                    <v-list-item class="pa-0">
                        <template #prepend>
                            <v-icon size="small">mdi-file-outline</v-icon>
                        </template>
                        <v-list-item-title>{{ nameToDisplay(document) }}</v-list-item-title>
                    </v-list-item>
                </v-expansion-panel-title>
                <v-divider v-if="panel === index"></v-divider>
                <v-expansion-panel-text>
                    <template v-for="documentVersion in document.documentVersions" :key="documentVersion.idShort">
                        <!-- General Document Information (DocumentVersion) -->
                        <v-table>
                            <tbody>
                                <tr
                                    v-for="(versionPropertie, index) in documentVersion.meta"
                                    :key="versionPropertie.idShort"
                                    :class="index % 2 === 0 ? 'bg-tableEven' : 'bg-tableOdd'">
                                    <td>
                                        <div class="text-subtitleText text-caption">
                                            <span>{{ versionPropertie.idShort }}</span>
                                            <v-tooltip
                                                v-if="
                                                    versionPropertie.description &&
                                                    versionPropertie.description.length > 0
                                                "
                                                activator="parent"
                                                open-delay="600"
                                                transition="slide-y-transition"
                                                max-width="360px"
                                                location="bottom">
                                                <div
                                                    v-for="(description, i) in versionPropertie.description"
                                                    :key="i"
                                                    class="text-caption">
                                                    <span class="font-weight-bold">{{
                                                        description.language + ': '
                                                    }}</span
                                                    >{{ description.text }}
                                                </div>
                                            </v-tooltip>
                                        </div>
                                    </td>
                                    <td>
                                        <!-- MultiLanguageProperties -->
                                        <template v-if="versionPropertie.modelType == 'MultiLanguageProperty'">
                                            <v-list-item class="pl-0">
                                                <v-list-item-title class="text-caption">{{
                                                    versionPropertie.value[0].text
                                                }}</v-list-item-title>
                                            </v-list-item>
                                        </template>
                                        <!-- Default -->
                                        <span v-else class="text-caption">{{ versionPropertie.value }}</span>
                                    </td>
                                </tr>
                            </tbody>
                        </v-table>
                        <!-- Switcher for File Preview/Digital File -->
                        <v-row justify="center" class="mt-3">
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
                            <div v-if="documentVersion.previewFile" class="mt-3">
                                <ImagePreview
                                    v-if="
                                        documentVersion.previewFile.contentType &&
                                        documentVersion.previewFile.contentType.includes('image')
                                    "
                                    :submodel-element-data="documentVersion.previewFile"></ImagePreview>
                                <PDFPreview
                                    v-if="
                                        documentVersion.previewFile.contentType &&
                                        documentVersion.previewFile.contentType.includes('pdf')
                                    "
                                    :submodel-element-data="documentVersion.previewFile"></PDFPreview>
                                <CADPreview
                                    v-if="
                                        documentVersion.previewFile.contentType &&
                                        (documentVersion.previewFile.contentType.includes('sla') ||
                                            documentVersion.previewFile.contentType.includes('stl') ||
                                            documentVersion.previewFile.contentType.includes('model') ||
                                            documentVersion.previewFile.contentType.includes('obj') ||
                                            documentVersion.previewFile.contentType.includes('gltf'))
                                    "
                                    :submodel-element-data="documentVersion.previewFile"></CADPreview>
                            </div>
                            <!-- Download Button -->
                            <v-btn
                                v-if="documentVersion.previewFile"
                                class="mt-3"
                                block
                                color="primary"
                                variant="tonal"
                                @click="downloadFile(documentVersion.previewFile)">
                                <v-icon left>mdi-download</v-icon>
                                <span>Download Preview File</span>
                            </v-btn>
                            <v-alert
                                v-else
                                text="No preview file found!"
                                class="mt-3"
                                density="compact"
                                type="warning"
                                variant="outlined"></v-alert>
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
                                    v-if="
                                        documentVersion.digitalFile.contentType &&
                                        documentVersion.digitalFile.contentType.includes('pdf')
                                    "
                                    :submodel-element-data="documentVersion.digitalFile"></PDFPreview>
                                <CADPreview
                                    v-if="
                                        documentVersion.digitalFile.contentType &&
                                        (documentVersion.digitalFile.contentType.includes('sla') ||
                                            documentVersion.digitalFile.contentType.includes('stl') ||
                                            documentVersion.digitalFile.contentType.includes('model') ||
                                            documentVersion.digitalFile.contentType.includes('obj') ||
                                            documentVersion.digitalFile.contentType.includes('gltf'))
                                    "
                                    :submodel-element-data="documentVersion.digitalFile"></CADPreview>
                            </div>
                            <!-- Download Button -->
                            <v-btn
                                v-if="documentVersion.digitalFile"
                                class="mt-3"
                                block
                                color="primary"
                                variant="tonal"
                                @click="downloadFile(documentVersion.digitalFile)">
                                <v-icon left>mdi-download</v-icon>
                                <span>Download Digital File</span>
                            </v-btn>
                            <v-alert
                                v-else
                                text="No digital file found!"
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
                                <tr v-if="document.documentClassifications.length > 0">
                                    <th
                                        v-for="classificationProperty in document.documentClassifications[0].value"
                                        :key="classificationProperty.idShort">
                                        <v-list-item class="pl-0">
                                            <v-list-item-title class="text-caption">{{
                                                classificationProperty.idShort
                                            }}</v-list-item-title>
                                        </v-list-item>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr
                                    v-for="(documentClassification, index) in document.documentClassifications"
                                    :key="documentClassification.idShort"
                                    :class="index % 2 === 0 ? 'bg-tableOdd' : 'bg-tableEven'">
                                    <td
                                        v-for="classificationProperty in documentClassification.value"
                                        :key="classificationProperty.idShort">
                                        <!-- MultiLanguageProperties -->
                                        <template v-if="classificationProperty.modelType == 'MultiLanguageProperty'">
                                            <v-list-item class="pl-0">
                                                <span class="text-caption text-subtitleText">{{
                                                    classificationProperty.value[0].text
                                                }}</span>
                                            </v-list-item>
                                        </template>
                                        <!-- Default -->
                                        <span v-else class="text-caption text-subtitleText">{{
                                            classificationProperty.value
                                        }}</span>
                                    </td>
                                </tr>
                            </tbody>
                        </v-table>
                    </v-card>
                    <!-- DocumentIds -->
                    <v-card variant="outlined" class="mt-3">
                        <v-table>
                            <thead>
                                <tr v-if="document.documentIds.length > 0">
                                    <th v-for="idProperty in document.documentIds[0].value" :key="idProperty.idShort">
                                        <v-list-item class="pl-0">
                                            <v-list-item-title class="text-caption">{{
                                                nameToDisplay(idProperty)
                                            }}</v-list-item-title>
                                        </v-list-item>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr
                                    v-for="(documentId, index) in document.documentIds"
                                    :key="documentId.idShort"
                                    :class="index % 2 === 0 ? 'bg-tableOdd' : 'bg-tableEven'">
                                    <td v-for="idProperty in documentId.value" :key="idProperty.idShort">
                                        <!-- MultiLanguageProperties -->
                                        <template v-if="idProperty.modelType == 'MultiLanguageProperty'">
                                            <v-list-item class="pl-0">
                                                <span class="text-caption text-subtitleText">{{
                                                    idProperty.value[0].text
                                                }}</span>
                                            </v-list-item>
                                        </template>
                                        <!-- Default -->
                                        <span v-else class="text-caption text-subtitleText">{{
                                            idProperty.value
                                        }}</span>
                                    </td>
                                </tr>
                            </tbody>
                        </v-table>
                    </v-card>
                </v-expansion-panel-text>
            </v-expansion-panel>
        </v-expansion-panels>
    </v-container>
</template>

// TODO Transfer to composition API
<script lang="ts">
    import { defineComponent } from 'vue';
    import { useTheme } from 'vuetify';
    import RequestHandling from '@/mixins/RequestHandling';
    import SubmodelElementHandling from '@/mixins/SubmodelElementHandling';
    import { useAASStore } from '@/store/AASDataStore';

    export default defineComponent({
        name: 'HandoverDocumentation',
        semanticId: '0173-1#01-AHF578#001',
        mixins: [RequestHandling, SubmodelElementHandling],
        props: ['submodelElementData'],

        setup() {
            const theme = useTheme();
            const aasStore = useAASStore();

            return {
                theme, // Theme Object
                aasStore, // AASStore Object
            };
        },

        data() {
            return {
                handoverDocuData: {} as any,
                panel: null as number | null,
                documents: [] as Array<any>,
                loading: false,
            };
        },

        computed: {
            // Get the selected Treeview Node (SubmodelElement) from the store
            SelectedNode() {
                return this.aasStore.getSelectedNode;
            },
        },

        mounted() {
            this.initHandoverDocumentation();
        },

        methods: {
            async initHandoverDocumentation() {
                this.loading = true;

                if (Object.keys(this.submodelElementData).length === 0) {
                    this.handoverDocuData = {};
                    this.loading = false;
                    return;
                }
                let submodelElementData = { ...this.submodelElementData };
                this.handoverDocuData = await this.calculateSubmodelElementPathes(
                    submodelElementData,
                    this.SelectedNode.path
                );

                // create array of documents
                let documents = this.handoverDocuData.submodelElements.filter((element: any) => {
                    return this.checkSemanticId(element, '0173-1#02-ABI500#001/0173-1#01-AHF579#001');
                });
                documents.forEach((document: any) => {
                    this.extractDocumentVersions(document);
                    this.extractDocumentIds(document);
                    this.extractDocumentClassifications(document);
                });
                // console.log('Documents: ', documents);
                this.documents = documents;
                this.loading = false;
            },

            extractDocumentVersions(document: any) {
                // create an array with every DocumentVersion SubmodelElementCollection
                document.documentVersions = document.value.filter((element: any) => {
                    return (
                        element.semanticId &&
                        element.semanticId.keys &&
                        element.semanticId.keys.length > 0 &&
                        this.checkSemanticId(element, '0173-1#02-ABI503#001/0173-1#01-AHF582#001')
                    );
                });
                // prepare each DocumentVersion
                document.documentVersions.forEach((documentVersion: any) => {
                    // extract the DigitalFile
                    documentVersion.digitalFile = this.getElementBySemanticId('0173-1#02-ABI504', documentVersion);
                    // extract the PreviewFile
                    documentVersion.previewFile = this.getElementBySemanticId('0173-1#02-ABI505', documentVersion);
                    // filter for relevant versionProperties
                    documentVersion.meta = documentVersion.value.filter((element: any) => {
                        // return elements with the following idShorts: Language, Title, SubTitle, Summary, KeyWords
                        return (
                            this.checkIdShort(element, 'Language') ||
                            this.checkIdShort(element, 'Title') ||
                            this.checkIdShort(element, 'SubTitle') ||
                            this.checkIdShort(element, 'Summary') ||
                            this.checkIdShort(element, 'KeyWords')
                        );
                    });
                    documentVersion.fileToggle = 'preview';
                });
            },

            extractDocumentIds(document: any) {
                document.documentIds = document.value.filter((element: any) => {
                    return (
                        element.semanticId &&
                        element.semanticId.keys &&
                        element.semanticId.keys.length > 0 &&
                        this.checkSemanticId(element, '0173-1#02-ABI501#001/0173-1#01-AHF580#001')
                    );
                });
            },

            extractDocumentClassifications(document: any) {
                document.documentClassifications = document.value.filter((element: any) => {
                    return (
                        element.semanticId &&
                        element.semanticId.keys &&
                        element.semanticId.keys.length > 0 &&
                        this.checkSemanticId(element, '0173-1#02-ABI502#001/0173-1#01-AHF581#001*02')
                    );
                });
            },

            downloadFile(file: any) {
                let path = this.getLocalPath(file.value, file);
                let context = 'retrieving Attachment File';
                let disableMessage = false;
                this.getRequest(path, context, disableMessage).then((response: any) => {
                    if (response.success) {
                        // execute if the Request was successful
                        let Base64File = URL.createObjectURL(response.data as Blob);
                        const link = document.createElement('a');
                        link.href = Base64File;
                        link.download = file.idShort;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                    }
                });
            },

            getElementBySemanticId(semanticId: string, parentElement: any) {
                return parentElement.value.find((element: any) => {
                    return (
                        element.semanticId &&
                        element.semanticId.keys &&
                        element.semanticId.keys.length > 0 &&
                        this.checkSemanticId(element, semanticId)
                    );
                });
            },
        },
    });
</script>
