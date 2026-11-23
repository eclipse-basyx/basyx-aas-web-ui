import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import EdcResourceListItem from '@/pages/modules/EclipseDataspaceConnector/components/Shared/EdcResourceListItem.vue'

vi.mock('@/composables/ClipboardUtil', () => ({
  useClipboardUtil: () => ({ copyToClipboard: vi.fn() }),
}))

vi.mock('vuetify', () => ({
  useTheme: () => ({
    current: { value: { colors: { primary: '#000000' } } },
    global: { current: { value: { dark: false } } },
  }),
}))

const slotStub = { template: '<div><slot name="prepend" /><slot /><slot name="append" /></div>' }

function mountListItem (editable?: boolean) {
  return mount(EdcResourceListItem, {
    props: { resource: { '@id': 'asset-1' }, label: 'Asset', icon: 'mdi-code-json', selected: false, editable },
    global: {
      stubs: {
        'v-list-item': slotStub,
        'v-list-item-title': slotStub,
        'v-list-item-subtitle': slotStub,
        'v-list': slotStub,
        'v-sheet': slotStub,
        'v-menu': { template: '<div><slot name="activator" :props="{}" /><slot /></div>' },
        'v-tooltip': true,
        'v-btn': true,
        'v-icon': true,
        'v-divider': true,
      },
    },
  })
}

describe('EdcResourceListItem', () => {
  it('offers Edit and Delete when the resource is editable', () => {
    const wrapper = mountListItem(true)

    expect(wrapper.text()).toContain('Edit Asset')
    expect(wrapper.text()).toContain('Delete Asset')
    expect(wrapper.text()).toContain('Copy Asset ID')
  })

  it('offers only Copy ID when the resource is not editable', () => {
    const wrapper = mountListItem()

    expect(wrapper.text()).not.toContain('Edit Asset')
    expect(wrapper.text()).not.toContain('Delete Asset')
    expect(wrapper.text()).toContain('Copy Asset ID')
  })
})
