import type { BaSyxComponent, RepositoryKey } from '@/types/BaSyx';
import { createRouter, createWebHistory, LocationQuery, Router } from 'vue-router';
import AASList from '@/components/AppNavigation/AASList.vue';
import ComponentVisualization from '@/components/ComponentVisualization.vue';
import SubmodelList from '@/components/SubmodelList.vue';
import { useAASHandling } from '@/composables/AASHandling';
import { useAASDicoveryClient } from '@/composables/Client/AASDiscoveryClient';
import { useSMEHandling } from '@/composables/SMEHandling';
import { useSMHandling } from '@/composables/SMHandling';
import AASEditor from '@/pages/AASEditor.vue';
import AASViewer from '@/pages/AASViewer.vue';
import About from '@/pages/About.vue';
import Dashboard from '@/pages/Dashboard.vue';
import DashboardGroup from '@/pages/DashboardGroup.vue';
import Page404 from '@/pages/Page404.vue';
import SubmodelViewer from '@/pages/SubmodelViewer.vue';
import { useEnvStore } from '@/store/EnvironmentStore';
import { useNavigationStore } from '@/store/NavigationStore';
import { base64Decode } from '@/utils/EncodeDecodeUtils';

const routes = [
    { path: '/', name: 'AASViewer', component: AASViewer },
    { path: '/aaslist', name: 'AASList', component: AASList },
    { path: '/submodellist', name: 'SubmodelList', component: SubmodelList },
    { path: '/componentvisualization', name: 'ComponentVisualization', component: ComponentVisualization },
    { path: '/visu', name: 'Visualization', component: ComponentVisualization },
    { path: '/aaseditor', name: 'AASEditor', component: AASEditor },
    { path: '/submodelviewer', name: 'SubmodelViewer', component: SubmodelViewer },
    { path: '/about', name: 'About', component: About },
    { path: '/404', name: 'NotFound404', component: Page404 },
    { path: '/dashboard', name: 'Dashboard', component: Dashboard },
    { path: '/dashboard-group', name: 'DashboardGroup', component: DashboardGroup },
    { path: '/:pathMatch(.*)*', name: 'NotFound', component: Page404 },
];

const routeNamesToSaveAndLoadUrlQuery = ['AASList', 'AASEditor', 'AASViewer', 'SubmodelViewer'];

