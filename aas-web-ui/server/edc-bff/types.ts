export type EdcBffAuthMode = 'jwt' | 'none'

export interface EdcProxyConfig {
  id: string
  managementUrl: string
  apiKey: string
  apiKeyHeader: string
  participantId?: string
  dspEndpoint?: string
  dataPlaneProxyUrl?: string
  allowedCounterPartyAddresses: string[]
  allowedDataPlaneAddresses: string[]
  allowInsecureCounterPartyAddresses: boolean
  allowManagementWrites: boolean
  requestTimeoutMs: number
  edrPollingAttempts: number
  edrPollingIntervalMs: number
}

export interface RedactedEdcProxyConfig {
  id: string
  configured: boolean
  managementUrlConfigured: boolean
  apiKeyConfigured: boolean
  participantId?: string
  dspEndpointConfigured: boolean
  dataPlaneProxyUrlConfigured: boolean
  allowedCounterPartyAddressCount: number
  allowedDataPlaneAddressCount: number
  allowInsecureCounterPartyAddresses: boolean
  managementWritesAllowed: boolean
}

export interface EdcBffAuthConfig {
  mode: EdcBffAuthMode
  issuer?: string
  audience?: string
  jwksUrl?: string
  requiredRoles: string[]
}

export interface EdcBffRuntimeConfig {
  port: number
  auth: EdcBffAuthConfig
  proxies: Map<string, EdcProxyConfig>
}

export interface EdcDiscoveryRequest {
  mode?: 'connectors' | 'dspversionparams'
  counterPartyId?: string
  counterPartyAddress?: string
}

export interface EdcCatalogRequest {
  counterPartyId?: string
  counterPartyAddress?: string
  querySpec?: EdcQuerySpec
  assetId?: string // Requests only the dataset of this asset, instead of the `querySpec`
}

export interface EdcQuerySpec extends Record<string, unknown> {
  '@context'?: string | Record<string, unknown> | Array<string | Record<string, unknown>>
  '@type'?: string
  'offset'?: number
  'limit'?: number
  'sortField'?: string
  'sortOrder'?: 'ASC' | 'DESC'
  'filterExpression'?: Record<string, unknown> | Array<Record<string, unknown>>
}

export interface EdcQuerySpecRequest {
  querySpec?: EdcQuerySpec
}

export interface EdcDtrDescriptorRequest {
  counterPartyId?: string
  counterPartyAddress?: string
  transferProcessId?: string
  assetIds?: Array<{ name?: string, value?: string }>
  cursor?: string
  limit?: number
}

export interface EdcDtrDescriptorByIdRequest {
  counterPartyId?: string
  counterPartyAddress?: string
  transferProcessId?: string
  descriptorId?: string
}

export interface EdcDataFetchRequest {
  counterPartyId?: string
  counterPartyAddress?: string
  assetId?: string
}

export interface EdcDataPushRequest extends EdcDataFetchRequest {
  data?: unknown
}

export interface EdcSubmodelFetchRequest {
  counterPartyId?: string
  counterPartyAddress?: string
  transferProcessId?: string
  submodelDescriptor?: unknown
  href?: string
  subprotocolBody?: string
}
