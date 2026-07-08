import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent } from 'vue'
import DescriptorDetails from '@/pages/modules/CatenaXplorer/components/DescriptorDetails.vue'

const PassthroughStub = defineComponent({
  template: '<div><slot /><slot name="media" /></div>',
})

function createWrapper (descriptor: Record<string, unknown>) {
  return mount(DescriptorDetails, {
    props: {
      descriptor,
    },
    global: {
      stubs: {
        DescriptorJsonPreview: true,
        SpecificAssetIdsTable: true,
        SubmodelDescriptorPanels: true,
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
})
