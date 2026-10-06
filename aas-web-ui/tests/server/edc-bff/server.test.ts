import type { EdcBffRuntimeConfig } from '../../../server/edc-bff/types'
import type { Server } from 'node:http'
import { createServer as createHttpServer } from 'node:http'
import { afterEach, describe, expect, it } from 'vitest'
import { createEdcBffServer } from '../../../server/edc-bff/server'

let server: Server | null = null
let upstreamServer: Server | null = null

interface UpstreamRequestRecord {
  apiKey?: string | string[]
  body?: unknown
  method?: string
  url?: string
}

/** Records every upstream call; `respond` returning undefined replies with 204. */
async function startUpstreamServer (
  respond: (record: UpstreamRequestRecord) => unknown,
): Promise<{ port: number, requests: UpstreamRequestRecord[] }> {
  const requests: UpstreamRequestRecord[] = []
  upstreamServer = createHttpServer((request, response) => {
    const chunks: Buffer[] = []
    request.on('data', chunk => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
    })
    request.on('end', () => {
      const rawBody = Buffer.concat(chunks).toString('utf8')
      const record: UpstreamRequestRecord = {
        apiKey: request.headers['x-api-key'],
        body: rawBody ? JSON.parse(rawBody) : undefined,
        method: request.method,
        url: request.url,
      }
      requests.push(record)

      const payload = respond(record)
      if (payload === undefined) {
        response.statusCode = 204
        response.end()
        return
      }

      response.setHeader('Content-Type', 'application/json')
      response.end(JSON.stringify(payload))
    })
  })
  await new Promise<void>(resolve => upstreamServer?.listen(0, resolve))
  const address = upstreamServer.address()

  return {
    port: typeof address === 'object' && address ? address.port : 0,
    requests,
  }
}

