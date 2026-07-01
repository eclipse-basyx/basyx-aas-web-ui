import type { EdcProxyConfig } from '../../../server/edc-bff/types'
import { describe, expect, it, vi } from 'vitest'
import {
  buildCatalogRequestBody,
  buildConnectorDiscoveryRequestBody,
  buildDspVersionParamsRequestBody,
  forwardJsonToEdc,
} from '../../../server/edc-bff/edcRequests'

function createProxyConfig (): EdcProxyConfig {
  return {
    id: 'default',
    managementUrl: 'https://consumer.example/management',
    apiKey: 'secret',
    apiKeyHeader: 'X-Api-Key',
    allowedCounterPartyAddresses: ['https://provider.example/api/v1/dsp'],
    allowInsecureCounterPartyAddresses: false,
    requestTimeoutMs: 30_000,
  }
}

describe('EDC BFF request helpers', () => {
  it('builds connector discovery requests', () => {
    expect(buildConnectorDiscoveryRequestBody({
      counterPartyId: 'did:web:provider.example',
    })).toMatchObject({
      '@type': 'tx:ConnectorServiceDiscoveryRequest',
      'edc:counterPartyId': 'did:web:provider.example',
    })
  })

  it('builds DSP version parameter discovery requests with allowlist validation', () => {
    const proxy = createProxyConfig()

    expect(buildDspVersionParamsRequestBody(proxy, {
      counterPartyId: 'did:web:provider.example',
      counterPartyAddress: 'https://provider.example/api/v1/dsp',
    })).toMatchObject({
      '@type': 'tx:ConnectorParamsDiscoveryRequest',
      'edc:counterPartyAddress': 'https://provider.example/api/v1/dsp',
    })

    expect(() => buildDspVersionParamsRequestBody(proxy, {
      counterPartyId: 'did:web:provider.example',
      counterPartyAddress: 'https://evil.example/api/v1/dsp',
    })).toThrow('counterPartyAddress is not allowed')
  })

  it('builds catalog requests with default protocol', () => {
    const proxy = createProxyConfig()

    expect(buildCatalogRequestBody(proxy, {
      counterPartyId: 'did:web:provider.example',
      counterPartyAddress: 'https://provider.example/api/v1/dsp/2025-1',
    })).toMatchObject({
      '@type': 'CatalogRequest',
      'counterPartyId': 'did:web:provider.example',
      'counterPartyAddress': 'https://provider.example/api/v1/dsp/2025-1',
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
      'https://consumer.example/management/v3/catalog/request',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'X-Api-Key': 'secret',
        }),
      }),
    )
    expect(result).toMatchObject({
      status: 200,
      data: { ok: true },
    })
  })
})
