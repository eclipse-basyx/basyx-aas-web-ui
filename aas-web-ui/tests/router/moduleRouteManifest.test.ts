import { describe, expect, it } from 'vitest'
import { defineComponent } from 'vue'
import { createMemoryHistory, createRouter, type RouteRecordRaw } from 'vue-router'
import CompanyDescriptorViewer from '@/pages/modules/CompanyDescriptorViewer/index.vue'
import {
  buildModuleRouteMeta,
  buildValidatedModuleChildRoutes,
  type ModuleRouteMeta,
} from '../../src/utils/ModuleRouteUtils'

const DummyView = defineComponent({
  name: 'DummyView',
  template: '<div />',
})

describe('module manifest child routes', () => {
  it('creates prefixed child route names and inherits module meta defaults', () => {
    const children = buildValidatedModuleChildRoutes(
      'Dpp',
      '/modules/dpp',
      {
        isDesktopModule: true,
        isMobileModule: false,
        isVisibleModule: true,
        isOnlyVisibleWithSelectedAas: true,
        isOnlyVisibleWithSelectedNode: false,
        needsInfrastructureEndpoints: ['CompanyLookup'],
        needsEnvVariables: ['COMPANY_LOOKUP_DOMAIN'],
        supportedInfrastructureTemplates: ['full', 'mono-all'],
        preserveRouteQuery: true,
      },
      {
        children: [
          {
            path: 'technical-data',
            name: 'TechnicalData',
            component: DummyView,
          },
        ],
      },
    )

    expect(children).toHaveLength(1)
    expect(children[0].path).toBe('technical-data')
    expect(children[0].name).toBe('Dpp__TechnicalData')
    expect(children[0].meta?.isDesktopModule).toBe(true)
    expect(children[0].meta?.isOnlyVisibleWithSelectedAas).toBe(true)
    expect(children[0].meta?.needsInfrastructureEndpoints).toEqual(['CompanyLookup'])
    expect(children[0].meta?.needsEnvVariables).toEqual(['COMPANY_LOOKUP_DOMAIN'])
    expect(children[0].meta?.supportedInfrastructureTemplates).toEqual(['full', 'mono-all'])
    expect(children[0].meta?.preserveRouteQuery).toBe(true)
  })

  it('copies readiness prerequisites from module options into generated route metadata', () => {
    const routeMeta = buildModuleRouteMeta(
      'CompanyDescriptorViewer',
      CompanyDescriptorViewer as unknown as ModuleRouteMeta,
    )

    expect(routeMeta.needsInfrastructureEndpoints).toEqual(['CompanyLookup'])
    expect(routeMeta.needsEnvVariables).toEqual(['COMPANY_LOOKUP_DOMAIN'])
  })

  it('keeps child-specific preserveRouteQuery override', () => {
    const children = buildValidatedModuleChildRoutes(
      'Dpp',
      '/modules/dpp',
      {
        preserveRouteQuery: true,
      },
      {
        children: [
          {
            path: 'materials',
            component: DummyView,
            meta: {
              preserveRouteQuery: false,
            },
          },
        ],
      },
    )

    expect(children).toHaveLength(1)
    expect(children[0].meta?.preserveRouteQuery).toBe(false)
  })

  it('rejects child routes that escape module namespace', () => {
    const children = buildValidatedModuleChildRoutes(
      'Dpp',
      '/modules/dpp',
      {
        preserveRouteQuery: false,
      },
      {
        children: [
          {
            path: '/outside',
            component: DummyView,
          },
          {
            path: '../outside',
            component: DummyView,
          },
          {
            path: 'allowed',
            component: DummyView,
          },
        ],
      },
    )

    expect(children).toHaveLength(1)
    expect(children[0].path).toBe('allowed')
  })

  it('supports deep-link matching for module child routes', async () => {
    const children = buildValidatedModuleChildRoutes(
      'Dpp',
      '/modules/dpp',
      {
        preserveRouteQuery: true,
      },
      {
        children: [
          {
            path: 'technical-data',
            name: 'TechnicalData',
            component: DummyView,
          },
        ],
      },
    )

    const routes: Array<RouteRecordRaw> = [
      {
        path: '/modules/dpp',
        name: 'Dpp',
        component: DummyView,
        children,
      },
    ]

    const router = createRouter({
      history: createMemoryHistory(),
      routes,
    })

    await router.push('/modules/dpp/technical-data')

    expect(router.currentRoute.value.name).toBe('Dpp__TechnicalData')
    expect(router.currentRoute.value.path).toBe('/modules/dpp/technical-data')
  })
})
