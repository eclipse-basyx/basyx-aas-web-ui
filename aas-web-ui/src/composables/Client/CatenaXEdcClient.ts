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

export interface CatenaXEdcDtrRequest {
  counterPartyId: string
  counterPartyAddress: string
  protocol?: string
  transferProcessId?: string
}

export interface CatenaXEdcDtrDescriptorPageRequest extends CatenaXEdcDtrRequest {
  assetIds?: Array<{ name: string, value: string }>
  cursor?: string
  limit?: number
}

export interface CatenaXEdcDtrDescriptorByIdRequest extends CatenaXEdcDtrRequest {
  descriptorId: string
}

export interface CatenaXEdcSubmodelRequest extends CatenaXEdcDtrRequest {
  href?: string
  submodelDescriptor?: unknown
  subprotocolBody?: string
}

export interface CatenaXEdcDtrMetadata {
  assetId?: string
  providerId?: string
  agreementId?: string
  contractNegotiationId?: string
  transferProcessId: string
}

export interface CatenaXEdcDtrResponse<T = unknown> {
  data: T
  edc: CatenaXEdcDtrMetadata
}

export function useCatenaXEdcClient (): {
  fetchStatus: (proxyId: string) => Promise<CatenaXEdcStatus | null>
  discoverConnector: (proxyId: string, request: CatenaXEdcDiscoveryRequest) => Promise<unknown | null>
  requestCatalog: (proxyId: string, request: CatenaXEdcCatalogRequest) => Promise<unknown | null>
  fetchDtrShellDescriptors: (
    proxyId: string,
    request: CatenaXEdcDtrDescriptorPageRequest,
  ) => Promise<CatenaXEdcDtrResponse | null>
  fetchDtrShellDescriptorById: (
    proxyId: string,
    request: CatenaXEdcDtrDescriptorByIdRequest,
  ) => Promise<CatenaXEdcDtrResponse | null>
  fetchSubmodel: (
    proxyId: string,
    request: CatenaXEdcSubmodelRequest,
  ) => Promise<CatenaXEdcDtrResponse | null>
  consumeLastRequestFailureDetails: () => string | undefined
} {
  const {
    consumeLastRequestFailureDetails,
    getRequest,
    postRequest,
  } = useRequestHandling()
  const envStore = useEnvStore()

  async function fetchStatus (proxyId: string): Promise<CatenaXEdcStatus | null> {
    const url = buildEdcProxyUrl(proxyId, 'status')
    if (!url) {
      return null
    }

    const result = await getRequest(
      url,
      'fetching EDC proxy status',
      true,
    )

    return result.success ? result.data as CatenaXEdcStatus : null
  }

  async function discoverConnector (
    proxyId: string,
    request: CatenaXEdcDiscoveryRequest,
  ): Promise<unknown | null> {
    const url = buildEdcProxyUrl(proxyId, 'connectors/discover')
    if (!url) {
      return null
    }

    const result = await postRequest(
      url,
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
    const url = buildEdcProxyUrl(proxyId, 'catalog/request')
    if (!url) {
      return null
    }

    const result = await postRequest(
      url,
      JSON.stringify(request),
      createJsonHeaders(),
      'requesting EDC catalog',
      true,
    )

    return result.success ? result.data ?? {} : null
  }

  async function fetchDtrShellDescriptors (
    proxyId: string,
    request: CatenaXEdcDtrDescriptorPageRequest,
  ): Promise<CatenaXEdcDtrResponse | null> {
    const url = buildEdcProxyUrl(proxyId, 'dtr/shell-descriptors')
    if (!url) {
      return null
    }

    const result = await postRequest(
      url,
      JSON.stringify(request),
      createJsonHeaders(),
      'fetching DTR descriptors through EDC',
      true,
    )

    return result.success ? result.data as CatenaXEdcDtrResponse : null
  }

  async function fetchDtrShellDescriptorById (
    proxyId: string,
    request: CatenaXEdcDtrDescriptorByIdRequest,
  ): Promise<CatenaXEdcDtrResponse | null> {
    const url = buildEdcProxyUrl(proxyId, 'dtr/shell-descriptors/by-id')
    if (!url) {
      return null
    }

    const result = await postRequest(
      url,
      JSON.stringify(request),
      createJsonHeaders(),
      'fetching DTR descriptor through EDC',
      true,
    )

    return result.success ? result.data as CatenaXEdcDtrResponse : null
  }

  async function fetchSubmodel (
    proxyId: string,
    request: CatenaXEdcSubmodelRequest,
  ): Promise<CatenaXEdcDtrResponse | null> {
    const url = buildEdcProxyUrl(proxyId, 'submodels/fetch')
    if (!url) {
      return null
    }

    const result = await postRequest(
      url,
      JSON.stringify(request),
      createJsonHeaders(),
      'fetching Submodel through EDC',
      true,
    )

    return result.success ? result.data as CatenaXEdcDtrResponse : null
  }

  function buildEdcProxyUrl (proxyId: string, path: string): string | null {
    const normalizedProxyId = proxyId.trim()
    if (normalizedProxyId === '') {
      return null
    }

    const basePath = normalizeBasePath(envStore.getEnvBasePath)
    return `${basePath}api/catena-x/edc/${encodeURIComponent(normalizedProxyId)}/${path}`
  }

  return {
    fetchStatus,
    discoverConnector,
    requestCatalog,
    fetchDtrShellDescriptors,
    fetchDtrShellDescriptorById,
    fetchSubmodel,
    consumeLastRequestFailureDetails,
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
