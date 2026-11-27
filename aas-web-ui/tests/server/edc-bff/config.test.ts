import { describe, expect, it } from 'vitest'
import {
  isCounterPartyAddressAllowed,
  isDataPlaneAddressAllowed,
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
      managementWritesAllowed: false,
    })
    expect(proxy?.allowManagementWrites).toBe(false)
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

  it('allows management writes only when enabled per proxy', () => {
    const shorthandProxies = loadProxyConfigMap({
      CX_EDC_DEFAULT_MANAGEMENT_URL: 'https://consumer-edc.test/management',
      CX_EDC_DEFAULT_API_KEY: 'TEST_API_KEY',
      CX_EDC_DEFAULT_ALLOW_MANAGEMENT_WRITES: 'true',
    })
    const jsonProxies = loadProxyConfigMap({
      CX_EDC_PROXY_CONFIG_JSON: JSON.stringify({
        proxies: {
          writable: {
            managementUrl: 'https://consumer-a.test/management',
            apiKey: 'TEST_API_KEY_A',
            allowManagementWrites: true,
          },
          readOnly: {
            managementUrl: 'https://consumer-b.test/management',
            apiKey: 'TEST_API_KEY_B',
          },
        },
      }),
    })

    expect(shorthandProxies.get('default')?.allowManagementWrites).toBe(true)
    expect(redactProxyConfig(shorthandProxies.get('default'), 'default').managementWritesAllowed).toBe(true)
    expect(jsonProxies.get('writable')?.allowManagementWrites).toBe(true)
    expect(jsonProxies.get('readOnly')?.allowManagementWrites).toBe(false)
  })

  it('applies the default proxy variables to a default proxy from the JSON config', () => {
    const jsonConfig = JSON.stringify({
      proxies: {
        default: {
          managementUrl: 'https://consumer-edc.test/management',
          apiKey: 'TEST_API_KEY',
          participantId: 'TEST_PARTICIPANT_ID',
          allowManagementWrites: true,
        },
      },
    })

    const writesFromVariable = loadProxyConfigMap({
      CX_EDC_PROXY_CONFIG_JSON: jsonConfig.replace('"allowManagementWrites":true', '"allowManagementWrites":false'),
      CX_EDC_DEFAULT_ALLOW_MANAGEMENT_WRITES: 'true',
    })
    // Variables that are unset or blank, e.g. from `${VAR:-}` in Docker Compose, keep the values of the JSON config
    const otherVariables = loadProxyConfigMap({
      CX_EDC_PROXY_CONFIG_JSON: jsonConfig,
      CX_EDC_DEFAULT_API_KEY: 'OTHER_API_KEY',
      CX_EDC_DEFAULT_PARTICIPANT_ID: '',
    })

    expect(writesFromVariable.get('default')?.allowManagementWrites).toBe(true)
    expect(otherVariables.get('default')).toMatchObject({
      apiKey: 'OTHER_API_KEY',
      participantId: 'TEST_PARTICIPANT_ID',
      allowManagementWrites: true,
    })
  })

  it('creates no default proxy from variables without Management URL or API key', () => {
    const proxies = loadProxyConfigMap({
      CX_EDC_DEFAULT_ALLOW_MANAGEMENT_WRITES: 'true',
      CX_EDC_DEFAULT_PARTICIPANT_ID: 'TEST_PARTICIPANT_ID',
    })

    expect(proxies.has('default')).toBe(false)
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

  it('allows no data plane without its own allowlist, also with a DSP wildcard', () => {
    const proxy = loadProxyConfigMap({
      CX_EDC_DEFAULT_MANAGEMENT_URL: 'https://consumer-edc.test/management',
      CX_EDC_DEFAULT_API_KEY: 'TEST_API_KEY',
      CX_EDC_ALLOWED_COUNTER_PARTY_ADDRESSES: '*',
    }).get('default')!

    expect(proxy.allowedDataPlaneAddresses).toEqual([])
    expect(redactProxyConfig(proxy, 'default').allowedDataPlaneAddressCount).toBe(0)
    expect(isDataPlaneAddressAllowed(proxy, 'https://counterparty-data.test/api/public')).toBe(false)
  })

  it('allows only configured data plane addresses', () => {
    const metadataServiceAddress = 'http' + '://169.254.169.254/latest/meta-data'
    const proxies = loadProxyConfigMap({
      CX_EDC_PROXY_CONFIG_JSON: JSON.stringify({
        proxies: {
          default: {
            managementUrl: 'https://consumer-edc.test/management',
            apiKey: 'TEST_API_KEY',
            allowedDataPlaneAddresses: ['https://counterparty-data.test/api/public'],
          },
        },
      }),
      CX_EDC_ALLOWED_DATA_PLANE_ADDRESSES: 'https://other-data.test',
    })
    const proxy = proxies.get('default')!

    expect(isDataPlaneAddressAllowed(proxy, 'https://counterparty-data.test/api/public/shell-descriptors')).toBe(true)
    expect(isDataPlaneAddressAllowed(proxy, 'https://other-data.test/any/path')).toBe(true)
    expect(isDataPlaneAddressAllowed(proxy, 'https://counterparty-data.test/management')).toBe(false)
    expect(isDataPlaneAddressAllowed(proxy, metadataServiceAddress)).toBe(false)
    expect(isDataPlaneAddressAllowed({ ...proxy, allowedDataPlaneAddresses: ['*'] }, metadataServiceAddress)).toBe(false)
    expect(isDataPlaneAddressAllowed(
      { ...proxy, allowedDataPlaneAddresses: ['*'], allowInsecureCounterPartyAddresses: true },
      metadataServiceAddress,
    )).toBe(true)
    expect(isDataPlaneAddressAllowed(
      { ...proxy, allowedDataPlaneAddresses: ['*'], allowInsecureCounterPartyAddresses: true },
      'file:///etc/passwd',
    )).toBe(false)
  })
})
