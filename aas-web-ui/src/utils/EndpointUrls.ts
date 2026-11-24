import { base64Encode } from '@/utils/EncodeDecodeUtils'
import { normalizeBaseUrl } from '@/utils/url'

export const AAS_DISCOVERY_ENDPOINT_PATH = '/lookup/shells'
export const AAS_REGISTRY_ENDPOINT_PATH = '/shell-descriptors'
export const SUBMODEL_REGISTRY_ENDPOINT_PATH = '/submodel-descriptors'
export const AAS_REPOSITORY_ENDPOINT_PATH = '/shells'
export const SUBMODEL_REPOSITORY_ENDPOINT_PATH = '/submodels'
export const CONCEPT_DESCRIPTION_REPOSITORY_ENDPOINT_PATH = '/concept-descriptions'

/**
 * Returns the endpoint of a BaSyx component with the given base URL, which may end in the endpoint path already.
 *
 * @param {string} baseUrl - URL of the component, e.g. 'https://repo.test' or 'https://repo.test/shells/'.
 * @param {string} endpointPath - Path of the endpoint, e.g. AAS_REPOSITORY_ENDPOINT_PATH.
 * @returns {string} The endpoint, e.g. 'https://repo.test/shells', or an empty string without a base URL.
 */
export function endpointUrl (baseUrl: string, endpointPath: string): string {
  return normalizeBaseUrl(baseUrl ?? '', endpointPath) ?? ''
}

/**
 * Returns the URL of a resource with the given ID at the endpoint of a BaSyx component.
 *
 * @param {string} baseUrl - URL of the component, e.g. 'https://repo.test' or 'https://repo.test/shells/'.
 * @param {string} endpointPath - Path of the endpoint, e.g. AAS_REPOSITORY_ENDPOINT_PATH.
 * @param {string} id - ID of the resource, which is trimmed and Base64 encoded.
 * @returns {string} The URL of the resource, or an empty string without a base URL or an ID.
 */
export function resourceUrl (baseUrl: string, endpointPath: string, id: string): string {
  const encodedId = base64Encode(id ?? '')
  const endpoint = endpointUrl(baseUrl, endpointPath)
  return encodedId !== '' && endpoint !== '' ? `${endpoint}/${encodedId}` : ''
}
