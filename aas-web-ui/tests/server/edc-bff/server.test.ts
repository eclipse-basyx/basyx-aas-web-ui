import type { EdcBffRuntimeConfig } from '../../../server/edc-bff/types'
import type { Server } from 'node:http'
import { createServer as createHttpServer } from 'node:http'
import { afterEach, describe, expect, it } from 'vitest'
import { createEdcBffServer } from '../../../server/edc-bff/server'

let server: Server | null = null
let upstreamServer: Server | null = null

describe('EDC BFF server', () => {
  afterEach(async () => {
    if (server) {
      await new Promise<void>((resolve, reject) => {
        server?.close(error => error ? reject(error) : resolve())
      })
      server = null
    }
    if (upstreamServer) {
      await new Promise<void>((resolve, reject) => {
        upstreamServer?.close(error => error ? reject(error) : resolve())
      })
      upstreamServer = null
    }
  })

  it('returns redacted status for configured proxies and 404 for unknown proxies', async () => {
    const config: EdcBffRuntimeConfig = {
      port: 0,
      auth: { mode: 'none', requiredRoles: [] },
      proxies: new Map([
        ['default', {
          id: 'default',
          managementUrl: 'https://consumer-edc.test/management',
          apiKey: 'TEST_API_KEY',
          apiKeyHeader: 'X-Api-Key',
          allowedCounterPartyAddresses: [],
          allowInsecureCounterPartyAddresses: false,
          requestTimeoutMs: 30_000,
          edrPollingAttempts: 30,
          edrPollingIntervalMs: 2000,
        }],
      ]),
    }

    server = createEdcBffServer(config)
    await new Promise<void>(resolve => server?.listen(0, resolve))
    const address = server.address()
    const port = typeof address === 'object' && address ? address.port : 0

    const statusResponse = await fetch(`http://127.0.0.1:${port}/api/catena-x/edc/default/status`)
    const statusPayload = await statusResponse.json()

    expect(statusResponse.status).toBe(200)
    expect(statusPayload).toMatchObject({
      id: 'default',
      configured: true,
      managementUrlConfigured: true,
      apiKeyConfigured: true,
    })
    expect(JSON.stringify(statusPayload)).not.toContain('TEST_API_KEY')
    expect(JSON.stringify(statusPayload)).not.toContain('consumer-edc.test')

    const missingResponse = await fetch(`http://127.0.0.1:${port}/api/catena-x/edc/missing/status`)

    expect(missingResponse.status).toBe(404)
  })

  it('serves DTR descriptor pages through the EDC flow without exposing secrets', async () => {
    upstreamServer = createHttpServer((request, response) => {
      response.setHeader('Content-Type', 'application/json')

      if (request.url === '/management/v3/catalog/request') {
        response.end(JSON.stringify({
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
        }))
        return
      }

      if (request.url === '/management/v3/edrs') {
        response.end(JSON.stringify({ '@id': 'negotiation-1' }))
        return
      }

      if (request.url === '/management/v3/edrs/request') {
        response.end(JSON.stringify([{
          transferProcessId: 'transfer-1',
          assetId: 'dtr-asset',
          providerId: 'TEST_PARTICIPANT_ID',
          agreementId: 'agreement-1',
        }]))
        return
      }

      if (request.url === '/management/v3/edrs/transfer-1/dataaddress?auto_refresh=true') {
        const address = upstreamServer?.address()
        const port = typeof address === 'object' && address ? address.port : 0
        response.end(JSON.stringify({
          endpoint: `http://127.0.0.1:${port}/data`,
          authorization: 'TEST_EDR_AUTHORIZATION',
        }))
        return
      }

      if (request.url === '/data/shell-descriptors?limit=10') {
        expect(request.headers.authorization).toBe('TEST_EDR_AUTHORIZATION')
        response.end(JSON.stringify({ result: [{ id: 'aas-1' }] }))
        return
      }

      response.statusCode = 404
      response.end(JSON.stringify({ error: 'not found' }))
    })
    await new Promise<void>(resolve => upstreamServer?.listen(0, resolve))
    const upstreamAddress = upstreamServer.address()
    const upstreamPort = typeof upstreamAddress === 'object' && upstreamAddress ? upstreamAddress.port : 0

    const config: EdcBffRuntimeConfig = {
      port: 0,
      auth: { mode: 'none', requiredRoles: [] },
      proxies: new Map([
        ['default', {
          id: 'default',
          managementUrl: `http://127.0.0.1:${upstreamPort}/management`,
          apiKey: 'TEST_API_KEY',
          apiKeyHeader: 'X-Api-Key',
          allowedCounterPartyAddresses: ['https://counterparty-dsp.test/api/v1/dsp'],
          allowInsecureCounterPartyAddresses: false,
          requestTimeoutMs: 30_000,
          edrPollingAttempts: 30,
          edrPollingIntervalMs: 2000,
        }],
      ]),
    }

    server = createEdcBffServer(config)
    await new Promise<void>(resolve => server?.listen(0, resolve))
    const address = server.address()
    const port = typeof address === 'object' && address ? address.port : 0

    const response = await fetch(`http://127.0.0.1:${port}/api/catena-x/edc/default/dtr/shell-descriptors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        counterPartyId: 'TEST_PARTICIPANT_ID',
        counterPartyAddress: 'https://counterparty-dsp.test/api/v1/dsp',
        protocol: 'dataspace-protocol-http',
        limit: 10,
      }),
    })
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload).toMatchObject({
      data: { result: [{ id: 'aas-1' }] },
      edc: {
        transferProcessId: 'transfer-1',
        assetId: 'dtr-asset',
        providerId: 'TEST_PARTICIPANT_ID',
        agreementId: 'agreement-1',
        contractNegotiationId: 'negotiation-1',
      },
    })
    expect(JSON.stringify(payload)).not.toContain('TEST_API_KEY')
    expect(JSON.stringify(payload)).not.toContain('TEST_EDR_AUTHORIZATION')
  })
})
