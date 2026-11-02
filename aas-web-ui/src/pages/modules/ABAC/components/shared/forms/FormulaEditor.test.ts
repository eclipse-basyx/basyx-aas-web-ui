import type { ExpressionState } from '../../../types/forms'
import { mount, shallowMount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { decodeExpression, encodeExpression } from '../../../utils/forms/expression'
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
      expect(expanded()).toEqual(['true', 'false'])
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
      expect(selects[0]!.props('items').map((item: { value: string }) => item.value)).toContain('ne')
      expect(selects[0]!.props('items').map((item: { value: string }) => item.value)).not.toContain('not')
      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
      wrapper.findAllComponents(OperandEditor)[0]!.vm.$emit('update:modelValue', { source: 'literal', literalOption: 'strVal', value: 'user' })
      expect(wrapper.emitted('update:modelValue')![0]![0]).toMatchObject({
        kind: 'not', operand: { kind: 'comparison', operator: 'eq', left: { value: 'user' } },
      })
    } finally {
      wrapper.unmount()
    }
  })

  it('shows NE independently and applies outer NOT without replacing the operator', async () => {
    const notEquals: ExpressionState = { ...comparison, operator: 'ne' }
    const wrapper = mountEditor(notEquals)
    try {
      expect(wrapper.findAllComponents(Select)[0]!.props('modelValue')).toBe('ne')
      expect(wrapper.findAllComponents(Select)[1]!.props('modelValue')).toBe(false)
      wrapper.findAllComponents(Select)[1]!.vm.$emit('update:modelValue', true)
      const updated = wrapper.emitted('update:modelValue')!.at(-1)![0] as ExpressionState
      expect(updated).toEqual({ kind: 'not', operand: notEquals })
      await wrapper.setProps({ modelValue: updated })
      wrapper.findAllComponents(Select)[0]!.vm.$emit('update:modelValue', 'eq')
      expect(wrapper.emitted('update:modelValue')!.at(-1)![0]).toEqual({ kind: 'not', operand: comparison })
    } finally {
      wrapper.unmount()
    }
  })

  it('removes negation without losing the operands', () => {
    const wrapper = mountEditor({ kind: 'not', operand: { ...comparison, operator: 'ne' } })
    try {
      wrapper.findAllComponents(Select)[1]!.vm.$emit('update:modelValue', false)
      expect(wrapper.emitted('update:modelValue')![0]![0]).toEqual({ ...comparison, operator: 'ne' })
    } finally {
      wrapper.unmount()
    }
  })

  it('offers NE and prevents outer NOT inside match groups, including guarded events', () => {
    const wrapper = mountEditor(comparison, 'match')
    try {
      const selects = wrapper.findAllComponents(Select)
      expect(selects[1]!.props('disabled')).toBe(true)
      selects[1]!.vm.$emit('update:modelValue', true)
      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
      selects[0]!.vm.$emit('update:modelValue', 'ne')
      expect(wrapper.emitted('update:modelValue')!.at(-1)![0]).toEqual({ ...comparison, operator: 'ne' })
    } finally {
      wrapper.unmount()
    }
  })
})

const populatedGroup: ExpressionState = {
  kind: 'and',
  items: ['reader', 'editor', 'owner'].map(value => ({ ...comparison, left: { source: 'literal', literalOption: 'strVal', value } })),
}

async function selectOperator (wrapper: ReturnType<typeof mountEditor>, operator: string): Promise<ExpressionState> {
  wrapper.findAllComponents(Select)[0]!.vm.$emit('update:modelValue', operator)
  const expression = wrapper.emitted('update:modelValue')!.at(-1)![0] as ExpressionState
  // Real parent codecs decode immutable replacements after each form edit.
  await wrapper.setProps({ modelValue: decodeExpression(encodeExpression(expression))! })
  return expression
}

