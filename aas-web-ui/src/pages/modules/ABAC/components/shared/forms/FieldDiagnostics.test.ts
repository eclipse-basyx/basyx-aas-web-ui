import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { createVuetify } from 'vuetify'
import { VCombobox, VSelect, VTextField } from 'vuetify/components'
import DefinitionForm from '../../definition/form/DefinitionForm.vue'
import AclForm from './AclForm.vue'
import FormulaEditor from './FormulaEditor.vue'
import OperandEditor from './OperandEditor.vue'

vi.mock('../../../hooks/forms/useDefinitionNames', () => ({ useDefinitionNames: () => [] }))
vi.mock('../../../i18n/useAbacI18n', () => ({ useAbacI18n: () => ({ t: (key: string) => key, i18nData: () => ({}) }) }))

const global = {
  plugins: [createVuetify()],
  components: { VCombobox, VSelect, VTextField },
  stubs: { FieldRow: { template: '<div><slot /></div>' }, FormSectionHeading: true },
}

function expectDescription (input: HTMLInputElement, text: string) {
  const ids = input.getAttribute('aria-describedby')?.split(' ') ?? []
  expect(ids.length).toBeGreaterThan(0)
  expect(ids.map(id => Array.from(document.querySelectorAll('[id]')).find(element => element.id === id)?.textContent).join(' ')).toContain(text)
}

describe('leaf field diagnostics', () => {
  it('routes numeric operand warnings through legacy NE and nested NOT, with error precedence and clearing', async () => {
    const wrapper = mount(FormulaEditor, {
      attachTo: document.body,
      props: {
        modelValue: { kind: 'not', operand: { kind: 'not', operand: {
          kind: 'comparison', operator: 'ne',
          left: { source: 'literal', literalOption: 'numVal', value: '' },
          right: { source: 'literal', literalOption: 'strVal', value: 'admin' },
        } } },
        warningPaths: [['$not', '$not', '$ne', '0', '$numVal']],
      }, global,
    })
    try {
      await nextTick()
      const numeric = () => wrapper.get('input[type="number"]').element as HTMLInputElement
      expect(wrapper.findAllComponents(OperandEditor)[0]!.props('warningPaths')).toEqual([['$numVal']])
      expectDescription(numeric(), 'forms.validation.fieldWarning')
      expect(wrapper.findAllComponents(VTextField).find(field => field.props('type') === 'number')!.props('baseColor')).toBe('warning')
      await wrapper.setProps({ errorPaths: [['$not', '$not', '$ne', '0', '$numVal']] })
      expect(numeric().getAttribute('aria-invalid')).toBe('true')
      expectDescription(numeric(), 'forms.validation.fieldError')
      await wrapper.setProps({ errorPaths: [], warningPaths: [] })
      expect(numeric().getAttribute('aria-invalid')).toBe('false')
      expect(wrapper.text()).not.toContain('forms.validation.fieldError')
      expect(wrapper.text()).not.toContain('forms.validation.fieldWarning')
    } finally {
      wrapper.unmount()
    }
  })

  it('marks ACL access and rights independently and associates messages with their inputs', async () => {
    const wrapper = mount(AclForm, {
      attachTo: document.body,
      props: { modelValue: { access: 'ALLOW', rights: ['INVALID'] }, warningPaths: [['RIGHTS', '0']], errorPaths: [['ACCESS']] },
      global: { ...global, stubs: { ...global.stubs, AttributeListEditor: true } },
    })
    try {
      await nextTick()
      const access = wrapper.get('input[aria-label="forms.acl.access"]').element as HTMLInputElement
      const rights = wrapper.get('input[aria-label="forms.acl.rights"]').element as HTMLInputElement
      expect(access.getAttribute('aria-invalid')).toBe('true')
      expectDescription(access, 'forms.validation.fieldError')
      expectDescription(rights, 'forms.validation.fieldWarning')
    } finally {
      wrapper.unmount()
    }
  })

  it('marks object-definition references at the combobox', async () => {
    const wrapper = mount(DefinitionForm, {
      attachTo: document.body,
      props: { kind: 'objects', doc: { USEOBJECTS: ['unknown'] }, warningPaths: [['USEOBJECTS', '0']] }, global,
    })
    try {
      await nextTick()
      const field = wrapper.findComponent(VCombobox)
      expect(field.props('baseColor')).toBe('warning')
      expectDescription(field.get('input[role="combobox"]').element as HTMLInputElement, 'forms.validation.fieldWarning')
    } finally {
      wrapper.unmount()
    }
  })
})

it.each(['acl', 'definition'] as const)('keeps reference diagnostics readable in the %s form', async kind => {
  const props = kind === 'acl'
    ? { modelValue: { useAttributes: 'unknown' }, warningPaths: [['USEATTRIBUTES']] }
    : { kind: 'attributes', doc: { USEATTRIBUTES: ['unknown'] }, warningPaths: [['USEATTRIBUTES']] }
  const wrapper = kind === 'acl'
    ? mount(AclForm, { attachTo: document.body, props: props as never, global })
    : mount(DefinitionForm, { attachTo: document.body, props: props as never, global })
  try {
    const field = wrapper.findAllComponents(VCombobox).find(input => input.props('label') === (kind === 'acl' ? 'forms.acl.useAttributes' : 'forms.attributes.references'))!
    expect(field.props('baseColor')).toBe('warning')
    expectDescription(field.get('input[role="combobox"]').element as HTMLInputElement, 'forms.validation.fieldWarning')
    await wrapper.setProps({ errorPaths: [['USEATTRIBUTES']] })
    expect(field.props('error')).toBe(true)
    expectDescription(field.get('input[role="combobox"]').element as HTMLInputElement, 'forms.validation.fieldError')
    await wrapper.setProps({ errorPaths: [], warningPaths: [] })
    expect(field.props('error')).toBe(false)
    expect(field.props('baseColor')).toBeUndefined()
  } finally {
    wrapper.unmount()
  }
})
