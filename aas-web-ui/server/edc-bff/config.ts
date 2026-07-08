import type {
  EdcBffAuthConfig,
  EdcBffAuthMode,
  EdcBffRuntimeConfig,
  EdcProxyConfig,
  RedactedEdcProxyConfig,
} from './types.js'
import { readFileSync } from 'node:fs'

type Env = NodeJS.ProcessEnv
type FileReader = (path: string, encoding: BufferEncoding) => string

interface RawProxyConfig {
  id?: unknown
  managementUrl?: unknown
  apiKey?: unknown
  apiKeyHeader?: unknown
  participantId?: unknown
  dspEndpoint?: unknown
  dataPlaneProxyUrl?: unknown
  allowedCounterPartyAddresses?: unknown
  allowInsecureCounterPartyAddresses?: unknown
  requestTimeoutMs?: unknown
  edrPollingAttempts?: unknown
  edrPollingIntervalMs?: unknown
}

interface RawProxyConfigDocument {
  proxies?: Record<string, RawProxyConfig> | RawProxyConfig[]
}

const defaultProxyId = 'default'
const defaultApiKeyHeader = 'X-Api-Key'
const defaultRequestTimeoutMs = 30_000
const maxRequestTimeoutMs = 120_000
const defaultEdrPollingAttempts = 30
const defaultEdrPollingIntervalMs = 2000
const maxEdrPollingAttempts = 120
const maxEdrPollingIntervalMs = 30_000
const unsetIntegerValues = new Set<unknown>([undefined, null, ''])

export function loadRuntimeConfig (
  env: Env = process.env,
  readFile: FileReader = readFileSync,
): EdcBffRuntimeConfig {
  const auth = loadAuthConfig(env)
  const proxies = loadProxyConfigMap(env, readFile)

  return {
    port: parseInteger(env.CX_EDC_BFF_PORT, 3001, 1, 65_535),
    auth,
    proxies,
  }
}

export function loadAuthConfig (env: Env = process.env): EdcBffAuthConfig {
  const mode = normalizeAuthMode(env.CX_EDC_BFF_AUTH_MODE)
  const auth: EdcBffAuthConfig = {
    mode,
    issuer: trimToUndefined(env.CX_EDC_BFF_AUTH_ISSUER),
    audience: trimToUndefined(env.CX_EDC_BFF_AUTH_AUDIENCE),
    jwksUrl: trimToUndefined(env.CX_EDC_BFF_AUTH_JWKS_URL),
    requiredRoles: splitCsv(env.CX_EDC_BFF_REQUIRED_ROLES),
  }

  if (mode === 'jwt' && !auth.jwksUrl) {
    throw new Error('CX_EDC_BFF_AUTH_JWKS_URL is required when CX_EDC_BFF_AUTH_MODE=jwt')
  }

  return auth
}

export function loadProxyConfigMap (
  env: Env = process.env,
  readFile: FileReader = readFileSync,
): Map<string, EdcProxyConfig> {
  const rawProxies = new Map<string, RawProxyConfig>()

  for (const [id, rawProxy] of readConfiguredProxyEntries(env, readFile)) {
    rawProxies.set(id, rawProxy)
  }

  const shorthandProxy = readShorthandProxyConfig(env)
  if (shorthandProxy) {
    rawProxies.set(defaultProxyId, {
      ...rawProxies.get(defaultProxyId),
      ...shorthandProxy,
    })
  }

  const proxies = new Map<string, EdcProxyConfig>()
  for (const [id, rawProxy] of rawProxies) {
    const normalizedProxy = normalizeProxyConfig(id, rawProxy, env)
    if (normalizedProxy) {
      proxies.set(normalizedProxy.id, normalizedProxy)
    }
  }

  return proxies
}

