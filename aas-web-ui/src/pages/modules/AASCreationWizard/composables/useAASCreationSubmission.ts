import { jsonization } from '@aas-core-works/aas-core3.1-typescript'
import { useAASRepositoryClient } from '@/composables/Client/AASRepositoryClient'
import { buildAssetAdministrationShell } from '../builders/buildAssetAdministrationShell'
import { useAASCreationStore } from '../stores/aasCreationForm'
import { useSMRepositoryClient } from './../../../../composables/Client/SMRepositoryClient'

interface AASCreationSubmissionSuccess {
  success: true
  aasId: string
  submodelIdToOpen: string
}

interface AASCreationSubmissionFailure {
  success: false
}

type AASCreationSubmissionResult
  = | AASCreationSubmissionSuccess
    | AASCreationSubmissionFailure

function getSubmodelId (submodelData: unknown, label: string): string | null {
  const id = (submodelData as { id?: unknown }).id

  if (typeof id !== 'string' || id.trim() === '') {
    console.error(`${label} is missing a valid id`)
    return null
  }

  return id
}

export function useAASCreationSubmission () {
  const { postAas } = useAASRepositoryClient()
  const { postSubmodel } = useSMRepositoryClient()
  const store = useAASCreationStore()

  async function postBuiltSubmodel (
    submodelData: unknown,
    label: string,
  ): Promise<boolean> {
    try {
      const submodelParseResult = jsonization.submodelFromJsonable(submodelData as any)

      if (submodelParseResult.error !== null) {
        console.error('Error parsing Submodel:', submodelParseResult.error)
        return false
      }
      const submodelInstance = submodelParseResult.mustValue()

      const submodelSuccess = await postSubmodel(submodelInstance)

      console.log('post was a success', submodelSuccess, label)

      if (!submodelSuccess) {
        console.log('post function failed')

        return false
      }
      return true
    } catch (error) {
      console.log('unexpected submodel submission error', error)
      window.alert(`There was an error creating submodel: ${String(error)}`)
      return false
    }
  }

  async function submitAll (): Promise<AASCreationSubmissionResult> {
    const assetData = store.assetData
    const digitalNameplate = store.digitalNameplateData
    const technicalData = store.technicalDataData
    const handoverDocumentation = store.handoverDocumentationData

    if (!digitalNameplate) {
      console.error('Digital Nameplate data is missing')
      return { success: false }
    }
    if (!technicalData) {
      console.error('Technical Data is missing')
      return { success: false }
    }
    if (!handoverDocumentation) {
      console.error('Handover Documentation is missing')
      return { success: false }
    }

    const digitalNameplateId = getSubmodelId(digitalNameplate, 'Digital Nameplate')
    const technicalDataId = getSubmodelId(technicalData, 'Technical Data')
    const handoverDocumentationId = getSubmodelId(handoverDocumentation, 'Handover Documentation')

    if (!digitalNameplateId || !technicalDataId || !handoverDocumentationId) {
      return { success: false }
    }

    // build digital nameplate
    const digitalNameplateSuccess = await postBuiltSubmodel(
      digitalNameplate,
      'Digital Nameplate',
    )
    if (!digitalNameplateSuccess) {
      console.log('digital nameplate creation failed')
      return { success: false }
    }
    // build technical data
    const technicalDataSuccess = await postBuiltSubmodel(
      technicalData,
      'Technical Data',
    )
    if (!technicalDataSuccess) {
      console.log('technical data creation failed')
      return { success: false }
    }

    // build handover documentation
    const handoverDocumentationSuccess = await postBuiltSubmodel(
      handoverDocumentation,
      'Handover Documentation Data',
    )
    if (!handoverDocumentationSuccess) {
      console.log('Handover Documentation creation failed')
      return { success: false }
    }
    // post the aas with submodels
    const builtAas = buildAssetAdministrationShell(assetData, digitalNameplate, technicalData, handoverDocumentation)

    try {
      const aasParseResult = jsonization.assetAdministrationShellFromJsonable(builtAas as any)
      if (aasParseResult.error !== null) {
        console.error('Error parsing AAS:', aasParseResult.error)
        return { success: false }
      }
      const aasInstance = aasParseResult.mustValue()

      const success = await postAas(aasInstance)

      if (!success) {
        return { success: false }
      }

      return {
        success: true,
        aasId: builtAas.id,
        submodelIdToOpen: handoverDocumentationId,
      }
    } catch (error) {
      window.alert(`There was an error creating aas: ${String(error)}`)
      return { success: false }
    }
  }
  return {
    submitAll,
  }
}
