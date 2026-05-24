import { computed } from 'vue'
import { useRequestHandling } from '@/composables/RequestHandling'
import { useEdcStore } from '@/pages/modules/EclipseDataspaceConnector/store/EdcStore'
import { stripLastCharacter } from '@/utils/StringUtils'

export function useEdcClient () {
  // Stores
  const edcStore = useEdcStore()

  // Composables
  const { getRequest, postRequest, deleteRequest } = useRequestHandling()

  const defaultControlplaneEndpointPath = '/api'
  const defaultControlplaneMgmtEndpointPath = '/api/management/v3'
  const defaultPolicyDefinitionsPath = '/policydefinitions'
  const defaultPolicyDefinitionsRequestPath = '/policydefinitions/request'

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
   * @param endpoint Optional custom endpoint to query. If not provided, uses configured controlplane endpoint
   * @returns Array of PolicyDefinition objects matching the query, or null if query fails
   */
  async function queryPolicyDefinitions (endpoint?: string): Promise<Array<PolicyDefinition> | null> {
    const baseUrl = resolveEdcControlplaneMgmtEndpoint(endpoint)
    if (baseUrl === '') {
      return null
    }

    const path = `${baseUrl}${defaultPolicyDefinitionsRequestPath}`
    const context = 'querying EDC policy definitions'
    const disableMessage = false
    const headers = new Headers()
    headers.append('Content-Type', 'application/json')
    const [authKey, authValue] = await edcStore.getControlplaneAuthHeader
    headers.append(authKey, authValue)
    const bodyString: QuerySpec = {
      '@context': {
        edc: 'https://w3id.org/edc/v0.0.1/ns/',
      },
      '@type': 'QuerySpecDto',
      'offset': 0,
      'sortOrder': 'ASC',
      'sortField': 'id',
    }
    const body = JSON.stringify(bodyString)

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
   * Creates a new policy definition
   * Based on OpenAPI spec: POST /v3/policydefinitions
   * @param policyDefinition The policy definition to create
   * @param endpoint Optional custom endpoint. If not provided, uses configured controlplane endpoint
   * @returns IdResponse with the created policy definition id and createdAt timestamp, or null if creation fails
   */
  async function createPolicyDefinition (policyDefinition: PolicyDefinitionInput, endpoint?: string): Promise<IdResponse | null> {
    const baseUrl = resolveEdcControlplaneMgmtEndpoint(endpoint)
    if (baseUrl === '') {
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

  return {
    resolveEdcControlplaneEndpoint,
    resolveEdcControlplaneMgmtEndpoint,
    checkControlplaneHealth,
    checkControlplaneLiveness,
    checkControlplaneReadiness,
    checkControlplaneStartup,
    queryPolicyDefinitions,
    createPolicyDefinition,
    deletePolicyDefinition,
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

export interface PolicyDefinition {
  '@id'?: string
  '@type'?: string
  '@context'?: Record<string, unknown>
  'policy'?: Record<string, unknown>
  'createdAt'?: number
}

export interface PolicyDefinitionInput {
  '@context': Record<string, unknown>
  '@id': string
  '@type'?: string
  'policy': Record<string, unknown>
}

export interface IdResponse {
  '@id': string
  'createdAt': number
}
