import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import SubmodelElementDraftForm from '@/components/EditorComponents/SubmodelElementDraftForm.vue'
import SubmodelElementForm from '@/components/EditorComponents/SubmodelElementForm.vue'

vi.mock('vue-router', () => ({
  useRoute: () => ({ query: {} }),
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('@/composables/Client/SMRepositoryClient', () => ({
  useSMRepositoryClient: () => ({
    fetchSme: vi.fn(),
    postSubmodelElement: vi.fn(),
    putSubmodelElement: vi.fn(),
  }),
}))

vi.mock('@/store/NavigationStore', () => ({
  useNavigationStore: () => ({
    dispatchSnackbar: vi.fn(),
    dispatchTriggerTreeviewReload: vi.fn(),
  }),
}))

const slotStub = { template: '<div><slot /></div>' }

describe('SubmodelElement dialog lifecycle', () => {
  it('hands the selected type off after the type picker closes', async () => {
    const wrapper = mount(SubmodelElementForm, {
      props: { modelValue: true, parentElement: { modelType: 'Submodel' } },
      global: {
        stubs: {
          'v-dialog': slotStub,
          'v-card': slotStub,
          'v-card-title': slotStub,
          'v-card-actions': slotStub,
          'v-divider': true,
          'v-spacer': true,
          'v-combobox': { props: ['modelValue'], template: '<div />' },
          'v-btn': { template: '<button><slot /></button>' },
        },
      },
    })

    await wrapper.findAll('button').find(button => button.text() === 'Next')!.trigger('click')
    await flushPromises()

    expect(wrapper.emitted('update:model-value')?.at(-1)).toEqual([false])
    expect(wrapper.emitted('open-create-sme-dialog')).toHaveLength(1)
  })

  it('reports cancellation so the pending parent can be cleared', async () => {
    const wrapper = mount(SubmodelElementForm, {
      props: { modelValue: true, parentElement: { modelType: 'Operation' } },
      global: {
        stubs: {
          'v-dialog': slotStub,
          'v-card': slotStub,
          'v-card-title': slotStub,
          'v-card-actions': slotStub,
          'v-divider': true,
          'v-spacer': true,
          'v-combobox': { template: '<div />' },
          'v-btn': { template: '<button><slot /></button>' },
        },
      },
    })

    await wrapper.findAll('button').find(button => button.text() === 'Cancel')!.trigger('click')

    expect(wrapper.emitted('cancelled')).toHaveLength(1)
  })

  it('initializes a detached form that mounts with modelValue already true', async () => {
    const wrapper = mount(SubmodelElementDraftForm, {
      props: {
        modelValue: true,
        modelType: 'Property',
        isNew: true,
        detached: true,
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
          'v-expansion-panels': slotStub,
          'v-expansion-panel': slotStub,
          'v-expansion-panel-title': slotStub,
          'v-expansion-panel-text': slotStub,
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

    expect(wrapper.text()).toContain('Create Property')
  })

  it('keeps a detached draft open until the parent confirms persistence', async () => {
    const wrapper = mount(SubmodelElementDraftForm, {
      props: {
        modelValue: true,
        modelType: 'Property',
        isNew: true,
        detached: true,
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
    ;(wrapper.vm as any).draft.idShort = 'value'

    await (wrapper.vm as any).save()
    const savedEvent = wrapper.emitted('saved')?.at(-1)

    expect(savedEvent).toBeDefined()
    expect(typeof savedEvent?.[1]).toBe('function')
    expect((wrapper.vm as any).saving).toBe(true)
    expect(wrapper.emitted('update:model-value')?.at(-1)).not.toEqual([false])

    const complete = savedEvent?.[1] as ((success: boolean, messages?: string[]) => void) | undefined
    complete?.(false, ['The owning Operation changed.'])
    await flushPromises()

    expect((wrapper.vm as any).saving).toBe(false)
    expect(wrapper.text()).toContain('The owning Operation changed.')
    expect(wrapper.emitted('update:model-value')?.at(-1)).not.toEqual([false])
  })
})
