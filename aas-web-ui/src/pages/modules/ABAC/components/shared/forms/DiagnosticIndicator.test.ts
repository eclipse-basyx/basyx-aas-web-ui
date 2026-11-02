import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import DiagnosticIndicator from './DiagnosticIndicator.vue'

vi.mock('../../../i18n/useAbacI18n', () => ({ useAbacI18n: () => ({ t: (key: string) => key }) }))

describe('row diagnostic fallback', () => {
  it.each(['error', 'warning'] as const)('provides hover/focus guidance for %s indicators', severity => {
    const wrapper = mount(DiagnosticIndicator, {
      props: { severity },
      global: { stubs: { VIcon: true, VTooltip: { template: '<div><slot name="activator" :props="{}" /><slot /></div>' } } },
    })
    try {
      const text = severity === 'error' ? 'forms.validation.fieldError' : 'forms.validation.fieldWarning'
      expect(wrapper.get('[role="img"]').attributes('aria-label')).toBe(text)
      expect(wrapper.text()).toContain(text)
    } finally {
      wrapper.unmount()
    }
  })
})
