import type { InfrastructureConfig } from '@/types/Infrastructure'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, reactive } from 'vue'
import BackendSetupNotice from '@/components/AppNavigation/BackendSetupNotice.vue'
import { BASYX_COMPONENT_KEYS } from '@/utils/InfrastructureUtils'

const mocks = vi.hoisted(() => ({
  infrastructure: null as unknown as ReturnType<typeof createInfrastructureState>,
  environment: null as unknown as ReturnType<typeof createEnvironmentState>,
  aas: null as unknown as ReturnType<typeof createAasState>,
  route: null as unknown as { name: string },
}))

vi.mock('vue-router', () => ({ useRoute: () => mocks.route }))
vi.mock('@/store/InfrastructureStore', () => ({ useInfrastructureStore: () => mocks.infrastructure }))
vi.mock('@/store/EnvironmentStore', () => ({ useEnvStore: () => mocks.environment }))
vi.mock('@/store/AASDataStore', () => ({ useAASStore: () => mocks.aas }))
vi.mock('@/store/NavigationStore', () => ({ useNavigationStore: () => ({ getIsMobile: false }) }))
vi.mock('@/components/AppNavigation/Settings/InfrastructureManagement.vue', () => ({
  default: {
    props: ['open'],
    emits: ['update:open'],
    template: '<div v-if="open" role="dialog"><button @click="$emit(\'update:open\', false)">Close infrastructures</button></div>',
  },
}))

function createInfrastructureState () {
  return reactive({
    isInitialized: true,
    getIsAuthenticating: false,
    getIsTestingConnections: false,
    getSelectedInfrastructure: { id: 'default', template: 'full', components: {} } as InfrastructureConfig | null,
    getBasyxComponents: Object.fromEntries(BASYX_COMPONENT_KEYS.map(key => [key, {
      connected: false as boolean | null,
      loading: false,
    }])),
  })
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

function mountNotice () {
  const wrapper = mount(BackendSetupNotice, {
    global: {
      stubs: {
        VBanner: { template: '<section><slot name="text" /><slot name="actions" /></section>' },
        VBtn: { props: ['href'], template: '<component :is="href ? \'a\' : \'button\'" :href="href"><slot /></component>' },
      },
    },
  })
  wrappers.push(wrapper)
  return wrapper
}

describe('Backend setup notice', () => {
  beforeEach(() => {
    mocks.infrastructure = createInfrastructureState()
    mocks.environment = createEnvironmentState()
    mocks.aas = createAasState()
    mocks.route = reactive({ name: 'AASViewer' })
  })

  afterEach(() => {
    for (const wrapper of wrappers.splice(0)) {
      wrapper.unmount()
    }
  })

  it('explains the missing backend after startup connection checks complete', async () => {
    mocks.infrastructure.isInitialized = false
    const wrapper = mountNotice()
    expect(wrapper.find('[role="status"]').exists()).toBe(false)

    mocks.infrastructure.isInitialized = true
    mocks.infrastructure.getBasyxComponents.AASRepo.loading = true
    await nextTick()
    expect(wrapper.find('[role="status"]').exists()).toBe(false)

    mocks.infrastructure.getBasyxComponents.AASRepo.loading = false
    await nextTick()
    expect(wrapper.get('[role="status"]').text()).toContain('No AAS server connection')
    expect(wrapper.text()).toContain('The Web UI needs a separate AAS server to browse data.')
  })

  it('also offers setup when no environment has been selected', () => {
    mocks.infrastructure.getSelectedInfrastructure = null
    const wrapper = mountNotice()
    expect(wrapper.get('[role="status"]').text()).toContain('No AAS server connection')
    expect(wrapper.text()).toContain('Connect server')
  })

  it('hides during a reconnect and remains hidden when a component connects', async () => {
    const wrapper = mountNotice()
    expect(wrapper.find('[role="status"]').exists()).toBe(true)
    mocks.infrastructure.getBasyxComponents.AASRepo.loading = true
    await nextTick()
    expect(wrapper.find('[role="status"]').exists()).toBe(false)
    mocks.infrastructure.getBasyxComponents.AASRepo.loading = false
    mocks.infrastructure.getBasyxComponents.AASRepo.connected = true
    await nextTick()
    expect(wrapper.find('[role="status"]').exists()).toBe(false)
  })

  it('waits for unknown component results rather than reporting an unavailable environment', () => {
    mocks.infrastructure.getBasyxComponents.AASRepo.connected = null
    expect(mountNotice().find('[role="status"]').exists()).toBe(false)
  })

  it('uses only the services active in the selected template', async () => {
    mocks.infrastructure.getSelectedInfrastructure!.template = 'identifiable'
    mocks.infrastructure.getBasyxComponents.SubmodelRepo.connected = true
    mocks.infrastructure.getBasyxComponents.AASRegistry.loading = true
    const wrapper = mountNotice()
    expect(wrapper.find('[role="status"]').exists()).toBe(true)
    mocks.infrastructure.getBasyxComponents.AASRepo.connected = true
    await nextTick()
    expect(wrapper.find('[role="status"]').exists()).toBe(false)
  })

  it('leaves Catena-X EDC connection guidance to its own module', () => {
    mocks.infrastructure.getSelectedInfrastructure!.template = 'catena-x'
    mocks.infrastructure.getSelectedInfrastructure!.catenaX = { accessMode: 'edc' }
    expect(mountNotice().find('[role="status"]').exists()).toBe(false)
  })

  it.each(['getIsAuthenticating', 'getIsTestingConnections'] as const)('waits while %s is active', key => {
    mocks.infrastructure[key] = true
    expect(mountNotice().find('[role="status"]').exists()).toBe(false)
  })

  it.each(['getSingleAas', 'getSingleSm'] as const)('does not interrupt %s deployments', key => {
    mocks.environment[key] = true
    expect(mountNotice().find('[role="status"]').exists()).toBe(false)
  })

  it.each(['About', 'ShareAccess', 'Page404', 'CustomDashboard'])('does not show backend setup on the independent %s page', name => {
    mocks.route.name = name
    expect(mountNotice().find('[role="status"]').exists()).toBe(false)
  })

  it('preserves independently loaded AAS and Submodel views', async () => {
    mocks.aas.getSelectedAAS = { id: 'https://example.com/shells/one' }
    const wrapper = mountNotice()
    expect(wrapper.find('[role="status"]').exists()).toBe(false)
    mocks.aas.getSelectedAAS = null
    mocks.aas.getSelectedNode = { modelType: 'Submodel' }
    mocks.route.name = 'SMViewer'
    await nextTick()
    expect(wrapper.find('[role="status"]').exists()).toBe(false)
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
    expect(wrapper.find('[role="status"]').exists()).toBe(false)
    await wrapper.get('[role="dialog"] button').trigger('click')
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    expect(wrapper.find('[role="status"]').exists()).toBe(true)
  })

  it('directs users to their administrator when endpoint editing is disabled', () => {
    mocks.environment.getEndpointConfigAvailable = false
    const wrapper = mountNotice()
    expect(wrapper.text()).toContain('Contact your administrator to connect one.')
    expect(wrapper.text()).not.toContain('Connect server')
    expect(wrapper.findAll('a')).toHaveLength(1)
  })
})
