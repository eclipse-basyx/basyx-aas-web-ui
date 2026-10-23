import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import CollapsibleList from './CollapsibleList.vue'

vi.mock('../../../i18n/useAbacI18n', () => ({ useAbacI18n: () => ({ t: (key: string) => key }) }))

describe('collapsible list expansion', () => {
  it('starts collapsed and opens only added rows when decoding recreates existing objects', async () => {
    const wrapper = mount(CollapsibleList, {
      props: { modelValue: [{ title: 'first' }, { title: 'second' }] },
      slots: { default: '{{ params.item.title }}', body: '<input :aria-label="params.item.title" />' },
      global: { stubs: { VBtn: { template: '<button><slot /></button>' }, VIcon: true, VTooltip: true, VDivider: true } },
    })
    const titleButtons = () => wrapper.findAll('.abac-sortable-header > div:first-child > button')
    try {
      expect(titleButtons().map(button => button.attributes('aria-expanded'))).toEqual(['false', 'false'])
      expect(wrapper.findAll('input')).toHaveLength(0)
      await titleButtons()[1]!.trigger('click')
      await wrapper.setProps({ modelValue: [{ title: 'first' }, { title: 'second' }, { title: 'third' }], expandRequest: { index: 2 } })
      expect(titleButtons().map(button => button.attributes('aria-expanded'))).toEqual(['false', 'true', 'true'])
      expect(wrapper.findAll('input').map(input => input.attributes('aria-label'))).toEqual(['second', 'third'])
      await titleButtons()[2]!.trigger('click')
      await wrapper.setProps({ modelValue: [{ title: 'third' }, { title: 'first' }, { title: 'second' }] })
      expect(titleButtons().map(button => button.attributes('aria-expanded'))).toEqual(['false', 'false', 'true'])
      await wrapper.setProps({ modelValue: [{ title: 'first' }, { title: 'second' }] })
      expect(titleButtons().map(button => button.attributes('aria-expanded'))).toEqual(['false', 'true'])
      await wrapper.setProps({ modelValue: [{ title: 'first' }] })
      expect(titleButtons().map(button => button.attributes('aria-expanded'))).toEqual(['false'])
      await wrapper.setProps({ modelValue: [{ title: 'third' }, { title: 'first' }, { title: 'second' }] })
      expect(titleButtons().map(button => button.attributes('aria-expanded'))).toEqual(['false', 'false', 'false'])
      await titleButtons()[2]!.trigger('click')
      await wrapper.setProps({ modelValue: [{ title: 'third' }, { title: 'first' }, { title: 'edited' }] })
      expect(titleButtons().map(button => button.attributes('aria-expanded'))).toEqual(['false', 'false', 'true'])
    } finally {
      wrapper.unmount()
    }
  })

  it('retains a first duplicate editor across edits, explicit reorder, and collapse/reopen', async () => {
    const wrapper = mount(CollapsibleList, {
      props: { modelValue: [{ title: 'same' }, { title: 'same' }] },
      slots: { default: '{{ params.item.title }}', body: '<input :aria-label="params.item.title" />' },
      global: { stubs: { VBtn: true, VIcon: true, VTooltip: true, VDivider: true } },
    })
    const titles = () => wrapper.findAll('.abac-sortable-header > div:first-child > button')
    try {
      expect(wrapper.findAll('input')).toHaveLength(0)
      await titles()[0]!.trigger('click')
      const input = wrapper.get('input').element
      await wrapper.get('input').setValue('local draft')
      await wrapper.setProps({ modelValue: [{ title: 'edited' }, { title: 'same' }] })
      expect(titles().map(button => button.attributes('aria-expanded'))).toEqual(['true', 'false'])
      await titles()[0]!.trigger('click')
      await titles()[0]!.trigger('click')
      expect(wrapper.get('input').element).toBe(input)
      expect(input.value).toBe('local draft')
      // Both values become identical again; explicit reorder must still move the editor.
      await wrapper.setProps({ modelValue: [{ title: 'same' }, { title: 'same' }] })
      await wrapper.get('.abac-drag-handle').trigger('keydown.down')
      await wrapper.setProps({ modelValue: wrapper.emitted('update:modelValue')!.at(-1)![0] as { title: string }[] })
      expect(titles().map(button => button.attributes('aria-expanded'))).toEqual(['false', 'true'])
      expect(wrapper.get('input').element).toBe(input)
      expect(input.value).toBe('local draft')
    } finally {
      wrapper.unmount()
    }
  })

  it('opens the first added row in an initially empty list', async () => {
    const wrapper = mount(CollapsibleList, {
      props: { modelValue: [] as string[] },
      slots: { body: '<input />' },
      global: { stubs: { VBtn: { template: '<button><slot /></button>' }, VIcon: true, VTooltip: true, VDivider: true } },
    })
    try {
      await wrapper.setProps({ modelValue: ['new'], expandRequest: { index: 0 } })
      expect(wrapper.find('input').exists()).toBe(true)
      expect(wrapper.get('[aria-expanded]').attributes('aria-expanded')).toBe('true')
    } finally {
      wrapper.unmount()
    }
  })

  it('keeps incoming rows collapsed without replaying an earlier Add request', async () => {
    const wrapper = mount(CollapsibleList, {
      props: { modelValue: [] as string[] },
      slots: { default: '{{ params.item }}', body: '<input />' },
      global: { stubs: { VBtn: true, VIcon: true, VTooltip: true, VDivider: true } },
    })
    const expanded = () => wrapper.findAll('.abac-sortable-header > div:first-child > button').map(button => button.attributes('aria-expanded'))
    try {
      await wrapper.setProps({ modelValue: ['loaded'] })
      expect(expanded()).toEqual(['false'])
      await wrapper.setProps({ modelValue: ['loaded', 'added'], expandRequest: { index: 1 } })
      expect(expanded()).toEqual(['false', 'true'])
      await wrapper.setProps({ modelValue: ['loaded'] })
      await wrapper.setProps({ modelValue: ['loaded', 'incoming', 'another'] })
      expect(expanded()).toEqual(['false', 'false', 'false'])
      expect(wrapper.findAll('input')).toHaveLength(0)
    } finally {
      wrapper.unmount()
    }
  })
})
