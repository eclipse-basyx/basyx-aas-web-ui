<template>
    <v-container fluid class="pa-0">
        <v-card class="pdfCard" style="transform: translateY(0px)">
            <iframe
                v-if="pdfUrl.length > 0"
                :src="pdfUrl"
                width="100%"
                height="600px"
                frameBorder="0"
                style="margin-bottom: -5px"></iframe>
            <iframe
                v-else
                :src="Base64PDF"
                width="100%"
                height="600px"
                frameBorder="0"
                style="margin-bottom: -5px"></iframe>
        </v-card>
    </v-container>
</template>

// TODO Transfer to composition API
<script lang="ts">
    import { defineComponent } from 'vue';
    import { useTheme } from 'vuetify';
    import { useSMEFile } from '@/composables/AAS/SubmodelElements/File';
    import { useRequestHandling } from '@/composables/RequestHandling';
    import { useAASStore } from '@/store/AASDataStore';
    import { useNavigationStore } from '@/store/NavigationStore';

    export default defineComponent({
        name: 'PDFPreview',
        props: ['submodelElementData'],

        setup() {
            const theme = useTheme();
            const navigationStore = useNavigationStore();
            const aasStore = useAASStore();

            const { valueBlob } = useSMEFile();
            const { getRequest } = useRequestHandling();

            return {
                theme, // Theme Object
                navigationStore, // NavigationStore Object
                aasStore, // AASStore Object
                valueBlob,
                getRequest,
            };
        },

        data() {
            return {
                localPathValue: '', // Path to the File when it is embedded to the AAS
                Base64PDF: '', // Base64 PDF string
                pdfUrl: '', // URL to the PDF File
                pdfData: '',
            };
        },

        computed: {
            // Get the selected Treeview Node (SubmodelElement) from the store
            SelectedNode() {
                return this.aasStore.getSelectedNode;
            },
        },

        watch: {
            async submodelElementData() {
                this.Base64PDF = '';
                this.pdfUrl = '';
                if (this.submodelElementData.modelType == 'File') {
                    // console.log('SubmodelElementData: ', this.submodelElementData);
                    this.Base64PDF = await this.valueBlob(this.submodelElementData);
                } else if (this.submodelElementData.modelType == 'Blob') {
                    this.getDecodedPDFBlob();
                }
            },
        },

        async mounted() {
            this.Base64PDF = '';
            this.pdfUrl = '';
            if (this.submodelElementData.modelType == 'File') {
                // console.log('SubmodelElementData: ', this.submodelElementData);
                this.Base64PDF = await this.valueBlob(this.submodelElementData);
            } else if (this.submodelElementData.modelType == 'Blob') {
                this.getDecodedPDFBlob();
            }
        },

        methods: {
            getDecodedPDFBlob() {
                let decodedValue = atob(this.submodelElementData.value);
                this.Base64PDF = `data:${this.submodelElementData.contentType};base64,${decodedValue}`;
            },
        },
    });
</script>
