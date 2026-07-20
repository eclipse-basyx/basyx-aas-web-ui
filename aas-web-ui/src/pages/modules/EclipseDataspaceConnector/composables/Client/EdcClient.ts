import { computed } from 'vue'
import { useRequestHandling } from '@/composables/RequestHandling'
import { useEdcStore } from '@/pages/modules/EclipseDataspaceConnector/store/EdcStore'
import { stripLastCharacter } from '@/utils/StringUtils'

export function useEdcClient () {
  // Stores
  const edcStore = useEdcStore()

  // Composables
  const { getRequest, postRequest, putRequest, deleteRequest } = useRequestHandling()

  const defaultControlplaneEndpointPath = '/api'
  const defaultControlplaneMgmtEndpointPath = '/api/management/v3'

  const defaultPolicyDefinitionsPath = '/policydefinitions'
  const defaultPolicyDefinitionsRequestPath = '/policydefinitions/request'
  const defaultAssetsPath = '/assets'
  const defaultAssetsRequestPath = '/assets/request'
  const defaultContractAgreementsPath = '/contractagreements'
  const defaultContractAgreementsRequestPath = '/contractagreements/request'
  const defaultContractDefinitionsPath = '/contractdefinitions'
  const defaultContractDefinitionsRequestPath = '/contractdefinitions/request'
  const defaultCatalogRequestPath = '/catalog/request'
  const defaultCatalogDatasetRequestPath = '/catalog/dataset/request'
  const defaultContractNegotiationsPath = '/contractnegotiations'
  const defaultTransferProcessesPath = '/transferprocesses'
  const defaultEdrsPath = '/edrs'

  const defaultQuerySpec: QuerySpec = {
    '@context': {
      '@vocab': 'https://w3id.org/edc/v0.0.1/ns/',
    },
    '@type': 'QuerySpecDto',
    'offset': 0,
    'sortOrder': 'ASC',
    'sortField': 'id',
  }

  const defaultControlplaneEndpointHealthPath = '/check/health'
  const defaultControlplaneEndpointLivenessPath = '/check/liveness'
  const defaultControlplaneEndpointReadinessPath = '/check/readiness'
  const defaultControlplaneEndpointStartupPath = '/check/startup'

  const edcControlplaneEndpoint = computed(() => edcStore.getControlplaneEndpoint)
  const edcControlplaneMgmtEndpoint = computed(() => edcStore.getControlplaneMgmtEndpoint)

  /**
   * Resolves the EDC controlplane endpoint URL by normalizing it and ensuring it has the correct base path.
   * Removes trailing slashes and ensures the URL ends with '/api'
   * @param endpoint Optional custom endpoint URL. If not provided, uses configured controlplane endpoint
   * @returns Normalized controlplane endpoint URL ending with '/api', or empty string if endpoint is empty
   */
  function resolveEdcControlplaneEndpoint (endpoint?: string): string {
    let edcUrl = endpoint ? endpoint.trim() : edcControlplaneEndpoint.value.trim()
    if (edcUrl === '') {
      return ''
    }
    if (edcUrl.endsWith('/')) {
      edcUrl = stripLastCharacter(edcUrl)
    }
    if (!edcUrl.endsWith(defaultControlplaneEndpointPath)) {
      edcUrl += defaultControlplaneEndpointPath
    }
    return edcUrl
  }

  /**
   * Resolves the EDC controlplane management endpoint URL by normalizing it and ensuring it has the correct base path.
   * Removes trailing slashes and ensures the URL ends with '/api/management/v3'
   * @param endpoint Optional custom endpoint URL. If not provided, uses configured controlplane management endpoint
   * @returns Normalized controlplane management endpoint URL ending with '/api/management/v3', or empty string if endpoint is empty
   */
  function resolveEdcControlplaneMgmtEndpoint (endpoint?: string): string {
    let edcUrl = endpoint ? endpoint.trim() : edcControlplaneMgmtEndpoint.value.trim()
    if (edcUrl === '') {
      return ''
    }
    if (edcUrl.endsWith('/')) {
      edcUrl = stripLastCharacter(edcUrl)
    }
    if (!edcUrl.endsWith(defaultControlplaneMgmtEndpointPath)) {
      edcUrl += defaultControlplaneMgmtEndpointPath
    }
    return edcUrl
  }

  /**
   * Checks the health status of the EDC controlplane.
   * Based on OpenAPI spec: GET /check/health
   * @param endpoint Optional custom endpoint to check. If not provided, uses configured controlplane endpoint
   * @returns HealthStatus object with componentResults and isSystemHealthy flag, or null if check fails
   */
  async function checkControlplaneHealth (endpoint?: string): Promise<HealthStatus | null> {
    const baseUrl = resolveEdcControlplaneEndpoint(endpoint)
    if (baseUrl === '') {
      return null
    }

    const path = `${baseUrl}${defaultControlplaneEndpointHealthPath}`
    const context = 'checking EDC controlplane health'
    const disableMessage = false

    try {
      const response = await getRequest(path, context, disableMessage)
      if (response.success && response.data) {
        return response.data as HealthStatus
      }
    } catch (error) {
      console.warn('Health check failed:', error)
    }

    return null
  }

  /**
   * Checks the liveness status of the EDC controlplane.
   * Based on OpenAPI spec: GET /check/liveness
   * @param endpoint Optional custom endpoint to check. If not provided, uses configured controlplane endpoint
   * @returns HealthStatus object with componentResults and isSystemHealthy flag, or null if check fails
   */
  async function checkControlplaneLiveness (endpoint?: string): Promise<HealthStatus | null> {
    const baseUrl = resolveEdcControlplaneEndpoint(endpoint)
    if (baseUrl === '') {
      return null
    }

    const path = `${baseUrl}${defaultControlplaneEndpointLivenessPath}`
    const context = 'checking EDC controlplane liveness'
    const disableMessage = true

    try {
      const response = await getRequest(path, context, disableMessage)
      if (response.success && response.data) {
        return response.data as HealthStatus
      }
    } catch (error) {
      console.warn('Liveness check failed:', error)
    }

    return null
  }

  /**
   * Checks the readiness status of the EDC controlplane.
   * Based on OpenAPI spec: GET /check/readiness
   * @param endpoint Optional custom endpoint to check. If not provided, uses configured controlplane endpoint
   * @returns HealthStatus object with componentResults and isSystemHealthy flag, or null if check fails
   */
  async function checkControlplaneReadiness (endpoint?: string): Promise<HealthStatus | null> {
    const baseUrl = resolveEdcControlplaneEndpoint(endpoint)
    if (baseUrl === '') {
      return null
    }

    const path = `${baseUrl}${defaultControlplaneEndpointReadinessPath}`
    const context = 'checking EDC controlplane readiness'
    const disableMessage = true

    try {
      const response = await getRequest(path, context, disableMessage)
      if (response.success && response.data) {
        return response.data as HealthStatus
      }
    } catch (error) {
      console.warn('Readiness check failed:', error)
    }

    return null
  }

  /**
   * Checks the startup status of the EDC controlplane.
   * Based on OpenAPI spec: GET /check/startup
   * @param endpoint Optional custom endpoint to check. If not provided, uses configured controlplane endpoint
   * @returns HealthStatus object with componentResults and isSystemHealthy flag, or null if check fails
   */
  async function checkControlplaneStartup (endpoint?: string): Promise<HealthStatus | null> {
    const baseUrl = resolveEdcControlplaneEndpoint(endpoint)
    if (baseUrl === '') {
      return null
    }

    const path = `${baseUrl}${defaultControlplaneEndpointStartupPath}`
    const context = 'checking EDC controlplane startup'
    const disableMessage = true

    try {
      const response = await getRequest(path, context, disableMessage)
      if (response.success && response.data) {
        return response.data as HealthStatus
      }
    } catch (error) {
      console.warn('Startup check failed:', error)
    }

    return null
  }

  /**
   * Queries all policy definitions from the EDC controlplane according to a query specification.
   * Based on OpenAPI spec: POST /v3/policydefinitions/request
   * @param querySpec Optional query specification to filter/sort/paginate the results. If not provided or null, uses the default query specification
   * @param endpoint Optional custom endpoint to query. If not provided, uses configured controlplane endpoint
   * @returns Array of PolicyDefinition objects matching the query, or null if query fails
   */
  async function queryPolicyDefinitions (querySpec?: QuerySpec | null, endpoint?: string): Promise<Array<PolicyDefinition> | null> {
    const baseUrl = resolveEdcControlplaneMgmtEndpoint(endpoint)
    if (baseUrl === '') {
      return null
    }

    if (!querySpec) {
      querySpec = defaultQuerySpec
    }

    const path = `${baseUrl}${defaultPolicyDefinitionsRequestPath}`
    const context = 'querying EDC policy definitions'
    const disableMessage = false
    const headers = new Headers()
    headers.append('Content-Type', 'application/json')
    const [authKey, authValue] = await edcStore.getControlplaneAuthHeader
    headers.append(authKey, authValue)

    const body = JSON.stringify(querySpec)

    try {
      const response = await postRequest(path, body, headers, context, disableMessage)
      if (response.success && response.data) {
        return response.data as Array<PolicyDefinition>
      }
    } catch (error) {
      console.warn('Query policy definitions failed:', error)
    }

    return null
  }

  /**
   * Retrieves a policy definition by its ID
   * Based on OpenAPI spec: GET /v3/policydefinitions/{id}
   * @param policyId The ID of the policy definition to retrieve
   * @param endpoint Optional custom endpoint. If not provided, uses configured controlplane endpoint
   * @returns PolicyDefinition object, or null if retrieval fails
   */
  async function getPolicyDefinition (policyId: string, endpoint?: string): Promise<PolicyDefinition | null> {
    const baseUrl = resolveEdcControlplaneMgmtEndpoint(endpoint)
    if (baseUrl === '' || !policyId) {
      return null
    }

    const path = `${baseUrl}${defaultPolicyDefinitionsPath}/${policyId}`
    const context = 'retrieving EDC policy definition'
    const disableMessage = false
    const headers = new Headers()
    headers.append('Content-Type', 'application/json')
    const [authKey, authValue] = await edcStore.getControlplaneAuthHeader
    headers.append(authKey, authValue)

    try {
      const response = await getRequest(path, context, disableMessage, headers)
      if (response.success && response.data) {
        return response.data as PolicyDefinition
      }
    } catch (error) {
      console.warn('Get policy definition failed:', error)
    }

    return null
  }

  /**
   * Creates a new policy definition
   * Based on OpenAPI spec: POST /v3/policydefinitions
   * @param policyDefinition The policy definition to create
   * @param endpoint Optional custom endpoint. If not provided, uses configured controlplane endpoint
   * @returns IdResponse with the created policy definition id and createdAt timestamp, or null if creation fails
   */
  async function createPolicyDefinition (policyDefinition: PolicyDefinition, endpoint?: string): Promise<IdResponse | null> {
    const baseUrl = resolveEdcControlplaneMgmtEndpoint(endpoint)
    if (baseUrl === '' || !policyDefinition) {
      return null
    }

    const path = `${baseUrl}${defaultPolicyDefinitionsPath}`
    const context = 'creating EDC policy definition'
    const disableMessage = false
    const headers = new Headers()
    headers.append('Content-Type', 'application/json')
    const [authKey, authValue] = await edcStore.getControlplaneAuthHeader
    headers.append(authKey, authValue)
    const body = JSON.stringify(policyDefinition)

    try {
      const response = await postRequest(path, body, headers, context, disableMessage)
      if (response.success && response.data) {
        return response.data as IdResponse
      }
    } catch (error) {
      console.warn('Create policy definition failed:', error)
    }

    return null
  }

  /**
   * Updates an existing policy definition
   * Based on OpenAPI spec: PUT /v3/policydefinitions/{id}
   * @param policyId The ID of the policy definition to update
   * @param policyDefinition The updated policy definition data
   * @param endpoint Optional custom endpoint. If not provided, uses configured controlplane endpoint
   * @returns true if update was successful, false otherwise
   */
  async function updatePolicyDefinition (policyId: string, policyDefinition: PolicyDefinition, endpoint?: string): Promise<boolean> {
    const baseUrl = resolveEdcControlplaneMgmtEndpoint(endpoint)
    if (baseUrl === '' || !policyId || !policyDefinition) {
      return false
    }

    const path = `${baseUrl}${defaultPolicyDefinitionsPath}/${policyId}`
    const context = 'updating EDC policy definition'
    const disableMessage = false
    const headers = new Headers()
    headers.append('Content-Type', 'application/json')
    const [authKey, authValue] = await edcStore.getControlplaneAuthHeader
    headers.append(authKey, authValue)
    const body = JSON.stringify(policyDefinition)

    try {
      const response = await putRequest(path, body, headers, context, disableMessage)
      if (response.success) {
        return true
      }
    } catch (error) {
      console.warn('Update policy definition failed:', error)
    }

    return false
  }

  /**
   * Deletes a policy definition by its ID
   * Based on OpenAPI spec: DELETE /v3/policydefinitions/{id}
   * @param policyId The ID of the policy definition to delete
   * @param endpoint Optional custom endpoint. If not provided, uses configured controlplane endpoint
   * @returns true if deletion was successful, false otherwise
   */
  async function deletePolicyDefinition (policyId: string, endpoint?: string): Promise<boolean> {
    const baseUrl = resolveEdcControlplaneMgmtEndpoint(endpoint)
    if (baseUrl === '' || !policyId) {
      return false
    }

    const path = `${baseUrl}${defaultPolicyDefinitionsPath}/${policyId}`
    const context = 'deleting EDC policy definition'
    const headers = new Headers()
    headers.append('Content-Type', 'application/json')
    const [authKey, authValue] = await edcStore.getControlplaneAuthHeader
    headers.append(authKey, authValue)
    const disableMessage = false

    try {
      const response = await deleteRequest(path, headers, context, disableMessage)
      if (response.success) {
        return true
      }
    } catch (error) {
      console.warn('Delete policy definition failed:', error)
    }

    return false
  }

  /**
   * Queries all assets from the EDC controlplane according to a query specification.
   * Based on OpenAPI spec: POST /v3/assets/request
   * @param querySpec Optional query specification to filter/sort/paginate the results. If not provided or null, uses the default query specification
   * @param endpoint Optional custom endpoint. If not provided, uses configured controlplane management endpoint
   * @returns Array of Asset objects matching the query, or null if query fails
   */
  async function queryAssets (querySpec?: QuerySpec | null, endpoint?: string): Promise<Array<Asset> | null> {
    const baseUrl = resolveEdcControlplaneMgmtEndpoint(endpoint)
    if (baseUrl === '') {
      return null
    }

    if (!querySpec) {
      querySpec = defaultQuerySpec
    }

    const path = `${baseUrl}${defaultAssetsRequestPath}`
    const context = 'querying EDC assets'
    const disableMessage = false
    const headers = new Headers()
    headers.append('Content-Type', 'application/json')
    const [authKey, authValue] = await edcStore.getControlplaneAuthHeader
    headers.append(authKey, authValue)

    const body = JSON.stringify(querySpec)

    try {
      const response = await postRequest(path, body, headers, context, disableMessage)
      if (response.success && response.data) {
        return response.data as Array<Asset>
      }
    } catch (error) {
      console.warn('Query assets failed:', error)
    }

    return null
  }

  /**
   * Retrieves a asset by its ID
   * Based on OpenAPI spec: GET /v3/assets/{id}
   * @param assetId The ID of the asset to retrieve
   * @param endpoint Optional custom endpoint. If not provided, uses configured controlplane endpoint
   * @returns Asset object, or null if retrieval fails
   */
  async function getAsset (assetId: string, endpoint?: string): Promise<Asset | null> {
    const baseUrl = resolveEdcControlplaneMgmtEndpoint(endpoint)
    if (baseUrl === '' || !assetId) {
      return null
    }

    const path = `${baseUrl}${defaultAssetsPath}/${assetId}`
    const context = 'retrieving EDC asset'
    const disableMessage = false
    const headers = new Headers()
    headers.append('Content-Type', 'application/json')
    const [authKey, authValue] = await edcStore.getControlplaneAuthHeader
    headers.append(authKey, authValue)

    try {
      const response = await getRequest(path, context, disableMessage, headers)
      if (response.success && response.data) {
        return response.data as Asset
      }
    } catch (error) {
      console.warn('Get asset failed:', error)
    }

    return null
  }

  /**
   * Creates a new EDC asset together with a data address.
   * Based on OpenAPI spec: POST /v3/assets
   * @param asset The asset input object (AssetInput) containing @id, properties and dataAddress
   * @param endpoint Optional custom endpoint. If not provided, uses configured controlplane management endpoint
   * @returns AssetResult with success flag, optional IdResponse and optional error message
   */
  async function createAsset (asset: Asset, endpoint?: string): Promise<AssetResult> {
    const baseUrl = resolveEdcControlplaneMgmtEndpoint(endpoint)
    if (baseUrl === '') {
      return { success: false, errorMessage: 'EDC management endpoint is not configured.' }
    }

    const path = `${baseUrl}${defaultAssetsPath}`
    const context = 'creating EDC asset'
    const disableMessage = true
    const headers = new Headers()
    headers.append('Content-Type', 'application/json')
    const [authKey, authValue] = await edcStore.getControlplaneAuthHeader
    headers.append(authKey, authValue)
    const body = JSON.stringify(asset)

    const assetId = asset['@id'] ?? 'unknown'

    try {
      const response = await postRequest(path, body, headers, context, disableMessage)
      if (response.success && response.data) {
        return { success: true, data: response.data as IdResponse }
      }
      const errorMessage = `${assetId}`
      return { success: false, errorMessage }
    } catch (error) {
      console.warn('Create asset failed:', error)
      const msg = error instanceof Error ? error.message : String(error)
      return { success: false, errorMessage: `[${assetId}] ${msg}` }
    }
  }

  /**
   * Updates an existing asset
   * Based on OpenAPI spec: PUT /v3/assets/{id}
   * @param assetId The ID of the asset to update
   * @param Asset The updated asset data
   * @param endpoint Optional custom endpoint. If not provided, uses configured controlplane endpoint
   * @returns true if update was successful, false otherwise
   */
  async function updateAsset (assetId: string, asset: Asset, endpoint?: string): Promise<boolean> {
    const baseUrl = resolveEdcControlplaneMgmtEndpoint(endpoint)
    if (baseUrl === '' || !assetId || !asset) {
      return false
    }

    const path = `${baseUrl}${defaultAssetsPath}`
    const context = 'updating EDC asset'
    const disableMessage = false
    const headers = new Headers()
    headers.append('Content-Type', 'application/json')
    const [authKey, authValue] = await edcStore.getControlplaneAuthHeader
    headers.append(authKey, authValue)
    const body = JSON.stringify(asset)

    try {
      const response = await putRequest(path, body, headers, context, disableMessage)
      if (response.success) {
        return true
      }
    } catch (error) {
      console.warn('Update asset failed:', error)
    }

    return false
  }

  /**
   * Deletes an asset by its ID
   * Based on OpenAPI spec: DELETE /v3/assets/{id}
   * @param assetId The ID of the asset to delete
   * @param endpoint Optional custom endpoint. If not provided, uses configured controlplane endpoint
   * @returns true if deletion was successful, false otherwise
   */
  async function deleteAsset (assetId: string, endpoint?: string): Promise<boolean> {
    const baseUrl = resolveEdcControlplaneMgmtEndpoint(endpoint)
    if (baseUrl === '' || !assetId) {
      return false
    }

    const path = `${baseUrl}${defaultAssetsPath}/${assetId}`
    const context = 'deleting EDC asset'
    const headers = new Headers()
    headers.append('Content-Type', 'application/json')
    const [authKey, authValue] = await edcStore.getControlplaneAuthHeader
    headers.append(authKey, authValue)
    const disableMessage = false

    try {
      const response = await deleteRequest(path, headers, context, disableMessage)
      if (response.success) {
        return true
      }
    } catch (error) {
      console.warn('Delete asset failed:', error)
    }

    return false
  }

  /**
   * Queries all contract agreements from the EDC controlplane according to a query specification.
   * Based on OpenAPI spec: POST /v3/contractagreements/request
   * @param querySpec Optional query specification to filter/sort/paginate the results. If not provided or null, uses the default query specification
   * @param endpoint Optional custom endpoint to query. If not provided, uses configured controlplane management endpoint
   * @returns Array of ContractAgreement objects matching the query, or null if query fails
   */
  async function queryContractAgreements (querySpec?: QuerySpec | null, endpoint?: string): Promise<Array<ContractAgreement> | null> {
    const baseUrl = resolveEdcControlplaneMgmtEndpoint(endpoint)
    if (baseUrl === '') {
      return null
    }

    if (!querySpec) {
      querySpec = defaultQuerySpec
    }

    const path = `${baseUrl}${defaultContractAgreementsRequestPath}`
    const context = 'querying EDC contract agreements'
    const disableMessage = false
    const headers = new Headers()
    headers.append('Content-Type', 'application/json')
    const [authKey, authValue] = await edcStore.getControlplaneAuthHeader
    headers.append(authKey, authValue)

    const body = JSON.stringify(querySpec)

    try {
      const response = await postRequest(path, body, headers, context, disableMessage)
      if (response.success && response.data) {
        return response.data as Array<ContractAgreement>
      }
    } catch (error) {
      console.warn('Query contract agreements failed:', error)
    }

    return null
  }

  /**
   * Retrieves a contract agreement by its ID.
   * Based on OpenAPI spec: GET /v3/contractagreements/{id}
   * @param agreementId The ID of the contract agreement to retrieve
   * @param endpoint Optional custom endpoint. If not provided, uses configured controlplane management endpoint
   * @returns ContractAgreement object, or null if retrieval fails
   */
  async function getContractAgreement (agreementId: string, endpoint?: string): Promise<ContractAgreement | null> {
    const baseUrl = resolveEdcControlplaneMgmtEndpoint(endpoint)
    if (baseUrl === '' || !agreementId) {
      return null
    }

    const path = `${baseUrl}${defaultContractAgreementsPath}/${agreementId}`
    const context = 'retrieving EDC contract agreement'
    const disableMessage = false
    const headers = new Headers()
    headers.append('Content-Type', 'application/json')
    const [authKey, authValue] = await edcStore.getControlplaneAuthHeader
    headers.append(authKey, authValue)

    try {
      const response = await getRequest(path, context, disableMessage, headers)
      if (response.success && response.data) {
        return response.data as ContractAgreement
      }
    } catch (error) {
      console.warn('Get contract agreement failed:', error)
    }

    return null
  }

  /**
   * Queries all contract definitions from the EDC controlplane according to a query specification.
   * Based on OpenAPI spec: POST /v3/contractdefinitions/request
   * @param querySpec Optional query specification to filter/sort/paginate the results. If not provided or null, uses the default query specification
   * @param endpoint Optional custom endpoint to query. If not provided, uses configured controlplane endpoint
   * @returns Array of ContractDefinition objects matching the query, or null if query fails
   */
  async function queryContractDefinitions (querySpec?: QuerySpec | null, endpoint?: string): Promise<Array<ContractDefinition> | null> {
    const baseUrl = resolveEdcControlplaneMgmtEndpoint(endpoint)
    if (baseUrl === '') {
      return null
    }

    if (!querySpec) {
      querySpec = defaultQuerySpec
    }

    const path = `${baseUrl}${defaultContractDefinitionsRequestPath}`
    const context = 'querying EDC contract definitions'
    const disableMessage = false
    const headers = new Headers()
    headers.append('Content-Type', 'application/json')
    const [authKey, authValue] = await edcStore.getControlplaneAuthHeader
    headers.append(authKey, authValue)

    const body = JSON.stringify(querySpec)

    try {
      const response = await postRequest(path, body, headers, context, disableMessage)
      if (response.success && response.data) {
        return response.data as Array<ContractDefinition>
      }
    } catch (error) {
      console.warn('Query contract definitions failed:', error)
    }

    return null
  }

  /**
   * Retrieves a contract definition by its ID
   * Based on OpenAPI spec: GET /v3/contractdefinitions/{id}
   * @param contractId The ID of the contract definition to retrieve
   * @param endpoint Optional custom endpoint. If not provided, uses configured controlplane endpoint
   * @returns ContractDefinition object, or null if retrieval fails
   */
  async function getContractDefinition (contractId: string, endpoint?: string): Promise<ContractDefinition | null> {
    const baseUrl = resolveEdcControlplaneMgmtEndpoint(endpoint)
    if (baseUrl === '' || !contractId) {
      return null
    }

    const path = `${baseUrl}${defaultContractDefinitionsPath}/${contractId}`
    const context = 'retrieving EDC contract definition'
    const disableMessage = false
    const headers = new Headers()
    headers.append('Content-Type', 'application/json')
    const [authKey, authValue] = await edcStore.getControlplaneAuthHeader
    headers.append(authKey, authValue)

    try {
      const response = await getRequest(path, context, disableMessage, headers)
      if (response.success && response.data) {
        return response.data as ContractDefinition
      }
    } catch (error) {
      console.warn('Get contract definition failed:', error)
    }

    return null
  }

  /**
   * Creates a new contract definition
   * Based on OpenAPI spec: POST /v3/contractdefinitions
   * @param contractDefinition The contract definition to create
   * @param endpoint Optional custom endpoint. If not provided, uses configured controlplane endpoint
   * @returns IdResponse with the created contract definition id and createdAt timestamp, or null if creation fails
   */
  async function createContractDefinition (contractDefinition: ContractDefinition, endpoint?: string): Promise<IdResponse | null> {
    const baseUrl = resolveEdcControlplaneMgmtEndpoint(endpoint)
    if (baseUrl === '' || !contractDefinition) {
      return null
    }

    const path = `${baseUrl}${defaultContractDefinitionsPath}`
    const context = 'creating EDC contract definition'
    const disableMessage = false
    const headers = new Headers()
    headers.append('Content-Type', 'application/json')
    const [authKey, authValue] = await edcStore.getControlplaneAuthHeader
    headers.append(authKey, authValue)
    const body = JSON.stringify(contractDefinition)

    try {
      const response = await postRequest(path, body, headers, context, disableMessage)
      if (response.success && response.data) {
        return response.data as IdResponse
      }
    } catch (error) {
      console.warn('Create contract definition failed:', error)
    }

    return null
  }

  /**
   * Updates an existing contract definition
   * Based on OpenAPI spec: PUT /v3/contractdefinitions
   * @param contractId The ID of the contract definition to update
   * @param contractDefinition The updated contract definition data
   * @param endpoint Optional custom endpoint. If not provided, uses configured controlplane endpoint
   * @returns true if update was successful, false otherwise
   */
  async function updateContractDefinition (contractId: string, contractDefinition: ContractDefinition, endpoint?: string): Promise<boolean> {
    const baseUrl = resolveEdcControlplaneMgmtEndpoint(endpoint)
    if (baseUrl === '' || !contractId || !contractDefinition) {
      return false
    }

    const path = `${baseUrl}${defaultContractDefinitionsPath}`
    const context = 'updating EDC contract definition'
    const disableMessage = false
    const headers = new Headers()
    headers.append('Content-Type', 'application/json')
    const [authKey, authValue] = await edcStore.getControlplaneAuthHeader
    headers.append(authKey, authValue)
    const body = JSON.stringify(contractDefinition)

    try {
      const response = await putRequest(path, body, headers, context, disableMessage)
      if (response.success) {
        return true
      }
    } catch (error) {
      console.warn('Update contract definition failed:', error)
    }

    return false
  }

  /**
   * Deletes a contract definition by its ID
   * Based on OpenAPI spec: DELETE /v3/contractdefinitions/{id}
   * @param contractId The ID of the contract definition to delete
   * @param endpoint Optional custom endpoint. If not provided, uses configured controlplane endpoint
   * @returns true if deletion was successful, false otherwise
   */
  async function deleteContractDefinition (contractId: string, endpoint?: string): Promise<boolean> {
    const baseUrl = resolveEdcControlplaneMgmtEndpoint(endpoint)
    if (baseUrl === '' || !contractId) {
      return false
    }

    const path = `${baseUrl}${defaultContractDefinitionsPath}/${contractId}`
    const context = 'deleting EDC contract definition'
    const headers = new Headers()
    headers.append('Content-Type', 'application/json')
    const [authKey, authValue] = await edcStore.getControlplaneAuthHeader
    headers.append(authKey, authValue)
    const disableMessage = false

    try {
      const response = await deleteRequest(path, headers, context, disableMessage)
      if (response.success) {
        return true
      }
    } catch (error) {
      console.warn('Delete contract definition failed:', error)
    }

    return false
  }

  /**
   * Queries the catalog from a specific connector.
   * Based on OpenAPI spec: POST /v3/catalog/request
   * @param catalogRequest The catalog request object containing counterPartyAddress and protocol
   * @param endpoint Optional custom endpoint. If not provided, uses configured controlplane management endpoint
   * @returns Catalog object, or null if query fails
   */
  async function queryCatalog (catalogRequest: CatalogRequest, endpoint?: string): Promise<Catalog | null> {
    const baseUrl = resolveEdcControlplaneMgmtEndpoint(endpoint)
    if (baseUrl === '' || !catalogRequest) {
      return null
    }

    const path = `${baseUrl}${defaultCatalogRequestPath}`
    const context = 'querying EDC catalog'
    const disableMessage = false
    const headers = new Headers()
    headers.append('Content-Type', 'application/json')
    const [authKey, authValue] = await edcStore.getControlplaneAuthHeader
    headers.append(authKey, authValue)

    const body = JSON.stringify(catalogRequest)

    try {
      const response = await postRequest(path, body, headers, context, disableMessage)
      if (response.success && response.data) {
        return response.data as Catalog
      }
    } catch (error) {
      console.warn('Query catalog failed:', error)
    }

    return null
  }

  /**
   * Retrieves a single dataset from a connector.
   * Based on OpenAPI spec: POST /v3/catalog/dataset/request
   * @param datasetRequest The dataset request object containing counterPartyAddress and protocol
   * @param endpoint Optional custom endpoint. If not provided, uses configured controlplane management endpoint
   * @returns Dataset object, or null if query fails
   */
  async function getCatalogDataset (datasetRequest: DatasetRequest, endpoint?: string): Promise<Dataset | null> {
    const baseUrl = resolveEdcControlplaneMgmtEndpoint(endpoint)
    if (baseUrl === '' || !datasetRequest) {
      return null
    }

    const path = `${baseUrl}${defaultCatalogDatasetRequestPath}`
    const context = 'retrieving EDC dataset'
    const disableMessage = false
    const headers = new Headers()
    headers.append('Content-Type', 'application/json')
    const [authKey, authValue] = await edcStore.getControlplaneAuthHeader
    headers.append(authKey, authValue)

    // Ensure @context and @type are set if not provided
    const body = JSON.stringify(datasetRequest)

    try {
      const response = await postRequest(path, body, headers, context, disableMessage)
      if (response.success && response.data) {
        return response.data as Dataset
      }
    } catch (error) {
      console.warn('Get dataset failed:', error)
    }

    return null
  }

  /**
   * Initiates a contract negotiation for a given offer and with the given counter part.
   * Based on OpenAPI spec: POST /v3/contractnegotiations
   * @param contractRequest The contract request object containing counterPartyAddress, protocol and policy (offer)
   * @param endpoint Optional custom endpoint. If not provided, uses configured controlplane management endpoint
   * @returns IdResponse with the negotiation id and createdAt timestamp, or null if initiation fails
   */
  async function initiateContractNegotiation (contractRequest: ContractRequest, endpoint?: string): Promise<IdResponse | null> {
    const baseUrl = resolveEdcControlplaneMgmtEndpoint(endpoint)
    if (baseUrl === '' || !contractRequest) {
      return null
    }

    const path = `${baseUrl}${defaultContractNegotiationsPath}`
    const context = 'initiating EDC contract negotiation'
    const disableMessage = false
    const headers = new Headers()
    headers.append('Content-Type', 'application/json')
    const [authKey, authValue] = await edcStore.getControlplaneAuthHeader
    headers.append(authKey, authValue)

    const body = JSON.stringify(contractRequest)

    try {
      const response = await postRequest(path, body, headers, context, disableMessage)
      if (response.success && response.data) {
        return response.data as IdResponse
      }
    } catch (error) {
      console.warn('Initiate contract negotiation failed:', error)
    }

    return null
  }

  /**
   * Retrieves a contract negotiation by its ID.
   * Based on OpenAPI spec: GET /v3/contractnegotiations/{id}
   * @param negotiationId The ID of the contract negotiation to retrieve
   * @param endpoint Optional custom endpoint. If not provided, uses configured controlplane management endpoint
   * @returns ContractNegotiation object, or null if retrieval fails
   */
  async function getContractNegotiation (negotiationId: string, endpoint?: string): Promise<ContractNegotiation | null> {
    const baseUrl = resolveEdcControlplaneMgmtEndpoint(endpoint)
    if (baseUrl === '' || !negotiationId) {
      return null
    }

    const path = `${baseUrl}${defaultContractNegotiationsPath}/${negotiationId}`
    const context = 'retrieving EDC contract negotiation'
    const disableMessage = false
    const headers = new Headers()
    headers.append('Content-Type', 'application/json')
    const [authKey, authValue] = await edcStore.getControlplaneAuthHeader
    headers.append(authKey, authValue)

    try {
      const response = await getRequest(path, context, disableMessage, headers)
      if (response.success && response.data) {
        return response.data as ContractNegotiation
      }
    } catch (error) {
      console.warn('Get contract negotiation failed:', error)
    }

    return null
  }

  /**
   * Gets the state of a contract negotiation with the given ID.
   * Based on OpenAPI spec: GET /v3/contractnegotiations/{id}/state
   * @param negotiationId The ID of the contract negotiation to retrieve the state for
   * @param endpoint Optional custom endpoint. If not provided, uses configured controlplane management endpoint
   * @returns NegotiationState object, or null if retrieval fails
   */
  async function getContractNegotiationState (negotiationId: string, endpoint?: string): Promise<NegotiationState | null> {
    const baseUrl = resolveEdcControlplaneMgmtEndpoint(endpoint)
    if (baseUrl === '' || !negotiationId) {
      return null
    }

    const path = `${baseUrl}${defaultContractNegotiationsPath}/${negotiationId}/state`
    const context = 'retrieving EDC contract negotiation state'
    const disableMessage = false
    const headers = new Headers()
    headers.append('Content-Type', 'application/json')
    const [authKey, authValue] = await edcStore.getControlplaneAuthHeader
    headers.append(authKey, authValue)

    try {
      const response = await getRequest(path, context, disableMessage, headers)
      if (response.success && response.data) {
        return response.data as NegotiationState
      }
    } catch (error) {
      console.warn('Get contract negotiation state failed:', error)
    }

    return null
  }

  /**
   * Initiates a data transfer with the given parameters.
   * Based on OpenAPI spec: POST /v3/transferprocesses
   * @param transferRequest The transfer request object containing contractId, counterPartyAddress, protocol and transferType
   * @param endpoint Optional custom endpoint. If not provided, uses configured controlplane management endpoint
   * @returns IdResponse with the transfer process id and createdAt timestamp, or null if initiation fails
   */
  async function initiateTransferProcess (transferRequest: TransferRequest, endpoint?: string): Promise<IdResponse | null> {
    const baseUrl = resolveEdcControlplaneMgmtEndpoint(endpoint)
    if (baseUrl === '' || !transferRequest) {
      return null
    }

    const path = `${baseUrl}${defaultTransferProcessesPath}`
    const context = 'initiating EDC transfer process'
    const disableMessage = false
    const headers = new Headers()
    headers.append('Content-Type', 'application/json')
    const [authKey, authValue] = await edcStore.getControlplaneAuthHeader
    headers.append(authKey, authValue)

    const body = JSON.stringify(transferRequest)

    try {
      const response = await postRequest(path, body, headers, context, disableMessage)
      if (response.success && response.data) {
        return response.data as IdResponse
      }
    } catch (error) {
      console.warn('Initiate transfer process failed:', error)
    }

    return null
  }

  /**
   * Retrieves a transfer process by its ID.
   * Based on OpenAPI spec: GET /v3/transferprocesses/{id}
   * @param transferProcessId The ID of the transfer process to retrieve
   * @param endpoint Optional custom endpoint. If not provided, uses configured controlplane management endpoint
   * @returns TransferProcess object, or null if retrieval fails
   */
  async function getTransferProcess (transferProcessId: string, endpoint?: string): Promise<TransferProcess | null> {
    const baseUrl = resolveEdcControlplaneMgmtEndpoint(endpoint)
    if (baseUrl === '' || !transferProcessId) {
      return null
    }

    const path = `${baseUrl}${defaultTransferProcessesPath}/${transferProcessId}`
    const context = 'retrieving EDC transfer process'
    const disableMessage = false
    const headers = new Headers()
    headers.append('Content-Type', 'application/json')
    const [authKey, authValue] = await edcStore.getControlplaneAuthHeader
    headers.append(authKey, authValue)

    try {
      const response = await getRequest(path, context, disableMessage, headers)
      if (response.success && response.data) {
        return response.data as TransferProcess
      }
    } catch (error) {
      console.warn('Get transfer process failed:', error)
    }

    return null
  }

  /**
   * Gets the state of a transfer process with the given ID.
   * Based on OpenAPI spec: GET /v3/transferprocesses/{id}/state
   * @param transferProcessId The ID of the transfer process to retrieve the state for
   * @param endpoint Optional custom endpoint. If not provided, uses configured controlplane management endpoint
   * @returns TransferState object, or null if retrieval fails
   */
  async function getTransferProcessState (transferProcessId: string, endpoint?: string): Promise<TransferState | null> {
    const baseUrl = resolveEdcControlplaneMgmtEndpoint(endpoint)
    if (baseUrl === '' || !transferProcessId) {
      return null
    }

    const path = `${baseUrl}${defaultTransferProcessesPath}/${transferProcessId}/state`
    const context = 'retrieving EDC transfer process state'
    const disableMessage = false
    const headers = new Headers()
    headers.append('Content-Type', 'application/json')
    const [authKey, authValue] = await edcStore.getControlplaneAuthHeader
    headers.append(authKey, authValue)

    try {
      const response = await getRequest(path, context, disableMessage, headers)
      if (response.success && response.data) {
        return response.data as TransferState
      }
    } catch (error) {
      console.warn('Get transfer process state failed:', error)
    }

    return null
  }

  /**
   * Gets the EDR data address with the given transfer process ID.
   * Based on OpenAPI spec: GET /v3/edrs/{transferProcessId}/dataaddress
   * @param transferProcessId The ID of the transfer process to retrieve the data address for
   * @param endpoint Optional custom endpoint. If not provided, uses configured controlplane management endpoint
   * @returns AssetDataAddress object, or null if retrieval fails
   */
  async function getEdrDataAddress (transferProcessId: string, endpoint?: string): Promise<AssetDataAddress | null> {
    const baseUrl = resolveEdcControlplaneMgmtEndpoint(endpoint)
    if (baseUrl === '' || !transferProcessId) {
      return null
    }

    const path = `${baseUrl}${defaultEdrsPath}/${transferProcessId}/dataaddress`
    const context = 'retrieving EDC EDR data address'
    const disableMessage = false
    const headers = new Headers()
    headers.append('Content-Type', 'application/json')
    const [authKey, authValue] = await edcStore.getControlplaneAuthHeader
    headers.append(authKey, authValue)

    try {
      const response = await getRequest(path, context, disableMessage, headers)
      if (response.success && response.data) {
        return response.data as AssetDataAddress
      }
    } catch (error) {
      console.warn('Get EDR data address failed:', error)
    }

    return null
  }

  return {
    resolveEdcControlplaneEndpoint,
    resolveEdcControlplaneMgmtEndpoint,
    checkControlplaneHealth,
    checkControlplaneLiveness,
    checkControlplaneReadiness,
    checkControlplaneStartup,
    queryPolicyDefinitions,
    getPolicyDefinition,
    createPolicyDefinition,
    updatePolicyDefinition,
    deletePolicyDefinition,
    queryAssets,
    getAsset,
    createAsset,
    updateAsset,
    deleteAsset,
    queryContractAgreements,
    getContractAgreement,
    queryContractDefinitions,
    getContractDefinition,
    createContractDefinition,
    updateContractDefinition,
    deleteContractDefinition,
    queryCatalog,
    getCatalogDataset,
    initiateContractNegotiation,
    getContractNegotiation,
    getContractNegotiationState,
    initiateTransferProcess,
    getTransferProcess,
    getTransferProcessState,
    getEdrDataAddress,
  }
}

