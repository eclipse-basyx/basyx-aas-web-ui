import type { CompanyLookupQueryParameters, CompanyLookupResponse, PagedCompanyDescriptors } from './types/api'
import type { CompanyDescriptor } from './types/company'
import { computed } from 'vue'
import { appendQueryParams } from '@/composables/Client/PaginationUtils'
import { useRequestHandling } from '@/composables/RequestHandling'
import { useInfrastructureStore } from '@/store/InfrastructureStore'
import { base64Encode } from '@/utils/EncodeDecodeUtils'
import { hasContent } from '@/utils/StringUtils'
import { COMPANY_LOOKUP_ENDPOINT_PATHS, CONTEXT } from './constants/api'
import { buildQueryParams } from './utils/params'
import { normalizeBaseUrl } from './utils/url'

export function useCompanyLookupClient (disableMessage = false) {
  const {
    getRequest,
    postRequest,
    putRequest,
    deleteRequest,
  } = useRequestHandling()

  const infrastructureStore = useInfrastructureStore()
  const companyLookupApiUrl = computed(() => infrastructureStore.getCompanyLookupURL)

  const apiUrl = computed(() => {
    return normalizeBaseUrl(companyLookupApiUrl.value, COMPANY_LOOKUP_ENDPOINT_PATHS.COMPANIES)
  })

  async function withApiUrl<T> (
    fn: (url: string) => Promise<CompanyLookupResponse<T>>,
  ): Promise<CompanyLookupResponse<T>> {
    const url = apiUrl.value
    if (!hasContent(url)) {
      return { success: false }
    }
    try {
      const response = await fn(url)

      return {
        success: response.success,
        data: response.data,
        status: response.status,
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('[CompanyLookupClient]', error)
      }
      return { success: false }
    }
  }

  /**
   * Returns all Company Descriptors
   */
  async function getAllCompanyDescriptors (
    params?: CompanyLookupQueryParameters,
  ): Promise<CompanyLookupResponse<PagedCompanyDescriptors>> {
    return withApiUrl<PagedCompanyDescriptors>(url => {
      const path = appendQueryParams(url, buildQueryParams(params))

      return getRequest(path, CONTEXT.GET_ALL, disableMessage)
    })
  }

  /**
   * Returns a specific Company Descriptor
   */
  async function getCompanyDescriptorById (companyDomainIdentifier: string): Promise<CompanyLookupResponse<CompanyDescriptor>> {
    return withApiUrl<CompanyDescriptor>(url => {
      const path = `${url}/${base64Encode(companyDomainIdentifier)}`

      return getRequest(path, CONTEXT.GET_COMPANY, disableMessage)
    })
  }

  /**
   * Creates a new Company Descriptor
   */
  async function postCompanyDescriptor (companyDescriptor: CompanyDescriptor): Promise<CompanyLookupResponse<CompanyDescriptor>> {
    return withApiUrl<CompanyDescriptor>(url => {
      const headers = new Headers()
      headers.append('Content-Type', 'application/json')
      const body = JSON.stringify(companyDescriptor)

      return postRequest(url, body, headers, CONTEXT.POST, disableMessage)
    })
  }

  /**
   * Updates an existing Company Descriptor
   */
  async function putCompanyDescriptorById (companyDomainIdentifier: string, companyDescriptor: CompanyDescriptor): Promise<CompanyLookupResponse<CompanyDescriptor>> {
    return withApiUrl<CompanyDescriptor>(url => {
      const path = `${url}/${base64Encode(companyDomainIdentifier)}`
      const headers = new Headers()
      headers.append('Content-Type', 'application/json')
      const body = JSON.stringify(companyDescriptor)

      return putRequest(path, body, headers, CONTEXT.PUT, disableMessage)
    })
  }

  /**
   * Deletes a Company Descriptor
   */
  async function deleteCompanyDescriptorById (companyDomainIdentifier: string): Promise<CompanyLookupResponse<void>> {
    return withApiUrl<void>(url => {
      const path = `${url}/${base64Encode(companyDomainIdentifier)}`

      return deleteRequest(path, new Headers(), CONTEXT.DELETE, disableMessage)
    })
  }

  return {
    getAllCompanyDescriptors,
    postCompanyDescriptor,
    getCompanyDescriptorById,
    putCompanyDescriptorById,
    deleteCompanyDescriptorById,
  }
}