export async function createAppRouter(): Promise<Router> {
    const base = import.meta.env.BASE_URL;

    // Stores
    const navigationStore = useNavigationStore();
    const envStore = useEnvStore();

    // Reactive BaSyx Components Configurations
    const basyxComponents = reactive<Record<RepositoryKey, BaSyxComponent>>({
        AASDiscovery: {
            url: ref(navigationStore.getAASDiscoveryURL), // Ensure the getter is invoked
            loading: ref(false),
            connect: () => connectComponent('AASDiscovery'),
            label: 'AAS Discovery URL',
        },
        AASRegistry: {
            url: ref(navigationStore.getAASRegistryURL),
            loading: ref(false),
            connect: () => connectComponent('AASRegistry'),
            label: 'AAS Registry URL',
        },
        SubmodelRegistry: {
            url: ref(navigationStore.getSubmodelRegistryURL),
            loading: ref(false),
            connect: () => connectComponent('SubmodelRegistry'),
            label: 'Submodel Registry URL',
        },
        AASRepo: {
            url: ref(navigationStore.getAASRepoURL),
            loading: ref(false),
            connect: () => connectComponent('AASRepo'),
            label: 'AAS Repository URL',
        },
        SubmodelRepo: {
            url: ref(navigationStore.getSubmodelRepoURL),
            loading: ref(false),
            connect: () => connectComponent('SubmodelRepo'),
            label: 'Submodel Repository URL',
        },
        ConceptDescriptionRepo: {
            url: ref(navigationStore.getConceptDescriptionRepoURL),
            loading: ref(false),
            connect: () => connectComponent('ConceptDescriptionRepo'),
            label: 'Concept Description Repository URL',
        },
    });

    const endpointConfigAvailable = ref(envStore.getEndpointConfigAvailable);

    const EnvAASDiscoveryPath = computed(() => envStore.getEnvAASDiscoveryPath);
    const EnvAASRegistryPath = computed(() => envStore.getEnvAASRegistryPath);
    const EnvSubmodelRegistryPath = computed(() => envStore.getEnvSubmodelRegistryPath);
    const EnvAASRepoPath = computed(() => envStore.getEnvAASRepoPath);
    const EnvSubmodelRepoPath = computed(() => envStore.getEnvSubmodelRepoPath);
    const EnvConceptDescriptionRepoPath = computed(() => envStore.getEnvConceptDescriptionRepoPath);

    // Auto connect to BaSyx Components
    Object.keys(basyxComponents).forEach((key) => {
        const repoKey = key as RepositoryKey;
        const storedURL = window.localStorage.getItem(repoKey);

        // console.log('storedURL: ', storedURL, repoKey);

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

            if (!basyxComponents[repoKey].url && envPath && envPath.trim() !== '') {
                basyxComponents[repoKey].url = envPath;
                basyxComponents[repoKey].connect();
            }
        }
    });

    // Composables
    const { getAasId } = useAASDicoveryClient();
    const { fetchAndDispatchAas, getEndpointById: getAasEndpointById } = useAASHandling();
    const { getEndpointById: getSmEndpointById } = useSMHandling();
    const { fetchAndDispatchSme } = useSMEHandling();

    const router = createRouter({
        history: createWebHistory(base),
        routes,
    });

    router.beforeEach(async (to, from, next) => {
        // TODO Fetch and dispatching of AAS/SM/SME with respect to URL query parameter
        // TODO Remove keep alive from App.vue
        // TODO Move route handling (handleMobileView(), handleDesktopView()) from App.vue to this route guard

        console.log('Route Guard: ', 'from:', from, 'to:', to);

        // Resolving ID query parameter
        if (to.query.globalassetid || to.query.aasId || to.query.smId) {
            console.log('aasId/smId resolving from:', to);
            let aasEndpoint = '';
            let smEndpoint = '';

            // Resolve globalAssetId (ignore possible specified aasId/smId)
            // if (to.query.globalassetid) {
            //     const globalAssetIdBase64Encoded = to.query.globalassetid as string;
            //     const globalAssetId = base64Decode(globalAssetIdBase64Encoded);
            //     const aasId = await getAasId(globalAssetId);
            //     const aasEndpoint = await getAasEndpointById(aasId);
            //     const query = {} as LocationQuery;

            //     if (aasEndpoint.trim() !== '') {
            //         query.aas = aasEndpoint;
            //         const updatedRoute = Object.assign({}, to, {
            //             query: query,
            //         });
            //         next(updatedRoute);
            //         return;
            //     }
            // }

            // Resolve aasId and/or smId
            if (to.query.aasId || to.query.smId) {
                if (to.query.aasId) {
                    const aasIdBase64Encoded = to.query.aasId as string;
                    console.log('aasIdBase64Encoded:', aasIdBase64Encoded);
                    const aasId = base64Decode(aasIdBase64Encoded);
                    console.log('aasId:', aasId);
                    // Note aasRegistryURL not dispatched
                    console.log('navigationStore.getAASRegistryURL', navigationStore.getAASRegistryURL);
                    aasEndpoint = await getAasEndpointById(aasId);
                    console.log('aasEndpoint:', aasEndpoint);
                }
                if (to.query.smId) {
                    const smIdBase64Encoded = to.query.smId as string;
                    const smId = base64Decode(smIdBase64Encoded);
                    smEndpoint = await getSmEndpointById(smId);
                }

                const query = {} as LocationQuery;

                if (aasEndpoint.trim() !== '') query.aas = aasEndpoint;
                if (smEndpoint.trim() !== '') query.path = smEndpoint;

                const updatedRoute = Object.assign({}, to, {
                    query: query,
                });

                console.log('aasId/smId resolving to:', updatedRoute);

                // next(updatedRoute);
                // return;
            }
        }

        // Same route
        if (from.name && from.name === to.name) {
            // But changed URL query
            if (from.query !== to.query) {
                // Just for routes to save/load Query
                if (routeNamesToSaveAndLoadUrlQuery.includes(from.name as string))
                    // Save URL query
                    navigationStore.dispatchUrlQuery(to.query);
            }
        }

        // Switch from one route to another
        if (from.name && from.name !== to.name) {
            // Just for switching from a route to Save/Load Query
            if (routeNamesToSaveAndLoadUrlQuery.includes(from.name as string)) {
                // Save URL query
                if (Object.keys(from.query).length > 0) {
                    const queryToDispatch = from.query;

                    // Strip idShortPath in case of switching to Submodel Viewer
                    const queryPathToDispatch = queryToDispatch?.path as string;
                    if (to.name === 'SubmodelViewer' && queryPathToDispatch && queryPathToDispatch.trim() !== '') {
                        queryToDispatch.path = queryPathToDispatch.trim().split('/submodel-elements/')[0];
                    }

                    navigationStore.dispatchUrlQuery(queryToDispatch);
                }
            }

            // Just for switching to a route to save/load Query
            if (routeNamesToSaveAndLoadUrlQuery.includes(to.name as string)) {
                // Load URL query
                if (!to.query || Object.keys(to.query).length === 0) {
                    const queryLoaded = navigationStore.getUrlQuery;
                    const updatedRoute = Object.assign({}, to, {
                        query: queryLoaded,
                    });

                    if (queryLoaded && Object.keys(queryLoaded).length > 0 && updatedRoute !== to) {
                        next(updatedRoute);
                        // Dispatch AAS/SM/SME with respect to URL query parameter
                        if (queryLoaded.aas) await fetchAndDispatchAas(queryLoaded.aas as string);
                        if (queryLoaded.path) await fetchAndDispatchSme(queryLoaded.path as string);
                        return;
                    }
                }
            }
        }
        next();
    });

    function connectComponent(repoKey: keyof typeof basyxComponents) {
        navigationStore.dispatchComponentURL(repoKey, basyxComponents[repoKey].url, false);
    }

    return router;
}
