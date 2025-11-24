import type { AutoSyncType, PlatformType, PluginType, SnackbarType, StatusCheckType } from '@/types/Application';
import type { BaSyxComponent, BaSyxComponentKey } from '@/types/BaSyx';
import type {
    ComponentConfig,
    InfrastructureAuth,
    InfrastructureConfig,
    InfrastructureStorage,
} from '@/types/Infrastructure';
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
    const EnvKeycloakActive = computed(() => envStore.getKeycloakActive);
    const EnvKeycloakUrl = computed(() => envStore.getKeycloakUrl);
    const EnvKeycloakRealm = computed(() => envStore.getKeycloakRealm);
    const EnvKeycloakClientId = computed(() => envStore.getKeycloakClientId);

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

    // Infrastructure States
    const infrastructures = ref<InfrastructureConfig[]>([]);
    const selectedInfrastructureId = ref<string | null>(null);
    const triggerInfrastructureDialog = ref(false);

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

    // Infrastructure Getters
    const getInfrastructures = computed(() => infrastructures.value);
    const getSelectedInfrastructureId = computed(() => selectedInfrastructureId.value);
    const getSelectedInfrastructure = computed(() => {
        if (!selectedInfrastructureId.value) return null;
        return infrastructures.value.find((infra) => infra.id === selectedInfrastructureId.value) || null;
    });
    const getTriggerInfrastructureDialog = computed(() => triggerInfrastructureDialog.value);

    // Helper Functions
    function generateInfrastructureId(): string {
        return 'infra_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    }

    function createEmptyInfrastructure(name: string = 'New Infrastructure'): InfrastructureConfig {
        return {
            id: generateInfrastructureId(),
            name,
            components: {
                AASDiscovery: {
                    url: '',
                    auth: { securityType: 'No Authentication' },
                },
                AASRegistry: {
                    url: '',
                    auth: { securityType: 'No Authentication' },
                },
                SubmodelRegistry: {
                    url: '',
                    auth: { securityType: 'No Authentication' },
                },
                AASRepo: {
                    url: '',
                    auth: { securityType: 'No Authentication' },
                },
                SubmodelRepo: {
                    url: '',
                    auth: { securityType: 'No Authentication' },
                },
                ConceptDescriptionRepo: {
                    url: '',
                    auth: { securityType: 'No Authentication' },
                },
            },
        };
    }

    function createDefaultInfrastructureFromEnv(): InfrastructureConfig {
        const infrastructure = createEmptyInfrastructure('Default Infrastructure');
        infrastructure.isDefault = true;

        // Populate from environment variables
        if (EnvAASDiscoveryPath.value) infrastructure.components.AASDiscovery.url = EnvAASDiscoveryPath.value;
        if (EnvAASRegistryPath.value) infrastructure.components.AASRegistry.url = EnvAASRegistryPath.value;
        if (EnvSubmodelRegistryPath.value)
            infrastructure.components.SubmodelRegistry.url = EnvSubmodelRegistryPath.value;
        if (EnvAASRepoPath.value) infrastructure.components.AASRepo.url = EnvAASRepoPath.value;
        if (EnvSubmodelRepoPath.value) infrastructure.components.SubmodelRepo.url = EnvSubmodelRepoPath.value;
        if (EnvConceptDescriptionRepoPath.value)
            infrastructure.components.ConceptDescriptionRepo.url = EnvConceptDescriptionRepoPath.value;
        if (EnvKeycloakActive.value) {
            const infrastructureAuth: InfrastructureAuth = {
                securityType: 'Keycloak',
                keycloakConfig: {
                    serverUrl: EnvKeycloakUrl.value,
                    realm: EnvKeycloakRealm.value,
                    clientId: EnvKeycloakClientId.value,
                    authFlow: 'auth-code',
                },
            };
            infrastructure.components.AASDiscovery.auth = infrastructureAuth;
            infrastructure.components.AASRegistry.auth = infrastructureAuth;
            infrastructure.components.SubmodelRegistry.auth = infrastructureAuth;
            infrastructure.components.AASRepo.auth = infrastructureAuth;
            infrastructure.components.SubmodelRepo.auth = infrastructureAuth;
            infrastructure.components.ConceptDescriptionRepo.auth = infrastructureAuth;
        }

        return infrastructure;
    }

    function createInfrastructureFromLegacyStorage(): InfrastructureConfig {
        const infrastructure = createEmptyInfrastructure('Legacy Infrastructure');

        // Try to load from old localStorage keys
        const legacyAASDiscoveryURL = window.localStorage.getItem('AASDiscoveryURL');
        const legacyAASRegistryURL = window.localStorage.getItem('AASRegistryURL');
        const legacySubmodelRegistryURL = window.localStorage.getItem('SubmodelRegistryURL');
        const legacyAASRepoURL = window.localStorage.getItem('AASRepoURL');
        const legacySubmodelRepoURL = window.localStorage.getItem('SubmodelRepoURL');
        const legacyConceptDescriptionRepoURL = window.localStorage.getItem('ConceptDescriptionRepoURL');

        if (legacyAASDiscoveryURL) infrastructure.components.AASDiscovery.url = legacyAASDiscoveryURL;
        if (legacyAASRegistryURL) infrastructure.components.AASRegistry.url = legacyAASRegistryURL;
        if (legacySubmodelRegistryURL) infrastructure.components.SubmodelRegistry.url = legacySubmodelRegistryURL;
        if (legacyAASRepoURL) infrastructure.components.AASRepo.url = legacyAASRepoURL;
        if (legacySubmodelRepoURL) infrastructure.components.SubmodelRepo.url = legacySubmodelRepoURL;
        if (legacyConceptDescriptionRepoURL)
            infrastructure.components.ConceptDescriptionRepo.url = legacyConceptDescriptionRepoURL;

        return infrastructure;
    }

    function loadInfrastructuresFromStorage(): void {
        try {
            const stored = window.localStorage.getItem('basyxInfrastructures');
            if (stored) {
                const storage: InfrastructureStorage = JSON.parse(stored);
                infrastructures.value = storage.infrastructures;
                selectedInfrastructureId.value = storage.selectedInfrastructureId;
                console.warn('[NavigationStore] Loaded infrastructures from localStorage:', {
                    count: infrastructures.value.length,
                    selected: selectedInfrastructureId.value,
                    infrastructures: infrastructures.value.map((infra) => ({
                        id: infra.id,
                        name: infra.name,
                        hasTokens: Object.entries(infra.components)
                            .filter(([, comp]) => comp.token?.accessToken)
                            .map(([key]) => key),
                    })),
                });
            } else {
                // Migration from legacy storage
                const legacyInfra = createInfrastructureFromLegacyStorage();

                // Check if any legacy URLs exist
                const hasLegacyData = Object.values(legacyInfra.components).some((comp) => comp.url.trim() !== '');

                if (hasLegacyData) {
                    // Use legacy data as first infrastructure
                    infrastructures.value = [legacyInfra];
                    selectedInfrastructureId.value = legacyInfra.id;
                } else {
                    // Create default from environment
                    const defaultInfra = createDefaultInfrastructureFromEnv();
                    infrastructures.value = [defaultInfra];
                    selectedInfrastructureId.value = defaultInfra.id;
                }

                saveInfrastructuresToStorage();
            }
        } catch (error) {
            console.error('Error loading infrastructures from storage:', error);
            // Fallback to default
            const defaultInfra = createDefaultInfrastructureFromEnv();
            infrastructures.value = [defaultInfra];
            selectedInfrastructureId.value = defaultInfra.id;
        }
    }

    function saveInfrastructuresToStorage(): void {
        try {
            const storage: InfrastructureStorage = {
                infrastructures: infrastructures.value,
                selectedInfrastructureId: selectedInfrastructureId.value,
            };

            if (process.env.NODE_ENV === 'development') {
                console.warn('[NavigationStore] Saving infrastructures to localStorage:', {
                    count: storage.infrastructures.length,
                    selected: storage.selectedInfrastructureId,
                    infrastructuresWithTokens: storage.infrastructures.map((infra) => ({
                        id: infra.id,
                        name: infra.name,
                        tokensInComponents: Object.entries(infra.components)
                            .filter(([, comp]) => comp.token?.accessToken)
                            .map(([key]) => key),
                    })),
                });
            }

            localStorage.setItem('basyxInfrastructures', JSON.stringify(storage));
        } catch (error) {
            console.error('Error saving infrastructures to storage:', error);
        }
    }

    // Initialize infrastructures on store creation
    loadInfrastructuresFromStorage();

    // Watch for changes to sync URL refs with selected infrastructure
    watch(
        [getSelectedInfrastructure],
        () => {
            const infra = getSelectedInfrastructure.value;
            if (infra) {
                AASDiscoveryURL.value = infra.components.AASDiscovery.url;
                AASRegistryURL.value = infra.components.AASRegistry.url;
                SubmodelRegistryURL.value = infra.components.SubmodelRegistry.url;
                AASRepoURL.value = infra.components.AASRepo.url;
                SubmodelRepoURL.value = infra.components.SubmodelRepo.url;
                ConceptDescriptionRepoURL.value = infra.components.ConceptDescriptionRepo.url;
            }
        },
        { immediate: true }
    );

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

        // Update the selected infrastructure
        if (getSelectedInfrastructure.value) {
            getSelectedInfrastructure.value.components[componentKey].url = url;
            saveInfrastructuresToStorage();
        }
    }

    // Infrastructure Actions
    async function dispatchSelectInfrastructure(infrastructureId: string): Promise<void> {
        const infra = infrastructures.value.find((i) => i.id === infrastructureId);
        if (infra) {
            selectedInfrastructureId.value = infrastructureId;
            saveInfrastructuresToStorage();

            // Trigger connection check for all components
            await connectComponents();
        }
    }

    function dispatchAddInfrastructure(infrastructure: InfrastructureConfig): void {
        // If this infrastructure is marked as default, unmark all others
        if (infrastructure.isDefault) {
            infrastructures.value.forEach((infra) => {
                infra.isDefault = false;
            });
        }

        infrastructures.value.push(infrastructure);
        saveInfrastructuresToStorage();
    }

    function dispatchUpdateInfrastructure(infrastructure: InfrastructureConfig): void {
        const index = infrastructures.value.findIndex((i) => i.id === infrastructure.id);
        if (index !== -1) {
            // If this infrastructure is marked as default, unmark all others
            if (infrastructure.isDefault) {
                infrastructures.value.forEach((infra) => {
                    if (infra.id !== infrastructure.id) {
                        infra.isDefault = false;
                    }
                });
            }

            // Use splice to ensure reactivity
            infrastructures.value.splice(index, 1, infrastructure);

            if (process.env.NODE_ENV === 'development') {
                console.warn('[NavigationStore] Updated infrastructure:', {
                    id: infrastructure.id,
                    name: infrastructure.name,
                    hasTokens: Object.entries(infrastructure.components)
                        .filter(([, comp]) => comp.token?.accessToken)
                        .map(([key]) => key),
                });
            }

            saveInfrastructuresToStorage();

            // If this is the selected infrastructure, update the URL refs
            if (selectedInfrastructureId.value === infrastructure.id) {
                AASDiscoveryURL.value = infrastructure.components.AASDiscovery.url;
                AASRegistryURL.value = infrastructure.components.AASRegistry.url;
                SubmodelRegistryURL.value = infrastructure.components.SubmodelRegistry.url;
                AASRepoURL.value = infrastructure.components.AASRepo.url;
                SubmodelRepoURL.value = infrastructure.components.SubmodelRepo.url;
                ConceptDescriptionRepoURL.value = infrastructure.components.ConceptDescriptionRepo.url;
            }
        }
    }

    function dispatchDeleteInfrastructure(infrastructureId: string): void {
        const index = infrastructures.value.findIndex((i) => i.id === infrastructureId);
        if (index !== -1) {
            infrastructures.value.splice(index, 1);

            // If we deleted the selected infrastructure, select another one
            if (selectedInfrastructureId.value === infrastructureId) {
                if (infrastructures.value.length > 0) {
                    selectedInfrastructureId.value = infrastructures.value[0].id;
                } else {
                    // Create a new default infrastructure if none exist
                    const defaultInfra = createDefaultInfrastructureFromEnv();
                    infrastructures.value.push(defaultInfra);
                    selectedInfrastructureId.value = defaultInfra.id;
                }
            }

            saveInfrastructuresToStorage();
        }
    }

    function dispatchUpdateComponentAuth(componentKey: BaSyxComponentKey, auth: ComponentConfig['auth']): void {
        if (getSelectedInfrastructure.value && auth) {
            getSelectedInfrastructure.value.components[componentKey].auth = auth;
            saveInfrastructuresToStorage();
        }
    }

    function dispatchTriggerInfrastructureDialog(): void {
        triggerInfrastructureDialog.value = !triggerInfrastructureDialog.value;
    }

    /**
     * Refreshes expired or expiring tokens for all infrastructures with Keycloak authentication.
     * Tokens are refreshed if they expire within 5 minutes (300 seconds).
     * Returns array of failed refresh attempts with infrastructure and component info.
     */
    async function refreshInfrastructureTokens(): Promise<
        Array<{ infraName: string; component: string; error: string }>
    > {
        const failures: Array<{ infraName: string; component: string; error: string }> = [];
        const TOKEN_REFRESH_BUFFER = 5 * 60 * 1000; // 5 minutes in milliseconds
        const now = Date.now();

        for (const infrastructure of infrastructures.value) {
            const componentKeys: BaSyxComponentKey[] = [
                'AASDiscovery',
                'AASRegistry',
                'SubmodelRegistry',
                'AASRepo',
                'SubmodelRepo',
                'ConceptDescriptionRepo',
            ];

            for (const componentKey of componentKeys) {
                const component = infrastructure.components[componentKey];
                const auth = component.auth;
                const token = component.token;

                // Check if component uses Keycloak and has a token
                if (auth?.securityType !== 'Keycloak' || !token?.accessToken) {
                    continue;
                }

                // Check if token is expired or expiring soon
                if (!token.expiresAt || token.expiresAt > now + TOKEN_REFRESH_BUFFER) {
                    continue;
                }

                // Attempt token refresh
                try {
                    if (!token.refreshToken) {
                        // No refresh token available (e.g., client credentials flow)
                        failures.push({
                            infraName: infrastructure.name,
                            component: componentKey,
                            error: 'No refresh token available - re-authentication required',
                        });
                        continue;
                    }

                    if (!auth.keycloakConfig) {
                        failures.push({
                            infraName: infrastructure.name,
                            component: componentKey,
                            error: 'Missing Keycloak configuration',
                        });
                        continue;
                    }

                    const { serverUrl, realm, clientId, clientSecret } = auth.keycloakConfig;
                    const tokenEndpoint = `${serverUrl.replace(/\/$/, '')}/realms/${realm}/protocol/openid-connect/token`;

                    const params = new URLSearchParams({
                        client_id: clientId,
                        grant_type: 'refresh_token',
                        refresh_token: token.refreshToken,
                    });

                    if (clientSecret) {
                        params.set('client_secret', clientSecret);
                    }

                    const response = await fetch(tokenEndpoint, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: params.toString(),
                    });

                    const data = await response.json();

                    if (!response.ok) {
                        failures.push({
                            infraName: infrastructure.name,
                            component: componentKey,
                            error: data.error_description || 'Token refresh failed',
                        });
                        continue;
                    }

                    // Update token in infrastructure
                    const expiresAt = Date.now() + (data.expires_in || 300) * 1000;
                    component.token = {
                        accessToken: data.access_token,
                        refreshToken: data.refresh_token || token.refreshToken,
                        expiresAt,
                    };

                    if (process.env.NODE_ENV === 'development') {
                        console.warn(`[NavigationStore] Refreshed token for ${infrastructure.name} - ${componentKey}`);
                    }
                } catch (error) {
                    failures.push({
                        infraName: infrastructure.name,
                        component: componentKey,
                        error: error instanceof Error ? error.message : 'Unknown error',
                    });
                }
            }
        }

        // Save updated tokens to storage if any were refreshed
        const totalKeycloakTokens = infrastructures.value.reduce(
            (acc, infra) =>
                acc +
                Object.values(infra.components).filter((c) => c.auth?.securityType === 'Keycloak' && c.token).length,
            0
        );

        if (failures.length < totalKeycloakTokens) {
            saveInfrastructuresToStorage();
        }

        return failures;
    }

    async function connectComponents(): Promise<void> {
        // Ensure that Object.keys returns RepositoryKey[]
        const keys = Object.keys(basyxComponents) as BaSyxComponentKey[];

        const connectionPromises: Promise<void>[] = [];

        keys.forEach((repoKey) => {
            const storedURL = window.localStorage.getItem(repoKey + 'URL');

            if (endpointConfigAvailable.value && storedURL) {
                basyxComponents[repoKey].url = storedURL;
                connectionPromises.push(connectComponent(repoKey));
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
                    connectionPromises.push(connectComponent(repoKey));
                }
            }
        });

        await Promise.all(connectionPromises);
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
        getInfrastructures,
        getSelectedInfrastructureId,
        getSelectedInfrastructure,
        getTriggerInfrastructureDialog,

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

        // Infrastructure Actions
        dispatchSelectInfrastructure,
        dispatchAddInfrastructure,
        dispatchUpdateInfrastructure,
        dispatchDeleteInfrastructure,
        dispatchUpdateComponentAuth,
        dispatchTriggerInfrastructureDialog,
        createEmptyInfrastructure,
        refreshInfrastructureTokens,
    };
});
