import type { SnackbarType } from '@/types/Application'
import type { BaSyxComponentKey } from '@/types/BaSyx'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, nextTick, reactive } from 'vue'
import Snackbar from '@/components/AppNavigation/Snackbar.vue'

const mocks = vi.hoisted(() => ({
  state: null as unknown as ReturnType<typeof createState>,
  dispatchSnackbar: vi.fn(),
}))

vi.mock('@/composables/Infrastructure/useBackendSetupNotice', () => ({
  useBackendSetupNotice: () => ({
    showNotice: computed(() => mocks.state.showNotice),
    isSetupPending: computed(() => mocks.state.isSetupPending),
    coveredDataSources: computed(() => mocks.state.coveredDataSources),
  }),
}))
vi.mock('@/store/InfrastructureStore', () => ({
  useInfrastructureStore: () => ({
    get getSelectedInfrastructureId () {
      return mocks.state.selectedInfrastructureId
    },
  }),
}))
vi.mock('@/store/NavigationStore', () => ({
  useNavigationStore: () => ({
    get getSnackbar () {
      return mocks.state.snackbar
    },
    dispatchSnackbar: (payload: SnackbarType) => {
      mocks.dispatchSnackbar(payload)
      mocks.state.snackbar = payload
    },
  }),
}))

function createState () {
  return reactive({
    showNotice: false,
    isSetupPending: false,
    selectedInfrastructureId: 'infra-1',
    coveredDataSources: [{ component: 'AASRepo' as BaSyxComponentKey, url: 'https://aas.example/api' }],
    snackbar: { status: false } as SnackbarType,
  })
}

function networkSnackbar (structured = false): SnackbarType {
  return {
    status: true,
    kind: 'network-error',
    infrastructureId: 'infra-1',
    networkRequest: structured
      ? { url: 'https://aas.example/api/description', operation: 'connection-check', component: 'AASRepo' }
      : { url: 'https://aas.example/api/shells?limit=100', operation: 'read' },
    ...(structured
      ? { baseError: 'Unable to connect to the configured BaSyx environment.', extendedError: 'AAS Repository URL could not be reached.' }
      : { text: 'Error! Server responded with: TypeError: Load failed' }),
  }
}

const wrappers: ReturnType<typeof mount>[] = []

function mountSnackbar () {
  const wrapper = mount(Snackbar, {
    global: {
      stubs: {
        VSnackbar: { props: ['modelValue'], template: '<div v-if="modelValue" role="alert"><slot /><slot name="actions" /></div>' },
        VCard: { template: '<div><slot /></div>' },
        VCardTitle: { template: '<h2><slot /></h2>' },
        VCardText: { template: '<div><slot /></div>' },
        VCardActions: { template: '<div><slot /></div>' },
        VBtn: { template: '<button><slot /></button>' },
        VDivider: true,
        VSpacer: true,
        VIcon: true,
      },
    },
  })
  wrappers.push(wrapper)
  return wrapper
}

