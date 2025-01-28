import type { AutoSyncType, PlatformType, PluginType, SnackbarType, StatusCheckType } from '@/types/Application';
import type { BaSyxComponent, BaSyxComponentKey } from '@/types/BaSyx';
import type { LocationQuery, RouteRecordRaw } from 'vue-router';
import { defineStore } from 'pinia';
import { computed, reactive, ref } from 'vue';
import { useRequestHandling } from '@/composables/RequestHandling';
import { useAASStore } from '@/store/AASDataStore';
import { useEnvStore } from '@/store/EnvironmentStore';

export const useNavigationStore = defineStore('navigationStore', () => {
    // Initialize Dependent Stores
    const aasStore = useAASStore();
    const envStore = useEnvStore();

    // Composables
    const { getRequest } = useRequestHandling();

    // Computed Property
    const endpointConfigAvailable = computed(() => envStore.getEndpointConfigAvailable);
    const EnvAASDiscoveryPath = computed(() => envStore.getEnvAASDiscoveryPath);
    const EnvAASRegistryPath = computed(() => envStore.getEnvAASRegistryPath);
    const EnvSubmodelRegistryPath = computed(() => envStore.getEnvSubmodelRegistryPath);
    const EnvAASRepoPath = computed(() => envStore.getEnvAASRepoPath);
    const EnvSubmodelRepoPath = computed(() => envStore.getEnvSubmodelRepoPath);
    const EnvConceptDescriptionRepoPath = computed(() => envStore.getEnvConceptDescriptionRepoPath);

    // State Variables
    const drawerState = ref(true);
    const AASDiscoveryURL = ref('');
    const AASRegistryURL = ref('');
    const SubmodelRegistryURL = ref('');
    const AASRepoURL = ref('');
    const SubmodelRepoURL = ref('');
    const ConceptDescriptionRepoURL = ref('');
    const Snackbar = ref<SnackbarType>({} as SnackbarType);
    const autoSync = ref<AutoSyncType>({ state: false, interval: 3000 } as AutoSyncType);
    const statusCheck = ref<StatusCheckType>({ state: false, interval: 10000 } as StatusCheckType);
    const isMobile = ref(false);
    const platform = ref<PlatformType>({} as PlatformType);
    const plugins = ref<PluginType[]>([]);
    const triggerAASListReload = ref(false);
    const triggerAASListScroll = ref(false);
    const urlQuery = ref<LocationQuery>({} as LocationQuery);
    const moduleRoutes = ref<Array<RouteRecordRaw>>([]);

    // Reactive BaSyx Components Configurations
    const basyxComponents = reactive<Record<BaSyxComponentKey, BaSyxComponent>>({
        AASDiscovery: {
            url: AASDiscoveryURL,
            loading: ref(false),
            connected: ref(null),
            connect: () => connectComponent('AASDiscovery'),
            label: 'AAS Discovery URL',
        },
        AASRegistry: {
            url: AASRegistryURL,
            loading: ref(false),
            connected: ref(null),
            connect: () => connectComponent('AASRegistry'),
            label: 'AAS Registry URL',
        },
        SubmodelRegistry: {
            url: SubmodelRegistryURL,
            loading: ref(false),
            connected: ref(null),
            connect: () => connectComponent('SubmodelRegistry'),
            label: 'Submodel Registry URL',
        },
        AASRepo: {
            url: AASRepoURL,
            loading: ref(false),
            connected: ref(null),
            connect: () => connectComponent('AASRepo'),
            label: 'AAS Repository URL',
        },
        SubmodelRepo: {
            url: SubmodelRepoURL,
            loading: ref(false),
            connected: ref(null),
            connect: () => connectComponent('SubmodelRepo'),
            label: 'Submodel Repository URL',
        },
        ConceptDescriptionRepo: {
            url: ConceptDescriptionRepoURL,
            loading: ref(false),
            connected: ref(null),
            connect: () => connectComponent('ConceptDescriptionRepo'),
            label: 'Concept Description Repository URL',
        },
    });

    // Getters
    const getDrawerState = computed(() => drawerState.value);
    const getAASDiscoveryURL = computed(() => AASDiscoveryURL.value);
    const getAASRegistryURL = computed(() => AASRegistryURL.value);
    const getSubmodelRegistryURL = computed(() => SubmodelRegistryURL.value);
    const getAASRepoURL = computed(() => AASRepoURL.value);
    const getSubmodelRepoURL = computed(() => SubmodelRepoURL.value);
    const getConceptDescriptionRepoURL = computed(() => ConceptDescriptionRepoURL.value);
    const getSnackbar = computed(() => Snackbar.value);
    const getAutoSync = computed(() => autoSync.value);
    const getStatusCheck = computed(() => statusCheck.value);
    const getIsMobile = computed(() => isMobile.value);
    const getPlatform = computed(() => platform.value);
    const getPlugins = computed(() => plugins.value);
    const getTriggerAASListReload = computed(() => triggerAASListReload.value);
    const getTriggerAASListScroll = computed(() => triggerAASListScroll.value);
    const getUrlQuery = computed(() => urlQuery.value);
    const getModuleRoutes = computed(() => moduleRoutes.value);
    const getBasyxComponents = computed(() => basyxComponents);

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

    function dispatchTriggerAASListScroll(): void {
        triggerAASListScroll.value = !triggerAASListScroll.value;
    }

    function dispatchUrlQuery(query: LocationQuery): void {
        urlQuery.value = query;
    }

    function dispatchModuleRoutes(routes: RouteRecordRaw[]): void {
        moduleRoutes.value = routes;
    }

    function dispatchComponentURL(
        componentKey: BaSyxComponentKey,
        url: string,
        clearSelectedNode: boolean = true
    ): void {
        switch (componentKey) {
            case 'AASDiscovery':
                AASDiscoveryURL.value = url;
                break;
            case 'AASRegistry':
                AASRegistryURL.value = url;
                if (clearSelectedNode) aasStore.dispatchSelectedNode({});
                break;
            case 'SubmodelRegistry':
                SubmodelRegistryURL.value = url;
                if (clearSelectedNode) aasStore.dispatchSelectedNode({});
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
            default:
                console.warn(`Unknown component key: ${componentKey}`);
                break;
        }
    }

    function connectComponents(): void {
        // Ensure that Object.keys returns RepositoryKey[]
        const keys = Object.keys(basyxComponents) as BaSyxComponentKey[];

        keys.forEach((repoKey) => {
            const storedURL = window.localStorage.getItem(repoKey + 'URL');

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

                if (!basyxComponents[repoKey].url && envPath.trim() !== '') {
                    basyxComponents[repoKey].url = envPath;
                    basyxComponents[repoKey].connect();
                }
            }
        });
    }

    async function connectComponent(componentKey: keyof typeof basyxComponents): Promise<void> {
        const basyxComponent = basyxComponents[componentKey];
        if (basyxComponent.url && basyxComponent.url.trim() !== '') {
            basyxComponent.loading = true;
            const path = basyxComponent.url;

            const context = `connecting to ${basyxComponent.label}`;
            const disableMessage = false;

            try {
                const response = await getRequest(path, context, disableMessage);
                basyxComponent.loading = false;

                if (response.success) {
                    // Dispatch to the navigation store
                    dispatchComponentURL(componentKey, basyxComponent.url);

                    // Save to localStorage if endpoint config is available
                    if (endpointConfigAvailable.value) {
                        // console.log(`Saving ${repoKey} URL to localStorage:`, repo.url);
                        window.localStorage.setItem(componentKey + 'URL', basyxComponent.url);
                    }

                    // Update the connected status
                    basyxComponent.connected = true;
                } else {
                    // Clear the URL in the navigation store
                    dispatchComponentURL(componentKey, '');

                    // Remove from localStorage if endpoint config is available
                    if (endpointConfigAvailable.value) {
                        // console.log(`Removing ${repoKey} URL from localStorage:`, repo.url);
                        window.localStorage.removeItem(componentKey + 'URL');
                    }

                    // Update the connected status
                    basyxComponent.connected = false;
                }
            } catch (error) {
                basyxComponent.loading = false;
                console.error(`Error connecting to ${basyxComponent.label}:`, error);

                // Clear the URL in the navigation store
                dispatchComponentURL(componentKey, '');

                // Remove from localStorage if endpoint config is available
                if (endpointConfigAvailable.value) {
                    // console.log(`Removing ${repoKey} URL from localStorage:`, repo.url);
                    window.localStorage.removeItem(componentKey + 'URL');
                }

                // Update the connected status
                basyxComponent.connected = false;
            }
        } else {
            basyxComponent.connected = false;
            console.warn(`Repository URL for ${componentKey} is not defined or empty.`);
        }
    }

    return {
        // Getters
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
        getModuleRoutes,
        getBasyxComponents,

        // Actions
        dispatchComponentURL,
        dispatchDrawerState,
        dispatchSnackbar,
        dispatchAutoSync,
        dispatchStatusCheck,
        dispatchIsMobile,
        dispatchPlatform,
        dispatchPlugins,
        dispatchTriggerAASListReload,
        dispatchTriggerAASListScroll,
        dispatchUrlQuery,
        dispatchModuleRoutes,
        connectComponents,
    };
});
