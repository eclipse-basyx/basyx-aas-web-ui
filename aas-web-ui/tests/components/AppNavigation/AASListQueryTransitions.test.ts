import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import AASList from '@/components/AppNavigation/AASList.vue'

const state = vi.hoisted(() => ({
  routeName: null as any,
  routeQuery: null as any,
  selectedAAS: null as any,
  infrastructureId: null as any,
  infrastructureTemplate: null as any,
  repositoryDescription: null as any,
  registryDescription: null as any,
  clearAASList: null as any,
  triggerAASListReload: null as any,
}))

const mocks = vi.hoisted(() => ({
  aasIsAvailableById: vi.fn(),
  dispatchSnackbar: vi.fn(),
  fetchAasShellListPage: vi.fn(),
  queryPage: vi.fn(),
  routerPush: vi.fn(),
  updateStatus: vi.fn(),
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({
    get name () {
      return state.routeName.value
    },
    get query () {
      return state.routeQuery.value
    },
  }),
  useRouter: () => ({ push: mocks.routerPush }),
}))

vi.mock('vuetify', async importOriginal => {
  const vuetify = await importOriginal()
  return {
    ...vuetify as object,
    useTheme: () => ({
      global: { current: ref({ dark: false }) },
      current: ref({ colors: { primary: '#000000' } }),
    }),
  }
})

vi.mock('@/composables/AAS/AASHandling', () => ({
  useAASHandling: () => ({
    fetchAasShellListPage: mocks.fetchAasShellListPage,
    aasIsAvailableById: mocks.aasIsAvailableById,
    enrichAasShellListItems: (items: any[], source: 'registry' | 'repository') => items.map(item => ({
      ...item,
      path: `${source}/${item.id}`,
    })),
  }),
}))

vi.mock('@/composables/AAS/AASListStatusChecks', () => ({
  useAASListStatusChecks: () => ({ updateStatus: mocks.updateStatus }),
}))

vi.mock('@/composables/AAS/ReferableUtils', () => ({
  useReferableUtils: () => ({
    nameToDisplay: (referable: any) => referable?.idShort || '',
    descriptionToDisplay: () => '',
  }),
}))

vi.mock('@/composables/Client/QueryLanguageClient', () => ({
  useQueryLanguageClient: () => ({ queryPage: mocks.queryPage }),
}))

vi.mock('@/composables/ClipboardUtil', () => ({
  useClipboardUtil: () => ({ copyToClipboard: vi.fn() }),
}))

vi.mock('@/store/AASDataStore', () => ({
  useAASStore: () => ({
    get getSelectedAAS () {
      return state.selectedAAS.value
    },
    dispatchSelectedAAS: vi.fn(),
  }),
}))

vi.mock('@/store/EnvironmentStore', () => ({
  useEnvStore: () => ({
    getAllowUploading: false,
    getSingleAas: false,
  }),
}))

vi.mock('@/store/InfrastructureStore', () => ({
  useInfrastructureStore: () => ({
    getAASRegistryURL: 'https://infra.example/shell-descriptors',
    getAASRepoURL: 'https://infra.example/shells',
    getIsAuthenticating: false,
    getIsTestingConnections: false,
    get getSelectedInfrastructureId () {
      return state.infrastructureId.value
    },
    get getSelectedInfrastructure () {
      return { template: state.infrastructureTemplate.value }
    },
    get getBasyxComponents () {
      return {
        AASRepo: { description: state.repositoryDescription.value },
        AASRegistry: { description: state.registryDescription.value },
      }
    },
  }),
}))

vi.mock('@/store/NavigationStore', () => ({
  useNavigationStore: () => ({
    getIsMobile: false,
    getStatusCheck: { state: false, interval: 1000 },
    get getClearAASList () {
      return state.clearAASList.value
    },
    get getTriggerAASListReload () {
      return state.triggerAASListReload.value
    },
    dispatchDrawerState: vi.fn(),
    dispatchSnackbar: mocks.dispatchSnackbar,
  }),
}))

const aasRepositoryQueryProfile
  = 'https://admin-shell.io/aas/API/3/2/AssetAdministrationShellRepositoryServiceSpecification/SSP-003'
const aasRegistryQueryProfile
  = 'https://admin-shell.io/aas/API/3/2/AssetAdministrationShellRegistryServiceSpecification/SSP-004'

function createAas (id: string): any {
  return { id, idShort: id }
}