describe('formula operator changes', () => {
  it('retains three populated predicates and every NOT wrapper across AND/OR switches', async () => {
    const wrapper = mountEditor({ kind: 'not', operand: { kind: 'not', operand: populatedGroup } })
    try {
      expect(await selectOperator(wrapper, 'or')).toEqual({ kind: 'not', operand: { kind: 'not', operand: { ...populatedGroup, kind: 'or' } } })
      expect(await selectOperator(wrapper, 'and')).toEqual({ kind: 'not', operand: { kind: 'not', operand: populatedGroup } })
    } finally {
      wrapper.unmount()
    }
  })

  it('restores group children through a constant or comparison, including a different group kind', async () => {
    const wrapper = mountEditor(populatedGroup)
    try {
      await selectOperator(wrapper, 'boolean')
      expect(await selectOperator(wrapper, 'or')).toEqual({ ...populatedGroup, kind: 'or' })
      await selectOperator(wrapper, 'eq')
      expect(await selectOperator(wrapper, 'and')).toEqual(populatedGroup)
    } finally {
      wrapper.unmount()
    }
  })

  it('restores comparison operands and a remembered Boolean value independently', async () => {
    const wrapper = mountEditor(comparison)
    try {
      await selectOperator(wrapper, 'boolean')
      wrapper.findAllComponents(Select)[2]!.vm.$emit('update:modelValue', false)
      await wrapper.setProps({ modelValue: wrapper.emitted('update:modelValue')!.at(-1)![0] as ExpressionState })
      expect(await selectOperator(wrapper, 'contains')).toEqual({ ...comparison, operator: 'contains' })
      expect(await selectOperator(wrapper, 'boolean')).toEqual({ kind: 'boolean', value: false })
    } finally {
      wrapper.unmount()
    }
  })

  it('reuses all compatible Match children but preserves an incompatible group as a separate draft', async () => {
    const wrapper = mountEditor(populatedGroup)
    try {
      expect(await selectOperator(wrapper, 'match')).toEqual({ ...populatedGroup, kind: 'match' })
      expect(await selectOperator(wrapper, 'or')).toEqual({ ...populatedGroup, kind: 'or' })
      const incompatible: ExpressionState = { kind: 'and', items: [comparison, { kind: 'boolean', value: false }, comparison] }
      await wrapper.setProps({ modelValue: incompatible })
      const match = await selectOperator(wrapper, 'match')
      expect(match.kind).toBe('match')
      // Do not silently filter the incompatible children to construct a new Match.
      expect(match).not.toEqual({ kind: 'match', items: [comparison, comparison] })
      expect(await selectOperator(wrapper, 'and')).toEqual(incompatible)
    } finally {
      wrapper.unmount()
    }
  })

  it('does not reuse NOT-wrapped predicates inside Match', async () => {
    const group: ExpressionState = { kind: 'and', items: [{ kind: 'not', operand: comparison }, comparison] }
    const wrapper = mountEditor(group)
    try {
      await selectOperator(wrapper, 'match')
      expect(await selectOperator(wrapper, 'and')).toEqual(group)
    } finally {
      wrapper.unmount()
    }
  })

  it('clears inactive drafts after a different expression arrives from JSON', async () => {
    const wrapper = mountEditor(populatedGroup)
    try {
      await selectOperator(wrapper, 'boolean')
      await wrapper.setProps({ modelValue: { kind: 'boolean', value: false } })
      const restored = await selectOperator(wrapper, 'and')
      expect(restored).not.toEqual(populatedGroup)
      expect(restored).toMatchObject({ kind: 'and', items: [{ left: { value: '' } }, { left: { value: '' } }] })
    } finally {
      wrapper.unmount()
    }
  })

  it('keeps remembered drafts isolated between sibling editors', async () => {
    const first = mountEditor(populatedGroup)
    const second = mountEditor({ kind: 'boolean', value: true })
    try {
      await selectOperator(first, 'boolean')
      expect(await selectOperator(second, 'and')).not.toEqual(populatedGroup)
      expect(await selectOperator(first, 'and')).toEqual(populatedGroup)
    } finally {
      first.unmount()
      second.unmount()
    }
  })

  it.each(['eq', 'ne', 'not-eq', 'not-ne', 'double-not-ne'])(
    'preserves %s structure when a wildcard comparison literal is edited and restored', async shape => {
      const predicate: ExpressionState = {
        kind: 'comparison', operator: shape.endsWith('ne') ? 'ne' : 'eq',
        left: { source: 'field', value: '$aasdesc#specificAssetIds[].value' },
        right: { source: 'literal', literalOption: 'strVal', value: 'blocked' },
      }
      const source: ExpressionState = shape === 'double-not-ne'
        ? { kind: 'not', operand: { kind: 'not', operand: predicate } }
        : (shape.startsWith('not-') ? { kind: 'not', operand: predicate } : predicate)
      const wrapper = mountEditor(source)
      try {
        for (const value of ['allowed', 'blocked']) {
          wrapper.findAllComponents(OperandEditor)[1]!.vm.$emit('update:modelValue', { source: 'literal', literalOption: 'strVal', value })
          const updated = wrapper.emitted('update:modelValue')!.at(-1)![0] as ExpressionState
          await wrapper.setProps({ modelValue: decodeExpression(encodeExpression(updated))! })
        }
        expect(encodeExpression(wrapper.props('modelValue'))).toEqual(encodeExpression(source))
      } finally {
        wrapper.unmount()
      }
    },
  )
})