// Type definitions based on OpenAPI spec
export interface HealthCheckResult {
  component: string
  failure?: Failure
  isHealthy: boolean
}

export interface HealthStatus {
  componentResults: HealthCheckResult[]
  isSystemHealthy: boolean
}

export interface Failure {
  detail?: string
  messages?: string[]
}

export interface QuerySpec {
  '@context'?: Record<string, unknown>
  '@type'?: string
  'offset'?: number
  'limit'?: number
  'sortField'?: string
  'sortOrder'?: 'ASC' | 'DESC'
  'filterExpression'?: Array<Record<string, unknown>>
}

export interface OdrlAction {
  '@id'?: string
}

export interface OdrlOperant {
  '@id'?: string
}

export interface OdrlOperator {
  '@id'?: string
}

export interface OdrlConstraint {
  'odrl:leftOperand'?: OdrlOperant
  'leftOperand'?: OdrlOperant
  'odrl:operator'?: OdrlOperator
  'operator'?: OdrlOperator
  'odrl:rightOperand'?: string
  'rightOperand'?: string
}

export interface OdrlPermission {
  'odrl:action'?: OdrlAction
  'action'?: OdrlAction
  'odrl:constraint'?: OdrlConstraint
  'constraint'?: OdrlConstraint
}

export interface OdrlProhibition {
}

