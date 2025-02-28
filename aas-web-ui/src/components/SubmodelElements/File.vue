<template>
    <v-container fluid class="pa-0">
        <v-list-item class="px-1 pb-1 pt-0">
            <v-list-item-title class="text-subtitle-2 mt-2">{{ 'Path: ' }}</v-list-item-title>
        </v-list-item>
        <v-card v-if="fileObject" color="elevatedCard">
            <!-- Path (Value) of the File Element -->
            <v-list nav class="bg-elevatedCard pt-0">
                <v-list-item class="pb-0">
                    <!-- mimeType -->
                    <v-list-item-title>
                        <span class="text-caption">{{ 'Mime Type: ' }}</span>
                        <v-chip label size="x-small" border color="primary">{{
                            fileObject.contentType ? fileObject.contentType : 'no-mime'
                        }}</v-chip>
                    </v-list-item-title>
                    <!-- Donwload File Button -->
                    <template #append>
                        <v-btn
                            v-if="fileObject.value"
                            size="small"
                            color="primary"
                            class="text-buttonText"
                            :href="localPathValue"
                            target="_blank"
                            >Download File</v-btn
                        >
                    </template>
                </v-list-item>
                <!-- Path in Inputfield -->
                <v-list-item class="pt-0">
                    <v-list-item-title>
                        <v-text-field
                            v-model="newPathValue"
                            variant="outlined"
                            density="compact"
                            hide-details
                            :clearable="isEditable"
                            :readonly="!isEditable"
                            @keydown.enter="updatePath()"
                            @click:clear="clearPath()"
                            @update:focused="setFocus">
                            <!-- Update Path Button -->
                            <template #append-inner="{ isFocused }">
                                <v-btn
                                    v-if="isFocused && isEditable"
                                    size="small"
                                    variant="elevated"
                                    color="primary"
                                    class="text-buttonText"
                                    style="right: -4px"
                                    @click.stop="updatePath()">
                                    <v-icon>mdi-upload</v-icon>
                                </v-btn>
                            </template>
                        </v-text-field>
                    </v-list-item-title>
                </v-list-item>
                <v-divider v-if="!fileObject.value"></v-divider>
                <!-- Alerts when File was not found/empty -->
                <v-list-item v-if="!fileObject.value">
                    <v-list-item-title class="pt-2">
                        <v-alert
                            text="SubmodelElement doesn't contain a File!"
                            density="compact"
                            type="warning"
                            variant="outlined"></v-alert>
                    </v-list-item-title>
                </v-list-item>
            </v-list>
            <v-divider></v-divider>
            <!-- Action Button to upload a File -->
            <v-list v-if="isEditable" nav class="bg-elevatedCard pa-0">
                <v-list-item>
                    <template #title>
                        <!-- Upload-Button -->
                        <v-file-input
                            v-model="newFile"
                            variant="outlined"
                            density="compact"
                            :multiple="false"
                            clearable
                            hide-details
                            class="my-1">
                            <template #append-inner>
                                <v-btn
                                    size="small"
                                    variant="elevated"
                                    color="primary"
                                    class="text-buttonText"
                                    style="right: -4px"
                                    @click.stop="uploadFile()"
                                    >Upload File</v-btn
                                >
                            </template>
                        </v-file-input>
                    </template>
                </v-list-item>
            </v-list>
        </v-card>
    </v-container>
</template>

// TODO Transfer to composition API
<script lang="ts">
    import { defineComponent } from 'vue';
    import { useSMEHandling } from '@/composables/AAS/SMEHandling';
    import { useSMEFile } from '@/composables/AAS/SubmodelElements/File';
    import { useRequestHandling } from '@/composables/RequestHandling';
    import { useAASStore } from '@/store/AASDataStore';

    export default defineComponent({
        name: 'File',
        props: {
            fileObject: {
                type: Object,
                default: () => ({}),
            },
            isEditable: {
                type: Boolean,
                default: true,
            },
        },

        setup() {
            const aasStore = useAASStore();

            const { fetchAndDispatchSme } = useSMEHandling();
            const { valueUrl, valueBlob } = useSMEFile();
            const { patchRequest, putRequest } = useRequestHandling();

            return {
                aasStore, // AASStore Object
                fetchAndDispatchSme,
                valueUrl,
                valueBlob,
                patchRequest,
                putRequest,
            };
        },

        data() {
            return {
                newPathValue: '',
                newFile: [] as any, // File Object to Upload
                localPathValue: '', // Path to the File when it is embedded to the AAS
                isFocused: false, // boolean to check if the input field is focused
            };
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

        watch: {
            // Watch for changes in the selected Node and reset input
            SelectedNode: {
                deep: true,
                handler() {
                    this.newPathValue = '';
                    this.localPathValue = '';
                },
            },

            // watch for changes in the fileObject and set the newPathValue
            fileObject: {
                deep: true,
                async handler() {
                    if (!this.isFocused) {
                        this.newPathValue = this.fileObject.value;
                        this.localPathValue = await this.valueBlob(this.fileObject);
                    }
                },
            },
        },

        async mounted() {
            this.newPathValue = this.fileObject.value;
            this.localPathValue = await this.valueBlob(this.fileObject);
        },

        methods: {
            // Function to update the Path of the File Element
            updatePath() {
                // console.log("Update Path: " + this.newPathValue);
                let updateObject = { value: this.newPathValue, contentType: this.fileObject.contentType };
                let path = this.fileObject.path + '/$value';
                let content = JSON.stringify(updateObject);
                let context = 'updating ' + this.fileObject.modelType + ' "' + this.fileObject.idShort + '"';
                let disableMessage = false;
                const headers = new Headers();
                headers.append('Content-Type', 'application/json');

                // Send Request to update the path of the file element
                this.patchRequest(path, content, headers, context, disableMessage).then((response: any) => {
                    if (response.success) {
                        // After successful patch request fetch and dispatch updated SME
                        this.fetchAndDispatchSme(this.SelectedNode.path, false);
                    }
                });
            },

            // Function to clear the Path of the File Element
            clearPath() {
                this.newPathValue = '';
            },

            // Function to upload a File
            uploadFile() {
                // console.log("Upload File: ", this.newFile);
                // check if a file is selected
                if (this.newFile.length == 0) return;
                let context =
                    'uploading ' +
                    this.fileObject.modelType +
                    '-SubmodelElement' +
                    ' "' +
                    this.fileObject.idShort +
                    '"';
                let disableMessage = false;
                let path = this.SelectedNode.path + '/attachment?fileName=' + this.newFile.name;
                var headers = new Headers();
                var formData = new FormData();
                formData.append('file', this.newFile);
                // Send Request to upload the file
                this.putRequest(path, formData, headers, context, disableMessage).then((response: any) => {
                    // TODO: Add success response handling including updating the File SubmodelElement -> mimeType (+ value)
                    if (response.success) {
                        location.reload(); // reload the page to update the file preview
                    }
                });
            },

            // Function to set the focus on the input field
            setFocus(e: boolean) {
                this.isFocused = e;
                if (!e) this.newPathValue = this.fileObject.value; // set input to current value in the AAS if the input field is not focused
            },
        },
    });
</script>
