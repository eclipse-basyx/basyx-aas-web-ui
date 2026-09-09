import type { VueWrapper } from '@vue/test-utils'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, ref } from 'vue'
import CatenaXplorer from '@/pages/modules/CatenaXplorer/index.vue'

const descriptors = [
  {
    id: 'urn:example:aas:1',
    idShort: 'ExampleShell',
    submodelDescriptors: [
      {
        id: 'urn:example:submodel:1',
        idShort: 'TechnicalData',
        endpoints: [{
          interface: 'SUBMODEL-3.0',
          protocolInformation: { href: 'https://repository.test/submodels/one' },
        }],
      },
      {
        id: 'urn:example:submodel:2',
        idShort: 'Documentation',
        endpoints: [{
          interface: 'SUBMODEL-3.0',
          protocolInformation: { href: 'https://repository.test/submodels/two' },
        }],
      },
    ],
  },
]

const mockState = vi.hoisted(() => ({
  allowEditing: true,
  failureDetails: undefined as string | undefined,
  failureStatus: undefined as number | undefined,
  isMobile: false,
  selectedInfrastructure: {
    id: 'catena-x-direct',
    template: 'catena-x',
    catenaX: { accessMode: 'direct' },
  } as any,
  smViewerEditor: true,
  snackbar: { status: false } as Record<string, unknown>,
}))

const mockRouteState = vi.hoisted(() => ({
  currentRoute: { value: { name: 'CatenaXplorer', query: {} as Record<string, string> } },
  route: { query: {} as Record<string, string> },
}))
const mockDeps = vi.hoisted(() => ({
  consumeFailureDetails: vi.fn(),
  consumeFailureStatus: vi.fn(),
  dispatchSnackbar: vi.fn(),
  fetchAasDescriptorListPage: vi.fn(),
  fetchSm: vi.fn(),
  routerPush: vi.fn(),
}))

vi.mock('vue-router', () => ({
  useRoute: () => mockRouteState.route,
  useRouter: () => ({
    currentRoute: mockRouteState.currentRoute,
    push: mockDeps.routerPush,
  }),
}))

vi.mock('vuetify', () => ({
  useDisplay: () => ({
    mdAndUp: ref(true),
    smAndDown: ref(false),
  }),
}))

vi.mock('@/composables/Client/AASRegistryClient', () => ({
  useAASRegistryClient: () => ({
    deleteAasDescriptor: vi.fn(),
    fetchAasDescriptorById: vi.fn(),
    fetchAasDescriptorListPage: mockDeps.fetchAasDescriptorListPage,
    postAasDescriptor: vi.fn(),
    putAasDescriptor: vi.fn(),
  }),
}))

vi.mock('@/composables/Client/CatenaXEdcClient', () => ({
  useCatenaXEdcClient: () => ({
    consumeLastRequestFailureDetails: vi.fn(),
    fetchDtrShellDescriptorById: vi.fn(),
    fetchDtrShellDescriptors: vi.fn(),
    fetchSubmodel: vi.fn(),
  }),
}))

vi.mock('@/composables/Client/SMRepositoryClient', () => ({
  useSMRepositoryClient: () => ({
    consumeLastRequestFailureDetails: mockDeps.consumeFailureDetails,
    consumeLastRequestFailureStatus: mockDeps.consumeFailureStatus,
    fetchSm: mockDeps.fetchSm,
  }),
}))

vi.mock('@/composables/ClipboardUtil', () => ({
  useClipboardUtil: () => ({ copyToClipboard: vi.fn() }),
}))

vi.mock('@/composables/IDUtils', () => ({
  useIDUtils: () => ({ generateIri: vi.fn(() => 'urn:generated') }),
}))

vi.mock('@/store/EnvironmentStore', () => ({
  useEnvStore: () => ({
    get getAllowEditing () {
      return mockState.allowEditing
    },
    get getAuthorizationPrefix () {
      return 'Bearer'
    },
    get getEndpointConfigAvailable () {
      return true
    },
    get getEnvBasePath () {
      return '/'
    },
    get getSmViewerEditor () {
      return mockState.smViewerEditor
    },
  }),
}))

vi.mock('@/store/InfrastructureStore', () => ({
  useInfrastructureStore: () => ({
    dispatchUpdateInfrastructure: vi.fn(),
    get getAASRegistryURL () {
      return 'https://registry.test'
    },
    get getAASRepoURL () {
      return 'https://repository.test'
    },
    get getSelectedInfrastructure () {
      return mockState.selectedInfrastructure
    },
    get getSubmodelRepoURL () {
      return 'https://repository.test'
    },
  }),
}))

vi.mock('@/store/NavigationStore', () => ({
  useNavigationStore: () => ({
    dispatchSnackbar: mockDeps.dispatchSnackbar,
    get getIsMobile () {
      return mockState.isMobile
    },
    get getSnackbar () {
      return mockState.snackbar
    },
  }),
}))

const DescriptorDetailsStub = defineComponent({
  name: 'DescriptorDetails',
  emits: ['open-submodel'],
  template: `
    <div>
      <button data-testid="open-one" @click="$emit('open-submodel', descriptors[0].submodelDescriptors[0])">
        Open one
      </button>
      <button data-testid="open-two" @click="$emit('open-submodel', descriptors[0].submodelDescriptors[1])">
        Open two
      </button>
    </div>
  `,
  setup () {
    return { descriptors }
  },
})

function resolvedSubmodel (id: string) {
  return {
    id,
    idShort: id.endsWith(':1') ? 'TechnicalData' : 'Documentation',
    modelType: 'Submodel',
    submodelElements: [],
  }
}

