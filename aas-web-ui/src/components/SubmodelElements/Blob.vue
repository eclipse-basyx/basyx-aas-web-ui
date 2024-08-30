<template>
    <v-container fluid class="pa-0">
        <v-list-item class="px-1 pb-1 pt-0">
            <v-list-item-title class="text-subtitle-2 mt-2">{{ 'Path: ' }}</v-list-item-title>
        </v-list-item>
        <v-card color="elevatedCard" v-if="blobObject">
            <!-- Path (Value) of the File Element -->
            <v-list nav class="bg-elevatedCard pt-0">
                <v-list-item class="pb-0">
                    <!-- mimeType -->
                    <v-list-item-title>
                        <span class="text-caption">{{ 'Mime Type: ' }}</span>
                        <v-chip label size="x-small" border color="primary">{{
                            blobObject.contentType ? blobObject.contentType : 'no-mime'
                        }}</v-chip>
                    </v-list-item-title>
                    <!-- Donwload File Button -->
                    <template v-slot:append>
                        <v-btn
                            v-if="blobObject.value && blobObject.contentType"
                            size="small"
                            color="primary"
                            class="text-buttonText"
                            @click="downloadFile"
                            >Download Blob to File</v-btn
                        >
                    </template>
                </v-list-item>
                <!-- Blob in Inputfield -->
                <v-list-item class="pt-0">
                    <v-list-item-title>
                        <v-textarea
                            variant="outlined"
                            density="compact"
                            :hide-details="isTruncated ? false : true"
                            clearable
                            @keydown.native.enter="updateBlob()"
                            v-model="truncatetBlobValue"
                            @click:clear="clearBlob()"
                            @update:focused="setFocus"
                            :hint="isTruncated ? 'Blob string is truncated!' : ''"
                            persistent-hint>
                            <!-- Update Blob Button -->
                            <template v-slot:append-inner="{ isFocused }">
                                <v-btn
                                    v-if="isFocused"
                                    size="small"
                                    variant="elevated"
                                    color="primary"
                                    class="text-buttonText"
                                    style="right: -4px"
                                    @click.stop="updateBlob()">
                                    <v-icon>mdi-upload</v-icon>
                                </v-btn>
                            </template>
                        </v-textarea>
                    </v-list-item-title>
                </v-list-item>
            </v-list>
            <v-divider></v-divider>
            <!-- Action Button to upload a File as Blob -->
            <v-list nav class="bg-elevatedCard pa-0">
                <v-list-item>
                    <template v-slot:title>
                        <!-- Upload-Button -->
                        <v-file-input
                            variant="outlined"
                            density="compact"
                            :multiple="false"
                            v-model="newFile"
                            clearable
                            hide-details
                            class="my-1">
                            <template v-slot:append-inner>
                                <v-btn
                                    size="small"
                                    variant="elevated"
                                    color="primary"
                                    class="text-buttonText"
                                    style="right: -4px"
                                    @click.stop="uploadBlob()"
                                    >Upload File as Blob</v-btn
                                >
                            </template>
                        </v-file-input>
                    </template>
                </v-list-item>
            </v-list>
        </v-card>
    </v-container>
</template>

