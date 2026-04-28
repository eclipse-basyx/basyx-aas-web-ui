import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import BooleanInput from '@/components/EditorComponents/InputTypes/BooleanInput.vue'

const VSwitchStub = {
  template: `
    <div>
      <slot name="label"></slot>
      <button @click="$emit('update:modelValue', !modelValue)">
        toggle
      </button>
    </div>
  `,
  props: ['modelValue']
}

function createWrapper(modelValue: boolean | string) {
  return mount(BooleanInput, {
    props: {
      modelValue,
      label: 'Test'
    },
    global: {
      stubs: {
        'v-switch': VSwitchStub
      }
    }
  })
}

describe('BooleanInput', () => {

  it('converts string "true" to boolean true', () => {
    const wrapper = createWrapper('true')
    expect(wrapper.text()).toContain('true')
  })

  it('converts string "false" to boolean false', () => {
    const wrapper = createWrapper('false')
    expect(wrapper.text()).toContain('false')
  })

  it('accepts boolean true correctly', () => {
    const wrapper = createWrapper(true)
    expect(wrapper.text()).toContain('true')
  })

  it('accepts boolean false correctly', () => {
    const wrapper = createWrapper(false)
    expect(wrapper.text()).toContain('false')
  })

  it('renders "true" with success class', () => {
    const wrapper = createWrapper(true)
    const span = wrapper.find('span span')
    expect(span.text()).toBe('true')
    expect(span.classes()).toContain('text-success')
  })

  it('renders "false" with warning class', () => {
    const wrapper = createWrapper(false)
    const span = wrapper.find('span span')
    expect(span.text()).toBe('false')
    expect(span.classes()).toContain('text-warning')
  })

  it('emits boolean when toggled', async () => {
    const wrapper = createWrapper(false)

    await wrapper.find('button').trigger('click')

    const emits = wrapper.emitted('update:modelValue')
    expect(emits).toBeTruthy()
    expect(emits![0]).toEqual([true])
  })

  it('updates internal state when prop changes', async () => {
    const wrapper = createWrapper(false)

    await wrapper.setProps({ modelValue: true })

    expect(wrapper.text()).toContain('true')
  });
});