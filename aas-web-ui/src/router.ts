import type { Router, RouteRecordNameGeneric, RouteRecordRaw } from 'vue-router';
import _ from 'lodash';
import { createRouter, createWebHistory } from 'vue-router';
import AASList from '@/components/AppNavigation/AASList.vue';
import ComponentVisualization from '@/components/ComponentVisualization.vue';
import SubmodelList from '@/components/SubmodelList.vue';
import { useAASHandling } from '@/composables/AAS/AASHandling';
import { useSMEHandling } from '@/composables/AAS/SMEHandling';
import { useRouteHandling } from '@/composables/routeHandling';
import AASEditor from '@/pages/AASEditor.vue';
import AASSubmodelViewer from '@/pages/AASSubmodelViewer.vue';
import AASViewer from '@/pages/AASViewer.vue';
import About from '@/pages/About.vue';
import Page404 from '@/pages/Page404.vue';
import SMEditor from '@/pages/SMEditor.vue';
import SMViewer from '@/pages/SMViewer.vue';
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
        path: '/aassmviewer',
        name: 'AASSubmodelViewer',
        component: AASSubmodelViewer,
        meta: { name: 'AAS Submodel Viewer', subtitle: 'Visualize Submodels of AAS' },
    },
    {
        path: '/smviewer',
        name: 'SMViewer',
        component: SMViewer,
        meta: { name: 'Submodel Viewer', subtitle: 'Visualize Submodels' },
    },
    {
        path: '/smeditor',
        name: 'SMEditor',
        component: SMEditor,
        meta: { name: 'SM Editor', subtitle: 'Edit Submodels' },
    },
    {
        path: '/about',
        name: 'About',
        component: About,
        meta: { name: 'About' },
    },
    { path: '/404', name: 'NotFound404', component: Page404, meta: { name: 'Page not found | 404' } },
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
    const { fetchAndDispatchAas, aasByEndpointHasSmeByPath } = useAASHandling();
    const { fetchAndDispatchSme } = useSMEHandling();
    const { idRedirectHandled } = useRouteHandling();

    // Data
    const routesStayOnPages: Array<RouteRecordNameGeneric> = ['About', 'NotFound404'];
    const routesForMobile: Array<RouteRecordNameGeneric> = ['AASList', 'SubmodelList', 'Visualization'];
    const routesForDesktop: Array<RouteRecordNameGeneric> = [
        'AASEditor',
        'AASViewer',
        'AASSubmodelViewer',
        'SMEditor',
        'SMViewer',
        'Visualization',
    ];
    const routesOnlyMobile: Array<RouteRecordNameGeneric> = routesForMobile.filter(
        (x) => !routesForDesktop.includes(x)
    );
    const routesOnlyDesktop: Array<RouteRecordNameGeneric> = routesForDesktop.filter(
        (x) => !routesForMobile.includes(x)
    );

    // const routesToSaveUrlQuery: Array<RouteRecordNameGeneric> = [...new Set([...routesForDesktop, ...routesForMobile])];
    // console.log('routesToSaveUrlQuery', routesToSaveUrlQuery);

    // const routesToLoadUrlQuery: Array<RouteRecordNameGeneric> = [...new Set([...routesForDesktop, ...routesForMobile])];
    // console.log('routesToLoadUrlQuery', routesToLoadUrlQuery);

    const routesUsingAasUrlQuery: Array<RouteRecordNameGeneric> = [
        'AASEditor', // just desktop
        'AASViewer', // just desktop
        'AASSubmodelViewer', // just desktop

        'AASList', // just mobile
        'SubmodelList', // just mobile

        'Visualization', // desktop and mobile
    ];
    const routesUsingPathUrlQuery: Array<RouteRecordNameGeneric> = [
        'AASEditor', // just desktop
        'AASViewer', // just desktop
        'AASSubmodelViewer', // just desktop
        'SMEditor', // just desktop
        'SMViewer', // just desktop

        'AASList', // just mobile
        'SubmodelList', // just mobile

        'Visualization', // desktop and mobile
    ];
    const routesUsingUrlQuery: Array<RouteRecordNameGeneric> = [
        ...new Set([...routesUsingAasUrlQuery, ...routesUsingPathUrlQuery]),
    ];

    const routesUsingOnlyPathUrlQuery: Array<RouteRecordNameGeneric> = routesUsingPathUrlQuery.filter(
        (x) => !routesUsingAasUrlQuery.includes(x)
    );
    const routesUsingOnlyAasUrlQuery: Array<RouteRecordNameGeneric> = routesUsingAasUrlQuery.filter(
        (x) => !routesUsingPathUrlQuery.includes(x)
    );

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
    const isMobile = computed(() => navigationStore.getIsMobile); // Check if the current device is a mobile device
    const allowEditing = computed(() => envStore.getAllowEditing); // Check if the current environment allows showing the AAS resp. SM Editor
    const smViewerEditor = computed(() => envStore.getSmViewerEditor); // Check the current environment allows showing the SM Viewer/Editor

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
        if (Object.hasOwn(from, 'name') && Object.hasOwn(to, 'name') && from.name === to.name) {
            // Just for routes using url query parameter and changed url query parameter
            if (routesUsingUrlQuery.includes(to.name) && from.query !== to.query) {
                // --> Save url query parameter
                if (Object.keys(to.query).length > 0) {
                    const queryToDispatch = _.cloneDeep(to.query);

                    // Take into account also possible previous saved url query parameter
                    const queryLoaded = navigationStore.getUrlQuery;
                    if (!Object.hasOwn(queryToDispatch, 'aas') && Object.hasOwn(queryLoaded, 'aas')) {
                        queryToDispatch.aas = queryLoaded.aas;
                    }
                    if (!Object.hasOwn(queryToDispatch, 'path') && Object.hasOwn(queryLoaded, 'path')) {
                        queryToDispatch.path = queryLoaded.path;
                    }

                    // Save url query parameter
                    navigationStore.dispatchUrlQuery(queryToDispatch);
                }
            }
        }

        // Switch from one route to another one
        if (Object.hasOwn(from, 'name') && Object.hasOwn(to, 'name') && from.name !== to.name) {
            // Just for switching FROM a route using url query parameter
            if (routesUsingUrlQuery.includes(from.name) || from.path.startsWith('/modules/')) {
                // --> Save url query parameter
                if (Object.keys(from.query).length > 0) {
                    const queryToDispatch = _.cloneDeep(from.query);

                    // Take into account also possible previous saved url query parameter
                    const queryLoaded = navigationStore.getUrlQuery;
                    if (!Object.hasOwn(queryToDispatch, 'aas') && Object.hasOwn(queryLoaded, 'aas')) {
                        queryToDispatch.aas = queryLoaded.aas;
                    }
                    if (!Object.hasOwn(queryToDispatch, 'path') && Object.hasOwn(queryLoaded, 'path')) {
                        queryToDispatch.path = queryLoaded.path;
                    }

                    // Save url query parameter
                    navigationStore.dispatchUrlQuery(queryToDispatch);
                }
            }
            // Just for switching TO a route using url query parameter
            if (routesUsingUrlQuery.includes(to.name) || to.path.startsWith('/modules/')) {
                // --> Load url query parameter
                if (!Object.hasOwn(to, 'query') || Object.keys(to.query).length === 0) {
                    const queryLoaded = navigationStore.getUrlQuery;

                    const updatedRoute = _.cloneDeep(to);
                    updatedRoute.query = {};

                    if (
                        routesUsingAasUrlQuery.includes(to.name) &&
                        Object.hasOwn(queryLoaded, 'aas') &&
                        (queryLoaded.aas as string).trim() !== ''
                    ) {
                        updatedRoute.query.aas = queryLoaded.aas;
                    }
                    if (
                        routesUsingPathUrlQuery.includes(to.name) &&
                        Object.hasOwn(queryLoaded, 'path') &&
                        (queryLoaded.path as string).trim() !== ''
                    ) {
                        updatedRoute.query.path = queryLoaded.path;
                    }

                    if (
                        routesUsingAasUrlQuery.includes(updatedRoute.name) &&
                        !Object.hasOwn(updatedRoute.query, 'aas') &&
                        Object.hasOwn(updatedRoute.query, 'path')
                    ) {
                        delete updatedRoute.query.path;
                    }

                    if (
                        routesUsingOnlyAasUrlQuery.includes(updatedRoute.name) &&
                        Object.hasOwn(updatedRoute.query, 'path')
                    ) {
                        delete updatedRoute.query.path;
                    }

                    if (
                        routesUsingOnlyPathUrlQuery.includes(updatedRoute.name) &&
                        Object.hasOwn(updatedRoute.query, 'aas')
                    ) {
                        delete updatedRoute.query.aas;
                    }

                    if (Object.keys(updatedRoute.query).length > 0) {
                        next(updatedRoute);
                        return;
                    }
                }
            }
        }

        // Delete not needed url query parameter
        if (
            routesUsingAasUrlQuery.includes(to.name) &&
            !Object.hasOwn(to.query, 'aas') &&
            Object.hasOwn(to.query, 'path')
        ) {
            // --> Delete path url query parameter
            const updatedRoute = _.cloneDeep(to);
            delete updatedRoute.query.path;
            next(updatedRoute);
            return;
        }

        if (routesUsingOnlyAasUrlQuery.includes(to.name) && Object.hasOwn(to.query, 'path')) {
            // --> Delete path url query parameter
            const updatedRoute = _.cloneDeep(to);
            delete updatedRoute.query.path;
            next(updatedRoute);
            return;
        }
        if (routesUsingOnlyPathUrlQuery.includes(to.name) && Object.hasOwn(to.query, 'aas')) {
            // --> Delete aas url query parameter
            const updatedRoute = _.cloneDeep(to);
            delete updatedRoute.query.aas;
            next(updatedRoute);
            return;
        }

        // Check if single AAS mode is on and no aas query is set to either redirect or show 404
        if (
            envStore.getSingleAas &&
            (routesUsingAasUrlQuery.includes(to.name) ||
                (to.path.includes('/modules/') && to.meta.isOnlyVisibleWithSelectedAas)) &&
            (!Object.hasOwn(to.query, 'aas') || (to.query.aas as string).trim() === '')
        ) {
            if (envStore.getSingleAasRedirect) {
                window.location.replace(envStore.getSingleAasRedirect);
                return;
            } else if (to.name !== 'NotFound404') {
                const updatedRoute = { name: 'NotFound404' };
                next(updatedRoute);
                return;
            }
        }

        if (routesToVisualization.includes(to.name)) {
            // General redirect to 'Visualization' with query
            const updatedRoute = { name: 'Visualization', query: to.query };
            next(updatedRoute);
            return;
        }
        // Handle mobile/desktop views
        else if (isMobile.value) {
            // Handle mobile views
            if (
                routesForMobile.includes(to.name) ||
                routesStayOnPages.includes(to.name) ||
                (to.path.includes('/modules/') && to.meta.isMobileModule)
            ) {
                // Do nothing
            } else if (
                routesOnlyDesktop.includes(to.name) ||
                (to.path.includes('/modules/') && !to.meta.isMobileModule)
            ) {
                // Redirect to 'AASList' with query
                const updatedRoute = { name: 'AASList', query: to.query };
                next(updatedRoute);
                return;
            }
        } else {
            // Handle desktop views
            if (
                routesForDesktop.includes(to.name) ||
                routesStayOnPages.includes(to.name) ||
                (to.path.includes('/modules/') && to.meta.isDesktopModule)
            ) {
                if (['SMViewer', 'SMEditor'].includes(to.name as string)) {
                    if (smViewerEditor.value && to.name === 'SMEditor' && !allowEditing.value) {
                        // Redirect to 'SMViewer' with query
                        const updatedRoute = { name: 'SMViewer', query: to.query };
                        next(updatedRoute);
                        return;
                    }
                    if (!smViewerEditor.value) {
                        // Redirect to 'AASViewer' resp. 'AASEditor' with query
                        const updatedRoute = { name: (to.name as string).replace('SM', 'AAS'), query: to.query };
                        next(updatedRoute);
                        return;
                    }
                }
                if (to.name === 'AASEditor' && !allowEditing.value) {
                    // Redirect to 'AASViewer' with query
                    const updatedRoute = { name: 'AASViewer', query: to.query };
                    next(updatedRoute);
                    return;
                }
                // Do nothing
            } else if (
                routesOnlyMobile.includes(to.name) ||
                (to.path.includes('/modules/') && !to.meta.isDesktopModule)
            ) {
                // Redirect to 'AASViewer' with query
                const updatedRoute = { name: 'AASViewer', query: to.query };
                next(updatedRoute);
                return;
            }
        }

        // Validate combination of specified aas and path url query parameter
        if (
            Object.hasOwn(to.query, 'aas') &&
            (to.query.aas as string).trim() !== '' &&
            Object.hasOwn(to.query, 'path') &&
            (to.query.path as string).trim() !== ''
        ) {
            const combinationAasPathIsOk = await aasByEndpointHasSmeByPath(
                (to.query.aas as string).trim(),
                (to.query.path as string).trim()
            );
            if (!combinationAasPathIsOk) {
                // Remove path query for not available SME path in AAS
                const updatedRoute = _.cloneDeep(to);
                delete updatedRoute.query.path;
                next(updatedRoute);
                return;
            }
        }

        // Fetch and dispatch AAS
        if (
            Object.hasOwn(to.query, 'aas') &&
            (to.query.aas as string).trim() !== '' &&
            (!aasStore.getSelectedAAS ||
                Object.keys(aasStore.getSelectedAAS).length === 0 ||
                !Object.hasOwn(from.query, 'aas') ||
                (Object.hasOwn(to.query, 'aas') &&
                    (from.query.aas as string).trim() !== (to.query.aas as string).trim()))
        ) {
            const aas = await fetchAndDispatchAas(to.query.aas as string);
            if (!aas || Object.keys(aas).length === 0) {
                // Remove aas query for not available AAS endpoint
                const updatedRoute = _.cloneDeep(to);
                delete updatedRoute.query.aas;
                next(updatedRoute);
                return;
            }
        } else if (!to.query.aas || to.query.aas === '') {
            aasStore.dispatchSelectedAAS({});
        }

        // Fetch and dispatch SM/SME
        if (
            Object.hasOwn(to.query, 'path') &&
            (to.query.path as string).trim() !== '' &&
            (!aasStore.getSelectedNode ||
                Object.keys(aasStore.getSelectedNode).length === 0 ||
                !Object.hasOwn(from.query, 'path') ||
                (Object.hasOwn(from.query, 'path') &&
                    (from.query.path as string).trim() !== (to.query.path as string).trim()))
        ) {
            const sme = await fetchAndDispatchSme(to.query.path as string, true);
            if (!sme || Object.keys(sme).length === 0) {
                // Remove path query for not available SME path
                const updatedRoute = _.cloneDeep(to);
                delete updatedRoute.query.path;
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
