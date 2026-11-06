import { shallowMount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import AttributeSourceEditor from './AttributeSourceEditor.vue'
import OperandEditor from './OperandEditor.vue'

vi.mock('../../../i18n/useAbacI18n', () => ({ useAbacI18n: () => ({ t: (key: string) => key }) }))
const Select = defineComponent({ name: 'VSelect', props: ['modelValue', 'items', 'label'], template: '<div />' })
const global = { stubs: { VSelect: Select } }

describe('operand choice restrictions', () => {
  it('preserves an existing Boolean on operator change while disabling new Boolean choices', async () => {
    const wrapper = shallowMount(OperandEditor, {
      props: { operator: 'eq', modelValue: { source: 'literal', literalOption: 'boolean', value: true }, otherOperand: { source: 'field', value: '$sm#idShort' } }, global,
    })
    try {
      await wrapper.setProps({ operator: 'gt' })
      const type = wrapper.findAllComponents(Select).find(input => input.props('label') === 'forms.expression.operand.type')!
      expect(type.props('items').find((item: { value: string }) => item.value === 'boolean').props.disabled).toBe(true)
      expect(type.props('modelValue')).toBe('boolean')
      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
      type.vm.$emit('update:modelValue', 'numVal')
      expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual([{ source: 'literal', literalOption: 'numVal', value: '' }])
    } finally {
      wrapper.unmount()
    }
  })

  it('defaults a new literal to a type compatible with the other operand and guards disallowed updates', () => {
    const wrapper = shallowMount(OperandEditor, {
      props: { operator: 'eq', modelValue: { source: 'field', value: '$sm#idShort' }, otherOperand: { source: 'literal', literalOption: 'numVal', value: 3 } }, global,
    })
    try {
      wrapper.findComponent(Select).vm.$emit('update:modelValue', 'literal')
      expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual([{ source: 'literal', literalOption: 'numVal', value: '' }])
      const before = wrapper.emitted('update:modelValue')!.length
      wrapper.findAllComponents(Select).find(input => input.props('label') === 'forms.expression.operand.kind')!.vm.$emit('update:modelValue', 'attribute')
      expect(wrapper.emitted('update:modelValue')).toHaveLength(before)
    } finally {
      wrapper.unmount()
    }
  })

  it('preserves an existing field pair while preventing new schema-invalid field selections', async () => {
    const wrapper = shallowMount(OperandEditor, {
      props: { operator: 'contains', modelValue: { source: 'field', value: '$sm#idShort' }, otherOperand: { source: 'field', value: '$sm#id' } }, global,
    })
    try {
      const source = wrapper.findComponent(Select)
      expect(source.props('items').find((item: { value: string }) => item.value === 'field').props.disabled).toBe(true)
      expect(source.props('modelValue')).toBe('field')
      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
      await wrapper.setProps({ otherOperand: { source: 'literal', literalOption: 'strVal', value: 'example' } })
      expect(source.props('items').find((item: { value: string }) => item.value === 'field').props.disabled).toBe(false)
      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    } finally {
      wrapper.unmount()
    }
  })

  it('offers field guidance while preserving custom input, clearing, and diagnostics', async () => {
    const Combobox = defineComponent({ name: 'VCombobox', props: ['modelValue', 'items', 'hint', 'messages'], template: '<div />' })
    const wrapper = shallowMount(OperandEditor, {
      props: { modelValue: { source: 'field', value: '$sm#idShort' } },
      global: { stubs: { VSelect: Select, VCombobox: Combobox, FieldRow: { template: '<div><slot /></div>' } } },
    })
    try {
      const input = wrapper.findComponent(Combobox)
      expect(input.props('items')).toContain('$sm#idShort')
      expect(input.props('hint')).toBe('forms.expression.operand.fieldHint')
      input.vm.$emit('update:modelValue', '$sme.Motor.Speed#value')
      expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual([{ source: 'field', value: '$sme.Motor.Speed#value' }])
      input.vm.$emit('update:modelValue', null)
      expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual([{ source: 'field', value: '' }])
      await wrapper.setProps({ warningPaths: [['$field']] })
      expect(input.props('hint')).toBeUndefined()
      expect(input.props('messages')).toEqual(['forms.validation.fieldWarning'])
    } finally {
      wrapper.unmount()
    }
  })

  it('filters globals in operands without restricting standalone attribute lists', async () => {
    const wrapper = shallowMount(OperandEditor, {
      props: { modelValue: { source: 'attribute', kind: 'GLOBAL', value: 'UTCNOW' }, otherOperand: { source: 'literal', literalOption: 'dateTimeVal', value: '2026-10-23T00:00:00Z' } }, global,
    })
    try {
      expect(wrapper.findComponent(AttributeSourceEditor).props('allowedGlobals')).toEqual(['LOCALNOW', 'UTCNOW', 'CLIENTNOW'])
      await wrapper.setProps({ operator: 'contains' })
      expect(wrapper.findComponent(AttributeSourceEditor).props('allowedGlobals')).toContain('ANONYMOUS')
      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    } finally {
      wrapper.unmount()
    }
  })
})
