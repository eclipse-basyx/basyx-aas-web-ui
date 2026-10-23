import { shallowMount } from '@vue/test-utils'
import { expect, it } from 'vitest'
import ConfirmDialog from './ConfirmDialog.vue'

it('keeps a pending confirmation open and enables Cancel when the action finishes', async () => {
  const wrapper = shallowMount(ConfirmDialog, {
    props: { modelValue: true, title: 'Delete', message: 'Confirm deletion', cancelLabel: 'Cancel', confirmLabel: 'Delete', loading: true },
    global: {
      renderStubDefaultSlot: true,
      stubs: { VBtn: { props: ['disabled', 'loading'], emits: ['click'], template: '<button :disabled="disabled || loading" @click="$emit(\'click\')"><slot /></button>' } },
    },
  })
  try {
    const cancel = wrapper.findAll('button')[0]!
    expect(wrapper.findAll('button').every(button => button.attributes('disabled') !== undefined)).toBe(true)
    await cancel.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    await wrapper.setProps({ loading: false })
    await cancel.trigger('click')
    expect(wrapper.emitted('update:modelValue')![0]).toEqual([false])
    expect(wrapper.emitted('confirm')).toBeUndefined()
  } finally {
    wrapper.unmount()
  }
})
