<template>
    <v-container fluid class="pa-0">
        <v-card>
            <v-img
                v-if="imageUrl.length > 0"
                :src="imageUrl"
                max-width="100%"
                max-height="100%"
                contain
                @error="errorLoadingImage = true"></v-img>
            <v-img
                v-else
                :src="Base64Image"
                max-width="100%"
                max-height="100%"
                contain
                @error="errorLoadingImage = true"></v-img>
            <!-- Error Message -->
            <v-alert
                v-if="errorLoadingImage"
                text="No Image found at given Path!"
                density="compact"
                type="warning"
                variant="outlined"></v-alert>
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

    export default defineComponent({
        name: 'ImagePreview',
        props: ['submodelElementData'],

        setup() {
            const theme = useTheme();
            const aasStore = useAASStore();

            const { valueBlob } = useSMEFile();
            const { getRequest } = useRequestHandling();

            return {
                theme, // Theme Object
                aasStore, // AASStore Object
                valueBlob,
                getRequest,
            };
        },

        data() {
            return {
                Base64Image: '', // Base64 Image String
                imageUrl: '', // Image URL
                errorLoadingImage: false,
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
                this.Base64Image = '';
                this.imageUrl = '';
                if (this.submodelElementData.modelType == 'File') {
                    this.Base64Image = await this.valueBlob(this.submodelElementData);
                } else if (this.submodelElementData.modelType == 'Blob') {
                    this.getDecodedImageBlob();
                }
                this.errorLoadingImage = false;
            },
        },

        async mounted() {
            this.Base64Image = '';
            this.imageUrl = '';
            if (this.submodelElementData.modelType == 'File') {
                // console.log('SubmodelElementData: ', this.submodelElementData);
                this.Base64Image = await this.valueBlob(this.submodelElementData);
            } else if (this.submodelElementData.modelType == 'Blob') {
                this.getDecodedImageBlob();
            }
            this.errorLoadingImage = false;
        },

        methods: {
            getDecodedImageBlob() {
                let decodedValue = atob(this.submodelElementData.value);
                this.Base64Image = `data:${this.submodelElementData.contentType};base64,${decodedValue}`;
            },
        },
    });
</script>
