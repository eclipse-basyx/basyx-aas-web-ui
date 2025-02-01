import type {
    LocationQuery,
    NavigationGuardNext,
    RouteLocationNormalizedGeneric,
    Router,
    RouteRecordRaw,
} from 'vue-router';
import { createRouter, createWebHistory } from 'vue-router';
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
import { useNavigationStore } from '@/store/NavigationStore';
import { base64Decode } from '@/utils/EncodeDecodeUtils';

// Static routes
const staticRoutes: Array<RouteRecordRaw> = [
    {
        path: '/',
        name: 'AASViewer',
        component: AASViewer,
        meta: { name: 'AAS Viewer', subtitle: 'Visualize Asset Administration Shells' },
    },
    { path: '/aaslist', name: 'AASList', component: AASList },
    { path: '/submodellist', name: 'SubmodelList', component: SubmodelList },
    { path: '/componentvisualization', name: 'ComponentVisualization', component: ComponentVisualization },
    { path: '/visu', name: 'Visualization', component: ComponentVisualization, meta: { name: 'Visualization' } },
    {
        path: '/aaseditor',
        name: 'AASEditor',
        component: AASEditor,
        meta: { name: 'AAS Editor', subtitle: 'Edit Asset Administration Shells' },
    },
    {
        path: '/submodelviewer',
        name: 'SubmodelViewer',
        component: SubmodelViewer,
        meta: { name: 'Submodel Viewer', subtitle: 'Visualize Submodels' },
    },
    {
        path: '/about',
        name: 'About',
        component: About,
        meta: { name: 'About' },
    },
    { path: '/404', name: 'NotFound404', component: Page404, meta: { name: 'Page not found | 404' } },
    { path: '/dashboard', name: 'Dashboard', component: Dashboard },
    { path: '/dashboard-group', name: 'DashboardGroup', component: DashboardGroup },
    { path: '/:pathMatch(.*)*', name: 'NotFound', component: Page404 },
];

const routeNamesToSaveAndLoadUrlQuery = ['AASList', 'AASEditor', 'AASViewer', 'SubmodelViewer'];

// Function to generate routes from modules
const generateModuleRoutes = async (): Promise<Array<RouteRecordRaw>> => {
    const moduleFileRecords = import.meta.glob('@/pages/modules/*.vue');

    const moduleRoutes: Array<RouteRecordRaw> = [];

    for (const path in moduleFileRecords) {
        // Extract the file name to use as the route name and path
        const moduleName = path.split('/').pop()?.replace('.vue', '') || 'UnnamedModule';
        const moduleComponent: any = await moduleFileRecords[path]();

        // Define the route path, e.g., '/modules/module-a' if needed
        const routePath = `/modules/${moduleName.toLowerCase()}`;

        const isVisibleModule = moduleComponent.default?.isVisibleModule ?? true;
        const isOnlyVisibleWithSelectedAas = moduleComponent.default?.isOnlyVisibleWithSelectedAas ?? false;
        const isOnlyVisibleWithSelectedNode = moduleComponent.default?.isOnlyVisibleWithSelectedNode ?? false;
        let preserveRouteQuery = moduleComponent.default?.preserveRouteQuery ?? false;

        // Overwrite preserveRouteQuery
        if (isOnlyVisibleWithSelectedAas || isOnlyVisibleWithSelectedNode) preserveRouteQuery = true;

        moduleRoutes.push({
            path: routePath,
            name: moduleName,
            meta: {
                name: moduleName,
                subtitle: 'Module',
                isVisibleModule: isVisibleModule,
                isOnlyVisibleWithSelectedAas: isOnlyVisibleWithSelectedAas,
                isOnlyVisibleWithSelectedNode: isOnlyVisibleWithSelectedNode,
                preserveRouteQuery: preserveRouteQuery,
            },
            // Lazy-load the component
            component: moduleFileRecords[path] as () => Promise<unknown>,
        });
    }

    return moduleRoutes;
};

