import { useConceptDescriptionHandling } from '@/composables/AAS/ConceptDescriptionHandling'
import { useSMRepositoryClient } from '@/composables/Client/SMRepositoryClient'
import { useAASStore } from '@/store/AASDataStore'
import {
  decorateResolvedOperationNode,
  parseOperationLocator,
  resolveOperationLocator,
} from '@/utils/AAS/OperationTreeUtils'
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
  async function fetchAndDispatchSme (
    smePath: string,
    withConceptDescriptions = false,
    operationFragment?: string,
  ): Promise<any> {
    const failResponse = {}

    if (!smePath) {
      return failResponse
    }

    smePath = smePath.trim()

    if (smePath === '') {
      return failResponse
    }

    const smOrSme = await fetchSme(smePath, withConceptDescriptions, operationFragment, true)

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
   * @param {string} operationFragment - Optional fragment pointing to a node inside an Operation SME
   * @param {boolean} withBlobValue - Flag to specify if the value of a requested Blob SME should be included
   * @returns {Promise<any>} A promise that resolves to a SME.
   */
  async function fetchSme (
    smePath: string,
    withConceptDescriptions = false,
    operationFragment?: string,
    withBlobValue = false,
  ): Promise<any> {
    const failResponse = {}

    if (!smePath) {
      return failResponse
    }

    smePath = smePath.trim()

    if (smePath === '') {
      return failResponse
    }

    // No valid SME path means this is likely an SM endpoint.
    let smOrSme: any = smePath.includes('/submodel-elements/')
      ? await fetchSmeFromRepo(smePath)
      : await fetchSmFromRepo(smePath)

    // Note usage of fetchSm() (SMHandling) not possible.
    // Reciprocal import of SMHandling/SMEHandling leads to error "Maximum call stack size exceeded".

    if (!smOrSme || Object.keys(smOrSme).length === 0) {
      console.warn('Fetching SM/SME (' + smePath + ') failed!')
      return failResponse
    }

    // Repositories omit the value of Blobs by default. Only fetch it when the Blob itself is requested,
    // because the extent would also apply to all Blobs nested in a SMC/SML.
    if (withBlobValue && smOrSme.modelType === 'Blob' && smOrSme.value === undefined) {
      const blobWithValue = await fetchSmeFromRepo(`${smePath}?extent=withBlobValue`)
      if (blobWithValue && Object.keys(blobWithValue).length > 0) {
        smOrSme = blobWithValue
      }
    }

    if (operationFragment !== undefined && operationFragment !== '') {
      const locator = parseOperationLocator(operationFragment)
      const resolved = locator ? resolveOperationLocator(smOrSme, locator) : null
      if (!locator || !resolved) {
        console.warn(`Resolving Operation fragment '${operationFragment}' failed!`)
        return failResponse
      }
      smOrSme = decorateResolvedOperationNode(resolved, smePath, locator)
    } else {
      smOrSme.path = smePath
      smOrSme.selectionKey = smePath
      smOrSme.persistence = { kind: 'repository', repositoryPath: smePath }
    }

    smOrSme.timestamp = formatDate(new Date())

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
