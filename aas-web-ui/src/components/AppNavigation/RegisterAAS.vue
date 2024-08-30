<template>
    <v-btn variant="plain">
        <v-icon size="x-large">mdi-plus</v-icon>
        <v-tooltip activator="parent" open-delay="600" location="bottom">Add existing AAS to AAS Registry</v-tooltip>
        <v-dialog v-model="RegisterAASDialog" activator="parent" width="600">
            <v-card>
                <v-card-title>
                    <span class="text-subtile-1">Add existing AAS to AAS Registry</span>
                </v-card-title>
                <v-divider></v-divider>
                <v-card-text>
                    <!-- Endpoint Textfield of the AAS to be registered -->
                    <v-text-field
                        v-model="aasEndpoint"
                        variant="outlined"
                        density="compact"
                        label="AAS Endpoint"
                        hint="E.g. http://localhost:4000/shells/<UTF8_BASE64_encoded_aasIdentification>"
                        persistent-hint
                        clearable></v-text-field>
                </v-card-text>
                <v-divider></v-divider>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn size="small" variant="outlined" color="primary" @click="RegisterAASDialog = false"
                        >Cancel</v-btn
                    >
                    <v-btn
                        size="small"
                        class="text-buttonText"
                        variant="elevated"
                        color="primary"
                        :loading="registrationLoading"
                        @click="addAAS()"
                        >Add</v-btn
                    >
                </v-card-actions>
                <v-divider></v-divider>
                <!-- aasIdentification converter -->
                <v-expansion-panels>
                    <v-expansion-panel title="Need help encoding the aasIdentification?">
                        <v-expansion-panel-text class="px-2">
                            <v-card-text>
                                <v-row>
                                    <v-col cols="6">
                                        <v-text-field
                                            v-model="aasIdentification"
                                            variant="outlined"
                                            density="compact"
                                            label="aasIdentification"
                                            clearable
                                            hide-details
                                            class="mb-2"
                                            @change="encodeIdentification()"></v-text-field>
                                    </v-col>
                                    <v-col cols="6">
                                        <v-text-field
                                            v-model="EncodedAasIdentification"
                                            variant="outlined"
                                            density="compact"
                                            label="Encoded Identification"
                                            hide-details
                                            class="mb-2"
                                            readonly>
                                            <template #append-inner>
                                                <v-btn
                                                    size="small"
                                                    variant="elevated"
                                                    color="primary"
                                                    class="text-buttonText"
                                                    style="right: -4px"
                                                    @click.stop="copyToClipboard()">
                                                    <v-icon>mdi-clipboard-file-outline</v-icon>
                                                </v-btn>
                                            </template>
                                        </v-text-field>
                                    </v-col>
                                </v-row>
                            </v-card-text>
                        </v-expansion-panel-text>
                    </v-expansion-panel>
                </v-expansion-panels>
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
        name: 'RegisterAAS',
        mixins: [RequestHandling, SubmodelElementHandling],

        setup() {
            const navigationStore = useNavigationStore();

            return {
                navigationStore, // NavigationStore Object
            };
        },

        data() {
            return {
                RegisterAASDialog: false, // Dialog State Handler
                registrationLoading: false, // Loading State Handler
                aasEndpoint: '', // AAS Endpoint
                aasIdentification: '', // AAS Identification
                EncodedAasIdentification: '', // Encoded AAS Identification
            };
        },

        computed: {
            // get AAS Registry URL from Store
            aasRegistryURL() {
                return this.navigationStore.getAASRegistryURL;
            },
        },

        methods: {
            // Function to add a new AAS to the AAS Registry
            addAAS() {
                this.registrationLoading = true;
                let path = this.aasEndpoint;
                let context = 'retrieving to be registered AAS';
                let disableMessage = false;
                this.getRequest(path, context, disableMessage).then((response: any) => {
                    if (response.success) {
                        // execute if the AAS exists
                        let aas = response.data;

                        // add method call here to create json content for registering AAS
                        const createRegisterContent = (fetchedAAS: any) => {
                            return {
                                ...fetchedAAS, // Spread to include all existing properties
                                endpoints: [
                                    // Add or update the endpoints
                                    {
                                        interface: 'HTTP-REST',
                                        protocolInformation: {
                                            href: this.aasEndpoint,
                                            endpointProtocol: this.aasEndpoint.split(':')[0],
                                            endpointProtocolVersion: ['1.1'],
                                        },
                                    },
                                ],
                            };
                        };

                        // Create the registration content
                        let registrationContent = createRegisterContent(aas);
                        // remove administration key
                        delete registrationContent['administration'];
                        // check if aasRegistryURL includes "/shell-descriptors" and add id if not (backward compatibility)
                        if (!this.aasRegistryURL.includes('/shell-descriptors')) {
                            this.aasRegistryURL += '/shell-descriptors';
                        }
                        let path = this.aasRegistryURL;
                        let content = JSON.stringify(registrationContent);
                        let headers = new Headers();
                        headers.append('Content-Type', 'application/json');
                        let context = 'registering AAS';
                        let disableMessage = false;
                        this.postRequest(path, content, headers, context, disableMessage).then((response: any) => {
                            if (response.success) {
                                // execute if the AAS is successfully registered
                                this.navigationStore.dispatchTriggerAASListReload(true); // trigger AAS List reload
                                this.RegisterAASDialog = false; // close dialog
                            }
                        });
                    }
                    this.registrationLoading = false;
                });
            },
            // Function to encode the AAS Identification
            encodeIdentification() {
                this.EncodedAasIdentification = this.URLEncode(this.aasIdentification);
            },
            // Function to copy the encoded AAS Identification to the clipboard
            copyToClipboard() {
                navigator.clipboard.writeText(this.EncodedAasIdentification);
                this.navigationStore.dispatchSnackbar({
                    status: true,
                    timeout: 2000,
                    color: 'success',
                    btnColor: 'buttonText',
                    text: 'Path copied to Clipboard.',
                });
            },
        },
    });
</script>
