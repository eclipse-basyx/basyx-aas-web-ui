<template>
    <v-container fluid class="pa-0">
        <v-card color="card" elevation="0">
            <v-card-title style="padding: 15px 16px 16px">
                <v-row align="center">
                    <v-col v-if="isMobile" cols="auto" class="pa-0">
                        <v-btn class="ml-2" variant="plain" icon="mdi-chevron-left" @click="backToAASList()"></v-btn>
                    </v-col>
                    <v-col cols="auto">
                        <span>Submodel List</span>
                    </v-col>
                    <v-col v-if="nameToDisplay(selectedAAS)" cols="auto" class="pl-1 pt-2">
                        <v-chip size="x-small" color="primary" label border>{{
                            'AAS: ' + nameToDisplay(selectedAAS)
                        }}</v-chip>
                    </v-col>
                </v-row>
            </v-card-title>
            <v-divider></v-divider>
            <v-card-text style="overflow-y: auto; height: calc(100svh - 170px)" class="py-2 px-2">
                <div v-if="loading">
                    <v-skeleton-loader type="list-item@6"></v-skeleton-loader>
                </div>
                <template v-else>
                    <v-empty-state
                        v-if="Object.keys(selectedAAS).length > 0 && submodelData.length === 0"
                        title="No existing Submodels"
                        text="The selected AAS does not contain any Submodels"
                        class="text-divider"></v-empty-state>
                    <!-- List of Submodels -->
                    <v-list-item
                        v-for="submodel in submodelData"
                        :key="submodel.id"
                        color="primary"
                        nav
                        class="bg-listItem mb-2"
                        style="border-width: 1px"
                        :style="{
                            'border-color': submodel.isActive
                                ? primaryColor + ' !important'
                                : isDark
                                  ? '#686868 !important'
                                  : '#ABABAB !important',
                        }"
                        @click="toggleNode(submodel)">
                        <template #prepend>
                            <v-chip label border color="primary" size="x-small" class="mr-3">SM</v-chip>
                        </template>
                        <v-list-item-title :class="submodel.isActive ? 'text-primary' : ''">{{
                            submodel.idShort
                        }}</v-list-item-title>
                        <v-overlay
                            :model-value="submodel.isActive"
                            scrim="primary"
                            style="opacity: 0.2"
                            contained
                            persistent></v-overlay>
                    </v-list-item>
                </template>
            </v-card-text>
        </v-card>
    </v-container>
</template>

