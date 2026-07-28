import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import Treeview from '@/components/UIComponents/Treeview.vue'

const state = vi.hoisted(() => ({
  routeName: 'AASEditor',
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({
    get name () {
      return state.routeName
    },
    query: {},
  }),
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('@/composables/AAS/ReferableUtils', () => ({
  useReferableUtils: () => ({ nameToDisplay: (item: any) => item.idShort }),
}))

vi.mock('@/composables/ClipboardUtil', () => ({
  useClipboardUtil: () => ({
    copyToClipboard: vi.fn(),
    copyJsonToClipboard: vi.fn(),
    pasteElement: vi.fn(),
  }),
}))

vi.mock('@/store/AASDataStore', () => ({
  useAASStore: () => ({ getSelectedNode: {} }),
}))

vi.mock('@/store/ClipboardStore', () => ({
  useClipboardStore: () => ({
    getClipboardElementModelType: () => undefined,
    setClipboardContent: vi.fn(),
  }),
}))

vi.mock('@/store/NavigationStore', () => ({
  useNavigationStore: () => ({
    getIsMobile: false,
    dispatchSnackbar: vi.fn(),
  }),
}))

const slotStub = { template: '<div><slot /></div>' }
const listItemStub = {
  name: 'VListItem',
  template: '<div data-test="list-item"><slot name="prepend" /><slot /><slot name="append" /></div>',
}
const hoverStub = {
  template: '<div><slot :is-hovering="true" :props="{}" /></div>',
}
const menuStub = defineComponent({
  setup (_props, { slots }) {
    const isActive = ref(true)
    return () => h('div', [
      slots.activator?.({ props: {} }),
      slots.default?.({ isActive }),
    ])
  },
})

function mountTreeview (kind: 'Template' | 'Instance') {
  return mount(Treeview, {
    props: {
      item: {
        id: 'urn:example:submodel',
        idShort: 'Example',
        modelType: 'Submodel',
        kind,
        path: 'https://example.test/submodels/example',
      },
    },
    global: {
      stubs: {
        'v-hover': hoverStub,
        'v-lazy': slotStub,
        'v-list-item': listItemStub,
        'v-list-item-title': slotStub,
        'v-list-item-subtitle': slotStub,
        'v-list': slotStub,
        'v-sheet': slotStub,
        'v-menu': menuStub,
        'v-btn': true,
        'v-chip': slotStub,
        'v-divider': true,
        'v-icon': slotStub,
        'v-tooltip': true,
      },
    },
  })
}

describe('Treeview Submodel conversion action', () => {
  it('shows the action only for template Submodels', () => {
    state.routeName = 'AASEditor'

    expect(mountTreeview('Template').text()).toContain('Convert to Instance')
    expect(mountTreeview('Instance').text()).not.toContain('Convert to Instance')
  })

  it('does not show the action outside an editor route', () => {
    state.routeName = 'AASViewer'

    expect(mountTreeview('Template').text()).not.toContain('Convert to Instance')
  })

  it('closes the menu and emits the selected Submodel when the action is clicked', async () => {
    state.routeName = 'AASEditor'
    const wrapper = mountTreeview('Template')
    const item = wrapper.props('item')
    const action = wrapper.findAll('*')
      .find(element => element.text() === 'Convert to Instance')

    expect(action).toBeDefined()
    await action!.trigger('click')

    expect(wrapper.emitted('convert-to-instance')).toEqual([[item]])
  })
})
