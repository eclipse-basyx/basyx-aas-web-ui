import { shallowMount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import ObjectValueEditor from './ObjectValueEditor.vue'

vi.mock('../../../i18n/useAbacI18n', () => ({ useAbacI18n: () => ({ t: (key: string) => key }) }))

const Select = defineComponent({ name: 'VSelect', props: ['items', 'modelValue'], template: '<div />' })
const Input = defineComponent({ name: 'TextInput', props: ['modelValue'], template: '<input />' })

describe('object identifier editor', () => {
  it('changes the target without dropping the identifier, and edits its identifier separately', async () => {
    const wrapper = shallowMount(ObjectValueEditor, {
      props: { kind: 'IDENTIFIABLE', modelValue: '$aas("urn:example:aas")' },
      global: { stubs: { VRow: { template: '<div><slot /></div>' }, VCol: { template: '<div><slot /></div>' }, VSelect: Select, TextInput: Input } },
    })
    try {
      expect(wrapper.findComponent(Input).props('modelValue')).toBe('urn:example:aas')
      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
      wrapper.findComponent(Select).vm.$emit('update:modelValue', 'sm')
      expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual(['$sm("urn:example:aas")'])
      await wrapper.setProps({ modelValue: '$sm("urn:example:aas")' })
      wrapper.findComponent(Input).vm.$emit('update:modelValue', 'urn:example:sm')
      expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual(['$sm("urn:example:sm")'])
      wrapper.findComponent(Select).vm.$emit('update:modelValue', 'custom')
      await nextTick()
      expect(wrapper.findComponent(Input).props('modelValue')).toBe('$sm("urn:example:sm")')
    } finally {
      wrapper.unmount()
    }
  })

  it('edits routes as free text without suggesting unverified service endpoints', () => {
    const wrapper = shallowMount(ObjectValueEditor, {
      props: { kind: 'ROUTE', modelValue: '/custom-service/path' },
      global: { stubs: { TextInput: Input } },
    })
    try {
      const input = wrapper.findComponent(Input)
      expect(input.props('modelValue')).toBe('/custom-service/path')
      expect(wrapper.findComponent(Select).exists()).toBe(false)
      expect(wrapper.findComponent({ name: 'VCombobox' }).exists()).toBe(false)
      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
      input.vm.$emit('update:modelValue', '/my-route/*')
      expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual(['/my-route/*'])
    } finally {
      wrapper.unmount()
    }
  })

  it('does not rewrite custom values on opening', () => {
    const wrapper = shallowMount(ObjectValueEditor, {
      props: { kind: 'REFERABLE', modelValue: 'backend-specific value' },
      global: { stubs: { VRow: { template: '<div><slot /></div>' }, VCol: { template: '<div><slot /></div>' }, VSelect: Select, TextInput: Input } },
    })
    try {
      expect(wrapper.findComponent(Select).props('modelValue')).toBe('custom')
      expect(wrapper.findComponent(Input).props('modelValue')).toBe('backend-specific value')
      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    } finally {
      wrapper.unmount()
    }
  })
})
