import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import SubmodelElementView from '@/components/SubmodelElementView.vue'
import { decorateResolvedOperationNode } from '@/utils/AAS/OperationTreeUtils'

const mocks = vi.hoisted(() => ({
  dispatchSelectedNode: vi.fn(),
  fetchCds: vi.fn().mockResolvedValue([]),
  fetchSme: vi.fn(),
  mutateOperation: vi.fn(),
  reloadTree: vi.fn(),
  selectedNode: null as any,
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({ name: 'AASEditor', query: {} }),
}))

vi.mock('@/store/AASDataStore', () => ({
  useAASStore: () => ({
    getSelectedAAS: { id: 'aas' },
    getSelectedNode: mocks.selectedNode,
    dispatchSelectedNode: mocks.dispatchSelectedNode,
  }),
}))

vi.mock('@/store/InfrastructureStore', () => ({
  useInfrastructureStore: () => ({
    getAASRegistryURL: '',
    getSubmodelRegistryURL: '',
  }),
}))

vi.mock('@/store/NavigationStore', () => ({
  useNavigationStore: () => ({
    getAutoSync: { state: false, interval: 3000 },
    dispatchTriggerTreeviewReload: mocks.reloadTree,
  }),
}))

vi.mock('@/composables/AAS/OperationTreeMutation', () => ({
  useOperationTreeMutation: () => ({ mutateOperation: mocks.mutateOperation }),
}))

vi.mock('@/composables/AAS/SMEHandling', () => ({
  useSMEHandling: () => ({ fetchSme: mocks.fetchSme }),
}))

vi.mock('@/composables/AAS/ConceptDescriptionHandling', () => ({
  useConceptDescriptionHandling: () => ({ fetchCds: mocks.fetchCds }),
}))

vi.mock('@/composables/AAS/ReferableUtils', () => ({
  useReferableUtils: () => ({ nameToDisplay: vi.fn(() => '') }),
}))

describe('SubmodelElementView Operation-owned inline updates', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.selectedNode = decorateResolvedOperationNode(
      { modelType: 'Property', idShort: 'numberA', valueType: 'xs:boolean', value: 'false' },
      '/operations/op',
      ['inputVariables', 0, 'value'],
    )
    const updatedNode = decorateResolvedOperationNode(
      { modelType: 'Property', idShort: 'numberA', valueType: 'xs:boolean', value: 'true' },
      '/operations/op',
      ['inputVariables', 0, 'value'],
    )
    mocks.mutateOperation.mockResolvedValue({ success: true })
    mocks.fetchSme.mockResolvedValue(updatedNode)
  })

  it('synchronizes the selected tree node without requesting a full tree reload', async () => {
    const slotStub = { template: '<div><slot /></div>' }
    const wrapper = mount(SubmodelElementView, {
      global: {
        stubs: {
          'v-container': slotStub,
          'v-card': slotStub,
          'v-list': slotStub,
          'v-divider': true,
          'Property': {
            name: 'Property',
            template: '<button data-testid="toggle" @click="$emit(\'update-value\', true)" />',
          },
          'IdentificationElement': true,
          'LastSync': true,
        },
      },
    })
    await flushPromises()

    await wrapper.get('[data-testid="toggle"]').trigger('click')
    await flushPromises()

    expect(mocks.mutateOperation).toHaveBeenCalledOnce()
    expect(mocks.dispatchSelectedNode).toHaveBeenCalledWith(expect.objectContaining({ value: 'true' }))
    expect(mocks.reloadTree).not.toHaveBeenCalled()
  })
})
