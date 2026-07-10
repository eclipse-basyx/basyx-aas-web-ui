import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent } from 'vue'
import SubmodelValueOnlyView from '@/components/UIComponents/SubmodelValueOnlyView.vue'

const PassthroughStub = defineComponent({
  template: '<div><slot /></div>',
})

const VBtnStub = defineComponent({
  name: 'VBtn',
  props: {
    icon: {
      type: String,
      default: '',
    },
  },
  emits: ['click'],
  template: '<button data-testid="toggle-row" type="button" v-bind="$attrs" @click="$emit(\'click\')">{{ icon }}</button>',
})

function createWrapper (value: unknown) {
  return mount(SubmodelValueOnlyView, {
    props: {
      value,
    },
    global: {
      stubs: {
        VBtn: VBtnStub,
        VIcon: PassthroughStub,
        VSheet: PassthroughStub,
        VTable: { template: '<table><slot /></table>' },
      },
    },
  })
}

describe('SubmodelValueOnlyView.vue', () => {
  it('renders nested value-only Submodel payloads collapsed by default', () => {
    const wrapper = createWrapper({
      general: [{ pcfLegalStatement: 'This PCF is for information purposes only.' }],
      carbonContent: [{ carbonContentTotal: 0.52 }],
      scopeOfPcfForm: [{ specVersion: 'urn:io.catenax.pcf:datamodel:version:9.0.0' }],
    })

    expect(wrapper.text()).toContain('general')
    expect(wrapper.text()).toContain('1 item')
    expect(wrapper.text()).toContain('carbonContent')
    expect(wrapper.text()).not.toContain('Type')
    expect(wrapper.text()).not.toContain('pcfLegalStatement')
    expect(wrapper.text()).not.toContain('This PCF is for information purposes only.')
  })

  it('expands list and object rows on demand', async () => {
    const wrapper = createWrapper({
      general: [{ pcfLegalStatement: 'This PCF is for information purposes only.' }],
    })

    await wrapper.find('[data-testid="toggle-row"]').trigger('click')

    expect(wrapper.text()).toContain('[0]')
    expect(wrapper.text()).not.toContain('pcfLegalStatement')

    await wrapper.findAll('[data-testid="toggle-row"]')[1].trigger('click')

    expect(wrapper.text()).toContain('pcfLegalStatement')
    expect(wrapper.text()).toContain('This PCF is for information purposes only.')
  })

  it('renders scalar value-only payloads', () => {
    const wrapper = createWrapper('single value')

    expect(wrapper.text()).toContain('Submodel Value')
    expect(wrapper.text()).not.toContain('Type')
    expect(wrapper.text()).toContain('single value')
  })
})