<script lang="ts">
    import { defineComponent } from 'vue';
    import { useAASStore } from '@/store/AASDataStore';
    import RequestHandling from '@/mixins/RequestHandling';

    export default defineComponent({
        name: 'Blob',
        components: {
            RequestHandling, // Mixin to handle the requests to the AAS
        },
        mixins: [RequestHandling],
        props: ['blobObject'],

        setup() {
            const aasStore = useAASStore();

            return {
                aasStore, // AASStore Object
            };
        },

        data() {
            return {
                newBlobValue: '',
                truncatetBlobValue: '', // Truncated Blob Value
                maxLength: 1000, // Max Length of the Blob Value
                isTruncated: false, // boolean to check if the Blob Value is truncated
                newFile: [] as any, // Blob Object to Upload
                isFocused: false, // boolean to check if the input field is focused
            };
        },

        mounted() {
            this.newBlobValue = this.blobObject.value;
            if (this.blobObject.value.length > this.maxLength) {
                this.truncatetBlobValue = this.blobObject.value.substring(0, this.maxLength);
                this.isTruncated = true;
            } else {
                this.truncatetBlobValue = this.blobObject.value;
                this.isTruncated = false;
            }
        },

        watch: {
            // Watch for changes in the selected Node and reset input
            SelectedNode: {
                deep: true,
                handler() {
                    this.newBlobValue = '';
                    this.truncatetBlobValue = '';
                },
            },

            // watch for changes in the blobObject and set the newBlobValue
            blobObject: {
                deep: true,
                handler() {
                    if (!this.isFocused) {
                        this.newBlobValue = this.blobObject.value;
                        if (this.blobObject.value.length > this.maxLength) {
                            this.truncatetBlobValue = this.blobObject.value.substring(0, this.maxLength);
                            this.isTruncated = true;
                        } else {
                            this.truncatetBlobValue = this.blobObject.value;
                            this.isTruncated = false;
                        }
                    }
                },
            },
        },

        computed: {
            // get selected AAS from Store
            SelectedAAS() {
                return this.aasStore.getSelectedAAS;
            },

            // Get the selected Treeview Node (SubmodelElement) from the store
            SelectedNode() {
                return this.aasStore.getSelectedNode;
            },
        },

        methods: {
            // Function to update the Blob of the File Element
            updateBlob() {
                // console.log("Update Blob: " + this.newBlobValue);
                let path =
                    this.SelectedAAS.endpoints[0].protocolInformation.href + '/' + this.SelectedNode.path + '/value';
                let content = "'" + this.newBlobValue + "'";
                let headers = new Headers();
                headers.append('Content-Type', 'application/json');
                let context = 'updating ' + this.blobObject.modelType + ' "' + this.blobObject.idShort + '"';
                let disableMessage = false;
                // Send Request to update the content of the Blob element
                this.putRequest(path, content, headers, context, disableMessage).then((response: any) => {
                    if (response.success) {
                        this.$emit('updateBlob'); // emit event to update the content in the parent component
                    }
                });
            },

            // Function to clear the content of the Blob Element
            clearBlob() {
                this.newBlobValue = '';
                this.truncatetBlobValue = '';
            },

            // Function to upload a File as Blob to the AAS
            uploadBlob() {
                // console.log("Upload File: ", this.newFile);
                // check if a file is selected
                if (this.newFile.length == 0) return;
                let file = this.newFile[0];
                let contentType = file.type;
                // decode the file to base64
                let reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => {
                    let base64 = reader.result;
                    // remove the header from the base64 string
                    let value = '';
                    if (typeof base64 === 'string') {
                        const base64String = base64.split(',')[1];
                        value = base64String ? base64String.trim() : '';
                    }
                    let contentJSON = {} as any;
                    contentJSON.contentType = contentType;
                    contentJSON.value = value;
                    let content = JSON.stringify(contentJSON);
                    // console.log("Content: ", content);
                    let path = this.blobObject.path + '/$value';
                    let headers = new Headers();
                    headers.append('Content-Type', 'application/json');
                    let context = 'updating ' + this.blobObject.modelType + ' "' + this.blobObject.idShort + '"';
                    let disableMessage = false;
                    // Send Request to update the content of the Blob element
                    this.patchRequest(path, content, headers, context, disableMessage).then((response: any) => {
                        if (response.success) {
                            this.$emit('updateBlob'); // emit event to update the content in the parent component
                        }
                    });
                };
            },

            // Function to set the focus on the input field
            setFocus(e: boolean) {
                this.isFocused = e;
                // set input to current value in the AAS if the input field is not focused
                if (!e) {
                    this.newBlobValue = this.blobObject.value;
                    if (this.blobObject.value.length > this.maxLength) {
                        this.truncatetBlobValue = this.blobObject.value.substring(0, this.maxLength);
                        this.isTruncated = true;
                    } else {
                        this.truncatetBlobValue = this.blobObject.value;
                        this.isTruncated = false;
                    }
                }
            },

            // Function to download the Blob as File
            downloadFile() {
                // Convert base64 to Blob
                let decodedValue = atob(this.newBlobValue);
                fetch(`data:${this.blobObject.contentType};base64,${decodedValue}`)
                    .then((response) => response.blob())
                    .then((blob) => {
                        // Create a downloadable link for the Blob
                        const link = document.createElement('a');
                        link.href = window.URL.createObjectURL(blob);
                        // check if contentType is text
                        if (this.blobObject.contentType.split('/')[0] == 'text') {
                            link.download = this.SelectedNode.idShort + '.txt';
                        } else {
                            link.download = this.SelectedNode.idShort + '.' + this.blobObject.contentType.split('/')[1];
                        }

                        // Append the link to the document body and simulate a click
                        document.body.appendChild(link);
                        link.click();

                        // Remove the link from the document body
                        document.body.removeChild(link);
                    });
            },
        },
    });
</script>
