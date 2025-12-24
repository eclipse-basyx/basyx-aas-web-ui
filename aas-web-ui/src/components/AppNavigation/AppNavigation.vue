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
                <AutoSync v-if="showAutoSync"></AutoSync>
                <!-- Platform I 4.0 Logo -->
                <v-img v-if="!isMobile" src="@/assets/IDTA_Logo_Blue_Web_S.svg" max-width="120px" />
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
                                <v-divider class="mt-2"></v-divider>
                                <InfrastructureSelector
                                    v-if="endpointConfigAvailable"
                                    @open-manage="openInfrastructureManagement"></InfrastructureSelector>
                                <v-divider v-if="endpointConfigAvailable" class="mt-2"></v-divider>
                            </v-col>
                            <v-col cols="12" class="text-center">
                                <!-- Platform I 4.0 Logo -->
                                <v-img src="@/assets/IDTA_Logo_Blue_Web_S.svg" max-width="120px" class="mx-auto" />
                            </v-col>
                        </v-row>
                    </v-card>
                </v-dialog>
                <!-- Settings Menu -->
                <Settings v-if="!isMobile"></Settings>
                <!-- Auth Status with user Menu -->
                <User v-if="!isMobile" />
            </v-row>
        </v-app-bar>

        <!-- global Snackbar -->
        <Snackbar />

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
                            :color="route.path === moduleRoute.path ? 'primarySurface' : 'primary'"
                            :to="
                                moduleRoute?.meta?.preserveRouteQuery === true
                                    ? { path: moduleRoute.path, query: route.query }
                                    : { path: moduleRoute.path }
                            "
                            :disabled="route.path === moduleRoute.path"
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
                            :disabled="route.path === moduleRoute.path"
                            style="z-index: 9990"
                            size="small"
                            color="primary"
                            class="text-buttonText"></v-btn>
                    </v-col>
                </v-row>
                <!-- AAS Viewer -->
                <v-row justify="end" align="center">
                    <v-col cols="auto" class="pr-1">
                        <v-card
                            class="py-1 px-2 text-buttonText"
                            :color="route.path === '/aaslist' ? 'primarySurface' : 'primary'"
                            to="/aaslist"
                            :disabled="route.path === '/aaslist'"
                            >AAS Viewer</v-card
                        >
                    </v-col>
                    <v-col cols="auto" class="py-1">
                        <v-btn
                            icon="mdi-format-list-text"
                            to="/aaslist"
                            :active="route.path === '/aaslist'"
                            :disabled="route.path === '/aaslist'"
                            style="z-index: 9990"
                            size="small"
                            color="primary"
                            class="text-buttonText"></v-btn>
                    </v-col>
                </v-row>
                <!-- About -->
                <v-row justify="end" align="center">
                    <v-col cols="auto" class="pr-1">
                        <v-card
                            class="py-1 px-2 text-buttonText"
                            :color="route.path === '/about' ? 'primarySurface' : 'primary'"
                            to="/about"
                            :disabled="route.path === '/about'"
                            >About</v-card
                        >
                    </v-col>
                    <v-col cols="auto" class="py-1">
                        <v-btn
                            icon="mdi-format-list-group"
                            to="/about"
                            :active="route.path === '/about'"
                            :disabled="route.path === '/about'"
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
    import Snackbar from '@/components/AppNavigation/Snackbar.vue';
    import { useAASStore } from '@/store/AASDataStore';
    import { useEnvStore } from '@/store/EnvironmentStore';
    import { useNavigationStore } from '@/store/NavigationStore';
    import { AutoSyncType, StatusCheckType } from '@/types/Application';

    // Vue Router
    const route = useRoute();

    // Stores
    const navigationStore = useNavigationStore();
    const envStore = useEnvStore();
    const aasStore = useAASStore();

    // Vuetify
    const theme = useTheme();

    // Data
    const mainMenu = ref(false); // Variable to show the Main Menu

    const mobileMenu = ref(false); // Variable to show the Mobile Menu
    const drawerVisibility = ref(true); // Variable to show the AAS List Drawer

    const infrastructureMenu = ref(false); // Variable to show the Infrastructure Menu
    const infrastructureManagementDialog = ref(false); // Variable to show the Infrastructure Management Dialog

    // Computed Properties
    const currentRoute = computed(() => route.name); // get the current route name
    const isMobile = computed(() => navigationStore.getIsMobile);
    const isDark = computed(() => theme.global.current.value.dark);
    const selectedAas = computed(() => aasStore.getSelectedAAS); // get selected AAS from Store
    const selectedNode = computed(() => aasStore.getSelectedNode); // get selected AAS from Store
    const moduleRoutes = computed(() => navigationStore.getModuleRoutes); // get the module routes
    const endpointConfigAvailable = computed(() => envStore.getEndpointConfigAvailable);

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
    const showAASList = computed(() => ['AASViewer', 'AASEditor', 'AASSubmodelViewer'].includes(route.name as string));
    const drawerState = computed(() => navigationStore.getDrawerState);
    const LogoPath = computed(() => {
        const basePath = import.meta.env.MODE === 'production' ? envStore.getEnvBasePath : import.meta.env.BASE_URL;

        let logoFolder = '/Logo/';
        if (basePath && basePath.trim() !== '' && !basePath.includes('PLACEHOLDER')) {
            const normalizedBasePath = basePath.endsWith('/') ? basePath : basePath + '/';
            logoFolder = `${normalizedBasePath}Logo/`;
        }

        if (isDark.value && envStore.getEnvLogoDarkPath.trim().length > 0) {
            return logoFolder + envStore.getEnvLogoDarkPath;
        } else {
            return logoFolder + envStore.getEnvLogoLightPath;
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
            'AASSubmodelViewer',
            'AASCommander',
        ].includes(route.name as string);
    });

    watch(
        () => drawerState.value,
        () => {
            drawerVisibility.value = drawerState.value;
        }
    );

    onMounted(async () => {
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

    function applyTheme(): void {
        // check the local storage for a saved theme preference
        const storedTheme = localStorage.getItem('theme');
        if (storedTheme) {
            if (storedTheme === 'dark' || storedTheme === 'light') {
                theme.change(storedTheme);
            } else {
                // sets the Theme according to the Users preferred Theme
                if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                    theme.change('dark');
                } else {
                    theme.change('light');
                }
            }
        } else {
            // sets the Theme according to the Users preferred Theme
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                theme.change('dark');
            } else {
                theme.change('light');
            }
        }
    }

    function extendSidebar(): void {
        drawerVisibility.value = true;
        navigationStore.dispatchDrawerState(true);
    }

    function updateDrawerState(value: boolean): void {
        // console.log('updateDrawerState: ', value);
        navigationStore.dispatchDrawerState(value);
    }

    function openInfrastructureManagement(): void {
        infrastructureMenu.value = false;
        infrastructureManagementDialog.value = true;
    }
</script>
