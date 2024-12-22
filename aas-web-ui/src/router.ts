import { createRouter, createWebHistory } from 'vue-router';
import AASList from '@/components/AppNavigation/AASList.vue';
import ComponentVisualization from '@/components/ComponentVisualization.vue';
import SubmodelList from '@/components/SubmodelList.vue';
import AASViewer from '@/pages/AASViewer.vue';
import About from '@/pages/About.vue';
import Dashboard from '@/pages/Dashboard.vue';
import DashboardGroup from '@/pages/DashboardGroup.vue';
import MainWindow from '@/pages/MainWindow.vue';
import Page404 from '@/pages/Page404.vue';

const routes = [
    { path: '/', name: 'MainWindow', component: MainWindow },
    { path: '/aaslist', name: 'AASList', component: AASList },
    { path: '/submodellist', name: 'SubmodelList', component: SubmodelList },
    { path: '/componentvisualization', name: 'ComponentVisualization', component: ComponentVisualization },
    { path: '/aasviewer', name: 'AASViewer', component: AASViewer },
    { path: '/about', name: 'About', component: About },
    { path: '/404', name: 'NotFound404', component: Page404 },
    { path: '/dashboard', name: 'Dashboard', component: Dashboard },
    { path: '/dashboard-group', name: 'DashboardGroup', component: DashboardGroup },
    { path: '/:pathMatch(.*)*', name: 'NotFound', component: MainWindow },
];

export async function createAppRouter() {
    console.log('router.ts -> Base Path: ', import.meta.env.BASE_URL);
    const base = import.meta.env.BASE_URL;

    const router = createRouter({
        history: createWebHistory(base),
        routes,
    });

    return router;
}
