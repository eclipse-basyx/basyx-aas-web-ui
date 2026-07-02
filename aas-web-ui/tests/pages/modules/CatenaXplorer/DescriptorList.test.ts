import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent } from 'vue'
import DescriptorList from '@/pages/modules/CatenaXplorer/components/DescriptorList.vue'

const descriptor = {
  id: 'urn:example:aas:part-001',
  idShort: 'Part001',
}

const DescriptorListItemStub = defineComponent({
  name: 'DescriptorListItem',
  props: {
    copyJsonIcon: String,
    descriptor: Object,
    selected: Boolean,
  },
  emits: ['copy', 'copy-json', 'delete', 'edit', 'select'],
  template: `
    <div data-testid="descriptor-item">
      <button data-testid="select-descriptor" type="button" @click="$emit('select', descriptor)">select</button>
      <button data-testid="edit-descriptor" type="button" @click="$emit('edit', descriptor)">edit</button>
      <button data-testid="delete-descriptor" type="button" @click="$emit('delete', descriptor)">delete</button>
      <button data-testid="copy-descriptor" type="button" @click="$emit('copy', descriptor)">copy</button>
      <button data-testid="copy-json-descriptor" type="button" @click="$emit('copy-json', descriptor)">copy json</button>
    </div>
  `,
})

const VBtnStub = defineComponent({
  name: 'VBtn',
  emits: ['click'],
  template: '<button type="button" @click="$emit(\'click\', $event)"><slot /></button>',
})

const SlotStub = defineComponent({
  name: 'SlotStub',
  template: '<div><slot name="activator" :props="{}" /><slot /></div>',
})

function createWrapper (props?: Record<string, unknown>) {
  return mount(DescriptorList, {
    props: {
      copiedDescriptorAvailable: true,
      copyJsonIcon: 'mdi-clipboard-text-outline',
      descriptors: [descriptor],
      isLoading: false,
      selectedDescriptorId: descriptor.id,
      ...props,
    },
    global: {
      stubs: {
        DescriptorListItem: DescriptorListItemStub,
        VBtn: VBtnStub,
        VChip: { template: '<span><slot /></span>' },
        VDivider: true,
        VEmptyState: true,
        VIcon: true,
        VList: { template: '<div><slot /></div>' },
        VListItem: { template: '<div><slot name="prepend" /><slot /><slot name="append" /></div>' },
        VListItemSubtitle: { template: '<div><slot /></div>' },
        VProgressCircular: true,
        VSheet: { template: '<div><slot /></div>' },
        VSkeletonLoader: true,
        VTooltip: SlotStub,
      },
    },
  })
}

describe('DescriptorList.vue', () => {
  it('marks the selected descriptor and forwards descriptor item events', async () => {
    const wrapper = createWrapper()
    const item = wrapper.findComponent(DescriptorListItemStub)

    expect(item.props('selected')).toBe(true)

    item.vm.$emit('select', descriptor)
    item.vm.$emit('edit', descriptor)
    item.vm.$emit('delete', descriptor)
    item.vm.$emit('copy', descriptor)
    item.vm.$emit('copy-json', descriptor)

    expect(wrapper.emitted('select')?.[0]).toEqual([descriptor])
    expect(wrapper.emitted('edit')?.[0]).toEqual([descriptor])
    expect(wrapper.emitted('delete')?.[0]).toEqual([descriptor])
    expect(wrapper.emitted('copy')?.[0]).toEqual([descriptor])
    expect(wrapper.emitted('copy-json')?.[0]).toEqual([descriptor])
  })

  it('emits load-more from the fallback button', async () => {
    const wrapper = createWrapper({ hasMoreDescriptors: true })
    const loadMoreButton = wrapper.findAll('button')
      .find(button => button.text().includes('Load more'))

    expect(loadMoreButton).toBeDefined()
    await loadMoreButton?.trigger('click')

    expect(wrapper.emitted('load-more')).toHaveLength(1)
  })
})