describe('AAS list query transitions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    state.routeName = ref('AASViewer')
    state.routeQuery = ref({})
    state.selectedAAS = ref({})
    state.infrastructureId = ref('infra-1')
    state.infrastructureTemplate = ref('full')
    state.repositoryDescription = ref(null)
    state.registryDescription = ref(null)
    state.clearAASList = ref(0)
    state.triggerAASListReload = ref(0)
    mocks.aasIsAvailableById.mockResolvedValue(true)
    mocks.fetchAasShellListPage.mockResolvedValue({
      items: [createAas('registry-aas')],
      hasMore: false,
      source: 'registry',
    })
    mocks.queryPage.mockResolvedValue({ items: [], hasMore: false, success: true })
    mocks.routerPush.mockImplementation(async ({ query }: { query: Record<string, unknown> }) => {
      state.routeQuery.value = query
    })
  })

  it.each([
    ['both endpoints', { profiles: [aasRegistryQueryProfile] }],
    ['only the repository', null],
  ])('uses the repository query target for a populated mono registry when %s advertise support', async (_name, registryDescription) => {
    state.infrastructureTemplate.value = 'mono-all'
    state.repositoryDescription.value = { profiles: [aasRepositoryQueryProfile] }
    state.registryDescription.value = registryDescription
    mocks.queryPage.mockResolvedValue({
      items: [createAas('query-aas')],
      hasMore: false,
      success: true,
    })

    const wrapper = mount(AASList, { shallow: true })
    await flushPromises()

    expect((wrapper.vm as any).activeSource).toBe('registry')
    expect((wrapper.vm as any).aasQueryTarget).toBe('aas-repository')
    expect((wrapper.vm as any).queryAvailable).toBe(true)

    ;(wrapper.vm as any).handleSearchInput('query-aas')
    await (wrapper.vm as any).submitSearch()

    expect(mocks.queryPage).toHaveBeenCalledWith(
      'https://infra.example/shells',
      'aas-repository',
      expect.any(Object),
      { limit: 100 },
    )
  })

  it.each([false, true])('executes a QR-selected AAS search with server search %s', async serverSearch => {
    state.registryDescription.value = serverSearch ? { profiles: [aasRegistryQueryProfile] } : null
    mocks.fetchAasShellListPage.mockResolvedValue({
      items: [createAas('aas-one'), createAas('aas-two')],
      hasMore: false,
      source: 'registry',
    })
    mocks.queryPage.mockResolvedValue({
      items: [createAas('aas-two')],
      hasMore: false,
      success: true,
    })

    const wrapper = mount(AASList, { shallow: true })
    await flushPromises()

    await (wrapper.vm as any).handleAasSelected('aas-two')
    await flushPromises()

    expect((wrapper.vm as any).searchValue).toBe('aas-two')
    expect((wrapper.vm as any).aasList.map((item: any) => item.id)).toEqual(['aas-two'])
    expect(mocks.queryPage).toHaveBeenCalledTimes(serverSearch ? 1 : 0)
  })

  it('ignores an unfiltered page that resolves after a successful query', async () => {
    let resolvePage!: (page: any) => void
    state.repositoryDescription.value = { profiles: [aasRepositoryQueryProfile] }
    mocks.fetchAasShellListPage.mockReturnValue(new Promise(resolve => {
      resolvePage = resolve
    }))
    mocks.queryPage.mockResolvedValue({
      items: [createAas('query-aas')],
      hasMore: false,
      success: true,
    })

    const wrapper = mount(AASList, { shallow: true })
    await nextTick()

    ;(wrapper.vm as any).handleSearchInput('query-aas')
    await (wrapper.vm as any).submitSearch()
    expect((wrapper.vm as any).aasList.map((item: any) => item.id)).toEqual(['query-aas'])

    resolvePage({ items: [createAas('stale-aas')], hasMore: false, source: 'registry' })
    await flushPromises()

    expect((wrapper.vm as any).aasList.map((item: any) => item.id)).toEqual(['query-aas'])
  })

  it('keeps the normal page transition active when a query fails', async () => {
    let resolvePage!: (page: any) => void
    state.repositoryDescription.value = { profiles: [aasRepositoryQueryProfile] }
    mocks.fetchAasShellListPage.mockReturnValue(new Promise(resolve => {
      resolvePage = resolve
    }))
    mocks.queryPage.mockResolvedValue({ items: [], hasMore: false, success: false })

    const wrapper = mount(AASList, { shallow: true })
    await nextTick()

    ;(wrapper.vm as any).handleSearchInput('missing')
    await (wrapper.vm as any).submitSearch()

    resolvePage({ items: [createAas('missing-normal-aas')], hasMore: false, source: 'registry' })
    await flushPromises()

    expect((wrapper.vm as any).aasList.map((item: any) => item.id)).toEqual(['missing-normal-aas'])
    expect((wrapper.vm as any).pageLoading).toBe(false)
  })
})
