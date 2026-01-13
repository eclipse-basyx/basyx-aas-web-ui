import type { BaSyxComponent, BaSyxComponentKey } from '@/types/BaSyx';
import type { InfrastructureConfig, UserData } from '@/types/Infrastructure';
import { defineStore } from 'pinia';
import { computed, nextTick, reactive, ref, watch } from 'vue';
import { useAASDiscoveryClient } from '@/composables/Client/AASDiscoveryClient';
import { useAASRegistryClient } from '@/composables/Client/AASRegistryClient';
import { useAASRepositoryClient } from '@/composables/Client/AASRepositoryClient';
import { useCDRepositoryClient } from '@/composables/Client/CDRepositoryClient';
import { useSMRegistryClient } from '@/composables/Client/SMRegistryClient';
import { useSMRepositoryClient } from '@/composables/Client/SMRepositoryClient';
import { useInfrastructureAuth } from '@/composables/Infrastructure/useInfrastructureAuth';
import { useInfrastructureStorage } from '@/composables/Infrastructure/useInfrastructureStorage';
import { useRequestHandling } from '@/composables/RequestHandling';
import { useEnvStore } from '@/store/EnvironmentStore';
import { useNavigationStore } from '@/store/NavigationStore';
import { stripLastCharacter } from '@/utils/StringUtils';

