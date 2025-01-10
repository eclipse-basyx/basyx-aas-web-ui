<template>
    <v-container>
        <!-- Main App Bar -->
        <v-app-bar class="px-3" color="appBar">
            <v-row class="mx-0" align="center">
                <v-card flat color="appBar" class="ml-2">
                    <!-- Logo in the App Bar -->
                    <img :src="LogoPath" style="min-height: 42px; max-height: 42px" alt="Logo" />
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
                    src="@/assets/I40.png"
                    max-width="260px"
                    :style="{ filter: isDark ? 'invert(1)' : 'invert(0)' }">
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

<script lang="ts" setup>
    import type { BaSyxComponent, RepositoryKey } from '@/types/BaSyx';
    import { computed, mergeProps, onMounted, reactive, ref, watch } from 'vue';
    import { useRoute } from 'vue-router';
    import { useTheme } from 'vuetify';
    import { useDashboardHandling } from '@/composables/DashboardHandling';
    import { useAuthStore } from '@/store/AuthStore';
    import { useEnvStore } from '@/store/EnvironmentStore';
    import { useNavigationStore } from '@/store/NavigationStore';

    // Vue Router
    const route = useRoute();

    // Composables
    const { checkDashboardAvailability } = useDashboardHandling();

    // Stores
    const navigationStore = useNavigationStore();
    const envStore = useEnvStore();
    const authStore = useAuthStore();

    // Vuetify
    const theme = useTheme();

    // Reactive BaSyx Components Configurations
    const basyxComponents = reactive<Record<RepositoryKey, BaSyxComponent>>({
        AASDiscovery: {
            url: ref(navigationStore.getAASDiscoveryURL), // Ensure the getter is invoked
            loading: ref(false),
            connect: () => connectComponent('AASDiscovery'),
            label: 'AAS Discovery URL',
        },
        AASRegistry: {
            url: ref(navigationStore.getAASRegistryURL),
            loading: ref(false),
            connect: () => connectComponent('AASRegistry'),
            label: 'AAS Registry URL',
        },
        SubmodelRegistry: {
            url: ref(navigationStore.getSubmodelRegistryURL),
            loading: ref(false),
            connect: () => connectComponent('SubmodelRegistry'),
            label: 'Submodel Registry URL',
        },
        AASRepo: {
            url: ref(navigationStore.getAASRepoURL),
            loading: ref(false),
            connect: () => connectComponent('AASRepo'),
            label: 'AAS Repository URL',
        },
        SubmodelRepo: {
            url: ref(navigationStore.getSubmodelRepoURL),
            loading: ref(false),
            connect: () => connectComponent('SubmodelRepo'),
            label: 'Submodel Repository URL',
        },
        ConceptDescriptionRepo: {
            url: ref(navigationStore.getConceptDescriptionRepoURL),
            loading: ref(false),
            connect: () => connectComponent('ConceptDescriptionRepo'),
            label: 'Concept Description Repository URL',
        },
    });

    // Data
    const mainMenu = ref(false); // Variable to show the Main Menu
    const mobileMenu = ref(false); // Variable to show the Mobile Menu
    const dashboardAvailable = ref(false); // Dashboard Availability
    const endpointConfigAvailable = ref(envStore.getEndpointConfigAvailable);
    const drawerVisibility = ref(true); // Variable to show the AAS List Drawer

    // Computed Properties
    const isMobile = computed(() => navigationStore.getIsMobile);
    const isDark = computed(() => theme.global.current.value.dark);
    const Snackbar = computed(() => navigationStore.getSnackbar);
    const showAASList = computed(() => ['AASViewer', 'AASEditor', 'SubmodelViewer'].includes(route.name as string));
    const drawerState = computed(() => navigationStore.getDrawerState);
    const EnvAASDiscoveryPath = computed(() => envStore.getEnvAASDiscoveryPath);
    const EnvAASRegistryPath = computed(() => envStore.getEnvAASRegistryPath);
    const EnvSubmodelRegistryPath = computed(() => envStore.getEnvSubmodelRegistryPath);
    const EnvAASRepoPath = computed(() => envStore.getEnvAASRepoPath);
    const EnvSubmodelRepoPath = computed(() => envStore.getEnvSubmodelRepoPath);
    const EnvConceptDescriptionRepoPath = computed(() => envStore.getEnvConceptDescriptionRepoPath);
    const LogoPath = computed(() => {
        if (isDark.value && envStore.getEnvLogoDarkPath.trim().length > 0) {
            return 'Logo/' + envStore.getEnvLogoDarkPath;
        } else {
            return 'Logo/' + envStore.getEnvLogoLightPath;
        }
    });
    const showMobileMenu = computed(() => isMobile.value && !mainMenu.value);
    const showAutoSync = computed(() => {
        return [
            'AASViewer',
            'AASList',
            'SubmodelList',
            'ComponentVisualization',
            'Visualization',
            'AASEditor',
            'SubmodelViewer',
        ].includes(route.name as string);
    });
    const authStatus = computed(() => (authStore.getAuthStatus ? 'Authenticated' : 'Not Authenticated'));
    const isAuthEnabled = computed(() => authStore.getAuthEnabled);

    // Watch for changes in the Snackbar Object and close it after the Timeout
    watch(
        () => Snackbar.value,
        () => {
            if (Snackbar.value.status) {
                setTimeout(() => closeSnackbar(), Snackbar.value.timeout);
            }
        }
    );

    watch(
        () => drawerState.value,
        () => {
            drawerVisibility.value = drawerState.value;
        }
    );

    onMounted(async () => {
        dashboardAvailable.value = await checkDashboardAvailability();
        applyTheme();

        // Auto connect to BaSyx Components
        Object.keys(basyxComponents).forEach((key) => {
            const repoKey = key as RepositoryKey;
            const storedURL = window.localStorage.getItem(repoKey);

            // console.log('storedURL: ', storedURL, repoKey);

            if (endpointConfigAvailable.value && storedURL) {
                basyxComponents[repoKey].url = storedURL;
                basyxComponents[repoKey].connect();
            } else {
                // Check environment path
                let envPath = '';
                switch (repoKey) {
                    case 'AASDiscovery':
                        envPath = EnvAASDiscoveryPath.value;
                        break;
                    case 'AASRegistry':
                        envPath = EnvAASRegistryPath.value;
                        break;
                    case 'SubmodelRegistry':
                        envPath = EnvSubmodelRegistryPath.value;
                        break;
                    case 'AASRepo':
                        envPath = EnvAASRepoPath.value;
                        break;
                    case 'SubmodelRepo':
                        envPath = EnvSubmodelRepoPath.value;
                        break;
                    case 'ConceptDescriptionRepo':
                        envPath = EnvConceptDescriptionRepoPath.value;
                        break;
                    default:
                        break;
                }

                if (!basyxComponents[repoKey].url && envPath && envPath.trim() !== '') {
                    basyxComponents[repoKey].url = envPath;
                    basyxComponents[repoKey].connect();
                }
            }
        });
    });

    function closeSnackbar() {
        navigationStore.dispatchSnackbar({ status: false });
    }

    function applyTheme() {
        // check the local storage for a saved theme preference
        const storedTheme = localStorage.getItem('theme');
        if (storedTheme) {
            if (storedTheme === 'dark' || storedTheme === 'light') {
                theme.global.name.value = storedTheme;
            } else {
                // sets the Theme according to the Users preferred Theme
                if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                    theme.global.name.value = 'dark';
                } else {
                    theme.global.name.value = 'light';
                }
            }
        } else {
            // sets the Theme according to the Users preferred Theme
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                theme.global.name.value = 'dark';
            } else {
                theme.global.name.value = 'light';
            }
        }
    }

    function connectComponent(repoKey: keyof typeof basyxComponents) {
        navigationStore.dispatchComponentURL(repoKey, basyxComponents[repoKey].url, false);
    }

    function extendSidebar() {
        drawerVisibility.value = true;
        navigationStore.dispatchDrawerState(true);
    }

    function updateDrawerState(value: boolean) {
        // console.log('updateDrawerState: ', value);
        navigationStore.dispatchDrawerState(value);
    }

    function logout() {
        authStore.getKeycloak?.logout();
    }
</script>
