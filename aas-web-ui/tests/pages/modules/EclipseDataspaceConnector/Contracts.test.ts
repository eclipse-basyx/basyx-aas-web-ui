import type { EdcListPage, EdcPageResult } from '@/pages/modules/EclipseDataspaceConnector/composables/EdcPaging'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import Contracts from '@/pages/modules/EclipseDataspaceConnector/components/Contracts/Contracts.vue'

const mocks = vi.hoisted(() => ({
  queryContractDefinitions: vi.fn(),
  loadResources: vi.fn(),
}))

vi.mock('@/composables/Client/CatenaXEdcClient', () => ({
  useCatenaXEdcClient: () => ({
    queryContractDefinitions: mocks.queryContractDefinitions,
    deleteContractDefinition: vi.fn(),
    updateContractDefinition: vi.fn(),
  }),
}))

vi.mock('@/pages/modules/EclipseDataspaceConnector/composables/EdcAssetTypeQuery', () => ({
  useEdcAssetTypeQuery: () => ({ queryAssetsOfType: vi.fn() }),
}))

vi.mock('@/pages/modules/EclipseDataspaceConnector/composables/EdcDialogRoute', () => ({
  useEdcDialogRoute: () => ({ dialogOpen: () => ref(false) }),
}))

// The tab loads the list with `queryPage` and reloads it on `loadResources`
vi.mock('@/pages/modules/EclipseDataspaceConnector/components/Shared/EdcResourceTab.vue', () => ({
  default: {
    name: 'EdcResourceTab',
    props: ['queryPage'],
    emits: ['proxy-change'],
    setup (_props: unknown, { expose }: { expose: (exposed: Record<string, unknown>) => void }) {
      expose({ loadResources: mocks.loadResources })
    },
    template: '<div><slot name="filter" /></div>',
  },
}))

type QueryPage = (proxyId: string, page: EdcListPage) => Promise<EdcPageResult<any>>

const filterSelectStub = { props: ['items', 'modelValue'], emits: ['update:modelValue', 'update:menu'], template: '<div />' }
const policyFilter = { type: 'accessPolicy', value: 'access-1' }
const contract = { '@id': 'contract-1', 'accessPolicyId': 'access-1', 'contractPolicyId': 'usage-1', 'assetsSelector': [] }

function mountContracts () {
  const wrapper = mount(Contracts, {
    global: {
      stubs: {
        'v-select': filterSelectStub,
        'CreateContractDialog': true,
      },
    },
  })
  return {
    wrapper,
    tab: wrapper.findComponent({ name: 'EdcResourceTab' }) as VueWrapper<any>,
    filterSelect: wrapper.findComponent(filterSelectStub) as VueWrapper<any>,
  }
}

function policyFilterTitles (filterSelect: VueWrapper<any>): string[] {
  return (filterSelect.props('items') as Array<{ title: string, value?: { type: string } }>)
    .filter(item => item.value?.type === 'accessPolicy' || item.value?.type === 'usagePolicy')
    .map(item => item.title)
}

describe('Contracts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.queryContractDefinitions.mockResolvedValue({ success: true, data: [contract] })
  })

  it('keeps a policy filter that no contract uses anymore, without loading the list again', async () => {
    const { tab, filterSelect } = mountContracts()
    filterSelect.vm.$emit('update:menu', true)
    await flushPromises()
    filterSelect.vm.$emit('update:modelValue', policyFilter)
    await flushPromises()
    expect(mocks.loadResources).toHaveBeenCalledTimes(1)

    // The last contract with the policy was deleted
    mocks.queryContractDefinitions.mockResolvedValue({ success: true, data: [] })
    const result = await (tab.props('queryPage') as QueryPage)('proxy-a', { offset: 0, limit: 50 })
    filterSelect.vm.$emit('update:menu', true)
    await flushPromises()

    expect(result).toEqual({ success: true, data: [], hasMore: false })
    expect(filterSelect.props('modelValue')).toEqual(policyFilter)
    expect(policyFilterTitles(filterSelect)).toEqual(['access-1'])
    expect(mocks.loadResources).toHaveBeenCalledTimes(1)
  })

  it('shows all contracts of the new EDC after a proxy change, loaded once by the tab', async () => {
    const { tab, filterSelect } = mountContracts()
    filterSelect.vm.$emit('update:menu', true)
    await flushPromises()
    filterSelect.vm.$emit('update:modelValue', policyFilter)
    await flushPromises()

    tab.vm.$emit('proxy-change', 'proxy-b')
    await flushPromises()

    expect(filterSelect.props('modelValue')).toEqual({ type: 'all', value: '' })
    expect(policyFilterTitles(filterSelect)).toEqual([])
    expect(mocks.loadResources).toHaveBeenCalledTimes(1) // Only for the filter chosen before

    filterSelect.vm.$emit('update:menu', true)
    await flushPromises()
    expect(mocks.queryContractDefinitions).toHaveBeenLastCalledWith('proxy-b', expect.anything())
  })
})
