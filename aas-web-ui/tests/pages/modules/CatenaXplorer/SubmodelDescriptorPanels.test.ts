import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { computed, defineComponent } from 'vue'
import SubmodelDescriptorPanels from '@/pages/modules/CatenaXplorer/components/SubmodelDescriptorPanels.vue'

const submodelDescriptor = {
  id: 'urn:example:submodel:1',
  idShort: 'TechnicalData',
  semanticId: { keys: [{ value: 'urn:samm:example:1.0.0#TechnicalData' }] },
  endpoints: [{
    interface: 'SUBMODEL-3.0',
    protocolInformation: {
      href: 'https://data-plane.test/api/public/submodel-asset/submodel',
      endpointProtocol: 'HTTP',
      subprotocol: 'DSP',
      subprotocolBody: 'id=submodel-asset;dspEndpoint=https://counterparty-dsp.test/api/v1/dsp',
    },
  }],
}

const PassthroughStub = defineComponent({
  template: '<div><slot /><slot name="prepend" /><slot name="append" /></div>',
})

const VBtnStub = defineComponent({
  name: 'VBtn',
  props: {
    disabled: Boolean,
    loading: Boolean,
  },
  emits: ['click'],
  template: `
    <button data-testid="load-submodel" :disabled="disabled || loading" type="button" @click="$emit('click', $event)">
      <slot />
    </button>
  `,
})

const GenericDataTableViewStub = defineComponent({
  name: 'GenericDataTableView',
  props: {
    submodelElementData: {
      type: Array,
      default: () => [],
    },
  },
  template: '<tr data-testid="generic-table"><td>{{ submodelElementData.length }}</td></tr>',
})

const SubmodelValueOnlyViewStub = defineComponent({
  name: 'SubmodelValueOnlyView',
  props: {
    value: {
      type: Object,
      default: () => ({}),
    },
  },
  setup (props) {
    const keys = computed(() => Object.keys(props.value).join(','))
    return { keys }
  },
  template: '<div data-testid="value-only-view">{{ keys }}</div>',
})

function createWrapper (props?: Record<string, unknown>) {
  return mount(SubmodelDescriptorPanels, {
    props: {
      descriptors: [submodelDescriptor],
      ...props,
    },
    global: {
      stubs: {
        EndpointTable: true,
        GenericDataTableView: GenericDataTableViewStub,
        ReferenceChips: true,
        SubmodelValueOnlyView: SubmodelValueOnlyViewStub,
        VAlert: { props: ['text'], template: '<div data-testid="alert"><slot />{{ text }}</div>' },
        VBtn: VBtnStub,
        VChip: { template: '<span><slot /></span>' },
        VCol: PassthroughStub,
        VExpansionPanel: PassthroughStub,
        VExpansionPanels: PassthroughStub,
        VExpansionPanelText: PassthroughStub,
        VExpansionPanelTitle: PassthroughStub,
        VRow: PassthroughStub,
        VSheet: PassthroughStub,
        VTable: { template: '<table><slot /></table>' },
      },
    },
  })
}

describe('SubmodelDescriptorPanels.vue', () => {
  it('shows and emits the EDC submodel load action in EDC mode', async () => {
    const wrapper = createWrapper({ edcAccessEnabled: true })
    const loadButton = wrapper.find('[data-testid="load-submodel"]')

    expect(loadButton.exists()).toBe(true)
    expect(loadButton.text()).toContain('Load Submodel')

    await loadButton.trigger('click')

    expect(wrapper.emitted('load-edc-submodel')?.[0]).toEqual([submodelDescriptor])
  })

  it('does not show EDC submodel actions in direct mode', () => {
    const wrapper = createWrapper({ edcAccessEnabled: false })

    expect(wrapper.find('[data-testid="load-submodel"]').exists()).toBe(false)
  })

  it('renders loaded submodel elements with the generic table view', () => {
    const wrapper = createWrapper({
      edcAccessEnabled: true,
      edcSubmodels: {
        'urn:example:submodel:1': {
          data: {
            id: 'urn:example:submodel:1',
            submodelElements: [{ modelType: 'Property', idShort: 'temperature', value: '20' }],
          },
        },
      },
    })

    expect(wrapper.find('[data-testid="generic-table"]').text()).toBe('1')
    expect(wrapper.text()).toContain('Reload Submodel')
  })

  it('renders value-only submodel payloads with the value-only view', () => {
    const wrapper = createWrapper({
      edcAccessEnabled: true,
      edcSubmodels: {
        'urn:example:submodel:1': {
          data: {
            general: [{ pcfLegalStatement: 'PCF legal statement' }],
            scopeOfPcfForm: [{ specVersion: 'urn:io.catenax.pcf:datamodel:version:9.0.0' }],
          },
        },
      },
    })

    expect(wrapper.text()).toContain('Submodel Value')
    expect(wrapper.find('[data-testid="generic-table"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="value-only-view"]').text()).toBe('general,scopeOfPcfForm')
  })

  it('renders detailed EDC submodel errors', () => {
    const wrapper = createWrapper({
      edcAccessEnabled: true,
      edcSubmodels: {
        'urn:example:submodel:1': {
          error: 'Could not load the Submodel through EDC.\nStatus: 404\nCode: ROUTE_NOT_FOUND',
        },
      },
    })

    expect(wrapper.text()).toContain('Could not load the Submodel through EDC.')
    expect(wrapper.text()).toContain('Status: 404')
    expect(wrapper.text()).toContain('Code: ROUTE_NOT_FOUND')
  })
})
