import type { AutoSyncType, PlatformType, PluginType, SnackbarType, StatusCheckType } from '@/types/Application';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { type LocationQuery, type Router, type RouteRecordRaw } from 'vue-router';
import { useEnvStore } from './EnvironmentStore';

export const useNavigationStore = defineStore('navigationStore', () => {
    // States
    const drawerState = ref(true);
    const Snackbar = ref<SnackbarType>({} as SnackbarType);
    const autoSync = ref<AutoSyncType>({ state: false, interval: 3000 } as AutoSyncType);
    const statusCheck = ref<StatusCheckType>({ state: false, interval: 10000 } as StatusCheckType);
    const isMobile = ref(false);
    const platform = ref<PlatformType>({} as PlatformType);
    const plugins = ref<PluginType[]>([]);
    const triggerAASListReload = ref(false);
    const clearAASList = ref(false);
    const clearTreeview = ref(false);
    const triggerAASListScroll = ref(false);
    const triggerTreeviewReload = ref(false);
    const urlQuery = ref<LocationQuery>({} as LocationQuery);
    const moduleRoutes = ref<Array<RouteRecordRaw>>([]);

    // Getters
    const getDrawerState = computed(() => drawerState.value);
    const getSnackbar = computed(() => Snackbar.value);
    const getAutoSync = computed(() => autoSync.value);
    const getStatusCheck = computed(() => statusCheck.value);
    const getIsMobile = computed(() => isMobile.value);
    const getPlatform = computed(() => platform.value);
    const getPlugins = computed(() => plugins.value);
    const getTriggerAASListReload = computed(() => triggerAASListReload.value);
    const getClearAASList = computed(() => clearAASList.value);
    const getClearTreeview = computed(() => clearTreeview.value);
    const getTriggerAASListScroll = computed(() => triggerAASListScroll.value);
    const getTriggerTreeviewReload = computed(() => triggerTreeviewReload.value);
    const getUrlQuery = computed(() => urlQuery.value);
    const getModuleRoutes = computed(() => moduleRoutes.value);

    const envStore = useEnvStore();

    // Actions
    function dispatchDrawerState(dispatchedDrawerState: boolean): void {
        drawerState.value = dispatchedDrawerState;
    }

    function dispatchSnackbar(snackbarObj: SnackbarType): void {
        Snackbar.value = snackbarObj;
    }

    function dispatchAutoSync(updatedAutoSync: AutoSyncType): void {
        autoSync.value = updatedAutoSync;
    }

    function dispatchStatusCheck(updatedStatusCheck: StatusCheckType): void {
        statusCheck.value = updatedStatusCheck;
    }

    function dispatchIsMobile(dispatchedIsMobile: boolean): void {
        isMobile.value = dispatchedIsMobile;
    }

    function dispatchPlatform(dispatchedPlatform: PlatformType): void {
        platform.value = dispatchedPlatform;
    }

    function dispatchPlugins(dispatchedPlugins: PluginType[]): void {
        plugins.value = dispatchedPlugins;
    }

    function dispatchTriggerAASListReload(): void {
        triggerAASListReload.value = !triggerAASListReload.value;

        setTimeout(() => {
            // Reset dispatchTriggerAASListReload after 100 ms
            triggerAASListReload.value = false;
        }, 100);
    }

    function dispatchClearAASList(): void {
        clearAASList.value = !clearAASList.value;
    }

    function dispatchClearTreeview(): void {
        clearTreeview.value = !clearTreeview.value;
    }

    function dispatchTriggerAASListScroll(): void {
        triggerAASListScroll.value = !triggerAASListScroll.value;
    }

    function dispatchTriggerTreeviewReload(): void {
        triggerTreeviewReload.value = !triggerTreeviewReload.value;

        setTimeout(() => {
            // Reset dispatchTriggerTreeviewReload after 100 ms
            triggerTreeviewReload.value = false;
        }, 100);
    }

    function dispatchUrlQuery(query: LocationQuery): void {
        urlQuery.value = query;
    }

    function dispatchModuleRoutes(routes: RouteRecordRaw[]): void {
        moduleRoutes.value = routes;
    }

    // Navigates from Viewer (Either SMViewer of AASViewer) to the corresponding Editor Mode
    function navigateToEditorMode(router: Router): void {
        if (!envStore.getAllowEditing) {
            return;
        }
        if (router.currentRoute.value.name === 'AASViewer') {
            router.push({ path: '/aaseditor', query: router.currentRoute.value.query });
        } else if (router.currentRoute.value.name === 'SMViewer') {
            router.push({ path: '/smeditor', query: router.currentRoute.value.query });
        }
    }

    function navigateToViewerMode(router: Router): void {
        if (router.currentRoute.value.name === 'AASEditor') {
            router.push({ path: '/', query: router.currentRoute.value.query });
        } else if (router.currentRoute.value.name === 'SMEditor') {
            router.push({ path: '/smviewer', query: router.currentRoute.value.query });
        }
    }

    return {
        // Getters
        getDrawerState,
        getSnackbar,
        getAutoSync,
        getStatusCheck,
        getIsMobile,
        getPlatform,
        getPlugins,
        getTriggerAASListReload,
        getClearAASList,
        getClearTreeview,
        getTriggerAASListScroll,
        getTriggerTreeviewReload,
        getUrlQuery,
        getModuleRoutes,

        // Actions
        dispatchDrawerState,
        dispatchSnackbar,
        dispatchAutoSync,
        dispatchStatusCheck,
        dispatchIsMobile,
        dispatchPlatform,
        dispatchPlugins,
        dispatchTriggerAASListReload,
        dispatchClearAASList,
        dispatchClearTreeview,
        dispatchTriggerAASListScroll,
        dispatchTriggerTreeviewReload,
        dispatchUrlQuery,
        dispatchModuleRoutes,
        navigateToEditorMode,
        navigateToViewerMode,
    };
});
