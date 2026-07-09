import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'
import DescriptorSearchForm from '@/pages/modules/CatenaXplorer/components/DescriptorSearchForm.vue'

vi.mock('@/composables/ClipboardUtil', () => ({
  useClipboardUtil: () => ({
    copyToClipboard: vi.fn(),
  }),
}))

const VSelectStub = defineComponent({
  name: 'VSelect',
  props: {
    items: {
      type: Array,
      default: () => [],
    },
    modelValue: String,
  },
  emits: ['keydown', 'update:modelValue'],
  setup (_props, { emit }) {
    function onChange (event: Event): void {
      emit('update:modelValue', (event.target as HTMLSelectElement).value)
    }

    return { onChange }
  },
  template: `
    <select data-testid="asset-key" :value="modelValue" @change="onChange" @keydown="$emit('keydown', $event)">
      <option v-for="item in items" :key="String(item)" :value="item">{{ item }}</option>
    </select>
  `,
})

const VTextFieldStub = defineComponent({
  name: 'VTextField',
  props: {
    label: String,
    modelValue: String,
  },
  emits: ['click:clear', 'keydown', 'update:modelValue'],
  setup (_props, { emit }) {
    function onInput (event: Event): void {
      emit('update:modelValue', (event.target as HTMLInputElement).value)
    }

    return { onInput }
  },
  template: `
    <label data-testid="asset-value-field">
      <slot name="prepend-inner" />
      <span>{{ label }}</span>
      <input data-testid="asset-value" :value="modelValue" @input="onInput" @keydown="$emit('keydown', $event)">
      <slot name="append-inner" />
      <button data-testid="clear-field" type="button" @click="$emit('click:clear')">clear</button>
      <slot name="clear" :props="{}" />
    </label>
  `,
})

const VBtnStub = defineComponent({
  name: 'VBtn',
  props: {
    disabled: Boolean,
    icon: String,
    text: String,
  },
  emits: ['click'],
  template: `
    <button v-bind="$attrs" :data-icon="icon" :disabled="disabled" type="button" @click="$emit('click', $event)">
      <slot>{{ text }}</slot>
    </button>
  `,
})

const SlotStub = defineComponent({
  name: 'SlotStub',
  template: '<div><slot name="activator" :props="{}" /><slot /></div>',
})

function createWrapper () {
  return mount(DescriptorSearchForm, {
    props: {
      assetIdName: 'manufacturerPartId',
      assetIdNameSuggestions: ['manufacturerPartId', 'customerPartId'],
      assetIdValue: '',
      dtrUrl: 'https://registry.example/api/v3',
      isLoading: false,
    },
    global: {
      stubs: {
        VBtn: VBtnStub,
        VDivider: true,
        VIcon: true,
        VMenu: SlotStub,
        VSelect: VSelectStub,
        VSheet: { template: '<div><slot /></div>' },
        VTextField: VTextFieldStub,
        VTooltip: SlotStub,
      },
    },
  })
}

describe('DescriptorSearchForm.vue', () => {
  it('renders the asset ID key selector inside the search field', () => {
    const wrapper = createWrapper()

    expect(wrapper.find('[data-testid="asset-key"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="asset-value"]').exists()).toBe(true)
  })

  it('emits model updates for the key and value controls', async () => {
    const wrapper = createWrapper()

    await wrapper.find('[data-testid="asset-key"]').setValue('customerPartId')
    await wrapper.find('[data-testid="asset-value"]').setValue('PART-001')

    expect(wrapper.emitted('update:asset-id-name')?.[0]).toEqual(['customerPartId'])
    expect(wrapper.emitted('update:asset-id-value')?.[0]).toEqual(['PART-001'])
  })

  it('searches with Enter, clears from the value field, and omits search options', async () => {
    const wrapper = createWrapper()

    await wrapper.find('[data-testid="asset-value"]').trigger('keydown.enter')
    await wrapper.find('[data-testid="clear-field"]').trigger('click')

    expect(wrapper.emitted('search')).toHaveLength(1)
    expect(wrapper.emitted('clear')).toHaveLength(1)
    expect(wrapper.find('[aria-label="Search options"]').exists()).toBe(false)
  })
})
