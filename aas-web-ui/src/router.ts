import type { Router, RouteRecordNameGeneric, RouteRecordRaw } from 'vue-router';
import { createRouter, createWebHistory } from 'vue-router';
import AASList from '@/components/AppNavigation/AASList.vue';
import ComponentVisualization from '@/components/ComponentVisualization.vue';
import SubmodelList from '@/components/SubmodelList.vue';
import { useAASHandling } from '@/composables/AAS/AASHandling';
import { useSMEHandling } from '@/composables/AAS/SMEHandling';
import { useRouteHandling } from '@/composables/routeHandling';
import AASEditor from '@/pages/AASEditor.vue';
import AASViewer from '@/pages/AASViewer.vue';
import About from '@/pages/About.vue';
import Dashboard from '@/pages/Dashboard.vue';
import DashboardGroup from '@/pages/DashboardGroup.vue';
import Page404 from '@/pages/Page404.vue';
import SubmodelViewer from '@/pages/SubmodelViewer.vue';
import { useAASStore } from '@/store/AASDataStore';
import { useEnvStore } from '@/store/EnvironmentStore';
import { useNavigationStore } from '@/store/NavigationStore';

// Static routes
const staticRoutes: Array<RouteRecordRaw> = [
    {
        path: '/',
        name: 'AASViewer',
        component: AASViewer,
        meta: { name: 'AAS Viewer', subtitle: 'Visualize Asset Administration Shells' },
    },
    {
        path: '/aaseditor',
        name: 'AASEditor',
        component: AASEditor,
        meta: { name: 'AAS Editor', subtitle: 'Edit Asset Administration Shells' },
    },
    { path: '/aaslist', name: 'AASList', component: AASList },
    { path: '/submodellist', name: 'SubmodelList', component: SubmodelList },
    { path: '/componentvisualization', name: 'ComponentVisualization', component: ComponentVisualization },
    { path: '/visu', name: 'Visualization', component: ComponentVisualization, meta: { name: 'Visualization' } },
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

        let moduleTitle = moduleName;
        if (moduleComponent.default?.moduleTitle && moduleComponent.default?.moduleTitle !== '') {
            moduleTitle = moduleComponent.default?.moduleTitle;
        }

        const isDesktopModule = moduleComponent.default?.isDesktopModule ?? true; // Modules are per default available in desktop view
        const isMobileModule = moduleComponent.default?.isMobileModule ?? false; // Modules are per default not available in mobile view
        const isVisibleModule = moduleComponent.default?.isVisibleModule ?? true; // Modules are per default visible
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
                title: moduleTitle,
                subtitle: 'Module',
                isDesktopModule: isDesktopModule,
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
    const aasStore = useAASStore();
    const envStore = useEnvStore();

    // Connect to (BaSyx) components, otherwise IDs redirecting not possible
    navigationStore.connectComponents();

    // Composables
    const { fetchAndDispatchAas } = useAASHandling();
    const { fetchAndDispatchSme } = useSMEHandling();
    const { idRedirectHandled } = useRouteHandling();

    // Data
    const routesForMobile: Array<RouteRecordNameGeneric> = ['AASList', 'SubmodelList', 'Visualization'];
    const routesForDesktop: Array<RouteRecordNameGeneric> = [
        'AASViewer',
        'AASEditor',
        'SubmodelViewer',
        'Visualization',
    ];
    const routesToSaveAndLoadUrlQuery: Array<RouteRecordNameGeneric> = [
        'AASList',
        'AASEditor',
        'AASViewer',
        'SubmodelViewer',
    ];
    const routesStayOnPages: Array<RouteRecordNameGeneric> = ['About', 'NotFound404'];
    const routesDesktopToAASViewer: Array<RouteRecordNameGeneric> = ['AASList', 'SubmodelList'];
    const routesMobileToAASList: Array<RouteRecordNameGeneric> = ['AASViewer', 'AASEditor', 'SubmodelViewer'];
    const routesToVisualization: Array<RouteRecordNameGeneric> = ['ComponentVisualization'];

    const possibleGloBalAssetIdQueryParameter = ['globalAssetId', 'globalassetid'];
    const possibleAasIdQueryParameter = ['aasId', 'aasid'];
    const possibleSmIdQueryParameter = ['smId', 'smid'];
    const possibleIdQueryParameter = [
        ...possibleGloBalAssetIdQueryParameter,
        ...possibleAasIdQueryParameter,
        ...possibleSmIdQueryParameter,
    ];

    // Computed Properties
    const isMobile = computed(() => navigationStore.getIsMobile); // Check if the current Device is a Mobile Device
    const allowEditing = computed(() => envStore.getAllowEditing); // Check if the current environment allows showing the AAS Editor

    // Save the generated routes in the navigation store
    navigationStore.dispatchModuleRoutes(moduleRoutes);

    const router = createRouter({
        history: createWebHistory(base),
        routes,
    });

    router.beforeEach(async (to, from, next) => {
        // Handle redirection of `globalAssetId`, `aasId` and `smId`
        if (
            await idRedirectHandled(
                to,
                next,
                possibleIdQueryParameter,
                possibleGloBalAssetIdQueryParameter,
                possibleAasIdQueryParameter,
                possibleSmIdQueryParameter
            )
        )
            return;

        // Same route
        if (from.name && from.name === to.name) {
            // But changed URL query parameter
            if (from.query !== to.query) {
                // Just for routes to save/load Query parameter
                if (routesToSaveAndLoadUrlQuery.includes(from.name))
                    // Save URL query parameter
                    navigationStore.dispatchUrlQuery(to.query);
            }
        }

        // Switch from one route to another one
        if (from.name && from.name !== to.name) {
            // Just for switching from a route to save/load URL query parameter
            if (routesToSaveAndLoadUrlQuery.includes(from.name) || from.path.startsWith('/modules/')) {
                // Save URL query parameter
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

            // Just for switching to a route to save/load URL query parameter
            if (routesToSaveAndLoadUrlQuery.includes(to.name)) {
                // Load URL query parameter
                if (!to.query || Object.keys(to.query).length === 0) {
                    const queryLoaded = navigationStore.getUrlQuery;
                    const updatedRoute = Object.assign({}, to, {
                        query: queryLoaded,
                    });

                    if (queryLoaded && Object.keys(queryLoaded).length > 0 && updatedRoute !== to) {
                        next(updatedRoute);
                        return;
                    }
                }
            }
        }

        // Check if single AAS mode is on and no aas query is set to either redirect or show 404
        if (envStore.getSingleAas && (!to.query.aas || (to.query.aas as string).trim() === '')) {
            if (!routesStayOnPages.includes(to.name) && !to.path.startsWith('/modules/')) {
                if (envStore.getSingleAasRedirect) {
                    window.location.replace(envStore.getSingleAasRedirect);
                    return;
                } else if (to.name !== 'NotFound404') {
                    next({ name: 'NotFound404' });
                    return;
                }
            }
        }

        // Handle mobile/desktop view
        if (isMobile.value) {
            // Handle mobile view
            if (
                routesForMobile.includes(to.name) ||
                routesStayOnPages.includes(to.name) ||
                (to.path.includes('/modules/') && to.meta.isMobileModule)
            ) {
                // Do nothing
            } else if (
                routesMobileToAASList.includes(to.name) ||
                (to.path.includes('/modules/') && !to.meta.isMobileModule)
            ) {
                // Redirect to 'AASList' with query
                next({ name: 'AASList', query: to.query });
                return;
            } else if (routesToVisualization.includes(to.name)) {
                // Redirect to 'Visualization' with query
                next({ name: 'Visualization', query: to.query });
                return;
            }
        } else {
            // Handle desktop view
            if (
                routesForDesktop.includes(to.name) ||
                routesStayOnPages.includes(to.name) ||
                (to.path.includes('/modules/') && to.meta.isDesktopModule)
            ) {
                // Do nothing
            } else if (
                routesDesktopToAASViewer.includes(to.name) ||
                (to.name === 'AASEditor' && !allowEditing.value) ||
                (to.path.includes('/modules/') && !to.meta.isDesktopModule)
            ) {
                // Redirect to 'AASViewer' with query
                next({ name: 'AASViewer', query: to.query });
                return;
            } else if (routesToVisualization.includes(to.name)) {
                // Redirect to 'Visualization' with query
                next({ name: 'Visualization', query: to.query });
                return;
            }
        }

        // Fetch and dispatch AAS
        if (to.query.aas && to.query.aas !== '' && from.query.aas !== to.query.aas) {
            const aas = await fetchAndDispatchAas(to.query.aas as string);
            if (!aas || Object.keys(aas).length === 0) {
                // Remove aas query for not available AAS endpoint
                const updatedRoute = Object.assign({}, to, {
                    query: {},
                });
                next(updatedRoute);
                return;
            }
        } else if (!to.query.aas || to.query.aas === '') {
            aasStore.dispatchSelectedAAS({});
        }

        // Fetch and dispatch SM/SME
        if (to.query.path && to.query.path !== '' && from.query.path !== to.query.path) {
            const sme = await fetchAndDispatchSme(to.query.path as string, true);
            if (!sme || Object.keys(sme).length === 0) {
                // Remove path query for not available SME path
                const updatedRoute = Object.assign({}, to, {
                    query: { aas: to.query.aas },
                });
                next(updatedRoute);
                return;
            }
        } else if (!to.query.path || to.query.path === '') {
            aasStore.dispatchSelectedNode({});
        }

        next();
    });

    return router;
}