export interface OdrlObligation {
}

export interface Policy {
  '@id'?: string
  'odrl:permission'?: OdrlPermission
  'permission'?: OdrlPermission
  'odrl:prohibition'?: OdrlProhibition
  'prohibition'?: OdrlProhibition
  'odlr:obligation'?: OdrlObligation
}

export interface PolicyDefinition {
  '@id'?: string
  '@type'?: string
  '@context'?: Record<string, unknown>
  'policy'?: Policy
  'createdAt'?: number
}

export interface IdResponse {
  '@id': string
  'createdAt': number
}

export interface AssetResult {
  success: boolean
  data?: IdResponse
  errorMessage?: string
}

export interface AssetProperties {
  [key: string]: unknown
  description?: string
  name?: string
}

export interface AssetDataAddress {
  '@type': string
  'type': string
  'baseUrl': string
  'proxyPath'?: boolean
  'proxyMethod'?: boolean
  'proxyQueryParams'?: boolean
  'proxyBody'?: boolean
}

export interface Asset {
  '@context'?: Record<string, unknown>
  '@id'?: string
  '@type'?: string
  'properties': AssetProperties
  'privateProperties'?: AssetProperties
  'dataAddress': AssetDataAddress
}

export interface Criterion {
  '@type'?: string
  'operandLeft': unknown
  'operandRight': unknown
  'operator': string
}

