import type { EdcListPage, EdcPageResult } from '@/pages/modules/EclipseDataspaceConnector/composables/EdcPaging'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest'
import { reactive } from 'vue'
import EdcResourceTab from '@/pages/modules/EclipseDataspaceConnector/components/Shared/EdcResourceTab.vue'

const mocks = vi.hoisted(() => ({
  dispatchSnackbar: vi.fn(),
  fetchStatus: vi.fn(),
  infrastructureStore: null as unknown as { getSelectedInfrastructure: { catenaX: { edc: { proxyId: string } } } },
}))

vi.mock('@/composables/Client/CatenaXEdcClient', () => ({
  useCatenaXEdcClient: () => ({ fetchStatus: mocks.fetchStatus }),
}))

vi.mock('@/store/InfrastructureStore', () => ({
  useInfrastructureStore: () => mocks.infrastructureStore,
}))

vi.mock('@/store/NavigationStore', () => ({
  useNavigationStore: () => ({ getSnackbar: { status: false }, dispatchSnackbar: mocks.dispatchSnackbar }),
}))

const slotStub = { template: '<div><slot /></div>' }
const resourcesOf = (ids: string[]) => ids.map(id => ({ '@id': id }))

type QueryPage = (proxyId: string, page: EdcListPage) => Promise<EdcPageResult<any>>

function mountTab (queryPage: Mock<QueryPage>) {
  return mount(EdcResourceTab, {
    props: { label: 'Asset', labelPlural: 'Assets', icon: 'mdi-code-json', createActions: [], queryPage, update: vi.fn() },
    global: {
      stubs: {
        'v-container': slotStub,
        'v-layout': slotStub,
        'v-navigation-drawer': slotStub,
        'v-card': slotStub,
        'v-card-title': slotStub,
        'v-card-text': slotStub,
        'v-main': slotStub,
        'v-list': slotStub,
        'v-virtual-scroll': { props: ['items'], template: '<div><div v-for="item in items" :key="item[\'@id\']"><slot :item="item" /></div></div>' },
        'v-text-field': { props: ['modelValue'], emits: ['update:modelValue'], template: '<input class="search" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)">' },
        'EdcResourceListItem': {
          props: ['resource'],
          emits: ['select', 'edit'],
          template: '<div class="item" @click="$emit(\'select\')">{{ resource[\'@id\'] }}<button class="edit" @click.stop="$emit(\'edit\')" /></div>',
        },
        'UpdateEdcResourceDialog': { props: ['modelValue', 'resource'], template: '<div v-if="modelValue" class="update-dialog">{{ resource[\'@id\'] }}</div>' },
        'DeleteEdcResourceDialog': true,
        'JSONPreview': { props: ['jsonContent'], template: '<div class="preview">{{ jsonContent[\'@id\'] }}</div>' },
        'v-tooltip': true,
        'v-menu': true,
        'v-btn': true,
        'v-divider': true,
        'v-skeleton-loader': true,
        'v-progress-linear': true,
        'v-empty-state': { props: ['title'], template: '<div class="empty">{{ title }}</div>' },
        'v-icon': true,
      },
    },
  })
}

describe('EdcResourceTab', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.fetchStatus.mockResolvedValue({ managementWritesAllowed: false })
    mocks.infrastructureStore = reactive({ getSelectedInfrastructure: { catenaX: { edc: { proxyId: 'proxy-a' } } } })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('loads the first page from the selected proxy', async () => {
    const queryPage = vi.fn<QueryPage>().mockResolvedValue({ success: true, data: resourcesOf(['asset-1', 'asset-2']) })
    const wrapper = mountTab(queryPage)
    await flushPromises()

    expect(queryPage).toHaveBeenCalledWith('proxy-a', { offset: 0, limit: 50, search: undefined })
    expect(wrapper.findAll('.item').map(item => item.text())).toEqual(['asset-1', 'asset-2'])
  })

  it('searches the EDC and loads the first page again', async () => {
    vi.useFakeTimers()
    const queryPage = vi.fn<QueryPage>()
      .mockResolvedValueOnce({ success: true, data: resourcesOf(['asset-1', 'dtr-1']) })
      .mockResolvedValueOnce({ success: true, data: resourcesOf(['dtr-1']) })
    const wrapper = mountTab(queryPage)
    await flushPromises()

    await wrapper.find('input.search').setValue(' dtr ')
    await vi.advanceTimersByTimeAsync(300)
    await flushPromises()

    expect(queryPage).toHaveBeenLastCalledWith('proxy-a', { offset: 0, limit: 50, search: 'dtr' })
    expect(wrapper.findAll('.item').map(item => item.text())).toEqual(['dtr-1'])
  })

  it('shows a failed first page', async () => {
    const queryPage = vi.fn<QueryPage>().mockResolvedValue({ success: false, status: 502 })
    const wrapper = mountTab(queryPage)
    await flushPromises()

    expect(wrapper.find('.item').exists()).toBe(false)
    expect(wrapper.text()).toContain('Assets Not Available')
    expect(mocks.dispatchSnackbar).toHaveBeenCalledWith(expect.objectContaining({ baseError: 'Failed to load the Assets.' }))
  })

  it('loads the list from the new proxy after switching the infrastructure, without the selection and dialogs of the previous one', async () => {
    mocks.fetchStatus.mockResolvedValue({ managementWritesAllowed: true })
    const queryPage = vi.fn<QueryPage>(async proxyId => ({
      success: true,
      data: resourcesOf(proxyId === 'proxy-a' ? ['asset-a'] : ['asset-b']),
    }))
    const wrapper = mountTab(queryPage)
    await flushPromises()
    await wrapper.find('.item').trigger('click')
    await wrapper.find('.item .edit').trigger('click')
    expect(wrapper.find('.preview').text()).toBe('asset-a')
    expect(wrapper.find('.update-dialog').text()).toBe('asset-a')

    mocks.infrastructureStore.getSelectedInfrastructure = { catenaX: { edc: { proxyId: 'proxy-b' } } }
    await flushPromises()

    expect(queryPage).toHaveBeenLastCalledWith('proxy-b', { offset: 0, limit: 50, search: undefined })
    expect(wrapper.findAll('.item').map(item => item.text())).toEqual(['asset-b'])
    expect(wrapper.find('.preview').exists()).toBe(false)
    expect(wrapper.find('.update-dialog').exists()).toBe(false)
    expect(wrapper.emitted('proxy-change')).toEqual([['proxy-b']])
  })
})
