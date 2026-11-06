import { shallowMount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import AclForm from './AclForm.vue'

vi.mock('../../../hooks/forms/useDefinitionNames', () => ({ useDefinitionNames: () => [] }))
vi.mock('../../../i18n/useAbacI18n', () => ({ useAbacI18n: () => ({ t: (key: string) => key }) }))

const Combobox = defineComponent({
  name: 'VCombobox',
  props: ['modelValue', 'error'],
  emits: ['update:modelValue'],
  template: '<div><slot name="prepend-item" /></div>',
})

describe('ACL optional attribute reference', () => {
  it('toggles concrete rights without replacing ALL or custom saved rights', async () => {
    const wrapper = shallowMount(AclForm, {
      props: { modelValue: { rights: ['ALL', 'CUSTOM'] } },
      global: { renderStubDefaultSlot: true, stubs: { FieldRow: { template: '<div><slot /></div>' }, VCombobox: Combobox, VListItem: { name: 'VListItem', template: '<button @click="$emit(\'click\')" />' } } },
    })
    try {
      wrapper.findComponent({ name: 'VListItem' }).vm.$emit('click')
      expect(wrapper.emitted('update:modelValue')![0]![0]).toEqual({ rights: ['ALL', 'CUSTOM', 'CREATE', 'READ', 'UPDATE', 'DELETE', 'EXECUTE', 'VIEW'] })
      await wrapper.setProps({ modelValue: { rights: ['ALL', 'CUSTOM', 'CREATE', 'READ', 'UPDATE', 'DELETE', 'EXECUTE', 'VIEW'] } })
      wrapper.findComponent({ name: 'VListItem' }).vm.$emit('click')
      expect(wrapper.emitted('update:modelValue')!.at(-1)![0]).toEqual({ rights: ['ALL', 'CUSTOM'] })
    } finally {
      wrapper.unmount()
    }
  })

  it('passes only attribute entry diagnostics to its list', () => {
    const wrapper = shallowMount(AclForm, {
      props: {
        modelValue: { attributes: [{ kind: 'CLAIM', value: '' }] },
        warningPaths: [['ATTRIBUTES', '0', 'CLAIM'], ['RIGHTS']],
        errorPaths: [['USEATTRIBUTES']],
      },
      global: { renderStubDefaultSlot: true },
    })
    try {
      const entries = wrapper.findComponent({ name: 'AttributeListEditor' })
      expect(entries.props('warningPaths')).toEqual([['0', 'CLAIM']])
      expect(entries.props('errorPaths')).toEqual([])
    } finally {
      wrapper.unmount()
    }
  })

  it.each([null, undefined, '', ' '.repeat(3), []])('resets a cleared reference to its absent default: %j', value => {
    const wrapper = shallowMount(AclForm, {
      props: { modelValue: { useAttributes: 'fwee' }, errorPaths: [['USEATTRIBUTES']] },
      global: { renderStubDefaultSlot: true, stubs: { VCombobox: Combobox } },
    })
    try {
      const field = wrapper.findAllComponents(Combobox).find(component => component.attributes('aria-label') === 'forms.acl.useAttributes')!
      expect(field.props('error')).toBe(true)
      field.vm.$emit('update:modelValue', value)
      expect(wrapper.emitted('update:modelValue')![0]![0]).toEqual({ useAttributes: undefined })
    } finally {
      wrapper.unmount()
    }
  })
})
