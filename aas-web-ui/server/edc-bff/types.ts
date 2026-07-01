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
  allowInsecureCounterPartyAddresses: boolean
  requestTimeoutMs: number
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
  allowInsecureCounterPartyAddresses: boolean
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
  protocol?: string
  querySpec?: Record<string, unknown>
}
