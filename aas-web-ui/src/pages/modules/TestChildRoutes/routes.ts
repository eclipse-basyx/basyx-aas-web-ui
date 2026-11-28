export default {
  children: [
    {
      // Inherits all requirements of the TestChildRoutes module
      path: 'inherited',
      name: 'Inherited',
      component: () => import('@/pages/modules/TestChildRoutes/Child.vue'),
      meta: {
        title: 'Inherited Requirements',
      },
    },
    {
      // Overrides the supported infrastructure templates of the TestChildRoutes module
      path: 'full-only',
      name: 'FullOnly',
      component: () => import('@/pages/modules/TestChildRoutes/Child.vue'),
      meta: {
        title: 'Only Full Infrastructure',
        supportedInfrastructureTemplates: ['full'],
      },
    },
  ],
}
