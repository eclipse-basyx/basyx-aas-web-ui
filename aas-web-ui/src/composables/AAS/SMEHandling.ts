import { useConceptDescriptionHandling } from '@/composables/AAS/ConceptDescriptionHandling'
import { useSMRepositoryClient } from '@/composables/Client/SMRepositoryClient'
import { useAASStore } from '@/store/AASDataStore'
import { formatDate } from '@/utils/DateUtils'
import { base64Decode } from '@/utils/EncodeDecodeUtils'

export function useSMEHandling () {
  // Composables
  const { fetchSm: fetchSmFromRepo, fetchSme: fetchSmeFromRepo } = useSMRepositoryClient()
  const { fetchCds } = useConceptDescriptionHandling()

  // Stores
  const aasStore = useAASStore()

  /**
   * Fetches a Submodel Element (SME) by the provided SME path.
   * and dispatches it to the AAS store.
   *
   * @async
   * @param {string} smePath - The path URL of the SME to fetch.
   * @param {boolean} withConceptDescriptions - Flag to specify if SME should be fetched with ConceptDescriptions (CDs)
   * @returns {Promise<any>} A promise that resolves to a SME.
   */
  async function fetchAndDispatchSme (smePath: string, withConceptDescriptions = false): Promise<any> {
    const failResponse = {}

    if (!smePath) {
      return failResponse
    }

    smePath = smePath.trim()

    if (smePath === '') {
      return failResponse
    }

    const smOrSme = await fetchSme(smePath, withConceptDescriptions)

    if (!smOrSme || Object.keys(smOrSme).length === 0) {
      return failResponse
    }

    aasStore.dispatchSelectedNode(smOrSme)

    return smOrSme
  }

  /**
   * Fetches a Submodel Element (SME) by the provided SME path.
   *
   * @async
   * @param {string} smePath - The path URL of the SME to fetch.
   * @param {boolean} withConceptDescriptions - Flag to specify if SME should be fetched with ConceptDescriptions (CDs)
   * @returns {Promise<any>} A promise that resolves to a SME.
   */
  async function fetchSme (smePath: string, withConceptDescriptions = false): Promise<any> {
    const failResponse = {}

    if (!smePath) {
      return failResponse
    }

    smePath = smePath.trim()

    if (smePath === '') {
      return failResponse
    }

    // No valid SME path means this is likely an SM endpoint.
    const smOrSme: any = smePath.includes('/submodel-elements/')
      ? await fetchSmeFromRepo(smePath)
      : await fetchSmFromRepo(smePath)

    // Note usage of fetchSm() (SMHandling) not possible.
    // Reciprocal import of SMHandling/SMEHandling leads to error "Maximum call stack size exceeded".

    if (!smOrSme || Object.keys(smOrSme).length === 0) {
      console.warn('Fetching SM/SME (' + smePath + ') failed!')
      return failResponse
    }

    smOrSme.timestamp = formatDate(new Date())
    smOrSme.path = smePath

    smOrSme.conceptDescriptions = withConceptDescriptions ? (await fetchCds(smOrSme)) : []

    return smOrSme
  }

  /**
   * Extracts the Submodel (SM) ID from a Submodel Element (SME) path
   *
   * @param {string} smePath - The SME path containing the encoded SM ID
   * @returns {string} The decoded SM ID, or empty string if extraction fails
   */
  function getSmIdOfSmePath (smePath: string): string {
    const failResponse = ''

    if (!smePath) {
      return failResponse
    }

    smePath = smePath.trim()

    if (smePath === '') {
      return failResponse
    }

    const index = smePath.indexOf('/submodel-elements/')

    const smPath = index === -1 ? smePath : smePath.slice(0, Math.max(0, index))

    const smId = smPath.slice(smPath.lastIndexOf('/') + 1)

    return base64Decode(smId)
  }

  return { fetchSme, fetchAndDispatchSme, getSmIdOfSmePath }
}
