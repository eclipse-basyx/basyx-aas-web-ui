import { useRequestHandling } from '@/composables/RequestHandling'
import { useEnvStore } from '@/store/EnvironmentStore'

const edcResourceLabels = {
  assets: 'assets',
  contractdefinitions: 'contract definitions',
  policydefinitions: 'policy definitions',
} as const

type EdcResource = keyof typeof edcResourceLabels

const edcResourceItemLabels: Record<EdcResource, string> = {
  assets: 'asset',
  contractdefinitions: 'contract definition',
  policydefinitions: 'policy definition',
}

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
  querySpec?: CatenaXEdcQuerySpec
}

export interface CatenaXEdcCatalog extends Record<string, unknown> {
  'dcat:dataset'?: unknown | unknown[]
  'dataset'?: unknown | unknown[]
}

export interface CatenaXEdcQuerySpec extends Record<string, unknown> {
  '@context'?: string | Record<string, unknown> | Array<string | Record<string, unknown>>
  '@type'?: string
  'offset'?: number
  'limit'?: number
  'sortField'?: string
  'sortOrder'?: 'ASC' | 'DESC'
  'filterExpression'?: Record<string, unknown> | Array<Record<string, unknown>>
}

export interface CatenaXEdcQuerySpecRequest {
  querySpec?: CatenaXEdcQuerySpec
}

export interface CatenaXEdcAsset extends Record<string, unknown> {
  '@id'?: string
  'properties': Record<string, unknown>
  'dataAddress': Record<string, unknown>
}

export interface CatenaXEdcIdResponse {
  '@id': string
  'createdAt': number
}

export interface CatenaXEdcContractDefinition extends Record<string, unknown> {
  '@id'?: string
  'accessPolicyId': string
  'contractPolicyId': string
  'assetsSelector': Array<Record<string, unknown>>
}

