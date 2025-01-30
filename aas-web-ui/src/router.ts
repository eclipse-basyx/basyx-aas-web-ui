import type {
    LocationQuery,
    NavigationGuardNext,
    RouteLocationNormalizedGeneric,
    Router,
    RouteRecordRaw,
} from 'vue-router';
import { createRouter, createWebHistory } from 'vue-router';
import { useDisplay } from 'vuetify';
// import { createRouter, createWebHistory, RouteRecordNameGeneric } from 'vue-router';
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
// import { useEnvStore } from '@/store/EnvironmentStore';
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
        const isMobileModule = moduleComponent.default?.isMobileModule ?? false;
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
                isMobileModule: isMobileModule,
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
    // const envStore = useEnvStore();

    // Connect to (BaSyx) components, otherwise IDs redirecting not possible
    navigationStore.connectComponents();

    // Composables
    const { getAasId } = useAASDicoveryClient();
    const { fetchAndDispatchAas, getAasEndpointById } = useAASHandling();
    const { getSmEndpointById } = useSMHandling();
    const { fetchAndDispatchSme } = useSMEHandling();

    // Vuetify
    const { mobile, platform } = useDisplay();

    // Data
    // const routesForMobile: Array<RouteRecordNameGeneric> = ['AASList', 'SubmodelList', 'Visualization'];
    // const routesForDesktop: Array<RouteRecordNameGeneric> = [
    //     'AASViewer',
    //     'SubmodelViewer',
    //     'AASEditor',
    //     'Visualization',
    // ];
    // const routesStayOnPages: Array<RouteRecordNameGeneric> = ['About', 'NotFound404'];
    // const routesDesktopToAASViewer: Array<RouteRecordNameGeneric> = ['AASList', 'SubmodelList'];
    // const routesMobileToAASList: Array<RouteRecordNameGeneric> = ['AASViewer', 'AASEditor', 'SubmodelViewer'];
    // const routesToVisualization: Array<RouteRecordNameGeneric> = ['ComponentVisualization'];
    const possibleGloBalAssetIdQueryParameter = ['globalAssetId', 'globalassedid'];
    const possibleAasIdQueryParameter = ['aasId', 'aasid'];
    const possibleSmIdQueryParameter = ['smId', 'smid'];
    const possibleIdQueryParameter = [
        ...possibleGloBalAssetIdQueryParameter,
        ...possibleAasIdQueryParameter,
        ...possibleSmIdQueryParameter,
    ];

    // Computed Properties
    // const allowEditing = computed(() => envStore.getAllowEditing); // Check if the current environment allows showing the AAS Editor
    const showMobileVersion = computed(() => {
        return (
            mobile.value ||
            // include IPad as mobile device
            (platform.value.mac && platform.value.touch) ||
            // IOS and Android are mobile platforms
            platform.value.ios ||
            platform.value.android
        );
    });
    const searchParams = computed(() => new URL(window.location.href).searchParams);
    const aasEndpoint = computed(() => (searchParams.value.get('aas') || '').trim());
    const smePath = computed(() => (searchParams.value.get('path') || '').trim());

    // Dispatch the mobile status to the store
    navigationStore.dispatchIsMobile(showMobileVersion.value);
    navigationStore.dispatchPlatform(platform.value);

    // Save the generated routes in the navigation store
    navigationStore.dispatchModuleRoutes(moduleRoutes);

    const router = createRouter({
        history: createWebHistory(base),
        routes,
    });

    router.beforeEach(async (to, from, next) => {
        console.warn('from', from);
        console.warn('to', to);
        // Handle redirection of `globalAssetId`, `aasId` and `smId`
        if (await idRedirectHandled(to, next)) return;

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

            // // Check if single AAS mode is on and no aas query is set to either redirect or show 404
            // if (envStore.getSingleAas && aasEndpoint.value.trim() === '') {
            //     if (!routesStayOnPages.includes(to.name as string) && !to.path.startsWith('/modules/')) {
            //         if (envStore.getSingleAasRedirect) {
            //             window.location.replace(envStore.getSingleAasRedirect);
            //             return;
            //         } else if (to.name !== 'NotFound404') {
            //             next({ name: 'NotFound404' });
            //             return;
            //         }
            //     }
            // }

            // // Check which platform is used and handle the view
            // if (showMobileVersion) {
            //     // Handle mobile view
            //     if (routesForMobile.includes(to.name) || routesStayOnPages.includes(to.name)) {
            //         // Do nothing
            //     } else if (routesMobileToAASList.includes(to.name)) {
            //         // Redirect to 'AASList' with existing query parameters
            //         next({ name: 'AASList', query: to.query });
            //         return;
            //     } else if (routesToVisualization.includes(to.name)) {
            //         // Redirect to 'Visualization' with existing query parameters
            //         next({ name: 'Visualization', query: to.query });
            //         return;
            //     } else {
            //         // Default redirect to 'AASList' without query parameters
            //         next({ name: 'AASList' });
            //         return;
            //     }
            //     // Noting todo for to.name === 'SubmodelList'
            // } else {
            //     // Handle desktop view
            //     if (routesForDesktop.includes(to.name) || routesStayOnPages.includes(to.name)) {
            //         // Do nothing
            //     } else if (
            //         routesDesktopToAASViewer.includes(to.name) ||
            //         (to.name === 'AASEditor' && allowEditing.value)
            //     ) {
            //         // Redirect to 'AASViewer' with existing query parameters
            //         next({ name: 'AASViewer', query: to.query });
            //         return;
            //     } else if (routesToVisualization.includes(to.name)) {
            //         // Redirect to 'Visualization' with existing query parameters
            //         next({ name: 'Visualization', query: to.query });
            //         return;
            //     }
            // }
        }

        // Fetch and dispatch with respect to URL query parameter (aas, path)
        if (aasEndpoint.value && aasEndpoint.value !== '') {
            await fetchAndDispatchAas(aasEndpoint.value);
            if (smePath.value && smePath.value !== '') {
                await fetchAndDispatchSme(smePath.value, true);
            }
        }

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