describe('Snackbar backend setup coverage', () => {
  beforeEach(() => {
    mocks.state = createState()
    mocks.dispatchSnackbar.mockClear()
  })

  afterEach(() => {
    for (const wrapper of wrappers.splice(0)) {
      wrapper.unmount()
    }
  })

  it.each([false, true])('consumes a covered network snackbar (structured: %s)', structured => {
    mocks.state.showNotice = true
    mocks.state.snackbar = networkSnackbar(structured)
    const wrapper = mountSnackbar()
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(mocks.dispatchSnackbar).toHaveBeenCalledWith({ status: false })
    expect(mocks.state.snackbar.status).toBe(false)
  })

  it('removes an existing network snackbar when setup guidance appears and does not revive it on reconnect', async () => {
    mocks.state.snackbar = networkSnackbar()
    const wrapper = mountSnackbar()
    expect(wrapper.get('[role="alert"]').text()).toContain('Load failed')

    mocks.state.showNotice = true
    await nextTick()
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(mocks.state.snackbar.status).toBe(false)

    mocks.state.showNotice = false
    await nextTick()
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  })

  it('delays startup network failures until checks finish and consumes them when setup guidance takes over', async () => {
    mocks.state.isSetupPending = true
    const wrapper = mountSnackbar()
    mocks.state.snackbar = networkSnackbar()
    await nextTick()
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(mocks.dispatchSnackbar).not.toHaveBeenCalled()

    mocks.state.isSetupPending = false
    mocks.state.showNotice = true
    await nextTick()
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(mocks.state.snackbar.status).toBe(false)
  })

  it('shows an optional component failure after startup when another component connected', async () => {
    mocks.state.isSetupPending = true
    mocks.state.snackbar = networkSnackbar(true)
    const wrapper = mountSnackbar()
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)

    mocks.state.isSetupPending = false
    await nextTick()
    expect(wrapper.get('[role="alert"]').text()).toContain('AAS Repository URL could not be reached.')
    expect(mocks.dispatchSnackbar).not.toHaveBeenCalled()
  })

  it.each([
    { kind: 'authentication-required', text: 'Please sign in' },
    { kind: 'access-denied', baseError: 'Access denied!', extendedError: 'Not allowed' },
    { baseError: 'HTTP failure', extendedError: 'Error status: 500' },
    { text: 'TypeError: Invalid header value' },
    { text: 'Invalid custom header configuration' },
    { text: 'SyntaxError: Malformed JSON' },
    { text: 'TypeError: Failed to decode response body' },
  ] satisfies Partial<SnackbarType>[])('preserves unrelated error feedback: %j', error => {
    mocks.state.showNotice = true
    mocks.state.isSetupPending = true
    mocks.state.snackbar = { status: true, infrastructureId: 'infra-1', ...error }
    const wrapper = mountSnackbar()
    expect(wrapper.get('[role="alert"]').text()).toContain(error.text ?? error.baseError)
    expect(mocks.dispatchSnackbar).not.toHaveBeenCalled()
    expect(mocks.state.snackbar.status).toBe(true)
  })

  it('preserves a network notification belonging to another infrastructure', () => {
    mocks.state.showNotice = true
    mocks.state.isSetupPending = true
    mocks.state.snackbar = { ...networkSnackbar(), infrastructureId: 'infra-2' }
    const wrapper = mountSnackbar()
    expect(wrapper.get('[role="alert"]').text()).toContain('Load failed')
    expect(mocks.dispatchSnackbar).not.toHaveBeenCalled()
  })

  it('preserves an unrelated Company Lookup failure in the selected infrastructure', () => {
    mocks.state.showNotice = true
    mocks.state.snackbar = {
      ...networkSnackbar(), text: 'Company Lookup request failed',
      networkRequest: { operation: 'read', url: 'https://aas.example/api/companies' },
    }
    const wrapper = mountSnackbar()
    expect(wrapper.get('[role="alert"]').text()).toContain('Company Lookup request failed')
    expect(mocks.dispatchSnackbar).not.toHaveBeenCalled()
  })

  it.each([
    { operation: 'read', url: 'https://aas.example/api/shells/one' },
    { operation: 'read', url: 'https://aas.example/api/shells/one/asset-information/thumbnail' },
    { operation: 'read', url: 'https://aas.example/api/description' },
    { operation: 'read', url: 'https://other.example/api/shells' },
    { operation: 'connection-check', component: 'CompanyLookup', url: 'https://aas.example/api/description' },
    { operation: 'connection-check', component: 'AASRegistry', url: 'https://aas.example/api/description' },
  ] satisfies NonNullable<SnackbarType['networkRequest']>[])('retains requests outside the covered source scope: %j', networkRequest => {
    mocks.state.showNotice = true
    mocks.state.isSetupPending = true
    mocks.state.snackbar = { ...networkSnackbar(), networkRequest }
    const wrapper = mountSnackbar()
    expect(wrapper.get('[role="alert"]').text()).toContain('Load failed')
    expect(mocks.dispatchSnackbar).not.toHaveBeenCalled()
  })

  it('retains mutation and unscoped network errors even for the selected infrastructure', () => {
    mocks.state.showNotice = true
    mocks.state.isSetupPending = true
    mocks.state.snackbar = { ...networkSnackbar(), networkRequest: undefined }
    const wrapper = mountSnackbar()
    expect(wrapper.get('[role="alert"]').text()).toContain('Load failed')
    expect(mocks.dispatchSnackbar).not.toHaveBeenCalled()
  })

  it('retains isolated draft-check feedback while saved endpoint checks are pending', () => {
    mocks.state.isSetupPending = true
    mocks.state.snackbar = { ...networkSnackbar(), text: 'Draft connection failed', networkRequest: undefined }
    const wrapper = mountSnackbar()
    expect(wrapper.get('[role="alert"]').text()).toContain('Draft connection failed')
    expect(mocks.dispatchSnackbar).not.toHaveBeenCalled()
  })

  it('does not apply old source coverage after the selected endpoint changes', () => {
    mocks.state.showNotice = true
    mocks.state.coveredDataSources[0].url = 'https://new.example/api'
    mocks.state.snackbar = networkSnackbar()
    const wrapper = mountSnackbar()
    expect(wrapper.get('[role="alert"]').text()).toContain('Load failed')
    expect(mocks.dispatchSnackbar).not.toHaveBeenCalled()
  })
})