export const useInfrastructureStore = defineStore('infrastructureStore', () => {
    // Stores
    const envStore = useEnvStore();
    const navigationStore = useNavigationStore();

    // Initialization state
    const isInitialized = ref(false);
    const initializationPromise = ref<Promise<void> | null>(null);

    // Composables
    const { getRequest } = useRequestHandling();
    const infrastructureStorage = useInfrastructureStorage();
    const infrastructureAuth = useInfrastructureAuth();
    const { endpointPath: aasDiscoveryEndpointPath } = useAASDiscoveryClient();
    const { endpointPath: aasRegistryEndpointPath } = useAASRegistryClient();
    const { endpointPath: smRegistryEndpointPath } = useSMRegistryClient();
    const { endpointPath: aasRepoEndpointPath } = useAASRepositoryClient();
    const { endpointPath: smRepoEndpointPath } = useSMRepositoryClient();
    const { endpointPath: cdRepoEndpointPath } = useCDRepositoryClient();

    // Computed Properties from Environment Store
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
    const EnvOidcActive = computed(() => envStore.getOidcActive);
    const EnvOidcUrl = computed(() => envStore.getOidcUrl);
    const EnvOidcScope = computed(() => envStore.getOidcScope);
    const EnvOidcClientId = computed(() => envStore.getOidcClientId);
    const EnvPreconfiguredAuth = computed(() => envStore.getPreconfiguredAuth);
    const EnvPreconfiguredAuthClientSecret = computed(() => envStore.getPreconfiguredAuthClientSecret);

    // Infrastructure States
    const infrastructures = ref<InfrastructureConfig[]>([]);
    const selectedInfrastructureId = ref<string | null>(null);
    const openInfrastructureEditMode = ref(false);
    const user = ref<UserData | null>(null);
    const isAuthenticating = ref(false);
    const isTestingConnections = ref(false);

    // Component URL States
    // Force reset to empty strings to prevent any stale values from previous sessions
    const AASDiscoveryURL = ref<string>('');
    const AASRegistryURL = ref<string>('');
    const SubmodelRegistryURL = ref<string>('');
    const AASRepoURL = ref<string>('');
    const SubmodelRepoURL = ref<string>('');
    const ConceptDescriptionRepoURL = ref<string>('');

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
    const getInfrastructures = computed(() => infrastructures.value);
    const getSelectedInfrastructureId = computed(() => selectedInfrastructureId.value);
    const getSelectedInfrastructure = computed(() => {
        if (!selectedInfrastructureId.value) return null;
        return infrastructures.value.find((infra) => infra.id === selectedInfrastructureId.value) || null;
    });
    const getOpenInfrastructureEditMode = computed(() => openInfrastructureEditMode.value);
    const getAASDiscoveryURL = computed(() => AASDiscoveryURL.value);
    const getAASRegistryURL = computed(() => AASRegistryURL.value);
    const getSubmodelRegistryURL = computed(() => SubmodelRegistryURL.value);
    const getAASRepoURL = computed(() => AASRepoURL.value);
    const getSubmodelRepoURL = computed(() => SubmodelRepoURL.value);
    const getConceptDescriptionRepoURL = computed(() => ConceptDescriptionRepoURL.value);
    const getBasyxComponents = computed(() => basyxComponents);
    const getIsAuthenticating = computed(() => isAuthenticating.value);
    const getIsTestingConnections = computed(() => isTestingConnections.value);
    const getIsLoginAvailable = computed(() => {
        const infra = getSelectedInfrastructure.value;
        if (!infra || !infra.auth || infra.auth.securityType === 'No Authentication') {
            return false;
        }
        const allowLogout = envStore.getAllowLogout;
        const isOAuth2ClientCredentials = infra.auth.oauth2?.authFlow === 'client-credentials';
        return allowLogout && !isOAuth2ClientCredentials;
    });

    function getDefaultInfrastructureId(): string {
        // Look for infrastructure marked as default
        const defaultInfra = infrastructures.value.find((infra) => infra.isDefault);
        if (defaultInfra) {
            return defaultInfra.id;
        }
        return '';
    }

    // Destructure createEmptyInfrastructure directly, others will be wrapped
    const { createEmptyInfrastructure } = infrastructureStorage;

    // Wrapper functions that delegate to storage composable
    async function loadInfrastructuresFromStorage(): Promise<void> {
        const envConfig = {
            aasDiscoveryPath: EnvAASDiscoveryPath.value,
            aasRegistryPath: EnvAASRegistryPath.value,
            submodelRegistryPath: EnvSubmodelRegistryPath.value,
            aasRepoPath: EnvAASRepoPath.value,
            submodelRepoPath: EnvSubmodelRepoPath.value,
            conceptDescriptionRepoPath: EnvConceptDescriptionRepoPath.value,
            keycloakActive: EnvKeycloakActive.value,
            keycloakUrl: EnvKeycloakUrl.value,
            keycloakRealm: EnvKeycloakRealm.value,
            keycloakClientId: EnvKeycloakClientId.value,
            oidcActive: EnvOidcActive.value,
            oidcUrl: EnvOidcUrl.value,
            oidcScope: EnvOidcScope.value,
            oidcClientId: EnvOidcClientId.value,
            preconfiguredAuth: EnvPreconfiguredAuth.value,
            preconfiguredAuthClientSecret: EnvPreconfiguredAuthClientSecret.value,
            endpointConfigAvailable: endpointConfigAvailable.value,
        };

        const result = await infrastructureStorage.loadInfrastructuresFromStorage(envConfig);

        // Set the loaded values
        selectedInfrastructureId.value = result.selectedInfrastructureId;
        infrastructures.value = result.infrastructures;
    }

    function saveInfrastructuresToStorage(): void {
        infrastructureStorage.saveInfrastructuresToStorage(infrastructures.value, selectedInfrastructureId.value);
    }

    function dispatchSetDefaultInfrastructure(infrastructureId: string): void {
        infrastructures.value.forEach((infra) => {
            if (infra.id === infrastructureId) {
                infra.isDefault = true;
            } else {
                infra.isDefault = false;
            }
            saveInfrastructuresToStorage();
        });
    }

    // Initialize infrastructures on store creation
    initializationPromise.value = (async () => {
        await loadInfrastructuresFromStorage();

        // Save to localStorage after loading to persist any newly created infrastructures
        saveInfrastructuresToStorage();

        // Explicitly set URLs from selected infrastructure after loading
        const initialInfra = getSelectedInfrastructure.value;
        if (initialInfra) {
            AASDiscoveryURL.value = initialInfra.components.AASDiscovery.url;
            AASRegistryURL.value = initialInfra.components.AASRegistry.url;
            SubmodelRegistryURL.value = initialInfra.components.SubmodelRegistry.url;
            AASRepoURL.value = initialInfra.components.AASRepo.url;
            SubmodelRepoURL.value = initialInfra.components.SubmodelRepo.url;
            ConceptDescriptionRepoURL.value = initialInfra.components.ConceptDescriptionRepo.url;
        }

        // Connect components after infrastructure is loaded and synced
        await nextTick(); // Ensure watcher has run
        await connectComponents();

        isInitialized.value = true;
    })();

    // Watch for changes to selected infrastructure ID (not the infrastructure object itself)
    // This prevents triggering on token refreshes or other infrastructure mutations
    watch(selectedInfrastructureId, (newId) => {
        const infra = infrastructures.value.find((i) => i.id === newId);
        if (infra) {
            AASDiscoveryURL.value = infra.components.AASDiscovery.url;
            AASRegistryURL.value = infra.components.AASRegistry.url;
            SubmodelRegistryURL.value = infra.components.SubmodelRegistry.url;
            AASRepoURL.value = infra.components.AASRepo.url;
            SubmodelRepoURL.value = infra.components.SubmodelRepo.url;
            ConceptDescriptionRepoURL.value = infra.components.ConceptDescriptionRepo.url;
        }
    });

    // Actions
    function dispatchComponentURL(componentKey: BaSyxComponentKey, url: string): void {
        switch (componentKey) {
            case 'AASDiscovery':
                AASDiscoveryURL.value = url;
                break;
            case 'AASRegistry':
                AASRegistryURL.value = url;
                break;
            case 'SubmodelRegistry':
                SubmodelRegistryURL.value = url;
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
    async function dispatchSelectInfrastructure(infrastructureId: string, connect: boolean = true): Promise<void> {
        const infra = infrastructures.value.find((i) => i.id === infrastructureId);
        if (!infra) {
            console.error(`[InfrastructureStore] Infrastructure with ID ${infrastructureId} not found`);
            return;
        }

        selectedInfrastructureId.value = infrastructureId;

        saveInfrastructuresToStorage();

        // Only clear lists when actually switching infrastructure (connect=true)
        // During initial load (connect=false), lists should not be cleared
        if (connect) {
            navigationStore.dispatchClearAASList();
            navigationStore.dispatchClearTreeview();
            // Trigger connection check for all components
            await connectComponents();
        }
        // Note: AAS list and treeview reload automatically via watchers when component URLs change
    }

    function dispatchIsTestingConnections(state: boolean): void {
        isTestingConnections.value = state;
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
                console.warn('[InfrastructureStore] Updated infrastructure:', {
                    id: infrastructure.id,
                    name: infrastructure.name,
                    hasToken: !!infrastructure.token?.accessToken,
                });
            }

            saveInfrastructuresToStorage();

            // If this is the selected infrastructure, update the URL refs
            // if (selectedInfrastructureId.value === infrastructure.id) {
            //     AASDiscoveryURL.value = infrastructure.components.AASDiscovery.url;
            //     AASRegistryURL.value = infrastructure.components.AASRegistry.url;
            //     SubmodelRegistryURL.value = infrastructure.components.SubmodelRegistry.url;
            //     AASRepoURL.value = infrastructure.components.AASRepo.url;
            //     SubmodelRepoURL.value = infrastructure.components.SubmodelRepo.url;
            //     ConceptDescriptionRepoURL.value = infrastructure.components.ConceptDescriptionRepo.url;
            // }
        }
    }

    async function dispatchDeleteInfrastructure(infrastructureId: string): Promise<void> {
        const index = infrastructures.value.findIndex((i) => i.id === infrastructureId);
        if (index !== -1) {
            const wasSelected = selectedInfrastructureId.value === infrastructureId;
            infrastructures.value.splice(index, 1);

            // If we deleted the selected infrastructure, select another one
            if (wasSelected) {
                if (infrastructures.value.length > 0) {
                    // Switch to first available infrastructure with full connection and reload
                    await dispatchSelectInfrastructure(infrastructures.value[0].id);
                } else {
                    // Create a new default infrastructure if none exist
                    const envConfig = {
                        aasDiscoveryPath: EnvAASDiscoveryPath.value,
                        aasRegistryPath: EnvAASRegistryPath.value,
                        submodelRegistryPath: EnvSubmodelRegistryPath.value,
                        aasRepoPath: EnvAASRepoPath.value,
                        submodelRepoPath: EnvSubmodelRepoPath.value,
                        conceptDescriptionRepoPath: EnvConceptDescriptionRepoPath.value,
                        keycloakActive: EnvKeycloakActive.value,
                        keycloakUrl: EnvKeycloakUrl.value,
                        keycloakRealm: EnvKeycloakRealm.value,
                        keycloakClientId: EnvKeycloakClientId.value,
                        preconfiguredAuth: EnvPreconfiguredAuth.value,
                        preconfiguredAuthClientSecret: EnvPreconfiguredAuthClientSecret.value,
                    };
                    const defaultInfra = await infrastructureStorage.createDefaultInfrastructureFromEnv(envConfig);
                    infrastructures.value.push(defaultInfra);
                    await dispatchSelectInfrastructure(defaultInfra.id);
                }
            } else {
                // Just save if we deleted a non-selected infrastructure
                saveInfrastructuresToStorage();
            }
        }
    }

    function dispatchUpdateInfrastructureAuth(infrastructureId: string, auth: InfrastructureConfig['auth']): void {
        const infrastructure = infrastructures.value.find((i) => i.id === infrastructureId);
        if (infrastructure && auth) {
            infrastructure.auth = auth;
            saveInfrastructuresToStorage();
        }
    }

    async function dispatchResetToDefaultInfrastructures(): Promise<void> {
        // Store the currently selected infrastructure ID before clearing
        const previousSelectedId = selectedInfrastructureId.value;

        // Clear infrastructure data from localStorage
        localStorage.removeItem('basyxInfrastructures');

        // Reload infrastructures from storage - this will recreate from env vars or create empty infrastructure
        await loadInfrastructuresFromStorage();

        // Determine which infrastructure to select after reset
        let targetInfraId: string | null = null;

        // Check if the previously selected infrastructure still exists after reset
        if (previousSelectedId && infrastructures.value.some((infra) => infra.id === previousSelectedId)) {
            targetInfraId = previousSelectedId;
        } else {
            // Select the preconfigured/default infrastructure
            const defaultInfra = infrastructures.value.find((infra) => infra.isDefault);
            if (defaultInfra) {
                targetInfraId = defaultInfra.id;
            } else if (infrastructures.value.length > 0) {
                // Fallback: select first available infrastructure
                targetInfraId = infrastructures.value[0].id;
            }
        }

        // Update selected infrastructure ID
        if (targetInfraId) {
            selectedInfrastructureId.value = targetInfraId;
        }

        // Save the reset state to localStorage
        saveInfrastructuresToStorage();

        // Update URL refs from selected infrastructure
        const selectedInfra = getSelectedInfrastructure.value;
        if (selectedInfra) {
            AASDiscoveryURL.value = selectedInfra.components.AASDiscovery.url;
            AASRegistryURL.value = selectedInfra.components.AASRegistry.url;
            SubmodelRegistryURL.value = selectedInfra.components.SubmodelRegistry.url;
            AASRepoURL.value = selectedInfra.components.AASRepo.url;
            SubmodelRepoURL.value = selectedInfra.components.SubmodelRepo.url;
            ConceptDescriptionRepoURL.value = selectedInfra.components.ConceptDescriptionRepo.url;
        }

        // Clear AAS list and treeview
        navigationStore.dispatchClearAASList();
        navigationStore.dispatchClearTreeview();

        // Reconnect to all components
        await connectComponents();
    }

    // Wrapper functions that delegate to auth composable
    async function refreshInfrastructureTokens(
        infrastructureId?: string
    ): Promise<Array<{ infraName: string; error: string }>> {
        const failures = await infrastructureAuth.refreshInfrastructureTokens(infrastructures.value, infrastructureId);

        // Save updated tokens to storage if any were refreshed
        const totalAuthenticatedInfrastructures = infrastructures.value.filter(
            (infra) => infra.auth?.securityType === 'OAuth2' && infra.token
        ).length;

        if (failures.length < totalAuthenticatedInfrastructures) {
            saveInfrastructuresToStorage();
        }

        return failures;
    }

    function setAuthenticationStatusForInfrastructure(infrastructureId: string, state: boolean): void {
        infrastructureAuth.setAuthenticationStatusForInfrastructure(infrastructures.value, infrastructureId, state);
    }

    /**
     * Wait for the store to finish initializing
     * Used by router to ensure infrastructures are loaded before processing OAuth2 callbacks
     */
    async function waitForInitialization(): Promise<void> {
        if (isInitialized.value) return;
        if (initializationPromise.value) {
            await initializationPromise.value;
        }
    }

    async function connectComponents(): Promise<void> {
        // Ensure that Object.keys returns RepositoryKey[]
        const keys = Object.keys(basyxComponents) as BaSyxComponentKey[];

        const connectionPromises: Promise<void>[] = [];

        // Get the current selected infrastructure
        const selectedInfra = getSelectedInfrastructure.value;

        if (!selectedInfra) {
            console.warn('[InfrastructureStore] No infrastructure selected for connection');
            return;
        }

        keys.forEach((repoKey) => {
            // Use URL from the selected infrastructure
            const infraUrl = selectedInfra.components[repoKey]?.url || '';

            if (infraUrl.trim() !== '') {
                // Normalize URLs for comparison (trim and remove trailing slash)
                const currentUrl = basyxComponents[repoKey].url.trim().replace(/\/$/, '');
                const newUrl = infraUrl.trim().replace(/\/$/, '');

                // Only set URL if it has actually changed to avoid triggering watchers unnecessarily
                if (currentUrl !== newUrl) {
                    basyxComponents[repoKey].url = infraUrl;
                }
                connectionPromises.push(connectComponent(repoKey));
            } else {
                // If infrastructure has no URL for this component, mark as not connected
                basyxComponents[repoKey].connected = false;
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
                        // Update the connected status
                        basyxComponent.connected = true;
                    } else {
                        console.warn(context + ' (' + path + ') failed!');

                        // Remove from localStorage if endpoint config is available
                        if (endpointConfigAvailable.value) {
                            window.localStorage.removeItem(componentKey + 'URL');
                        }

                        // Update the connected status
                        basyxComponent.connected = false;
                    }
                }
            } catch (error) {
                basyxComponent.loading = false;
                console.error(`Error connecting to ${basyxComponent.label}:`, error);

                // Update the connected status
                basyxComponent.connected = false;
            }
        } else {
            basyxComponent.connected = false;
            console.warn(`Repository URL for ${componentKey} is not defined or empty.`);
        }
    }

    function setUser(userValue: UserData | null): void {
        user.value = userValue || null;

        const envStore = useEnvStore();

        if (
            envStore.getKeycloakFeatureControl === true &&
            userValue?.roles &&
            Array.isArray(userValue.roles) &&
            userValue.roles.length > 0
        ) {
            const keycloakFeatureControlRolePrefix = envStore.getKeycloakFeatureControlRolePrefix;
            const keycloak_roles_features = [
                {
                    keycloakRole: keycloakFeatureControlRolePrefix + 'multiple-aas',
                    feature: 'SINGLE_AAS',
                    setFunction: 'setSingleAas',
                    setValue: 'false',
                },
                {
                    keycloakRole: keycloakFeatureControlRolePrefix + 'sm-viewer-editor',
                    feature: 'SM_VIEWER_EDITOR',
                    setFunction: 'setSmViewerEditor',
                    setValue: 'true',
                },
                {
                    keycloakRole: keycloakFeatureControlRolePrefix + 'allow-editing',
                    feature: 'ALLOW_EDITING',
                    setFunction: 'setAllowEditing',
                    setValue: 'true',
                },
                {
                    keycloakRole: keycloakFeatureControlRolePrefix + 'allow-uploading',
                    feature: 'ALLOW_UPLOADING',
                    setFunction: 'setAllowUploading',
                    setValue: 'true',
                },
                {
                    keycloakRole: keycloakFeatureControlRolePrefix + 'allow-logout',
                    feature: 'ALLOW_LOGOUT',
                    setFunction: 'setAllowLogout',
                    setValue: 'true',
                },
                {
                    keycloakRole: keycloakFeatureControlRolePrefix + 'endpoint-config-available',
                    feature: 'ENDPOINT_CONFIG_AVAILABLE',
                    setFunction: 'setEndpointConfigAvailable',
                    setValue: 'true',
                },
            ];

            keycloak_roles_features.forEach((keycloak_roles_feature: any) => {
                const key = keycloak_roles_feature.setFunction as keyof typeof envStore;
                if (
                    userValue?.roles?.includes(keycloak_roles_feature.keycloakRole) &&
                    typeof envStore[key] === 'function'
                ) {
                    envStore[key](keycloak_roles_feature.setValue);
                }
            });
        }
    }

    return {
        // Getters
        getInfrastructures,
        getSelectedInfrastructureId,
        getSelectedInfrastructure,
        getOpenInfrastructureEditMode,
        isInitialized,
        getAASDiscoveryURL,
        getAASRegistryURL,
        getSubmodelRegistryURL,
        getAASRepoURL,
        getSubmodelRepoURL,
        getConceptDescriptionRepoURL,
        getBasyxComponents,
        getDefaultInfrastructureId,
        getIsAuthenticating,
        getIsTestingConnections,
        getIsLoginAvailable,

        // Actions
        dispatchComponentURL,
        dispatchSelectInfrastructure,
        dispatchAddInfrastructure,
        dispatchUpdateInfrastructure,
        dispatchDeleteInfrastructure,
        dispatchUpdateInfrastructureAuth,
        dispatchSetDefaultInfrastructure,
        dispatchResetToDefaultInfrastructures,
        createEmptyInfrastructure,
        refreshInfrastructureTokens,
        setAuthenticationStatusForInfrastructure,
        waitForInitialization,
        connectComponents,
        connectComponent,
        setUser,
        dispatchIsTestingConnections,
    };
});
