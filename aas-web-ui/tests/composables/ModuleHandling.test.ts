import type { ModuleNavigationRoute } from '@/types/Application'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, nextTick, reactive, ref } from 'vue'

function createModuleRoute (route: {
  path: string
  name: string
  meta: ModuleNavigationRoute['meta']
}): ModuleNavigationRoute {
  return route
}

const mockState = {
  route: reactive({
    path: '/aaseditor',
    name: 'AASEditor',
  }),
  isMobile: ref(false),
  moduleRoutes: ref<Array<ModuleNavigationRoute>>([]),
  selectedAas: ref<Record<string, unknown> | null>(null),
  selectedNode: ref<Record<string, unknown> | null>(null),
  selectedInfrastructure: ref<{ template: string } | null>({ template: 'full' }),
}

async function importUseModuleHandling () {
  vi.doMock('vue-router', async () => {
    const actual = await vi.importActual('vue-router')
    return {
      ...actual,
      useRoute: () => mockState.route,
    }
  })

  vi.doMock('@/store/NavigationStore', () => ({
    useNavigationStore: () => ({
      get getIsMobile () {
        return mockState.isMobile.value
      },
      get getModuleRoutes () {
        return mockState.moduleRoutes.value
      },
    }),
  }))

  vi.doMock('@/store/AASDataStore', () => ({
    useAASStore: () => ({
      get getSelectedAAS () {
        return mockState.selectedAas.value
      },
      get getSelectedNode () {
        return mockState.selectedNode.value
      },
    }),
  }))

  vi.doMock('@/store/InfrastructureStore', () => ({
    useInfrastructureStore: () => ({
      get getSelectedInfrastructure () {
        return mockState.selectedInfrastructure.value
      },
    }),
  }))

  return import('@/composables/ModuleHandling')
}

describe('ModuleHandling.ts', () => {
  beforeEach(() => {
    vi.resetModules()

    mockState.route.path = '/aaseditor'
    mockState.route.name = 'AASEditor'
    mockState.isMobile.value = false
    mockState.selectedAas.value = null
    mockState.selectedNode.value = null
    mockState.selectedInfrastructure.value = { template: 'full' }
    mockState.moduleRoutes.value = [
      createModuleRoute({
        path: '/modules/test-module',
        name: 'TestModule',
        meta: {
          isDesktopModule: true,
          isMobileModule: true,
          isVisibleModule: true,
        },
      }),
    ]
  })

  it('includes a module when current route is allowed by visibleOnRoutes', async () => {
    mockState.moduleRoutes.value = [
      createModuleRoute({
        path: '/modules/allowed',
        name: 'AllowedModule',
        meta: {
          isDesktopModule: true,
          isMobileModule: true,
          isVisibleModule: true,
          visibleOnRoutes: ['AASEditor', 'SMEditor'],
        },
      }),
    ]

    const { useModuleHandling } = await importUseModuleHandling()
    const { determineFilteredAndOrderedModuleRoutes } = useModuleHandling()
    const filteredRoutes = determineFilteredAndOrderedModuleRoutes()

    expect(filteredRoutes).toHaveLength(1)
    expect(filteredRoutes[0].name).toBe('AllowedModule')
  })

  it('excludes a module when current route is not in visibleOnRoutes', async () => {
    mockState.moduleRoutes.value = [
      createModuleRoute({
        path: '/modules/restricted',
        name: 'RestrictedModule',
        meta: {
          isDesktopModule: true,
          isMobileModule: true,
          isVisibleModule: true,
          visibleOnRoutes: ['SMEditor'],
        },
      }),
    ]

    const { useModuleHandling } = await importUseModuleHandling()
    const { determineFilteredAndOrderedModuleRoutes } = useModuleHandling()
    const filteredRoutes = determineFilteredAndOrderedModuleRoutes()

    expect(filteredRoutes).toHaveLength(0)
  })

  it('includes modules without explicit infrastructure template restrictions', async () => {
    mockState.selectedInfrastructure.value = { template: 'catena-x' }
    mockState.moduleRoutes.value = [
      createModuleRoute({
        path: '/modules/default-all',
        name: 'DefaultAllModule',
        meta: {
          isDesktopModule: true,
          isMobileModule: true,
          isVisibleModule: true,
        },
      }),
    ]

    const { useModuleHandling } = await importUseModuleHandling()
    const { determineFilteredAndOrderedModuleRoutes } = useModuleHandling()
    const filteredRoutes = determineFilteredAndOrderedModuleRoutes()

    expect(filteredRoutes).toHaveLength(1)
    expect(filteredRoutes[0].name).toBe('DefaultAllModule')
  })

  it('excludes a module when selected infrastructure template is unsupported', async () => {
    mockState.selectedInfrastructure.value = { template: 'catena-x' }
    mockState.moduleRoutes.value = [
      createModuleRoute({
        path: '/modules/write-heavy',
        name: 'WriteHeavyModule',
        meta: {
          isDesktopModule: true,
          isMobileModule: true,
          isVisibleModule: true,
          supportedInfrastructureTemplates: ['full', 'mono-all'],
        },
      }),
    ]

    const { useModuleHandling } = await importUseModuleHandling()
    const { determineFilteredAndOrderedModuleRoutes } = useModuleHandling()
    const filteredRoutes = determineFilteredAndOrderedModuleRoutes()

    expect(filteredRoutes).toHaveLength(0)
  })

  it('includes a module when selected infrastructure template is supported', async () => {
    mockState.selectedInfrastructure.value = { template: 'mono-all' }
    mockState.moduleRoutes.value = [
      createModuleRoute({
        path: '/modules/write-heavy',
        name: 'WriteHeavyModule',
        meta: {
          isDesktopModule: true,
          isMobileModule: true,
          isVisibleModule: true,
          supportedInfrastructureTemplates: ['full', 'mono-all'],
        },
      }),
    ]

    const { useModuleHandling } = await importUseModuleHandling()
    const { determineFilteredAndOrderedModuleRoutes } = useModuleHandling()
    const filteredRoutes = determineFilteredAndOrderedModuleRoutes()

    expect(filteredRoutes).toHaveLength(1)
    expect(filteredRoutes[0].name).toBe('WriteHeavyModule')
  })

  it('reacts to route name and store changes when wrapped in computed by callers', async () => {
    mockState.moduleRoutes.value = [
      createModuleRoute({
        path: '/modules/reactive',
        name: 'ReactiveModule',
        meta: {
          isDesktopModule: true,
          isMobileModule: false,
          isVisibleModule: true,
          isOnlyVisibleWithSelectedAas: true,
          visibleOnRoutes: ['AASEditor'],
        },
      }),
    ]

    const { useModuleHandling } = await importUseModuleHandling()
    const { determineFilteredAndOrderedModuleRoutes } = useModuleHandling()
    const filteredRoutes = computed(() => determineFilteredAndOrderedModuleRoutes())

    expect(filteredRoutes.value).toHaveLength(0)

    mockState.selectedAas.value = { id: 'aas-1' }
    await nextTick()
    expect(filteredRoutes.value).toHaveLength(1)

    mockState.route.name = 'SMEditor'
    await nextTick()
    expect(filteredRoutes.value).toHaveLength(0)

    mockState.route.name = 'AASEditor'
    mockState.isMobile.value = true
    await nextTick()
    expect(filteredRoutes.value).toHaveLength(0)

    mockState.isMobile.value = false
    await nextTick()
    expect(filteredRoutes.value).toHaveLength(1)
  })
})
