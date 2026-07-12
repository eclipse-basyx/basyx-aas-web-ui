import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent } from 'vue'
import DescriptorDetails from '@/pages/modules/CatenaXplorer/components/DescriptorDetails.vue'

const PassthroughStub = defineComponent({
  template: '<div><slot /><slot name="media" /></div>',
})

const VBtnToggleStub = defineComponent({
  emits: ['update:modelValue'],
  template: `
    <div>
      <button data-testid="show-details" type="button" @click="$emit('update:modelValue', 'details')">Details</button>
      <button data-testid="show-json" type="button" @click="$emit('update:modelValue', 'json')">JSON</button>
      <slot />
    </div>
  `,
})

const DescriptorJsonPreviewStub = defineComponent({
  props: {
    descriptor: {
      type: Object,
      default: () => ({}),
    },
  },
  template: '<div data-testid="descriptor-json-preview">{{ descriptor.id }}</div>',
})

function createWrapper (descriptor: Record<string, unknown>) {
  return mount(DescriptorDetails, {
    props: {
      descriptor,
    },
    global: {
      stubs: {
        DescriptorJsonPreview: DescriptorJsonPreviewStub,
        SpecificAssetIdsTable: true,
        SubmodelDescriptorPanels: true,
        VBtn: { template: '<button><slot /></button>' },
        VBtnToggle: VBtnToggleStub,
        VChip: { template: '<span><slot /></span>' },
        VCol: PassthroughStub,
        VDivider: true,
        VEmptyState: PassthroughStub,
        VIcon: true,
        VRow: PassthroughStub,
        VSheet: PassthroughStub,
      },
    },
  })
}

describe('DescriptorDetails.vue', () => {
  it('labels createdAt timestamps as Created', () => {
    const wrapper = createWrapper({
      id: 'urn:example:aas:1',
      idShort: 'ExampleShell',
      createdAt: '2026-01-01T10:00:00Z',
    })

    expect(wrapper.text()).toContain('Created')
    expect(wrapper.text()).not.toContain('Updated')
  })

  it('labels update timestamps as Updated', () => {
    const wrapper = createWrapper({
      id: 'urn:example:aas:1',
      idShort: 'ExampleShell',
      createdAt: '2026-01-01T10:00:00Z',
      updatedAt: '2026-01-02T10:00:00Z',
    })

    expect(wrapper.text()).toContain('Updated')
  })

  it('switches from descriptor details to raw JSON preview', async () => {
    const wrapper = createWrapper({
      id: 'urn:example:aas:1',
      idShort: 'ExampleShell',
      createdAt: '2026-01-01T10:00:00Z',
    })

    expect(wrapper.find('[data-testid="descriptor-json-preview"]').exists()).toBe(false)

    await wrapper.find('[data-testid="show-json"]').trigger('click')

    expect(wrapper.find('[data-testid="descriptor-json-preview"]').text()).toContain('urn:example:aas:1')
  })
})
