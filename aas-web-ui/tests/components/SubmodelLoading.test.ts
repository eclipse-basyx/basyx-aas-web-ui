import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick, ref } from 'vue'
import SubmodelList from '@/components/SubmodelList.vue'
import SubmodelTree from '@/components/SubmodelTree.vue'

const state = vi.hoisted(() => ({
  selectedAAS: null as any,
  selectedNode: null as any,
  aasRegistryURL: null as any,
  submodelRegistryURL: null as any,
  submodelRepoURL: null as any,
  selectedInfrastructure: null as any,
  submodelDescription: null as any,
  clearTreeview: null as any,
  triggerTreeviewReload: null as any,
  routeName: null as any,
  routeQuery: null as any,
}))

const mocks = vi.hoisted(() => ({
  fetchAasSmListById: vi.fn(),
  fetchSmList: vi.fn(),
  queryPage: vi.fn(),
  routerPush: vi.fn(),
  dispatchSnackbar: vi.fn(),
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
  useAASHandling: () => ({ fetchAasSmListById: mocks.fetchAasSmListById }),
}))

vi.mock('@/composables/AAS/SMHandling', () => ({
  useSMHandling: () => ({
    fetchSmList: mocks.fetchSmList,
    enrichSmListItems: (items: any[]) => items,
  }),
}))

vi.mock('@/composables/Client/QueryLanguageClient', () => ({
  useQueryLanguageClient: () => ({ queryPage: mocks.queryPage }),
}))

vi.mock('@/composables/AAS/ReferableUtils', () => ({
  useReferableUtils: () => ({
    nameToDisplay: (referable: any) => referable?.idShort || '',
    descriptionToDisplay: () => '',
  }),
}))

vi.mock('@/composables/AAS/OperationTreeMutation', () => ({
  useOperationTreeMutation: () => ({ mutateOperation: vi.fn() }),
}))

vi.mock('@/composables/ClipboardUtil', () => ({
  useClipboardUtil: () => ({ pasteElement: vi.fn() }),
}))

vi.mock('@/store/AASDataStore', () => ({
  useAASStore: () => ({
    get getSelectedAAS () {
      return state.selectedAAS.value
    },
    get getSelectedNode () {
      return state.selectedNode.value
    },
    dispatchSelectedAAS: vi.fn(),
    dispatchSelectedNode: vi.fn(),
  }),
}))

vi.mock('@/store/ClipboardStore', () => ({
  useClipboardStore: () => ({ getClipboardElementModelType: () => undefined }),
}))

vi.mock('@/store/EnvironmentStore', () => ({
  useEnvStore: () => ({ getSingleAas: false }),
}))

vi.mock('@/store/InfrastructureStore', () => ({
  useInfrastructureStore: () => ({
    get getAASRegistryURL () {
      return state.aasRegistryURL.value
    },
    get getSubmodelRegistryURL () {
      return state.submodelRegistryURL.value
    },
    get getSubmodelRepoURL () {
      return state.submodelRepoURL.value
    },
    get getSelectedInfrastructure () {
      return state.selectedInfrastructure.value
    },
    get getBasyxComponents () {
      return {
        SubmodelRepo: { description: state.submodelDescription.value },
      }
    },
    getIsAuthenticating: false,
  }),
}))

vi.mock('@/store/NavigationStore', () => ({
  useNavigationStore: () => ({
    getIsMobile: false,
    get getClearTreeview () {
      return state.clearTreeview.value
    },
    get getTriggerTreeviewReload () {
      return state.triggerTreeviewReload.value
    },
    dispatchSnackbar: mocks.dispatchSnackbar,
  }),
}))

const treeviewStub = defineComponent({
  name: 'Treeview',
  props: ['item'],
  emits: ['convert-to-instance'],
  template: '<button data-test="convert-submodel" @click="$emit(\'convert-to-instance\', item)">Convert</button>',
})

const conversionDialogStub = defineComponent({
  name: 'ConvertSubmodelToInstanceDialog',
  props: ['modelValue', 'submodel'],
  emits: ['update:model-value'],
  template: '<div />',
})

const slotStub = {
  template: '<div><slot /></div>',
}

const submodelQueryProfile = 'https://admin-shell.io/aas/API/3/2/SubmodelRepositoryServiceSpecification/SSP-005'

function createSubmodel (id: string, submodelElements: any[] = []): any {
  return {
    id,
    idShort: id,
    modelType: 'Submodel',
    submodelElements,
  }
}

