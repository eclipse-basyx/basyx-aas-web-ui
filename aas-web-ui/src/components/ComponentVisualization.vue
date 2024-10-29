<template>
    <v-container fluid class="pa-0">
        <v-card color="card" elevation="0">
            <v-card-title v-if="!isMobile" style="padding: 15px 16px 16px"> Visualization </v-card-title>
            <v-card-title v-else style="padding: 15px 16px 16px">
                <v-row align="center">
                    <v-col cols="auto" class="pa-0">
                        <v-btn
                            class="ml-2"
                            variant="plain"
                            icon="mdi-chevron-left"
                            @click="backToSubmodelList()"></v-btn>
                    </v-col>
                    <v-col cols="auto">
                        <span>Visualization</span>
                    </v-col>
                    <v-col v-if="SelectedAAS?.idShort" cols="auto" class="pl-1">
                        <v-chip size="x-small" color="primary" label border>{{
                            'AAS: ' + SelectedAAS?.idShort
                        }}</v-chip>
                    </v-col>
                </v-row>
            </v-card-title>
            <v-divider></v-divider>
            <v-card-text
                v-if="submodelElementData && Object.keys(submodelElementData).length > 0"
                style="overflow-y: auto; height: calc(100svh - 170px)">
                <!-- Add Plugins matched on SemanticId's inside the SubmodelEntrypoint -->
                <SubmodelEntrypoint
                    :submodel-element-data="submodelElementData"
                    :selected-node="SelectedNodeToTransfer"></SubmodelEntrypoint>
            </v-card-text>
        </v-card>
    </v-container>
</template>

