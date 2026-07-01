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
      CX_EDC_DEFAULT_MANAGEMENT_URL: 'https://consumer.example/management',
      CX_EDC_DEFAULT_API_KEY: 'top-secret',
      CX_EDC_DEFAULT_PARTICIPANT_ID: 'BPNL000000000001',
      CX_EDC_ALLOWED_COUNTER_PARTY_ADDRESSES: 'https://provider.example/api/v1/dsp',
    })

    const proxy = proxies.get('default')
    const redacted = redactProxyConfig(proxy, 'default')

    expect(proxy?.apiKey).toBe('top-secret')
    expect(redacted).toMatchObject({
      id: 'default',
      configured: true,
      managementUrlConfigured: true,
      apiKeyConfigured: true,
      participantId: 'BPNL000000000001',
      allowedCounterPartyAddressCount: 1,
    })
    expect(JSON.stringify(redacted)).not.toContain('top-secret')
    expect(JSON.stringify(redacted)).not.toContain('consumer.example')
  })

  it('loads multiple proxy configs from inline JSON', () => {
    const proxies = loadProxyConfigMap({
      CX_EDC_PROXY_CONFIG_JSON: JSON.stringify({
        proxies: {
          partnerA: {
            managementUrl: 'https://consumer-a.example/management',
            apiKey: 'secret-a',
            allowedCounterPartyAddresses: ['https://provider-a.example/dsp'],
          },
          partnerB: {
            managementUrl: 'https://consumer-b.example/management',
            apiKey: 'secret-b',
          },
        },
      }),
    })

    expect(proxies.get('partnerA')?.managementUrl).toBe('https://consumer-a.example/management')
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
    const insecureProviderAddress = 'http' + '://provider.example/api/v1/dsp'
    const proxy = loadProxyConfigMap({
      CX_EDC_DEFAULT_MANAGEMENT_URL: 'https://consumer.example/management',
      CX_EDC_DEFAULT_API_KEY: 'secret',
      CX_EDC_ALLOWED_COUNTER_PARTY_ADDRESSES: 'https://provider.example/api/v1/dsp',
    }).get('default')!

    expect(isCounterPartyAddressAllowed(proxy, 'https://provider.example/api/v1/dsp')).toBe(true)
    expect(isCounterPartyAddressAllowed(proxy, 'https://provider.example/api/v1/dsp/2025-1')).toBe(true)
    expect(isCounterPartyAddressAllowed(proxy, 'https://evil.example/api/v1/dsp')).toBe(false)
    expect(isCounterPartyAddressAllowed(proxy, insecureProviderAddress)).toBe(false)
  })

  it('requires an explicit wildcard to allow arbitrary HTTPS counterparties', () => {
    const insecureProviderAddress = 'http' + '://provider.example/api/v1/dsp'
    const proxy = loadProxyConfigMap({
      CX_EDC_DEFAULT_MANAGEMENT_URL: 'https://consumer.example/management',
      CX_EDC_DEFAULT_API_KEY: 'secret',
      CX_EDC_ALLOWED_COUNTER_PARTY_ADDRESSES: '*',
    }).get('default')!

    expect(isCounterPartyAddressAllowed(proxy, 'https://provider.example/api/v1/dsp')).toBe(true)
    expect(isCounterPartyAddressAllowed(proxy, insecureProviderAddress)).toBe(false)
  })
})
