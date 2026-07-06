import type {
  EdcCatalogRequest,
  EdcDiscoveryRequest,
  EdcDtrDescriptorByIdRequest,
  EdcDtrDescriptorRequest,
  EdcProxyConfig,
} from './types.js'
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
const odrlContextUrl = 'http' + '://www.w3.org/ns/odrl/2/'
const dctContextUrl = 'http' + '://purl.org/dc/terms/'
const xsdContextUrl = 'http' + '://www.w3.org/2001/XMLSchema#'

const contractContext = {
  'tx': 'https://w3id.org/tractusx/v0.0.1/ns/',
  'tx-auth': 'https://w3id.org/tractusx/auth/',
  'edc': 'https://w3id.org/edc/v0.0.1/ns/',
  'dcat': 'https://www.w3.org/ns/dcat/',
  'odrl': odrlContextUrl,
  'dct': dctContextUrl,
  'purl': dctContextUrl,
  'dspace': 'https://w3id.org/dspace/v0.8/',
  'cx-common': 'https://w3id.org/catenax/ontology/common#',
  'cx-policy': 'https://w3id.org/catenax/policy/',
  'cx-taxo': 'https://w3id.org/catenax/taxonomy#',
  'xsd': xsdContextUrl,
  '@vocab': 'https://w3id.org/edc/v0.0.1/ns/',
}

const defaultDtrProtocol = 'dataspace-protocol-http'
const dtrTaxonomyId = 'https://w3id.org/catenax/taxonomy#DigitalTwinRegistry'
export interface DigitalTwinRegistryOffer {
  assetId: string
  participantId: string
  policy: Record<string, unknown>
}

export interface EdcDtrFetchMetadata {
  assetId?: string
  providerId?: string
  agreementId?: string
  contractNegotiationId?: string
  transferProcessId: string
}

export interface EdcDtrFetchResult {
  status: number
  data: unknown
  metadata: EdcDtrFetchMetadata
}

export interface EdcDtrFetchOptions {
  fetchFn?: typeof fetch
  pollingAttempts?: number
  pollingIntervalMs?: number
}

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

export function buildDigitalTwinRegistryQuerySpec (limit = 50): Record<string, unknown> {
  return {
    '@type': 'QuerySpec',
    'offset': 0,
    limit,
    'sortField': dctContextUrl + 'type',
    'sortOrder': 'ASC',
    'filterExpression': [
      {
        '@type': 'CriterionDto',
        'operandLeft': dctContextUrl + 'type',
        'operator': 'like',
        'operandRight': `%${dtrTaxonomyId}%`,
      },
    ],
  }
}

export function extractDigitalTwinRegistryOffer (catalog: unknown): DigitalTwinRegistryOffer {
  const datasets = asArray((catalog as Record<string, unknown>)?.['dcat:dataset'])
  const dataset = datasets.find(candidate => getNestedId(candidate, 'dct:type') === dtrTaxonomyId)
    ?? datasets[0]

  if (!dataset || typeof dataset !== 'object') {
    throw createHttpError('EDC catalog did not contain a Digital Twin Registry dataset', 502)
  }

  const datasetRecord = dataset as Record<string, unknown>
  const assetId = trimString(datasetRecord['@id']) || trimString(datasetRecord.id)
  const participantId = trimString((catalog as Record<string, unknown>)?.['dspace:participantId'])
  const policy = datasetRecord['odrl:hasPolicy'] ?? datasetRecord.hasPolicy

  if (!assetId) {
    throw createHttpError('Digital Twin Registry dataset did not include an asset ID', 502)
  }

  if (!participantId) {
    throw createHttpError('EDC catalog did not include a provider participant ID', 502)
  }

  if (!policy || typeof policy !== 'object') {
    throw createHttpError('Digital Twin Registry dataset did not include a contract policy', 502)
  }

  return {
    assetId,
    participantId,
    policy: policy as Record<string, unknown>,
  }
}

export function buildEdrContractRequestBody (
  request: EdcDtrDescriptorRequest | EdcDtrDescriptorByIdRequest,
  offer: DigitalTwinRegistryOffer,
): Record<string, unknown> {
  const counterPartyAddress = trimString(request.counterPartyAddress)
  if (!counterPartyAddress) {
    throw createHttpError('counterPartyAddress is required for EDR negotiation', 400)
  }

  const policy = cloneRecord(offer.policy)
  const usesPrefixedOdrl = Object.keys(policy).some(key => key.startsWith('odrl:'))
    || trimString(policy['@type']).startsWith('odrl:')

  if (usesPrefixedOdrl) {
    policy['odrl:assigner'] = { '@id': offer.participantId }
    policy['odrl:target'] = { '@id': offer.assetId }
  } else {
    policy.assigner = offer.participantId
    policy.target = offer.assetId
  }

  return {
    '@context': contractContext,
    '@type': 'ContractRequest',
    counterPartyAddress,
    'protocol': trimString(request.protocol) || defaultDtrProtocol,
    policy,
  }
}

