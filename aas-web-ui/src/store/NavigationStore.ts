import type { AutoSyncType, PlatformType, PluginType, SnackbarType } from '@/types/Application';
import type { BaSyxComponent, RepositoryKey } from '@/types/BaSyx';
import { defineStore } from 'pinia';
import { computed, reactive, ref } from 'vue';
import { LocationQuery } from 'vue-router';
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

    // State Variables
    const drawerState = ref(true);
    const AASDiscoveryURL = ref('');
    const AASRegistryURL = ref('');
    const SubmodelRegistryURL = ref('');
    const AASRepoURL = ref('');
    const SubmodelRepoURL = ref('');
    const ConceptDescriptionRepoURL = ref('');
    const Snackbar = ref<SnackbarType>({} as SnackbarType);
    const AutoSync = ref<AutoSyncType>({} as AutoSyncType);
    const StatusCheck = ref(false);
    const isMobile = ref(false);
    const platform = ref<PlatformType>({} as PlatformType);
    const plugins = ref<PluginType[]>([]);
    const triggerAASListReload = ref(false);
    const triggerAASListScroll = ref(false);
    const urlQuery = ref<LocationQuery>({} as LocationQuery);

    // Reactive BaSyx Components Configurations
    const basyxComponents = reactive<Record<RepositoryKey, BaSyxComponent>>({
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
    const getAutoSync = computed(() => AutoSync.value);
    const getStatusCheck = computed(() => StatusCheck.value);
    const getIsMobile = computed(() => isMobile.value);
    const getPlatform = computed(() => platform.value);
    const getPlugins = computed(() => plugins.value);
    const getTriggerAASListReload = computed(() => triggerAASListReload.value);
    const getTriggerAASListScroll = computed(() => triggerAASListScroll.value);
    const getUrlQuery = computed(() => urlQuery.value);
    const getBasyxComponents = computed(() => basyxComponents);

    // Actions
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

    function dispatchPlugins(dispatchedPlugins: PluginType[]): void {
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

    function dispatchComponentURL(componentKey: RepositoryKey, url: string, clearSelectedNode: boolean = true): void {
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
        const keys = Object.keys(basyxComponents) as RepositoryKey[];

        keys.forEach((repoKey) => {
            const storedURL = window.localStorage.getItem(repoKey);

            if (endpointConfigAvailable.value && storedURL) {
                basyxComponents[repoKey].url = storedURL;
                basyxComponents[repoKey].connect();
            } else {
                // Check environment path
                let envPath = '';
                switch (repoKey) {
                    case 'AASDiscovery':
                        envPath = AASDiscoveryURL.value;
                        break;
                    case 'AASRegistry':
                        envPath = AASRegistryURL.value;
                        break;
                    case 'SubmodelRegistry':
                        envPath = SubmodelRegistryURL.value;
                        break;
                    case 'AASRepo':
                        envPath = AASRepoURL.value;
                        break;
                    case 'SubmodelRepo':
                        envPath = SubmodelRepoURL.value;
                        break;
                    case 'ConceptDescriptionRepo':
                        envPath = ConceptDescriptionRepoURL.value;
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

    async function connectComponent(repoKey: keyof typeof basyxComponents): Promise<void> {
        const repo = basyxComponents[repoKey];
        if (repo.url && repo.url.trim() !== '') {
            repo.loading = true;
            let path = repo.url;

            // Append path check for backward compatibility if defined
            if (repo.pathCheck && !path.includes(repo.pathCheck)) {
                path += repo.pathCheck;
            }

            // Append additional parameters if any
            if (repo.additionalParams) {
                path += repo.additionalParams(repoKey);
            }

            const context = `connecting to ${repo.label}`;
            const disableMessage = false;

            try {
                const response = await getRequest(path, context, disableMessage);
                repo.loading = false;

                if (response.success) {
                    // Dispatch to the navigation store
                    dispatchComponentURL(repoKey, repo.url);

                    // Save to localStorage if endpoint config is available
                    if (endpointConfigAvailable.value) {
                        // console.log(`Saving ${repoKey} URL to localStorage:`, repo.url);
                        window.localStorage.setItem(repoKey, repo.url);
                    }

                    // Update the connected status
                    repo.connected = true;
                } else {
                    // Clear the URL in the navigation store
                    dispatchComponentURL(repoKey, '');

                    // Remove from localStorage if endpoint config is available
                    if (endpointConfigAvailable.value) {
                        // console.log(`Removing ${repoKey} URL from localStorage:`, repo.url);
                        window.localStorage.removeItem(repoKey);
                    }

                    // Update the connected status
                    repo.connected = false;
                }
            } catch (error) {
                repo.loading = false;
                console.error(`Error connecting to ${repo.label}:`, error);

                // Clear the URL in the navigation store
                dispatchComponentURL(repoKey, '');

                // Remove from localStorage if endpoint config is available
                if (endpointConfigAvailable.value) {
                    // console.log(`Removing ${repoKey} URL from localStorage:`, repo.url);
                    window.localStorage.removeItem(repoKey);
                }

                // Update the connected status
                repo.connected = false;
            }
        } else {
            repo.connected = false;
            console.warn(`Repository URL for ${repoKey} is not defined or empty.`);
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
        getBasyxComponents,

        // Actions
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
        connectComponents,
    };
});
