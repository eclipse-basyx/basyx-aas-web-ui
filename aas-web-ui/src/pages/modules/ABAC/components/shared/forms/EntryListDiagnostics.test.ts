import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import AttributeListEditor from './AttributeListEditor.vue'
import ObjectListEditor from './ObjectListEditor.vue'

vi.mock('../../../i18n/useAbacI18n', () => ({ useAbacI18n: () => ({ t: (key: string) => key, i18nData: () => ({}) }) }))

describe('entry list diagnostics', () => {
  it.each([
    { component: AttributeListEditor, kind: 'CLAIM', field: 'CLAIM' },
    { component: ObjectListEditor, kind: 'ROUTE', field: 'ROUTE' },
  ] as const)('marks only the affected value in $kind rows and clears resolved diagnostics', async ({ component, kind, field }) => {
    const entries = [{ kind, value: 'first' }, { kind, value: 'second' }]
    const wrapper = mount(component as typeof AttributeListEditor, {
      props: { modelValue: entries as never, warningPaths: [['1', field]] },
      global: {
        stubs: {
          VRow: { template: '<div><slot /></div>' },
          VCol: { template: '<div><slot /></div>' },
          VSelect: { props: ['prefix'], template: '<div />' },
          TextInput: { name: 'TextInput', props: ['baseColor', 'error', 'messages'], template: '<input />' },
          AbacHelp: true,
          VIcon: true,
          VDivider: true,
          VTooltip: true,
          VBtn: true,
        },
      },
    })
    try {
      const fields = () => wrapper.findAllComponents({ name: 'TextInput' })
      expect(fields()).toHaveLength(2)
      expect(fields()[0]!.props('baseColor')).toBeUndefined()
      expect(fields()[1]!.props('baseColor')).toBe('warning')
      expect(fields()[1]!.props('messages')).toEqual(['forms.validation.fieldWarning'])
      expect(wrapper.find('[role="img"]').exists()).toBe(false)
      await wrapper.setProps({ errorPaths: [['1', field]] })
      expect(fields()[1]!.props('error')).toBe(true)
      expect(fields()[1]!.props('baseColor')).toBeUndefined()
      expect(fields()[1]!.props('messages')).toEqual(['forms.validation.fieldError'])
      await wrapper.setProps({ errorPaths: [], warningPaths: [] })
      expect(fields()[1]!.props('error')).toBe(false)
      expect(wrapper.find('[role="img"]').exists()).toBe(false)
      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
      expect(entries.map(entry => entry.value)).toEqual(['first', 'second'])
    } finally {
      wrapper.unmount()
    }
  })
})
