<template>
    <v-container>
        <!-- Main App Bar -->
        <v-app-bar class="px-3" color="appBar">
            <v-row class="mx-0" align="center">
                <v-card flat color="appBar" class="ml-2" style="display: flex; align-items: center">
                    <!-- Logo in the App Bar -->
                    <img :src="LogoPath" style="min-height: 42px; max-height: 42px" alt="Logo" />
                </v-card>
                <v-divider v-if="!isMobile" vertical inset class="ml-6" :class="!isMobile ? '' : ''"></v-divider>
                <!-- Home button -->
                <v-tooltip v-if="!isMobile" open-delay="600" location="bottom">
                    <template #activator="{ props }">
                        <v-btn
                            icon="mdi-home-outline"
                            variant="plain"
                            v-bind="props"
                            :to="{ name: currentRoute, query: {} }"
                            class="ml-2">
                        </v-btn>
                    </template>
                    <span>Home</span>
                </v-tooltip>
                <!-- Menu Toggle (Desktop) -->
                <v-menu v-if="!isMobile" v-model="mainMenu" :close-on-content-click="false" :offset="8">
                    <template #activator="{ props }">
                        <v-btn class="text-none" v-bind="props" append-icon="mdi-chevron-down" variant="text">
                            {{ route.meta?.title ? route.meta.title.toString() : route.meta?.name?.toString() }}
                        </v-btn>
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
                        <!-- Settings in Mobile View -->
                        <v-row justify="center" align="start" style="max-height: calc(100vh - 64px); overflow-y: auto">
                            <v-col cols="12" class="text-center px-5">
                                <ThemeSwitch></ThemeSwitch>
                                <v-divider v-if="endpointConfigAvailable" class="mt-2"></v-divider>
                                <!-- Backend Configuration -->
                                <BackendConfig v-if="endpointConfigAvailable"></BackendConfig>
                            </v-col>
                            <v-col cols="12" class="text-center">
                                <!-- Platform I 4.0 Logo -->
                                <v-img
                                    src="@/assets/I40.png"
                                    max-width="260px"
                                    class="mx-auto"
                                    :style="{ filter: isDark ? 'invert(1)' : 'invert(0)' }" />
                            </v-col>
                        </v-row>
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
                    v-if="isAuthEnabled && authStatus && !preconfiguredAuth"
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
                <!-- Modules -->
                <v-row
                    v-for="(moduleRoute, index) in filteredAndOrderedModuleRoutes"
                    :key="index"
                    justify="end"
                    align="center">
                    <v-col cols="auto" class="pr-1">
                        <v-card
                            class="py-1 px-2 text-buttonText"
                            color="lightButton"
                            :to="
                                moduleRoute?.meta?.preserveRouteQuery === true
                                    ? { path: moduleRoute.path, query: route.query }
                                    : { path: moduleRoute.path }
                            "
                            >{{ moduleRoute.name }}</v-card
                        >
                    </v-col>
                    <v-col cols="auto" class="py-1">
                        <v-btn
                            icon="mdi-view-module"
                            :to="
                                moduleRoute?.meta?.preserveRouteQuery === true
                                    ? { path: moduleRoute.path, query: route.query }
                                    : { path: moduleRoute.path }
                            "
                            :active="route.path === moduleRoute.path"
                            style="z-index: 9990"
                            size="small"
                            color="primary"
                            class="text-buttonText"></v-btn>
                    </v-col>
                </v-row>
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
    import type { RouteRecordRaw } from 'vue-router';
    import { computed, onMounted, ref, watch } from 'vue';
    import { useRoute } from 'vue-router';
    import { useTheme } from 'vuetify';
    import { useDashboardHandling } from '@/composables/DashboardHandling';
    import { useAASStore } from '@/store/AASDataStore';
    import { useAuthStore } from '@/store/AuthStore';
    import { useEnvStore } from '@/store/EnvironmentStore';
    import { useNavigationStore } from '@/store/NavigationStore';
    import { AutoSyncType, StatusCheckType } from '@/types/Application';

    // Vue Router
    const route = useRoute();

    // Composables
    const { checkDashboardAvailability } = useDashboardHandling();

    // Stores
    const navigationStore = useNavigationStore();
    const envStore = useEnvStore();
    const authStore = useAuthStore();
    const aasStore = useAASStore();

    // Vuetify
    const theme = useTheme();

    // Data
    const mainMenu = ref(false); // Variable to show the Main Menu
    const mobileMenu = ref(false); // Variable to show the Mobile Menu
    const dashboardAvailable = ref(false); // Dashboard Availability
    const endpointConfigAvailable = ref(envStore.getEndpointConfigAvailable);
    const drawerVisibility = ref(true); // Variable to show the AAS List Drawer

    // Computed Properties
    const currentRoute = computed(() => route.name); // get the current route name
    const isMobile = computed(() => navigationStore.getIsMobile);
    const isDark = computed(() => theme.global.current.value.dark);
    const Snackbar = computed(() => navigationStore.getSnackbar);
    const selectedAas = computed(() => aasStore.getSelectedAAS); // get selected AAS from Store
    const selectedNode = computed(() => aasStore.getSelectedNode); // get selected AAS from Store
    const moduleRoutes = computed(() => navigationStore.getModuleRoutes); // get the module routes
    const filteredAndOrderedModuleRoutes = computed(() => {
        const filteredModuleRoutes = moduleRoutes.value.filter((moduleRoute: RouteRecordRaw) => {
            if (isMobile.value && !moduleRoute?.meta?.isMobileModule) return false;
            if (!isMobile.value && !moduleRoute?.meta?.isDesktopModule) return false;
            if (
                moduleRoute?.meta?.isOnlyVisibleWithSelectedAas &&
                (!selectedAas.value || Object.keys(selectedAas.value).length === 0)
            )
                return false;
            if (
                moduleRoute?.meta?.isOnlyVisibleWithSelectedNode &&
                (!selectedNode.value || Object.keys(selectedNode.value).length === 0)
            )
                return false;
            return moduleRoute?.meta?.isVisibleModule === true || moduleRoute.path === route.path;
        });
        const filteredAndOrderedModuleRoutes = filteredModuleRoutes.sort(
            (moduleRouteA: RouteRecordRaw, moduleRouteB: RouteRecordRaw) => {
                let moduleNameA: string = moduleRouteA?.name?.toString() || '';
                let moduleNameB: string = moduleRouteB?.name?.toString() || '';
                return moduleNameA.localeCompare(moduleNameB);
            }
        );
        return filteredAndOrderedModuleRoutes;
    });
    const showAASList = computed(() => ['AASViewer', 'AASEditor', 'SubmodelViewer'].includes(route.name as string));
    const drawerState = computed(() => navigationStore.getDrawerState);
    const LogoPath = computed(() => {
        if (isDark.value && envStore.getEnvLogoDarkPath.trim().length > 0) {
            return '/Logo/' + envStore.getEnvLogoDarkPath;
        } else {
            return '/Logo/' + envStore.getEnvLogoLightPath;
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
    const preconfiguredAuth = computed(() => envStore.getPreconfiguredAuth);

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

        // Get auto-sync object from the lcoal storage
        const autoSyncToDispatch = JSON.parse(localStorage.getItem('autoSync') || '{}') as AutoSyncType;
        if (autoSyncToDispatch && Object.keys(autoSyncToDispatch).length > 0) {
            navigationStore.dispatchAutoSync(autoSyncToDispatch);
        }

        // Get status-check object from the lcoal storage
        const statusCheckToDispatch = JSON.parse(localStorage.getItem('statusCheck') || '{}') as StatusCheckType;
        if (statusCheckToDispatch && Object.keys(statusCheckToDispatch).length > 0) {
            navigationStore.dispatchStatusCheck(statusCheckToDispatch);
        }
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
        const refreshIntervalId = authStore.getRefreshIntervalId;
        if (refreshIntervalId) {
            window.clearInterval(refreshIntervalId);
        }
    }
</script>
