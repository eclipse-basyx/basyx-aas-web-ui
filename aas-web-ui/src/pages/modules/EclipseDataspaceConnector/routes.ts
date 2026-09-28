export default {
  children: [
    {
      path: 'assets',
      name: 'EDC Assets',
      component: () => import('@/pages/modules/EclipseDataspaceConnector/components/Assets/Assets.vue'),
      meta: {
        title: 'EDC Assets',
        icon: 'mdi-code-json',
      },
    },
    {
      path: 'policies',
      name: 'Policies',
      component: () => import('@/pages/modules/EclipseDataspaceConnector/components/Policies/Policies.vue'),
      meta: {
        title: 'Policies',
        icon: 'mdi-shield-check-outline',
      },
    },
    {
      path: 'contracts',
      name: 'Contracts',
      component: () => import('@/pages/modules/EclipseDataspaceConnector/components/Contracts/Contracts.vue'),
      meta: {
        title: 'Contracts',
        icon: 'mdi-file-sign',
      },
    },
    {
      path: 'catalog',
      name: 'Catalog',
      component: () => import('@/pages/modules/EclipseDataspaceConnector/components/Catalog/Catalog.vue'),
      meta: {
        title: 'Catalog',
        icon: 'mdi-database-outline',
      },
    },
  ],
}
