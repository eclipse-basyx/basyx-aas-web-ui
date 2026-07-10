import { describe, expect, it } from 'vitest'
import {
  isCounterPartyAddressAllowed,
  loadAuthConfig,
  loadProxyConfigMap,
  redactProxyConfig,
} from '../../../server/edc-bff/config'

describe('EDC BFF config', () => {
  it('loads shorthand default proxy config and redacts secrets', () => {
    const proxies = loadProxyConfigMap({
      CX_EDC_DEFAULT_MANAGEMENT_URL: 'https://consumer-edc.test/management',
      CX_EDC_DEFAULT_API_KEY: 'TEST_API_KEY',
      CX_EDC_DEFAULT_PARTICIPANT_ID: 'TEST_PARTICIPANT_ID',
      CX_EDC_ALLOWED_COUNTER_PARTY_ADDRESSES: 'https://counterparty-dsp.test/api/v1/dsp',
    })

    const proxy = proxies.get('default')
    const redacted = redactProxyConfig(proxy, 'default')

    expect(proxy?.apiKey).toBe('TEST_API_KEY')
    expect(redacted).toMatchObject({
      id: 'default',
      configured: true,
      managementUrlConfigured: true,
      apiKeyConfigured: true,
      participantId: 'TEST_PARTICIPANT_ID',
      allowedCounterPartyAddressCount: 1,
    })
    expect(JSON.stringify(redacted)).not.toContain('TEST_API_KEY')
    expect(JSON.stringify(redacted)).not.toContain('consumer-edc.test')
  })

  it('loads EDR polling settings from environment variables', () => {
    const proxies = loadProxyConfigMap({
      CX_EDC_DEFAULT_MANAGEMENT_URL: 'https://consumer-edc.test/management',
      CX_EDC_DEFAULT_API_KEY: 'TEST_API_KEY',
      CX_EDC_ALLOWED_COUNTER_PARTY_ADDRESSES: 'https://counterparty-dsp.test/api/v1/dsp',
      CX_EDC_EDR_POLLING_ATTEMPTS: '45',
      CX_EDC_EDR_POLLING_INTERVAL_MS: '1500',
    })

    expect(proxies.get('default')).toMatchObject({
      edrPollingAttempts: 45,
      edrPollingIntervalMs: 1500,
    })
  })

  it('falls back to default numeric settings for blank environment variables', () => {
    const proxies = loadProxyConfigMap({
      CX_EDC_DEFAULT_MANAGEMENT_URL: 'https://consumer-edc.test/management',
      CX_EDC_DEFAULT_API_KEY: 'TEST_API_KEY',
      CX_EDC_ALLOWED_COUNTER_PARTY_ADDRESSES: 'https://counterparty-dsp.test/api/v1/dsp',
      CX_EDC_REQUEST_TIMEOUT_MS: '',
      CX_EDC_EDR_POLLING_ATTEMPTS: '',
      CX_EDC_EDR_POLLING_INTERVAL_MS: '',
    })

    expect(proxies.get('default')).toMatchObject({
      requestTimeoutMs: 30_000,
      edrPollingAttempts: 30,
      edrPollingIntervalMs: 2000,
    })
  })

  it('loads multiple proxy configs from inline JSON', () => {
    const proxies = loadProxyConfigMap({
      CX_EDC_PROXY_CONFIG_JSON: JSON.stringify({
        proxies: {
          partnerA: {
            managementUrl: 'https://consumer-a.test/management',
            apiKey: 'TEST_API_KEY_A',
            allowedCounterPartyAddresses: ['https://counterparty-a.test/dsp'],
          },
          partnerB: {
            managementUrl: 'https://consumer-b.test/management',
            apiKey: 'TEST_API_KEY_B',
          },
        },
      }),
    })

    expect(proxies.get('partnerA')?.managementUrl).toBe('https://consumer-a.test/management')
    expect(proxies.get('partnerB')?.apiKeyHeader).toBe('X-Api-Key')
  })

  it('requires JWKS configuration for JWT auth mode', () => {
    expect(() => loadAuthConfig({ CX_EDC_BFF_AUTH_MODE: 'jwt' })).toThrow(
      'CX_EDC_BFF_AUTH_JWKS_URL is required',
    )
    expect(loadAuthConfig({ CX_EDC_BFF_AUTH_MODE: 'none' }).mode).toBe('none')
    expect(() => loadAuthConfig({ CX_EDC_BFF_AUTH_MODE: 'basic' })).toThrow(
      'CX_EDC_BFF_AUTH_MODE must be "jwt" or "none"',
    )
  })

  it('allows only configured counterparty address prefixes', () => {
    const insecureProviderAddress = 'http' + '://counterparty-dsp.test/api/v1/dsp'
    const proxy = loadProxyConfigMap({
      CX_EDC_DEFAULT_MANAGEMENT_URL: 'https://consumer-edc.test/management',
      CX_EDC_DEFAULT_API_KEY: 'TEST_API_KEY',
      CX_EDC_ALLOWED_COUNTER_PARTY_ADDRESSES: 'https://counterparty-dsp.test/api/v1/dsp',
    }).get('default')!

    expect(isCounterPartyAddressAllowed(proxy, 'https://counterparty-dsp.test/api/v1/dsp')).toBe(true)
    expect(isCounterPartyAddressAllowed(proxy, 'https://counterparty-dsp.test/api/v1/dsp/2025-1')).toBe(true)
    expect(isCounterPartyAddressAllowed(proxy, 'https://blocked-counterparty.test/api/v1/dsp')).toBe(false)
    expect(isCounterPartyAddressAllowed(proxy, insecureProviderAddress)).toBe(false)
  })

  it('requires an explicit wildcard to allow arbitrary HTTPS counterparties', () => {
    const insecureProviderAddress = 'http' + '://counterparty-dsp.test/api/v1/dsp'
    const proxy = loadProxyConfigMap({
      CX_EDC_DEFAULT_MANAGEMENT_URL: 'https://consumer-edc.test/management',
      CX_EDC_DEFAULT_API_KEY: 'TEST_API_KEY',
      CX_EDC_ALLOWED_COUNTER_PARTY_ADDRESSES: '*',
    }).get('default')!

    expect(isCounterPartyAddressAllowed(proxy, 'https://counterparty-dsp.test/api/v1/dsp')).toBe(true)
    expect(isCounterPartyAddressAllowed(proxy, insecureProviderAddress)).toBe(false)
  })
})
