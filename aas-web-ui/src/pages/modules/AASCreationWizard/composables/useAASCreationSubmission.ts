import { jsonization } from '@aas-core-works/aas-core3.1-typescript'
import { useAASRepositoryClient } from '@/composables/Client/AASRepositoryClient'
import { buildAssetAdministrationShell } from '../builders/buildAssetAdministrationShell'
import { useAASCreationStore } from '../stores/aasCreationForm'
import { useSMRepositoryClient } from './../../../../composables/Client/SMRepositoryClient'

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

      console.log('post was a success', submodelSuccess)

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

  async function submitAll (): Promise<boolean> {
    const assetData = store.assetData
    const digitalNameplate = store.digitalNameplateData
    const technicalData = store.technicalDataData

    if (!digitalNameplate) {
      console.error('Digital Nameplate data is missing')
      return false
    }
    if (!technicalData) {
      console.error('Technical Data is missing')
      return false
    }
    const digitalNameplateSuccess = await postBuiltSubmodel(
      digitalNameplate,
      'Digital Nameplate',
    )
    if (!digitalNameplateSuccess) {
      return false
    }

    const technicalDataSuccess = await postBuiltSubmodel(
      technicalData,
      'Technical Data',
    )
    if (!technicalDataSuccess) {
      return false
    }
    // post the aas with submodels
    const builtAas = buildAssetAdministrationShell(assetData, digitalNameplate, technicalData)
    console.log('builtAas', builtAas)

    try {
      const aasParseResult = jsonization.assetAdministrationShellFromJsonable(builtAas as any)
      if (aasParseResult.error !== null) {
        console.error('Error parsing AAS:', aasParseResult.error)
        return false
      }
      const aasInstance = aasParseResult.mustValue()

      const success = await postAas(aasInstance)

      console.log('aas post was a success', success)
      if (!success) {
        console.log('AAS post failed')
        return false
      }

      console.log('AAS post succeeded')
      return true
    } catch (error) {
      console.log('unexpected aas submission error', error)
      window.alert('There was an error creating aas: ${String(error)}')
      return false
    }
  }
  return {
    submitAll,
  }
}