export interface ContractAgreement {
  '@id'?: string
  '@type'?: string
  '@context'?: Record<string, unknown>
  'assetId'?: string
  'consumerId'?: string
  'contractSigningDate'?: number
  'policy'?: Policy
  'providerId'?: string
}

export interface ContractDefinition {
  '@context'?: Record<string, unknown>
  '@id'?: string
  '@type'?: string
  'accessPolicyId': string
  'contractPolicyId': string
  'assetsSelector': Criterion[]
  'createdAt'?: number
}

export interface CatalogRequest {
  '@context'?: Record<string, unknown>
  '@type'?: string
  'counterPartyAddress': string
  'counterPartyId'?: string
  'protocol': string
  'querySpec'?: QuerySpec
}

export interface Catalog {
  '@id'?: string
  '@type'?: string
  'dcat:dataset'?: any | any[]
  'dataset'?: any | any[]
  'dcat:service'?: any | any[]
  'service'?: any | any[]
  'dspace:participantId'?: string
  'participantId'?: string
  '@context'?: Record<string, unknown>
}

export interface DatasetRequest {
  '@id'?: string
  '@context'?: Record<string, unknown>
  '@type'?: string
  'counterPartyAddress': string
  'counterPartyId'?: string
  'protocol': string
  'querySpec'?: QuerySpec
}

