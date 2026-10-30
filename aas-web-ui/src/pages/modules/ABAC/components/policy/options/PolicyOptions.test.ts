import type { PolicyVersion } from '../../../types/policy'
import { flushPromises, shallowMount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import PolicyOptions from './PolicyOptions.vue'

const calls = vi.hoisted(() => ({ validate: vi.fn(), snackbar: vi.fn(), open: vi.fn(), download: vi.fn() }))
vi.mock('@/store/NavigationStore', () => ({ useNavigationStore: () => ({ dispatchSnackbar: calls.snackbar }) }))
vi.mock('@/composables/ClipboardUtil', () => ({ useClipboardUtil: () => ({ copyJsonToClipboard: vi.fn() }) }))
vi.mock('@/utils/generalUtils', () => ({ downloadJson: calls.download }))
vi.mock('../../../api/policy/useValidatePolicy', () => ({ useValidatePolicy: () => ({ mutateAsync: calls.validate }) }))
vi.mock('../../../api/policy/useActivatePolicy', () => ({ useActivatePolicy: () => ({ mutateAsync: vi.fn() }) }))
vi.mock('../../../api/policy/useCloneVersion', () => ({ useCloneVersion: () => ({ mutateAsync: vi.fn() }) }))
vi.mock('../../../api/policy/useRejectPolicy', () => ({ useRejectPolicy: () => ({ mutateAsync: vi.fn() }) }))
vi.mock('../../../hooks/navigation/useAbacNavigation', () => ({ useAbacNavigation: () => ({ onSelectPolicy: vi.fn() }) }))
vi.mock('../../../i18n/useAbacI18n', () => ({ useAbacI18n: () => ({ t: (key: string) => key }) }))

const ValidationDialog = defineComponent({ setup (_, { expose }) {
  expose({ open: calls.open })
  return () => null
} })

function mountOptions () {
  return shallowMount(PolicyOptions, {
    props: { policy: { version_id: 7, status: 'staged' } as PolicyVersion },
    global: { stubs: {
      ActionMenu: { template: '<div><slot /></div>' },
      ActionMenuItem: { props: ['label'], template: '<button @click="$emit(\'click\')">{{ label }}</button>' },
      PolicyValidationDialog: ValidationDialog,
    } },
  })
}

describe('policy action feedback', () => {
  beforeEach(() => vi.resetAllMocks())

  it.each([false, true])('shows the validation result without a competing success toast: valid=%s', async valid => {
    const result = { valid }
    calls.validate.mockResolvedValue(result)
    const wrapper = mountOptions()
    try {
      await wrapper.findAll('button').find(button => button.text() === 'policies.policy.validate')!.trigger('click')
      await flushPromises()
      expect(calls.open).toHaveBeenCalledWith(result)
      expect(calls.snackbar).not.toHaveBeenCalled()
    } finally {
      wrapper.unmount()
    }
  })

  it('still reports a failed validation request', async () => {
    calls.validate.mockRejectedValue(new Error('offline'))
    const wrapper = mountOptions()
    try {
      await wrapper.findAll('button').find(button => button.text() === 'policies.policy.validate')!.trigger('click')
      await flushPromises()
      expect(calls.open).not.toHaveBeenCalled()
      expect(calls.snackbar).toHaveBeenCalledWith(expect.objectContaining({ color: 'error', text: 'policies.policy.error.validate' }))
    } finally {
      wrapper.unmount()
    }
  })

  it('reports a failed download through its dedicated message', async () => {
    calls.download.mockImplementation(() => {
      throw new Error('download failed')
    })
    const wrapper = mountOptions()
    try {
      await wrapper.findAll('button').find(button => button.text() === 'policies.policy.download')!.trigger('click')
      expect(calls.snackbar).toHaveBeenCalledWith(expect.objectContaining({ color: 'error', text: 'policies.policy.error.download' }))
    } finally {
      wrapper.unmount()
    }
  })
})
