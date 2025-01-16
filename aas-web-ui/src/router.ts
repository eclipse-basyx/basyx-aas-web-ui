import { createRouter, createWebHistory, Router, RouteRecordRaw } from 'vue-router';
import AASList from '@/components/AppNavigation/AASList.vue';
import ComponentVisualization from '@/components/ComponentVisualization.vue';
import SubmodelList from '@/components/SubmodelList.vue';
import AASEditor from '@/pages/AASEditor.vue';
import AASViewer from '@/pages/AASViewer.vue';
import About from '@/pages/About.vue';
import Dashboard from '@/pages/Dashboard.vue';
import DashboardGroup from '@/pages/DashboardGroup.vue';
import Page404 from '@/pages/Page404.vue';
import SubmodelViewer from '@/pages/SubmodelViewer.vue';
import { useNavigationStore } from '@/store/NavigationStore';
import { useAASHandling } from './composables/AASHandling';
import { useSMEHandling } from './composables/SMEHandling';

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
    { path: '/visu', name: 'Visualization', component: ComponentVisualization },
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
    { path: '/about', name: 'About', component: About },
    { path: '/404', name: 'NotFound404', component: Page404 },
    { path: '/dashboard', name: 'Dashboard', component: Dashboard },
    { path: '/dashboard-group', name: 'DashboardGroup', component: DashboardGroup },
    { path: '/:pathMatch(.*)*', name: 'NotFound', component: Page404 },
];

const routeNamesToSaveAndLoadUrlQuery = ['AASList', 'AASEditor', 'AASViewer', 'SubmodelViewer'];

// Function to generate routes from modules
const generateModuleRoutes = (): Array<RouteRecordRaw> => {
    const modules = import.meta.glob('@/pages/modules/*.vue');

    const moduleRoutes: Array<RouteRecordRaw> = [];

    for (const path in modules) {
        // Extract the file name to use as the route name and path
        const fileName = path.split('/').pop()?.replace('.vue', '') || 'UnnamedModule';

        // Define the route path, e.g., '/modules/module-a' if needed
        const routePath = `/modules/${fileName.toLowerCase()}`;

        moduleRoutes.push({
            path: routePath,
            name: fileName,
            meta: { name: fileName, subtitle: 'Module' },
            // Lazy-load the component
            component: modules[path] as () => Promise<unknown>,
        });
    }

    return moduleRoutes;
};

const moduleRoutes = generateModuleRoutes();

// Combine static routes with module routes
const routes: Array<RouteRecordRaw> = [...staticRoutes, ...moduleRoutes];

export async function createAppRouter(): Promise<Router> {
    const base = import.meta.env.BASE_URL;

    // Stores
    const navigationStore = useNavigationStore();

    // Composables
    const { fetchAndDispatchAas } = useAASHandling();
    const { fetchAndDispatchSme } = useSMEHandling();

    // Save the generated routes in the navigation store
    navigationStore.dispatchModuleRoutes(moduleRoutes);

    const router = createRouter({
        history: createWebHistory(base),
        routes,
    });

    router.beforeEach(async (to, from, next) => {
        // TODO Fetch and dispatching of AAS/SM/SME with respect to URL query parameter
        // TODO Remove keep alive from App.vue
        // TODO Move route handling (handleMobileView(), handleDesktopView()) from App.vue to this route guard

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
                        if (queryLoaded.path) await fetchAndDispatchSme(queryLoaded.path as string, true);
                        return;
                    }
                }
            }
        }
        next();
    });

    return router;
}
