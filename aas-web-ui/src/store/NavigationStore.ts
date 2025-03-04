import type { AutoSyncType, PlatformType, PluginType, SnackbarType, StatusCheckType } from '@/types/Application';
import type { BaSyxComponent, BaSyxComponentKey } from '@/types/BaSyx';
import type { LocationQuery, RouteRecordRaw } from 'vue-router';
import { defineStore } from 'pinia';
import { useAASDiscoveryClient } from '@/composables/Client/AASDiscoveryClient';
import { useAASRegistryClient } from '@/composables/Client/AASRegistryClient';
import { useAASRepositoryClient } from '@/composables/Client/AASRepositoryClient';
import { useCDRepositoryClient } from '@/composables/Client/CDRepositoryClient';
import { useSMRegistryClient } from '@/composables/Client/SMRegistryClient';
import { useSMRepositoryClient } from '@/composables/Client/SMRepositoryClient';
import { useRequestHandling } from '@/composables/RequestHandling';
import { useEnvStore } from '@/store/EnvironmentStore';
import { stripLastCharacter } from '@/utils/StringUtils';

export const useNavigationStore = defineStore('navigationStore', () => {
    // Stores
    const envStore = useEnvStore();

    // Composables
    const { getRequest } = useRequestHandling();
    const { endpointPath: aasDiscoveryEndpointPath } = useAASDiscoveryClient();
    const { endpointPath: aasRegistryEndpointPath } = useAASRegistryClient();
    const { endpointPath: smRegistryEndpointPath } = useSMRegistryClient();
    const { endpointPath: aasRepoEndpointPath } = useAASRepositoryClient();
    const { endpointPath: smRepoEndpointPath } = useSMRepositoryClient();
    const { endpointPath: cdRepoEndpointPath } = useCDRepositoryClient();

    // Computed Properties
    const endpointConfigAvailable = computed(() => envStore.getEndpointConfigAvailable);
    const EnvAASDiscoveryPath = computed(() => envStore.getEnvAASDiscoveryPath);
    const EnvAASRegistryPath = computed(() => envStore.getEnvAASRegistryPath);
    const EnvSubmodelRegistryPath = computed(() => envStore.getEnvSubmodelRegistryPath);
    const EnvAASRepoPath = computed(() => envStore.getEnvAASRepoPath);
    const EnvSubmodelRepoPath = computed(() => envStore.getEnvSubmodelRepoPath);
    const EnvConceptDescriptionRepoPath = computed(() => envStore.getEnvConceptDescriptionRepoPath);

    // States
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
    const triggerTreeviewReload = ref(false);
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
            pathCheck: aasDiscoveryEndpointPath,
            additionalParams: '?limit=1',
        },
        AASRegistry: {
            url: AASRegistryURL,
            loading: ref(false),
            connected: ref(null),
            connect: () => connectComponent('AASRegistry'),
            label: 'AAS Registry URL',
            pathCheck: aasRegistryEndpointPath,
            additionalParams: '?limit=1',
        },
        SubmodelRegistry: {
            url: SubmodelRegistryURL,
            loading: ref(false),
            connected: ref(null),
            connect: () => connectComponent('SubmodelRegistry'),
            label: 'Submodel Registry URL',
            pathCheck: smRegistryEndpointPath,
            additionalParams: '?limit=1',
        },
        AASRepo: {
            url: AASRepoURL,
            loading: ref(false),
            connected: ref(null),
            connect: () => connectComponent('AASRepo'),
            label: 'AAS Repository URL',
            pathCheck: aasRepoEndpointPath,
            additionalParams: '?limit=1',
        },
        SubmodelRepo: {
            url: SubmodelRepoURL,
            loading: ref(false),
            connected: ref(null),
            connect: () => connectComponent('SubmodelRepo'),
            label: 'Submodel Repository URL',
            pathCheck: smRepoEndpointPath,
            additionalParams: '?limit=1&level=core',
        },
        ConceptDescriptionRepo: {
            url: ConceptDescriptionRepoURL,
            loading: ref(false),
            connected: ref(null),
            connect: () => connectComponent('ConceptDescriptionRepo'),
            label: 'Concept Description Repository URL',
            pathCheck: cdRepoEndpointPath,
            additionalParams: '?limit=1',
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
    const getTriggerTreeviewReload = computed(() => triggerTreeviewReload.value);
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

    function dispatchComponentURL(componentKey: BaSyxComponentKey, url: string): void {
        switch (componentKey) {
            case 'AASDiscovery':
                AASDiscoveryURL.value = url;
                break;
            case 'AASRegistry':
                AASRegistryURL.value = url;
                // if (clearSelectedNode) aasStore.dispatchSelectedNode({});
                break;
            case 'SubmodelRegistry':
                SubmodelRegistryURL.value = url;
                // if (clearSelectedNode) aasStore.dispatchSelectedNode({});
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
            let basyxComponentURL = basyxComponent.url;
            if (basyxComponentURL.endsWith('/')) basyxComponentURL = stripLastCharacter(basyxComponentURL);

            const context = `Connecting to ${basyxComponent.label}`;
            let disableMessage = false;

            try {
                // First attemp to connect to components via `/description` endpoint
                let path = basyxComponentURL;
                if (path.endsWith('/')) path = stripLastCharacter(path); // Strip ending slash

                if (basyxComponent.pathCheck) path = path.replace(basyxComponent.pathCheck, ''); // Remove path check term if it exists in the URL

                if (path.endsWith('/')) path = stripLastCharacter(path); // Strip ending slash

                path += '/description';

                disableMessage = true;

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
                    // If connect to components via `/description`fails, second attempt to connect via main endpoints
                    const lastPath = path;
                    path = basyxComponentURL;
                    console.warn(
                        context + ' (' + lastPath + ') failed!',
                        'Try to connect to main endpoint (' + path + ')'
                    );
                    if (path.endsWith('/')) path = stripLastCharacter(path); // Strip ending slash

                    // Append path check term if it exists and not already appended
                    if (basyxComponent.pathCheck && !path.endsWith(basyxComponent.pathCheck))
                        path += basyxComponent.pathCheck;

                    // Append additional parameters if any
                    if (basyxComponent.additionalParams) {
                        path += basyxComponent.additionalParams;
                    }

                    disableMessage = false;
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
                        console.warn(context + ' (' + path + ') failed!');

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
        getTriggerTreeviewReload,
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
        dispatchTriggerTreeviewReload,
        dispatchUrlQuery,
        dispatchModuleRoutes,
        connectComponents,
    };
});