export function buildEdrRequestQueryBody (contractNegotiationId: string): Record<string, unknown> {
  const normalizedContractNegotiationId = trimString(contractNegotiationId)
  if (!normalizedContractNegotiationId) {
    throw createHttpError('contractNegotiationId is required for EDR lookup', 502)
  }

  return {
    '@context': contractContext,
    '@type': 'QuerySpec',
    'offset': 0,
    'limit': 100,
    'filterExpression': {
      operandLeft: 'contractNegotiationId',
      operator: '=',
      operandRight: normalizedContractNegotiationId,
    },
  }
}

export async function fetchDtrShellDescriptors (
  proxy: EdcProxyConfig,
  request: EdcDtrDescriptorRequest,
  options: EdcDtrFetchOptions = {},
): Promise<EdcDtrFetchResult> {
  const access = await ensureDtrAccess(proxy, request, options)
  const queryParams = new URLSearchParams()
  const limit = normalizeLimit(request.limit)
  if (limit !== undefined) {
    queryParams.set('limit', String(limit))
  }
  if (trimString(request.cursor)) {
    queryParams.set('cursor', trimString(request.cursor))
  }
  for (const assetId of request.assetIds ?? []) {
    const name = trimString(assetId.name)
    const value = trimString(assetId.value)
    if (name !== '' && value !== '') {
      queryParams.append('assetIds', base64UrlEncode(JSON.stringify({ name, value })))
    }
  }

  return fetchDtrData(access, '/shell-descriptors', queryParams, options.fetchFn ?? fetch)
}

export async function fetchDtrShellDescriptorById (
  proxy: EdcProxyConfig,
  request: EdcDtrDescriptorByIdRequest,
  options: EdcDtrFetchOptions = {},
): Promise<EdcDtrFetchResult> {
  const descriptorId = trimString(request.descriptorId)
  if (!descriptorId) {
    throw createHttpError('descriptorId is required for DTR descriptor lookup', 400)
  }

  const access = await ensureDtrAccess(proxy, request, options)
  return fetchDtrData(
    access,
    `/shell-descriptors/${base64UrlEncode(descriptorId)}`,
    new URLSearchParams(),
    options.fetchFn ?? fetch,
  )
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

export async function forwardGetToEdc (
  proxy: EdcProxyConfig,
  path: string,
  fetchFn: typeof fetch = fetch,
): Promise<EdcForwardResult> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), proxy.requestTimeoutMs)

  try {
    const response = await fetchFn(joinManagementUrl(proxy, path), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        [proxy.apiKeyHeader]: proxy.apiKey,
      },
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

async function ensureDtrAccess (
  proxy: EdcProxyConfig,
  request: EdcDtrDescriptorRequest | EdcDtrDescriptorByIdRequest,
  options: EdcDtrFetchOptions,
): Promise<{ dataAddress: Record<string, unknown>, metadata: EdcDtrFetchMetadata }> {
  const transferProcessId = trimString(request.transferProcessId)
  const fetchFn = options.fetchFn ?? fetch

  if (transferProcessId) {
    const dataAddress = await getDataAddress(proxy, transferProcessId, fetchFn)
    return {
      dataAddress,
      metadata: { transferProcessId },
    }
  }

  const counterPartyId = trimString(request.counterPartyId)
  const counterPartyAddress = trimString(request.counterPartyAddress)
  if (!counterPartyId) {
    throw createHttpError('counterPartyId is required for EDC DTR access', 400)
  }
  if (!counterPartyAddress) {
    throw createHttpError('counterPartyAddress is required for EDC DTR access', 400)
  }

  const catalogResponse = await forwardJsonToEdc(
    proxy,
    '/v3/catalog/request',
    buildCatalogRequestBody(proxy, {
      counterPartyId,
      counterPartyAddress,
      protocol: trimString(request.protocol) || defaultDtrProtocol,
      querySpec: buildDigitalTwinRegistryQuerySpec(),
    }),
    fetchFn,
  )
  assertSuccessfulEdcResponse(catalogResponse, 'EDC catalog request failed')

  const offer = extractDigitalTwinRegistryOffer(catalogResponse.data)
  const negotiationResponse = await forwardJsonToEdc(
    proxy,
    '/v3/edrs',
    buildEdrContractRequestBody(request, offer),
    fetchFn,
  )
  assertSuccessfulEdcResponse(negotiationResponse, 'EDC contract negotiation failed')

  const contractNegotiationId = trimString((negotiationResponse.data as Record<string, unknown>)?.['@id'])
  if (!contractNegotiationId) {
    throw createHttpError('EDC contract negotiation did not return a negotiation ID', 502)
  }

  const edrEntry = await pollEdrEntry(
    proxy,
    contractNegotiationId,
    fetchFn,
    options.pollingAttempts ?? proxy.edrPollingAttempts,
    options.pollingIntervalMs ?? proxy.edrPollingIntervalMs,
  )
  const normalizedTransferProcessId = trimString(edrEntry.transferProcessId) || trimString(edrEntry['@id'])
  if (!normalizedTransferProcessId) {
    throw createHttpError('EDC EDR entry did not include a transfer process ID', 502)
  }

  const dataAddress = await getDataAddress(proxy, normalizedTransferProcessId, fetchFn)
  return {
    dataAddress,
    metadata: {
      assetId: trimString(edrEntry.assetId) || offer.assetId,
      providerId: trimString(edrEntry.providerId) || offer.participantId,
      agreementId: trimString(edrEntry.agreementId) || undefined,
      contractNegotiationId,
      transferProcessId: normalizedTransferProcessId,
    },
  }
}

function assertSuccessfulEdcResponse (result: EdcForwardResult, message: string): void {
  if (result.status < 200 || result.status >= 300) {
    throw createHttpError(`${message} (${result.status})`, 502)
  }
}

async function pollEdrEntry (
  proxy: EdcProxyConfig,
  contractNegotiationId: string,
  fetchFn: typeof fetch,
  attempts: number,
  intervalMs: number,
): Promise<Record<string, unknown>> {
  const maxAttempts = Math.max(1, attempts)

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const edrResponse = await forwardJsonToEdc(
      proxy,
      '/v3/edrs/request',
      buildEdrRequestQueryBody(contractNegotiationId),
      fetchFn,
    )
    assertSuccessfulEdcResponse(edrResponse, 'EDC EDR lookup failed')

    const edrEntry = asArray<Record<string, unknown>>(edrResponse.data)[0]
    if (edrEntry) {
      return edrEntry
    }

    if (attempt < maxAttempts - 1) {
      await delay(intervalMs)
    }
  }

  throw createHttpError('EDC EDR was not available before polling timed out', 504)
}