async function startBffServer (upstreamPort: number): Promise<string> {
  const config: EdcBffRuntimeConfig = {
    port: 0,
    auth: { mode: 'none', requiredRoles: [] },
    proxies: new Map([
      ['default', {
        id: 'default',
        managementUrl: `http://127.0.0.1:${upstreamPort}/management`,
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

  return `http://127.0.0.1:${port}/api/catena-x/edc/default`
}

const crudResources = [
  {
    resource: 'assets',
    id: 'asset/1',
    entity: {
      '@id': 'asset/1',
      'properties': { key: 'value' },
      'dataAddress': { type: 'HttpData', baseUrl: 'https://provider.test/data' },
    },
  },
  {
    resource: 'contractdefinitions',
    id: 'contract/1',
    entity: {
      '@id': 'contract/1',
      'accessPolicyId': 'access-1',
      'contractPolicyId': 'usage-1',
      'assetsSelector': [],
    },
  },
  {
    resource: 'policydefinitions',
    id: 'policy/1',
    entity: {
      '@id': 'policy/1',
      'policy': { '@type': 'Set', 'permission': [] },
    },
  },
]

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

  it('returns route diagnostics for unsupported BFF actions without exposing secrets', async () => {
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

    const response = await fetch(`http://127.0.0.1:${port}/api/catena-x/edc/default/unknown/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    })
    const payload = await response.json()

    expect(response.status).toBe(404)
    expect(payload).toMatchObject({
      error: 'Route not found',
      status: 404,
      code: 'ROUTE_NOT_FOUND',
      method: 'POST',
      path: '/api/catena-x/edc/default/unknown/action',
    })
    expect(JSON.stringify(payload)).not.toContain('TEST_API_KEY')
    expect(JSON.stringify(payload)).not.toContain('consumer-edc.test')
  })

  it('queries assets through the configured EDC management API', async () => {
    let upstreamRequest: {
      apiKey?: string | string[]
      body?: unknown
      method?: string
      url?: string
    } = {}
    upstreamServer = createHttpServer((request, response) => {
      const chunks: Buffer[] = []
      request.on('data', chunk => {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
      })
      request.on('end', () => {
        upstreamRequest = {
          apiKey: request.headers['x-api-key'],
          body: JSON.parse(Buffer.concat(chunks).toString('utf8')),
          method: request.method,
          url: request.url,
        }

        response.setHeader('Content-Type', 'application/json')
        response.end(JSON.stringify([{ '@id': 'asset-1' }]))
      })
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
    const response = await fetch(`http://127.0.0.1:${port}/api/catena-x/edc/default/assets/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    })

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual([{ '@id': 'asset-1' }])
    expect(upstreamRequest).toMatchObject({
      apiKey: 'TEST_API_KEY',
      body: {
        '@type': 'QuerySpec',
        'offset': 0,
        'sortOrder': 'ASC',
        'sortField': 'id',
      },
      method: 'POST',
      url: '/management/v3/assets/request',
    })
  })

  it.each(crudResources)(
    'queries, creates, updates and deletes $resource through the configured EDC management API',
    async ({ resource, id, entity }) => {
      const encodedId = encodeURIComponent(id)
      const upstream = await startUpstreamServer(record => {
        if (record.url?.endsWith(`/${resource}/request`)) {
          return [{ '@id': id }]
        }
        if (record.method === 'POST') {
          return { '@id': id, 'createdAt': 1 }
        }
        return undefined
      })
      const baseUrl = await startBffServer(upstream.port)

      const queryResponse = await fetch(`${baseUrl}/${resource}/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      })
      const createResponse = await fetch(`${baseUrl}/${resource}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entity),
      })
      const updateResponse = await fetch(`${baseUrl}/${resource}/${encodedId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entity),
      })
      const deleteResponse = await fetch(`${baseUrl}/${resource}/${encodedId}`, {
        method: 'DELETE',
      })

      await expect(queryResponse.json()).resolves.toEqual([{ '@id': id }])
      await expect(createResponse.json()).resolves.toEqual({ '@id': id, 'createdAt': 1 })
      expect(updateResponse.status).toBe(204)
      expect(deleteResponse.status).toBe(204)
      expect(upstream.requests).toMatchObject([
        {
          apiKey: 'TEST_API_KEY',
          body: {
            '@type': 'QuerySpec',
            'offset': 0,
            'sortOrder': 'ASC',
            'sortField': 'id',
          },
          method: 'POST',
          url: `/management/v3/${resource}/request`,
        },
        {
          apiKey: 'TEST_API_KEY',
          body: entity,
          method: 'POST',
          url: `/management/v3/${resource}`,
        },
        {
          apiKey: 'TEST_API_KEY',
          body: entity,
          method: 'PUT',
          url: `/management/v3/${resource}`,
        },
        {
          apiKey: 'TEST_API_KEY',
          method: 'DELETE',
          url: `/management/v3/${resource}/${encodedId}`,
        },
      ])
    },
  )

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

  it('serves Submodels through the EDC flow without exposing secrets', async () => {
    upstreamServer = createHttpServer((request, response) => {
      response.setHeader('Content-Type', 'application/json')

      if (request.url === '/management/v3/catalog/request') {
        response.end(JSON.stringify({
          'dspace:participantId': 'TEST_PARTICIPANT_ID',
          'dcat:dataset': {
            '@id': 'submodel-asset',
            'odrl:hasPolicy': {
              '@id': 'offer-submodel',
              '@type': 'odrl:Offer',
              'odrl:permission': [],
            },
          },
        }))
        return
      }

      if (request.url === '/management/v3/edrs') {
        response.end(JSON.stringify({ '@id': 'submodel-negotiation-1' }))
        return
      }

      if (request.url === '/management/v3/edrs/request') {
        response.end(JSON.stringify([{
          transferProcessId: 'submodel-transfer-1',
          assetId: 'submodel-asset',
          providerId: 'TEST_PARTICIPANT_ID',
          agreementId: 'submodel-agreement-1',
        }]))
        return
      }

      if (request.url === '/management/v3/edrs/submodel-transfer-1/dataaddress?auto_refresh=true') {
        const address = upstreamServer?.address()
        const port = typeof address === 'object' && address ? address.port : 0
        response.end(JSON.stringify({
          endpoint: `http://127.0.0.1:${port}/api/public`,
          authorization: 'TEST_SUBMODEL_AUTHORIZATION',
        }))
        return
      }

      if (request.url === '/api/public/submodel/data') {
        expect(request.headers.authorization).toBe('TEST_SUBMODEL_AUTHORIZATION')
        response.end(JSON.stringify({
          id: 'urn:example:submodel:1',
          submodelElements: [{ modelType: 'Property', idShort: 'temperature', value: '20' }],
        }))
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
    const response = await fetch(`http://127.0.0.1:${port}/api/catena-x/edc/default/submodels/fetch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        counterPartyId: 'TEST_PARTICIPANT_ID',
        counterPartyAddress: 'https://counterparty-dsp.test/api/v1/dsp',
        protocol: 'dataspace-protocol-http',
        submodelDescriptor: {
          endpoints: [{
            protocolInformation: {
              href: `http://old-data-plane.test:${upstreamPort}/api/public/submodel/data`,
              subprotocol: 'DSP',
              subprotocolBody: 'id=submodel-asset;dspEndpoint=https://counterparty-dsp.test/api/v1/dsp',
            },
          }],
        },
      }),
    })
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload).toMatchObject({
      data: {
        id: 'urn:example:submodel:1',
        submodelElements: [{ idShort: 'temperature' }],
      },
      edc: {
        transferProcessId: 'submodel-transfer-1',
        assetId: 'submodel-asset',
        providerId: 'TEST_PARTICIPANT_ID',
        agreementId: 'submodel-agreement-1',
        contractNegotiationId: 'submodel-negotiation-1',
      },
    })
    expect(JSON.stringify(payload)).not.toContain('TEST_API_KEY')
    expect(JSON.stringify(payload)).not.toContain('TEST_SUBMODEL_AUTHORIZATION')
  })
})