export async function createAppRouter(): Promise<Router> {
    const base = import.meta.env.BASE_URL;

    const moduleRoutes = await generateModuleRoutes();

    // Combine static routes with module routes
    const routes: Array<RouteRecordRaw> = [...staticRoutes, ...moduleRoutes];

    // Stores
    const navigationStore = useNavigationStore();

    // Connect to (BaSyx) components, otherwise IDs redirecting not possible
    navigationStore.connectComponents();

    // Composables
    const { getAasId } = useAASDicoveryClient();
    const { fetchAndDispatchAas, getAasEndpointById } = useAASHandling();
    const { getSmEndpointById } = useSMHandling();
    const { fetchAndDispatchSme } = useSMEHandling();

    // Data
    const possibleGloBalAssetIdQueryParameter = ['globalAssetId', 'globalassedid'];
    const possibleAasIdQueryParameter = ['aasId', 'aasid'];
    const possibleSmIdQueryParameter = ['smId', 'smid'];
    const possibleIdQueryParameter = [
        ...possibleGloBalAssetIdQueryParameter,
        ...possibleAasIdQueryParameter,
        ...possibleSmIdQueryParameter,
    ];

    // Save the generated routes in the navigation store
    navigationStore.dispatchModuleRoutes(moduleRoutes);

    const router = createRouter({
        history: createWebHistory(base),
        routes,
    });

    router.beforeEach(async (to, from, next) => {
        // Handle redirection of `globalAssetId`, `aasId` and `smId`
        if (await idRedirectHandled(to, next)) return;

        // TODO Move route handling (handleMobileView(), handleDesktopView()) from App.vue to this route guard - https://github.com/eclipse-basyx/basyx-aas-web-ui/issues/225

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
            if (routeNamesToSaveAndLoadUrlQuery.includes(from.name as string) || from.path.startsWith('/modules/')) {
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
                        if (queryLoaded.path) await fetchAndDispatchSme(queryLoaded.path as string, true);
                        return;
                    }
                }
            }
        }

        // TODO Fetch and dispatching of AAS/SM/SME with respect to URL query parameter
        // TODO Remove keep alive from App.vue

        next();
    });

    /**
     * Handles the redirection of `globalAssetId`, `aasId` and `smId` query parameter from the given route location.
     *
     * @async
     * @function idRedirectHandled
     * @param {RouteLocationNormalizedGeneric} to - The target route to navigate to, which contains query parameters.
     * @param {NavigationGuardNext} next - A function that must be called to resolve the hook. The action depends on the arguments provided to `next`.
     * @returns {Promise<boolean>} Returns a promise that resolves to true if a redirection was performed, otherwise false.
     */
    async function idRedirectHandled(to: RouteLocationNormalizedGeneric, next: NavigationGuardNext): Promise<boolean> {
        // Note: Query parameter are handled case sensitive!
        if (possibleIdQueryParameter.some((queryParamater) => Object.hasOwn(to.query, queryParamater))) {
            if (await globalAssetIdRedirectHandled(to, next)) return true;
            if (await aasIdSmIdRedirectHandled(to, next)) return true;
        }
        return false;
    }

    /**
     * Handles the redirection of `globalAssetId` query parameter from the given route location.
     * It resolves the `globalAssetId` to an `aasId` and finally to an `aasEndpoint`, and updates the route query.
     *
     * @async
     * @function globalAssetIdRedirectHandled
     * @param {RouteLocationNormalizedGeneric} to - The target route to navigate to, which contains query parameters.
     * @param {NavigationGuardNext} next - A function that must be called to resolve the hook. The action depends on the arguments provided to `next`.
     * @returns {Promise<boolean>} Returns a promise that resolves to true if a redirection was performed, otherwise false.
     */
    async function globalAssetIdRedirectHandled(
        to: RouteLocationNormalizedGeneric,
        next: NavigationGuardNext
    ): Promise<boolean> {
        if (possibleGloBalAssetIdQueryParameter.some((queryParamater) => Object.hasOwn(to.query, queryParamater))) {
            const globalAssetIdBase64Encoded = to.query[possibleGloBalAssetIdQueryParameter[0]]
                ? (to.query[possibleGloBalAssetIdQueryParameter[0]] as string)
                : (to.query[possibleGloBalAssetIdQueryParameter[1]] as string);
            const globalAssetId = base64Decode(globalAssetIdBase64Encoded);
            const aasId = await getAasId(globalAssetId);
            const aasEndpoint = await getAasEndpointById(aasId);
            const query = {} as LocationQuery;

            if (aasEndpoint.trim() !== '') {
                query.aas = aasEndpoint.trim();
                const updatedRoute = Object.assign({}, to, {
                    query: query,
                });
                next(updatedRoute);
                return true;
            }
        }
        return false;
    }

    /**
     * Handles the redirection of `aasId` and `smId` query parameter from the given route location.
     * It resolves the `aasId`to an `aasEndpoint`, the `smId`to an `smEndpoint` and updates the route query.
     *
     * @async
     * @function aasIdSmIdRedirectHandled
     * @param {RouteLocationNormalizedGeneric} to - The target route to navigate to, which contains query parameters.
     * @param {NavigationGuardNext} next - A function that must be called to resolve the hook. The action depends on the arguments provided to `next`.
     * @returns {Promise<boolean>} Returns a promise that resolves to true if a redirection was performed, otherwise false.
     */
    async function aasIdSmIdRedirectHandled(
        to: RouteLocationNormalizedGeneric,
        next: NavigationGuardNext
    ): Promise<boolean> {
        if (
            possibleAasIdQueryParameter.some((queryParamater) => Object.hasOwn(to.query, queryParamater)) ||
            possibleSmIdQueryParameter.some((queryParamater) => Object.hasOwn(to.query, queryParamater))
        ) {
            let aasEndpoint = '';
            let smEndpoint = '';

            if (to.query.aasId) {
                const aasIdBase64Encoded = to.query[possibleAasIdQueryParameter[0]]
                    ? (to.query[possibleAasIdQueryParameter[0]] as string)
                    : (to.query[possibleAasIdQueryParameter[1]] as string);
                const aasId = base64Decode(aasIdBase64Encoded);
                aasEndpoint = await getAasEndpointById(aasId);
            }
            if (to.query.smId) {
                const smIdBase64Encoded = to.query[possibleSmIdQueryParameter[0]]
                    ? (to.query[possibleSmIdQueryParameter[0]] as string)
                    : (to.query[possibleSmIdQueryParameter[1]] as string);
                const smId = base64Decode(smIdBase64Encoded);
                smEndpoint = await getSmEndpointById(smId);
            }

            aasEndpoint = aasEndpoint.trim();
            smEndpoint = smEndpoint.trim();

            if (aasEndpoint !== '' || smEndpoint !== '') {
                const query = {} as LocationQuery;

                if (aasEndpoint !== '') query.aas = aasEndpoint.trim();
                if (smEndpoint !== '') query.path = smEndpoint.trim();

                const updatedRoute = Object.assign({}, to, {
                    query: query,
                });

                next(updatedRoute);
                return true;
            }
        }
        return false;
    }

    return router;
}
