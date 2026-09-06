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
  clearTreeview: null as any,
  triggerTreeviewReload: null as any,
  routeName: null as any,
  routeQuery: null as any,
}))

const mocks = vi.hoisted(() => ({
  fetchAasSmListById: vi.fn(),
  fetchSmList: vi.fn(),
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
  useRouter: () => ({ push: vi.fn() }),
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
  useSMHandling: () => ({ fetchSmList: mocks.fetchSmList }),
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

// Consume the component prop without forwarding it to the read-only DOM property.
const editorFormStub = {
  props: ['parentElement'],
  template: '<div />',
}

const editorFormStubs = {
  SubmodelElementForm: editorFormStub,
  PropertyForm: editorFormStub,
  MLPForm: editorFormStub,
  RangeForm: editorFormStub,
  FileForm: editorFormStub,
  BlobForm: editorFormStub,
  CollectionForm: editorFormStub,
  ListForm: editorFormStub,
  EntityForm: editorFormStub,
  ReferenceElementForm: editorFormStub,
  RelationshipElementForm: editorFormStub,
  AnnotatedRelationshipElementForm: editorFormStub,
  JsonInsert: editorFormStub,
  SubmodelElementDraftForm: editorFormStub,
}

describe('Submodel loading invalidation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    state.selectedAAS = ref({ id: 'protected-aas' })
    state.selectedNode = ref({})
    state.aasRegistryURL = ref('https://infra.example/shell-descriptors')
    state.submodelRegistryURL = ref('https://infra.example/submodel-descriptors')
    state.clearTreeview = ref(0)
    state.triggerTreeviewReload = ref(0)
    state.routeName = ref('AASViewer')
    state.routeQuery = ref({})
    mocks.fetchSmList.mockResolvedValue([])
  })

  it.each([
    ['Submodel tree', SubmodelTree, 'treeLoading'],
    ['Submodel list', SubmodelList, 'listLoading'],
  ])('stops the %s loader when the selected AAS is cleared', async (_name, component, loadingProperty) => {
    let resolveLoad!: (submodels: any[]) => void
    mocks.fetchAasSmListById.mockReturnValue(new Promise(resolve => {
      resolveLoad = resolve
    }))
    const wrapper = mount(component, { shallow: true, global: { stubs: editorFormStubs } })
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
          ...editorFormStubs,
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
})
