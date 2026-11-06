import { shallowMount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import PolicyValidationDialog from '../policy/detail/PolicyValidationDialog.vue'
import AbacConfigurator from './AbacConfigurator.vue'

vi.mock('@/store/NavigationStore', () => ({ useNavigationStore: () => ({ dispatchSnackbar: vi.fn() }) }))
vi.mock('../../hooks/navigation/useAbacNavigation', () => ({ useAbacNavigation: () => ({ isMobile: ref(false) }) }))
vi.mock('../../stores/useAbacConfigStore', () => ({ useAbacConfigStore: () => ({ language: 'en' }) }))
vi.mock('../../i18n/useAbacI18n', () => ({ useAbacI18n: () => ({ t: (key: string) => key, i18nData: () => ({}) }) }))

const global = {
  renderStubDefaultSlot: true,
  stubs: { VBtn: { emits: ['click'], template: '<button @click="$emit(\'click\')"><slot /></button>' } },
}

describe('secondary dialog accessible close controls', () => {
  it('names the settings Close button and closes its dialog', async () => {
    const wrapper = shallowMount(AbacConfigurator, { global })
    try {
      await wrapper.get('button[aria-label="config.title"]').trigger('click')
      expect(wrapper.findComponent({ name: 'VDialog' }).props('modelValue')).toBe(true)
      await wrapper.get('button[aria-label="config.cancel"]').trigger('click')
      expect(wrapper.findComponent({ name: 'VDialog' }).props('modelValue')).toBe(false)
    } finally {
      wrapper.unmount()
    }
  })

  it('names the validation dialog and its Close button', async () => {
    const wrapper = shallowMount(PolicyValidationDialog, { global })
    try {
      wrapper.vm.open({ valid: true })
      await nextTick()
      expect(wrapper.findComponent({ name: 'VDialog' }).attributes('aria-label')).toBe('policies.policy.validationDialog.title')
      await wrapper.get('button[aria-label="policies.policy.validationDialog.close"]').trigger('click')
      expect(wrapper.findComponent({ name: 'VDialog' }).props('modelValue')).toBe(false)
    } finally {
      wrapper.unmount()
    }
  })
})
