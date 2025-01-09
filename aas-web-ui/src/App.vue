<template>
    <v-app>
        <!-- App Navigation and it's sub-Components (AASList, etc.) -->
        <AppNavigation />
        <v-main style="padding-top: 33px">
            <!-- App Content (eg. AASViewer, AASEditor, etc.) -->
            <router-view v-slot="{ Component }">
                <keep-alive :include="['AASList', 'SubmodelList']">
                    <component :is="Component" />
                </keep-alive>
            </router-view>
        </v-main>
    </v-app>
</template>

<script lang="ts" setup>
    import { computed, onMounted } from 'vue';
    import { RouteRecordNameGeneric, useRoute, useRouter } from 'vue-router';
    import { useDisplay } from 'vuetify';
    import { useAASRepositoryClient } from '@/composables/Client/AASRepositoryClient';
    import { useEnvStore } from '@/store/EnvironmentStore';
    import { useNavigationStore } from '@/store/NavigationStore';
    import { useSMRepositoryClient } from './composables/Client/SMRepositoryClient';

    // Stores
    const navigationStore = useNavigationStore();
    const envStore = useEnvStore();

    // Vue Router
    const route = useRoute();
    const router = useRouter();

    // Composables
    const { fetchAndDispatchAas } = useAASRepositoryClient();
    const { fetchAndDispatchSme } = useSMRepositoryClient();

    // Vuetify
    const { mobile } = useDisplay();
    const { platform } = useDisplay();

    // Computed Properties
    const allowEditing = computed(() => envStore.getAllowEditing); // Check if the current environment allows showing the AAS Editor

    // Data
    const routesStayOnPages = ['About', 'NotFound404'] as Array<string>;

    // Computed Properties
    const currentRouteName = computed((): string => {
        return route.name as string;
    });

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

        // Extract the aas and path Queries from the URL
        const searchParams = new URL(window.location.href).searchParams;
        const aasEndpoint = searchParams.get('aas');
        const submodelElementPath = searchParams.get('path');

        // Check if single AAS mode is on and no aas query is set to either redirect or show 404
        if (envStore.getSingleAas && (aasEndpoint === null || aasEndpoint === undefined || aasEndpoint.trim() === '')) {
            if (!routesStayOnPages.includes(currentRouteName.value)) {
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
            handleMobileView(aasEndpoint, submodelElementPath);
        } else {
            handleDesktopView(aasEndpoint, submodelElementPath);
        }

        if (aasEndpoint) {
            await fetchAndDispatchAas(aasEndpoint);
        }

        if (aasEndpoint && submodelElementPath) {
            await fetchAndDispatchSme(submodelElementPath);
        }
    });

    // Handle mobile view routing logic
    function handleMobileView(aasEndpoint: string | null, submodelElementPath: string | null) {
        const routesToAASList: Array<RouteRecordNameGeneric> = ['AASViewer', 'AASEditor', 'SubmodelViewer', 'AASList'];
        if (currentRouteName.value && routesToAASList.includes(currentRouteName.value)) {
            // Redirect to 'AASList' with existing query parameters
            router.push({ name: 'AASList', query: route.query });
        } else if (currentRouteName.value === 'SubmodelList' && aasEndpoint) {
            // Redirect to 'SubmodelList' with 'aas' parameter
            router.push({ name: 'SubmodelList', query: { aas: aasEndpoint } });
        } else if (currentRouteName.value === 'ComponentVisualization' && aasEndpoint && submodelElementPath) {
            // Redirect to 'ComponentVisualization' with 'aas' and 'path' parameters
            router.push({ name: 'ComponentVisualization', query: { aas: aasEndpoint, path: submodelElementPath } });
        } else if (currentRouteName.value && routesStayOnPages.includes(currentRouteName.value)) {
            // Stay on current page
            return;
        } else {
            // Redirect to 'AASList' without query parameters
            router.push({ name: 'AASList' });
        }
    }

    // Handle desktop view routing logic
    function handleDesktopView(aasEndpoint: string | null, submodelElementPath: string | null) {
        const routesToAASViewer: Array<RouteRecordNameGeneric> = ['AASList', 'SubmodelList', 'ComponentVisualization'];
        const query: any = {};
        if (aasEndpoint) query.aas = aasEndpoint;
        if (submodelElementPath) query.path = submodelElementPath;
        if (currentRouteName.value && routesToAASViewer.includes(currentRouteName.value)) {
            // Redirect to 'AASViewer' with appropriate query parameters
            router.push({ name: 'AASViewer', query });
        } else if (currentRouteName.value === 'AASEditor' && allowEditing.value) {
            // Stay on 'AASEditor' but update query parameters
            router.push({ name: 'AASEditor', query });
        } else if (currentRouteName.value === 'SubmodelViewer') {
            // Stay on 'SubmodelViewer' but update query parameters
            router.push({ name: 'SubmodelViewer', query });
        } else if (currentRouteName.value && routesStayOnPages.includes(currentRouteName.value)) {
            // Stay on current page
            return;
        } else {
            // Default to 'AASViewer' with query parameters
            router.push({ name: 'AASViewer', query });
        }
    }
</script>
