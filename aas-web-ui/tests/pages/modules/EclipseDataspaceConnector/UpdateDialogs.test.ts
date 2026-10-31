import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import UpdateAssetDialog from '@/pages/modules/EclipseDataspaceConnector/components/Assets/Dialogs/UpdateAssetDialog.vue'
import UpdateContractDialog from '@/pages/modules/EclipseDataspaceConnector/components/Contracts/Dialogs/UpdateContractDialog.vue'
import UpdatePolicyDialog from '@/pages/modules/EclipseDataspaceConnector/components/Policies/Dialogs/UpdatePolicyDialog.vue'

vi.mock('@/composables/Client/CatenaXEdcClient', () => ({
  useCatenaXEdcClient: () => ({
    updateAsset: vi.fn(),
    updateContractDefinition: vi.fn(),
    updatePolicyDefinition: vi.fn(),
  }),
}))

vi.mock('@/store/NavigationStore', () => ({
  useNavigationStore: () => ({
    getSnackbar: { status: false },
    dispatchSnackbar: vi.fn(),
  }),
}))

const slotStub = { template: '<div><slot /></div>' }

const dialogs = [
  {
    name: 'UpdateAssetDialog',
    component: UpdateAssetDialog,
    prop: 'asset',
    entity: { '@id': 'asset-1', 'properties': { name: 'Asset 1' }, 'dataAddress': { type: 'HttpData' } },
  },
  {
    name: 'UpdateContractDialog',
    component: UpdateContractDialog,
    prop: 'contract',
    entity: { '@id': 'contract-1', 'accessPolicyId': 'access-1', 'contractPolicyId': 'usage-1', 'assetsSelector': [] },
  },
  {
    name: 'UpdatePolicyDialog',
    component: UpdatePolicyDialog,
    prop: 'policy',
    entity: { '@id': 'policy-1', 'policy': { '@type': 'Set', 'permission': [] } },
  },
]

async function openDialog (component: any, prop: string, entity: Record<string, unknown>) {
  const wrapper = mount(component, {
    props: { modelValue: false, [prop]: entity },
    global: {
      stubs: {
        'v-dialog': slotStub,
        'v-sheet': slotStub,
        'v-card-title': slotStub,
        'v-card-text': slotStub,
        'v-card-actions': slotStub,
        'v-alert': slotStub,
        'v-tooltip': true,
        'v-divider': true,
        'v-spacer': true,
        'v-btn': { props: ['text', 'disabled'], template: '<button :disabled="disabled">{{ text }}</button>' },
      },
    },
  })
  // The editor is filled with the entity when the dialog opens
  await wrapper.setProps({ modelValue: true })
  await flushPromises()
  return wrapper
}

describe.each(dialogs)('$name', ({ component, prop, entity }) => {
  it('enables Update only after the content of the JSON changed', async () => {
    const wrapper = await openDialog(component, prop, entity)
    const updateButton = () => wrapper.findAll('button').find(button => button.text() === 'Update')!
    const editor = wrapper.find('pre.editor-content')
    const editJson = async (text: string) => {
      editor.element.textContent = text
      await editor.trigger('input')
    }

    expect(updateButton().attributes('disabled')).toBeDefined()

    // Formatting alone is no change
    await editJson(JSON.stringify(entity))
    expect(updateButton().attributes('disabled')).toBeDefined()

    await editJson(JSON.stringify({ ...entity, changed: true }, null, 2))
    expect(updateButton().attributes('disabled')).toBeUndefined()

    await editJson(JSON.stringify(entity, null, 2))
    expect(updateButton().attributes('disabled')).toBeDefined()
  })
})