export function redactProxyConfig (proxy: EdcProxyConfig | undefined, id: string): RedactedEdcProxyConfig {
  return {
    id,
    configured: Boolean(proxy?.managementUrl && proxy.apiKey),
    managementUrlConfigured: Boolean(proxy?.managementUrl),
    apiKeyConfigured: Boolean(proxy?.apiKey),
    participantId: proxy?.participantId,
    dspEndpointConfigured: Boolean(proxy?.dspEndpoint),
    dataPlaneProxyUrlConfigured: Boolean(proxy?.dataPlaneProxyUrl),
    allowedCounterPartyAddressCount: proxy?.allowedCounterPartyAddresses.length ?? 0,
    allowInsecureCounterPartyAddresses: proxy?.allowInsecureCounterPartyAddresses ?? false,
  }
}

export function isCounterPartyAddressAllowed (proxy: EdcProxyConfig, address: string): boolean {
  const normalizedAddress = normalizeUrl(address)
  if (!normalizedAddress) {
    return false
  }

  if (normalizedAddress.protocol !== 'https:' && !proxy.allowInsecureCounterPartyAddresses) {
    return false
  }

  if (proxy.allowedCounterPartyAddresses.includes('*')) {
    return true
  }

  return proxy.allowedCounterPartyAddresses.some(allowedAddress => {
    const normalizedAllowedAddress = normalizeUrl(allowedAddress)
    if (!normalizedAllowedAddress) {
      return false
    }

    return matchesAllowedAddress(normalizedAddress, normalizedAllowedAddress)
  })
}

