import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import AASListDetails from '@/components/AppNavigation/AASListDetails.vue'

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
    getSelectedAAS: {
      id: 'urn:example:old-aas',
      path: 'https://infra-1.example/shells/old-aas',
      assetInformation: { assetKind: 'Instance' },
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
})
