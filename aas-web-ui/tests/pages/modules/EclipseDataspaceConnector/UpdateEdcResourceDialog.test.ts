import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import UpdateEdcResourceDialog from '@/pages/modules/EclipseDataspaceConnector/components/Shared/UpdateEdcResourceDialog.vue'

vi.mock('@/store/NavigationStore', () => ({
  useNavigationStore: () => ({
    getSnackbar: { status: false },
    dispatchSnackbar: vi.fn(),
  }),
}))

const slotStub = { template: '<div><slot /></div>' }

const asset = { '@id': 'asset-1', 'properties': { name: 'Asset 1' }, 'dataAddress': { type: 'HttpData' } }

async function openDialog (update = vi.fn()) {
  const wrapper = mount(UpdateEdcResourceDialog, {
    props: { 'modelValue': false, 'onUpdate:modelValue': (value: boolean) => wrapper.setProps({ modelValue: value }), 'resource': asset, 'label': 'Asset', update },
    global: {
      stubs: {
        'v-dialog': slotStub,
        'v-sheet': slotStub,
        'v-card-title': slotStub,
        'v-card-text': slotStub,
        'v-card-actions': slotStub,
        'v-alert': { props: ['text'], template: '<div class="alert">{{ text }}</div>' },
        'v-tooltip': true,
        'v-divider': true,
        'v-spacer': true,
        'v-btn': { props: ['text', 'disabled'], template: '<button :disabled="disabled">{{ text }}</button>' },
      },
    },
  })
  // The editor is filled with the resource when the dialog opens
  await wrapper.setProps({ modelValue: true })
  await flushPromises()

  const editor = wrapper.find('pre.editor-content')
  return {
    wrapper,
    updateButton: () => wrapper.findAll('button').find(button => button.text() === 'Update')!,
    editJson: async (text: string) => {
      editor.element.textContent = text
      await editor.trigger('input')
    },
  }
}

describe('UpdateEdcResourceDialog', () => {
  it('enables Update only after the content of the JSON changed', async () => {
    const { updateButton, editJson } = await openDialog()

    expect(updateButton().attributes('disabled')).toBeDefined()

    // Formatting alone is no change
    await editJson(JSON.stringify(asset))
    expect(updateButton().attributes('disabled')).toBeDefined()

    await editJson(JSON.stringify({ ...asset, changed: true }, null, 2))
    expect(updateButton().attributes('disabled')).toBeUndefined()

    await editJson(JSON.stringify(asset, null, 2))
    expect(updateButton().attributes('disabled')).toBeDefined()
  })

  it('blocks a change of the @id', async () => {
    const { wrapper, updateButton, editJson } = await openDialog()

    await editJson(JSON.stringify({ ...asset, '@id': 'asset-2' }))

    expect(updateButton().attributes('disabled')).toBeDefined()
    expect(wrapper.find('.alert').text()).toContain('cannot change the ID of the Asset')
  })

  it('updates the resource with the edited JSON and closes', async () => {
    const update = vi.fn().mockResolvedValue({ success: true })
    const { wrapper, updateButton, editJson } = await openDialog(update)
    const editedAsset = { ...asset, properties: { name: 'Asset 2' } }

    await editJson(JSON.stringify(editedAsset))
    await updateButton().trigger('click')
    await flushPromises()

    expect(update).toHaveBeenCalledWith('default', 'asset-1', editedAsset)
    expect(wrapper.emitted('updated')).toHaveLength(1)
    expect(wrapper.props('modelValue')).toBe(false)
  })

  it('shows the error of the EDC if the update fails', async () => {
    const update = vi.fn().mockResolvedValue({ success: false, status: 404 })
    const { wrapper, updateButton, editJson } = await openDialog(update)

    await editJson(JSON.stringify({ ...asset, changed: true }))
    await updateButton().trigger('click')
    await flushPromises()

    expect(wrapper.emitted('updated')).toBeUndefined()
    expect(wrapper.find('.alert').text()).toBe('The Asset does not exist (anymore).')
  })
})
