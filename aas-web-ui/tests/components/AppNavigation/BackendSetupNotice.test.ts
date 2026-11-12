import type { BaSyxComponentKey, ComponentConnectionState } from '@/types/BaSyx'
import type { InfrastructureConfig } from '@/types/Infrastructure'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, reactive } from 'vue'
import BackendSetupNotice from '@/components/AppNavigation/BackendSetupNotice.vue'
import { useBackendSetupNotice } from '@/composables/Infrastructure/useBackendSetupNotice'
import { BASYX_COMPONENT_KEYS } from '@/utils/InfrastructureUtils'

const mocks = vi.hoisted(() => ({
  infrastructure: null as unknown as ReturnType<typeof createInfrastructureState>,
  environment: null as unknown as ReturnType<typeof createEnvironmentState>,
  aas: null as unknown as ReturnType<typeof createAasState>,
  route: null as unknown as ReturnType<typeof createRoute>,
  reloadAasList: vi.fn(),
  reloadTreeview: vi.fn(),
}))

vi.mock('vue-router', () => ({ useRoute: () => mocks.route }))
vi.mock('@/store/InfrastructureStore', () => ({ useInfrastructureStore: () => mocks.infrastructure }))
vi.mock('@/store/EnvironmentStore', () => ({ useEnvStore: () => mocks.environment }))
vi.mock('@/store/AASDataStore', () => ({ useAASStore: () => mocks.aas }))
vi.mock('@/store/NavigationStore', () => ({ useNavigationStore: () => ({
  getIsMobile: false,
  dispatchTriggerAASListReload: mocks.reloadAasList,
  dispatchTriggerTreeviewReload: mocks.reloadTreeview,
}) }))
vi.mock('@/components/AppNavigation/Settings/InfrastructureManagement.vue', () => ({
  default: {
    props: { open: Boolean, editSelected: Boolean },
    emits: ['update:open'],
    template: '<div v-if="open" role="dialog" :data-edit-selected="String(editSelected)"><button @click="$emit(\'update:open\', false)">Close infrastructures</button></div>',
  },
}))

// Mirrors the backendDataSource meta of the application routes.
const ROUTE_DATA_SOURCES: Record<string, 'aas' | 'submodel'> = {
  AASViewer: 'aas',
  AASEditor: 'aas',
  AASSubmodelViewer: 'aas',
  AASList: 'aas',
  SubmodelList: 'aas',
  ComponentVisualization: 'aas',
  Visualization: 'aas',
  SMViewer: 'submodel',
  SMEditor: 'submodel',
}

function createRoute (name: string) {
  const route = reactive({
    name,
    get meta () {
      return { backendDataSource: ROUTE_DATA_SOURCES[route.name] }
    },
  })
  return route
}

function createInfrastructureState () {
  return reactive({
    isInitialized: true,
    getIsAuthenticating: false,
    getIsTestingConnections: false,
    connectComponents: vi.fn().mockResolvedValue(undefined),
    getSelectedInfrastructure: {
      id: 'default', name: 'Example server', template: 'full',
      components: Object.fromEntries(BASYX_COMPONENT_KEYS.map(key => [key, { url: '' }])),
    } as InfrastructureConfig | null,
    getComponentConnectionResults: {} as Partial<Record<BaSyxComponentKey, {
      state: ComponentConnectionState
      infrastructureId: string | null
      url: string
    }>>,
    getBasyxComponents: Object.fromEntries(BASYX_COMPONENT_KEYS.map(key => [key, {
      connected: false as boolean | null,
      loading: false,
    }])),
  })
}

function configureSource (key: BaSyxComponentKey, state: ComponentConnectionState = 'unreachable') {
  const infrastructure = mocks.infrastructure.getSelectedInfrastructure!
  const url = `https://example.com/${key}`
  infrastructure.components[key].url = url
  mocks.infrastructure.getComponentConnectionResults[key] = { state, url, infrastructureId: infrastructure.id }
}

function createEnvironmentState () {
  return reactive({
    getSingleAas: false,
    getSingleSm: false,
    getEndpointConfigAvailable: true,
  })
}

function createAasState () {
  return reactive({
    getSelectedAAS: null as { id: string } | null,
    getSelectedNode: null as { modelType: string } | null,
  })
}

