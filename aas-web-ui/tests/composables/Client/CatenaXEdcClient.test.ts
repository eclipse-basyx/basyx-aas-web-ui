import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useCatenaXEdcClient } from '@/composables/Client/CatenaXEdcClient'

const mocks = vi.hoisted(() => ({
  consumeLastRequestFailureDetails: vi.fn(),
  deleteRequest: vi.fn(),
  getRequest: vi.fn(),
  postRequest: vi.fn(),
  putRequest: vi.fn(),
  basePath: '/ui/',
}))

vi.mock('@/composables/RequestHandling', () => ({
  useRequestHandling: () => ({
    consumeLastRequestFailureDetails: mocks.consumeLastRequestFailureDetails,
    deleteRequest: mocks.deleteRequest,
    getRequest: mocks.getRequest,
    postRequest: mocks.postRequest,
    putRequest: mocks.putRequest,
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
    mocks.consumeLastRequestFailureDetails.mockReturnValue(undefined)
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
    const { fetchStatus, fetchDtrShellDescriptors, fetchSubmodel } = useCatenaXEdcClient()

    await expect(fetchStatus('')).resolves.toBeNull()
    await expect(fetchDtrShellDescriptors('  ', {
      counterPartyId: 'TEST_PARTICIPANT_ID',
      counterPartyAddress: 'https://counterparty-dsp.test/api/v1/dsp',
    })).resolves.toBeNull()
    await expect(fetchSubmodel(' ', {
      counterPartyId: 'TEST_PARTICIPANT_ID',
      counterPartyAddress: 'https://counterparty-dsp.test/api/v1/dsp',
      subprotocolBody: 'id=submodel-asset;dspEndpoint=https://counterparty-dsp.test/api/v1/dsp',
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

  it.each([
    {
      context: 'querying EDC assets',
      data: [{ '@id': 'asset-1', 'properties': {}, 'dataAddress': {} }],
      query: () => useCatenaXEdcClient().queryAssets('default'),
      resource: 'assets',
    },
    {
      context: 'querying EDC contract definitions',
      data: [{ '@id': 'contract-1' }],
      query: () => useCatenaXEdcClient().queryContractDefinitions('default'),
      resource: 'contractdefinitions',
    },
    {
      context: 'querying EDC policy definitions',
      data: [{ '@id': 'policy-1' }],
      query: () => useCatenaXEdcClient().queryPolicyDefinitions('default'),
      resource: 'policydefinitions',
    },
  ])('queries $resource through the EDC proxy', async ({ context, data, query, resource }) => {
    mocks.postRequest.mockResolvedValue({
      success: true,
      data,
    })

    const result = await query()

    expect(mocks.postRequest).toHaveBeenCalledWith(
      `/ui/api/catena-x/edc/default/${resource}/request`,
      '{}',
      expect.any(Headers),
      context,
      true,
    )
    expect(result).toEqual(data)
  })

  it.each([
    {
      context: 'creating EDC asset',
      create: () => useCatenaXEdcClient().createAsset('default', {
        '@id': 'asset-1',
        'properties': {},
        'dataAddress': {},
      }),
      id: 'asset-1',
      payload: { '@id': 'asset-1', 'properties': {}, 'dataAddress': {} },
      resource: 'assets',
    },
    {
      context: 'creating EDC contract definition',
      create: () => useCatenaXEdcClient().createContractDefinition('default', {
        '@id': 'contract-1',
        'accessPolicyId': 'access-1',
        'contractPolicyId': 'usage-1',
        'assetsSelector': [],
      }),
      id: 'contract-1',
      payload: {
        '@id': 'contract-1',
        'accessPolicyId': 'access-1',
        'contractPolicyId': 'usage-1',
        'assetsSelector': [],
      },
      resource: 'contractdefinitions',
    },
    {
      context: 'creating EDC policy definition',
      create: () => useCatenaXEdcClient().createPolicyDefinition('default', {
        '@id': 'policy-1',
        'policy': {},
      }),
      id: 'policy-1',
      payload: { '@id': 'policy-1', 'policy': {} },
      resource: 'policydefinitions',
    },
  ])('creates $resource through the EDC proxy', async ({ context, create, id, payload, resource }) => {
    mocks.postRequest.mockResolvedValue({
      success: true,
      data: { '@id': id, 'createdAt': 1 },
    })

    const result = await create()

    expect(mocks.postRequest).toHaveBeenCalledWith(
      `/ui/api/catena-x/edc/default/${resource}`,
      JSON.stringify(payload),
      expect.any(Headers),
      context,
      true,
    )
    expect(result).toEqual({ '@id': id, 'createdAt': 1 })
  })

  it.each([
    {
      context: 'updating EDC asset',
      id: 'asset/1',
      payload: { '@id': 'asset/1', 'properties': {}, 'dataAddress': {} },
      resource: 'assets',
      update: () => useCatenaXEdcClient().updateAsset('default', 'asset/1', {
        '@id': 'asset/1',
        'properties': {},
        'dataAddress': {},
      }),
    },
    {
      context: 'updating EDC contract definition',
      id: 'contract/1',
      payload: {
        '@id': 'contract/1',
        'accessPolicyId': 'access-1',
        'contractPolicyId': 'usage-1',
        'assetsSelector': [],
      },
      resource: 'contractdefinitions',
      update: () => useCatenaXEdcClient().updateContractDefinition('default', 'contract/1', {
        '@id': 'contract/1',
        'accessPolicyId': 'access-1',
        'contractPolicyId': 'usage-1',
        'assetsSelector': [],
      }),
    },
    {
      context: 'updating EDC policy definition',
      id: 'policy/1',
      payload: { '@id': 'policy/1', 'policy': {} },
      resource: 'policydefinitions',
      update: () => useCatenaXEdcClient().updatePolicyDefinition('default', 'policy/1', {
        '@id': 'policy/1',
        'policy': {},
      }),
    },
  ])('updates $resource through the EDC proxy', async ({ context, id, payload, resource, update }) => {
    mocks.putRequest.mockResolvedValue({ success: true })

    const result = await update()

    expect(mocks.putRequest).toHaveBeenCalledWith(
      `/ui/api/catena-x/edc/default/${resource}/${encodeURIComponent(id)}`,
      JSON.stringify(payload),
      expect.any(Headers),
      context,
      true,
    )
    expect(result).toBe(true)
  })

  it.each([
    {
      context: 'deleting EDC asset',
      deleteResource: () => useCatenaXEdcClient().deleteAsset('default', 'asset/1'),
      id: 'asset/1',
      resource: 'assets',
    },
    {
      context: 'deleting EDC contract definition',
      deleteResource: () => useCatenaXEdcClient().deleteContractDefinition('default', 'contract/1'),
      id: 'contract/1',
      resource: 'contractdefinitions',
    },
    {
      context: 'deleting EDC policy definition',
      deleteResource: () => useCatenaXEdcClient().deletePolicyDefinition('default', 'policy/1'),
      id: 'policy/1',
      resource: 'policydefinitions',
    },
  ])('deletes $resource through the EDC proxy', async ({ context, deleteResource, id, resource }) => {
    mocks.deleteRequest.mockResolvedValue({ success: true })

    const result = await deleteResource()

    expect(mocks.deleteRequest).toHaveBeenCalledWith(
      `/ui/api/catena-x/edc/default/${resource}/${encodeURIComponent(id)}`,
      expect.any(Headers),
      context,
      true,
    )
    expect(result).toBe(true)
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

  it('posts Submodel fetch requests through the EDC proxy', async () => {
    mocks.postRequest.mockResolvedValue({
      success: true,
      data: {
        data: { id: 'submodel-1', submodelElements: [] },
        edc: { transferProcessId: 'transfer-1' },
      },
    })

    const { fetchSubmodel } = useCatenaXEdcClient()
    const result = await fetchSubmodel('default', {
      counterPartyId: 'TEST_PARTICIPANT_ID',
      counterPartyAddress: 'https://counterparty-dsp.test/api/v1/dsp',
      submodelDescriptor: { id: 'submodel-1' },
      transferProcessId: 'transfer-1',
    })

    expect(mocks.postRequest).toHaveBeenCalledWith(
      '/ui/api/catena-x/edc/default/submodels/fetch',
      JSON.stringify({
        counterPartyId: 'TEST_PARTICIPANT_ID',
        counterPartyAddress: 'https://counterparty-dsp.test/api/v1/dsp',
        submodelDescriptor: { id: 'submodel-1' },
        transferProcessId: 'transfer-1',
      }),
      expect.any(Headers),
      'fetching Submodel through EDC',
      true,
    )
    expect(result?.data).toEqual({ id: 'submodel-1', submodelElements: [] })
  })

  it('exposes the last EDC request failure details', () => {
    mocks.consumeLastRequestFailureDetails.mockReturnValue('Status: 404')

    const { consumeLastRequestFailureDetails } = useCatenaXEdcClient()

    expect(consumeLastRequestFailureDetails()).toBe('Status: 404')
  })
})
