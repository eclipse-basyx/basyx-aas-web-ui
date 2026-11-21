import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import DeleteEdcResourceDialog from '@/pages/modules/EclipseDataspaceConnector/components/Shared/DeleteEdcResourceDialog.vue'

const mocks = vi.hoisted(() => ({
  dispatchSnackbar: vi.fn(),
}))

vi.mock('@/store/NavigationStore', () => ({
  useNavigationStore: () => ({
    getSnackbar: { status: false },
    dispatchSnackbar: mocks.dispatchSnackbar,
  }),
}))

const slotStub = { template: '<div><slot /></div>' }
const policy = { '@id': 'policy-1' }

function mountDialog (deleteResource = vi.fn()) {
  const wrapper = mount(DeleteEdcResourceDialog, {
    props: { 'modelValue': true, 'onUpdate:modelValue': (value: boolean) => wrapper.setProps({ modelValue: value }), 'resource': policy, 'label': 'Policy', 'delete': deleteResource },
    global: {
      stubs: {
        'v-dialog': slotStub,
        'v-sheet': slotStub,
        'v-card-title': slotStub,
        'v-card-text': slotStub,
        'v-card-actions': slotStub,
        'v-alert': slotStub,
        'v-divider': true,
        'v-spacer': true,
        'v-btn': { props: ['text'], template: '<button>{{ text }}</button>' },
      },
    },
  })
  return {
    wrapper,
    clickDelete: async () => {
      await wrapper.findAll('button').find(button => button.text() === 'Delete')!.trigger('click')
      await flushPromises()
    },
  }
}

describe('DeleteEdcResourceDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('names the resource to delete', () => {
    const { wrapper } = mountDialog()

    expect(wrapper.text()).toContain('Confirm Policy Deletion')
    expect(wrapper.text()).toContain('delete the Policy with the id policy-1')
  })

  it('deletes the resource and closes', async () => {
    const deleteResource = vi.fn().mockResolvedValue({ success: true })
    const { wrapper, clickDelete } = mountDialog(deleteResource)

    await clickDelete()

    expect(deleteResource).toHaveBeenCalledWith('default', 'policy-1')
    expect(wrapper.emitted('deleted')).toHaveLength(1)
    expect(wrapper.props('modelValue')).toBe(false)
    expect(mocks.dispatchSnackbar).not.toHaveBeenCalled()
  })

  it('shows the failure and stays open', async () => {
    const deleteResource = vi.fn().mockResolvedValue({ success: false, status: 404 })
    const { wrapper, clickDelete } = mountDialog(deleteResource)

    await clickDelete()

    expect(mocks.dispatchSnackbar).toHaveBeenCalledWith(expect.objectContaining({
      baseError: 'Failed to delete Policy.',
      extendedError: 'The Policy does not exist (anymore).',
    }))
    expect(wrapper.emitted('deleted')).toBeUndefined()
    expect(wrapper.props('modelValue')).toBe(true)
  })
})
