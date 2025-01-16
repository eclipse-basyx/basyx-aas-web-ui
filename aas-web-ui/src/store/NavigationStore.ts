import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { LocationQuery } from 'vue-router';
import { AutoSyncType, PlatformType, PluginType, SnackbarType } from '@/types/Application';
import { useAASStore } from './AASDataStore';

export const useNavigationStore = defineStore('navigationStore', () => {
    // States
    const drawerState = ref(true);
    const AASDiscoveryURL = ref('');
    const AASRegistryURL = ref('');
    const SubmodelRegistryURL = ref('');
    const AASRepoURL = ref('');
    const SubmodelRepoURL = ref('');
    const ConceptDescriptionRepoURL = ref('');
    const Snackbar = ref({} as SnackbarType);
    const AutoSync = ref({} as AutoSyncType);
    const StatusCheck = ref(false);
    const isMobile = ref(false);
    const platform = ref({} as PlatformType);
    const plugins = ref([] as PluginType[]);
    const triggerAASListReload = ref(false);
    const triggerAASListScroll = ref(false);
    const urlQuery = ref({} as LocationQuery);

    // Getters
    const getDrawerState = computed(() => drawerState.value);
    const getAASDiscoveryURL = computed(() => AASDiscoveryURL.value);
    const getAASRegistryURL = computed(() => AASRegistryURL.value);
    const getSubmodelRegistryURL = computed(() => SubmodelRegistryURL.value);
    const getAASRepoURL = computed(() => AASRepoURL.value);
    const getSubmodelRepoURL = computed(() => SubmodelRepoURL.value);
    const getConceptDescriptionRepoURL = computed(() => ConceptDescriptionRepoURL.value);
    const getSnackbar = computed(() => Snackbar.value);
    const getAutoSync = computed(() => AutoSync.value);
    const getStatusCheck = computed(() => StatusCheck.value);
    const getIsMobile = computed(() => isMobile.value);
    const getPlatform = computed(() => platform.value);
    const getPlugins = computed(() => plugins.value);
    const getTriggerAASListReload = computed(() => triggerAASListReload.value);
    const getTriggerAASListScroll = computed(() => triggerAASListScroll.value);
    const getUrlQuery = computed(() => urlQuery.value);

    // Actions
    function dispatchComponentURL(componentKey: string, url: string, clearSelectedNode: boolean = true): void {
        // console.log('dispatchComponentURL', componentKey, url, clearSelectedNode);
        switch (componentKey) {
            case 'AASDiscovery':
                AASDiscoveryURL.value = url;
                break;
            case 'AASRegistry':
                AASRegistryURL.value = url;
                if (clearSelectedNode) useAASStore().dispatchSelectedNode({});
                break;
            case 'SubmodelRegistry':
                SubmodelRegistryURL.value = url;
                if (clearSelectedNode) useAASStore().dispatchSelectedNode({});
                break;
            case 'AASRepo':
                AASRepoURL.value = url;
                break;
            case 'SubmodelRepo':
                SubmodelRepoURL.value = url;
                break;
            case 'ConceptDescriptionRepo':
                ConceptDescriptionRepoURL.value = url;
                break;
        }
    }

    function dispatchDrawerState(dispatchedDrawerState: boolean): void {
        drawerState.value = dispatchedDrawerState;
    }

    function dispatchSnackbar(snackbarObj: SnackbarType): void {
        Snackbar.value = snackbarObj;
    }

    function dispatchUpdateAutoSync(autoSync: AutoSyncType): void {
        AutoSync.value = autoSync;
    }

    function dispatchUpdateStatusCheck(statusCheck: boolean): void {
        StatusCheck.value = statusCheck;
    }

    function dispatchIsMobile(dispatchedIsMobile: boolean): void {
        isMobile.value = dispatchedIsMobile;
    }

    function dispatchPlatform(dispatchedPlatform: PlatformType): void {
        platform.value = dispatchedPlatform;
    }

    function dispatchPlugins(dispatchedPlugins: Array<PluginType>): void {
        plugins.value = dispatchedPlugins;
    }

    function dispatchTriggerAASListReload(dispatchedTriggerAASListReload: boolean): void {
        triggerAASListReload.value = dispatchedTriggerAASListReload;
    }

    function dispatchTriggerAASListScroll(): void {
        triggerAASListScroll.value = !triggerAASListScroll.value;
    }

    function dispatchUrlQuery(query: LocationQuery): void {
        urlQuery.value = query;
    }

    return {
        getDrawerState,
        getAASDiscoveryURL,
        getAASRegistryURL,
        getSubmodelRegistryURL,
        getAASRepoURL,
        getSubmodelRepoURL,
        getConceptDescriptionRepoURL,
        getSnackbar,
        getAutoSync,
        getStatusCheck,
        getIsMobile,
        getPlatform,
        getPlugins,
        getTriggerAASListReload,
        getTriggerAASListScroll,
        getUrlQuery,
        dispatchComponentURL,
        dispatchDrawerState,
        dispatchSnackbar,
        dispatchUpdateAutoSync,
        dispatchUpdateStatusCheck,
        dispatchIsMobile,
        dispatchPlatform,
        dispatchPlugins,
        dispatchTriggerAASListReload,
        dispatchTriggerAASListScroll,
        dispatchUrlQuery,
    };
});
