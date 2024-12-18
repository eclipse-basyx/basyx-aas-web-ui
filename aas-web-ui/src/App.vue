<template>
    <v-app>
        <!-- App Navigation and it's sub-Components (AASList, etc.) -->
        <AppNavigation />
        <v-main style="padding-top: 33px">
            <!-- App Content (eg. MainWindow, etc.) -->
            <router-view v-slot="{ Component }">
                <keep-alive :include="['AASList', 'SubmodelList']">
                    <component :is="Component" />
                </keep-alive>
            </router-view>
        </v-main>
    </v-app>
</template>

<script lang="ts" setup>
    import { onMounted } from 'vue';
    import { RouteRecordNameGeneric, useRoute, useRouter } from 'vue-router';
    import { useDisplay } from 'vuetify';
    import AppNavigation from '@/components/AppNavigation/AppNavigation.vue';
    import { useAASRepositoryClient } from '@/composables/Client/AASRepositoryClient';
    import { useRequestHandling } from '@/composables/RequestHandling';
    import { useAASStore } from '@/store/AASDataStore';
    import { useEnvStore } from '@/store/EnvironmentStore';
    import { useNavigationStore } from '@/store/NavigationStore';
    import { formatDate } from '@/utils/DateUtils';

    // Stores
    const navigationStore = useNavigationStore();
    const aasStore = useAASStore();
    const envStore = useEnvStore();

    // Vue Router
    const route = useRoute();
    const router = useRouter();

    // composables
    const { fetchAndDispatchAas } = useAASRepositoryClient();
    const { getRequest } = useRequestHandling();

    // Vuetify
    const { mobile } = useDisplay();
    const { platform } = useDisplay();

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
        if (envStore.singleAas && (aasEndpoint === null || aasEndpoint === undefined || aasEndpoint.trim() === '')) {
            if (envStore.getSingleAasRedirect) {
                window.location.replace(envStore.getSingleAasRedirect);
                return;
            } else if (route.name !== '404NotFound404') {
                router.push({ name: 'NotFound404' });
                return;
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
            handleSubmodelElement(submodelElementPath);
        }
    });

    // Handle mobile view routing logic
    function handleMobileView(aasEndpoint: string | null, submodelElementPath: string | null) {
        const currentRouteName = route.name;
        const routesToAASList: Array<RouteRecordNameGeneric> = ['MainWindow', 'AASViewer', 'AASList'];
        if (currentRouteName && routesToAASList.includes(currentRouteName)) {
            // Redirect to 'AASList' with existing query parameters
            router.push({ name: 'AASList', query: route.query });
        } else if (currentRouteName === 'SubmodelList' && aasEndpoint) {
            // Redirect to 'SubmodelList' with 'aas' parameter
            router.push({ name: 'SubmodelList', query: { aas: aasEndpoint } });
        } else if (currentRouteName === 'ComponentVisualization' && aasEndpoint && submodelElementPath) {
            // Redirect to 'ComponentVisualization' with 'aas' and 'path' parameters
            router.push({ name: 'ComponentVisualization', query: { aas: aasEndpoint, path: submodelElementPath } });
        } else {
            // Redirect to 'AASList' without query parameters
            router.push({ name: 'AASList' });
        }
    }

    // Handle desktop view routing logic
    function handleDesktopView(aasEndpoint: string | null, submodelElementPath: string | null) {
        const currentRouteName = route.name;
        const routesToMainWindow: Array<RouteRecordNameGeneric> = ['AASList', 'SubmodelList', 'ComponentVisualization'];
        const query: any = {};
        if (aasEndpoint) query.aas = aasEndpoint;
        if (submodelElementPath) query.path = submodelElementPath;
        if (currentRouteName && routesToMainWindow.includes(currentRouteName)) {
            // Redirect to 'MainWindow' with appropriate query parameters
            router.push({ name: 'MainWindow', query });
        } else if (currentRouteName === 'AASViewer') {
            // Stay on 'AASViewer' but update query parameters
            router.push({ name: 'AASViewer', query });
        } else {
            // Default to 'MainWindow' with query parameters
            router.push({ name: 'MainWindow', query });
        }
    }

    // Handle the selected submodel element
    async function handleSubmodelElement(submodelElementPath: string) {
        const path = submodelElementPath;
        const context = 'retrieving SubmodelElement';
        const disableMessage = true;
        const response = await getRequest(path, context, disableMessage);
        if (response.success) {
            const data = response.data;
            data.timestamp = formatDate(new Date());
            data.path = submodelElementPath;
            data.isActive = true;
            aasStore.dispatchNode(data);
        } else {
            handleRequestFailure(response);
        }
    }
    // Handle request failure and show appropriate message
    function handleRequestFailure(response: any) {
        if (Object.keys(response.data).length === 0) {
            navigationStore.dispatchSnackbar({
                status: true,
                timeout: 60000,
                color: 'error',
                btnColor: 'buttonText',
                text: 'No valid SubmodelElement under the given Path',
            });
            aasStore.dispatchNode({});
        }
    }
</script>
