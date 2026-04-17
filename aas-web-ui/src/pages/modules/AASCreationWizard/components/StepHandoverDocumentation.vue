<template>
  <div> HandoverDocumentation Form</div>
  <div class="d-flex justify-space-between">
    <v-btn color="primary" @click="props.prev">Back</v-btn>
    <v-btn color="primary" @click="submitAll">Submit</v-btn>
  </div>
</template>
<script lang="ts" setup>
  import { jsonization } from '@aas-core-works/aas-core3.1-typescript'
  import { useAASRepositoryClient } from '@/composables/Client/AASRepositoryClient'
  import { buildAssetAdministrationShell } from '../builders/buildAssetAdministrationShell'
  import { useAASCreationStore } from '../stores/aasCreationForm'
  import { useSMRepositoryClient } from './../../../../composables/Client/SMRepositoryClient'

  const props = defineProps<{
    next: () => void
    prev: () => void
    finish: () => void
    isActiveComponent: boolean
  }>()

  const store = useAASCreationStore()
  const { postAas } = useAASRepositoryClient()
  const { postSubmodel } = useSMRepositoryClient()

  async function submitAll (): Promise<void> {
    if (!props.isActiveComponent) {
      return
    }

    const assetData = store.assetData
    const digitalNameplate = store.digitalNameplateData

    if (!digitalNameplate) {
      console.error('Digital Nameplate data is missing')
      return
    }
    const submodelParseResult = jsonization.submodelFromJsonable(digitalNameplate as any)

    if (submodelParseResult.error !== null) {
      console.error('Error parsing Submodel:', submodelParseResult.error)
      return
    }
    const submodelInstance = submodelParseResult.mustValue()

    const submodelSuccess = await postSubmodel(submodelInstance)

    console.log('post was a success', submodelSuccess)

    if (!submodelSuccess) {
      console.log('post function failed')
    }

    const builtAas = buildAssetAdministrationShell(assetData, digitalNameplate)
    console.log('builtAas', builtAas)

    const aasParseResult = jsonization.assetAdministrationShellFromJsonable(builtAas as any)
    if (aasParseResult.error !== null) {
      console.error('Error parsing AAS:', aasParseResult.error)
      return
    }
    const aasInstance = aasParseResult.mustValue()

    const success = await postAas(aasInstance)

    console.log('aas post was a success', success)
    if (!success) {
      console.log('AAS post failed')
      return
    }

    console.log('AAS post succeeded')

    window.alert('Submission was successful.')
    props.finish()
  }
</script>
