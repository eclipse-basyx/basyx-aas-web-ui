import type { jsonization } from '@aas-core-works/aas-core3.1-typescript'
import { computed } from 'vue'
import { appendQueryParams, normalizeLimit, type PaginationPageOptions, type PaginationPageResult, parseNextCursor } from '@/composables/Client/PaginationUtils'
import { useRequestHandling } from '@/composables/RequestHandling'
import { useInfrastructureStore } from '@/store/InfrastructureStore'
import * as descriptorTypes from '@/types/Descriptors'
import { extractEndpointHref } from '@/utils/AAS/DescriptorUtils'
import { base64Encode } from '@/utils/EncodeDecodeUtils'
import { removeNullValues } from '@/utils/generalUtils'
import { stripLastCharacter } from '@/utils/StringUtils'

export type AasListPageOptions = PaginationPageOptions

export type AasListPageResult<T> = PaginationPageResult<T>

export function useAASRegistryClient () {
  // Stores
  const infrastructureStore = useInfrastructureStore()

  // Composables
  const { getRequest, postRequest, putRequest, deleteRequest } = useRequestHandling()

  const endpointPath = '/shell-descriptors'
  const compatibilityFetchLimit = 1000

  // Computed Properties
  const aasRegistryUrl = computed(() => infrastructureStore.getAASRegistryURL)

  function getEffectiveAasRegistryUrl (registryUrl?: string): string {
    const explicitRegistryUrl = registryUrl?.trim() ?? ''
    if (explicitRegistryUrl !== '') {
      return explicitRegistryUrl
    }

    const storeUrl = aasRegistryUrl.value.trim()
    if (storeUrl !== '') {
      return storeUrl
    }

    const selectedInfraUrl = infrastructureStore.getSelectedInfrastructure?.components?.AASRegistry?.url?.trim() ?? ''
    return selectedInfraUrl
  }

  /**
   * Fetches one page of AAS descriptors from registry.
   *
   * @async
   * @param {AasListPageOptions} [options] - Pagination options.
   * @returns {Promise<AasListPageResult<any>>} Paged descriptor list including continuation cursor.
   */
  async function fetchAasDescriptorListPage (options: AasListPageOptions = {}): Promise<AasListPageResult<any>> {
    const failResponse: AasListPageResult<any> = {
      items: [],
      hasMore: false,
    }

    let aasRegUrl = getEffectiveAasRegistryUrl()
    if (aasRegUrl === '') {
      return failResponse
    }
    if (aasRegUrl.endsWith('/')) {
      aasRegUrl = stripLastCharacter(aasRegUrl)
    }
    if (!aasRegUrl.endsWith(endpointPath)) {
      aasRegUrl += endpointPath
    }

    const queryParams = new URLSearchParams()
    const normalizedLimit = normalizeLimit(options.limit)
    if (normalizedLimit !== undefined) {
      queryParams.set('limit', String(normalizedLimit))
    }
    if (options.cursor && options.cursor.trim() !== '') {
      queryParams.set('cursor', options.cursor.trim())
    }

    const aasRegistryPath = appendQueryParams(aasRegUrl, queryParams)
    const aasRegistryContext = 'retrieving AAS Descriptors page'
    const disableMessage = false

    try {
      const aasRegistryResponse = await getRequest(aasRegistryPath, aasRegistryContext, disableMessage)
      const resultItems = Array.isArray(aasRegistryResponse?.data?.result)
        ? aasRegistryResponse.data.result
        : []
      const nextCursor = parseNextCursor(aasRegistryResponse?.data)

      return {
        items: resultItems,
        nextCursor,
        hasMore: nextCursor !== undefined,
        pagingMetadata: aasRegistryResponse?.data?.paging_metadata ?? aasRegistryResponse?.data?.pagingMetadata,
      }
    } catch (error) {
      console.warn(error)
      return failResponse
    }
  }

  /**
   * Fetches a list of all available Asset Administration Shell (AAS) Descriptors.
   *
   * @async
   * @returns {Promise<Array<any>>} A promise that resolves to an array of AAS Descriptors.
   * An empty array is returned if the request fails or no AAS Descriptors are found.
   */
  async function fetchAasDescriptorList (): Promise<Array<any>> {
    const failResponse = [] as Array<any>
    const descriptors: Array<any> = []
    const seenCursors = new Set<string>()
    let cursor: string | undefined

    while (true) {
      const page = await fetchAasDescriptorListPage({
        limit: compatibilityFetchLimit,
        cursor,
      })

      if (page.items.length > 0) {
        descriptors.push(...page.items)
      }

      if (!page.hasMore || !page.nextCursor || seenCursors.has(page.nextCursor)) {
        break
      }

      seenCursors.add(page.nextCursor)
      cursor = page.nextCursor
    }

    return descriptors.length > 0 ? descriptors : failResponse
  }

  /**
   * Fetches a Asset Administration Shell (AAS)  Descriptor by the provided AAS ID.
   *
   * @async
   * @param {string} aasId - The ID of the AAS Descriptor to fetch.
   * @returns {Promise<any>} A promise that resolves to an AAS Descriptor.
   */
  async function fetchAasDescriptorById (aasId: string, registryUrl?: string): Promise<any> {
    const failResponse = {} as any

    if (!aasId) {
      return failResponse
    }

    aasId = aasId.trim()

    if (aasId === '') {
      return failResponse
    }

    let aasRegUrl = getEffectiveAasRegistryUrl(registryUrl)
    if (aasRegUrl === '') {
      return failResponse
    }
    if (aasRegUrl.endsWith('/')) {
      aasRegUrl = stripLastCharacter(aasRegUrl)
    }
    if (!aasRegUrl.endsWith(endpointPath)) {
      aasRegUrl += endpointPath
    }

    const aasRegistryPath = aasRegUrl + '/' + base64Encode(aasId)
    const aasRegistryContext = 'retrieving AAS Descriptor'
    const disableMessage = false
    try {
      const aasRegistryResponse = await getRequest(aasRegistryPath, aasRegistryContext, disableMessage)
      if (
        aasRegistryResponse?.success
        && aasRegistryResponse?.data
        && Object.keys(aasRegistryResponse?.data).length > 0
      ) {
        return aasRegistryResponse.data
      }
    } catch (error) {
      console.warn(error)
      return failResponse
    }
    return failResponse
  }

  /**
   * Retrieves the Asset Administration Shell (AAS) endpoint URL by its ID.
   *
   * @async
   * @param {string} aasId - The ID of the AAS to retrieve the endpoint for.
   * @returns {Promise<string>} A promise that resolves to an AAS endpoint.
   */
  async function getAasEndpointById (aasId: string, registryUrl?: string): Promise<string> {
    const failResponse = ''

    if (!aasId) {
      return failResponse
    }

    aasId = aasId.trim()

    if (aasId === '') {
      return failResponse
    }

    const aasDescriptor = await fetchAasDescriptorById(aasId, registryUrl)
    const aasEndpoint = extractEndpointHref(aasDescriptor, 'AAS-3.0')

    return aasEndpoint || failResponse
  }

  /**
   * Checks if Asset Administration Shell (AAS) Descriptor with provided ID is available (in registry).
   *
   * @async
   * @param {string} aasId - The ID of the AAS to check.
   * @returns {Promise<boolean>} A promise that resolves to `true` if AAS with provided ID is available, otherwise `false`.
   */
  async function aasDescriptorIsAvailableById (aasId: string): Promise<boolean> {
    const failResponse = false

    if (!aasId) {
      return failResponse
    }

    aasId = aasId.trim()

    if (aasId === '') {
      return failResponse
    }

    const aasDescriptor = await fetchAasDescriptorById(aasId)

    if (aasDescriptor && Object.keys(aasDescriptor).length > 0) {
      return true
    }

    return failResponse
  }

  async function postAasDescriptor (aasDescriptor: descriptorTypes.AASDescriptor): Promise<boolean> {
    const failResponse = false

    let aasRegUrl = getEffectiveAasRegistryUrl()
    if (aasRegUrl === '') {
      return failResponse
    }
    if (aasRegUrl.endsWith('/')) {
      aasRegUrl = stripLastCharacter(aasRegUrl)
    }
    if (!aasRegUrl.endsWith(endpointPath)) {
      aasRegUrl += endpointPath
    }

    const context = 'updating AAS Descriptor'
    const disableMessage = false
    const path = aasRegUrl
    const headers = new Headers()
    headers.append('Content-Type', 'application/json')
    const body = JSON.stringify(aasDescriptor)

    const response = await postRequest(path, body, headers, context, disableMessage)

    return response.success
  }

  async function putAasDescriptor (aasDescriptor: descriptorTypes.AASDescriptor): Promise<boolean> {
    const failResponse = false

    let aasRegUrl = getEffectiveAasRegistryUrl()
    if (aasRegUrl === '') {
      return failResponse
    }
    if (aasRegUrl.endsWith('/')) {
      aasRegUrl = stripLastCharacter(aasRegUrl)
    }
    if (!aasRegUrl.endsWith(endpointPath)) {
      aasRegUrl += endpointPath
    }

    const context = 'updating AAS Descriptor'
    const disableMessage = false
    const path = aasRegUrl + '/' + base64Encode(aasDescriptor.id)
    const headers = new Headers()
    headers.append('Content-Type', 'application/json')
    const body = JSON.stringify(aasDescriptor)

    const response = await putRequest(path, body, headers, context, disableMessage)
    return response.success
  }

  async function deleteAasDescriptor (aasId: string): Promise<boolean> {
    const failResponse = false

    if (!aasId) {
      return failResponse
    }

    aasId = aasId.trim()

    if (aasId === '') {
      return failResponse
    }

    let aasRegUrl = getEffectiveAasRegistryUrl()
    if (aasRegUrl === '') {
      return failResponse
    }
    if (aasRegUrl.endsWith('/')) {
      aasRegUrl = stripLastCharacter(aasRegUrl)
    }
    if (!aasRegUrl.endsWith(endpointPath)) {
      aasRegUrl += endpointPath
    }

    const context = 'deleting AAS Descriptor'
    const disableMessage = false
    const path = aasRegUrl + '/' + base64Encode(aasId)
    const response = await deleteRequest(path, context, disableMessage)

    return response.success
  }

  function createDescriptorFromAAS (
    aas: jsonization.JsonObject,
    endpoints: Array<descriptorTypes.Endpoint>,
  ): descriptorTypes.AASDescriptor {
    const jsonAAS = JSON.stringify(aas)
    const parsedAAS = JSON.parse(jsonAAS)
    let descriptor = new descriptorTypes.AASDescriptor(
      endpoints,
      parsedAAS.id,
      parsedAAS.administration,
      parsedAAS.assetInformation?.assetKind,
      parsedAAS.assetInformation?.assetType,
      parsedAAS.description,
      parsedAAS.displayName,
      parsedAAS.extensions,
      parsedAAS.assetInformation?.globalAssetId,
      parsedAAS.idShort,
      parsedAAS.assetInformation?.specificAssetIds,
    )
    descriptor = removeNullValues(descriptor)
    return descriptor
  }

  return {
    endpointPath,
    getAasEndpointById,
    fetchAasDescriptorListPage,
    fetchAasDescriptorList,
    fetchAasDescriptorById,
    aasDescriptorIsAvailableById,
    putAasDescriptor,
    postAasDescriptor,
    deleteAasDescriptor,
    createDescriptorFromAAS,
  }
}
