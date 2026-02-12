import type { InfrastructureConfig } from '@/types/Infrastructure';
import type { LocationQueryRaw, Router, RouteRecordNameGeneric, RouteRecordRaw } from 'vue-router';
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
import { useInfrastructureStore } from '@/store/InfrastructureStore';
import { useNavigationStore } from '@/store/NavigationStore';
import {
    buildValidatedModuleChildRoutes,
    type ModuleRouteManifest,
    type ModuleRouteMeta,
} from '@/utils/ModuleRouteUtils';

type ModuleComponentExport = {
    default?: ModuleRouteMeta;
};

type ModuleDefinition = {
    moduleName: string;
    moduleLoader: () => Promise<unknown>;
    moduleManifest?: ModuleRouteManifest;
};

const findRouteByName = (records: Array<RouteRecordRaw>, name: string): RouteRecordRaw | undefined => {
    for (const record of records) {
        if (record.name?.toString() === name) return record;
        if (record.children && record.children.length > 0) {
            const nestedRecord = findRouteByName(record.children as Array<RouteRecordRaw>, name);
            if (nestedRecord) return nestedRecord;
        }
    }
    return undefined;
};

const findRouteByNameCaseInsensitive = (records: Array<RouteRecordRaw>, name: string): RouteRecordRaw | undefined => {
    const lowerName = name.toLowerCase();
    for (const record of records) {
        if (record.name?.toString().toLowerCase() === lowerName) return record;
        if (record.children && record.children.length > 0) {
            const nestedRecord = findRouteByNameCaseInsensitive(record.children as Array<RouteRecordRaw>, name);
            if (nestedRecord) return nestedRecord;
        }
    }
    return undefined;
};

