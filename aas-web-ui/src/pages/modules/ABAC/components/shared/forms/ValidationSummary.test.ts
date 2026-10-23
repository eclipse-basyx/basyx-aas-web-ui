import { mount, shallowMount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { createVuetify } from 'vuetify'
import { VAlert, VExpansionPanel, VExpansionPanels, VExpansionPanelText, VExpansionPanelTitle, VIcon } from 'vuetify/components'
import ValidationSummary from './ValidationSummary.vue'

vi.mock('../../../i18n/useAbacI18n', () => ({ useAbacI18n: () => ({ t: (key: string) => key }) }))

describe('validation summary severity', () => {
  it('uses a collapsed Vuetify panel for technical details and keeps the overview visible', async () => {
    const wrapper = mount(ValidationSummary, {
      props: { advisory: true, error: { title: 'Schema issue', summary: ['Check the value format'], messages: ['FORMULA.$eq.0.$strVal: Invalid format'] } },
      global: { plugins: [createVuetify({ components: { VAlert, VExpansionPanel, VExpansionPanels, VExpansionPanelText, VExpansionPanelTitle, VIcon } })] },
    })
    try {
      const toggle = wrapper.get('button[aria-expanded]')
      expect(toggle.attributes('aria-expanded')).toBe('false')
      expect(wrapper.text()).toContain('Check the value format')
      expect(wrapper.text()).not.toContain('FORMULA.$eq.0.$strVal')
      await toggle.trigger('click')
      expect(toggle.attributes('aria-expanded')).toBe('true')
      expect(wrapper.text()).toContain('FORMULA.$eq.0.$strVal')
      await wrapper.setProps({ advisory: false })
      expect(wrapper.find('button[aria-expanded]').exists()).toBe(false)
      expect(wrapper.text()).toContain('FORMULA.$eq.0.$strVal')
    } finally {
      wrapper.unmount()
    }
  })
  it('presents non-blocking diagnostics as a warning with a saving explanation', async () => {
    const wrapper = shallowMount(ValidationSummary, {
      props: { advisory: true, error: { title: 'Schema issue', messages: ['Choose an operand'] } },
      global: { renderStubDefaultSlot: true },
    })
    try {
      const alert = wrapper.get('v-alert-stub')
      expect(alert.attributes('type')).toBe('warning')
      expect(alert.attributes('role')).toBe('status')
      expect(wrapper.text()).toContain('forms.validation.advisoryHint')
      expect(wrapper.text()).toContain('Choose an operand')
      await wrapper.setProps({ advisory: false, error: { title: 'Save failed' } })
      expect(alert.attributes('type')).toBe('error')
      expect(alert.attributes('role')).toBe('alert')
      expect(wrapper.text()).toContain('Save failed')
      expect(wrapper.text()).not.toContain('forms.validation.advisoryHint')
    } finally {
      wrapper.unmount()
    }
  })
})
