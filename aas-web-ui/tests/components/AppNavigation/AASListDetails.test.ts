import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import AASListDetails from '@/components/AppNavigation/AASListDetails.vue'

const state = vi.hoisted(() => ({
  selectedAAS: null as any,
  infrastructureId: null as any,
}))

const mocks = vi.hoisted(() => ({
  aasIsAvailableById: vi.fn(),
  fetchAas: vi.fn(),
  fetchAssetInformation: vi.fn(),
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({ query: {} }),
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('@/composables/AAS/AASHandling', () => ({
  useAASHandling: () => ({
    aasIsAvailableById: mocks.aasIsAvailableById,
    fetchAas: mocks.fetchAas,
  }),
}))

vi.mock('@/composables/Client/AASRepositoryClient', () => ({
  useAASRepositoryClient: () => ({
    fetchAssetInformation: mocks.fetchAssetInformation,
  }),
}))

vi.mock('@/store/AASDataStore', () => ({
  useAASStore: () => ({
    get getSelectedAAS () {
      return state.selectedAAS.value
    },
  }),
}))

vi.mock('@/store/EnvironmentStore', () => ({
  useEnvStore: () => ({
    getSingleAas: false,
  }),
}))

vi.mock('@/store/InfrastructureStore', () => ({
  useInfrastructureStore: () => ({
    getAASRegistryURL: 'https://infra-1.example/shell-descriptors',
    getAASRepoURL: 'https://infra-1.example/shells',
    get getSelectedInfrastructureId () {
      return state.infrastructureId.value
    },
  }),
}))

vi.mock('@/store/NavigationStore', () => ({
  useNavigationStore: () => ({
    getIsMobile: false,
    getAutoSync: { state: false, interval: 1000 },
    getStatusCheck: { state: false, interval: 1000 },
  }),
}))

describe('AASListDetails', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    mocks.aasIsAvailableById.mockResolvedValue(true)
    mocks.fetchAas.mockResolvedValue({})
    mocks.fetchAssetInformation.mockResolvedValue({})
    state.selectedAAS = ref({
      id: 'urn:example:old-aas',
      path: 'https://infra-1.example/shells/old-aas',
      assetInformation: { assetKind: 'Instance' },
    })
    state.infrastructureId = ref('infra-1')
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('cancels a delayed AAS status lookup when the selected AAS view is removed', async () => {
    const wrapper = mount(AASListDetails, {
      shallow: true,
    })

    await flushPromises()
    wrapper.unmount()
    await vi.advanceTimersByTimeAsync(600)

    expect(mocks.aasIsAvailableById).not.toHaveBeenCalled()
  })

  it('does not replace current details with late data from the previously selected AAS', async () => {
    let resolveOld!: (value: any) => void
    let resolveNew!: (value: any) => void
    mocks.fetchAssetInformation
      .mockReturnValueOnce(new Promise(resolve => {
        resolveOld = resolve
      }))
      .mockReturnValueOnce(new Promise(resolve => {
        resolveNew = resolve
      }))

    const wrapper = mount(AASListDetails, { shallow: true })
    await flushPromises()

    state.selectedAAS.value = {
      id: 'urn:example:new-aas',
      path: 'https://infra-1.example/shells/new-aas',
      assetInformation: { assetKind: 'Instance' },
    }
    await nextTick()
    await flushPromises()

    resolveNew({ assetKind: 'Instance', globalAssetId: 'new-asset' })
    await flushPromises()
    resolveOld({ assetKind: 'Instance', globalAssetId: 'old-asset' })
    await flushPromises()

    expect((wrapper.vm as any).assetInformation.globalAssetId).toBe('new-asset')
  })
})
