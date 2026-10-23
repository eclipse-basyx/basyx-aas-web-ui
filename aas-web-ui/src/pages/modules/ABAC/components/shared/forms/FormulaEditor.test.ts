import type { ExpressionState } from '../../../types/forms'
import { mount, shallowMount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import FormulaEditor from './FormulaEditor.vue'
import OperandEditor from './OperandEditor.vue'

vi.mock('../../../i18n/useAbacI18n', () => ({ useAbacI18n: () => ({ t: (key: string) => key }) }))

const Select = defineComponent({
  name: 'VSelect',
  props: ['modelValue', 'items', 'label', 'disabled'],
  emits: ['update:modelValue'],
  template: '<div />',
})
const comparison: ExpressionState = {
  kind: 'comparison', operator: 'eq',
  left: { source: 'literal', literalOption: 'strVal', value: 'admin' },
  right: { source: 'attribute', kind: 'CLAIM', value: 'role' },
}

describe('formula group expansion', () => {
  it.each(['and', 'or', 'match'] as const)('opens only explicit additions to %s groups and keeps bulk input collapsed', async kind => {
    const wrapper = shallowMount(FormulaEditor, {
      props: { modelValue: { kind, items: [structuredClone(comparison), structuredClone(comparison)] } as ExpressionState },
      global: {
        renderStubDefaultSlot: true,
        stubs: { CollapsibleList: false, DraggableList: false, VueDraggable: false, VRow: true, VCol: true, VSelect: Select, VBtn: true, VIcon: true },
      },
    })
    const titleButtons = () => wrapper.findAll('.abac-sortable-header > div:first-child > button')
    const expanded = () => titleButtons().map(button => button.attributes('aria-expanded'))
    const commit = async () => wrapper.setProps({ modelValue: wrapper.emitted('update:modelValue')!.at(-1)![0] as ExpressionState })
    const add = () => wrapper.findAllComponents({ name: 'VBtn' }).find(button => button.attributes('aria-label') === 'forms.expression.addCondition')!.vm.$emit('click')
    try {
      expect(expanded()).toEqual(['false', 'false'])
      await titleButtons()[1]!.trigger('click')
      add()
      await commit()
      expect(expanded()).toEqual(['false', 'true', 'true'])
      wrapper.findAllComponents({ name: 'VBtn' }).findLast(button => button.attributes('aria-label') === 'forms.list.remove')!.vm.$emit('click')
      await commit()
      add()
      await commit()
      expect(expanded()).toEqual(['false', 'true', 'true'])
      await wrapper.setProps({ modelValue: { kind, items: [] } })
      await wrapper.setProps({ modelValue: { kind, items: [structuredClone(comparison), structuredClone(comparison)] } })
      expect(expanded()).toEqual(['false', 'false'])
      await titleButtons()[0]!.trigger('click')
      wrapper.findAllComponents(Select)[0]!.vm.$emit('update:modelValue', kind === 'and' ? 'or' : 'and')
      await commit()
      expect(expanded()).toEqual(['false', 'false'])
    } finally {
      wrapper.unmount()
    }
  })
})

function mountEditor (modelValue: ExpressionState, allowed: 'expressions' | 'match' = 'expressions') {
  return shallowMount(FormulaEditor, {
    props: { modelValue, allowed },
    global: {
      stubs: { VSelect: Select, VRow: { template: '<div><slot /></div>' }, VCol: { template: '<div><slot /></div>' } },
    },
  })
}

describe('formula group minimum size', () => {
  it.each([{ kind: 'and', minimum: 2 }, { kind: 'or', minimum: 2 }, { kind: 'match', minimum: 1 }] as const)(
    'disables deletion at the $kind minimum and guards the handler', async ({ kind, minimum }) => {
      const wrapper = shallowMount(FormulaEditor, {
        props: { modelValue: { kind, items: Array.from({ length: minimum + 1 }, () => structuredClone(comparison)) } as ExpressionState },
        global: {
          renderStubDefaultSlot: true,
          stubs: { CollapsibleList: false, DraggableList: false, VueDraggable: false, VRow: true, VCol: true, VSelect: Select, VBtn: true, VIcon: true },
        },
      })
      const removeButtons = () => wrapper.findAllComponents({ name: 'VBtn' }).filter(button => button.attributes('aria-label') === 'forms.list.remove')
      try {
        expect(removeButtons().every(button => !button.props('disabled'))).toBe(true)
        removeButtons()[0]!.vm.$emit('click')
        const updated = wrapper.emitted('update:modelValue')!.at(-1)![0] as ExpressionState
        await wrapper.setProps({ modelValue: updated })
        expect(removeButtons()).toHaveLength(minimum)
        expect(removeButtons().every(button => button.props('disabled'))).toBe(true)
        const count = wrapper.emitted('update:modelValue')!.length
        removeButtons()[0]!.vm.$emit('click')
        expect(wrapper.emitted('update:modelValue')).toHaveLength(count)
      } finally {
        wrapper.unmount()
      }
    },
  )
})

describe('FormulaEditor negation', () => {
  it('marks the affected collapsed row and propagates paths through NOT and nested groups', async () => {
    const wrapper = mount(FormulaEditor, {
      props: {
        modelValue: { kind: 'not', operand: { kind: 'and', items: [comparison, { kind: 'or', items: [comparison] }] } },
        warningPaths: [['$not', '$and', '1', '$or', '0', '$eq', '0', '$strVal']],
      },
      global: { stubs: { VSelect: Select, VRow: { template: '<div><slot /></div>' }, VCol: { template: '<div><slot /></div>' }, VIcon: true, VBtn: true, VTooltip: true, VDivider: true, OperandEditor: true, FormSectionHeading: true } },
    })
    try {
      const headers = wrapper.findAll('.abac-sortable-header')
      expect(headers[0]!.find('.text-warning').exists()).toBe(false)
      expect(headers[1]!.find('.text-warning').exists()).toBe(true)
      await headers[1]!.get('button[aria-expanded]').trigger('click')
      expect(wrapper.findAll('.abac-sortable-header .text-warning')).toHaveLength(2)
      await wrapper.setProps({ errorPaths: [['$not', '$and', '1', '$or', '0', '$eq', '0', '$strVal']] })
      expect(wrapper.findAll('.abac-sortable-header .text-error')).toHaveLength(2)
      expect(wrapper.findAll('.abac-sortable-header .text-warning')).toHaveLength(0)
      await wrapper.setProps({ warningPaths: [], errorPaths: [] })
      expect(wrapper.findAll('.abac-sortable-header .text-warning, .abac-sortable-header .text-error')).toHaveLength(0)
    } finally {
      wrapper.unmount()
    }
  })
  it('loads legacy NOT equality without rewriting it and retains negation when editing operands', () => {
    const wrapper = mountEditor({ kind: 'not', operand: comparison })
    try {
      const selects = wrapper.findAllComponents(Select)
      expect(selects[0]!.props('modelValue')).toBe('eq')
      expect(selects[1]!.props('modelValue')).toBe(true)
      expect(selects[0]!.props('items').map((item: { value: string }) => item.value)).not.toContain('ne')
      expect(selects[0]!.props('items').map((item: { value: string }) => item.value)).not.toContain('not')
      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
      wrapper.findAllComponents(OperandEditor)[0]!.vm.$emit('update:modelValue', { source: 'literal', literalOption: 'strVal', value: 'user' })
      expect(wrapper.emitted('update:modelValue')![0]![0]).toMatchObject({
        kind: 'comparison', operator: 'ne', left: { value: 'user' },
      })
    } finally {
      wrapper.unmount()
    }
  })

  it('removes negation without losing the operands', () => {
    const wrapper = mountEditor({ ...comparison, operator: 'ne' })
    try {
      wrapper.findAllComponents(Select)[1]!.vm.$emit('update:modelValue', false)
      expect(wrapper.emitted('update:modelValue')![0]![0]).toEqual(comparison)
    } finally {
      wrapper.unmount()
    }
  })

  it('permits negated equality but prevents unsupported negation inside match groups', () => {
    const equality = mountEditor(comparison, 'match')
    const contains = mountEditor({ ...comparison, operator: 'contains' }, 'match')
    try {
      expect(equality.findAllComponents(Select)[1]!.props('disabled')).toBe(false)
      expect(contains.findAllComponents(Select)[1]!.props('disabled')).toBe(true)
      equality.findAllComponents(Select)[1]!.vm.$emit('update:modelValue', true)
      expect(equality.emitted('update:modelValue')![0]![0]).toEqual({ ...comparison, operator: 'ne' })
    } finally {
      equality.unmount()
      contains.unmount()
    }
  })
})
