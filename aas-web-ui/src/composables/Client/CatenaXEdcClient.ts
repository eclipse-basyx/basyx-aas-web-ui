import { useRequestHandling } from '@/composables/RequestHandling'
import { useEnvStore } from '@/store/EnvironmentStore'

export interface CatenaXEdcStatus {
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

export interface CatenaXEdcDiscoveryRequest {
  mode?: 'connectors' | 'dspversionparams'
  counterPartyId: string
  counterPartyAddress?: string
}

export interface CatenaXEdcCatalogRequest {
  counterPartyId: string
  counterPartyAddress: string
  protocol?: string
  querySpec?: Record<string, unknown>
}

export function useCatenaXEdcClient (): {
  fetchStatus: (proxyId: string) => Promise<CatenaXEdcStatus | null>
  discoverConnector: (proxyId: string, request: CatenaXEdcDiscoveryRequest) => Promise<unknown | null>
  requestCatalog: (proxyId: string, request: CatenaXEdcCatalogRequest) => Promise<unknown | null>
} {
  const { getRequest, postRequest } = useRequestHandling()
  const envStore = useEnvStore()

  async function fetchStatus (proxyId: string): Promise<CatenaXEdcStatus | null> {
    const result = await getRequest(
      buildEdcProxyUrl(proxyId, 'status'),
      'fetching EDC proxy status',
      true,
    )

    return result.success ? result.data as CatenaXEdcStatus : null
  }

  async function discoverConnector (
    proxyId: string,
    request: CatenaXEdcDiscoveryRequest,
  ): Promise<unknown | null> {
    const result = await postRequest(
      buildEdcProxyUrl(proxyId, 'connectors/discover'),
      JSON.stringify(request),
      createJsonHeaders(),
      'discovering EDC connector',
      true,
    )

    return result.success ? result.data ?? {} : null
  }

  async function requestCatalog (
    proxyId: string,
    request: CatenaXEdcCatalogRequest,
  ): Promise<unknown | null> {
    const result = await postRequest(
      buildEdcProxyUrl(proxyId, 'catalog/request'),
      JSON.stringify(request),
      createJsonHeaders(),
      'requesting EDC catalog',
      true,
    )

    return result.success ? result.data ?? {} : null
  }

  function buildEdcProxyUrl (proxyId: string, path: string): string {
    const basePath = normalizeBasePath(envStore.getEnvBasePath)
    return `${basePath}api/catena-x/edc/${encodeURIComponent(proxyId)}/${path}`
  }

  return {
    fetchStatus,
    discoverConnector,
    requestCatalog,
  }
}

function createJsonHeaders (): Headers {
  const headers = new Headers()
  headers.set('Content-Type', 'application/json')
  return headers
}

function normalizeBasePath (basePath: string): string {
  const trimmed = basePath.trim()
  if (trimmed === '' || trimmed.includes('PLACEHOLDER')) {
    return '/'
  }

  return trimmed.endsWith('/') ? trimmed : `${trimmed}/`
}