// Static routes
const staticRoutes: Array<RouteRecordRaw> = [
    {
        path: '/aasviewer',
        name: 'AASViewer',
        component: AASViewer,
        meta: { name: 'AAS Viewer', subtitle: 'Visualize Asset Administration Shells' },
    },
    {
        path: '/',
        name: 'Root',
        component: Page404,
        meta: { name: 'Page not found | 404' },
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
    const moduleFolderIndexFileRecords = import.meta.glob('@/pages/modules/*/index.vue');
    const moduleManifestFileRecords = import.meta.glob('@/pages/modules/*.routes.ts', { eager: true });
    const moduleFolderManifestFileRecords = import.meta.glob('@/pages/modules/*/routes.ts', { eager: true });

    const moduleRoutes: Array<RouteRecordRaw> = [];
    const moduleDefinitionsByName = new Map<string, ModuleDefinition>();

    for (const path in moduleFileRecords) {
        const moduleName = path.split('/').pop()?.replace('.vue', '') || 'UnnamedModule';
        const manifestPath = path.replace(/\.vue$/, '.routes.ts');
        const moduleManifestRecord = moduleManifestFileRecords[manifestPath] as { default?: ModuleRouteManifest };

        moduleDefinitionsByName.set(moduleName, {
            moduleName,
            moduleLoader: moduleFileRecords[path] as () => Promise<unknown>,
            moduleManifest: moduleManifestRecord?.default,
        });
    }

    for (const path in moduleFolderIndexFileRecords) {
        const moduleName = path.split('/').slice(-2, -1)[0] || 'UnnamedModule';
        const manifestPath = path.replace(/\/index\.vue$/, '/routes.ts');
        const moduleManifestRecord = moduleFolderManifestFileRecords[manifestPath] as { default?: ModuleRouteManifest };

        moduleDefinitionsByName.set(moduleName, {
            moduleName,
            moduleLoader: moduleFolderIndexFileRecords[path] as () => Promise<unknown>,
            moduleManifest: moduleManifestRecord?.default,
        });
    }

    for (const moduleDefinition of moduleDefinitionsByName.values()) {
        const moduleName = moduleDefinition.moduleName;
        const moduleComponent = (await moduleDefinition.moduleLoader()) as ModuleComponentExport;
        const moduleManifest = moduleDefinition.moduleManifest;

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

        const parentMeta: ModuleRouteMeta = {
            name: moduleName,
            title: moduleTitle,
            subtitle: 'Module',
            isDesktopModule: isDesktopModule,
            isMobileModule: isMobileModule,
            isVisibleModule: isVisibleModule,
            isOnlyVisibleWithSelectedAas: isOnlyVisibleWithSelectedAas,
            isOnlyVisibleWithSelectedNode: isOnlyVisibleWithSelectedNode,
            preserveRouteQuery: preserveRouteQuery,
        };

        const moduleChildren = buildValidatedModuleChildRoutes(moduleName, routePath, parentMeta, moduleManifest);

        moduleRoutes.push({
            path: routePath,
            name: moduleName,
            meta: parentMeta,
            // Lazy-load the component
            component: moduleDefinition.moduleLoader,
            children: moduleChildren,
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
    const infrastructureStore = useInfrastructureStore();

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
    const routesUsingAasOrPathUrlQuery: Array<RouteRecordNameGeneric> = [
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

    let infrastructureInitializationEnsured = false;

    const tryResolveRouteByName = (name: string): RouteRecordRaw | undefined => {
        const direct = findRouteByName(routes, name);
        if (direct) return direct;

        return findRouteByNameCaseInsensitive(routes, name);
    };

    const resolveStartRouteName = (query?: Record<string, unknown>): string => {
        const configured = envStore.getStartPageRouteName;
        const desired = configured && configured.trim() !== '' ? configured.trim() : 'AASViewer';

        // Prevent accidental loops
        if (desired === 'Root') return 'AASViewer';

        const record = tryResolveRouteByName(desired);
        if (!record) return 'AASViewer';

        // Feature flag gating
        if (record.name === 'AASEditor' && !envStore.getAllowEditing) return 'AASViewer';
        if ((record.name === 'SMViewer' || record.name === 'SMEditor') && !envStore.getSmViewerEditor)
            return 'AASViewer';
        if (record.name === 'SMEditor' && !envStore.getAllowEditing) return 'AASViewer';

        // Module constraints / visibility
        const meta = (record.meta || {}) as Record<string, unknown>;
        if (meta.isVisibleModule === false) return 'AASViewer';
        if (meta.isOnlyVisibleWithSelectedAas && (!query || !Object.hasOwn(query, 'aas') || !String(query.aas).trim()))
            return 'AASViewer';
        if (
            meta.isOnlyVisibleWithSelectedNode &&
            (!query || !Object.hasOwn(query, 'path') || !String(query.path).trim())
        )
            return 'AASViewer';

        return record.name?.toString() || 'AASViewer';
    };

    router.beforeEach(async (to, from, next) => {
        if (!infrastructureInitializationEnsured) {
            await infrastructureStore.waitForInitialization();
            infrastructureInitializationEnsured = true;
        }

        // Handle OAuth2 callback (state + code in URL)
        if (to.query.state && to.query.code) {
            const state = to.query.state as string;
            const code = to.query.code as string;
            const issuerURL = to.query.iss as string;

            // Try to handle OAuth2 callback
            try {
                const { exchangeOAuth2AuthorizationCode } = await import('@/composables/Auth/OAuth2Auth');
                const infraStore = useInfrastructureStore();

                // Wait for infrastructure store to finish loading
                await infraStore.waitForInitialization();

                // Find the infrastructure by state (infrastructure ID)
                const infrastructure = infraStore.getInfrastructures.find(
                    (infra: InfrastructureConfig) => infra.id === state
                );

                if (!infrastructure || !infrastructure.auth?.oauth2) {
                    throw new Error(`Infrastructure with ID '${state}' not found or missing OAuth2 config`);
                }

                // Get issuer URL from infrastructure config if not in query params
                const issuer = issuerURL || infrastructure.auth.oauth2.host;
                if (!issuer) {
                    throw new Error('OAuth2 issuer URL not found in callback or infrastructure config');
                }

                // Validate issuer URL format
                try {
                    const issuerUrl = new URL(issuer);
                    if (!['http:', 'https:'].includes(issuerUrl.protocol)) {
                        throw new Error(`Invalid issuer URL protocol: ${issuerUrl.protocol}. Must be http: or https:`);
                    }
                } catch (error) {
                    if (error instanceof TypeError) {
                        throw new Error(`Invalid issuer URL format: ${issuer}. Must be a valid HTTP(S) URL.`, {
                            cause: error,
                        });
                    }
                    throw error;
                }

                // Fetch .well-known configuration to get token endpoint
                const wellKnownUrl = `${issuer}/.well-known/openid-configuration`;
                let tokenEndpoint;

                try {
                    const wellKnownResponse = await fetch(wellKnownUrl);

                    if (wellKnownResponse.ok) {
                        const wellKnownConfig = await wellKnownResponse.json();
                        tokenEndpoint = wellKnownConfig.token_endpoint;
                    }
                } catch (error) {
                    console.warn('[OAuth2 Callback] Failed to fetch .well-known configuration, using fallback', error);
                }

                // Fallback to issuer + /token if well-known config is not available
                if (!tokenEndpoint) {
                    const normalizedIssuer = issuer.endsWith('/') ? issuer.slice(0, -1) : issuer;
                    tokenEndpoint = `${normalizedIssuer}/token`;
                }

                // Normalize redirect URI (remove trailing slash for root path)
                const pathname = window.location.pathname;
                const redirectUri = `${window.location.origin}${pathname}`;

                // Exchange authorization code for tokens
                const tokenData = await exchangeOAuth2AuthorizationCode({
                    tokenEndpoint,
                    clientId: infrastructure.auth.oauth2.clientId,
                    redirectUri,
                    code,
                    state, // Pass state to retrieve correct code verifier
                });

                // Update infrastructure with token
                infrastructure.token = {
                    accessToken: tokenData.accessToken,
                    refreshToken: tokenData.refreshToken,
                    expiresAt: tokenData.expiresAt,
                    idToken: tokenData.idToken,
                };

                // Save updated infrastructure
                infraStore.dispatchUpdateInfrastructure(infrastructure);
                // Set authentication status to true
                infraStore.setAuthenticationStatusForInfrastructure(infrastructure.id, true);

                // Show success notification
                navigationStore.dispatchSnackbar({
                    status: true,
                    timeout: 3000,
                    color: 'success',
                    btnColor: 'buttonText',
                    text: 'OAuth2 authentication successful!',
                });

                // Clean up URL and redirect to home
                next({ name: resolveStartRouteName(), replace: true });
                return;
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'OAuth2 authentication failed';
                console.error('[OAuth2 Callback] Failed:', errorMessage, error);
                // Show error notification
                navigationStore.dispatchSnackbar({
                    status: true,
                    timeout: 10000,
                    color: 'error',
                    btnColor: 'buttonText',
                    text: 'OAuth2 authentication failed',
                    extendedError: errorMessage,
                });

                // Clean up URL and redirect to home
                next({ name: resolveStartRouteName(), replace: true });
                return;
            }
        }

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

        // Root ("/") must redirect on initial load, but must show 404 when navigated to within the SPA.
        // - Initial load: from has no matches
        // - In-app navigation: allow the Root route component (404) to render
        if (to.path === '/' && from.matched.length === 0) {
            const startRouteName = resolveStartRouteName(to.query as Record<string, unknown>);
            next({ name: startRouteName, query: to.query, replace: true });
            return;
        }

        // Same route
        if (Object.hasOwn(from, 'name') && Object.hasOwn(to, 'name') && from.name === to.name) {
            if (from.query !== to.query && Object.keys(to.query).length > 0) {
                // --> Save url query parameter

                const queryToDispatch = { ...to.query };
                const queryLoaded = navigationStore.getUrlQuery;

                if (routesUsingAasOrPathUrlQuery.includes(to.name)) {
                    // Just for routes using url query parameter and changed url query parameter

                    // Take into account also possible previous saved url query parameter
                    if (!Object.hasOwn(queryToDispatch, 'aas') && Object.hasOwn(queryLoaded, 'aas')) {
                        queryToDispatch.aas = queryLoaded.aas;
                    }
                    if (!Object.hasOwn(queryToDispatch, 'path') && Object.hasOwn(queryLoaded, 'path')) {
                        queryToDispatch.path = queryLoaded.path;
                    }
                    if (
                        !Object.hasOwn(queryToDispatch, 'ignorePreConfAuth') &&
                        Object.hasOwn(queryLoaded, 'ignorePreConfAuth')
                    ) {
                        queryToDispatch.ignorePreConfAuth = queryLoaded.ignorePreConfAuth;
                    }

                    // Save url query parameter
                    navigationStore.dispatchUrlQuery(queryToDispatch);
                } else if (
                    !Object.hasOwn(queryToDispatch, 'ignorePreConfAuth') &&
                    Object.hasOwn(queryLoaded, 'ignorePreConfAuth')
                ) {
                    // For all other routes

                    // Take into account also possible previous saved url query parameter
                    queryToDispatch.ignorePreConfAuth = queryLoaded.ignorePreConfAuth;

                    // Save url query parameter
                    navigationStore.dispatchUrlQuery(queryToDispatch);
                }
            }
        }

        // Switch from one route to another one
        if (Object.hasOwn(from, 'name') && Object.hasOwn(to, 'name') && from.name !== to.name) {
            if (Object.keys(from.query).length > 0) {
                // --> Save url query parameter

                const queryToDispatch = { ...from.query };
                const queryLoaded = navigationStore.getUrlQuery;

                if (routesUsingAasOrPathUrlQuery.includes(from.name) || from.path.startsWith('/modules/')) {
                    // Just for switching FROM a route using url query parameter

                    // Take into account also possible previous saved url query parameter
                    if (!Object.hasOwn(queryToDispatch, 'aas') && Object.hasOwn(queryLoaded, 'aas')) {
                        queryToDispatch.aas = queryLoaded.aas;
                    }
                    if (!Object.hasOwn(queryToDispatch, 'path') && Object.hasOwn(queryLoaded, 'path')) {
                        queryToDispatch.path = queryLoaded.path;
                    }
                    if (
                        !Object.hasOwn(queryToDispatch, 'ignorePreConfAuth') &&
                        Object.hasOwn(queryLoaded, 'ignorePreConfAuth')
                    ) {
                        queryToDispatch.ignorePreConfAuth = queryLoaded.ignorePreConfAuth;
                    }

                    // Save url query parameter
                    navigationStore.dispatchUrlQuery(queryToDispatch);
                } else if (
                    !Object.hasOwn(queryToDispatch, 'ignorePreConfAuth') &&
                    Object.hasOwn(queryLoaded, 'ignorePreConfAuth')
                ) {
                    // For all other routes

                    // Take into account also possible previous saved url query parameter
                    queryToDispatch.ignorePreConfAuth = queryLoaded.ignorePreConfAuth;

                    // Save url query parameter
                    navigationStore.dispatchUrlQuery(queryToDispatch);
                }
            }
            if (!Object.hasOwn(to, 'query') || Object.keys(to.query).length === 0) {
                // --> Load url query parameter

                const queryLoaded = navigationStore.getUrlQuery;
                const updatedRoute = { path: to.path, name: to.name, query: {} as LocationQueryRaw };

                if (routesUsingAasOrPathUrlQuery.includes(to.name) || to.path.startsWith('/modules/')) {
                    // Just for switching TO a route using url query parameter

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
                    if (Object.hasOwn(queryLoaded, 'ignorePreConfAuth')) {
                        updatedRoute.query.ignorePreConfAuth = queryLoaded.ignorePreConfAuth;
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
                } else if (Object.hasOwn(queryLoaded, 'ignorePreConfAuth')) {
                    // For all other routes

                    updatedRoute.query.ignorePreConfAuth = queryLoaded.ignorePreConfAuth;

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
            const query = { ...to.query };
            delete query.path;
            const updatedRoute = { path: to.path, query };
            next(updatedRoute);
            return;
        }

        if (routesUsingOnlyAasUrlQuery.includes(to.name) && Object.hasOwn(to.query, 'path')) {
            // --> Delete path url query parameter
            const query = { ...to.query };
            delete query.path;
            const updatedRoute = { path: to.path, query };
            next(updatedRoute);
            return;
        }
        if (routesUsingOnlyPathUrlQuery.includes(to.name) && Object.hasOwn(to.query, 'aas')) {
            // --> Delete aas url query parameter
            const query = { ...to.query };
            delete query.aas;
            const updatedRoute = { path: to.path, query };
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
                const query = { ...to.query };
                delete query.path;
                const updatedRoute = { path: to.path, query };
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
                const query = { ...to.query };
                delete query.aas;
                const updatedRoute = { path: to.path, query };
                next(updatedRoute);
                return;
            }
        } else if (!to.query.aas || to.query.aas === '') {
            aasStore.dispatchSelectedAAS({});
        }

        // Fetch and dispatch SM/SME
        // Track the fetched SME to use for semanticId check (avoids timing issues with store reactivity)
        let fetchedSme: Record<string, unknown> | null = null;
        if (
            Object.hasOwn(to.query, 'path') &&
            (to.query.path as string).trim() !== '' &&
            (!aasStore.getSelectedNode ||
                Object.keys(aasStore.getSelectedNode).length === 0 ||
                !Object.hasOwn(from.query, 'path') ||
                (Object.hasOwn(from.query, 'path') &&
                    (from.query.path as string).trim() !== (to.query.path as string).trim()))
        ) {
            fetchedSme = await fetchAndDispatchSme(to.query.path as string, true);
            if (!fetchedSme || Object.keys(fetchedSme).length === 0) {
                // Remove path query for not available SME path
                const query = { ...to.query };
                delete query.path;
                const updatedRoute = { path: to.path, query };
                next(updatedRoute);
                return;
            }
        } else if (!to.query.path || to.query.path === '') {
            aasStore.dispatchSelectedNode({});
        }

        // Clean up non-core query params when node/AAS changes
        // This ensures plugin-specific params (like filePath) don't persist when switching context
        // Note: We do NOT clean up on initial load because:
        // 1. The user might have bookmarked or shared a URL with plugin-specific params
        // 2. Plugin components haven't loaded yet to register their params
        const pathChanged =
            Object.hasOwn(from.query, 'path') &&
            Object.hasOwn(to.query, 'path') &&
            (from.query.path as string).trim() !== (to.query.path as string).trim();
        const aasChanged =
            Object.hasOwn(from.query, 'aas') &&
            Object.hasOwn(to.query, 'aas') &&
            (from.query.aas as string).trim() !== (to.query.aas as string).trim();

        if (pathChanged || aasChanged) {
            // Get the currently selected node
            // Use the freshly fetched SME if available (avoids timing issues with Pinia store on initial load)
            // Otherwise fall back to the store value
            const selectedNode = fetchedSme || aasStore.getSelectedNode;

            // Filter query params based on what's allowed for this node's semanticId
            // Note: view=Visualization is handled by the filtering - if a plugin registered
            // its params for its semanticId, they'll be allowed when that semanticId is selected
            const { filteredQuery, removedParams } = navigationStore.filterQueryParams(to.query, selectedNode);

            if (removedParams.length > 0) {
                // Redirect with cleaned query params
                const updatedRoute = { path: to.path, query: filteredQuery };
                next(updatedRoute);
                return;
            }
        }

        next();
    });

    return router;
}
