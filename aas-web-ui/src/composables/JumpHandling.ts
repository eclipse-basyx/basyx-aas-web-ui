import { useRouter } from 'vue-router'
import { useAASHandling } from '@/composables/AAS/AASHandling'
import { useReferenceComposable } from '@/composables/AAS/ReferenceComposable'
import { useSMHandling } from '@/composables/AAS/SMHandling'
import { useNavigationStore } from '@/store/NavigationStore'
import { extractEndpointHref } from '@/utils/AAS/DescriptorUtils'
import { extractId as extractIdFromReference } from '@/utils/AAS/ReferenceUtil'

export function useJumpHandling () {
  // Stores
  const navigationStore = useNavigationStore()

  // Vue Router
  const router = useRouter()

  // Composables
  const { fetchAasDescriptorList, fetchAasList, fetchAas, getAasEndpointById } = useAASHandling()
  const { fetchSm } = useSMHandling()
  const { referenceTypes, checkReference, getEndpoints } = useReferenceComposable()

  function showExternalReferenceWarning (): void {
    navigationStore.dispatchSnackbar({
      status: true,
      timeout: 10_000,
      color: 'warning',
      btnColor: 'buttonText',
      text: 'Reference check for ExternalReference is not implemented',
    })
  }

  function jumpIfSubmodelDescriptorMatches (aasDescriptors: any[], smId: string, targetPath: string): boolean {
    for (const aasDescriptor of aasDescriptors) {
      const smDescriptors = aasDescriptor.submodelDescriptors
      if (smDescriptors && Array.isArray(smDescriptors) && smDescriptors.length > 0) {
        for (const smDescriptor of smDescriptors) {
          if (smDescriptor && Object.keys(smDescriptor).length > 0 && smId === smDescriptor.id) {
            jumpToAas(extractEndpointHref(aasDescriptor, 'AAS-3.0'), targetPath)
            return true
          }
        }
      }
    }

    return false
  }

  async function jumpIfAasListMatches (aasList: any[], smId: string, targetPath: string): Promise<boolean> {
    for (const aas of aasList) {
      const aasEndpoint = await getAasEndpointById(aas.id)
      const submodelRefs = aas.submodels
      if (
        aasEndpoint.trim() !== ''
        && submodelRefs
        && Array.isArray(submodelRefs)
        && submodelRefs.length > 0
      ) {
        for (const submodelRef of submodelRefs) {
          if (smId === extractIdFromReference(submodelRef, 'Submodel')) {
            jumpToAas(aasEndpoint, targetPath)
            return true
          }
        }
      }
    }

    return false
  }

  async function jumpIfFetchedAasMatches (aasDescriptors: any[], smId: string, targetPath: string): Promise<boolean> {
    for (const aasDescriptor of aasDescriptors) {
      const aasEndpoint = extractEndpointHref(aasDescriptor, 'AAS-3.0')
      const aas = await fetchAas(aasEndpoint)
      const submodelRefs = aas.submodels
      if (
        aasEndpoint.trim() !== ''
        && submodelRefs
        && Array.isArray(submodelRefs)
        && submodelRefs.length > 0
      ) {
        for (const submodelRef of submodelRefs) {
          if (smId === extractIdFromReference(submodelRef, 'Submodel')) {
            jumpToAas(aasEndpoint, targetPath)
            return true
          }
        }
      }
    }

    return false
  }

  async function handleModelReference (reference: any): Promise<void> {
    const { aasEndpoint, smEndpoint, smePath } = await getEndpoints(reference)
    const targetPath = smePath.trim() === '' ? smEndpoint : smePath
    if (aasEndpoint.trim() !== '') {
      jumpToAas(aasEndpoint, targetPath)
      return
    }

    if (smEndpoint.trim() === '') {
      return
    }

    // Determine (first) AAS which includes the SM of the SM endpoint via SM ID
    // NOTE: Not needed anymore if aas-gui allow for single SMs to be shown independently (https://github.com/eclipse-basyx/basyx-aas-web-ui/issues/158)
    const sm = await fetchSm(smEndpoint)
    if (!sm || Object.keys(sm).length === 0) {
      return
    }

    const smId = sm.id
    const aasDescriptors = await fetchAasDescriptorList()
    const hasAasDescriptors = aasDescriptors && Array.isArray(aasDescriptors) && aasDescriptors.length > 0
    if (hasAasDescriptors && jumpIfSubmodelDescriptorMatches(aasDescriptors, smId, targetPath)) {
      return
    }

    const aasList = await fetchAasList()
    if (aasList && Array.isArray(aasList) && aasList.length > 0) {
      const jumped = await jumpIfAasListMatches(aasList, smId, targetPath)
      if (jumped) {
        return
      }
    }

    if (hasAasDescriptors) {
      await jumpIfFetchedAasMatches(aasDescriptors, smId, targetPath)
    }
  }

  async function jumpToReference (reference: any): Promise<void> {
    if (!(await checkReference(reference))) {
      return
    }

    if (!referenceTypes.includes(reference.type)) {
      return
    }

    if (reference.type === 'ModelReference') {
      await handleModelReference(reference)
      return
    }

    if (reference.type === 'ExternalReference') {
      showExternalReferenceWarning()
    }
  }

  /**
   * Jumps to the Asset Administration Shell (AAS) based on the provided AAS ID.
   *
   * If the AAS ID is valid, it initiates a jump to the AAS.
   * If the AAS ID is empty or invalid, the function exits without performing any action.
   *
   * @param {string} aasId - The ID of the AAS to jump to.
   * @returns {Promise<void>} A promise that resolves when the operation is complete.
   * The function does not return any value.
   */
  async function jumpToAasById (aasId: string): Promise<void> {
    if (!aasId) {
      return
    }

    aasId = aasId.trim()

    if (aasId === '') {
      return
    }

    const aasEndpoint = await getAasEndpointById(aasId)

    jumpToAas(aasEndpoint)
  }

  /**
   * Jumps to the Asset Administration Shell (AAS) based on the provided AAS descriptor.
   *
   * If the AAS descriptor is valid, it initiates a jump to the AAS.
   * If the AAS descriptor is empty or invalid, the function exits without performing any action.
   *
   * @param {any} descriptor - The descriptor of the AAS to jump to.
   * @returns {Promise<void>} A promise that resolves when the operation is complete.
   * The function does not return any value.
   */
  async function jumpToAasByAasDescriptor (aasDescriptor: any): Promise<void> {
    if (!aasDescriptor || Object.keys(aasDescriptor).length === 0) {
      return
    }

    const aasEndpoint = extractEndpointHref(aasDescriptor, 'AAS-3.0')

    jumpToAas(aasEndpoint)
  }

  /**
   * Jumps to the Asset Administration Shell (AAS) based on the provided AAS endpoint.
   *
   * If the AAS endpoint is valid, it initiates a jump to the AAS.
   * If the AAS endpoint is empty or invalid, the function exits without performing any action.
   *
   * @param {string} aasEndpoint - The descriptor of the AAS to jump to.
   * @returns {Promise<void>} A promise that resolves when the operation is complete.
   * The function does not return any value.
   */
  async function jumpToAas (aasEndpoint: string, smePath = ''): Promise<void> {
    if (!aasEndpoint) {
      return
    }

    aasEndpoint = aasEndpoint.trim()

    if (aasEndpoint === '') {
      return
    }

    if (navigationStore.getIsMobile) {
      if (smePath.trim() === '') {
        router.push({ name: 'AASList', query: { aas: aasEndpoint } })
      } else {
        router.push({ name: 'AASList', query: { aas: aasEndpoint, path: smePath } })
      }
    } else {
      if (smePath.trim() === '') {
        router.push({ query: { aas: aasEndpoint } })
      } else {
        router.push({ query: { aas: aasEndpoint, path: smePath } })
      }
    }
  }

  return { jumpToReference, jumpToAas, jumpToAasById, jumpToAasByAasDescriptor }
}
