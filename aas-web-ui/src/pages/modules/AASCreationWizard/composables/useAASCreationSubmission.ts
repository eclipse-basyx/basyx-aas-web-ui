import { jsonization } from '@aas-core-works/aas-core3.1-typescript'
import { useAASRepositoryClient } from '@/composables/Client/AASRepositoryClient'
import { buildAssetAdministrationShell } from '../builders/buildAssetAdministrationShell'
import { useAASCreationStore } from '../stores/aasCreationForm'
import { useSMRepositoryClient } from './../../../../composables/Client/SMRepositoryClient'

export function useAASCreationSubmission () {
  const { postAas } = useAASRepositoryClient()
  const { postSubmodel } = useSMRepositoryClient()
  const store = useAASCreationStore()

  async function submitAll (): Promise<boolean> {
    const assetData = store.assetData
    const digitalNameplate = store.digitalNameplateData

    if (!digitalNameplate) {
      console.error('Digital Nameplate data is missing')
      return false
    }
    try {
      const submodelParseResult = jsonization.submodelFromJsonable(digitalNameplate as any)

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
    } catch (error) {
      console.log('unexpected submodel submission error', error)
      window.alert('There was an error creating submodel: ${String(error)}')
      return false
    }

    const builtAas = buildAssetAdministrationShell(assetData, digitalNameplate)
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
