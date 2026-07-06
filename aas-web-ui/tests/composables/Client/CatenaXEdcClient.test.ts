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

  it('does not call the BFF without a proxy ID', async () => {
    const { fetchStatus, fetchDtrShellDescriptors } = useCatenaXEdcClient()

    await expect(fetchStatus('')).resolves.toBeNull()
    await expect(fetchDtrShellDescriptors('  ', {
      counterPartyId: 'TEST_PARTICIPANT_ID',
      counterPartyAddress: 'https://counterparty-dsp.test/api/v1/dsp',
    })).resolves.toBeNull()

    expect(mocks.getRequest).not.toHaveBeenCalled()
    expect(mocks.postRequest).not.toHaveBeenCalled()
  })

  it('posts connector discovery requests', async () => {
    mocks.postRequest.mockResolvedValue({ success: true, data: [{ protocol: 'dataspace-protocol-http:2025-1' }] })

    const { discoverConnector } = useCatenaXEdcClient()
    const result = await discoverConnector('default', {
      mode: 'connectors',
      counterPartyId: 'TEST_COUNTERPARTY_ID',
    })

    expect(mocks.postRequest).toHaveBeenCalledWith(
      '/ui/api/catena-x/edc/default/connectors/discover',
      JSON.stringify({
        mode: 'connectors',
        counterPartyId: 'TEST_COUNTERPARTY_ID',
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
      counterPartyId: 'TEST_COUNTERPARTY_ID',
      counterPartyAddress: 'https://counterparty-dsp.test/api/v1/dsp',
    })

    expect(mocks.postRequest).toHaveBeenCalledWith(
      '/api/catena-x/edc/default/catalog/request',
      JSON.stringify({
        counterPartyId: 'TEST_COUNTERPARTY_ID',
        counterPartyAddress: 'https://counterparty-dsp.test/api/v1/dsp',
      }),
      expect.any(Headers),
      'requesting EDC catalog',
      true,
    )
    expect(result).toEqual({ dataset: [] })
  })

  it('posts DTR descriptor page requests through the EDC proxy', async () => {
    mocks.postRequest.mockResolvedValue({
      success: true,
      data: {
        data: { result: [{ id: 'aas-1' }] },
        edc: { transferProcessId: 'transfer-1' },
      },
    })

    const { fetchDtrShellDescriptors } = useCatenaXEdcClient()
    const result = await fetchDtrShellDescriptors('default', {
      counterPartyId: 'TEST_PARTICIPANT_ID',
      counterPartyAddress: 'https://counterparty-dsp.test/api/v1/dsp',
      protocol: 'dataspace-protocol-http',
      limit: 100,
    })

    expect(mocks.postRequest).toHaveBeenCalledWith(
      '/ui/api/catena-x/edc/default/dtr/shell-descriptors',
      JSON.stringify({
        counterPartyId: 'TEST_PARTICIPANT_ID',
        counterPartyAddress: 'https://counterparty-dsp.test/api/v1/dsp',
        protocol: 'dataspace-protocol-http',
        limit: 100,
      }),
      expect.any(Headers),
      'fetching DTR descriptors through EDC',
      true,
    )
    expect(result?.edc.transferProcessId).toBe('transfer-1')
  })

  it('posts DTR descriptor by ID requests through the EDC proxy', async () => {
    mocks.postRequest.mockResolvedValue({
      success: true,
      data: {
        data: { id: 'aas-1' },
        edc: { transferProcessId: 'transfer-1' },
      },
    })

    const { fetchDtrShellDescriptorById } = useCatenaXEdcClient()
    const result = await fetchDtrShellDescriptorById('default', {
      counterPartyId: 'TEST_PARTICIPANT_ID',
      counterPartyAddress: 'https://counterparty-dsp.test/api/v1/dsp',
      descriptorId: 'aas-1',
      transferProcessId: 'transfer-1',
    })

    expect(mocks.postRequest).toHaveBeenCalledWith(
      '/ui/api/catena-x/edc/default/dtr/shell-descriptors/by-id',
      JSON.stringify({
        counterPartyId: 'TEST_PARTICIPANT_ID',
        counterPartyAddress: 'https://counterparty-dsp.test/api/v1/dsp',
        descriptorId: 'aas-1',
        transferProcessId: 'transfer-1',
      }),
      expect.any(Headers),
      'fetching DTR descriptor through EDC',
      true,
    )
    expect(result?.data).toEqual({ id: 'aas-1' })
  })
})