<script lang="ts">
    import { defineComponent } from 'vue';
    import { useRoute, useRouter } from 'vue-router';
    import SubmodelEntrypoint from '@/components/SubmodelPlugins/_SubmodelEntrypoint.vue';
    import RequestHandling from '@/mixins/RequestHandling';
    import SubmodelElementHandling from '@/mixins/SubmodelElementHandling';
    import { useAASStore } from '@/store/AASDataStore';
    import { useNavigationStore } from '@/store/NavigationStore';

    export default defineComponent({
        name: 'ComponentVisualization',
        components: {
            SubmodelEntrypoint, // Submodel Plugin Entrypoint Component
        },
        mixins: [RequestHandling, SubmodelElementHandling],

        setup() {
            const navigationStore = useNavigationStore();
            const aasStore = useAASStore();
            const route = useRoute();
            const router = useRouter();

            return {
                navigationStore, // NavigationStore Object
                aasStore, // AASStore Object
                route, // Route Object
                router, // Router Object
            };
        },

        data() {
            return {
                submodelElementData: {} as any, // SubmodelElement Data
                requestInterval: null as any, // interval to send requests to the AAS
            };
        },

        computed: {
            // get AAS Registry URL from Store
            aasRegistryServerURL() {
                return this.navigationStore.getAASRegistryURL;
            },

            // get the Submodel Registry URL from Store
            submodelRegistryServerURL() {
                return this.navigationStore.getSubmodelRegistryURL;
            },

            // get selected AAS from Store
            SelectedAAS() {
                return this.aasStore.getSelectedAAS;
            },

            // Get the selected Treeview Node (SubmodelElement) from the store
            SelectedNode() {
                return this.aasStore.getSelectedNode;
            },

            // return the selected Node with the full path to the SubmodelElement
            SelectedNodeToTransfer() {
                let aas = { ...this.aasStore.getSelectedAAS };
                let node = { ...this.aasStore.getSelectedNode };
                if (Array.isArray(aas?.endpoints) && aas?.endpoints.length > 0) {
                    const shellHref = this.extractEndpointHref(aas, 'AAS-3.0');
                    node.pathFull = shellHref + '/' + node.path;
                }
                // console.log('SelectedNodeToTransfer: ', node);
                return node;
            },

            // Get the real-time object from the store
            RealTimeObject() {
                return this.aasStore.getRealTimeObject;
            },

            // Check if the current Device is a Mobile Device
            isMobile() {
                return this.navigationStore.getIsMobile;
            },
        },

        watch: {
            // Resets the submodelElementData when the AAS Registry changes
            aasRegistryServerURL() {
                if (!this.aasRegistryServerURL) {
                    this.submodelElementData = {};
                }
            },

            // Resets the submodelElementData when the Submodel Registry changes
            submodelRegistryServerURL() {
                if (!this.submodelRegistryServerURL) {
                    this.submodelElementData = {};
                }
            },

            // Resets the submodelElementData when the AAS changes
            SelectedAAS() {
                this.submodelElementData = {};
            },

            // Watch for changes in the SelectedNode and (re-)initialize the Component
            SelectedNode: {
                deep: true,
                handler() {
                    // clear old submodelElementData
                    this.submodelElementData = {};
                    this.initializeView(); // initialize list
                },
            },

            // Watch for changes in the RealTimeDataObject and (re-)initialize the Component
            RealTimeObject: {
                deep: true,
                handler() {
                    // clear old submodelElementData
                    this.submodelElementData = {};
                    this.initializeView(); // initialize list
                },
            },
        },

        mounted() {
            if (Object.keys(this.SelectedNode).length > 0 && this.isMobile) {
                // initialize if component got mounted on mobile devices (needed there because it is rendered in a separate view)
                this.initializeView();
            } else if (Object.keys(this.SelectedNode).length == 0 && this.route.path == '/componentvisualization') {
                const searchParams = new URL(window.location.href).searchParams;
                const aasEndpoint = searchParams.get('aas');
                const path = searchParams.get('path');

                // check if the aas Query and the path Query are set in the URL and if so initialize
                if (aasEndpoint && path) {
                    this.initializeViewWithRouteParams();
                }
            }
        },

        beforeUnmount() {
            clearInterval(this.requestInterval); // clear old interval
        },

        methods: {
            // Initialize the Component
            initializeView() {
                // console.log('Selected Node: ', this.RealTimeObject);
                // Check if a Node is selected
                if (Object.keys(this.RealTimeObject).length == 0) {
                    this.submodelElementData = {}; // Reset the SubmodelElement Data when no Node is selected
                    return;
                }
                this.submodelElementData = { ...this.RealTimeObject }; // create local copy of the SubmodelElement Object
                // console.log('SubmodelElement Data (ComponentVisualization): ', this.submodelElementData);
            },

            // Function to initialize with route params
            initializeViewWithRouteParams() {
                const searchParams = new URL(window.location.href).searchParams;
                const aasEndpoint = searchParams.get('aas');
                const path = searchParams.get('path');

                if (aasEndpoint && path) {
                    // console.log('AAS and Path Queries are set: ', aasEndpoint, ' | ', path);
                    let aas = {} as any;
                    let endpoints = [];
                    endpoints.push({ protocolInformation: { href: aasEndpoint }, interface: 'AAS-3.0' });
                    aas.endpoints = endpoints;
                    // dispatch the AAS set by the URL to the store
                    this.aasStore.dispatchSelectedAAS(aas);

                    // Request the selected SubmodelElement
                    let context = 'retrieving SubmodelElement';
                    let disableMessage = true;
                    this.getRequest(path, context, disableMessage).then((response: any) => {
                        if (response.success) {
                            // execute if the Request was successful
                            response.data.timestamp = this.formatDate(new Date()); // add timestamp to the SubmodelElement Data
                            response.data.path = path; // add the path to the SubmodelElement Data
                            response.data.isActive = true; // add the isActive Property to the SubmodelElement Data
                            // console.log('SubmodelElement Data: ', response.data)
                            // dispatch the SubmodelElementPath set by the URL to the store
                            this.submodelElementData = response.data;
                            this.aasStore.dispatchRealTimeObject(this.submodelElementData);
                        } else {
                            // execute if the Request failed
                            if (Object.keys(response.data).length == 0) {
                                // don't copy the static SubmodelElement Data if no Node is selected or Node is invalid
                                this.navigationStore.dispatchSnackbar({
                                    status: true,
                                    timeout: 60000,
                                    color: 'error',
                                    btnColor: 'buttonText',
                                    text: 'No valid SubmodelElement under the given Path',
                                }); // Show Error Snackbar
                                return;
                            }
                        }
                    });
                }
            },

            backToSubmodelList() {
                this.router.push({ name: 'SubmodelList', query: this.route.query });
            },
        },
    });
</script>
