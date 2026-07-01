import type { EdcCatalogRequest, EdcDiscoveryRequest, EdcProxyConfig } from './types.js'
import { isCounterPartyAddressAllowed, joinManagementUrl } from './config.js'

export interface EdcForwardResult {
  status: number
  headers: Record<string, string>
  data: unknown
}

const jsonLdContext = {
  tx: 'https://w3id.org/tractusx/v0.0.1/ns/',
  edc: 'https://w3id.org/edc/v0.0.1/ns/',
}

const catalogContext = [
  {
    '@vocab': 'https://w3id.org/edc/v0.0.1/ns/',
  },
]

export function buildConnectorDiscoveryRequestBody (request: EdcDiscoveryRequest): Record<string, unknown> {
  const counterPartyId = trimString(request.counterPartyId)
  if (!counterPartyId) {
    throw createHttpError('counterPartyId is required for connector discovery', 400)
  }

  return {
    '@context': jsonLdContext,
    '@type': 'tx:ConnectorServiceDiscoveryRequest',
    'edc:counterPartyId': counterPartyId,
  }
}

export function buildDspVersionParamsRequestBody (
  proxy: EdcProxyConfig,
  request: EdcDiscoveryRequest,
): Record<string, unknown> {
  const counterPartyId = trimString(request.counterPartyId)
  const counterPartyAddress = trimString(request.counterPartyAddress)

  if (!counterPartyId) {
    throw createHttpError('counterPartyId is required for DSP version discovery', 400)
  }

  if (!counterPartyAddress) {
    throw createHttpError('counterPartyAddress is required for DSP version discovery', 400)
  }

  assertCounterPartyAddressAllowed(proxy, counterPartyAddress)

  return {
    '@context': jsonLdContext,
    '@type': 'tx:ConnectorParamsDiscoveryRequest',
    'edc:counterPartyId': counterPartyId,
    'edc:counterPartyAddress': counterPartyAddress,
  }
}

export function buildCatalogRequestBody (
  proxy: EdcProxyConfig,
  request: EdcCatalogRequest,
): Record<string, unknown> {
  const counterPartyId = trimString(request.counterPartyId)
  const counterPartyAddress = trimString(request.counterPartyAddress)
  const protocol = trimString(request.protocol) || 'dataspace-protocol-http:2025-1'

  if (!counterPartyId) {
    throw createHttpError('counterPartyId is required for catalog requests', 400)
  }

  if (!counterPartyAddress) {
    throw createHttpError('counterPartyAddress is required for catalog requests', 400)
  }

  assertCounterPartyAddressAllowed(proxy, counterPartyAddress)

  return {
    '@context': catalogContext,
    '@type': 'CatalogRequest',
    counterPartyId,
    counterPartyAddress,
    protocol,
    ...(request.querySpec && typeof request.querySpec === 'object'
      ? { querySpec: request.querySpec }
      : {}),
  }
}

export async function forwardJsonToEdc (
  proxy: EdcProxyConfig,
  path: string,
  body: Record<string, unknown>,
  fetchFn: typeof fetch = fetch,
): Promise<EdcForwardResult> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), proxy.requestTimeoutMs)

  try {
    const response = await fetchFn(joinManagementUrl(proxy, path), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [proxy.apiKeyHeader]: proxy.apiKey,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    const data = await parseResponseBody(response)

    return {
      status: response.status,
      headers: {
        'content-type': response.headers.get('content-type') ?? 'application/json',
      },
      data,
    }
  } finally {
    clearTimeout(timeout)
  }
}

export function createHttpError (message: string, status: number): Error & { status: number } {
  const error = new Error(message) as Error & { status: number }
  error.status = status
  return error
}

function assertCounterPartyAddressAllowed (proxy: EdcProxyConfig, counterPartyAddress: string): void {
  if (!isCounterPartyAddressAllowed(proxy, counterPartyAddress)) {
    throw createHttpError('counterPartyAddress is not allowed by the EDC proxy allowlist', 403)
  }
}

async function parseResponseBody (response: Response): Promise<unknown> {
  const text = await response.text()
  if (text.trim() === '') {
    return {}
  }

  const contentType = response.headers.get('content-type') ?? ''
  if (contentType.includes('application/json') || contentType.includes('+json')) {
    return JSON.parse(text)
  }

  return text
}

function trimString (value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}