async function createWrapper (): Promise<VueWrapper> {
  const wrapper = mount(CatenaXplorer, {
    global: {
      stubs: {
        CatenaXPartnerDialog: true,
        CatenaXplorerNavigationDrawer: true,
        DeleteDescriptorDialog: true,
        DescriptorBrowser: true,
        DescriptorDetails: DescriptorDetailsStub,
        DescriptorEditDialog: true,
        VContainer: { template: '<div><slot /></div>' },
      },
    },
  })
  await flushPromises()
  mockDeps.routerPush.mockClear()
  mockDeps.dispatchSnackbar.mockClear()
  return wrapper
}

describe('CatenaXplorer direct Submodel navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockState.allowEditing = true
    mockState.failureDetails = undefined
    mockState.failureStatus = undefined
    mockState.isMobile = false
    mockState.selectedInfrastructure = {
      id: 'catena-x-direct',
      template: 'catena-x',
      catenaX: { accessMode: 'direct' },
    }
    mockState.smViewerEditor = true
    mockState.snackbar = { status: false }
    mockRouteState.route.query = {}
    mockRouteState.currentRoute.value = { name: 'CatenaXplorer', query: {} }
    mockDeps.consumeFailureDetails.mockImplementation(() => mockState.failureDetails)
    mockDeps.consumeFailureStatus.mockImplementation(() => mockState.failureStatus)
    mockDeps.fetchAasDescriptorListPage.mockResolvedValue({ items: descriptors, hasMore: false })
    mockDeps.fetchSm.mockImplementation((endpoint: string) => {
      return Promise.resolve(resolvedSubmodel(endpoint.endsWith('/one')
        ? 'urn:example:submodel:1'
        : 'urn:example:submodel:2'))
    })
    mockDeps.routerPush.mockImplementation(async (target: { name: string, query: Record<string, string> }) => {
      mockRouteState.currentRoute.value = target
    })
  })

  it.each([
    { allowEditing: true, isMobile: false, routeName: 'SMEditor' },
    { allowEditing: false, isMobile: false, routeName: 'SMViewer' },
    { allowEditing: true, isMobile: true, routeName: 'Visualization' },
  ])('opens the resolved endpoint in $routeName', async ({ allowEditing, isMobile, routeName }) => {
    mockState.allowEditing = allowEditing
    mockState.isMobile = isMobile
    const wrapper = await createWrapper()

    await wrapper.find('[data-testid="open-one"]').trigger('click')
    await flushPromises()

    expect(mockDeps.fetchSm).toHaveBeenCalledWith('https://repository.test/submodels/one')
    expect(mockDeps.routerPush).toHaveBeenCalledWith({
      name: routeName,
      query: { path: 'https://repository.test/submodels/one' },
    })
  })

  it('preserves the actionable authentication snackbar', async () => {
    mockState.failureStatus = 401
    mockState.snackbar = { status: true, kind: 'authentication-required' }
    mockDeps.fetchSm.mockResolvedValue({})
    const wrapper = await createWrapper()

    await wrapper.find('[data-testid="open-one"]').trigger('click')
    await flushPromises()

    expect(mockDeps.routerPush).not.toHaveBeenCalled()
    expect(mockDeps.dispatchSnackbar).not.toHaveBeenCalled()
  })

  it('rejects an endpoint that resolves to a different Submodel', async () => {
    mockDeps.fetchSm.mockResolvedValue(resolvedSubmodel('urn:example:submodel:other'))
    const wrapper = await createWrapper()

    await wrapper.find('[data-testid="open-one"]').trigger('click')
    await flushPromises()

    expect(mockDeps.routerPush).not.toHaveBeenCalled()
    expect(mockDeps.dispatchSnackbar).toHaveBeenCalledWith(expect.objectContaining({
      baseError: 'Could not open Submodel',
      extendedError: expect.stringContaining('urn:example:submodel:other'),
    }))
  })

  it('ignores an older resolution after a newer Submodel was opened', async () => {
    let resolveFirst!: (value: ReturnType<typeof resolvedSubmodel>) => void
    let resolveSecond!: (value: ReturnType<typeof resolvedSubmodel>) => void
    mockDeps.fetchSm
      .mockImplementationOnce(() => new Promise(resolve => {
        resolveFirst = resolve
      }))
      .mockImplementationOnce(() => new Promise(resolve => {
        resolveSecond = resolve
      }))
    const wrapper = await createWrapper()

    await wrapper.find('[data-testid="open-one"]').trigger('click')
    await wrapper.find('[data-testid="open-two"]').trigger('click')
    resolveSecond(resolvedSubmodel('urn:example:submodel:2'))
    await flushPromises()
    resolveFirst(resolvedSubmodel('urn:example:submodel:1'))
    await flushPromises()

    expect(mockDeps.routerPush).toHaveBeenCalledTimes(1)
    expect(mockDeps.routerPush).toHaveBeenCalledWith({
      name: 'SMEditor',
      query: { path: 'https://repository.test/submodels/two' },
    })
  })

  it('does not navigate after CatenaXplorer was left', async () => {
    let resolveRequest!: (value: ReturnType<typeof resolvedSubmodel>) => void
    mockDeps.fetchSm.mockImplementationOnce(() => new Promise(resolve => {
      resolveRequest = resolve
    }))
    const wrapper = await createWrapper()

    await wrapper.find('[data-testid="open-one"]').trigger('click')
    wrapper.unmount()
    resolveRequest(resolvedSubmodel('urn:example:submodel:1'))
    await flushPromises()

    expect(mockDeps.routerPush).not.toHaveBeenCalled()
  })
})