<script lang="ts">
    import { defineComponent } from 'vue';
    import { useRoute, useRouter } from 'vue-router';
    import { useTheme } from 'vuetify';
    import RequestHandling from '@/mixins/RequestHandling';
    import SubmodelElementHandling from '@/mixins/SubmodelElementHandling';
    import { useAASStore } from '@/store/AASDataStore';
    import { useEnvStore } from '@/store/EnvironmentStore';
    import { useNavigationStore } from '@/store/NavigationStore';

    export default defineComponent({
        name: 'SubmodelList',
        mixins: [RequestHandling, SubmodelElementHandling],

        setup() {
            const theme = useTheme();
            const navigationStore = useNavigationStore();
            const aasStore = useAASStore();
            const envStore = useEnvStore();
            const route = useRoute();
            const router = useRouter();

            return {
                theme, // Theme Object
                navigationStore, // NavigationStore Object
                aasStore, // AASStore Object
                envStore, // EnvironmentStore Object
                route, // Route Object
                router, // Router Object
            };
        },

        data() {
            return {
                submodelData: [] as Array<any>, // Submodel Data
                initialUpdate: false, // Flag to check if the initial update of the Submodel List is needed and/or done
                initialNode: {} as any, // Object to store the initial Node to be selected
            };
        },

        computed: {
            // Check if the current Theme is dark
            isDark() {
                return this.theme.global.current.value.dark;
            },

            // get selected AAS from Store
            selectedAAS() {
                return this.aasStore.getSelectedAAS;
            },

            // gets loading State from Store
            loading() {
                return this.aasStore.getLoadingState;
            },

            // get AAS Registry URL from Store
            aasRegistryServerURL() {
                return this.navigationStore.getAASRegistryURL;
            },

            // get Submodel Registry URL from Store
            submodelRegistryURL() {
                return this.navigationStore.getSubmodelRegistryURL;
            },

            // Check if the current Device is a Mobile Device
            isMobile() {
                return this.navigationStore.getIsMobile;
            },

            // returns the primary color of the current theme
            primaryColor() {
                if (this.isDark) {
                    return this.$vuetify.theme.themes.dark.colors.primary;
                } else {
                    return this.$vuetify.theme.themes.light.colors.primary;
                }
            },
        },

        watch: {
            // initialize Submodel List when AAS gets selected or changes
            selectedAAS() {
                this.initSubmodelList();
            },

            // Resets the Submodel List when the AAS Registry changes
            aasRegistryServerURL() {
                if (!this.aasRegistryServerURL) {
                    this.submodelData = [];
                }
            },

            // Resets the Submodel List when the Submodel Registry changes
            submodelRegistryServerURL() {
                if (!this.submodelRegistryURL) {
                    this.submodelData = [];
                }
            },
        },

        mounted() {
            this.initSubmodelListWithRouteParameters();
        },

        methods: {
            async initSubmodelList() {
                // console.log('Initialize SubmodelList', this.SelectedAAS, this.initialUpdate, this.initialNode);
                // return if no endpoints are available
                if (!this.selectedAAS || !this.selectedAAS.endpoints || this.selectedAAS.endpoints.length === 0) {
                    // this.navigationStore.dispatchSnackbar({ status: true, timeout: 4000, color: 'error', btnColor: 'buttonText', text: 'AAS with no (valid) Endpoint selected!' });
                    this.submodelData = [];
                    return;
                }
                if (this.loading && !this.initialUpdate) return; // return if loading state is true -> prevents multiple requests
                this.aasStore.dispatchLoadingState(true); // set loading state to true
                if (this.selectedAAS.submodels) {
                    let submodelData = await this.requestSubmodels(this.selectedAAS.submodels);
                    // set the isActive prop of the initialNode if it exists and the initialUpdate flag is set
                    if (this.initialUpdate && this.initialNode) {
                        submodelData.forEach((submodel: any) => {
                            if (submodel.path === this.initialNode.path) {
                                submodel.isActive = true;
                                this.aasStore.dispatchNode(submodel);
                                this.aasStore.dispatchRealTimeObject(submodel);
                            }
                        });
                        this.initialUpdate = false;
                        this.initialNode = {};
                        this.submodelData = submodelData;
                    } else {
                        this.submodelData = submodelData;
                    }
                } else {
                    this.submodelData = [];
                }
                this.aasStore.dispatchLoadingState(false);
            },

            // Function to request all Submodels for the selected AAS
            async requestSubmodels(submodelRefs: any) {
                // console.log('SubmodelRefs: ', submodelRefs);
                let submodelPromises = submodelRefs.map((submodelRef: any) => {
                    // retrieve endpoint for submodel from submodel registry
                    // console.log('SubmodelRef: ', submodelRef, ' Submodel Registry: ', this.submodelRegistryURL);
                    // check if submodelRegistryURL includes "/submodel-descriptors" and add id if not (backward compatibility)
                    let submodelRegistryURL = this.submodelRegistryURL;
                    if (!submodelRegistryURL.includes('/submodel-descriptors')) {
                        submodelRegistryURL += '/submodel-descriptors';
                    }
                    const submodelId = submodelRef.keys[0].value;
                    let path = submodelRegistryURL + '/' + this.URLEncode(submodelId);
                    let context = 'retrieving Submodel Endpoint';
                    let disableMessage = false;
                    return this.getRequest(path, context, disableMessage).then((response: any) => {
                        if (response.success) {
                            if (response.data?.id) {
                                // execute if the Request was successful
                                const fetchedSubmodel = response.data;
                                // console.log('SubmodelEndpoint: ', submodelEndpoint);
                                const submodelHref = this.extractEndpointHref(fetchedSubmodel, 'SUBMODEL-3.0');
                                let path = submodelHref;
                                let context = 'retrieving Submodel Data';
                                let disableMessage = true;
                                return this.getRequest(path, context, disableMessage).then((response: any) => {
                                    if (response.success && response?.data?.id) {
                                        // execute if the Request was successful
                                        let submodel = response.data;
                                        // give the Submodel a unique ID
                                        submodel.id = this.UUID();
                                        // set the active State of the Submodel
                                        submodel.isActive = false;
                                        // set the Path of the Submodel
                                        submodel.path = path;
                                        return submodel;
                                    } else {
                                        return this.smNotFound(
                                            response,
                                            submodelId,
                                            path,
                                            "Submodel '" + submodelId + "' not found in SubmodelRepository"
                                        );
                                    }
                                });
                            } else {
                                return this.smNotFound(
                                    response,
                                    submodelId,
                                    path,
                                    "Submodel '" + submodelId + "' not found in SubmodelRegistry"
                                );
                            }
                        }
                    });
                });
                try {
                    const submodels = await Promise.all(submodelPromises);
                    return submodels;
                } finally {
                    this.aasStore.dispatchLoadingState(false);
                }
            },

            // Function to toggle a Node
            toggleNode(submodel: any) {
                // console.log('Selected Submodel: ', submodel);
                // dublicate the selected Node Object
                let localSubmodel = submodel;
                localSubmodel.isActive = true;
                // set the isActive Property of all other Submodels to false
                this.submodelData.forEach((submodel: any) => {
                    if (submodel.id !== localSubmodel.id) {
                        submodel.isActive = false;
                    }
                });
                // Add path of the selected Node to the URL as Router Query
                if (localSubmodel.isActive) {
                    const aasEndpopint = this.extractEndpointHref(this.selectedAAS, 'AAS-3.0');
                    if (this.isMobile) {
                        // Change to SubmodelElementView on Mobile and add the path to the URL
                        this.router.push({
                            path: '/componentvisualization',
                            query: {
                                aas: aasEndpopint,
                                path: localSubmodel.path,
                            },
                        });
                    } else {
                        // just add the path to the URL
                        this.router.push({
                            query: {
                                aas: aasEndpopint,
                                path: localSubmodel.path,
                            },
                        });
                    }
                } else {
                    // remove the path query from the Route entirely
                    let query = { ...this.route.query };
                    delete query.path;
                    this.router.push({ query: query });
                }
                // dispatch the selected Node to the store
                this.aasStore.dispatchNode(localSubmodel);
                // add Submodel to the store (as RealTimeDataObject)
                this.aasStore.dispatchRealTimeObject(localSubmodel);
            },

            // Function to initialize the Submodel List with the Route Parameters
            initSubmodelListWithRouteParameters() {
                // check if the selectedAAS is already set in the Store and initialize the Submodel List if so
                if (this.selectedAAS && this.selectedAAS.endpoints && this.selectedAAS.endpoints.length > 0) {
                    // console.log('init Tree from Route Params: ', this.selectedAAS);
                    this.initSubmodelList();
                }

                // check if the aas Query and the path Query are set in the URL and if so load the Submodel/Submodelelement
                const searchParams = new URL(window.location.href).searchParams;
                const aasEndpoint = searchParams.get('aas');
                const path = searchParams.get('path');

                if (aasEndpoint && path) {
                    // console.log('AAS and Path Queris are set: ', aasEndpoint, path);
                    let node = {} as any;
                    node.path = path;
                    node.isActive = true;
                    // set the isActive prop of the node in submodelData to true
                    this.initialUpdate = true;
                    this.initialNode = node;
                }
            },

            backToAASList() {
                this.router.push({ name: 'AASList', query: this.route.query });
            },
        },
    });
</script>