export interface Dataset {
  '@id'?: string
  '@type'?: string
  'odrl:hasPolicy'?: any | any[]
  'dcat:distribution'?: any | any[]
  'distribution'?: any | any[]
  '@context'?: JsonLdContext
}

export interface Offer {
  '@id': string
  '@type'?: string
  'assigner': string
  'target': string
  'permission'?: any[] | Record<string, unknown>
  'prohibition'?: any[] | Record<string, unknown>
  'obligation'?: any[] | Record<string, unknown>
}

export interface ContractRequest {
  '@context'?: JsonLdContext
  '@type'?: string
  'counterPartyAddress': string
  'protocol': string
  'policy': Offer
  'callbackAddresses'?: any[]
}

export interface CallbackAddress {
  '@type'?: string
  'authCodeId'?: string
  'authKey'?: string
  'events'?: string[]
  'transactional'?: boolean
  'uri'?: string
}

export interface ContractNegotiation {
  '@id'?: string
  '@type'?: string
  'callbackAddresses'?: CallbackAddress[]
  'contractAgreementId'?: string
  'counterPartyAddress'?: string
  'counterPartyId'?: string
  'errorDetail'?: string
  'protocol'?: string
  'state'?: string
  'type'?: 'CONSUMER' | 'PROVIDER'
}

