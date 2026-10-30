import { shallowMount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import FragmentEditor from './FragmentEditor.vue'

vi.mock('../../../i18n/useAbacI18n', () => ({ useAbacI18n: () => ({ t: (key: string) => key }) }))

const Select = defineComponent({ name: 'VSelect', props: ['modelValue', 'items'], template: '<div />' })
const Combobox = defineComponent({ name: 'VCombobox', props: ['modelValue', 'items', 'messages', 'error', 'baseColor'], template: '<div />' })
const Input = defineComponent({ name: 'VTextField', props: ['modelValue', 'messages', 'error', 'baseColor'], template: '<input />' })
const global = { stubs: { VRow: { template: '<div><slot /></div>' }, VCol: { template: '<div><slot /></div>' }, VSelect: Select, VCombobox: Combobox, VTextField: Input } }

describe('guided fragment editor', () => {
  it('preserves existing values and edits the target and fragment path separately', async () => {
    const wrapper = shallowMount(FragmentEditor, { props: { modelValue: '$aas#submodels[2].keys[0]' }, global })
    try {
      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
      expect(wrapper.findComponent(Combobox).props('modelValue')).toBe('submodels[2].keys[0]')
      wrapper.findComponent(Select).vm.$emit('update:modelValue', 'sm')
      expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual(['$sm#idShort'])
      await wrapper.setProps({ modelValue: '$sm#idShort' })
      wrapper.findComponent(Combobox).vm.$emit('update:modelValue', 'supplementalSemanticIds[3].keys[1]')
      expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual(['$sm#supplementalSemanticIds[3].keys[1]'])
    } finally {
      wrapper.unmount()
    }
  })

  it('supports whole Submodel Elements and optional indexed idShort paths', async () => {
    const wrapper = shallowMount(FragmentEditor, { props: { modelValue: '$sme.Motor#value' }, global })
    try {
      wrapper.findComponent(Combobox).vm.$emit('update:modelValue', '')
      expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual(['$sme.Motor'])
      await wrapper.setProps({ modelValue: '$sme.Motor' })
      wrapper.findComponent(Input).vm.$emit('update:modelValue', 'Sensors[0].Temperature')
      expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual(['$sme.Sensors[0].Temperature'])
    } finally {
      wrapper.unmount()
    }
  })

  it('keeps custom input editable when typing a recognized prefix and never rewrites it on opening', async () => {
    const wrapper = shallowMount(FragmentEditor, { props: { modelValue: 'backend extension' }, global })
    try {
      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
      expect(wrapper.findComponent(Input).props('modelValue')).toBe('backend extension')
      wrapper.findComponent(Input).vm.$emit('update:modelValue', '$sme')
      await wrapper.setProps({ modelValue: '$sme' })
      expect(wrapper.findComponent(Input).exists()).toBe(true)
      expect(wrapper.findComponent(Combobox).exists()).toBe(false)
      wrapper.findComponent(Select).vm.$emit('update:modelValue', 'aas')
      await nextTick()
      expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual(['$aas#idShort'])
    } finally {
      wrapper.unmount()
    }
  })

  it('lets users switch a recognized selector to custom without changing its value', async () => {
    const wrapper = shallowMount(FragmentEditor, { props: { modelValue: '$sm#idShort' }, global })
    try {
      wrapper.findComponent(Select).vm.$emit('update:modelValue', 'custom')
      await nextTick()
      expect(wrapper.findComponent(Input).props('modelValue')).toBe('$sm#idShort')
      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    } finally {
      wrapper.unmount()
    }
  })

  it('shows and clears field diagnostics in both guided and custom inputs', async () => {
    const wrapper = shallowMount(FragmentEditor, { props: { modelValue: '$sm#invalid', severity: 'warning', messages: ['Invalid fragment'] }, global })
    try {
      expect(wrapper.findComponent(Combobox).props('baseColor')).toBe('warning')
      expect(wrapper.findComponent(Combobox).props('messages')).toEqual(['Invalid fragment'])
      await wrapper.setProps({ severity: 'error' })
      expect(wrapper.findComponent(Combobox).props('error')).toBe(true)
      await wrapper.setProps({ severity: undefined, messages: [], modelValue: 'custom' })
      expect(wrapper.findComponent(Input).props('error')).toBe(false)
      expect(wrapper.findComponent(Input).props('baseColor')).toBeUndefined()
      expect(wrapper.findComponent(Input).props('messages')).toEqual([])
    } finally {
      wrapper.unmount()
    }
  })
})
