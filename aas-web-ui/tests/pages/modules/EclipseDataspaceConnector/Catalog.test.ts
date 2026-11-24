import type { CatenaXPartner } from '@/types/Infrastructure'
import type * as Vuetify from 'vuetify'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { reactive } from 'vue'
import Catalog from '@/pages/modules/EclipseDataspaceConnector/components/Catalog/Catalog.vue'

const mocks = vi.hoisted(() => ({
  queryCatalogPage: vi.fn(),
  fetchData: vi.fn(),
  dispatchSnackbar: vi.fn(),
  infrastructureStore: null as unknown as { getSelectedInfrastructure: { catenaX: { edc: Record<string, unknown> } } },
}))

vi.mock('@/composables/Client/CatenaXEdcClient', () => ({
  useCatenaXEdcClient: () => ({ fetchData: mocks.fetchData }),
}))

vi.mock('@/pages/modules/EclipseDataspaceConnector/composables/EdcCatalogQuery', () => ({
  useEdcCatalogQuery: () => ({ queryCatalogPage: mocks.queryCatalogPage, findCatalogDataset: vi.fn() }),
}))

vi.mock('@/pages/modules/EclipseDataspaceConnector/composables/EdcDialogRoute', async () => {
  const { ref } = await import('vue')
  return { useEdcDialogRoute: () => ({ dialogOpen: () => ref(false), dialogState: () => ref(null) }) }
})

vi.mock('@/composables/ClipboardUtil', () => ({
  useClipboardUtil: () => ({ copyToClipboard: vi.fn() }),
}))

vi.mock('@/store/InfrastructureStore', () => ({
  useInfrastructureStore: () => mocks.infrastructureStore,
}))

vi.mock('@/store/NavigationStore', () => ({
  useNavigationStore: () => ({ getSnackbar: { status: false }, dispatchSnackbar: mocks.dispatchSnackbar }),
}))

vi.mock('vuetify', async importOriginal => {
  const current = { value: { colors: { primary: '#1976d2' }, dark: false } }
  return { ...(await importOriginal<typeof Vuetify>()), useTheme: () => ({ current, global: { current } }) }
})

const partnerA: CatenaXPartner = { id: 'partner-a', name: 'Partner A', counterPartyId: 'BPNL-A', counterPartyAddress: 'https://a.test/api/v1/dsp' }
const partnerB: CatenaXPartner = { id: 'partner-b', name: 'Partner B', counterPartyId: 'BPNL-B', counterPartyAddress: 'https://b.test/api/v1/dsp' }

const slotStub = { template: '<div><slot /></div>' }
const selectStub = { props: ['label', 'items', 'modelValue'], emits: ['update:modelValue'], template: '<div />' }
const buttonStub = { props: ['text'], emits: ['click'], template: '<button :data-text="text" @click="$emit(\'click\')">{{ text }}</button>' }

function mountCatalog () {
  const wrapper = mount(Catalog, {
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
        'v-sheet': slotStub,
        'v-select': selectStub,
        'v-virtual-scroll': { props: ['items'], template: '<div><div v-for="item in items" :key="item[\'@id\']"><slot :item="item" /></div></div>' },
        'v-list-item': { emits: ['click'], template: '<div class="dataset" @click="$emit(\'click\')"><slot /></div>' },
        'v-list-item-title': true,
        'v-list-item-subtitle': slotStub,
        'v-btn': buttonStub,
        'v-empty-state': { props: ['title'], template: '<div class="empty">{{ title }}</div>' },
        'JSONPreview': { props: ['title', 'jsonContent'], template: '<div class="preview" :data-title="title">{{ JSON.stringify(jsonContent) }}</div>' },
        'SendDataDialog': true,
        'ImportSubmodelDialog': true,
        'v-tooltip': true,
        'v-menu': true,
        'v-divider': true,
        'v-spacer': true,
        'v-icon': true,
        'v-skeleton-loader': true,
        'v-progress-linear': true,
      },
    },
  })
  const partnerSelect = wrapper.findAllComponents(selectStub)
    .find(select => select.props('label') === 'Select Business Partner') as VueWrapper<any>
  return { wrapper, partnerSelect }
}

function datasetIds (wrapper: VueWrapper<any>): string[] {
  return wrapper.findAll('.dataset').map(dataset => dataset.text())
}

function previewTitles (wrapper: VueWrapper<any>): string[] {
  return wrapper.findAll('.preview').map(preview => preview.attributes('data-title')!)
}

