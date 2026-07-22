import { jsonization, types } from '@aas-core-works/aas-core3.1-typescript'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import SubmodelElementDraftForm from '@/components/EditorComponents/SubmodelElementDraftForm.vue'

const mocks = vi.hoisted(() => ({
  fetchSme: vi.fn(),
  putSubmodelElement: vi.fn(),
  snackbar: vi.fn(),
  push: vi.fn(),
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({ query: {} }),
  useRouter: () => ({ push: mocks.push }),
}))

vi.mock('@/composables/Client/SMRepositoryClient', () => ({
  useSMRepositoryClient: () => ({
    fetchSme: mocks.fetchSme,
    postSubmodelElement: vi.fn(),
    putSubmodelElement: mocks.putSubmodelElement,
    consumeLastRequestFailureStatus: vi.fn(),
    consumeLastRequestFailureDetails: vi.fn(),
  }),
}))

vi.mock('@/store/NavigationStore', () => ({
  useNavigationStore: () => ({
    dispatchSnackbar: mocks.snackbar,
    dispatchTriggerTreeviewReload: vi.fn(),
  }),
}))

function operationJson (value: string) {
  const property = new types.Property(types.DataTypeDefXsd.String)
  property.idShort = 'input'
  property.value = value
  const operation = new types.Operation()
  operation.idShort = 'operation'
  operation.inputVariables = [new types.OperationVariable(property)]
  return jsonization.toJsonable(operation)
}

function operationJsonWithCategory (value: string, category: string) {
  const operation = operationJson(value) as any
  operation.category = category
  return operation
}

const slotStub = { template: '<div><slot /></div>' }

describe('repository Operation draft persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.fetchSme
      .mockResolvedValueOnce(operationJson('opened'))
      .mockResolvedValueOnce(operationJson('changed-while-open'))
    mocks.putSubmodelElement.mockResolvedValue(true)
  })

  it('preserves the latest variables when saving Operation metadata', async () => {
    const wrapper = mount(SubmodelElementDraftForm, {
      props: {
        modelValue: true,
        modelType: 'Operation',
        isNew: false,
        detached: false,
        path: '/operations/op',
        element: operationJson('opened'),
      },
      global: {
        stubs: {
          'v-dialog': slotStub,
          'v-card': slotStub,
          'v-card-title': slotStub,
          'v-card-text': slotStub,
          'v-card-actions': slotStub,
          'v-divider': true,
          'v-spacer': true,
          'v-btn': slotStub,
          'v-alert': slotStub,
          'v-expansion-panels': slotStub,
          'v-expansion-panel': slotStub,
          'v-expansion-panel-title': slotStub,
          'v-expansion-panel-text': slotStub,
          'v-row': slotStub,
          'v-col': slotStub,
          'TextInput': true,
          'MultiLanguageTextInput': true,
          'SelectInput': true,
          'ReferenceInput': true,
          'QualifierInput': true,
          'EmbeddedDataSpecificationInput': true,
        },
      },
    })
    await flushPromises()

    await (wrapper.vm as any).save()

    expect(mocks.fetchSme).toHaveBeenCalledTimes(2)
    expect(mocks.putSubmodelElement).toHaveBeenCalledTimes(1)
    expect(mocks.putSubmodelElement.mock.calls[0][0].inputVariables[0].value.value)
      .toBe('changed-while-open')
  })

  it('rejects the save when Operation metadata changed concurrently', async () => {
    mocks.fetchSme.mockReset()
    mocks.fetchSme
      .mockResolvedValueOnce(operationJsonWithCategory('opened', 'opened-category'))
      .mockResolvedValueOnce(operationJsonWithCategory('opened', 'server-category'))

    const wrapper = mount(SubmodelElementDraftForm, {
      props: {
        modelValue: true,
        modelType: 'Operation',
        isNew: false,
        detached: false,
        path: '/operations/op',
        element: operationJsonWithCategory('opened', 'opened-category'),
      },
      global: {
        stubs: {
          'v-dialog': slotStub,
          'v-card': slotStub,
          'v-card-title': slotStub,
          'v-card-text': slotStub,
          'v-card-actions': slotStub,
          'v-divider': true,
          'v-spacer': true,
          'v-btn': slotStub,
          'v-alert': slotStub,
          'v-expansion-panels': slotStub,
          'v-expansion-panel': slotStub,
          'v-expansion-panel-title': slotStub,
          'v-expansion-panel-text': slotStub,
          'v-row': slotStub,
          'v-col': slotStub,
          'TextInput': true,
          'MultiLanguageTextInput': true,
          'SelectInput': true,
          'ReferenceInput': true,
          'QualifierInput': true,
          'EmbeddedDataSpecificationInput': true,
        },
      },
    })
    await flushPromises()

    ;(wrapper.vm as any).draft.category = 'local-category'
    await (wrapper.vm as any).save()

    expect(mocks.putSubmodelElement).not.toHaveBeenCalled()
    expect(mocks.snackbar).toHaveBeenCalledWith(expect.objectContaining({
      baseError: 'The Operation changed while it was being edited.',
      color: 'warning',
    }))
  })
})
