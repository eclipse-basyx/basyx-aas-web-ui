import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Models3D from '@/components/Plugins/Submodels/Models3D_v1_0.vue'
import ur5eSubmodel from './fixtures/models3d.ur5e.json'

vi.mock('@/composables/AAS/SMHandling', () => ({
  // The real implementation additionally assigns the element paths
  useSMHandling: () => ({ setData: async (element: any) => ({ ...element, timestamp: 'now' }) }),
}))

vi.mock('@/composables/AAS/ReferableUtils', () => ({
  useReferableUtils: () => ({
    nameToDisplay: (_element: any, _language: string, fallback: string) => fallback,
  }),
}))

const slotStub = { template: '<div><slot /></div>' }

const globalStubs = {
  'v-container': slotStub,
  'v-card': slotStub,
  'v-chip': slotStub,
  'v-chip-group': slotStub,
  'v-icon': true,
  'v-spacer': true,
  'v-divider': true,
  'v-skeleton-loader': { template: '<div data-test="loading" />' },
  'v-alert': { template: '<div data-test="empty"><slot /></div>' },
  'LastSync': { template: '<div data-test="last-sync" />' },
  'Models3DModelSwitcher': { template: '<div data-test="model-list" />' },
  'Models3DVersionMenu': { template: '<div data-test="version-menu" />' },
  'Models3DSummary': { template: '<div data-test="summary" />' },
  'Models3DViewerCard': { template: '<div data-test="viewer" />', props: ['version', 'title'] },
  'Models3DDetails': { template: '<div data-test="details" />' },
}

function mountPlugin (submodel: unknown) {
  return mount(Models3D, {
    props: { submodelElementData: submodel as any },
    global: { stubs: globalStubs },
  })
}

function withModels (count: number) {
  const submodel = structuredClone(ur5eSubmodel) as any
  const list = submodel.submodelElements[0]
  list.value = Array.from({ length: count }, () => structuredClone(list.value[0]))
  return { ...submodel, path: '/submodels/abc' }
}

describe('Models3D_v1_0', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('declares the Models3D 1.0 semanticId', () => {
    expect((Models3D as any).semanticId).toBe('https://admin-shell.io/idta/Models3D/1/0')
  })

  it('shows a single model with viewer and details but without a list', async () => {
    const wrapper = mountPlugin(withModels(1))
    await flushPromises()

    expect(wrapper.find('[data-test="viewer"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="summary"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="details"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="model-list"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('UR5e robot arm with PG-85 gripper (visualisation model)')
  })

  it('shows a model list when there are several models', async () => {
    const wrapper = mountPlugin(withModels(3))
    await flushPromises()

    expect(wrapper.find('[data-test="model-list"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('3')
  })

  it('shows an info alert when the submodel contains no models', async () => {
    const wrapper = mountPlugin({ idShort: 'Models3D', modelType: 'Submodel', path: '/submodels/abc', submodelElements: [] })
    await flushPromises()

    expect(wrapper.find('[data-test="empty"]').text()).toContain('No 3D models found')
    expect(wrapper.find('[data-test="viewer"]').exists()).toBe(false)
  })

  it('re-parses when the submodel changes', async () => {
    const wrapper = mountPlugin(withModels(1))
    await flushPromises()
    expect(wrapper.find('[data-test="model-list"]').exists()).toBe(false)

    await wrapper.setProps({ submodelElementData: { ...withModels(2), id: 'other' } })
    await flushPromises()
    expect(wrapper.find('[data-test="model-list"]').exists()).toBe(true)
  })
})
