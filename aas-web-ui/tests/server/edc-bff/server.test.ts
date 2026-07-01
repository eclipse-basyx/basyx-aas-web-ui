import type { EdcBffRuntimeConfig } from '../../../server/edc-bff/types'
import type { Server } from 'node:http'
import { afterEach, describe, expect, it } from 'vitest'
import { createEdcBffServer } from '../../../server/edc-bff/server'

let server: Server | null = null

describe('EDC BFF server', () => {
  afterEach(async () => {
    if (server) {
      await new Promise<void>((resolve, reject) => {
        server?.close(error => error ? reject(error) : resolve())
      })
      server = null
    }
  })

  it('returns redacted status for configured proxies and 404 for unknown proxies', async () => {
    const config: EdcBffRuntimeConfig = {
      port: 0,
      auth: { mode: 'none', requiredRoles: [] },
      proxies: new Map([
        ['default', {
          id: 'default',
          managementUrl: 'https://consumer.example/management',
          apiKey: 'secret',
          apiKeyHeader: 'X-Api-Key',
          allowedCounterPartyAddresses: [],
          allowInsecureCounterPartyAddresses: false,
          requestTimeoutMs: 30_000,
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
    expect(JSON.stringify(statusPayload)).not.toContain('secret')
    expect(JSON.stringify(statusPayload)).not.toContain('consumer.example')

    const missingResponse = await fetch(`http://127.0.0.1:${port}/api/catena-x/edc/missing/status`)

    expect(missingResponse.status).toBe(404)
  })
})
