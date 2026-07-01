import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useCatenaXEdcClient } from '@/composables/Client/CatenaXEdcClient'

const mocks = vi.hoisted(() => ({
  getRequest: vi.fn(),
  postRequest: vi.fn(),
  basePath: '/ui/',
}))

vi.mock('@/composables/RequestHandling', () => ({
  useRequestHandling: () => ({
    getRequest: mocks.getRequest,
    postRequest: mocks.postRequest,
  }),
}))

vi.mock('@/store/EnvironmentStore', () => ({
  useEnvStore: () => ({
    getEnvBasePath: mocks.basePath,
  }),
}))

describe('CatenaXEdcClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.basePath = '/ui/'
  })

  it('fetches proxy status through the same-origin base path', async () => {
    mocks.getRequest.mockResolvedValue({
      success: true,
      data: { id: 'default', configured: true },
    })

    const { fetchStatus } = useCatenaXEdcClient()
    const result = await fetchStatus('default')

    expect(mocks.getRequest).toHaveBeenCalledWith(
      '/ui/api/catena-x/edc/default/status',
      'fetching EDC proxy status',
      true,
    )
    expect(result).toEqual({ id: 'default', configured: true })
  })

  it('returns null when status request fails', async () => {
    mocks.getRequest.mockResolvedValue({ success: false, status: 404 })

    const { fetchStatus } = useCatenaXEdcClient()

    await expect(fetchStatus('missing')).resolves.toBeNull()
  })

  it('posts connector discovery requests', async () => {
    mocks.postRequest.mockResolvedValue({ success: true, data: [{ protocol: 'dataspace-protocol-http:2025-1' }] })

    const { discoverConnector } = useCatenaXEdcClient()
    const result = await discoverConnector('default', {
      mode: 'connectors',
      counterPartyId: 'did:web:provider.example',
    })

    expect(mocks.postRequest).toHaveBeenCalledWith(
      '/ui/api/catena-x/edc/default/connectors/discover',
      JSON.stringify({
        mode: 'connectors',
        counterPartyId: 'did:web:provider.example',
      }),
      expect.any(Headers),
      'discovering EDC connector',
      true,
    )
    expect(result).toEqual([{ protocol: 'dataspace-protocol-http:2025-1' }])
  })

  it('posts catalog requests and normalizes empty base paths', async () => {
    mocks.basePath = ''
    mocks.postRequest.mockResolvedValue({ success: true, data: { dataset: [] } })

    const { requestCatalog } = useCatenaXEdcClient()
    const result = await requestCatalog('default', {
      counterPartyId: 'did:web:provider.example',
      counterPartyAddress: 'https://provider.example/api/v1/dsp',
    })

    expect(mocks.postRequest).toHaveBeenCalledWith(
      '/api/catena-x/edc/default/catalog/request',
      JSON.stringify({
        counterPartyId: 'did:web:provider.example',
        counterPartyAddress: 'https://provider.example/api/v1/dsp',
      }),
      expect.any(Headers),
      'requesting EDC catalog',
      true,
    )
    expect(result).toEqual({ dataset: [] })
  })
})
