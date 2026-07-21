import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent } from 'vue'
import EdcPartnerSelector from '@/pages/modules/CatenaXplorer/components/EdcPartnerSelector.vue'

const VSelectStub = defineComponent({
  props: {
    items: Array,
    modelValue: String,
  },
  emits: ['update:modelValue'],
  template: '<select data-testid="partner" :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)"><option value="configured">Configured</option><option value="__runtime_partner__">Use another partner</option></select>',
})

const VTextFieldStub = defineComponent({
  props: {
    label: String,
    modelValue: String,
  },
  emits: ['update:modelValue'],
  template: '<label><span>{{ label }}</span><input :aria-label="label" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)"></label>',
})

const VBtnStub = defineComponent({
  props: {
    disabled: Boolean,
    text: String,
  },
  emits: ['click'],
  template: '<button :disabled="disabled" type="button" @click="$emit(\'click\')">{{ text }}</button>',
})

const VChipStub = defineComponent({
  props: {
    text: String,
  },
  template: '<span>{{ text }}</span>',
})

function createWrapper (overrides: Record<string, unknown> = {}) {
  return mount(EdcPartnerSelector, {
    props: {
      configuredPartners: [{
        id: 'configured',
        name: 'Configured Partner',
        counterPartyId: 'BPNL0001',
        counterPartyAddress: 'https://configured.example/dsp',
      }],
      counterPartyAddress: 'https://configured.example/dsp',
      counterPartyId: 'BPNL0001',
      isLoading: false,
      partnerId: 'configured',
      ...overrides,
    },
    global: {
      stubs: {
        VBtn: VBtnStub,
        VChip: VChipStub,
        VIcon: true,
        VSelect: VSelectStub,
        VSheet: { template: '<div><slot /></div>' },
        VTextField: VTextFieldStub,
      },
    },
  })
}

describe('EdcPartnerSelector.vue', () => {
  it('shows configured partner details and requests runtime mode explicitly', async () => {
    const wrapper = createWrapper()

    expect(wrapper.text()).toContain('Configured Partner')
    await wrapper.find('[data-testid="partner"]').setValue('__runtime_partner__')

    expect(wrapper.emitted('update:partner-id')?.[0]).toEqual([''])
  })

  it('distinguishes prepared, ready, loading, and failed partner states', async () => {
    const wrapper = createWrapper()

    expect(wrapper.text()).toContain('Not loaded')
    expect(wrapper.text()).toContain('Load all descriptors')

    await wrapper.setProps({ partnerReady: true })
    expect(wrapper.text()).toContain('Ready')
    expect(wrapper.text()).toContain('Reload all descriptors')

    await wrapper.setProps({ isLoading: true, partnerReady: false })
    expect(wrapper.text()).toContain('Loading')

    await wrapper.setProps({ hasLoadError: true, isLoading: false })
    expect(wrapper.text()).toContain('Load failed')
  })

  it('requires valid runtime values before loading', async () => {
    const wrapper = createWrapper({
      counterPartyAddress: '',
      counterPartyId: '',
      partnerId: '',
    })
    const loadButton = wrapper.get('button')

    expect(loadButton.attributes('disabled')).toBeDefined()
    await wrapper.setProps({
      counterPartyAddress: 'https://runtime.example/dsp',
      counterPartyId: 'BPNL0002',
    })

    expect(loadButton.attributes('disabled')).toBeUndefined()
    await loadButton.trigger('click')
    expect(wrapper.emitted('load')).toHaveLength(1)
  })

  it('offers saving only after an unconfigured partner loaded in editable mode', () => {
    const wrapper = createWrapper({
      infrastructureEditable: true,
      runtimePartnerLoaded: true,
    })

    expect(wrapper.findAll('button').map(button => button.text())).toContain('Save partner')
  })
})
