export default {
  children: [
    {
      path: 'edc',
      name: 'EDC',
      component: () => import('@/pages/modules/EclipseDataspaceConnector/components/EDC.vue'),
      meta: {
        title: 'EDC',
        icon: 'custom:edcIcon',
      },
    },
    {
      path: 'policies',
      name: 'Policies',
      component: () => import('@/pages/modules/EclipseDataspaceConnector/components/Policies.vue'),
      meta: {
        title: 'Policies',
        icon: 'mdi-file-sign',
      },
    },
    {
      path: 'assets',
      name: 'Assets',
      component: () => import('@/pages/modules/EclipseDataspaceConnector/components/Assets.vue'),
      meta: {
        title: 'Assets',
        icon: 'mdi-code-json',
      },
    },
    {
      path: 'catalogue',
      name: 'Catalogue',
      component: () => import('@/pages/modules/EclipseDataspaceConnector/components/Catalogue.vue'),
      meta: {
        title: 'Catalogue',
        icon: 'mdi-list-box-outline',
      },
    },
    {
      path: 'configuration',
      name: 'Configuration',
      component: () => import('@/pages/modules/EclipseDataspaceConnector/components/Configuration.vue'),
      meta: {
        title: 'Configuration',
        icon: 'mdi-cog',
      },
    },
  ],
}
