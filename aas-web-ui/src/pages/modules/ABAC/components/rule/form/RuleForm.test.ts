import type { JsonObject } from '../../../types/json'
import { shallowMount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import RuleForm from './RuleForm.vue'

vi.mock('../../../hooks/forms/useDefinitionNames', () => ({ useDefinitionNames: () => [] }))
vi.mock('../../../i18n/useAbacI18n', () => ({ useAbacI18n: () => ({ t: (key: string) => key }) }))

describe('RuleForm fragment filter', () => {
  it('routes resource entry diagnostics without leaking filter diagnostics', () => {
    const wrapper = shallowMount(RuleForm, {
      props: {
        doc: { USEACL: 'acl', USEFORMULA: 'formula', OBJECTS: [{ ROUTE: '/shells' }] },
        warningPaths: [['OBJECTS', '0', 'ROUTE'], ['FILTER', 'FRAGMENT']],
      },
      global: { renderStubDefaultSlot: true, stubs: { CollapsibleList: { template: '<div />' }, VSelect: { name: 'VSelect', props: ['prefix'], template: '<div />' }, VCombobox: { name: 'VCombobox', props: ['prefix', 'modelValue'], template: '<div />' } } },
    })
    try {
      expect(wrapper.findComponent({ name: 'ObjectListEditor' }).props('warningPaths')).toEqual([['0', 'ROUTE']])
    } finally {
      wrapper.unmount()
    }
  })
})

describe('rule form decoded-state fallback', () => {
  it('retains the last supported draft during unsupported input and resumes on valid input', async () => {
    const wrapper = shallowMount(RuleForm, {
      props: { doc: { USEACL: 'first' } },
      global: { renderStubDefaultSlot: true, stubs: { CollapsibleList: { template: '<div />' }, VExpansionPanels: true, VSelect: { name: 'VSelect', props: ['prefix'], template: '<div />' }, VCombobox: { name: 'VCombobox', props: ['prefix', 'modelValue'], template: '<div />' } } },
    })
    try {
      expect(wrapper.findComponent({ name: 'VCombobox' }).props('modelValue')).toBe('first')
      await wrapper.setProps({ doc: { USEACL: {} } })
      expect(wrapper.findComponent({ name: 'VCombobox' }).props('modelValue')).toBe('first')
      await wrapper.setProps({ doc: { USEACL: 'second' } })
      expect(wrapper.findComponent({ name: 'VCombobox' }).props('modelValue')).toBe('second')
      expect(wrapper.emitted('update:doc')).toBeUndefined()
    } finally {
      wrapper.unmount()
    }
  })
})

describe('rule filter list', () => {
  const legacy = { USEACL: 'acl', OBJECTS: [], USEFORMULA: 'formula', FILTER: { FRAGMENT: '$sm#idShort', USEFORMULA: 'shared' } }
  function mountFilters (doc: JsonObject, errorPaths: string[][] = [], warningPaths: string[][] = []) {
    return shallowMount(RuleForm, {
      props: { doc, errorPaths, warningPaths },
      global: {
        renderStubDefaultSlot: true,
        stubs: {
          VExpansionPanels: { template: '<div><slot /></div>' },
          FormGroup: { name: 'FormGroup', props: ['value', 'error', 'warning'], template: '<section><slot /></section>' },
          CollapsibleList: false, DraggableList: false, VueDraggable: false,
          VSelect: { props: ['prefix'], template: '<div />' }, VCombobox: { props: ['prefix'], template: '<div />' }, VBtn: true, VIcon: true, VTooltip: true,
        },
      },
    })
  }

  it('adds an open filter without expanding existing rows, converts legacy input, and preserves drafts across edits', async () => {
    const wrapper = mountFilters(legacy)
    const headers = () => wrapper.findAll('.abac-sortable-header button[aria-expanded]')
    try {
      expect(wrapper.emitted('update:doc')).toBeUndefined()
      expect(headers().map(button => button.attributes('aria-expanded'))).toEqual(['false'])
      wrapper.findAllComponents({ name: 'VBtn' }).find(button => button.text() === 'forms.rule.addFilter')!.vm.$emit('click')
      const added = wrapper.emitted('update:doc')!.at(-1)![0] as JsonObject
      expect(added).not.toHaveProperty('FILTER')
      expect(added.FILTERLIST).toEqual([legacy.FILTER, { FRAGMENT: '', CONDITION: { $boolean: true } }])
      await wrapper.setProps({ doc: added })
      expect(headers().map(button => button.attributes('aria-expanded'))).toEqual(['false', 'true'])
      const filter = wrapper.findComponent({ name: 'RuleFilterForm' })
      filter.vm.$emit('update:modelValue', { fragment: '$sme#value', condition: { mode: 'inline', condition: { kind: 'boolean', value: true } } })
      await wrapper.setProps({ doc: wrapper.emitted('update:doc')!.at(-1)![0] as JsonObject })
      expect(headers().map(button => button.attributes('aria-expanded'))).toEqual(['false', 'true'])
    } finally {
      wrapper.unmount()
    }
  })

  it('opens only the new row when adding an initially identical filter', async () => {
    const pending = { FRAGMENT: '', CONDITION: { $boolean: true } }
    const wrapper = mountFilters({ USEACL: 'acl', USEFORMULA: 'formula', OBJECTS: [], FILTERLIST: [pending, pending] })
    const headers = () => wrapper.findAll('.abac-sortable-header button[aria-expanded]')
    try {
      await headers()[1]!.trigger('click')
      wrapper.findAllComponents({ name: 'VBtn' }).find(button => button.text() === 'forms.rule.addFilter')!.vm.$emit('click')
      await wrapper.setProps({ doc: wrapper.emitted('update:doc')!.at(-1)![0] as JsonObject })
      expect(headers().map(button => button.attributes('aria-expanded'))).toEqual(['false', 'true', 'true'])
    } finally {
      wrapper.unmount()
    }
  })

  it('maps list and legacy diagnostic paths separately and supports reordering the combined list', async () => {
    const listFilter = { FRAGMENT: '$sme#value', CONDITION: { $boolean: true } }
    const wrapper = mountFilters({ ...legacy, FILTERLIST: [listFilter] }, [['FILTERLIST', '0', 'FRAGMENT']], [['FILTER', 'USEFORMULA']])
    try {
      for (const header of wrapper.findAll('.abac-sortable-header button[aria-expanded]')) {
        await header.trigger('click')
      }
      const forms = wrapper.findAllComponents({ name: 'RuleFilterForm' })
      expect(forms[0]!.props('errorPaths')).toEqual([['FRAGMENT']])
      expect(forms[0]!.props('warningPaths')).toEqual([])
      expect(forms[1]!.props('errorPaths')).toEqual([])
      expect(forms[1]!.props('warningPaths')).toEqual([['USEFORMULA']])
      const list = wrapper.findComponent({ name: 'CollapsibleList' })
      list.vm.$emit('update:modelValue', list.props('modelValue').toReversed())
      expect(wrapper.emitted('update:doc')!.at(-1)![0]).toEqual({ USEACL: 'acl', USEFORMULA: 'formula', OBJECTS: [], FILTERLIST: [legacy.FILTER, listFilter] })
    } finally {
      wrapper.unmount()
    }
  })
})

describe('cleared rule references', () => {
  it.each([
    { key: 'USEACL', label: 'forms.rule.useAcl' },
    { key: 'USEFORMULA', label: 'forms.rule.useFormula' },
  ])('keeps the $key input available after removing its JSON property', async ({ key, label }) => {
    const wrapper = shallowMount(RuleForm, {
      props: { doc: { USEACL: 'acl', USEFORMULA: 'formula', OBJECTS: [] } },
      global: { renderStubDefaultSlot: true, stubs: {
        CollapsibleList: { template: '<div />' },
        VSelect: { name: 'VSelect', props: ['prefix', 'modelValue'], template: '<div />' },
        VCombobox: { name: 'VCombobox', props: ['prefix', 'modelValue'], template: '<input />' },
      } },
    })
    const reference = () => wrapper.findAllComponents({ name: 'VCombobox' }).find(input => input.attributes('aria-label') === label)!
    try {
      reference().vm.$emit('update:modelValue', '')
      const cleared = wrapper.emitted('update:doc')!.at(-1)![0] as JsonObject
      expect(cleared).not.toHaveProperty(key)
      await wrapper.setProps({ doc: cleared })
      expect(reference()).toBeDefined()
      expect(reference().props('modelValue')).toBe('')
      await wrapper.setProps({ doc: { ...cleared, OBJECTS: [{ ROUTE: '/shells' }] } })
      reference().vm.$emit('update:modelValue', 'replacement')
      expect(wrapper.emitted('update:doc')!.at(-1)![0]).toHaveProperty(key, 'replacement')
    } finally {
      wrapper.unmount()
    }
  })
})
