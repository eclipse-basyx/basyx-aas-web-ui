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

    const router = createRouter({
        history: createWebHistory(base),
        routes,
    });

    router.beforeEach((to, from, next) => {
        if (from.name && from.name !== to.name) {
            if (routeNamesToSaveAndLoadUrlQuery.includes(from.name as string)) {
                navigationStore.dispatchUrlQuery(from.query); // Save URL query
            }
            if (
                (!to.query || Object.keys(to.query).length === 0) &&
                routeNamesToSaveAndLoadUrlQuery.includes(to.name as string)
            ) {
                const query = navigationStore.getUrlQuery; // Load URL query
                const updatedRoute = Object.assign({}, to, {
                    query: query,
                });

                if (query && Object.keys(query).length > 0 && updatedRoute !== to) {
                    next(updatedRoute);
                    return;
                }
            }
        }
        next();
    });

    return router;
}
