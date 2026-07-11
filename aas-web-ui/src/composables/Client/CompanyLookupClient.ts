import { computed } from 'vue'
import { useRequestHandling } from '@/composables/RequestHandling'
import { useInfrastructureStore } from '@/store/InfrastructureStore'
import { base64Encode } from '@/utils/EncodeDecodeUtils'
import { stripLastCharacter } from '@/utils/StringUtils'

export function useCompanyLookupClient () {
  // Stores
  const infrastructureStore = useInfrastructureStore()

  // Composables
  const { getRequest } = useRequestHandling()

  const endpointPath = '/companies'

  // Computed Properties
  const companyLookupUrl = computed(() => infrastructureStore.getCompanyLookupURL)

  function getEffectiveCompanyLookupUrl (companyLookupUrlOverride?: string): string {
    const explicitCompanyLookupUrl = companyLookupUrlOverride?.trim() ?? ''
    if (explicitCompanyLookupUrl !== '') {
      return explicitCompanyLookupUrl
    }

    const storeUrl = companyLookupUrl.value.trim()
    if (storeUrl !== '') {
      return storeUrl
    }

    const selectedInfraUrl = infrastructureStore.getSelectedInfrastructure?.components?.CompanyLookup?.url?.trim() ?? ''
    return selectedInfraUrl
  }

  /**
   * Fetches a Company Descriptor by the provided company identifier.
   *
   * @async
   * @param {string} companyId - The ID of the Company Descriptor to fetch.
   * @returns {Promise<any>} A promise that resolves to a Company Descriptor.
   */
  async function fetchCompanyDescriptorById (companyId: string, companyLookupUrlOverride?: string): Promise<any> {
    const failResponse = {} as any

    if (!companyId) {
      return failResponse
    }

    companyId = companyId.trim()

    if (companyId === '') {
      return failResponse
    }

    let companyLookupUrlValue = getEffectiveCompanyLookupUrl(companyLookupUrlOverride)
    if (companyLookupUrlValue === '') {
      return failResponse
    }
    if (companyLookupUrlValue.endsWith('/')) {
      companyLookupUrlValue = stripLastCharacter(companyLookupUrlValue)
    }
    if (!companyLookupUrlValue.endsWith(endpointPath)) {
      companyLookupUrlValue += endpointPath
    }

    const companyLookupPath = companyLookupUrlValue + '/' + base64Encode(companyId)
    const companyLookupContext = 'retrieving Company Descriptor'
    const disableMessage = false
    try {
      const companyLookupResponse = await getRequest(companyLookupPath, companyLookupContext, disableMessage)
      if (
        companyLookupResponse?.success
        && companyLookupResponse?.data
        && Object.keys(companyLookupResponse?.data).length > 0
      ) {
        return companyLookupResponse.data
      }
    } catch (error) {
      console.warn(error)
      return failResponse
    }
    return failResponse
  }

  /**
   * Checks if Company Descriptor with provided company identifier is available.
   *
   * @async
   * @param {string} companyId - The ID of the Company Descriptor to check.
   * @returns {Promise<boolean>} A promise that resolves to `true` if a Company Descriptor with provided ID is available, otherwise `false`.
   */
  async function companyDescriptorIsAvailableById (companyId: string): Promise<boolean> {
    const failResponse = false

    if (!companyId) {
      return failResponse
    }

    companyId = companyId.trim()

    if (companyId === '') {
      return failResponse
    }

    const companyDescriptor = await fetchCompanyDescriptorById(companyId)

    if (companyDescriptor && Object.keys(companyDescriptor).length > 0) {
      return true
    }

    return failResponse
  }

  return {
    endpointPath,
    getEffectiveCompanyLookupUrl,
    fetchCompanyDescriptorById,
    companyDescriptorIsAvailableById,
  }
}
