<template>
    <v-container>
        <!-- Main App Bar -->
        <v-app-bar class="px-3" color="appBar">
            <v-row class="mx-0" align="center">
                <v-card flat color="appBar" class="ml-2">
                    <!-- Logo in the App Bar -->
                    <img :src="EnvLogoPath" style="min-height: 42px; max-height: 42px" alt="Logo" />
                </v-card>
                <!-- Menu Toggle (Desktop) -->
                <v-menu v-if="!isMobile" v-model="mainMenu" :close-on-content-click="false">
                    <template #activator="{ props: menu }">
                        <v-tooltip text="Main Menu" location="bottom" :open-delay="600">
                            <template #activator="{ props: tooltip }">
                                <v-app-bar-nav-icon
                                    class="ml-3"
                                    v-bind="mergeProps(menu, tooltip)"></v-app-bar-nav-icon>
                            </template>
                        </v-tooltip>
                    </template>
                    <!-- Main Menu Component -->
                    <MainMenu @close-menu="mainMenu = false"></MainMenu>
                </v-menu>
                <v-spacer></v-spacer>
                <!-- Settings-Menu for Auto-Sync and Sync-Interval -->
                <AutoSync v-if="showAutoSync"></AutoSync>
                <!-- Platform I 4.0 Logo -->
                <v-img
                    v-if="!isMobile"
                    src="I40.png"
                    max-width="260px"
                    :style="{ filter: isDark ? 'invert(1)' : 'invert(0)' }">
                    <template #sources>
                        <source srcset="@/assets/I40.png" />
                    </template>
                </v-img>
                <!-- Menu Toggle (Mobile) -->
                <v-dialog v-if="isMobile" v-model="mainMenu" fullscreen :z-index="9993" :transition="false">
                    <template #activator="{ props }">
                        <v-btn icon="mdi-cog" v-bind="props" variant="text"></v-btn>
                    </template>
                    <v-card color="card">
                        <v-toolbar color="appBar" elevation="3" class="mb-3">
                            <v-toolbar-title>Settings</v-toolbar-title>
                            <v-spacer></v-spacer>
                            <v-toolbar-items>
                                <v-btn icon="mdi-close" class="mr-3" @click="mainMenu = false"></v-btn>
                            </v-toolbar-items>
                        </v-toolbar>
                        <!-- Auto-Sync and Theme Settings in Mobile View -->
                        <v-row justify="center" style="max-height: 128px !important">
                            <v-col cols="12" class="text-center">
                                <ThemeSwitch></ThemeSwitch>
                            </v-col>
                        </v-row>
                        <v-divider></v-divider>
                        <!-- Main Menu Component -->
                        <MainMenu @close-menu="mainMenu = false"></MainMenu>
                    </v-card>
                </v-dialog>
                <!-- Settings Menu -->
                <Settings v-if="!isMobile"></Settings>
                <!-- Auth Status -->
                <v-tooltip text="Authorization Status" location="bottom" :open-delay="600">
                    <template #activator="{ props }">
                        <v-icon v-bind="props" class="mr-3">{{
                            isAuthEnabled ? (authStatus ? 'mdi-lock-check' : 'mdi-lock-remove') : 'mdi-lock-off'
                        }}</v-icon>
                    </template>
                    <span>{{
                        isAuthEnabled ? (authStatus ? 'Authenticated' : 'Not Authenticated') : 'Authentication disabled'
                    }}</span>
                </v-tooltip>
                <!-- Logout Button -->
                <v-tooltip
                    v-if="isAuthEnabled && authStatus"
                    text="Authorization Status"
                    location="bottom"
                    :open-delay="600">
                    <template #activator="{ props }">
                        <v-icon v-bind="props" @click="logout">mdi-logout</v-icon>
                    </template>
                    <span>Logout</span>
                </v-tooltip>
            </v-row>
        </v-app-bar>

        <!-- global Snackbar -->
        <v-snackbar v-model="Snackbar.status" :color="Snackbar.color" :timeout="Snackbar.timeout" location="top">
            <v-card v-if="Snackbar.status === true && Snackbar.color == 'error' && Snackbar.baseError">
                <v-card-title class="text-subtitle-2">{{ Snackbar.baseError }}</v-card-title>
                <v-divider></v-divider>
                <v-card-text style="max-height: 200px; overflow-y: auto; max-width: 590px">
                    <pre class="text-subtitleText text-caption">{{ Snackbar.extendedError }}</pre>
                </v-card-text>
            </v-card>
            <span v-else class="text-buttonText">{{ Snackbar.text }}</span>
            <template #actions>
                <v-btn :color="Snackbar.btnColor" variant="plain" @click="closeSnackbar()">
                    <v-icon>mdi-close</v-icon>
                </v-btn>
            </template>
        </v-snackbar>

        <!-- App Footer -->
        <v-footer app class="bg-appBar text-center d-flex flex-column py-0">
            <v-list-item class="px-1">
                <v-list-item-title>
                    <div>{{ new Date().getFullYear() }} — <strong>Eclipse BaSyx™ ©</strong></div>
                </v-list-item-title>
            </v-list-item>
        </v-footer>

        <!-- left Side Menu with the AAS List -->
        <v-navigation-drawer
            v-if="showAASList && !isMobile"
            v-model="drawerVisibility"
            :width="336"
            color="appNavigation"
            class="leftMenu"
            @update:model-value="updateDrawerState">
            <AASList />
        </v-navigation-drawer>
        <v-btn
            v-if="showAASList && !isMobile && !drawerVisibility"
            style="position: fixed; bottom: 50px; left: 10px; z-index: 10"
            icon="mdi-chevron-double-right"
            @click="extendSidebar()"></v-btn>

        <!-- Mobile Menu -->
        <v-menu
            v-if="showMobileMenu"
            v-model="mobileMenu"
            transition="slide-y-reverse-transition"
            style="z-index: 9992">
            <template #activator="{ props }">
                <v-btn
                    v-bind="props"
                    :icon="mobileMenu ? 'mdi-close' : 'mdi-dots-vertical'"
                    :color="mobileMenu ? 'invertedButton' : 'primary'"
                    class="text-buttonText"
                    style="position: fixed; bottom: 50px; right: 10px; z-index: 9990"></v-btn>
            </template>
            <div class="mr-1 mb-6">
                <!-- AAS Viewer -->
                <v-row justify="end" align="center">
                    <v-col cols="auto" class="pr-1">
                        <v-card class="py-1 px-2 text-buttonText" color="lightButton" to="/aaslist">AAS Viewer</v-card>
                    </v-col>
                    <v-col cols="auto" class="py-1">
                        <v-btn
                            icon="mdi-format-list-text"
                            to="/aaslist"
                            :active="route.path === '/aaslist'"
                            style="z-index: 9990"
                            size="small"
                            color="primary"
                            class="text-buttonText"></v-btn>
                    </v-col>
                </v-row>
                <!-- Dashboard -->
                <v-row v-if="dashboardAvailable" justify="end" align="center">
                    <v-col cols="auto" class="pr-1">
                        <v-card class="py-1 px-2 text-buttonText" color="lightButton" to="/dashboard">Dashboard</v-card>
                    </v-col>
                    <v-col cols="auto" class="py-1">
                        <v-btn
                            icon="mdi-chart-timeline-variant-shimmer"
                            to="/dashboard"
                            :active="route.path === '/dashboard'"
                            style="z-index: 9990"
                            size="small"
                            color="primary"
                            class="text-buttonText"></v-btn>
                    </v-col>
                </v-row>
                <!-- About -->
                <v-row justify="end" align="center">
                    <v-col cols="auto" class="pr-1">
                        <v-card class="py-1 px-2 text-buttonText" color="lightButton" to="/about">About</v-card>
                    </v-col>
                    <v-col cols="auto" class="py-1">
                        <v-btn
                            icon="mdi-format-list-group"
                            to="/about"
                            :active="route.path === '/about'"
                            style="z-index: 9990"
                            size="small"
                            color="primary"
                            class="text-buttonText"></v-btn>
                    </v-col>
                </v-row>
            </div>
        </v-menu>
    </v-container>
