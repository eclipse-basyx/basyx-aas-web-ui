import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useRouteHandling } from '@/composables/routeHandling'

const mockDeps = vi.hoisted(() => ({
  getRequest: vi.fn(),
  infrastructureStore: {
    getSelectedInfrastructure: null as any,
  },
}))

vi.mock('@/composables/AAS/AASHandling', () => ({
  useAASHandling: () => ({ getAasEndpointById: vi.fn() }),
}))

vi.mock('@/composables/AAS/SMHandling', () => ({
  useSMHandling: () => ({ getSmEndpointById: vi.fn() }),
}))

vi.mock('@/composables/Client/AASDiscoveryClient', () => ({
  useAASDiscoveryClient: () => ({ getAasId: vi.fn() }),
}))

vi.mock('@/composables/RequestHandling', () => ({
  useRequestHandling: () => ({ getRequest: mockDeps.getRequest }),
}))

vi.mock('@/store/InfrastructureStore', () => ({
  useInfrastructureStore: () => mockDeps.infrastructureStore,
}))

describe('useRouteHandling.removeUnauthorizedSelection', () => {
  const infrastructure = { id: 'infrastructure-1' }
  const location = {
    path: '/aasviewer',
    query: { aas: 'https://infra.example/shells/aas', path: 'https://infra.example/submodels/sm', fragment: 'f' },
    hash: '',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockDeps.infrastructureStore.getSelectedInfrastructure = infrastructure
    mockDeps.getRequest.mockResolvedValue({ success: true, status: 200 })
  })

  it('removes the whole selection when the AAS is not authorized', async () => {
    mockDeps.getRequest.mockResolvedValueOnce({ success: false, status: 403 })
    const { removeUnauthorizedSelection } = useRouteHandling()

    const result = await removeUnauthorizedSelection(location)

    expect(result).toEqual({ path: '/aasviewer', query: {}, hash: '' })
    expect(mockDeps.getRequest).toHaveBeenCalledOnce()
    expect(mockDeps.getRequest).toHaveBeenCalledWith(
      'https://infra.example/shells/aas',
      expect.any(String),
      true,
      expect.any(Headers),
      {},
      'auto',
      { infrastructure, isolateAuthenticationFailures: true },
    )
  })

  it('keeps an authorized AAS when only the selected path is not authorized', async () => {
    mockDeps.getRequest
      .mockResolvedValueOnce({ success: true, status: 200 })
      .mockResolvedValueOnce({ success: false, status: 401 })
    const { removeUnauthorizedSelection } = useRouteHandling()

    const result = await removeUnauthorizedSelection(location)

    expect(result.query).toEqual({ aas: 'https://infra.example/shells/aas' })
    expect(mockDeps.getRequest).toHaveBeenLastCalledWith(
      'https://infra.example/submodels/sm',
      expect.any(String),
      true,
      expect.any(Headers),
      {},
      'auto',
      { infrastructure, isolateAuthenticationFailures: true },
    )
  })

  it('keeps an authorized selection', async () => {
    const { removeUnauthorizedSelection } = useRouteHandling()

    const result = await removeUnauthorizedSelection(location)

    expect(result).toEqual(location)
    expect(mockDeps.getRequest).toHaveBeenCalledTimes(2)
  })

  it('leaves other failures to the regular route validation', async () => {
    mockDeps.getRequest.mockResolvedValue({ success: false, status: 404 })
    const { removeUnauthorizedSelection } = useRouteHandling()

    const result = await removeUnauthorizedSelection(location)

    expect(result).toEqual(location)
  })

  it('does not request anything without a selection or infrastructure', async () => {
    const { removeUnauthorizedSelection } = useRouteHandling()

    expect(await removeUnauthorizedSelection({ path: '/aasviewer', query: {} })).toEqual({ path: '/aasviewer', query: {} })
    mockDeps.infrastructureStore.getSelectedInfrastructure = null
    expect(await removeUnauthorizedSelection(location)).toEqual(location)
    expect(mockDeps.getRequest).not.toHaveBeenCalled()
  })
})
