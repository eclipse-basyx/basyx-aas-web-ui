<template>
    <v-container fluid class="pa-0">
        <v-card
            :min-width="isMobile ? 0 : 700"
            :flat="isMobile ? true : false"
            :color="isMobile ? 'card' : 'navigationMenu'"
            :style="{ 'border-style': isMobile ? '' : 'solid', 'border-width': isMobile ? '' : '1px' }">
            <v-row>
                <v-col :cols="isMobile ? 12 : 4" :class="isMobile ? 'bg-card' : 'bg-navigationMenuSecondary'">
                    <v-card
                        variant="flat"
                        style="border-radius: 0px"
                        class="pt-3"
                        :color="isMobile ? 'card' : 'navigationMenuSecondary'">
                        <template v-if="!isMobile">
                            <span class="mx-3 text-primary">General Settings</span>
                            <v-list
                                nav
                                class="pa-0 mx-3 mt-3"
                                :class="isMobile ? 'bg-card' : 'bg-navigationMenuSecondary'">
                                <v-list-item>
                                    <v-list-item-title>Endpoints</v-list-item-title>
                                    <template v-slot:append>
                                        <v-icon>mdi-chevron-right</v-icon>
                                    </template>
                                </v-list-item>
                            </v-list>
                            <v-divider class="mb-3"></v-divider>
                        </template>
                        <span v-if="!isMobile" class="mx-3 text-primary">Switch to</span>
                        <!-- Select the view you want to use -->
                        <v-list v-if="!isMobile" nav class="pa-0 ma-3 bg-navigationMenuSecondary">
                            <v-list-item to="/" @click="closeMenu()">
                                <v-list-item-title>AAS Editor</v-list-item-title>
                            </v-list-item>
                            <v-list-item to="/aasviewer" @click="closeMenu()">
                                <v-list-item-title>AAS Viewer</v-list-item-title>
                            </v-list-item>
                            <v-list-item v-if="dashboardAvailable" to="/dashboard" @click="closeMenu()">
                                <v-list-item-title>Dashboard</v-list-item-title>
                            </v-list-item>
                            <v-list-item to="/about" @click="closeMenu()">
                                <v-list-item-title>About</v-list-item-title>
                            </v-list-item>
                        </v-list>
                    </v-card>
                </v-col>
                <v-col
                    :cols="isMobile ? 12 : 8"
                    :class="isMobile ? 'pt-0 mb-2 px-6 bg-card' : 'pt-4 bg-navigationMenu'">
                    <!-- Configure AAS Discovery URL -->
                    <v-text-field
                        variant="outlined"
                        density="compact"
                        hide-details
                        class="my-3"
                        :class="isMobile ? '' : 'mr-3'"
                        label="AAS Discovery URL"
                        v-model="aasDiscoveryURL"
                        @keydown.native.enter="connectToAASDiscovery()">
                        <template v-slot:append-inner>
                            <v-btn
                                size="small"
                                variant="elevated"
                                color="primary"
                                class="text-buttonText"
                                style="right: -4px"
                                @click.stop="connectToAASDiscovery()"
                                :loading="loadingAASDiscovery"
                                >Connect</v-btn
                            >
                        </template>
                    </v-text-field>
                    <!-- Configure AAS Registry URL -->
                    <v-text-field
                        variant="outlined"
                        density="compact"
                        hide-details
                        class="my-3"
                        :class="isMobile ? '' : 'mr-3'"
                        label="AAS Registry URL"
                        v-model="aasRegistryURL"
                        @keydown.native.enter="connectToAASRegistry()">
                        <template v-slot:append-inner>
                            <v-btn
                                size="small"
                                variant="elevated"
                                color="primary"
                                class="text-buttonText"
                                style="right: -4px"
                                @click.stop="connectToAASRegistry()"
                                :loading="loadingAASRegistry"
                                >Connect</v-btn
                            >
                        </template>
                    </v-text-field>
                    <!-- Configure Submodel Registry URL -->
                    <v-text-field
                        variant="outlined"
                        density="compact"
                        hide-details
                        class="my-3"
                        :class="isMobile ? '' : 'mr-3'"
                        label="Submodel Registry URL"
                        v-model="submodelRegistryURL"
                        @keydown.native.enter="connectToSubmodelRegistry()">
                        <template v-slot:append-inner>
                            <v-btn
                                size="small"
                                variant="elevated"
                                color="primary"
                                class="text-buttonText"
                                style="right: -4px"
                                @click.stop="connectToSubmodelRegistry()"
                                :loading="loadingSubmodelRegistry"
                                >Connect</v-btn
                            >
                        </template>
                    </v-text-field>
                    <!-- Configure AAS Repository URL -->
                    <v-text-field
                        variant="outlined"
                        density="compact"
                        hide-details
                        class="my-3"
                        :class="isMobile ? '' : 'mr-3'"
                        label="AAS Repository URL"
                        v-model="AASRepoURL"
                        @keydown.native.enter="connectToEnvironment('AAS')">
                        <template v-slot:append-inner>
                            <v-btn
                                size="small"
                                variant="elevated"
                                color="primary"
                                class="text-buttonText"
                                style="right: -4px"
                                @click.stop="connectToEnvironment('AAS')"
                                :loading="loadingAASRepo"
                                >Connect</v-btn
                            >
                        </template>
                    </v-text-field>
                    <!-- Configure Submodel Repository URL -->
                    <v-text-field
                        variant="outlined"
                        density="compact"
                        hide-details
                        class="my-3"
                        :class="isMobile ? '' : 'mr-3'"
                        label="Submodel Repository URL"
                        v-model="SubmodelRepoURL"
                        @keydown.native.enter="connectToEnvironment('Submodel')">
                        <template v-slot:append-inner>
                            <v-btn
                                size="small"
                                variant="elevated"
                                color="primary"
                                class="text-buttonText"
                                style="right: -4px"
                                @click.stop="connectToEnvironment('Submodel')"
                                :loading="loadingSubmodelRepo"
                                >Connect</v-btn
                            >
                        </template>
                    </v-text-field>
                    <!-- Configure Concept Description Repository URL -->
                    <v-text-field
                        variant="outlined"
                        density="compact"
                        hide-details
                        class="my-3"
                        :class="isMobile ? '' : 'mr-3'"
                        label="Concept Description Repository URL"
                        v-model="ConceptDescriptionRepoURL"
                        @keydown.native.enter="connectToEnvironment('ConceptDescription')">
                        <template v-slot:append-inner>
                            <v-btn
                                size="small"
                                variant="elevated"
                                color="primary"
                                class="text-buttonText"
                                style="right: -4px"
                                @click.stop="connectToEnvironment('ConceptDescription')"
                                :loading="loadingConceptDescriptionRepo"
                                >Connect</v-btn
                            >
                        </template>
                    </v-text-field>
                </v-col>
            </v-row>
            <!-- Platform I 4.0 Logo -->
            <v-row v-if="isMobile">
                <v-col align="center" class="bg-card">
                    <v-img src="I40.png" max-width="260px" :style="{ filter: isDark ? 'invert(1)' : 'invert(0)' }">
                        <template #sources>
                            <source srcset="@/assets/I40.png" />
                        </template>
                    </v-img>
                </v-col>
            </v-row>
        </v-card>
    </v-container>
