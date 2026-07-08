import type { FormStateObject } from '../types/form'
import type {
  DigitalNameplateTemplate,
  HandoverDocumentationTemplate,
  TechnicalDataTemplate,
  TemplateElement } from '../types/template'
import { jsonization } from '@aas-core-works/aas-core3.1-typescript'
import { useAASRepositoryClient } from '@/composables/Client/AASRepositoryClient'
import { useInfrastructureStore } from '@/store/InfrastructureStore'
import { usesSubmodelSuperpath } from '@/utils/InfrastructureUtils'
import { buildAssetAdministrationShell } from '../builders/buildAssetAdministrationShell'
import { useAASCreationStore } from '../stores/aasCreationForm'
import digitalNameplateTemplate from '../templates/digital-nameplate.json'
import handoverDocumentationTemplate from '../templates/handover-documentation.json'
import technicalDataTemplate from '../templates/technical-data.json'
import {
  normalizeDigitalNameplateTemplate,
  normalizeHandoverDocumentationTemplate,
  normalizeTechnicalDataTemplate,
} from '../utils/normalizeTemplate'
import { collectSubmodelFileUploadTasks } from '../utils/submodelFileUploadUtils'
import { useSMRepositoryClient } from './../../../../composables/Client/SMRepositoryClient'

const digitalNameplateTemplateData = normalizeDigitalNameplateTemplate(
  digitalNameplateTemplate as DigitalNameplateTemplate,
)
const technicalDataTemplateData = normalizeTechnicalDataTemplate(
  technicalDataTemplate as TechnicalDataTemplate,
)

const handoverDocumentationTemplateData = normalizeHandoverDocumentationTemplate(
  handoverDocumentationTemplate as HandoverDocumentationTemplate,
)

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

function getSubmodelId (submodelData: unknown): string | null {
  const id = (submodelData as { id?: unknown }).id

  if (typeof id !== 'string' || id.trim() === '') {
    return null
  }

  return id
}

export function useAASCreationSubmission () {
  const { postAas, putThumbnail } = useAASRepositoryClient()
  const { postSubmodel, getSmEndpointById, putAttachmentFile } = useSMRepositoryClient()
  const infrastructureStore = useInfrastructureStore()
  const store = useAASCreationStore()

  async function postBuiltSubmodel (
    submodelData: unknown,
    aasId?: string,
  ): Promise<boolean> {
    try {
      const submodelParseResult = jsonization.submodelFromJsonable(submodelData as any)

      if (submodelParseResult.error !== null) {
        return false
      }
      const submodelInstance = submodelParseResult.mustValue()

      const submodelSuccess = await postSubmodel(submodelInstance, false, aasId)

      if (!submodelSuccess) {
        return false
      }
      return true
    } catch (error) {
      window.alert(`There was an error creating submodel: ${String(error)}`)
      return false
    }
  }

  async function postBuiltAas (
    builtAas: ReturnType<typeof buildAssetAdministrationShell>,
    thumbnailFile?: File | null,
  ): Promise<boolean> {
    try {
      const aasParseResult = jsonization.assetAdministrationShellFromJsonable(builtAas as any)
      if (aasParseResult.error !== null) {
        return false
      }
      const aasInstance = aasParseResult.mustValue()

      const success = await postAas(aasInstance)

      if (!success) {
        return false
      }
      if (thumbnailFile) {
        const thumbnailSuccess = await putThumbnail(thumbnailFile, builtAas.id)

        if (!thumbnailSuccess) {
          return false
        }
      }

      return true
    } catch (error) {
      window.alert(`There was an error creating aas: ${String(error)}`)
      return false
    }
  }

  async function submitAll (): Promise<AASCreationSubmissionResult> {
    const assetData = store.assetData
    const digitalNameplate = store.digitalNameplateData
    const technicalData = store.technicalDataData
    const handoverDocumentation = store.handoverDocumentationData

    if (!digitalNameplate) {
      return { success: false }
    }
    if (!technicalData) {
      return { success: false }
    }
    if (!handoverDocumentation) {
      return { success: false }
    }

    const digitalNameplateId = getSubmodelId(digitalNameplate)
    const technicalDataId = getSubmodelId(technicalData)
    const handoverDocumentationId = getSubmodelId(handoverDocumentation)

    if (!digitalNameplateId || !technicalDataId || !handoverDocumentationId) {
      return { success: false }
    }

    const builtAas = buildAssetAdministrationShell(assetData, digitalNameplate, technicalData, handoverDocumentation)
    const useSuperpath = usesSubmodelSuperpath(infrastructureStore.getSelectedInfrastructure)
    const aasIdForSubmodelSuperpath = useSuperpath ? builtAas.id : undefined

    if (useSuperpath) {
      const aasSuccess = await postBuiltAas(builtAas, assetData.thumbnailFile)
      if (!aasSuccess) {
        return { success: false }
      }
    }

    // build digital nameplate
    const digitalNameplateSuccess = await postBuiltSubmodel(
      digitalNameplate,
      aasIdForSubmodelSuperpath,
    )
    if (!digitalNameplateSuccess) {
      return { success: false }
    }
    const digitalNameplateFilesSuccess = await uploadFilesForSubmodel(
      digitalNameplateId,
      digitalNameplateTemplateData.submodelElements,
      store.digitalNameplateFormState,
      aasIdForSubmodelSuperpath,
    )

    if (!digitalNameplateFilesSuccess) {
      return { success: false }
    }
    // build technical data
    const technicalDataSuccess = await postBuiltSubmodel(
      technicalData,
      aasIdForSubmodelSuperpath,
    )
    if (!technicalDataSuccess) {
      return { success: false }
    }

    const technicalDataFilesSuccess = await uploadFilesForSubmodel(
      technicalDataId,
      technicalDataTemplateData.submodelElements,
      store.technicalDataFormState,
      aasIdForSubmodelSuperpath,
    )

    if (!technicalDataFilesSuccess) {
      return { success: false }
    }

    // build handover documentation
    const handoverDocumentationSuccess = await postBuiltSubmodel(
      handoverDocumentation,
      aasIdForSubmodelSuperpath,
    )
    if (!handoverDocumentationSuccess) {
      return { success: false }
    }
    const handoverDocumentationFilesSuccess = await uploadFilesForSubmodel(
      handoverDocumentationId,
      handoverDocumentationTemplateData.submodelElements,
      store.handoverDocumentationFormState,
      aasIdForSubmodelSuperpath,
    )

    if (!handoverDocumentationFilesSuccess) {
      return { success: false }
    }

    if (!useSuperpath) {
      const aasSuccess = await postBuiltAas(builtAas, assetData.thumbnailFile)
      if (!aasSuccess) {
        return { success: false }
      }
    }

    return {
      success: true,
      aasId: builtAas.id,
      submodelIdToOpen: handoverDocumentationId,
    }
  }

  async function uploadFilesForSubmodel (
    submodelId: string,
    elements: TemplateElement[],
    formState: FormStateObject | null,
    aasId?: string,
  ): Promise<boolean> {
    const fileTasks = collectSubmodelFileUploadTasks(
      submodelId,
      elements,
      formState,
      id => getSmEndpointById(id, aasId),
    )

    for (const task of fileTasks) {
      const uploadSuccess = await putAttachmentFile(task.file, task.path)

      if (!uploadSuccess) {
        return false
      }
    }
    return true
  }

  return {
    submitAll,
  }
}
