export default {
    children: [
        {
            path: 'overview',
            name: 'Overview',
            component: () => import('@/pages/modules/ModuleRoutingShowcase/Overview.vue'),
            meta: {
                title: 'Module Overview',
            },
        },
        {
            path: 'details',
            name: 'Details',
            component: () => import('@/pages/modules/ModuleRoutingShowcase/Details.vue'),
            meta: {
                title: 'Module Details',
            },
        },
    ],
};