export interface CatenaXEdcPolicyDefinition extends Record<string, unknown> {
  '@id'?: string
  'policy'?: Record<string, any>
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
  requestCatalog: (proxyId: string, request: CatenaXEdcCatalogRequest) => Promise<CatenaXEdcCatalog | null>
  queryAssets: (proxyId: string, request?: CatenaXEdcQuerySpecRequest) => Promise<CatenaXEdcAsset[] | null>
  createAsset: (proxyId: string, asset: CatenaXEdcAsset) => Promise<CatenaXEdcIdResponse | null>
  updateAsset: (proxyId: string, assetId: string, asset: CatenaXEdcAsset) => Promise<boolean>
  deleteAsset: (proxyId: string, assetId: string) => Promise<boolean>
  queryContractDefinitions: (proxyId: string, request?: CatenaXEdcQuerySpecRequest) => Promise<CatenaXEdcContractDefinition[] | null>
  createContractDefinition: (proxyId: string, contractDefinition: CatenaXEdcContractDefinition) => Promise<CatenaXEdcIdResponse | null>
  updateContractDefinition: (proxyId: string, contractDefinitionId: string, contractDefinition: CatenaXEdcContractDefinition) => Promise<boolean>
  deleteContractDefinition: (proxyId: string, contractDefinitionId: string) => Promise<boolean>
  queryPolicyDefinitions: (proxyId: string, request?: CatenaXEdcQuerySpecRequest) => Promise<CatenaXEdcPolicyDefinition[] | null>
  createPolicyDefinition: (proxyId: string, policyDefinition: CatenaXEdcPolicyDefinition) => Promise<CatenaXEdcIdResponse | null>
  updatePolicyDefinition: (proxyId: string, policyDefinitionId: string, policyDefinition: CatenaXEdcPolicyDefinition) => Promise<boolean>
  deletePolicyDefinition: (proxyId: string, policyDefinitionId: string) => Promise<boolean>
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
    deleteRequest,
    getRequest,
    postRequest,
    putRequest,
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
  ): Promise<CatenaXEdcCatalog | null> {
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

    return result.success ? result.data as CatenaXEdcCatalog ?? {} : null
  }

  async function queryAssets (
    proxyId: string,
    request: CatenaXEdcQuerySpecRequest = {},
  ): Promise<CatenaXEdcAsset[] | null> {
    return queryEdcResources<CatenaXEdcAsset>(proxyId, 'assets', request)
  }

  async function createAsset (
    proxyId: string,
    asset: CatenaXEdcAsset,
  ): Promise<CatenaXEdcIdResponse | null> {
    return createEdcResource(proxyId, 'assets', asset)
  }

  async function updateAsset (
    proxyId: string,
    assetId: string,
    asset: CatenaXEdcAsset,
  ): Promise<boolean> {
    return updateEdcResource(proxyId, 'assets', assetId, asset)
  }

  async function deleteAsset (proxyId: string, assetId: string): Promise<boolean> {
    return deleteEdcResource(proxyId, 'assets', assetId)
  }

  async function queryContractDefinitions (
    proxyId: string,
    request: CatenaXEdcQuerySpecRequest = {},
  ): Promise<CatenaXEdcContractDefinition[] | null> {
    return queryEdcResources<CatenaXEdcContractDefinition>(proxyId, 'contractdefinitions', request)
  }

  async function createContractDefinition (
    proxyId: string,
    contractDefinition: CatenaXEdcContractDefinition,
  ): Promise<CatenaXEdcIdResponse | null> {
    return createEdcResource(proxyId, 'contractdefinitions', contractDefinition)
  }

  async function updateContractDefinition (
    proxyId: string,
    contractDefinitionId: string,
    contractDefinition: CatenaXEdcContractDefinition,
  ): Promise<boolean> {
    return updateEdcResource(proxyId, 'contractdefinitions', contractDefinitionId, contractDefinition)
  }

  async function deleteContractDefinition (
    proxyId: string,
    contractDefinitionId: string,
  ): Promise<boolean> {
    return deleteEdcResource(proxyId, 'contractdefinitions', contractDefinitionId)
  }

  async function queryPolicyDefinitions (
    proxyId: string,
    request: CatenaXEdcQuerySpecRequest = {},
  ): Promise<CatenaXEdcPolicyDefinition[] | null> {
    return queryEdcResources<CatenaXEdcPolicyDefinition>(proxyId, 'policydefinitions', request)
  }

  async function queryEdcResources<T> (
    proxyId: string,
    resource: EdcResource,
    request: CatenaXEdcQuerySpecRequest,
  ): Promise<T[] | null> {
    const url = buildEdcProxyUrl(proxyId, `${resource}/request`)
    if (!url) {
      return null
    }

    const result = await postRequest(
      url,
      JSON.stringify(request),
      createJsonHeaders(),
      `querying EDC ${edcResourceLabels[resource]}`,
      true,
    )

    return result.success && Array.isArray(result.data) ? result.data as T[] : null
  }

  async function createPolicyDefinition (
    proxyId: string,
    policyDefinition: CatenaXEdcPolicyDefinition,
  ): Promise<CatenaXEdcIdResponse | null> {
    return createEdcResource(proxyId, 'policydefinitions', policyDefinition)
  }

  async function createEdcResource (
    proxyId: string,
    resource: EdcResource,
    payload: Record<string, unknown>,
  ): Promise<CatenaXEdcIdResponse | null> {
    const url = buildEdcProxyUrl(proxyId, resource)
    if (!url) {
      return null
    }

    const result = await postRequest(
      url,
      JSON.stringify(payload),
      createJsonHeaders(),
      `creating EDC ${edcResourceItemLabels[resource]}`,
      true,
    )

    return result.success && result.data ? result.data as CatenaXEdcIdResponse : null
  }

  async function updatePolicyDefinition (
    proxyId: string,
    policyDefinitionId: string,
    policyDefinition: CatenaXEdcPolicyDefinition,
  ): Promise<boolean> {
    return updateEdcResource(proxyId, 'policydefinitions', policyDefinitionId, policyDefinition)
  }

  async function updateEdcResource (
    proxyId: string,
    resource: EdcResource,
    resourceId: string,
    payload: Record<string, unknown>,
  ): Promise<boolean> {
    const normalizedId = resourceId.trim()
    const url = buildEdcProxyUrl(proxyId, `${resource}/${encodeURIComponent(normalizedId)}`)
    if (!url || normalizedId === '') {
      return false
    }

    const result = await putRequest(
      url,
      JSON.stringify(payload),
      createJsonHeaders(),
      `updating EDC ${edcResourceItemLabels[resource]}`,
      true,
    )

    return result.success
  }

  async function deletePolicyDefinition (
    proxyId: string,
    policyDefinitionId: string,
  ): Promise<boolean> {
    return deleteEdcResource(proxyId, 'policydefinitions', policyDefinitionId)
  }

  async function deleteEdcResource (
    proxyId: string,
    resource: EdcResource,
    resourceId: string,
  ): Promise<boolean> {
    const normalizedResourceId = resourceId.trim()
    const url = buildEdcProxyUrl(
      proxyId,
      `${resource}/${encodeURIComponent(normalizedResourceId)}`,
    )
    if (!url || normalizedResourceId === '') {
      return false
    }

    const result = await deleteRequest(
      url,
      createJsonHeaders(),
      `deleting EDC ${edcResourceItemLabels[resource]}`,
      true,
    )
    return result.success
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
    queryAssets,
    createAsset,
    updateAsset,
    deleteAsset,
    queryContractDefinitions,
    createContractDefinition,
    updateContractDefinition,
    deleteContractDefinition,
    queryPolicyDefinitions,
    createPolicyDefinition,
    updatePolicyDefinition,
    deletePolicyDefinition,
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
