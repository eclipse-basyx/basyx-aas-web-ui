import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'
import JsonInsert from '@/components/EditorComponents/JsonInsert.vue'
import OperationOwnedJsonInsert from '@/components/EditorComponents/OperationOwnedJsonInsert.vue'
import OperationVariableJsonInsert from '@/components/EditorComponents/OperationVariableJsonInsert.vue'

const mocks = vi.hoisted(() => ({
  postElement: vi.fn(), push: vi.fn(), snackbar: vi.fn(), reload: vi.fn(), mutate: vi.fn(),
}))
vi.mock('vue-router', () => ({
  useRoute: () => ({ query: {} }), useRouter: () => ({ push: mocks.push, currentRoute: { value: { query: {} } } }),
}))
vi.mock('@/store/AASDataStore', () => ({ useAASStore: () => ({ getSelectedAAS: null }) }))
vi.mock('@/store/InfrastructureStore', () => ({ useInfrastructureStore: () => ({ getSelectedInfrastructure: null }) }))
vi.mock('@/store/NavigationStore', () => ({ useNavigationStore: () => ({ dispatchSnackbar: mocks.snackbar, dispatchTriggerTreeviewReload: mocks.reload }) }))
vi.mock('@/composables/Client/SMRepositoryClient', () => ({ useSMRepositoryClient: () => ({ postSubmodelElement: mocks.postElement }) }))
vi.mock('@/composables/Client/SMRegistryClient', () => ({ useSMRegistryClient: () => ({}) }))
vi.mock('@/composables/Client/AASRepositoryClient', () => ({ useAASRepositoryClient: () => ({}) }))
vi.mock('@/composables/AAS/OperationTreeMutation', () => ({ useOperationTreeMutation: () => ({ mutateOperation: mocks.mutate }) }))

const editor = defineComponent({
  props: { modelValue: String, root: { type: String, default: 'SubmodelElement' }, errors: Array },
  emits: ['update:modelValue'],
  template: '<div><textarea :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" /><div>{{ errors }}</div></div>',
})
const slot = { template: '<div><slot /></div>' }
const global = { stubs: {
  AasJsonEditor: editor, VDialog: slot, VSheet: slot, VCardTitle: slot, VCardText: slot, VCardActions: slot,
  VDivider: true, VSpacer: true, VAlert: slot, VBtn: { template: '<button><slot /></button>' },
} }
const property = { modelType: 'Property', idShort: 'Temperature', valueType: 'xs:double', value: '21' }

describe('JSON insertion with shared editor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.postElement.mockResolvedValue(true)
  })

  it('selects the schema root, validates syntax/Core structure, and preserves repository saving', async () => {
    const wrapper = mount(JsonInsert, { props: {
      modelValue: false, type: 'Submodel', parentElement: { modelType: 'Submodel', id: 'urn:sm', path: '/submodels/sm' },
    }, global })
    expect(wrapper.findComponent(editor).exists()).toBe(false)
    await wrapper.setProps({ modelValue: true })
    expect(wrapper.getComponent(editor).props('root')).toBe('Submodel')
    await wrapper.setProps({ type: 'SubmodelElement' })
    expect(wrapper.getComponent(editor).props('root')).toBe('SubmodelElement')
    const save = wrapper.findAll('button').find(button => button.text() === 'Save')!
    await wrapper.get('textarea').setValue('{bad')
    await save.trigger('click')
    expect(wrapper.getComponent(editor).props('errors')).toEqual(['Invalid JSON input'])
    await wrapper.get('textarea').setValue('{"modelType":"Property"}')
    await save.trigger('click')
    expect(mocks.snackbar).toHaveBeenCalled()
    expect(mocks.postElement).not.toHaveBeenCalled()
    await wrapper.get('textarea').setValue(JSON.stringify(property))
    await save.trigger('click')
    await flushPromises()
    expect(mocks.postElement).toHaveBeenCalledWith(expect.objectContaining({ idShort: 'Temperature' }), 'urn:sm', undefined, true)
    expect(mocks.push).toHaveBeenCalledWith({ query: { path: '/submodels/sm/submodel-elements/Temperature' } })
    expect(wrapper.findComponent(editor).exists()).toBe(false)
    await wrapper.setProps({ modelValue: false })
    await wrapper.setProps({ modelValue: true })
    expect(wrapper.get('textarea').element.value).toBe('')
    wrapper.unmount()
  })

  it('wraps exactly one Operation variable and persists its owning Operation', async () => {
    const target = { modelType: 'Operation', inputVariables: [] as unknown[] }
    mocks.mutate.mockImplementation(async (_boundary, action) => {
      action({ target })
      return { success: true }
    })
    const wrapper = mount(OperationVariableJsonInsert, { props: {
      modelValue: false, operation: { modelType: 'Operation', path: '/operations/test' }, direction: 'inputVariables',
    }, global })
    await wrapper.setProps({ modelValue: true })
    const save = wrapper.findAll('button').find(button => button.text() === 'Add Variable')!
    await wrapper.get('textarea').setValue(JSON.stringify([property]))
    await save.trigger('click')
    expect(wrapper.getComponent(editor).props('errors')).toEqual(['Insert exactly one SubmodelElement object, not an array.'])
    expect(mocks.mutate).not.toHaveBeenCalled()
    await wrapper.get('textarea').setValue(JSON.stringify(property))
    await save.trigger('click')
    await flushPromises()
    expect(target.inputVariables).toEqual([{ value: property }])
    expect(mocks.push).toHaveBeenCalledWith({ query: { path: '/operations/test', fragment: '/inputVariables/0/value' } })
    expect(wrapper.findComponent(editor).exists()).toBe(false)
    await wrapper.setProps({ modelValue: false })
    await wrapper.setProps({ modelValue: true })
    expect(wrapper.get('textarea').element.value).toBe('')
    wrapper.unmount()
  })

  it('adds an Operation-owned collection child through the persistence boundary', async () => {
    const target = { modelType: 'SubmodelElementCollection', value: [] as unknown[] }
    const persistence = { operationPath: '/operations/test', locator: ['inputVariables', 0, 'value'] }
    mocks.mutate.mockImplementation(async (_boundary, action) => {
      action({ target })
      return { success: true }
    })
    const wrapper = mount(OperationOwnedJsonInsert, { props: {
      modelValue: false, parentElement: { ...target, persistence },
    }, global })
    await wrapper.setProps({ modelValue: true })
    await wrapper.get('textarea').setValue(JSON.stringify(property))
    await wrapper.findAll('button').find(button => button.text() === 'Add SubmodelElement')!.trigger('click')
    await flushPromises()
    expect(target.value).toEqual([property])
    expect(mocks.mutate.mock.calls[0][0]).toEqual(persistence)
    expect(mocks.push).toHaveBeenCalledWith({ query: { path: '/operations/test', fragment: '/inputVariables/0/value/value/0' } })
    expect(wrapper.findComponent(editor).exists()).toBe(false)
    wrapper.unmount()
  })
})