async function getDataAddress (
  proxy: EdcProxyConfig,
  transferProcessId: string,
  fetchFn: typeof fetch,
): Promise<Record<string, unknown>> {
  const dataAddressResponse = await forwardGetToEdc(
    proxy,
    `/v3/edrs/${encodeURIComponent(transferProcessId)}/dataaddress?auto_refresh=true`,
    fetchFn,
  )
  assertSuccessfulEdcResponse(dataAddressResponse, 'EDC dataaddress lookup failed')

  if (!dataAddressResponse.data || typeof dataAddressResponse.data !== 'object') {
    throw createHttpError('EDC dataaddress lookup returned an invalid response', 502)
  }

  const dataAddress = dataAddressResponse.data as Record<string, unknown>
  if (!trimString(dataAddress.endpoint)) {
    throw createHttpError('EDC dataaddress did not include an endpoint', 502)
  }
  if (!trimString(dataAddress.authorization)) {
    throw createHttpError('EDC dataaddress did not include authorization', 502)
  }

  return dataAddress
}

async function fetchDtrData (
  access: { dataAddress: Record<string, unknown>, metadata: EdcDtrFetchMetadata },
  path: string,
  queryParams: URLSearchParams,
  fetchFn: typeof fetch,
): Promise<EdcDtrFetchResult> {
  const url = buildDtrDataUrl(trimString(access.dataAddress.endpoint), path, queryParams)
  const response = await fetchFn(url, {
    method: 'GET',
    headers: {
      Authorization: trimString(access.dataAddress.authorization),
      Accept: 'application/json',
    },
  })
  const data = await parseResponseBody(response)

  if (!response.ok) {
    throw createHttpError(`DTR data plane request failed (${response.status})`, 502)
  }

  return {
    status: response.status,
    data,
    metadata: access.metadata,
  }
}

function buildDtrDataUrl (endpoint: string, path: string, queryParams: URLSearchParams): string {
  const baseUrl = endpoint.replace(/\/+$/, '')
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const queryString = queryParams.toString()
  return `${baseUrl}${normalizedPath}${queryString ? `?${queryString}` : ''}`
}

function normalizeLimit (limit: unknown): number | undefined {
  const numericLimit = Number(limit)
  if (!Number.isInteger(numericLimit) || numericLimit <= 0) {
    return undefined
  }
  return Math.min(numericLimit, 1000)
}

function asArray<T = unknown> (value: unknown): T[] {
  if (Array.isArray(value)) {
    return value as T[]
  }
  if (value && typeof value === 'object') {
    return [value as T]
  }
  return []
}

function getNestedId (value: unknown, key: string): string {
  const nestedValue = (value as Record<string, unknown> | undefined)?.[key]
  return trimString((nestedValue as Record<string, unknown> | undefined)?.['@id'])
}

function cloneRecord (record: Record<string, unknown>): Record<string, unknown> {
  return structuredClone(record)
}

function base64UrlEncode (value: string): string {
  return Buffer.from(value.trim(), 'utf8').toString('base64url')
}

function delay (durationMs: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, Math.max(0, durationMs)))
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