</template>

<script lang="ts">
    import { defineComponent } from 'vue';
    import { mergeProps } from 'vue';
    import { useRoute } from 'vue-router';
    import { useTheme } from 'vuetify';
    import RequestHandling from '@/mixins/RequestHandling';
    import { useAuthStore } from '@/store/AuthStore';
    import { useEnvStore } from '@/store/EnvironmentStore';
    import { useNavigationStore } from '@/store/NavigationStore';
    import AASList from './AASList.vue';
    import AutoSync from './AutoSync.vue';
    import MainMenu from './MainMenu.vue';
    import Settings from './Settings.vue';
    import ThemeSwitch from './Settings/ThemeSwitch.vue';

    export default defineComponent({
        name: 'AppNavigation', // Name of the Component
        components: {
            AASList, // Component to display the AAS List
            AutoSync, // Component to display the Auto-Sync Settings
            ThemeSwitch, // Component to display the Theme Switch
            MainMenu, // Component to display the Main Menu
            Settings, // Component to display the Settings Menu
        },
        mixins: [RequestHandling],

        setup() {
            const theme = useTheme();
            const navigationStore = useNavigationStore();
            const envStore = useEnvStore();
            const authStore = useAuthStore();
            const route = useRoute();

            return {
                theme, // Theme Object
                navigationStore, // NavigationStore Object
                envStore, // EnvironmentStore Object
                authStore, // AuthorizationStore Object
                route, // Route Object
            };
        },

        data() {
            return {
                loadingAASDiscovery: false, // Variable to show the loading animation on the Connect Button for the AAS Discovery
                loadingAASRegistry: false, // Variable to show the loading animation on the Connect Button for the AAS Registry
                loadingSubmodelRegistry: false, // Variable to show the loading animation on the Connect Button for the Submodel Registry
                aasDiscoveryURL: '', // Variable to store the AAS Discovery URL
                aasRegistryURL: '', // Variable to store the AAS Registry URL
                submodelRegistryURL: '', // Variable to store the Submodel Registry URL
                AASRepoURL: '', // Variable to store the AAS Repository URL
                SubmodelRepoURL: '', // Variable to store the Submodel Repository URL
                ConceptDescriptionRepoURL: '', // Variable to store the Concept Description Repository URL
                mainMenu: false, // Variable to show the Main Menu
                mobileMenu: false, // Variable to show the Mobile Menu
                dashboardAvailable: false, // Dashboard Availability
                endpointConfigAvailable: true,
                drawerVisibility: true, // Variable to show the AAS List Drawer
            };
        },

        computed: {
            // Check if the current Device is a Mobile Device
            isMobile() {
                return this.navigationStore.getIsMobile;
            },

            // Check if the current Theme is dark
            isDark() {
                return this.theme.global.current.value.dark;
            },

            // get snackbar data from store
            Snackbar() {
                return this.navigationStore.getSnackbar;
            },

            // to check if the MainWindow is the current Route
            showAASList() {
                return ['MainWindow', 'AASViewer'].includes(this.route.name as string);
            },

            // get Drawer State from store
            drawerState() {
                // Computed Property to control the state of the Navigation Drawer (true -> collapsed, false -> extended)
                return this.navigationStore.getDrawerState;
            },

            // Get the Env Variable for the AAS Discovery URL from the store
            EnvAASDiscoveryPath() {
                return this.envStore.getEnvAASDiscoveryPath;
            },

            // Get the Env Variable for the AAS Registry URL from the store
            EnvAASRegistryPath() {
                return this.envStore.getEnvAASRegistryPath;
            },

            // Get the Env Variable for the Submodel Registry URL from the store
            EnvSubmodelRegistryPath() {
                return this.envStore.getEnvSubmodelRegistryPath;
            },

            // Get the Env Variable for the AAS Repo URL from the store
            EnvAASRepoPath() {
                return this.envStore.getEnvAASRepoPath;
            },

            // Get the Env Variable for the Submodel Repo URL from the store
            EnvSubmodelRepoPath() {
                return this.envStore.getEnvSubmodelRepoPath;
            },

            // Get the Env Variable for the Concept Description Repo URL from the store
            EnvConceptDescriptionRepoPath() {
                return this.envStore.getEnvConceptDescriptionRepoPath;
            },

            // Get the Env Variable for the logo path from the store
            EnvLogoPath() {
                return this.envStore.getEnvLogoPath;
            },

            getEndpointConfigAvailable() {
                return this.envStore.getEndpointConfigAvailable;
            },

            dashboardServicePath() {
                return this.envStore.getEnvDashboardServicePath;
            },

            // Determine if Mobile Menu should be shown
            showMobileMenu() {
                let showMenu = false;
                if (this.isMobile && !this.mainMenu) {
                    showMenu = true;
                }
                return showMenu;
            },

            // Determine if Auto-Sync should be shown
            showAutoSync() {
                let showAutoSync = false;
                if (
                    this.route.name === 'MainWindow' ||
                    this.route.name === 'AASList' ||
                    this.route.name === 'SubmodelList' ||
                    this.route.name === 'ComponentVisualization' ||
                    this.route.name === 'AASViewer'
                ) {
                    showAutoSync = true;
                }
                return showAutoSync;
            },

            // get the keycloak authStatus from the store
            authStatus() {
                return this.authStore.getAuthStatus ? 'Authenticated' : 'Not Authenticated';
            },

            // Determine if Authorization is enabled
            isAuthEnabled() {
                return this.authStore.getAuthEnabled;
            },
        },

        watch: {
            // Watch for changes in the Snackbar Object and close it after the Timeout
            Snackbar() {
                if (this.Snackbar.status) {
                    setTimeout(() => this.closeSnackbar(), this.Snackbar.timeout);
                }
            },

            drawerState() {
                this.drawerVisibility = this.drawerState;
            },
        },

        mounted() {
            this.isDashboardAvailable();
            this.endpointConfigAvailable = this.getEndpointConfigAvailable;
            // check the local storage for a saved theme preference
            let theme = localStorage.getItem('theme');
            if (theme) {
                if (theme == 'dark' || theme == 'light') {
                    this.theme.global.name.value = theme;
                } else {
                    // sets the Theme according to the Users preferred Theme
                    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                        this.theme.global.name.value = 'dark';
                    } else {
                        this.theme.global.name.value = 'light';
                    }
                }
            } else {
                // sets the Theme according to the Users preferred Theme
                if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                    this.theme.global.name.value = 'dark';
                } else {
                    this.theme.global.name.value = 'light';
                }
            }

            // auto connect to aas discovery that was saved in local storage
            if (this.endpointConfigAvailable) {
                let aasDiscoveryURL = window.localStorage.getItem('aasDiscoveryURL');
                if (aasDiscoveryURL) {
                    this.aasDiscoveryURL = aasDiscoveryURL;
                    this.connectToAASDiscovery();
                    // console.log('DiscoveryURL was found in local storage', DiscoveryURL);
                }
            }

            if (!this.aasDiscoveryURL && this.EnvAASDiscoveryPath && this.EnvAASDiscoveryPath != '') {
                this.aasDiscoveryURL = this.EnvAASDiscoveryPath;
                this.connectToAASDiscovery();
            }

            // auto connect to aas registry that was saved in local storage
            if (this.endpointConfigAvailable) {
                let aasRegistryURL = window.localStorage.getItem('aasRegistryURL');
                if (aasRegistryURL) {
                    this.aasRegistryURL = aasRegistryURL;
                    this.connectToAASRegistry();
                    // console.log('RegistryURL was found in local storage', RegistryURL);
                }
            }

            if (!this.aasRegistryURL && this.EnvAASRegistryPath && this.EnvAASRegistryPath != '') {
                this.aasRegistryURL = this.EnvAASRegistryPath;
                this.connectToAASRegistry();
            }

            // auto connect to submodel registry that was saved in local storage
            if (this.endpointConfigAvailable) {
                let submodelRegistryURL = window.localStorage.getItem('submodelRegistryURL');
                if (submodelRegistryURL) {
                    this.submodelRegistryURL = submodelRegistryURL;
                    this.connectToSubmodelRegistry();
                    // console.log('SubmodelRegistryURL was found in local storage', SubmodelRegistryURL);
                }
            }
            if (!this.submodelRegistryURL && this.EnvSubmodelRegistryPath && this.EnvSubmodelRegistryPath != '') {
                this.submodelRegistryURL = this.EnvSubmodelRegistryPath;
                this.connectToSubmodelRegistry();
            }

            // auto connect to AAS Repository that was saved in local storage
            if (this.endpointConfigAvailable) {
                let aasRepoURL = window.localStorage.getItem('AASRepoURL');
                if (aasRepoURL) {
                    this.AASRepoURL = aasRepoURL;
                    this.connectToEnvironment('AAS');
                    // console.log('AASRepoURL was found in local storage', AASRepoURL);
                }
            }

            if (!this.AASRepoURL && this.EnvAASRepoPath && this.EnvAASRepoPath != '') {
                this.AASRepoURL = this.EnvAASRepoPath;
                this.connectToEnvironment('AAS');
            }

            // auto connect to Submodel Repository that was saved in local storage
            if (this.endpointConfigAvailable) {
                let submodelRepoURL = window.localStorage.getItem('SubmodelRepoURL');
                if (submodelRepoURL) {
                    this.SubmodelRepoURL = submodelRepoURL;
                    this.connectToEnvironment('Submodel');
                    //     // console.log('SubmodelRepoURL was found in local storage', SubmodelRepoURL);
                }
            }

            if (!this.SubmodelRepoURL && this.EnvSubmodelRepoPath && this.EnvSubmodelRepoPath != '') {
                this.SubmodelRepoURL = this.EnvSubmodelRepoPath;
                this.connectToEnvironment('Submodel');
            }

            // auto connect to Concept Description Repository that was saved in local storage
            if (this.endpointConfigAvailable) {
                let conceptDescriptionRepoURL = window.localStorage.getItem('ConceptDescriptionRepoURL');
                if (conceptDescriptionRepoURL) {
                    this.ConceptDescriptionRepoURL = conceptDescriptionRepoURL;
                    this.connectToEnvironment('ConceptDescription');
                    // console.log('ConceptDescriptionRepoURL was found in local storage', ConceptDescriptionRepoURL);
                }
            }

            if (
                !this.ConceptDescriptionRepoURL &&
                this.EnvConceptDescriptionRepoPath &&
                this.EnvConceptDescriptionRepoPath != ''
            ) {
                this.ConceptDescriptionRepoURL = this.EnvConceptDescriptionRepoPath;
                this.connectToEnvironment('ConceptDescription');
            }
            // }
        },

        methods: {
            mergeProps,

            // Function to connect to the AAS Discovery
            connectToAASDiscovery() {
                // console.log('connect to aas discovery: ' + this.aasDiscoveryURL);
                if (this.aasDiscoveryURL != '') {
                    this.loadingAASDiscovery = true;
                    // check if aasDiscoveryURL includes "/lookup/shells" and add id if not (backward compatibility)
                    if (!this.aasDiscoveryURL.includes('/lookup/shells')) {
                        this.aasDiscoveryURL += '/lookup/shells';
                    }

                    /* Check for automatic connection is disabled. Only user entered connections in the frontend will be tested from now on (signed off Aaron Zielstorff, 13.04.2024) */
                    // let path = this.aasDiscoveryURL;
                    // let context = 'connecting to AAS Discovery'
                    // let disableMessage = false;
                    // this.getRequest(path, context, disableMessage).then((response: any) => {
                    //     this.loadingAASDiscovery = false;
                    //     if (response.success) {
                    //         this.navigationStore.dispatchAASDiscoveryURL(this.aasDiscoveryURL); // save the URL in the NavigationStore
                    //         window.localStorage.setItem('aasDiscoveryURL', this.aasDiscoveryURL); // save the URL in the local storage
                    //     } else {
                    //         this.navigationStore.dispatchAASDiscoveryURL(''); // clear the AAS Discovery URL in the NavigationStore
                    //         window.localStorage.removeItem('aasDiscoveryURL'); // remove the URL from the local storage
                    //     }
                    // });

                    /* Connection will be set directly in the centralized store (even if it could potentially be false -> wrong Docker config or old config data in the browsers local storage) */
                    this.navigationStore.dispatchAASDiscoveryURL(this.aasDiscoveryURL); // save the URL in the NavigationStore
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

                    /* Check for automatic connection is disabled. Only user entered connections in the frontend will be tested from now on (signed off Aaron Zielstorff, 13.04.2024) */
                    // let path = this.aasRegistryURL;
                    // let context = 'connecting to AAS Registry'
                    // let disableMessage = false;
                    // this.getRequest(path, context, disableMessage).then((response: any) => {
                    //     this.loadingAASRegistry = false;
                    //     if (response.success) {
                    //         this.navigationStore.dispatchAASRegistryURL(this.aasRegistryURL, false); // save the URL in the NavigationStore
                    //         window.localStorage.setItem('aasRegistryURL', this.aasRegistryURL); // save the URL in the local storage
                    //     } else {
                    //         this.navigationStore.dispatchAASRegistryURL('', false); // clear the AAS Registry URL in the NavigationStore
                    //         window.localStorage.removeItem('aasRegistryURL'); // remove the URL from the local storage
                    //     }
                    // });

                    /* Connection will be set directly in the centralized store (even if it could potentially be false -> wrong Docker config or old config data in the browsers local storage) */
                    this.navigationStore.dispatchAASRegistryURL(this.aasRegistryURL, false); // save the URL in the NavigationStore
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

                    /* Check for automatic connection is disabled. Only user entered connections in the frontend will be tested from now on (signed off Aaron Zielstorff, 13.04.2024) */
                    // let path = this.submodelRegistryURL;
                    // let context = 'connecting to Submodel Registry'
                    // let disableMessage = false;
                    // this.getRequest(path, context, disableMessage).then((response: any) => {
                    //     this.loadingSubmodelRegistry = false;
                    //     if (response.success) {
                    //         this.navigationStore.dispatchSubmodelRegistryURL(this.submodelRegistryURL, false); // save the URL in the NavigationStore
                    //         window.localStorage.setItem('submodelRegistryURL', this.submodelRegistryURL); // save the URL in the local storage
                    //     } else {
                    //         this.navigationStore.dispatchSubmodelRegistryURL('', false); // clear the Submodel Registry URL in the NavigationStore
                    //         window.localStorage.removeItem('submodelRegistryURL'); // remove the URL from the local storage
                    //     }
                    // });

                    /* Connection will be set directly in the centralized store (even if it could potentially be false -> wrong Docker config or old config data in the browsers local storage) */
                    this.navigationStore.dispatchSubmodelRegistryURL(this.submodelRegistryURL, false); // save the URL in the NavigationStore
                }
            },

            // Function to connect to the respective Repository
            connectToEnvironment(RepoType: string) {
                // console.log('connect to ' + RepoType + ' Repository: ' + (this as any)[RepoType + 'RepoURL']);
                if ((this as any)[RepoType + 'RepoURL'] != '') {
                    /* Check for automatic connection is disabled. Only user entered connections in the frontend will be tested from now on (signed off Aaron Zielstorff, 13.04.2024) */
                    (this as any)['loading' + RepoType + 'Repo'] = true;
                    // let path = (this as any)[RepoType + 'RepoURL'] + '?limit=1' + (RepoType == 'Submodel' ? '&level=core' : '');
                    // let context = 'connecting to ' + RepoType + ' Repository'
                    // let disableMessage = false;
                    // this.getRequest(path, context, disableMessage).then((response: any) => {
                    //     (this as any)['loading' + RepoType + 'Repo'] = false;
                    //     if (response.success) {
                    //         this.navigationStore.dispatchRepoURL(RepoType, (this as any)[RepoType + 'RepoURL']); // save the URL in the NavigationStore
                    //         window.localStorage.setItem(RepoType + 'RepoURL', (this as any)[RepoType + 'RepoURL']); // save the URL in the local storage
                    //     } else {
                    //         this.navigationStore.dispatchRepoURL(RepoType, ''); // clear the URL in the NavigationStore
                    //         window.localStorage.removeItem(RepoType + 'RepoURL'); // remove the URL from the local storage
                    //     }
                    // });

                    /* Connection will be set directly in the centralized store (even if it could potentially be false -> wrong Docker config or old config data in the browsers local storage) */
                    this.navigationStore.dispatchRepoURL(RepoType, (this as any)[RepoType + 'RepoURL']); // save the URL in the NavigationStore
                }
            },

            // Function to close the Snackbar
            closeSnackbar() {
                this.navigationStore.dispatchSnackbar({ status: false });
            },

            extendSidebar() {
                this.drawerVisibility = true;
                this.navigationStore.dispatchDrawerState(true);
            },

            updateDrawerState(value: boolean) {
                // console.log('updateDrawerState: ', value);
                this.navigationStore.dispatchDrawerState(value);
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
            logout() {
                this.authStore.getKeycloak?.logout();
            },
        },
    });
</script>
