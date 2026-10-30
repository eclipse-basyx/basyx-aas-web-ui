import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { FORM_DIAGNOSTICS_KEY } from '../../../constants/inject'
import FormGroup from './FormGroup.vue'

vi.mock('../../../i18n/useAbacI18n', () => ({ useAbacI18n: () => ({ t: (key: string, params?: { count: number }) => params ? `and ${params.count} more` : key }) }))

describe('section diagnostic tooltip', () => {
  it('shows up to three messages plus the remaining count for its own section', () => {
    const wrapper = mount(FormGroup, {
      props: { value: 'filter', title: 'Advanced', warning: true, diagnosticKeys: ['FILTER'] },
      global: {
        provide: { [FORM_DIAGNOSTICS_KEY as symbol]: computed(() => ({ advisory: { title: 'Warning', issues: [
          ...['First', 'Second', 'Third', 'Fourth'].map(message => ({ path: ['FILTER', 'FRAGMENT'], message })),
          { path: ['ACL'], message: 'Unrelated' },
        ] } })) },
        stubs: {
          VExpansionPanel: { template: '<div><slot /></div>' },
          VExpansionPanelTitle: { template: '<div><slot /></div>' },
          VExpansionPanelText: true,
          VTooltip: { template: '<div><slot name="activator" :props="{}" /><slot /></div>' },
          VIcon: true,
        },
      },
    })
    try {
      expect(wrapper.get('[role="img"]').attributes('aria-label')).toBe('First\nSecond\nThird\nand 1 more')
      expect(wrapper.text()).not.toContain('Unrelated')
      expect(wrapper.text()).not.toContain('Fourth')
    } finally {
      wrapper.unmount()
    }
  })
})