const wrappers: ReturnType<typeof mount>[] = []

async function clickRetry (wrapper: ReturnType<typeof mount>) {
  vi.useFakeTimers({ toFake: ['setTimeout'] })
  await wrapper.findAll('button').find(button => button.text() === 'Retry')!.trigger('click')
  await vi.advanceTimersByTimeAsync(500)
  await flushPromises()
}

function mountNotice () {
  const wrapper = mount(BackendSetupNotice, {
    global: {
      stubs: {
        VBanner: { template: '<section><slot name="text" /><slot name="actions" /></section>' },
        VDefaultsProvider: { template: '<div><slot /></div>' },
        VBtn: {
          name: 'VBtn',
          props: ['href', 'text', 'loading'],
          template: '<component :is="href ? \'a\' : \'button\'" :data-loading="String(!!loading)" :href="href">{{ text }}<slot /></component>',
        },
      },
    },
  })
  wrappers.push(wrapper)
  return wrapper
}

describe('Backend setup notice', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.infrastructure = createInfrastructureState()
    mocks.environment = createEnvironmentState()
    mocks.aas = createAasState()
    mocks.route = createRoute('AASViewer')
  })

  afterEach(() => {
    for (const wrapper of wrappers.splice(0)) {
      wrapper.unmount()
    }
    vi.useRealTimers()
  })

  it('explains the missing backend after startup connection checks complete', async () => {
    mocks.infrastructure.isInitialized = false
    const wrapper = mountNotice()
    expect(wrapper.find('section').exists()).toBe(false)

    configureSource('AASRepo', 'checking')
    mocks.infrastructure.isInitialized = true
    await nextTick()
    expect(wrapper.find('section').exists()).toBe(false)

    mocks.infrastructure.getComponentConnectionResults.AASRepo!.state = 'unreachable'
    await nextTick()
    expect(wrapper.get('section').text()).toContain('Cannot reach Example server')
  })

  it('also offers setup when no environment has been selected', () => {
    mocks.infrastructure.getSelectedInfrastructure = null
    const wrapper = mountNotice()
    expect(wrapper.get('section').text()).toContain('No data source configured')
    expect(wrapper.text()).toContain('Connect a server that provides data for this view.')
    expect(wrapper.text()).toContain('Connect server')
  })

  it('hides during a reconnect and remains hidden when a component connects', async () => {
    configureSource('AASRepo')
    const wrapper = mountNotice()
    expect(wrapper.find('section').exists()).toBe(true)
    mocks.infrastructure.getComponentConnectionResults.AASRepo!.state = 'checking'
    await nextTick()
    expect(wrapper.find('section').exists()).toBe(false)
    mocks.infrastructure.getComponentConnectionResults.AASRepo!.state = 'connected'
    await nextTick()
    expect(wrapper.find('section').exists()).toBe(false)
  })

  it('waits for unknown component results rather than reporting an unavailable environment', () => {
    configureSource('AASRepo')
    delete mocks.infrastructure.getComponentConnectionResults.AASRepo
    expect(mountNotice().find('section').exists()).toBe(false)
  })

  it('uses only the services active in the selected template', async () => {
    mocks.infrastructure.getSelectedInfrastructure!.template = 'identifiable'
    configureSource('AASRepo')
    configureSource('SubmodelRepo', 'connected')
    configureSource('AASRegistry', 'checking')
    const wrapper = mountNotice()
    expect(wrapper.find('section').exists()).toBe(true)
    mocks.infrastructure.getComponentConnectionResults.AASRepo!.state = 'connected'
    await nextTick()
    expect(wrapper.find('section').exists()).toBe(false)
  })

  it('distinguishes missing configuration from unreachable configured services', () => {
    const notice = useBackendSetupNotice()
    expect(notice.noticeKind.value).toBe('setup')
    expect(notice.isSetupPending.value).toBe(false)
    configureSource('AASRepo')
    expect(notice.noticeKind.value).toBe('unreachable')
    expect(notice.infrastructureName.value).toBe('Example server')
  })

  it.each([
    'authentication-required', 'access-denied', 'server-error', 'invalid-response', 'configuration-error', 'not-configured',
  ] satisfies ComponentConnectionState[])('does not label a configured service with %s as unreachable', state => {
    configureSource('AASRepo', state)
    const notice = useBackendSetupNotice()
    expect(notice.noticeKind.value).toBeNull()
    expect(notice.showNotice.value).toBe(false)
    expect(notice.isSetupPending.value).toBe(false)
  })

  it('preserves a server response error alongside an unreachable alternative', () => {
    configureSource('AASRepo', 'unreachable')
    configureSource('AASRegistry', 'server-error')
    expect(useBackendSetupNotice().noticeKind.value).toBeNull()
  })

  it.each(['AASRepo', 'AASRegistry'] as const)('uses a healthy %s as an alternative AAS source', key => {
    configureSource('AASRepo', 'unreachable')
    configureSource('AASRegistry', 'unreachable')
    configureSource(key, 'connected')
    const notice = useBackendSetupNotice()
    expect(notice.noticeKind.value).toBeNull()
    expect(notice.isSetupPending.value).toBe(false)
  })

  it('does not infer a usable AAS source from a healthy company lookup or submodel service', () => {
    configureSource('AASRepo')
    configureSource('CompanyLookup', 'connected')
    configureSource('SubmodelRepo', 'connected')
    expect(useBackendSetupNotice().noticeKind.value).toBe('unreachable')
  })

  it.each(['SMViewer', 'SMEditor'])('checks the Submodel Repository on %s', name => {
    mocks.route.name = name
    configureSource('AASRepo', 'connected')
    configureSource('SubmodelRepo', 'unreachable')
    configureSource('SubmodelRegistry', 'connected')
    const notice = useBackendSetupNotice()
    expect(notice.noticeKind.value).toBe('unreachable')
    mocks.infrastructure.getComponentConnectionResults.SubmodelRepo!.state = 'connected'
    expect(notice.noticeKind.value).toBeNull()
  })

  it('requires a Submodel Repository even when a standalone Submodel Registry is healthy', () => {
    mocks.route.name = 'SMViewer'
    configureSource('SubmodelRegistry', 'connected')
    expect(useBackendSetupNotice().noticeKind.value).toBe('setup')
  })

  it.each(['SMViewer', 'SMEditor'])('requires a global Submodel source on identifiable-template %s', name => {
    mocks.route.name = name
    mocks.infrastructure.getSelectedInfrastructure!.template = 'identifiable'
    configureSource('AASRepo', 'connected')
    configureSource('SubmodelRepo', 'connected')
    const notice = useBackendSetupNotice()
    expect(notice.noticeKind.value).toBe('setup')
    expect(notice.hasUsableConnection.value).toBe(false)
    expect(notice.coveredDataSources.value).toEqual([])
  })

  it.each(['AASViewer', 'SubmodelList', 'Visualization'])('uses the identifiable shell repository for %s', name => {
    mocks.route.name = name
    mocks.infrastructure.getSelectedInfrastructure!.template = 'identifiable'
    configureSource('AASRepo', 'connected')
    configureSource('SubmodelRepo', 'unreachable')
    const notice = useBackendSetupNotice()
    expect(notice.noticeKind.value).toBeNull()
    expect(notice.hasUsableConnection.value).toBe(true)
    expect(notice.coveredDataSources.value).toEqual([{ component: 'AASRepo', url: 'https://example.com/AASRepo' }])
  })

  it.each(['SMViewer', 'SMEditor'])('does not hide missing global %s data behind an unrelated selected shell', name => {
    mocks.route.name = name
    mocks.aas.getSelectedAAS = { id: 'https://example.com/shells/one' }
    configureSource('AASRepo', 'connected')
    const notice = useBackendSetupNotice()
    expect(notice.noticeKind.value).toBe('setup')
    expect(notice.hasUsableConnection.value).toBe(false)
  })

  it('exposes only configured sources relevant to the current view and active template', () => {
    configureSource('AASRepo')
    configureSource('AASRegistry')
    configureSource('SubmodelRepo')
    configureSource('CompanyLookup')
    mocks.infrastructure.getSelectedInfrastructure!.components.AASRepo.url = '  https://example.com/AASRepo///  '
    const notice = useBackendSetupNotice()
    expect(notice.coveredDataSources.value).toHaveLength(2)
    expect(notice.coveredDataSources.value).toEqual(expect.arrayContaining([
      { component: 'AASRepo', url: 'https://example.com/AASRepo' },
      { component: 'AASRegistry', url: 'https://example.com/AASRegistry' },
    ]))

    mocks.route.name = 'SMViewer'
    expect(notice.coveredDataSources.value).toEqual([{ component: 'SubmodelRepo', url: 'https://example.com/SubmodelRepo' }])
    mocks.infrastructure.getSelectedInfrastructure!.template = 'identifiable'
    expect(notice.coveredDataSources.value).toEqual([])
    mocks.infrastructure.getSelectedInfrastructure!.template = 'full'
    mocks.route.name = 'About'
    expect(notice.coveredDataSources.value).toEqual([])
  })

  it('covers no requests when no source URL is configured', () => {
    expect(useBackendSetupNotice().coveredDataSources.value).toEqual([])
    mocks.infrastructure.getSelectedInfrastructure = null
    expect(useBackendSetupNotice().coveredDataSources.value).toEqual([])
  })

  it.each(['SubmodelList', 'Visualization', 'ComponentVisualization'])('keeps %s dependent on its shell data source', name => {
    mocks.route.name = name
    configureSource('AASRepo', 'unreachable')
    configureSource('SubmodelRepo', 'connected')
    expect(useBackendSetupNotice().noticeKind.value).toBe('unreachable')
  })

  it.each(['checking', undefined] as const)('waits for a relevant %s result', state => {
    configureSource('AASRepo')
    if (state) {
      mocks.infrastructure.getComponentConnectionResults.AASRepo!.state = state
    } else {
      delete mocks.infrastructure.getComponentConnectionResults.AASRepo
    }
    const notice = useBackendSetupNotice()
    expect(notice.noticeKind.value).toBeNull()
    expect(notice.isSetupPending.value).toBe(true)
  })

  it.each(['owner', 'url'])('rejects stale connection results after a changed %s', changed => {
    configureSource('AASRepo')
    const notice = useBackendSetupNotice()
    expect(notice.noticeKind.value).toBe('unreachable')
    if (changed === 'owner') {
      mocks.infrastructure.getSelectedInfrastructure!.id = 'new-selection'
    } else {
      mocks.infrastructure.getSelectedInfrastructure!.components.AASRepo.url = 'https://new.example'
    }
    expect(notice.noticeKind.value).toBeNull()
    expect(notice.isSetupPending.value).toBe(true)
  })

  it('does not use a healthy result belonging to an unselected infrastructure', () => {
    configureSource('AASRepo', 'connected')
    mocks.infrastructure.getComponentConnectionResults.AASRepo!.infrastructureId = 'another-infrastructure'
    const notice = useBackendSetupNotice()
    expect(notice.noticeKind.value).toBeNull()
    expect(notice.isSetupPending.value).toBe(true)
  })

  it('normalizes configured URL whitespace and trailing slashes before matching results', () => {
    configureSource('AASRepo')
    mocks.infrastructure.getSelectedInfrastructure!.components.AASRepo.url = '  https://example.com/AASRepo///  '
    expect(useBackendSetupNotice().noticeKind.value).toBe('unreachable')
  })

  it('accepts a positive connection result independently of data count and legacy connection flags', () => {
    configureSource('AASRepo', 'connected')
    mocks.infrastructure.getBasyxComponents.AASRepo.connected = false
    expect(useBackendSetupNotice().noticeKind.value).toBeNull()
    mocks.infrastructure.getComponentConnectionResults.AASRepo!.state = 'unreachable'
    mocks.infrastructure.getBasyxComponents.AASRepo.connected = true
    expect(useBackendSetupNotice().noticeKind.value).toBe('unreachable')
  })

  it('leaves Catena-X EDC connection guidance to its own module', () => {
    mocks.infrastructure.getSelectedInfrastructure!.template = 'catena-x'
    mocks.infrastructure.getSelectedInfrastructure!.catenaX = { accessMode: 'edc' }
    const notice = useBackendSetupNotice()
    expect(notice.showNotice.value).toBe(false)
    expect(notice.hasUsableConnection.value).toBe(false)
    expect(notice.coveredDataSources.value).toEqual([])
    mocks.route.name = 'SMViewer'
    expect(notice.showNotice.value).toBe(false)
    expect(notice.noticeKind.value).toBeNull()
    expect(notice.coveredDataSources.value).toEqual([])
  })

  it.each(['getIsAuthenticating', 'getIsTestingConnections'] as const)('waits while %s is active', key => {
    mocks.infrastructure[key] = true
    expect(mountNotice().find('section').exists()).toBe(false)
  })

  it.each(['getSingleAas', 'getSingleSm'] as const)('does not interrupt %s deployments', key => {
    mocks.environment[key] = true
    expect(mountNotice().find('section').exists()).toBe(false)
  })

  it.each(['About', 'ShareAccess', 'Page404', 'CustomDashboard'])('does not show backend setup on the independent %s page', name => {
    mocks.route.name = name
    expect(mountNotice().find('section').exists()).toBe(false)
  })

  it('preserves independently loaded AAS and Submodel views', async () => {
    mocks.aas.getSelectedAAS = { id: 'https://example.com/shells/one' }
    const wrapper = mountNotice()
    expect(wrapper.find('section').exists()).toBe(false)
    mocks.aas.getSelectedAAS = null
    mocks.aas.getSelectedNode = { modelType: 'Submodel' }
    mocks.route.name = 'SMViewer'
    await nextTick()
    expect(wrapper.find('section').exists()).toBe(false)
  })

  it('links to the quick start setup guide in a separate tab', () => {
    const wrapper = mountNotice()
    const links = wrapper.findAll('a')
    expect(links.map(link => [link.text(), link.attributes('href')])).toEqual([
      ['Setup guide', 'https://wiki.basyx.org/en/latest/content/user_documentation/basyx_components/web_ui/index.html#quick-start'],
    ])
    for (const link of links) {
      expect(link.attributes('target')).toBe('_blank')
      expect(link.attributes('rel')).toBe('noopener noreferrer')
    }
  })

  it('opens infrastructure management only when requested and closes it again', async () => {
    const wrapper = mountNotice()
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    await wrapper.findAll('button').find(button => button.text() === 'Connect server')!.trigger('click')
    expect(wrapper.get('[role="dialog"]').text()).toContain('Close infrastructures')
    expect(wrapper.find('section').exists()).toBe(false)
    await wrapper.get('[role="dialog"] button').trigger('click')
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    expect(wrapper.find('section').exists()).toBe(true)
  })

  it('keeps a persistent live region so screen readers announce the banner', async () => {
    mocks.infrastructure.isInitialized = false
    const wrapper = mountNotice()
    expect(wrapper.get('[role="status"]').attributes('aria-live')).toBe('polite')
    expect(wrapper.find('section').exists()).toBe(false)
    configureSource('AASRepo')
    mocks.infrastructure.isInitialized = true
    await nextTick()
    expect(wrapper.get('[role="status"] section').text()).toContain('Cannot reach Example server')
  })

  it('directs users to their administrator when no endpoint is configured and editing is disabled', () => {
    mocks.environment.getEndpointConfigAvailable = false
    const wrapper = mountNotice()
    expect(wrapper.text()).toContain('No server is configured for this view. Contact your administrator.')
    expect(wrapper.text()).not.toContain('Connect server')
    expect(wrapper.findAll('a')).toHaveLength(0)
    expect(wrapper.findAll('button')).toHaveLength(0)
  })

  it('offers only Retry to users who cannot edit an unreachable endpoint', () => {
    mocks.environment.getEndpointConfigAvailable = false
    configureSource('AASRepo')
    const wrapper = mountNotice()
    expect(wrapper.text()).toContain('The server is not responding. Retry later or contact your administrator.')
    expect(wrapper.text()).not.toContain('CORS')
    expect(wrapper.findAll('a')).toHaveLength(0)
    expect(wrapper.findAll('button').map(button => button.text())).toEqual(['Retry'])
  })

  it('separates the unreachable message from its setup guide link', () => {
    configureSource('AASRepo')
    expect(mountNotice().get('section p').text())
      .toBe('Check that the server is running and that its URL and CORS settings are correct. Setup guide')
  })

  it('opens connection settings for an unreachable configured server', async () => {
    configureSource('AASRepo')
    const wrapper = mountNotice()
    expect(wrapper.get('section').text()).toContain('Cannot reach Example server')
    expect(wrapper.text()).not.toContain('Connect server')
    expect(wrapper.get('a').text()).toBe('Setup guide')
    await wrapper.findAll('button').find(button => button.text() === 'Connection settings')!.trigger('click')
    expect(wrapper.find('section').exists()).toBe(false)
    expect(wrapper.get('[role="dialog"]').attributes('data-edit-selected')).toBe('true')
    await wrapper.get('[role="dialog"] button').trigger('click')
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    expect(wrapper.get('section').text()).toContain('Cannot reach Example server')
  })

  it('retries configured connections and reloads lists only after a usable connection returns', async () => {
    configureSource('AASRepo')
    mocks.infrastructure.connectComponents.mockImplementation(async () => {
      mocks.infrastructure.getComponentConnectionResults.AASRepo!.state = 'connected'
    })
    const wrapper = mountNotice()
    await clickRetry(wrapper)
    expect(mocks.infrastructure.connectComponents).toHaveBeenCalledOnce()
    expect(mocks.reloadAasList).toHaveBeenCalledOnce()
    expect(mocks.reloadTreeview).toHaveBeenCalledOnce()
    expect(wrapper.find('section').exists()).toBe(false)
  })

  it.each(['server-error', 'authentication-required', 'access-denied', 'configuration-error', 'invalid-response'] satisfies ComponentConnectionState[])(
    'does not reload data when retry receives %s instead of a usable connection', async state => {
      configureSource('AASRepo')
      mocks.infrastructure.connectComponents.mockImplementation(async () => {
        mocks.infrastructure.getComponentConnectionResults.AASRepo!.state = state
      })
      const wrapper = mountNotice()
      await clickRetry(wrapper)
      expect(mocks.infrastructure.connectComponents).toHaveBeenCalledOnce()
      expect(mocks.reloadAasList).not.toHaveBeenCalled()
      expect(mocks.reloadTreeview).not.toHaveBeenCalled()
    },
  )

  it('keeps the banner and a busy Retry button visible while connections are rechecked', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout'] })
    configureSource('AASRepo')
    mocks.infrastructure.connectComponents.mockImplementation(async () => {
      mocks.infrastructure.getComponentConnectionResults.AASRepo!.state = 'checking'
      await Promise.resolve()
      mocks.infrastructure.getComponentConnectionResults.AASRepo!.state = 'unreachable'
    })
    const wrapper = mountNotice()
    const retry = wrapper.findAll('button').find(button => button.text() === 'Retry')!
    await retry.trigger('click')
    await flushPromises()
    expect(wrapper.get('section').text()).toContain('Cannot reach Example server')
    expect(wrapper.findAll('button').find(button => button.text() === 'Retry')!.attributes('data-loading')).toBe('true')

    await vi.advanceTimersByTimeAsync(500)
    await flushPromises()
    expect(wrapper.get('section').text()).toContain('Cannot reach Example server')
    expect(wrapper.findAll('button').find(button => button.text() === 'Retry')!.attributes('data-loading')).toBe('false')
    expect(mocks.reloadAasList).not.toHaveBeenCalled()
  })

  it('does not reload the newly selected infrastructure when an earlier retry finishes', async () => {
    configureSource('AASRepo')
    let finishRetry!: () => void
    mocks.infrastructure.connectComponents.mockReturnValue(new Promise<void>(resolve => {
      finishRetry = resolve
    }))
    vi.useFakeTimers({ toFake: ['setTimeout'] })
    const wrapper = mountNotice()
    await wrapper.findAll('button').find(button => button.text() === 'Retry')!.trigger('click')
    mocks.infrastructure.getSelectedInfrastructure!.id = 'new-selection'
    configureSource('AASRepo', 'connected')
    finishRetry()
    await vi.advanceTimersByTimeAsync(500)
    await flushPromises()
    expect(mocks.reloadAasList).not.toHaveBeenCalled()
    expect(mocks.reloadTreeview).not.toHaveBeenCalled()
  })
})
