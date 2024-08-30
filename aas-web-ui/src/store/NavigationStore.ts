export interface SnackbarType {
    status: boolean;
    timeout?: number;
    color?: string;
    btnColor?: string;
    text?: string;
    baseError?: string;
    extendedError?: string;
}

export interface AutoSyncType {
    state: boolean;
    interval: number;
}

export interface PlatformType {
    android: boolean;
    chrome: boolean;
    cordova: boolean;
    edge: boolean;
    electron: boolean;
    firefox: boolean;
    ios: boolean;
    linux: boolean;
    mac: boolean;
    opera: boolean;
    ssr: boolean;
    touch: boolean;
    win: boolean;
}

export interface PluginType {
    name: string;
    SemanticID: string;
}

import { defineStore } from 'pinia';
import { useAASStore } from './AASDataStore';

export const useNavigationStore = defineStore({
    id: 'navigationStore',

    state: () => ({
        drawerState: true as boolean,
        AASDiscoveryURL: '' as string,
        AASRegistryURL: '' as string,
        SubmodelRegistryURL: '' as string,
        AASRepoURL: '' as string,
        SubmodelRepoURL: '' as string,
        ConceptDescriptionRepoURL: '' as string,
        Snackbar: {} as SnackbarType,
        AutoSync: {} as AutoSyncType,
        StatusCheck: false as boolean,
        isMobile: false as boolean,
        platform: {} as PlatformType,
        plugins: [] as PluginType[],
        triggerAASListReload: false as boolean,
        triggerAASSelected: false as boolean,
    }),

    getters: {
        getDrawerState: (state) => state.drawerState,
        getAASDiscoveryURL: (state) => state.AASDiscoveryURL,
        getAASRegistryURL: (state) => state.AASRegistryURL,
        getSubmodelRegistryURL: (state) => state.SubmodelRegistryURL,
        getAASRepoURL: (state) => state.AASRepoURL,
        getSubmodelRepoURL: (state) => state.SubmodelRepoURL,
        getConceptDescriptionRepoURL: (state) => state.ConceptDescriptionRepoURL,
        getSnackbar: (state) => state.Snackbar,
        getAutoSync: (state) => state.AutoSync,
        getStatusCheck: (state) => state.StatusCheck,
        getIsMobile: (state) => state.isMobile,
        getPlatform: (state) => state.platform,
        getPlugins: (state) => state.plugins,
        getTriggerAASListReload: (state) => state.triggerAASListReload,
        getTriggerAASSelected: (state) => state.triggerAASSelected,
    },

    actions: {
        dispatchDrawerState(drawerState: boolean) {
            this.drawerState = drawerState;
        },
        dispatchAASDiscoveryURL(url: string) {
            this.AASDiscoveryURL = url;
        },
        dispatchAASRegistryURL(url: string, clearSelectedNode: boolean = true) {
            this.AASRegistryURL = url;
            if (clearSelectedNode) useAASStore().dispatchSelectedNode({});
        },
        dispatchSubmodelRegistryURL(url: string, clearSelectedNode: boolean = true) {
            this.SubmodelRegistryURL = url;
            if (clearSelectedNode) useAASStore().dispatchSelectedNode({});
        },
        dispatchRepoURL(type: string, url: string) {
            switch (type) {
                case 'AAS':
                    this.AASRepoURL = url;
                    break;
                case 'Submodel':
                    this.SubmodelRepoURL = url;
                    break;
                case 'ConceptDescription':
                    this.ConceptDescriptionRepoURL = url;
                    break;
            }
        },
        dispatchSnackbar(snackbarObj: SnackbarType) {
            this.Snackbar = snackbarObj;
        },
        dispatchUpdateAutoSync(autoSync: AutoSyncType) {
            this.AutoSync = autoSync;
        },
        dispatchUpdateStatusCheck(statusCheck: boolean) {
            this.StatusCheck = statusCheck;
        },
        dispatchIsMobile(isMobile: boolean) {
            this.isMobile = isMobile;
        },
        dispatchPlatform(platform: PlatformType) {
            this.platform = platform;
        },
        dispatchPlugins(plugins: Array<PluginType>) {
            this.plugins = plugins;
        },
        dispatchTriggerAASListReload(triggerAASListReload: boolean) {
            this.triggerAASListReload = triggerAASListReload;
        },
        dispatchTriggerAASSelected() {
            this.triggerAASSelected = !this.triggerAASSelected;
        },
    },
});
