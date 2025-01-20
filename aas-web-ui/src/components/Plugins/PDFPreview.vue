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
    import RequestHandling from '@/mixins/RequestHandling';
    import SubmodelElementHandling from '@/mixins/SubmodelElementHandling';
    import { useAASStore } from '@/store/AASDataStore';
    import { useNavigationStore } from '@/store/NavigationStore';

    export default defineComponent({
        name: 'PDFPreview',
        mixins: [RequestHandling, SubmodelElementHandling],
        props: ['submodelElementData'],

        setup() {
            const theme = useTheme();
            const navigationStore = useNavigationStore();
            const aasStore = useAASStore();

            return {
                theme, // Theme Object
                navigationStore, // NavigationStore Object
                aasStore, // AASStore Object
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
            submodelElementData() {
                this.Base64PDF = '';
                this.pdfUrl = '';
                if (this.submodelElementData.modelType == 'File') {
                    // console.log('SubmodelElementData: ', this.submodelElementData);
                    this.getPDFBlob();
                } else if (this.submodelElementData.modelType == 'Blob') {
                    this.getDecodedPDFBlob();
                }
            },
        },

        mounted() {
            this.Base64PDF = '';
            this.pdfUrl = '';
            if (this.submodelElementData.modelType == 'File') {
                // console.log('SubmodelElementData: ', this.submodelElementData);
                this.getPDFBlob();
            } else if (this.submodelElementData.modelType == 'Blob') {
                this.getDecodedPDFBlob();
            }
        },

        methods: {
            getPDFBlob() {
                try {
                    new URL(this.submodelElementData.value);
                    this.pdfUrl = this.submodelElementData.value;
                } catch {
                    let path = this.getLocalPath(this.submodelElementData.value, this.submodelElementData);
                    let context = 'retrieving Attachment File';
                    let disableMessage = false;
                    this.getRequest(path, context, disableMessage).then((response: any) => {
                        if (response.success) {
                            // execute if the Request was successful
                            this.Base64PDF = URL.createObjectURL(response.data as Blob);
                        }
                    });
                }
            },

            getDecodedPDFBlob() {
                let decodedValue = atob(this.submodelElementData.value);
                this.Base64PDF = `data:${this.submodelElementData.contentType};base64,${decodedValue}`;
            },
        },
    });
</script>
