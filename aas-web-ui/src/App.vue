<template>
    <v-app>
        <!-- App Navigation and it's sub-Components (AASList, etc.) -->
        <AppNavigation />
        <v-main style="padding-top: 33px">
            <!-- App Content (eg. AASViewer, AASEditor, etc.) -->
            <router-view v-slot="{ Component }">
                <keep-alive :include="['AASList', 'AASTreeview', 'SubmodelList']">
                    <component :is="Component" />
                </keep-alive>
            </router-view>
        </v-main>
    </v-app>
</template>

<script lang="ts" setup>
    import type { RouteRecordNameGeneric } from 'vue-router';
    import { computed, onMounted } from 'vue';
    import { useRoute, useRouter } from 'vue-router';
    import { useDisplay } from 'vuetify';
    import { useEnvStore } from '@/store/EnvironmentStore';
    import { useNavigationStore } from '@/store/NavigationStore';
    import { useAASStore } from './store/AASDataStore';

    // Stores
    const navigationStore = useNavigationStore();
    const aasStore = useAASStore();
    const envStore = useEnvStore();

    // Vue Router
    const route = useRoute();
    const router = useRouter();

    // Vuetify
    const { mobile } = useDisplay();
    const { platform } = useDisplay();

    // Computed Properties
    const allowEditing = computed(() => envStore.getAllowEditing); // Check if the current environment allows showing the AAS Editor
    const selectedAAS = computed(() => aasStore.getSelectedAAS);

    // Data
    const routesStayOnPages = ['About', 'NotFound404'] as Array<string>;
    const routesToAASViewer: Array<RouteRecordNameGeneric> = ['AASList', 'SubmodelList'];
    const routesToAASList: Array<RouteRecordNameGeneric> = ['AASViewer', 'AASEditor', 'SubmodelViewer', 'AASList'];
    const routesToVisualization: Array<RouteRecordNameGeneric> = ['ComponentVisualization', 'Visualization'];

    // Computed Properties
    const currentRouteName = computed((): string => {
        return route.name as string;
    });
    const currentRoutePath = computed((): string => {
        return route.path;
    });
    const searchParams = new URL(window.location.href).searchParams;
    const aasEndpoint = (searchParams.get('aas') || '').trim();
    const smePath = (searchParams.get('path') || '').trim();

    onMounted(async () => {
        // Check if the platform is a mobile device
        let showMobileVersion = false;
        if (
            mobile.value ||
            // include IPad as mobile device
            (platform.value.mac && platform.value.touch) ||
            // IOS and Android are mobile platforms
            platform.value.ios ||
            platform.value.android
        ) {
            showMobileVersion = true;
        }

        // Dispatch the mobile status to the store
        navigationStore.dispatchIsMobile(showMobileVersion);
        navigationStore.dispatchPlatform(platform.value);

        // Check if single AAS mode is on and no aas query is set to either redirect or show 404
        if (envStore.getSingleAas && (!selectedAAS.value || Object.keys(selectedAAS.value).length === 0)) {
            if (
                !routesStayOnPages.includes(currentRouteName.value) &&
                !currentRoutePath.value.startsWith('/modules/')
            ) {
                if (envStore.getSingleAasRedirect) {
                    window.location.replace(envStore.getSingleAasRedirect);
                    return;
                } else if (currentRouteName.value !== 'NotFound404') {
                    router.push({ name: 'NotFound404' });
                    return;
                }
            }
        }

        // Check which platform is used and change the fitting view
        if (showMobileVersion) {
            handleMobileView();
        } else {
            handleDesktopView();
        }
    });

    // Handle mobile view routing logic
    // TODO Move to route guard - https://github.com/eclipse-basyx/basyx-aas-web-ui/issues/225
    function handleMobileView(): void {
        if (currentRouteName.value && routesToAASList.includes(currentRouteName.value)) {
            // Redirect to 'AASList' with existing query parameters
            router.push({ name: 'AASList', query: route.query });
        } else if (currentRouteName.value === 'SubmodelList' && aasEndpoint) {
            // Redirect to 'SubmodelList' with 'aas' parameter
            router.push({ name: 'SubmodelList', query: { aas: aasEndpoint } });
        } else if (currentRouteName.value && routesToVisualization.includes(currentRouteName.value)) {
            // Redirect to 'Visualization' with 'aas' and 'path' parameters
            router.push({ name: 'Visualization', query: { aas: aasEndpoint, path: smePath } });
        } else if (currentRouteName.value && routesStayOnPages.includes(currentRouteName.value)) {
            // Stay on current page
            return;
        } else {
            // Redirect to 'AASList' without query parameters
            router.push({ name: 'AASList' });
        }
    }

    // Handle desktop view routing logic
    // TODO Move to route guard - https://github.com/eclipse-basyx/basyx-aas-web-ui/issues/225
    function handleDesktopView(): void {
        const query: any = {};
        if (aasEndpoint) query.aas = aasEndpoint;
        if (smePath) query.path = smePath;
        if (currentRouteName.value && routesToAASViewer.includes(currentRouteName.value)) {
            // Redirect to 'AASViewer' with appropriate query parameters
            router.push({ name: 'AASViewer', query });
        } else if (currentRouteName.value && routesToVisualization.includes(currentRouteName.value)) {
            // Redirect to 'AASViewer' with appropriate query parameters
            router.push({ name: 'Visualization', query });
        } else if (currentRouteName.value === 'AASEditor' && allowEditing.value) {
            // Stay on 'AASEditor' but update query parameters
            router.push({ name: 'AASEditor', query });
        } else if (currentRouteName.value === 'SubmodelViewer') {
            // Stay on 'SubmodelViewer' but update query parameters
            router.push({ name: 'SubmodelViewer', query });
        } else if (
            (currentRouteName.value && routesStayOnPages.includes(currentRouteName.value)) ||
            currentRoutePath.value.startsWith('/modules/')
        ) {
            // Stay on current page
            return;
        } else {
            // Default to 'AASViewer' with query parameters
            router.push({ name: 'AASViewer', query });
        }
    }
</script>
