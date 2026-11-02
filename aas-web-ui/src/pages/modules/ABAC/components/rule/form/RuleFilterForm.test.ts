import type { RuleFilterState } from '../../../types/forms'
import { shallowMount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import RuleFilterForm from './RuleFilterForm.vue'

vi.mock('../../../hooks/forms/useDefinitionNames', () => ({ useDefinitionNames: () => [] }))
vi.mock('../../../i18n/useAbacI18n', () => ({ useAbacI18n: () => ({ t: (key: string) => key }) }))

describe('filter form', () => {
  it('highlights the fragment field amber for advisories and red for errors, then clears the highlight', async () => {
    const wrapper = shallowMount(RuleFilterForm, {
      props: {
        modelValue: { fragment: 'g', condition: { mode: 'reference', name: 'filter' } },
        warningPaths: [['FRAGMENT']],
      },
      global: {
        renderStubDefaultSlot: true,
        stubs: { VExpansionPanels: true, VSelect: true, VCombobox: true, VTextField: true, VRadioGroup: true, VRadio: true, VSwitch: true },
      },
    })
    try {
      const field = wrapper.findComponent({ name: 'FragmentEditor' })
      expect(field.props('severity')).toBe('warning')
      await wrapper.setProps({ errorPaths: [['FRAGMENT']] })
      expect(field.props('severity')).toBe('error')
      await wrapper.setProps({ errorPaths: [], warningPaths: [['USEFORMULA']] })
      expect(field.props('severity')).toBeUndefined()
      const references = wrapper.findAllComponents({ name: 'VCombobox' })
      const filterReference = references.find(input => input.attributes('aria-label') === 'forms.rule.filterConditionReference')!
      expect(filterReference.attributes('basecolor')).toBe('warning')
      await wrapper.setProps({ warningPaths: [] })
      expect(filterReference.attributes('basecolor')).toBeUndefined()
    } finally {
      wrapper.unmount()
    }
  })

  it('keeps an explicitly selected inline condition selected after the document round-trip', async () => {
    const modelValue = { fragment: 'fragment' }
    const wrapper = shallowMount(RuleFilterForm, {
      props: { modelValue },
      global: {
        renderStubDefaultSlot: true,
        stubs: {
          VExpansionPanels: true,
          VRadioGroup: true,
          VRadio: true,
          VSwitch: true,
          VSelect: true,
          VCombobox: true,
          VTextField: true,
        },
      },
    })
    try {
      const modes = wrapper.findComponent({ name: 'VRadioGroup' })
      modes.vm.$emit('update:modelValue', 'inline')
      const updated = wrapper.emitted('update:modelValue')![0]![0] as RuleFilterState
      expect(updated).toEqual({ fragment: 'fragment', condition: { mode: 'inline', condition: { kind: 'boolean', value: true } } })
      await wrapper.setProps({ modelValue: updated })
      expect(wrapper.findComponent({ name: 'VRadioGroup' }).attributes('modelvalue')).toBe('inline')
      expect(modelValue).toEqual({ fragment: 'fragment' })
    } finally {
      wrapper.unmount()
    }
  })
})

it('keeps a cleared filter reference selected after document decoding', async () => {
  const wrapper = shallowMount(RuleFilterForm, {
    props: { modelValue: { fragment: '$sm#idShort', condition: { mode: 'reference', name: 'old' } } },
    global: { renderStubDefaultSlot: true, stubs: { VCombobox: { name: 'VCombobox', props: ['modelValue'], template: '<input />' } } },
  })
  try {
    wrapper.findComponent({ name: 'VCombobox' }).vm.$emit('update:modelValue', '')
    expect(wrapper.emitted('update:modelValue')!.at(-1)![0]).toEqual({ fragment: '$sm#idShort', condition: { mode: 'reference', name: undefined } })
    await wrapper.setProps({ modelValue: { fragment: '$sm#idShort' } })
    expect(wrapper.findComponent({ name: 'VCombobox' }).exists()).toBe(true)
    wrapper.findComponent({ name: 'VCombobox' }).vm.$emit('update:modelValue', 'replacement')
    expect(wrapper.emitted('update:modelValue')!.at(-1)![0]).toEqual({ fragment: '$sm#idShort', condition: { mode: 'reference', name: 'replacement' } })
  } finally {
    wrapper.unmount()
  }
})
