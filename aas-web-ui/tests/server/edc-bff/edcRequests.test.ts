import type { EdcProxyConfig } from '../../../server/edc-bff/types'
import { describe, expect, it, vi } from 'vitest'
import {
  buildCatalogRequestBody,
  buildConnectorDiscoveryRequestBody,
  buildDigitalTwinRegistryQuerySpec,
  buildDspVersionParamsRequestBody,
  buildEdrContractRequestBody,
  extractDigitalTwinRegistryOffer,
  extractSubmodelOffer,
  fetchDtrShellDescriptors,
  fetchSubmodel,
  forwardJsonToEdc,
  parseSubprotocolBody,
} from '../../../server/edc-bff/edcRequests'

function createProxyConfig (): EdcProxyConfig {
  return {
    id: 'default',
    managementUrl: 'https://consumer-edc.test/management',
    apiKey: 'TEST_API_KEY',
    apiKeyHeader: 'X-Api-Key',
    allowedCounterPartyAddresses: ['https://counterparty-dsp.test/api/v1/dsp'],
    allowInsecureCounterPartyAddresses: false,
    requestTimeoutMs: 30_000,
    edrPollingAttempts: 30,
    edrPollingIntervalMs: 2000,
  }
}

describe('EDC BFF request helpers', () => {
  it('builds connector discovery requests', () => {
    expect(buildConnectorDiscoveryRequestBody({
      counterPartyId: 'TEST_COUNTERPARTY_ID',
    })).toMatchObject({
      '@type': 'tx:ConnectorServiceDiscoveryRequest',
      'edc:counterPartyId': 'TEST_COUNTERPARTY_ID',
    })
  })

  it('builds DSP version parameter discovery requests with allowlist validation', () => {
    const proxy = createProxyConfig()

    expect(buildDspVersionParamsRequestBody(proxy, {
      counterPartyId: 'TEST_COUNTERPARTY_ID',
      counterPartyAddress: 'https://counterparty-dsp.test/api/v1/dsp',
    })).toMatchObject({
      '@type': 'tx:ConnectorParamsDiscoveryRequest',
      'edc:counterPartyAddress': 'https://counterparty-dsp.test/api/v1/dsp',
    })

    expect(() => buildDspVersionParamsRequestBody(proxy, {
      counterPartyId: 'TEST_COUNTERPARTY_ID',
      counterPartyAddress: 'https://blocked-counterparty.test/api/v1/dsp',
    })).toThrow('counterPartyAddress is not allowed')
  })

  it('builds catalog requests with default protocol', () => {
    const proxy = createProxyConfig()

    expect(buildCatalogRequestBody(proxy, {
      counterPartyId: 'TEST_COUNTERPARTY_ID',
      counterPartyAddress: 'https://counterparty-dsp.test/api/v1/dsp/2025-1',
    })).toMatchObject({
      '@type': 'CatalogRequest',
      'counterPartyId': 'TEST_COUNTERPARTY_ID',
      'counterPartyAddress': 'https://counterparty-dsp.test/api/v1/dsp/2025-1',
      'protocol': 'dataspace-protocol-http:2025-1',
    })
  })

  it('forwards JSON to the configured management URL with the server-side API key', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ ok: true }, {
      headers: { 'content-type': 'application/json' },
      status: 200,
    }))
    const proxy = createProxyConfig()

    const result = await forwardJsonToEdc(
      proxy,
      '/v3/catalog/request',
      { request: true },
      fetchMock,
    )

    expect(fetchMock).toHaveBeenCalledWith(
      'https://consumer-edc.test/management/v3/catalog/request',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'X-Api-Key': 'TEST_API_KEY',
        }),
      }),
    )
    expect(result).toMatchObject({
      status: 200,
      data: { ok: true },
    })
  })

  it('extracts DTR catalog data and builds EDR contract requests', () => {
    const catalog = {
      'dspace:participantId': 'TEST_PARTICIPANT_ID',
      'dcat:dataset': {
        '@id': 'dtr-asset',
        'dct:type': { '@id': 'https://w3id.org/catenax/taxonomy#DigitalTwinRegistry' },
        'odrl:hasPolicy': {
          '@id': 'offer-1',
          '@type': 'odrl:Offer',
          'odrl:permission': [],
        },
      },
    }

    const offer = extractDigitalTwinRegistryOffer(catalog)
    const body = buildEdrContractRequestBody({
      counterPartyAddress: 'https://counterparty-dsp.test/api/v1/dsp',
      protocol: 'dataspace-protocol-http',
    }, offer)

    expect(buildDigitalTwinRegistryQuerySpec().filterExpression).toHaveLength(1)
    expect(offer).toMatchObject({
      assetId: 'dtr-asset',
      participantId: 'TEST_PARTICIPANT_ID',
    })
    expect(body).toMatchObject({
      '@type': 'ContractRequest',
      'counterPartyAddress': 'https://counterparty-dsp.test/api/v1/dsp',
      'protocol': 'dataspace-protocol-http',
      'policy': {
        '@id': 'offer-1',
        'odrl:assigner': { '@id': 'TEST_PARTICIPANT_ID' },
        'odrl:target': { '@id': 'dtr-asset' },
      },
    })
  })

  it('negotiates EDR access, polls until available, and fetches DTR descriptors', async () => {
    const proxy = createProxyConfig()
    const fetchMock = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      const urlString = String(url)

      if (urlString.endsWith('/management/v3/catalog/request')) {
        return Response.json({
          'dspace:participantId': 'TEST_PARTICIPANT_ID',
          'dcat:dataset': {
            '@id': 'dtr-asset',
            'dct:type': { '@id': 'https://w3id.org/catenax/taxonomy#DigitalTwinRegistry' },
            'odrl:hasPolicy': {
              '@id': 'offer-1',
              '@type': 'odrl:Offer',
              'odrl:permission': [],
            },
          },
        })
      }

      if (urlString.endsWith('/management/v3/edrs')) {
        return Response.json({ '@id': 'negotiation-1' })
      }

      if (urlString.endsWith('/management/v3/edrs/request')) {
        const requestCount = fetchMock.mock.calls.filter(call => String(call[0]).endsWith('/management/v3/edrs/request')).length
        return Response.json(requestCount === 1
          ? []
          : [{
              '@id': 'transfer-1',
              'transferProcessId': 'transfer-1',
              'assetId': 'dtr-asset',
              'providerId': 'TEST_PARTICIPANT_ID',
              'agreementId': 'agreement-1',
            }])
      }

      if (urlString.endsWith('/management/v3/edrs/transfer-1/dataaddress?auto_refresh=true')) {
        return Response.json({
          endpoint: 'https://counterparty-data.test/data',
          authorization: 'TEST_EDR_AUTHORIZATION',
        })
      }

      if (urlString.startsWith('https://counterparty-data.test/data/shell-descriptors')) {
        expect(init?.headers).toMatchObject({ Authorization: 'TEST_EDR_AUTHORIZATION' })
        return Response.json({ result: [{ id: 'aas-1' }] })
      }

      return Response.json({ error: 'unexpected request' }, { status: 500 })
    })

    const result = await fetchDtrShellDescriptors(proxy, {
      counterPartyId: 'TEST_PARTICIPANT_ID',
      counterPartyAddress: 'https://counterparty-dsp.test/api/v1/dsp',
      protocol: 'dataspace-protocol-http',
      limit: 50,
    }, {
      fetchFn: fetchMock as typeof fetch,
      pollingIntervalMs: 0,
    })

    expect(result.data).toEqual({ result: [{ id: 'aas-1' }] })
    expect(result.metadata).toMatchObject({
      transferProcessId: 'transfer-1',
      assetId: 'dtr-asset',
      providerId: 'TEST_PARTICIPANT_ID',
      agreementId: 'agreement-1',
      contractNegotiationId: 'negotiation-1',
    })
  })

  it('parses Submodel DSP subprotocolBody values', () => {
    expect(parseSubprotocolBody(
      ' id = submodel-asset ; dspEndpoint = https://counterparty-dsp.test/api/v1/dsp ; extra=value=with-equals ; ignored ',
    )).toEqual({
      id: 'submodel-asset',
      dspEndpoint: 'https://counterparty-dsp.test/api/v1/dsp',
      extra: 'value=with-equals',
    })

    expect(parseSubprotocolBody('')).toEqual({})
  })

  it('extracts Submodel catalog data by asset ID', () => {
    const catalog = {
      'dspace:participantId': 'TEST_PARTICIPANT_ID',
      'dcat:dataset': [
        {
          '@id': 'other-asset',
          'odrl:hasPolicy': { '@id': 'offer-other', '@type': 'odrl:Offer' },
        },
        {
          '@id': 'submodel-asset',
          'odrl:hasPolicy': { '@id': 'offer-submodel', '@type': 'odrl:Offer' },
        },
      ],
    }

    expect(extractSubmodelOffer(catalog, 'submodel-asset')).toMatchObject({
      assetId: 'submodel-asset',
      participantId: 'TEST_PARTICIPANT_ID',
      policy: { '@id': 'offer-submodel' },
    })
  })

  it('negotiates EDR access and fetches a Submodel through the provider data plane', async () => {
    const proxy = createProxyConfig()
    const fetchMock = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      const urlString = String(url)

      if (urlString.endsWith('/management/v3/catalog/request')) {
        return Response.json({
          'dspace:participantId': 'TEST_PARTICIPANT_ID',
          'dcat:dataset': {
            '@id': 'submodel-asset',
            'odrl:hasPolicy': {
              '@id': 'offer-submodel',
              '@type': 'odrl:Offer',
              'odrl:permission': [],
            },
          },
        })
      }

      if (urlString.endsWith('/management/v3/edrs')) {
        return Response.json({ '@id': 'submodel-negotiation-1' })
      }

      if (urlString.endsWith('/management/v3/edrs/request')) {
        return Response.json([{
          transferProcessId: 'submodel-transfer-1',
          assetId: 'submodel-asset',
          providerId: 'TEST_PARTICIPANT_ID',
          agreementId: 'submodel-agreement-1',
        }])
      }

      if (urlString.endsWith('/management/v3/edrs/submodel-transfer-1/dataaddress?auto_refresh=true')) {
        return Response.json({
          endpoint: 'https://fresh-data-plane.test/edr-root',
          authorization: 'TEST_SUBMODEL_AUTHORIZATION',
        })
      }

      if (urlString === 'https://fresh-data-plane.test/api/public/submodel-asset/submodel') {
        expect(init?.headers).toMatchObject({ Authorization: 'TEST_SUBMODEL_AUTHORIZATION' })
        return Response.json({
          id: 'urn:example:submodel:1',
          idShort: 'TechnicalData',
          submodelElements: [{ modelType: 'Property', idShort: 'temperature', value: '20' }],
        })
      }

      return Response.json({ error: 'unexpected request' }, { status: 500 })
    })

    const result = await fetchSubmodel(proxy, {
      counterPartyId: 'TEST_PARTICIPANT_ID',
      counterPartyAddress: 'https://counterparty-dsp.test/api/v1/dsp',
      protocol: 'dataspace-protocol-http',
      submodelDescriptor: {
        endpoints: [{
          protocolInformation: {
            href: 'https://old-data-plane.test/api/public/submodel-asset/submodel',
            subprotocol: 'DSP',
            subprotocolBody: 'id=submodel-asset;dspEndpoint=https://counterparty-dsp.test/api/v1/dsp',
          },
        }],
      },
    }, {
      fetchFn: fetchMock as typeof fetch,
      pollingIntervalMs: 0,
    })

    expect(result.data).toMatchObject({
      id: 'urn:example:submodel:1',
      submodelElements: [{ idShort: 'temperature' }],
    })
    expect(result.metadata).toMatchObject({
      transferProcessId: 'submodel-transfer-1',
      assetId: 'submodel-asset',
      providerId: 'TEST_PARTICIPANT_ID',
      agreementId: 'submodel-agreement-1',
      contractNegotiationId: 'submodel-negotiation-1',
    })
  })

  it('reuses an existing EDR transfer process when fetching a Submodel', async () => {
    const proxy = createProxyConfig()
    const fetchMock = vi.fn(async (url: string | URL | Request) => {
      const urlString = String(url)

      if (urlString.endsWith('/management/v3/edrs/submodel-transfer-1/dataaddress?auto_refresh=true')) {
        return Response.json({
          endpoint: 'https://fresh-data-plane.test/edr-root',
          authorization: 'TEST_SUBMODEL_AUTHORIZATION',
        })
      }

      if (urlString === 'https://fresh-data-plane.test/api/public/submodel-asset/submodel') {
        return Response.json({ id: 'urn:example:submodel:1', submodelElements: [] })
      }

      return Response.json({ error: 'unexpected request' }, { status: 500 })
    })

    const result = await fetchSubmodel(proxy, {
      counterPartyId: 'TEST_PARTICIPANT_ID',
      counterPartyAddress: 'https://counterparty-dsp.test/api/v1/dsp',
      transferProcessId: 'submodel-transfer-1',
      submodelDescriptor: {
        endpoints: [{
          protocolInformation: {
            href: 'https://old-data-plane.test/api/public/submodel-asset/submodel',
            subprotocol: 'DSP',
            subprotocolBody: 'id=submodel-asset;dspEndpoint=https://counterparty-dsp.test/api/v1/dsp',
          },
        }],
      },
    }, {
      fetchFn: fetchMock as typeof fetch,
    })

    expect(result.metadata).toMatchObject({
      assetId: 'submodel-asset',
      transferProcessId: 'submodel-transfer-1',
    })
    expect(fetchMock).not.toHaveBeenCalledWith(
      'https://consumer-edc.test/management/v3/catalog/request',
      expect.anything(),
    )
  })

  it('rejects Submodel descriptors without complete DSP endpoint data', async () => {
    const proxy = createProxyConfig()

    await expect(fetchSubmodel(proxy, {
      counterPartyId: 'TEST_PARTICIPANT_ID',
      counterPartyAddress: 'https://counterparty-dsp.test/api/v1/dsp',
      submodelDescriptor: {
        endpoints: [{
          protocolInformation: {
            href: 'https://data-plane.test/submodel',
            subprotocol: 'DSP',
            subprotocolBody: 'dspEndpoint=https://counterparty-dsp.test/api/v1/dsp',
          },
        }],
      },
    })).rejects.toThrow('subprotocolBody.id is required')

    await expect(fetchSubmodel(proxy, {
      counterPartyId: 'TEST_PARTICIPANT_ID',
      counterPartyAddress: 'https://counterparty-dsp.test/api/v1/dsp',
      submodelDescriptor: {
        endpoints: [{
          protocolInformation: {
            href: 'https://data-plane.test/submodel',
            subprotocol: 'DSP',
            subprotocolBody: 'id=submodel-asset',
          },
        }],
      },
    })).rejects.toThrow('subprotocolBody.dspEndpoint is required')
  })

  it('reports an empty Submodel catalog and EDR timeout as stage-specific errors', async () => {
    const proxy = createProxyConfig()
    const emptyCatalogFetch = vi.fn(async () => Response.json({
      'dspace:participantId': 'TEST_PARTICIPANT_ID',
      'dcat:dataset': [],
    }))

    await expect(fetchSubmodel(proxy, {
      counterPartyId: 'TEST_PARTICIPANT_ID',
      counterPartyAddress: 'https://counterparty-dsp.test/api/v1/dsp',
      href: 'https://data-plane.test/submodel',
      subprotocolBody: 'id=submodel-asset;dspEndpoint=https://counterparty-dsp.test/api/v1/dsp',
    }, {
      fetchFn: emptyCatalogFetch as typeof fetch,
    })).rejects.toThrow('EDC catalog did not contain the requested Submodel dataset')

    const timeoutFetch = vi.fn(async (url: string | URL | Request) => {
      const urlString = String(url)
      if (urlString.endsWith('/management/v3/catalog/request')) {
        return Response.json({
          'dspace:participantId': 'TEST_PARTICIPANT_ID',
          'dcat:dataset': {
            '@id': 'submodel-asset',
            'odrl:hasPolicy': { '@id': 'offer-submodel', '@type': 'odrl:Offer' },
          },
        })
      }
      if (urlString.endsWith('/management/v3/edrs')) {
        return Response.json({ '@id': 'submodel-negotiation-1' })
      }
      if (urlString.endsWith('/management/v3/edrs/request')) {
        return Response.json([])
      }
      return Response.json({ error: 'unexpected request' }, { status: 500 })
    })

    await expect(fetchSubmodel(proxy, {
      counterPartyId: 'TEST_PARTICIPANT_ID',
      counterPartyAddress: 'https://counterparty-dsp.test/api/v1/dsp',
      href: 'https://data-plane.test/submodel',
      subprotocolBody: 'id=submodel-asset;dspEndpoint=https://counterparty-dsp.test/api/v1/dsp',
    }, {
      fetchFn: timeoutFetch as typeof fetch,
      pollingAttempts: 2,
      pollingIntervalMs: 0,
    })).rejects.toThrow('EDC EDR was not available before polling timed out')
  })

  it('rejects Submodel dataaddress responses without authorization', async () => {
    const proxy = createProxyConfig()
    const fetchMock = vi.fn(async (url: string | URL | Request) => {
      const urlString = String(url)
      if (urlString.endsWith('/management/v3/edrs/submodel-transfer-1/dataaddress?auto_refresh=true')) {
        return Response.json({ endpoint: 'https://fresh-data-plane.test/edr-root' })
      }
      return Response.json({ error: 'unexpected request' }, { status: 500 })
    })

    await expect(fetchSubmodel(proxy, {
      counterPartyId: 'TEST_PARTICIPANT_ID',
      counterPartyAddress: 'https://counterparty-dsp.test/api/v1/dsp',
      transferProcessId: 'submodel-transfer-1',
      href: 'https://data-plane.test/submodel',
      subprotocolBody: 'id=submodel-asset;dspEndpoint=https://counterparty-dsp.test/api/v1/dsp',
    }, {
      fetchFn: fetchMock as typeof fetch,
    })).rejects.toThrow('EDC dataaddress did not include authorization')
  })
})
