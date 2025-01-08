import { createRouter, createWebHistory } from 'vue-router';
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
import { useAASRepositoryClient } from './composables/Client/AASRepositoryClient';
import { useSMRepositoryClient } from './composables/Client/SMRepositoryClient';

const routes = [
    { path: '/', name: 'AASViewer', component: AASViewer },
    { path: '/aaslist', name: 'AASList', component: AASList },
    { path: '/submodellist', name: 'SubmodelList', component: SubmodelList },
    { path: '/componentvisualization', name: 'ComponentVisualization', component: ComponentVisualization },
    { path: '/aaseditor', name: 'AASEditor', component: AASEditor },
    { path: '/submodelviewer', name: 'SubmodelViewer', component: SubmodelViewer },
    { path: '/about', name: 'About', component: About },
    { path: '/404', name: 'NotFound404', component: Page404 },
    { path: '/dashboard', name: 'Dashboard', component: Dashboard },
    { path: '/dashboard-group', name: 'DashboardGroup', component: DashboardGroup },
    { path: '/:pathMatch(.*)*', name: 'NotFound', component: Page404 },
];

const routeNamesToSaveAndLoadUrlQuery = ['AASList', 'AASEditor', 'AASViewer', 'SubmodelViewer'];

export async function createAppRouter() {
    const base = import.meta.env.BASE_URL;

    // Stores
    const navigationStore = useNavigationStore();

    // Composables
    const { fetchAndDispatchAas } = useAASRepositoryClient();
    const { fetchAndDispatchSme } = useSMRepositoryClient();

    const router = createRouter({
        history: createWebHistory(base),
        routes,
    });

    router.beforeEach(async (to, from, next) => {
        if (from.name && from.name !== to.name) {
            if (routeNamesToSaveAndLoadUrlQuery.includes(from.name as string) && Object.keys(from.query).length > 0) {
                // Save URL query
                const queryToDispatch = from.query;
                const queryPathToDispatch = queryToDispatch?.path as string;

                // Strip idShortPath in case of switching to Submodel Viewer
                if (to.name === 'SubmodelViewer' && queryPathToDispatch && queryPathToDispatch.trim() !== '') {
                    queryToDispatch.path = queryPathToDispatch.trim().split('/submodel-elements/')[0];
                }

                navigationStore.dispatchUrlQuery(queryToDispatch);
            }

            if (
                routeNamesToSaveAndLoadUrlQuery.includes(to.name as string) &&
                (!to.query || Object.keys(to.query).length === 0)
            ) {
                // Load URL query
                const query = navigationStore.getUrlQuery;
                const updatedRoute = Object.assign({}, to, {
                    query: query,
                });

                if (query && Object.keys(query).length > 0 && updatedRoute !== to) {
                    next(updatedRoute);
                    if (query.aas) await fetchAndDispatchAas(query.aas as string);
                    if (query.path) await fetchAndDispatchSme(query.path as string);
                    return;
                }
            }
        }
        next();
    });

    return router;
}