function catalogOf (partner: CatenaXPartner, ids: string[]) {
  return { success: true, data: ids.map(id => ({ '@id': id, 'partner': partner.id })), hasMore: false }
}

describe('Catalog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.infrastructureStore = reactive({
      getSelectedInfrastructure: { catenaX: { edc: { proxyId: 'proxy-a', partners: [partnerA, partnerB], defaultPartnerId: 'partner-a' } } },
    })
    mocks.queryCatalogPage.mockImplementation(async (_proxyId: string, partner: CatenaXPartner) =>
      catalogOf(partner, partner.id === 'partner-a' ? ['asset-a1', 'asset-a2'] : ['asset-b1']))
  })

  it('loads the catalog of the default partner and of a newly selected one, without the previous selection', async () => {
    const { wrapper, partnerSelect } = mountCatalog()
    await flushPromises()
    expect(mocks.queryCatalogPage).toHaveBeenLastCalledWith('proxy-a', expect.objectContaining({ id: 'partner-a' }), 'all', expect.anything())
    expect(datasetIds(wrapper)).toEqual(['asset-a1', 'asset-a2'])

    await wrapper.find('.dataset').trigger('click')
    expect(previewTitles(wrapper)).toEqual(['Catalog Dataset'])

    partnerSelect.vm.$emit('update:modelValue', partnerB)
    await flushPromises()

    expect(mocks.queryCatalogPage).toHaveBeenLastCalledWith('proxy-a', expect.objectContaining({ id: 'partner-b' }), 'all', expect.anything())
    expect(datasetIds(wrapper)).toEqual(['asset-b1'])
    expect(previewTitles(wrapper)).toEqual([])
    expect(wrapper.text()).toContain('Select Catalog Dataset')
  })

  it('keeps no catalog of the previous partner when the new one has no address', async () => {
    const { wrapper, partnerSelect } = mountCatalog()
    await flushPromises()

    partnerSelect.vm.$emit('update:modelValue', { ...partnerB, counterPartyAddress: '' })
    await flushPromises()

    expect(mocks.queryCatalogPage).toHaveBeenCalledTimes(1)
    expect(datasetIds(wrapper)).toEqual([])
  })

  it('fetches the data of the selected dataset from the partner and shows it', async () => {
    mocks.fetchData.mockResolvedValue({ success: true, data: { data: { value: 42 } } })
    const { wrapper } = mountCatalog()
    await flushPromises()
    await wrapper.find('.dataset').trigger('click')

    await wrapper.find('button[data-text="Fetch Data"]').trigger('click')
    await flushPromises()

    expect(mocks.fetchData).toHaveBeenCalledWith('proxy-a', {
      counterPartyId: 'BPNL-A',
      counterPartyAddress: 'https://a.test/api/v1/dsp',
      assetId: 'asset-a1',
    })
    expect(previewTitles(wrapper)).toEqual(['Catalog Dataset', 'Fetched Data'])
    expect(wrapper.find('.preview[data-title="Fetched Data"]').text()).toBe('{"value":42}')
    expect(wrapper.find('button[data-text="Data Fetched"]').exists()).toBe(true)
  })

  it('drops fetched data of a dataset that is no longer selected', async () => {
    let resolveFetch: (result: unknown) => void = () => {}
    mocks.fetchData.mockReturnValue(new Promise(resolve => {
      resolveFetch = resolve
    }))
    const { wrapper } = mountCatalog()
    await flushPromises()
    await wrapper.findAll('.dataset')[0]!.trigger('click')
    await wrapper.find('button[data-text="Fetch Data"]').trigger('click')

    await wrapper.findAll('.dataset')[1]!.trigger('click')
    resolveFetch({ success: true, data: { data: { value: 42 } } })
    await flushPromises()

    expect(previewTitles(wrapper)).toEqual(['Catalog Dataset'])
    expect(wrapper.find('.preview').text()).toContain('asset-a2')
  })

  it('shows a failure message when the fetch fails', async () => {
    mocks.fetchData.mockResolvedValue({ success: false, status: 502 })
    const { wrapper } = mountCatalog()
    await flushPromises()
    await wrapper.find('.dataset').trigger('click')

    await wrapper.find('button[data-text="Fetch Data"]').trigger('click')
    await flushPromises()

    expect(mocks.dispatchSnackbar).toHaveBeenCalledWith(expect.objectContaining({ baseError: 'Failed to fetch the data.' }))
    expect(previewTitles(wrapper)).toEqual(['Catalog Dataset'])
  })
})
