export default {
  children: [
    {
      path: 'pcf',
      name: 'PCF',
      component: () => import('@/pages/modules/DPPDemo/Pcf.vue'),
      meta: {
        title: 'DPP Product Carbon Footprint',
      },
    },
  ],
}
