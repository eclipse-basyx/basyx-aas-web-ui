import { base64Encode } from '@/utils/EncodeDecodeUtils'
import { stripLastCharacter } from '@/utils/StringUtils'

export const AAS_REPOSITORY_ENDPOINT_PATH = '/shells'

/**
 * Returns the '/shells' endpoint of the AAS Repository with the given URL, which may end in '/shells' already.
 *
 * @param {string} aasRepoUrl - URL of the AAS Repository.
 * @returns {string} The '/shells' endpoint, or an empty string without a URL.
 */
export function shellsUrl (aasRepoUrl: string): string {
  let url = aasRepoUrl.trim()
  if (url === '') {
    return ''
  }
  if (url.endsWith('/')) {
    url = stripLastCharacter(url)
  }
  return url.endsWith(AAS_REPOSITORY_ENDPOINT_PATH) ? url : url + AAS_REPOSITORY_ENDPOINT_PATH
}

/**
 * Returns the endpoint of an AAS in the AAS Repository with the given URL.
 *
 * @param {string} aasRepoUrl - URL of the AAS Repository.
 * @param {string} aasId - ID of the AAS.
 * @returns {string} The endpoint of the AAS, or an empty string without a URL or an ID.
 */
export function aasEndpointUrl (aasRepoUrl: string, aasId: string): string {
  const id = aasId?.trim() ?? ''
  const shellsEndpoint = shellsUrl(aasRepoUrl)
  return id !== '' && shellsEndpoint !== '' ? `${shellsEndpoint}/${base64Encode(id)}` : ''
}
