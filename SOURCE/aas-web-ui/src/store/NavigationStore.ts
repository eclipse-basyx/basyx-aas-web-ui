import type {
    AutoSyncType,
    PlatformType,
    PluginType,
    RegisteredQueryParamType,
    SnackbarType,
    StatusCheckType,
} from '@/types/Application';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { type LocationQuery, type Router, type RouteRecordRaw } from 'vue-router';
import { checkSemanticId } from '@/utils/AAS/SemanticIdUtils';
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

    // Core query params that are always allowed (UI framework params)
    const coreQueryParams = ['aas', 'path', 'view'];

    // Query params registered by plugins (dynamic, based on active plugin)
    const registeredQueryParams = ref<RegisteredQueryParamType[]>([]);

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
    const getCoreQueryParams = computed(() => coreQueryParams);
    const getRegisteredQueryParams = computed(() => registeredQueryParams.value);

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

    /**
     * Registers a query parameter for a specific plugin (identified by semanticId).
     * This allows the plugin to preserve its query params when active.
     *
     * @param paramName - The name of the query parameter to register
     * @param semanticId - The semanticId of the plugin registering the param
     */
    function registerQueryParam(paramName: string, semanticId: string): void {
        // Avoid duplicates
        const exists = registeredQueryParams.value.some(
            (p) => p.paramName === paramName && p.semanticId === semanticId
        );
        if (!exists) {
            registeredQueryParams.value.push({ paramName, semanticId });
        }
    }

    /**
     * Unregisters a query parameter for a specific plugin.
     *
     * @param paramName - The name of the query parameter to unregister
     * @param semanticId - The semanticId of the plugin unregistering the param
     */
    function unregisterQueryParam(paramName: string, semanticId: string): void {
        registeredQueryParams.value = registeredQueryParams.value.filter(
            (p) => !(p.paramName === paramName && p.semanticId === semanticId)
        );
    }

    /**
     * Unregisters all query parameters for a specific plugin.
     *
     * @param semanticId - The semanticId of the plugin to unregister all params for
     */
    function unregisterAllQueryParamsForPlugin(semanticId: string): void {
        registeredQueryParams.value = registeredQueryParams.value.filter((p) => p.semanticId !== semanticId);
    }

    /**
     * Gets all allowed query params for a given node/element.
     * Returns core params plus any params registered by plugins whose semanticId matches the node's semanticId.
     * Uses checkSemanticId for proper semanticId comparison (handles IRI variants, versions, etc.)
     *
     * @param node - The currently selected node/element (optional)
     * @returns Array of allowed query param names
     */
    function getAllowedQueryParams(node?: any): string[] {
        const allowed = [...coreQueryParams];
        if (node) {
            // Use checkSemanticId for proper comparison of semanticIds
            // This handles IRI variants (with/without trailing slash), version matching, EClass IRDI, IEC CDD, etc.
            const pluginParams = registeredQueryParams.value
                .filter((p) => checkSemanticId(node, p.semanticId))
                .map((p) => p.paramName);
            allowed.push(...pluginParams);
        }
        return allowed;
    }

    /**
     * Filters a query object to only include allowed params.
     * Logs a warning for any params that are removed.
     *
     * @param query - The query object to filter
     * @param node - The currently selected node/element (optional)
     * @returns Object with filtered query and array of removed param names
     */
    function filterQueryParams(
        query: LocationQuery,
        node?: any
    ): { filteredQuery: LocationQuery; removedParams: string[] } {
        const allowedParams = getAllowedQueryParams(node);
        const filteredQuery: LocationQuery = {};
        const removedParams: string[] = [];

        for (const key of Object.keys(query)) {
            if (allowedParams.includes(key)) {
                filteredQuery[key] = query[key];
            } else {
                removedParams.push(key);
            }
        }

        if (removedParams.length > 0) {
            console.warn(
                `[NavigationStore] Removed non-core query params: ${removedParams.join(', ')}. ` +
                    `If these params should be preserved, the plugin should register them using registerQueryParam(). ` +
                    `Allowed params: ${allowedParams.join(', ')}`
            );
        }

        return { filteredQuery, removedParams };
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
            router.push({ name: 'AASViewer', query: router.currentRoute.value.query });
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
        getCoreQueryParams,
        getRegisteredQueryParams,

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
        registerQueryParam,
        unregisterQueryParam,
        unregisterAllQueryParamsForPlugin,
        getAllowedQueryParams,
        filterQueryParams,
    };
});