describe('Submodel loading invalidation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    state.selectedAAS = ref({ id: 'protected-aas' })
    state.selectedNode = ref({})
    state.aasRegistryURL = ref('https://infra.example/shell-descriptors')
    state.submodelRegistryURL = ref('https://infra.example/submodel-descriptors')
    state.submodelRepoURL = ref('https://infra.example/submodels')
    state.selectedInfrastructure = ref({ template: 'full' })
    state.submodelDescription = ref(null)
    state.clearTreeview = ref(0)
    state.triggerTreeviewReload = ref(0)
    state.routeName = ref('AASViewer')
    state.routeQuery = ref({})
    mocks.fetchSmList.mockResolvedValue([])
    mocks.queryPage.mockResolvedValue({ items: [], hasMore: false, success: true })
    mocks.routerPush.mockImplementation(async ({ query }: { query: Record<string, unknown> }) => {
      state.routeQuery.value = query
    })
  })

  it.each([
    ['Submodel tree', SubmodelTree, 'treeLoading'],
    ['Submodel list', SubmodelList, 'listLoading'],
  ])('stops the %s loader when the selected AAS is cleared', async (_name, component, loadingProperty) => {
    let resolveLoad!: (submodels: any[]) => void
    mocks.fetchAasSmListById.mockReturnValue(new Promise(resolve => {
      resolveLoad = resolve
    }))
    const wrapper = mount(component, { shallow: true })
    await flushPromises()

    expect((wrapper.vm as any)[loadingProperty]).toBe(true)

    state.selectedAAS.value = {}
    await nextTick()
    await flushPromises()

    expect((wrapper.vm as any)[loadingProperty]).toBe(false)

    resolveLoad([])
    await flushPromises()
    expect((wrapper.vm as any)[loadingProperty]).toBe(false)
  })

  it('opens the conversion dialog for the Submodel emitted by the tree action', async () => {
    const template = {
      id: 'urn:example:template',
      idShort: 'Template',
      kind: 'Template',
      modelType: 'Submodel',
      path: 'https://example.test/submodels/template',
    }
    state.routeName.value = 'AASEditor'
    mocks.fetchAasSmListById.mockResolvedValue([template])
    const wrapper = mount(SubmodelTree, {
      shallow: true,
      global: {
        stubs: {
          'Treeview': treeviewStub,
          'ConvertSubmodelToInstanceDialog': conversionDialogStub,
          'v-container': slotStub,
          'v-card': slotStub,
          'v-card-title': slotStub,
          'v-card-text': slotStub,
        },
      },
    })
    await flushPromises()

    await wrapper.get('[data-test="convert-submodel"]').trigger('click')
    await nextTick()

    const dialog = wrapper.findComponent(conversionDialogStub)
    expect(dialog.props('modelValue')).toBe(true)
    expect(dialog.props('submodel')).toEqual(expect.objectContaining({
      id: 'urn:example:template',
      path: 'https://example.test/submodels/template',
    }))
  })

  it.each(['quick', 'advanced'] as const)(
    'does not let a stale initial load replace successful %s query results',
    async mode => {
      let resolveInitialLoad!: (submodels: any[]) => void
      state.routeName.value = 'SMViewer'
      state.submodelDescription.value = { profiles: [submodelQueryProfile] }
      mocks.fetchSmList.mockReturnValue(new Promise(resolve => {
        resolveInitialLoad = resolve
      }))
      mocks.queryPage.mockResolvedValue({
        items: [createSubmodel('query-result')],
        hasMore: false,
        success: true,
      })

      const wrapper = mount(SubmodelTree, { shallow: true })
      await flushPromises()

      if (mode === 'quick') {
        ;(wrapper.vm as any).handleSearchInput('query-result')
        await (wrapper.vm as any).submitSearch()
      } else {
        await (wrapper.vm as any).runAdvancedQuery({ $condition: { $boolean: true } })
      }
      await flushPromises()

      expect((wrapper.vm as any).submodelTree.map((item: any) => item.id)).toEqual(['query-result'])

      resolveInitialLoad([createSubmodel('stale-unfiltered-result')])
      await flushPromises()

      expect((wrapper.vm as any).submodelTree.map((item: any) => item.id)).toEqual(['query-result'])
    },
  )

  it.each([
    ['incomplete compact search', { smSearch: 'idShort:' }, true],
    ['malformed advanced query', { smQuery: '{invalid' }, true],
    ['failed query request', { smSearch: 'missing' }, false],
  ])('loads the normal repository list for an %s route', async (_name, routeQuery, querySuccess) => {
    state.routeName.value = 'SMViewer'
    state.routeQuery.value = routeQuery
    state.submodelDescription.value = { profiles: [submodelQueryProfile] }
    mocks.fetchSmList.mockResolvedValue([createSubmodel('normal-result')])
    mocks.queryPage.mockResolvedValue({ items: [], hasMore: false, success: querySuccess })

    const wrapper = mount(SubmodelTree, { shallow: true })
    await flushPromises()

    expect(mocks.fetchSmList).toHaveBeenCalledOnce()
    expect((wrapper.vm as any).submodelTree.map((item: any) => item.id)).toEqual(['normal-result'])
    expect(state.routeQuery.value).toEqual({})
    expect(mocks.dispatchSnackbar).toHaveBeenCalled()
  })

  it.each(['property-value', 'urn:semantic:temperature', 'urn:supplemental:temperature'])(
    'finds a containing Submodel through the local SME value %s',
    async searchValue => {
      const property = {
        idShort: 'Temperature',
        modelType: 'Property',
        value: 'property-value',
        semanticId: { keys: [{ value: 'urn:semantic:temperature' }] },
        supplementalSemanticIds: [{ keys: [{ value: 'urn:supplemental:temperature' }] }],
      }
      mocks.fetchAasSmListById.mockResolvedValue([createSubmodel('containing-submodel', [property])])

      const wrapper = mount(SubmodelTree, { shallow: true })
      await flushPromises()

      ;(wrapper.vm as any).handleSearchInput(searchValue)
      await (wrapper.vm as any).submitSearch()

      expect((wrapper.vm as any).submodelTree.map((item: any) => item.id)).toEqual(['containing-submodel'])
    },
  )
})