</template>

<script lang="ts">
    import { defineComponent } from 'vue';
    import { useRoute } from 'vue-router';
    import { useNavigationStore } from '@/store/NavigationStore';
    import { useAASStore } from '@/store/AASDataStore';
    import { useEnvStore } from '@/store/EnvironmentStore';
    import { useTheme } from 'vuetify';
    import RequestHandling from '@/mixins/RequestHandling';
    import DashboardHandling from '@/mixins/DashboardHandling';

    export default defineComponent({
        name: 'MainMenu',
        mixins: [RequestHandling, DashboardHandling],

        setup() {
            const theme = useTheme();
            const navigationStore = useNavigationStore();
            const aasStore = useAASStore();
            const envStore = useEnvStore();
            const route = useRoute();

            return {
                theme, // Theme Object
                navigationStore, // NavigationStore Object
                aasStore, // AASStore Object
                envStore, // EnvironmentStore Object
                route, // Route Object
            };
        },

        data() {
            return {
                aasDiscoveryURL: '', // AAS Discovery Service URL
                aasRegistryURL: '', // AAS Registry URL
                submodelRegistryURL: '', // Submodel Registry URL
                AASRepoURL: '', // AAS Repository URL
                SubmodelRepoURL: '', // Submodel Repository URL
                ConceptDescriptionRepoURL: '', // Concept Description Repository URL
                loadingAASDiscovery: false, // Loading State of the AAS Discovery Service Connection
                loadingAASRegistry: false, // Loading State of the AAS Registry Connection
                loadingSubmodelRegistry: false, // Loading State of the Submodel Registry Connection
                loadingAASRepo: false, // Loading State of the AAS Repository Connection
                loadingSubmodelRepo: false, // Loading State of the Submodel Repository Connection
                loadingConceptDescriptionRepo: false, // Loading State of the Concept Description Repository Connection
                dashboardAvailable: false, // Dashboard Availability
            };
        },

        mounted() {
            this.aasDiscoveryURL = this.aasDiscoveryServerURL;
            this.aasRegistryURL = this.aasRegistryServerURL;
            this.submodelRegistryURL = this.submodelRegistryServerURL;
            this.AASRepoURL = this.aasRepoURL;
            this.SubmodelRepoURL = this.submodelRepoURL;
            this.ConceptDescriptionRepoURL = this.conceptDescriptionRepoURL;
            this.isDashboardAvailable();
        },

        watch: {
            // watch for route changes (name) and reset selected AAS and selected Node
            currentRoute() {
                this.aasStore.dispatchSelectedAAS({});
            },
        },

        computed: {
            // Check if the current Device is a Mobile Device
            isMobile() {
                return this.navigationStore.getIsMobile;
            },

            // get AAS Discovery URL from Store
            aasDiscoveryServerURL() {
                return this.navigationStore.getAASDiscoveryURL;
            },

            // get AAS Registry URL from Store
            aasRegistryServerURL() {
                return this.navigationStore.getAASRegistryURL;
            },

            // get Submodel Registry URL from Store
            submodelRegistryServerURL() {
                return this.navigationStore.getSubmodelRegistryURL;
            },

            // Get the AAS Repository URL from the Store
            aasRepoURL() {
                return this.navigationStore.getAASRepoURL;
            },

            // Get the Submodel Repository URL from the Store
            submodelRepoURL() {
                return this.navigationStore.getSubmodelRepoURL;
            },

            // Get the Concept Description Repository URL from the Store
            conceptDescriptionRepoURL() {
                return this.navigationStore.getConceptDescriptionRepoURL;
            },

            // Check if the current Theme is dark
            isDark() {
                return this.theme.global.current.value.dark;
            },

            // get the current route name
            currentRoute() {
                return this.route.name;
            },
        },

        methods: {
            // Function to connect to the AAS Discovery Service
            connectToAASDiscovery() {
                // console.log('connect to aas discovery service: ' + this.aasDiscoveryServiceURL);
                if (this.aasDiscoveryURL != '') {
                    this.loadingAASDiscovery = true;
                    // check if aasDiscoveryURL includes "/lookup/shells" and add id if not (backward compatibility)
                    if (!this.aasDiscoveryURL.includes('/lookup/shells')) {
                        this.aasDiscoveryURL += '/lookup/shells';
                    }
                    let path = this.aasDiscoveryURL;
                    let context = 'connecting to AAS Discovery Service';
                    let disableMessage = false;
                    this.getRequest(path, context, disableMessage).then((response: any) => {
                        this.loadingAASDiscovery = false;
                        if (response.success) {
                            this.navigationStore.dispatchAASDiscoveryURL(this.aasDiscoveryURL); // save the URL in the NavigationStore
                            window.localStorage.setItem('aasDiscoveryURL', this.aasDiscoveryURL); // save the URL in the local storage
                        } else {
                            this.navigationStore.dispatchAASDiscoveryURL(''); // clear the AAS Discovery Service URL in the NavigationStore
                            window.localStorage.removeItem('aasDiscoveryURL'); // remove the URL from the local storage
                        }
                    });
                }
            },

            // Function to connect to the AAS Registry
            connectToAASRegistry() {
                // console.log('connect to aas registry: ' + this.aasRegistryURL);
                if (this.aasRegistryURL != '') {
                    this.loadingAASRegistry = true;
                    // check if aasRegistryURL includes "/shell-descriptors" and add id if not (backward compatibility)
                    if (!this.aasRegistryURL.includes('/shell-descriptors')) {
                        this.aasRegistryURL += '/shell-descriptors';
                    }
                    let path = this.aasRegistryURL;
                    let context = 'connecting to AAS Registry';
                    let disableMessage = false;
                    this.getRequest(path, context, disableMessage).then((response: any) => {
                        this.loadingAASRegistry = false;
                        if (response.success) {
                            this.navigationStore.dispatchAASRegistryURL(this.aasRegistryURL); // save the URL in the NavigationStore
                            window.localStorage.setItem('aasRegistryURL', this.aasRegistryURL); // save the URL in the local storage
                        } else {
                            this.navigationStore.dispatchAASRegistryURL(''); // clear the AAS Registry URL in the NavigationStore
                            window.localStorage.removeItem('aasRegistryURL'); // remove the URL from the local storage
                        }
                    });
                }
            },

            // Function to connect to the Submodel Registry
            connectToSubmodelRegistry() {
                // console.log('connect to submodel registry: ' + this.submodelRegistryURL);
                if (this.submodelRegistryURL != '') {
                    this.loadingSubmodelRegistry = true;
                    // check if submodelRegistryURL includes "/submodel-descriptors" and add id if not (backward compatibility)
                    if (!this.submodelRegistryURL.includes('/submodel-descriptors')) {
                        this.submodelRegistryURL += '/submodel-descriptors';
                    }
                    let path = this.submodelRegistryURL;
                    let context = 'connecting to Submodel Registry';
                    let disableMessage = false;
                    this.getRequest(path, context, disableMessage).then((response: any) => {
                        this.loadingSubmodelRegistry = false;
                        if (response.success) {
                            this.navigationStore.dispatchSubmodelRegistryURL(this.submodelRegistryURL); // save the URL in the NavigationStore
                            window.localStorage.setItem('submodelRegistryURL', this.submodelRegistryURL); // save the URL in the local storage
                        } else {
                            this.navigationStore.dispatchSubmodelRegistryURL(''); // clear the Submodel Registry URL in the NavigationStore
                            window.localStorage.removeItem('submodelRegistryURL'); // remove the URL from the local storage
                        }
                    });
                }
            },

            // Function to connect to the respective Repository
            connectToEnvironment(RepoType: string) {
                // console.log('connect to ' + RepoType + ' Repository: ' + (this as any)[RepoType + 'RepoURL']);
                if ((this as any)[RepoType + 'RepoURL'] != '') {
                    (this as any)['loading' + RepoType + 'Repo'] = true;
                    let path =
                        (this as any)[RepoType + 'RepoURL'] +
                        '?limit=1' +
                        (RepoType == 'Submodel' ? '&level=core' : '');
                    let context = 'connecting to ' + RepoType + ' Repository';
                    let disableMessage = false;
                    this.getRequest(path, context, disableMessage).then((response: any) => {
                        (this as any)['loading' + RepoType + 'Repo'] = false;
                        if (response.success) {
                            this.navigationStore.dispatchRepoURL(RepoType, (this as any)[RepoType + 'RepoURL']); // save the URL in the NavigationStore
                            window.localStorage.setItem(RepoType + 'RepoURL', (this as any)[RepoType + 'RepoURL']); // save the URL in the local storage
                        } else {
                            this.navigationStore.dispatchRepoURL(RepoType, ''); // clear the URL in the NavigationStore
                            window.localStorage.removeItem(RepoType + 'RepoURL'); // remove the URL from the local storage
                        }
                    });
                }
            },

            // Function to close the menu
            closeMenu() {
                this.$emit('closeMenu');
            },

            isDashboardAvailable() {
                if (!this.dashboardServicePath || this.dashboardServicePath == '') return;
                // the path is this.dashboardServicePath but with /api/elements stripped and /test added
                let path = this.dashboardServicePath.replace('/api/elements', '/test');
                let context = 'checking if dashboard is available';
                let disableMessage = true;
                this.getRequest(path, context, disableMessage).then((response: any) => {
                    if (response.success) {
                        this.dashboardAvailable = true;
                    } else {
                        this.dashboardAvailable = false;
                    }
                });
            },
        },
    });
</script>
