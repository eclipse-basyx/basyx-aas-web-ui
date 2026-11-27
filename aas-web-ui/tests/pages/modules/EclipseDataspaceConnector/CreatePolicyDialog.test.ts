import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createVuetify } from 'vuetify'
import CreatePolicyDialog from '@/pages/modules/EclipseDataspaceConnector/components/Policies/Dialogs/CreatePolicyDialog.vue'
import { formStub } from '../../../helpers/vuetifyStubs'

const mocks = vi.hoisted(() => ({
  createPolicyDefinition: vi.fn(),
  dispatchSnackbar: vi.fn(),
}))

vi.mock('@/composables/Client/CatenaXEdcClient', () => ({
  useCatenaXEdcClient: () => ({ createPolicyDefinition: mocks.createPolicyDefinition }),
}))

vi.mock('@/store/NavigationStore', () => ({
  useNavigationStore: () => ({ getSnackbar: { status: false }, dispatchSnackbar: mocks.dispatchSnackbar }),
}))

const slotStub = { template: '<div><slot /><slot name="append" /></div>' }
// Monaco doesn't load in jsdom; like CodeViewer, the stub emits only edits by hand, not changes of text
const codeViewerStub = {
  props: ['text', 'invalid', 'readOnly'],
  emits: ['update:text'],
  template: '<textarea class="code-editor" :value="text" @input="$emit(\'update:text\', $event.target.value)" />',
}

// Selects a template by its value, like choosing it in the list
const templateSelectStub = {
  props: ['modelValue', 'disabled'],
  emits: ['update:modelValue'],
  template: '<select class="template" :disabled="disabled" :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)"><option value="" /><option value="bpn" /></select>',
}

function mountDialog (fromTemplate = false) {
  return mount(CreatePolicyDialog, {
    props: { modelValue: true, proxyId: 'proxy-a', fromTemplate },
    attachTo: document.body,
    global: {
      // The v-tooltip directive of the title mounts a real Vuetify tooltip
      plugins: [createVuetify()],
      stubs: {
        'v-dialog': slotStub,
        'v-sheet': slotStub,
        'v-card-title': slotStub,
        'v-card-text': slotStub,
        'v-card-actions': slotStub,
        'v-form': formStub,
        'v-alert': { props: ['text'], template: '<div class="alert">{{ text }}<slot /><slot name="append" /></div>' },
        'v-divider': true,
        'v-spacer': true,
        'v-tooltip': true,
        'v-icon': true,
        'v-select': { props: ['disabled'], template: '<select class="type" :disabled="disabled" />' },
        'v-text-field': {
          props: ['modelValue', 'label', 'disabled'],
          emits: ['update:modelValue'],
          template: '<input :data-label="label" :disabled="disabled" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)">',
        },
        'v-btn': { props: ['text', 'disabled'], emits: ['click'], template: '<button :disabled="disabled" @click="$emit(\'click\')">{{ text }}</button>' },
        'CodeViewer': codeViewerStub,
        ...(fromTemplate ? { EdcTemplateSelect: templateSelectStub } : {}),
      },
    },
  })
}

function editorText (wrapper: ReturnType<typeof mountDialog>): string {
  return (wrapper.find('textarea.code-editor').element as HTMLTextAreaElement).value
}

async function editByHand (wrapper: ReturnType<typeof mountDialog>, change: (policy: any) => void): Promise<void> {
  expect(wrapper.findComponent(codeViewerStub).props('readOnly')).toBe(false)
  const policy = JSON.parse(editorText(wrapper))
  change(policy)
  await wrapper.find('textarea.code-editor').setValue(JSON.stringify(policy, null, 2))
  await flushPromises()
}

describe('CreatePolicyDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.createPolicyDefinition.mockResolvedValue({ success: true, data: { '@id': 'policy-1', 'createdAt': 1 } })
  })

  it('keeps manual edits when a field changes, until the policy is reset to the template', async () => {
    const wrapper = mountDialog()
    await flushPromises()
    await wrapper.find('input[data-label="Policy ID"]').setValue('policy-1')
    await flushPromises()
    expect(JSON.parse(editorText(wrapper))['@id']).toBe('policy-1')

    await editByHand(wrapper, policy => {
      policy.policy.permission[0].constraint = { leftOperand: 'BusinessPartnerNumber', operator: 'eq', rightOperand: 'BPNL000000000001' }
    })

    // The fields are locked and no longer rebuild the policy
    expect(wrapper.find('input[data-label="Policy ID"]').attributes('disabled')).toBeDefined()
    expect(wrapper.find('select.type').attributes('disabled')).toBeDefined()
    expect(wrapper.text()).toContain('The policy was edited by hand')
    // A field change, e.g. sent before the field was locked, doesn't rebuild it either
    const policyIdField = wrapper.findComponent('input[data-label="Policy ID"]') as VueWrapper
    policyIdField.vm.$emit('update:modelValue', 'policy-2')
    await flushPromises()
    expect(JSON.parse(editorText(wrapper)).policy.permission[0].constraint.rightOperand).toBe('BPNL000000000001')

    await wrapper.findAll('button').find(button => button.text() === 'Create')!.trigger('click')
    await flushPromises()
    expect(mocks.createPolicyDefinition.mock.calls[0]![1].policy.permission[0].constraint.rightOperand).toBe('BPNL000000000001')
    wrapper.unmount()
  })

  it('rebuilds the policy from the fields after a reset to the template', async () => {
    const wrapper = mountDialog()
    await flushPromises()
    await wrapper.find('input[data-label="Policy ID"]').setValue('policy-1')
    await flushPromises()
    await editByHand(wrapper, policy => {
      policy['@id'] = 'edited-by-hand'
    })

    await wrapper.findAll('button').find(button => button.text() === 'Reset to Template')!.trigger('click')
    await flushPromises()

    expect(JSON.parse(editorText(wrapper))['@id']).toBe('policy-1')
    expect(wrapper.find('input[data-label="Policy ID"]').attributes('disabled')).toBeUndefined()
    wrapper.unmount()
  })

  it('cannot create a policy with unfilled placeholders, also after editing it by hand', async () => {
    const wrapper = mountDialog()
    await flushPromises()
    const createButton = () => wrapper.findAll('button').find(button => button.text() === 'Create')!

    expect(editorText(wrapper)).toContain('{{Policy ID}}')
    expect(createButton().attributes('disabled')).toBeDefined()

    await editByHand(wrapper, policy => {
      policy.policy.extra = 'x'
    })
    expect(createButton().attributes('disabled')).toBeDefined()

    await editByHand(wrapper, policy => {
      policy['@id'] = 'policy-by-hand'
    })
    expect(createButton().attributes('disabled')).toBeUndefined()
    wrapper.unmount()
  })

  it('creates a policy from a chosen template', async () => {
    const wrapper = mountDialog(true)
    await flushPromises()
    expect(wrapper.find('textarea.code-editor').exists()).toBe(false)

    await wrapper.find('select.template').setValue('bpn')
    await flushPromises()
    await wrapper.find('input[data-label="Policy ID"]').setValue('policy-bpn')
    await wrapper.find('input[data-label="BPN"]').setValue('BPNL000000000001')
    await flushPromises()

    await wrapper.findAll('button').find(button => button.text() === 'Create')!.trigger('click')
    await flushPromises()
    const policy = mocks.createPolicyDefinition.mock.calls[0]![1]
    expect(policy['@id']).toBe('policy-bpn')
    expect(JSON.stringify(policy)).toContain('BPNL000000000001')
    expect(wrapper.emitted('policy-created')).toEqual([['policy-1']])
    wrapper.unmount()
  })
})