export interface TransferRequest {
  '@context'?: Record<string, unknown>
  '@type'?: string
  'assetId'?: string
  'callbackAddresses'?: CallbackAddress[]
  'contractId': string
  'counterPartyAddress': string
  'counterPartyId': string
  'dataDestination'?: AssetDataAddress
  'privateProperties'?: AssetProperties
  'protocol': string
  'transferType'?: string
}

export interface TransferProcess {
  '@id'?: string
  '@type'?: string
  'callbackAddresses'?: CallbackAddress[]
  'contractAgreementId'?: string
  'counterPartyAddress'?: string
  'counterPartyId'?: string
  'dataDestination'?: AssetDataAddress
  'errorDetail'?: string
  'privateProperties'?: AssetProperties
  'protocol'?: string
  'state'?: string
  'type'?: 'CONSUMER' | 'PROVIDER'
}

// JSON-LD '@context' can be a string, an object (vocab map) or an array mixing both,
// e.g. ['https://www.w3.org/ns/odrl.jsonld', { '@vocab': '...' }]. The EDC OpenAPI specs
// are inconsistent in how they narrow this (array of strings in some v0.12.1 schemas,
// object in v0.9.0 examples), so this permissive union covers all versions/endpoints.
export type JsonLdContext = string | Record<string, unknown> | Array<string | Record<string, unknown>>

export interface NegotiationState {
  '@context'?: JsonLdContext
  '@type'?: string
  'state': string
}

export interface TransferState {
  '@context'?: JsonLdContext
  '@type'?: string
  'state': string
}
