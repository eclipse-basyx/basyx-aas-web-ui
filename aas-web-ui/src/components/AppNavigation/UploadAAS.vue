<template>
    <v-btn variant="plain">
        <v-icon size="x-large">mdi-upload</v-icon>
        <v-tooltip activator="parent" open-delay="600" location="bottom" :disabled="isMobile"
            >Upload AAS File to Environment</v-tooltip
        >
        <v-dialog v-model="uploadAASDialog" activator="parent" width="600">
            <v-card :loading="loadingUpload">
                <v-card-title>
                    <span class="text-subtile-1">Upload AAS to Environment</span>
                </v-card-title>
                <v-divider></v-divider>
                <v-card-text>
                    <!-- AAS File Input -->
                    <v-file-input
                        v-model="aasFile"
                        variant="outlined"
                        density="compact"
                        :multiple="false"
                        clearable
                        class="my-1 mt-3"
                        label="AAS File Upload"
                        :accept="['.aasx', '.xml', '.json']">
                        <template #append-inner>
                            <v-btn
                                size="small"
                                variant="elevated"
                                color="primary"
                                class="text-buttonText"
                                style="right: -4px"
                                @click.stop="uploadAASXFile()"
                                >Upload</v-btn
                            >
                        </template>
                    </v-file-input>
                </v-card-text>
            </v-card>
        </v-dialog>
    </v-btn>
</template>

<script lang="ts">
    import { defineComponent } from 'vue';
    import RequestHandling from '@/mixins/RequestHandling';
    import SubmodelElementHandling from '@/mixins/SubmodelElementHandling';
    import { useNavigationStore } from '@/store/NavigationStore';

    export default defineComponent({
        name: 'UploadAAS',
        mixins: [RequestHandling, SubmodelElementHandling],

        setup() {
            const navigationStore = useNavigationStore();

            return {
                navigationStore, // NavigationStore Object
            };
        },

        data() {
            return {
                uploadAASDialog: false, // Dialog State Handler
                aasFile: [] as any, // AASX File to upload
                loadingUpload: false, // Loading State
            };
        },

        computed: {
            // Get the upload URL
            uploadURL() {
                let aasRepoURL = this.navigationStore.getAASRepoURL;
                // remove '/shells' from the URL
                return aasRepoURL.replace('/shells', '') + '/upload';
            },

            // Check if the current Device is a Mobile Device
            isMobile() {
                return this.navigationStore.getIsMobile;
            },
        },

        methods: {
            // Function to upload the AASX File to the AAS-Server (TODO: Update AASX Upload to AAS V3 API when available)
            uploadAASXFile() {
                // console.log('upload aasx file: ' + this.aasxFile);
                // check if a file is selected
                if (this.aasFile.length == 0) return;
                this.loadingUpload = true;
                let context = 'uploading AASX File';
                let disableMessage = false;
                let path = this.uploadURL;
                var headers = new Headers();
                var formData = new FormData();
                formData.append('file', this.aasFile);
                // Send Request to upload the file
                this.postRequest(path, formData, headers, context, disableMessage).then((response: any) => {
                    if (response.success) {
                        this.navigationStore.dispatchSnackbar({
                            status: true,
                            timeout: 4000,
                            color: 'success',
                            btnColor: 'buttonText',
                            text: 'AASX-File uploaded.',
                        }); // Show Success Snackbar
                    }
                    this.aasFile = []; // clear the AASX File
                    // reload the AAS list
                    this.navigationStore.dispatchTriggerAASListReload(true);
                    this.uploadAASDialog = false;
                    this.loadingUpload = false;
                });
            },
        },
    });
</script>
