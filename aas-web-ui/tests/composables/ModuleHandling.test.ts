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
  setEnvVariables: ref<Array<string>>([]),
  setInfrastructureEndpoints: ref<Array<string>>([]),
  hasAuthenticationCredentials: ref(false),
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
      isEndpointSet: (componentKey: string) => mockState.setInfrastructureEndpoints.value.includes(componentKey),
      get getHasAuthenticationCredentials () {
        return mockState.hasAuthenticationCredentials.value
      },
    }),
  }))

  vi.doMock('@/store/EnvironmentStore', () => ({
    useEnvStore: () => ({
      isEnvVariableSet: (envVariableName: string) => mockState.setEnvVariables.value.includes(envVariableName),
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
    mockState.setEnvVariables.value = []
    mockState.setInfrastructureEndpoints.value = []
    mockState.hasAuthenticationCredentials.value = false
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

  it('excludes a module when a required env variable is not set', async () => {
    mockState.setEnvVariables.value = []
    mockState.moduleRoutes.value = [
      createModuleRoute({
        path: '/modules/env',
        name: 'EnvModule',
        meta: {
          isDesktopModule: true,
          isMobileModule: true,
          isVisibleModule: true,
          needsEnvVariables: ['ENV_VARIABLE_NAME'],
        },
      }),
    ]

    const { useModuleHandling } = await importUseModuleHandling()
    const { determineFilteredAndOrderedModuleRoutes } = useModuleHandling()
    const filteredRoutes = determineFilteredAndOrderedModuleRoutes()

    expect(filteredRoutes).toHaveLength(0)
  })

  it('includes a module when all required env variables are set', async () => {
    mockState.setEnvVariables.value = ['ENV_VARIABLE_NAME']
    mockState.moduleRoutes.value = [
      createModuleRoute({
        path: '/modules/env',
        name: 'EnvModule',
        meta: {
          isDesktopModule: true,
          isMobileModule: true,
          isVisibleModule: true,
          needsEnvVariables: ['ENV_VARIABLE_NAME'],
        },
      }),
    ]

    const { useModuleHandling } = await importUseModuleHandling()
    const { determineFilteredAndOrderedModuleRoutes } = useModuleHandling()
    const filteredRoutes = determineFilteredAndOrderedModuleRoutes()

    expect(filteredRoutes).toHaveLength(1)
    expect(filteredRoutes[0].name).toBe('EnvModule')
  })

  it('excludes a module when a required infrastructure endpoint is not set', async () => {
    mockState.setInfrastructureEndpoints.value = []
    mockState.moduleRoutes.value = [
      createModuleRoute({
        path: '/modules/basyx-component-endpoint',
        name: 'BaSyxComponentEndpointModule',
        meta: {
          isDesktopModule: true,
          isMobileModule: true,
          isVisibleModule: true,
          needsInfrastructureEndpoints: ['AASRepo'],
        },
      }),
    ]

    const { useModuleHandling } = await importUseModuleHandling()
    const { determineFilteredAndOrderedModuleRoutes } = useModuleHandling()
    const filteredRoutes = determineFilteredAndOrderedModuleRoutes()

    expect(filteredRoutes).toHaveLength(0)
  })

  it('includes a module when all required infrastructure endpoints are set', async () => {
    mockState.setInfrastructureEndpoints.value = ['AASRepo']
    mockState.moduleRoutes.value = [
      createModuleRoute({
        path: '/modules/basyx-component-endpoint',
        name: 'BaSyxComponentEndpointModule',
        meta: {
          isDesktopModule: true,
          isMobileModule: true,
          isVisibleModule: true,
          needsInfrastructureEndpoints: ['AASRepo'],
        },
      }),
    ]

    const { useModuleHandling } = await importUseModuleHandling()
    const { determineFilteredAndOrderedModuleRoutes } = useModuleHandling()
    const filteredRoutes = determineFilteredAndOrderedModuleRoutes()

    expect(filteredRoutes).toHaveLength(1)
    expect(filteredRoutes[0].name).toBe('BaSyxComponentEndpointModule')
  })

  it('excludes a module when needsAuthentication is true and user is not authenticated', async () => {
    mockState.hasAuthenticationCredentials.value = false
    mockState.moduleRoutes.value = [
      createModuleRoute({
        path: '/modules/needs-auth',
        name: 'NeedsAuthModule',
        meta: {
          isDesktopModule: true,
          isMobileModule: true,
          isVisibleModule: true,
          needsAuthentication: true,
        },
      }),
    ]

    const { useModuleHandling } = await importUseModuleHandling()
    const { determineFilteredAndOrderedModuleRoutes } = useModuleHandling()
    const filteredRoutes = determineFilteredAndOrderedModuleRoutes()

    expect(filteredRoutes).toHaveLength(0)
  })

  it('includes a module when needsAuthentication is true and user is authenticated', async () => {
    mockState.hasAuthenticationCredentials.value = true
    mockState.moduleRoutes.value = [
      createModuleRoute({
        path: '/modules/needs-auth',
        name: 'NeedsAuthModule',
        meta: {
          isDesktopModule: true,
          isMobileModule: true,
          isVisibleModule: true,
          needsAuthentication: true,
        },
      }),
    ]

    const { useModuleHandling } = await importUseModuleHandling()
    const { determineFilteredAndOrderedModuleRoutes } = useModuleHandling()
    const filteredRoutes = determineFilteredAndOrderedModuleRoutes()

    expect(filteredRoutes).toHaveLength(1)
    expect(filteredRoutes[0].name).toBe('NeedsAuthModule')
  })

  it('includes a module when needsAuthentication is not set regardless of authentication state', async () => {
    mockState.hasAuthenticationCredentials.value = false
    mockState.moduleRoutes.value = [
      createModuleRoute({
        path: '/modules/no-auth-requirement',
        name: 'NoAuthRequirementModule',
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
    expect(filteredRoutes[0].name).toBe('NoAuthRequirementModule')
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
  describe('isModuleAvailable / isModuleVisible', () => {
    it('returns false for both checks when the module does not exist', async () => {
      const { useModuleHandling } = await importUseModuleHandling()
      const { isModuleAvailable, isModuleVisible } = useModuleHandling()

      expect(isModuleAvailable('UnknownModule')).toBe(false)
      expect(isModuleVisible('UnknownModule')).toBe(false)
    })

    it('returns true for both checks when the module has no restrictions', async () => {
      const { useModuleHandling } = await importUseModuleHandling()
      const { isModuleAvailable, isModuleVisible } = useModuleHandling()

      expect(isModuleAvailable('TestModule')).toBe(true)
      expect(isModuleVisible('TestModule')).toBe(true)
    })

    it('treats a hidden module as available but not visible', async () => {
      mockState.moduleRoutes.value = [
        createModuleRoute({
          path: '/modules/hidden',
          name: 'HiddenModule',
          meta: {
            isDesktopModule: true,
            isMobileModule: true,
            isVisibleModule: false,
          },
        }),
      ]

      const { useModuleHandling } = await importUseModuleHandling()
      const { isModuleAvailable, isModuleVisible } = useModuleHandling()

      expect(isModuleAvailable('HiddenModule')).toBe(true)
      expect(isModuleVisible('HiddenModule')).toBe(false)
    })

    it('treats a module restricted by visibleOnRoutes as available but not visible on other routes', async () => {
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
      const { isModuleAvailable, isModuleVisible } = useModuleHandling()

      expect(isModuleAvailable('RestrictedModule')).toBe(true)
      expect(isModuleVisible('RestrictedModule')).toBe(false)
    })

    it.each([
      ['device', { isMobileModule: true, isDesktopModule: false }],
      ['infrastructure template', { supportedInfrastructureTemplates: ['catena-x'] }],
      ['selected AAS', { isOnlyVisibleWithSelectedAas: true }],
      ['selected node', { isOnlyVisibleWithSelectedNode: true }],
      ['env variable', { needsEnvVariables: ['ENV_VARIABLE_NAME'] }],
      ['infrastructure endpoint', { needsInfrastructureEndpoints: ['AASRepo'] }],
      ['authentication', { needsAuthentication: true }],
    ])('returns false for both checks when the %s requirement is not met', async (_requirement, meta) => {
      mockState.moduleRoutes.value = [
        createModuleRoute({
          path: '/modules/target',
          name: 'TargetModule',
          meta: {
            isDesktopModule: true,
            isMobileModule: true,
            isVisibleModule: true,
            ...meta,
          } as ModuleNavigationRoute['meta'],
        }),
      ]

      const { useModuleHandling } = await importUseModuleHandling()
      const { isModuleAvailable, isModuleVisible } = useModuleHandling()

      expect(isModuleAvailable('TargetModule')).toBe(false)
      expect(isModuleVisible('TargetModule')).toBe(false)
    })

    it('reacts to store changes when wrapped in computed by callers', async () => {
      mockState.moduleRoutes.value = [
        createModuleRoute({
          path: '/modules/target',
          name: 'TargetModule',
          meta: {
            isDesktopModule: true,
            isMobileModule: true,
            isVisibleModule: true,
            isOnlyVisibleWithSelectedAas: true,
          },
        }),
      ]

      const { useModuleHandling } = await importUseModuleHandling()
      const { isModuleAvailable } = useModuleHandling()
      const canLinkToTargetModule = computed(() => isModuleAvailable('TargetModule'))

      expect(canLinkToTargetModule.value).toBe(false)

      mockState.selectedAas.value = { id: 'aas-1' }
      await nextTick()
      expect(canLinkToTargetModule.value).toBe(true)
    })
  })
})