export function joinManagementUrl (proxy: EdcProxyConfig, path: string): string {
  const baseUrl = proxy.managementUrl.replace(/\/+$/, '')
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${baseUrl}${normalizedPath}`
}

function readConfiguredProxyEntries (env: Env, readFile: FileReader): Array<[string, RawProxyConfig]> {
  const jsonSources: string[] = []
  const configFile = trimToUndefined(env.CX_EDC_PROXY_CONFIG_FILE)

  if (configFile) {
    jsonSources.push(readFile(configFile, 'utf8'))
  }

  const inlineConfig = trimToUndefined(env.CX_EDC_PROXY_CONFIG_JSON)
  if (inlineConfig) {
    jsonSources.push(inlineConfig)
  }

  return jsonSources.flatMap(source => normalizeProxyDocument(JSON.parse(source)))
}

function normalizeProxyDocument (document: unknown): Array<[string, RawProxyConfig]> {
  const proxyDocument = document as RawProxyConfigDocument | Record<string, RawProxyConfig>
  const proxies = Object.hasOwn(proxyDocument, 'proxies')
    ? proxyDocument.proxies
    : proxyDocument

  if (Array.isArray(proxies)) {
    return proxies
      .map(rawProxy => [String(rawProxy.id ?? '').trim(), rawProxy] as [string, RawProxyConfig])
      .filter(([id]) => id !== '')
  }

  if (!proxies || typeof proxies !== 'object') {
    return []
  }

  return Object.entries(proxies as Record<string, RawProxyConfig>)
}

function readShorthandProxyConfig (env: Env): RawProxyConfig | undefined {
  if (
    !trimToUndefined(env.CX_EDC_DEFAULT_MANAGEMENT_URL)
    && !trimToUndefined(env.CX_EDC_DEFAULT_API_KEY)
  ) {
    return undefined
  }

  return {
    managementUrl: env.CX_EDC_DEFAULT_MANAGEMENT_URL,
    apiKey: env.CX_EDC_DEFAULT_API_KEY,
    apiKeyHeader: env.CX_EDC_DEFAULT_API_KEY_HEADER,
    participantId: env.CX_EDC_DEFAULT_PARTICIPANT_ID,
    dspEndpoint: env.CX_EDC_DEFAULT_DSP_ENDPOINT,
    dataPlaneProxyUrl: env.CX_EDC_DEFAULT_DATA_PLANE_PROXY_URL,
  }
}

function normalizeProxyConfig (
  id: string,
  rawProxy: RawProxyConfig,
  env: Env,
): EdcProxyConfig | undefined {
  const proxyId = String(rawProxy.id ?? id).trim()
  if (proxyId === '') {
    return undefined
  }

  return {
    id: proxyId,
    managementUrl: trimToUndefined(rawProxy.managementUrl) ?? '',
    apiKey: trimToUndefined(rawProxy.apiKey) ?? '',
    apiKeyHeader: trimToUndefined(rawProxy.apiKeyHeader) ?? defaultApiKeyHeader,
    participantId: trimToUndefined(rawProxy.participantId),
    dspEndpoint: trimToUndefined(rawProxy.dspEndpoint),
    dataPlaneProxyUrl: trimToUndefined(rawProxy.dataPlaneProxyUrl),
    allowedCounterPartyAddresses: uniqueValues([
      ...splitCsv(env.CX_EDC_ALLOWED_COUNTER_PARTY_ADDRESSES),
      ...normalizeStringList(rawProxy.allowedCounterPartyAddresses),
    ]),
    allowInsecureCounterPartyAddresses:
      parseBoolean(rawProxy.allowInsecureCounterPartyAddresses)
      || parseBoolean(env.CX_EDC_ALLOW_INSECURE_COUNTER_PARTY_ADDRESSES),
    requestTimeoutMs: parseInteger(
      rawProxy.requestTimeoutMs ?? env.CX_EDC_REQUEST_TIMEOUT_MS,
      defaultRequestTimeoutMs,
      1000,
      maxRequestTimeoutMs,
    ),
    edrPollingAttempts: parseInteger(
      rawProxy.edrPollingAttempts ?? env.CX_EDC_EDR_POLLING_ATTEMPTS,
      defaultEdrPollingAttempts,
      1,
      maxEdrPollingAttempts,
    ),
    edrPollingIntervalMs: parseInteger(
      rawProxy.edrPollingIntervalMs ?? env.CX_EDC_EDR_POLLING_INTERVAL_MS,
      defaultEdrPollingIntervalMs,
      250,
      maxEdrPollingIntervalMs,
    ),
  }
}

function normalizeAuthMode (value: unknown): EdcBffAuthMode {
  const mode = String(value ?? 'jwt').trim().toLowerCase()
  if (mode === 'none' || mode === 'jwt') {
    return mode
  }
  throw new Error('CX_EDC_BFF_AUTH_MODE must be "jwt" or "none"')
}

function normalizeUrl (value: string): URL | null {
  try {
    return new URL(value)
  } catch {
    return null
  }
}

function matchesAllowedAddress (address: URL, allowedAddress: URL): boolean {
  if (address.origin !== allowedAddress.origin) {
    return false
  }

  const allowedPath = allowedAddress.pathname.replace(/\/+$/, '')
  const addressPath = address.pathname.replace(/\/+$/, '')
  return addressPath === allowedPath || addressPath.startsWith(`${allowedPath}/`)
}

function parseInteger (value: unknown, fallback: number, min: number, max: number): number {
  const normalizedValue = typeof value === 'string' ? value.trim() : value
  if (unsetIntegerValues.has(normalizedValue)) {
    return fallback
  }

  const parsed = Number(normalizedValue)
  if (!Number.isInteger(parsed)) {
    return fallback
  }
  return Math.min(max, Math.max(min, parsed))
}

function parseBoolean (value: unknown): boolean {
  return String(value ?? '').trim().toLowerCase() === 'true'
}

function splitCsv (value: unknown): string[] {
  return normalizeStringList(String(value ?? '').split(','))
}

function normalizeStringList (value: unknown): string[] {
  if (typeof value === 'string') {
    return value.split(',').map(item => item.trim()).filter(item => item !== '')
  }

  if (!Array.isArray(value)) {
    return []
  }

  return value.map(item => String(item).trim()).filter(item => item !== '')
}

function uniqueValues (values: string[]): string[] {
  return Array.from(new Set(values))
}

function trimToUndefined (value: unknown): string | undefined {
  const trimmed = String(value ?? '').trim()
  return trimmed === '' ? undefined : trimmed
}
