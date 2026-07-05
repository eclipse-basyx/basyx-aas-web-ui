<template>
  <v-layout :style="{ height: fullHeight }">
    <v-main class="py-0">
      <v-container
        class="ma-0 pa-0"
        fluid
        style="overflow-y: auto"
        :style="{ height: fullHeight }"
      >

        <div
          class="d-flex"
          style="overflow-y: auto"
          :style="{ height: fullHeight }"
        >
          <div
            class="overflow-y-auto"
            :style="{ flex: '1 1 50%', 'min-width': '0', height: fullHeight }"
          >
            <div class="d-flex justify-space-between align-center mt-4 mx-4 mb-2">
              <v-btn-toggle
                v-model="selectedAasDescriptorView"
                density="compact"
                mandatory
                rounded="lg"
                variant="outlined"
              >
                <v-btn value="tree">
                  <v-icon start>mdi-file-tree-outline</v-icon>
                  Tree
                </v-btn>

                <v-btn value="json">
                  <v-icon start>mdi-code-json</v-icon>
                  JSON
                </v-btn>
              </v-btn-toggle>

              <v-list-item-title class="text-body-large d-flex align-center">

                <v-spacer />

                <v-chip
                  v-if="edcStatus"
                  class="mr-2"
                  :color="
                    edcStatus.startsWith('Error')
                      ? 'error'
                      : edcStatus.includes('successfully')
                        ? 'success'
                        : 'primary'
                  "
                  density="compact"
                  label
                  variant="tonal"
                >
                  <v-progress-circular
                    v-if="dataTranserInProgress"
                    class="mr-2"
                    indeterminate
                    size="16"
                    width="2"
                  />
                  {{ edcStatus }}
                </v-chip>

                <v-chip
                  v-if="aasFetchStatus"
                  class="mr-2"
                  :color="
                    aasFetchStatus.startsWith('Error')
                      ? 'error'
                      : aasFetchStatus.includes('successfully') || aasFetchStatus.includes('completed')
                        ? 'success'
                        : 'primary'
                  "
                  density="compact"
                  label
                  variant="tonal"
                >
                  {{ aasFetchStatus }}
                </v-chip>

                <v-spacer />

                <v-icon
                  class="mr-2"
                  color="primary"
                  icon="custom:aasIcon"
                  size="small"
                />

                <span class="mr-2">
                  Asset Administration Shell Descriptor
                </span>

                <v-btn
                  class="text-buttonText"
                  :color="dataTranserInProgress ? 'error' : 'primary'"
                  :disabled="dataTranserInProgress || edcAssetIdOfAas == ''"
                  :prepend-icon="dataTranserInProgress ? 'mdi-close' : 'mdi-download'"
                  rounded="lg"
                  :text="dataTranserInProgress ? 'Cancel Fetch' : 'Fetch AAS'"
                  variant="flat"
                  @click="dataTranserInProgress ? cancelFetchAas() : fetchAas()"
                />
              </v-list-item-title>
            </div>

            <!-- Asset JSON view -->
            <pre
              v-if="selectedAasDescriptorView === 'json'"
              class="json-content mt-0 mb-4 mx-4 bg-surface rounded border"
              style="min-height: 63px"
              :style="{ 'height': heightAssetJson }"
            >
              <code class="mx-5" v-html="aasDescriptorJsonFormatted" />
            </pre>

            <!-- Asset Tree view -->
            <div
              v-else
              class="rounded border overflow-y-auto mt-0 mb-4 mx-4 pa-4"
              style="min-height: 63px; background-color: #f5f5f5"
              :style="{ 'height': heightAssetJson }"
            >
              <JsonTreeView :data="aasDescriptorJsonParsed" />
            </div>
          </div>

          <v-divider vertical />

          <div
            class="overflow-y-auto"
            :style="{ flex: '1 1 50%', 'min-width': '0', height: fullHeight }"
          >
            <div class="d-flex justify-space-between align-center mt-4 mx-4 mb-2">
              <v-btn-toggle
                v-model="selectedAasView"
                density="compact"
                mandatory
                rounded="lg"
                variant="outlined"
              >
                <v-btn value="tree">
                  <v-icon start>mdi-file-tree-outline</v-icon>
                  Tree
                </v-btn>

                <v-btn value="json">
                  <v-icon start>mdi-code-json</v-icon>
                  JSON
                </v-btn>
              </v-btn-toggle>

              <v-list-item-title class="text-body-large pr-2 d-flex align-center">
                <template v-if="isValidAasEnvironment">
                  <v-btn
                    class="text-buttonText mr-2"
                    color="primary"
                    prepend-icon="mdi-import"
                    rounded="lg"
                    text="Import AAS data to"
                    variant="flat"
                    @click="importAas()"
                  />

                  <div>
                    <v-select
                      v-model="selectedDestinationInfrastructureId"
                      density="compact"
                      hide-details
                      item-title="name"
                      item-value="id"
                      :items="destinationInfrastructureItems"
                      placeholder="Please select..."
                      variant="outlined"
                    />
                  </div>
                </template>

                <template v-else>
                  <v-icon
                    class="mr-2"
                    color="primary"
                    icon="custom:aasIcon"
                    size="small"
                  />

                  <span class="mr-2">
                    Asset Administration Shell
                  </span>
                </template>
              </v-list-item-title>
            </div>

            <!-- Asset JSON view -->
            <pre
              v-if="selectedAasView === 'json'"
              class="json-content mt-0 mb-4 mx-4 bg-surface rounded border"
              style="min-height: 63px"
              :style="{ 'height': heightAssetJson }"
            >
              <code class="mx-5" v-html="aasJsonFormatted" />
            </pre>

            <!-- Asset Tree view -->
            <div
              v-else
              class="rounded border overflow-y-auto mt-0 mb-4 mx-4 pa-4"
              style="min-height: 63px; background-color: #f5f5f5"
              :style="{ 'height': heightAssetJson }"
            >
              <JsonTreeView :data="aasJsonParsed" />
            </div>

          </div>
        </div>
      </v-container>
    </v-main>
  </v-layout>
</template>

<script lang="ts" setup>
  import type { AASDescriptor } from '@/types/Descriptors'
  import { types as aasTypes, jsonization } from '@aas-core-works/aas-core3.1-typescript'
  import { BaSyxEnvironment } from 'basyx-typescript-sdk'
  import * as Prism from 'prismjs'
  import { ref } from 'vue'
  import { useAASRepositoryClient } from '@/composables/Client/AASRepositoryClient'
  import { useSMRepositoryClient } from '@/composables/Client/SMRepositoryClient'
  import { useEdcDataTransfer } from '@/pages/modules/EclipseDataspaceConnector/composables/useEdcDataTransfer'
  import { useInfrastructureStore } from '@/store/InfrastructureStore'
  import { useNavigationStore } from '@/store/NavigationStore'
  import { base64Encode } from '@/utils/EncodeDecodeUtils'
  import { formatJSON } from '@/utils/JsonUtils'
  import { getPrismJsonLanguage } from '@/utils/prismJsonLanguage'
  import 'prismjs/themes/prism.css'

  // Props
  const props = defineProps<{
    selectedBusinessPartner: any
    selectedCatalogDataset: any
    discoveringId: boolean
    discoveryId: string
    fullHeight: string
  }>()

  // Emits
  const emit = defineEmits<{
    'update:discovering-id': [value: boolean]
    'update:edc-status': [value: string]
  }>()

  // Stores
  const navigationStore = useNavigationStore()
  const infrastructureStore = useInfrastructureStore()

  const aasDescriptorJson = ref<string>('')
  const aasDescriptorJsonFormatted = ref<string>('')
  const aasDescriptorJsonParsed = ref<unknown>({})
  const aasJson = ref<string>('')
  const aasJsonFormatted = ref<string>('')
  const aasJsonParsed = ref<unknown>({})

  const selectedAasDescriptorView = ref<'json' | 'tree'>('json')
  const selectedAasView = ref<'json' | 'tree'>('json')

  const heightAssetJson = ref(`calc(${props.fullHeight} - 60px - 16px)`)

  const edcAssetIdOfAas = ref('')
  const aas = ref({})
  const edcAssetIdsOfAasSms = ref([] as Array<string>) as Ref<Array<string>>
  const sms = ref([] as Array<any>) as Ref<Array<any>>

  const edcStatus = ref('')
  const aasFetchStatus = ref('')
  const dataTranserInProgress = ref(false)
  const cancelled = ref(false)
  const cancelledFetchAas = ref(false)

  const aasEnvironment = ref<BaSyxEnvironment | null>(null)

  const selectedDestinationInfrastructureId = ref<string | null>(infrastructureStore.getSelectedInfrastructureId)
  const importingInProgress = ref<boolean>(false)

  // Composables
  const { resolveEdcEndpointByCatalogDataset, resolveEdcEndpointByAssetId } = useEdcDataTransfer()
  const { postAas } = useAASRepositoryClient()
  const { postSubmodel } = useSMRepositoryClient()

  // Computed
  const isValidAasEnvironment = computed(() => {
    const environment = aasEnvironment.value
    return (
      environment !== null
      && Array.isArray(environment.assetAdministrationShells)
      && environment.assetAdministrationShells.length > 0
    )
  })

  const infrastructures = computed(() => infrastructureStore.getInfrastructures)
  const destinationInfrastructureItems = computed(() =>
    infrastructures.value.map(infra => ({
      id: infra.id,
      name: infra.name + (infra.isDefault ? ' (Default)' : ''),
    })),
  )
  const destinationInfrastructure = computed(() => {
    if (!selectedDestinationInfrastructureId.value) return null
    return (
      infrastructureStore.getInfrastructures.find(
        infra => infra.id === selectedDestinationInfrastructureId.value,
      ) || null
    )
  })

  async function discoverId (): Promise<void> {
    if (!props.selectedBusinessPartner || !props.selectedCatalogDataset)
      return

    const { endpoint: edcEndpoint, headers } = await resolveEdcEndpointByCatalogDataset(
      props.selectedCatalogDataset,
      props.selectedBusinessPartner,
      {
        cancelled,
        setInProgress: value => emit('update:discovering-id', value),
        setStatus: msg => emit('update:edc-status', msg),
      },
    )

    if (!edcEndpoint) return

    try {
      // First: try to discover AasId
      // Second: try to discovery AAS descriptor
      // Discovery of AAS descriptor can only be done via GET
      // Both discovery request uses the same EDC DataAddress and therefore must be done with the same request method (GET)
      // Therefore, dicovery of AasId has to be done via deprecated AAS Discovery endpoint /lookup/shells (GET) instead of /lookup/shellsByAssetLink (POST)
      const aasId = await discoverAasId_deprecated(props.discoveryId, edcEndpoint, headers)
      const aasDescriptor = await discoverAasDescriptor((aasId === '' ? props.discoveryId : aasId), edcEndpoint, headers)

      if (aasDescriptor) {
        aasDescriptorJson.value = JSON.stringify(aasDescriptor)
        aasDescriptorJsonParsed.value = aasDescriptor

        const formatted = formatJSON(aasDescriptorJson.value)
        aasDescriptorJsonFormatted.value
          = Prism && Prism.highlight
            ? Prism.highlight(formatted, getPrismJsonLanguage(), 'json')
            : formatted

        if (Array.isArray(aasDescriptor.endpoints) && aasDescriptor.endpoints.length > 0) {
          const aasDspEndpoints = aasDescriptor.endpoints.filter(
            (endpoint: any) => endpoint.protocolInformation?.subprotocol === 'DSP' && endpoint.protocolInformation?.subprotocolBody.includes(props.selectedBusinessPartner.dsp),
          )

          if (Array.isArray(aasDspEndpoints) && aasDspEndpoints.length > 0) {
            const edcAssetIdOfAasIdPart = aasDspEndpoints[0].protocolInformation.subprotocolBody
              ?.split(';')
              .find((part: string) => part.startsWith('id='))

            edcAssetIdOfAas.value = edcAssetIdOfAasIdPart?.split('=', 2)[1] ?? ''

            if (edcAssetIdOfAas.value !== '') {
              const smDspEndpoints = aasDescriptor.submodelDescriptors
                ? aasDescriptor.submodelDescriptors
                  .flatMap((descriptor: any) => descriptor.endpoints)
                  .filter((endpoint: any) => endpoint.protocolInformation?.subprotocol === 'DSP' && endpoint.protocolInformation?.subprotocolBody.includes(props.selectedBusinessPartner.dsp))
                : []

              if (Array.isArray(smDspEndpoints) && smDspEndpoints.length > 0) {
                edcAssetIdsOfAasSms.value = smDspEndpoints.map((endpoint: any) => {
                  return endpoint.protocolInformation.subprotocolBody
                    .split(';')
                    .find((part: string) => part.startsWith('id='))
                    .split('=', 2)[1]
                })
              }
            }
          }
        }
      }

      emit('update:edc-status', 'Discovery successfully')
    } catch (error) {
      console.error('Error Discovery:', error)
      emit('update:edc-status', `Error: Failed to discover - ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      emit('update:discovering-id', false)
    }
  }

  async function discoverAasDescriptor (aasId: string, endpoint: string, headers: Headers): Promise<AASDescriptor | null> {
    if (aasId.trim() === '' || endpoint.trim() === '') return null
    try {
      // /shell-descriptors/{aasIdentifier}
      const aasRegistryShellDescriptorsEndpoint = `${endpoint}/shell-descriptors/${base64Encode(aasId)}`
      const response = await fetch(aasRegistryShellDescriptorsEndpoint, {
        method: 'GET',
        headers,
      })

      if (response.ok) {
        const aasDescriptor = await response.json()
        return aasDescriptor
      }
    } catch {
      return null
    }

    return null
  }

  async function discoverAasId_deprecated (globalAssetId: string, endpoint: string, headers: Headers): Promise<string> {
    if (globalAssetId.trim() === '' || endpoint.trim() === '') return ''

    try {
      // /lookup/shells
      const assetIdObject = JSON.stringify({ name: 'globalAssetId', value: globalAssetId })
      const aasDiscoveryPathLookupShells2Endpoint = `${endpoint}/lookup/shells?assetIds=${base64Encode(assetIdObject)}`

      const responseAasDiscoveryPathLookupShells2Endpoint = await fetch(aasDiscoveryPathLookupShells2Endpoint, {
        method: 'GET',
        headers: headers,
      })

      if (responseAasDiscoveryPathLookupShells2Endpoint.ok) {
        const jsonResponse = await responseAasDiscoveryPathLookupShells2Endpoint.json()
        if (Array.isArray(jsonResponse?.result) && jsonResponse.result.length > 0) {
          const aasIds = jsonResponse.result
          return aasIds[0]
        }
      }
    } catch {
      return ''
    }

    return ''
  }

  // async function discoverAasId (globalAssetId: string, endpoint: string, headers: Headers): Promise<string> {
  //   if (globalAssetId.trim() === '' || endpoint.trim() === '') return ''

  //   try {
  //     // /lookup/shellsByAssetLink
  //     const assetIdObject = JSON.stringify([{ name: 'globalAssetId', value: globalAssetId }])
  //     const aasDiscoveryPathLookupShells2Endpoint = `${endpoint}/lookup/shellsByAssetLink`

  //     headers.append('Content-Type', 'application/json')

  //     const responseAasDiscoveryPathLookupShells2Endpoint = await fetch(aasDiscoveryPathLookupShells2Endpoint, {
  //       method: 'POST',
  //       headers: headers,
  //       body: assetIdObject,
  //     })

  //     if (responseAasDiscoveryPathLookupShells2Endpoint.ok) {
  //       const jsonResponse = await responseAasDiscoveryPathLookupShells2Endpoint.json()
  //       if (Array.isArray(jsonResponse?.result) && jsonResponse.result.length > 0) {
  //         const aasIds = jsonResponse.result
  //         return aasIds[0]
  //       }
  //     }
  //   } catch {
  //     return ''
  //   }

  //   return ''
  // }

  function cancel (): void {
    cancelled.value = true
  }

  async function fetchAas (): Promise<void> {
    if (!props.selectedBusinessPartner)
      return

    dataTranserInProgress.value = true

    aasFetchStatus.value = 'Fetch AAS'

    const { endpoint: edcEndpoint, headers } = await resolveEdcEndpointByAssetId(
      edcAssetIdOfAas.value,
      props.selectedBusinessPartner,
      {
        cancelled,
        setInProgress: value => value,
        setStatus: msg => edcStatus.value = msg,
      },
    )

    if (!edcEndpoint) return

    try {
      const response = await fetch(edcEndpoint, { headers })
      const data = await response.json()
      aas.value = data
    } catch (error) {
      console.error('Error fetching Asset Administration Shell data:', error)
    }

    for (let index = 0; index < edcAssetIdsOfAasSms.value.length; index++) {
      const edcAssetIdOfAasSm = edcAssetIdsOfAasSms.value[index]
      const progress = Math.round(((index + 1) / edcAssetIdsOfAasSms.value.length) * 100)

      aasFetchStatus.value = `Fetch SM #${index + 1} of ${edcAssetIdsOfAasSms.value.length} (${progress}%)`

      const { endpoint: edcEndpoint, headers } = await resolveEdcEndpointByAssetId(
        edcAssetIdOfAasSm,
        props.selectedBusinessPartner,
        {
          cancelled,
          setInProgress: value => value,
          setStatus: msg => edcStatus.value = msg,
        },
      )

      if (!edcEndpoint) return

      try {
        const response = await fetch(edcEndpoint, { headers })
        const data = await response.json()
        sms.value.push(data)
      } catch (error) {
        console.error('Error fetching Submodel data:', error)
      }
    }

    try {
      const aasInstanceOrError = jsonization.assetAdministrationShellFromJsonable(aas.value as jsonization.JsonValue)
      if (aasInstanceOrError.error !== null) {
        throw new Error(`Failed to parse fetched AAS: ${JSON.stringify(aasInstanceOrError.error)}`)
      }
      const aasInstance = aasInstanceOrError.mustValue()

      const submodelInstances = sms.value.map((sm, index) => {
        const smInstanceOrError = jsonization.submodelFromJsonable(sm as jsonization.JsonValue)
        if (smInstanceOrError.error !== null) {
          throw new Error(`Failed to parse fetched Submodel #${index + 1}: ${JSON.stringify(smInstanceOrError.error)}`)
        }
        return smInstanceOrError.mustValue()
      })

      // Rebuild the Submodel References of the AAS from the fetched Submodels
      aasInstance.submodels = submodelInstances.map(submodel =>
        new aasTypes.Reference(aasTypes.ReferenceTypes.ModelReference, [
          new aasTypes.Key(aasTypes.KeyTypes.Submodel, submodel.id),
        ]),
      )

      if (aasInstance && Object.keys(aasInstance).length > 0) {
        // Build AAS environment (AAS + Submodels)
        aasEnvironment.value = new BaSyxEnvironment([aasInstance], submodelInstances, [])

        aas.value = jsonization.toJsonable(aasEnvironment.value)

        aasJson.value = JSON.stringify(aas.value)
        aasJsonParsed.value = aas.value

        const formatted = formatJSON(aasJson.value)
        aasJsonFormatted.value
          = Prism && Prism.highlight
            ? Prism.highlight(formatted, getPrismJsonLanguage(), 'json')
            : formatted
      }
    } catch (error) {
      console.error('Error updating Submodel References in AAS:', error)
    }

    edcStatus.value = 'Fetching of AAS and its Submodels completed'
    aasFetchStatus.value = ''
    dataTranserInProgress.value = false
  }

  function cancelFetchAas (): void {
    cancelledFetchAas.value = true
  }

  async function importAas (): Promise<void> {
    if (!destinationInfrastructure.value) {
      navigationStore.dispatchSnackbar({
        status: true,
        timeout: 5000,
        color: 'error',
        btnColor: 'buttonText',
        text: 'Please select a destination infrastructure',
      })
      return
    }

    if (aasEnvironment.value && isValidAasEnvironment) {
      importingInProgress.value = true

      const originalInfraId = infrastructureStore.getSelectedInfrastructureId

      try {
        await infrastructureStore.dispatchSelectInfrastructure(destinationInfrastructure.value.id)

        const destinationAasRepoUrl = destinationInfrastructure.value.components.AASRepo.url.trim()
        if (destinationAasRepoUrl === '') {
          throw new Error('Selected destination infrastructure has no AAS Repository configured')
        }

        const destinationSmRepoUrl = destinationInfrastructure.value.components.SubmodelRepo.url.trim()
        if (destinationSmRepoUrl === '') {
          throw new Error('Selected destination infrastructure has no Submodel Repository configured')
        }

        // Upload all Submodels of the AAS environment
        for (const submodel of aasEnvironment.value.submodels ?? []) {
          const smUploaded = await postSubmodel(submodel)
          if (!smUploaded) {
            throw new Error(`Failed to upload Submodel '${submodel.id}' to destination infrastructure`)
          }
        }

        // Upload all AAS of the AAS environment
        for (const aasToUpload of aasEnvironment.value.assetAdministrationShells ?? []) {
          const aasUploaded = await postAas(aasToUpload)
          if (!aasUploaded) {
            throw new Error(`Failed to upload AAS '${aasToUpload.id}' to destination infrastructure`)
          }
        }

        navigationStore.dispatchSnackbar({
          status: true,
          timeout: 8000,
          color: 'success',
          btnColor: 'buttonText',
          text: `Successfully imported AAS to ${destinationInfrastructure.value.name}`,
        })
      } catch (error) {
        console.error('Error importing AAS environment:', error)
        navigationStore.dispatchSnackbar({
          status: true,
          timeout: 8000,
          color: 'error',
          btnColor: 'buttonText',
          text: `Error: Failed to import AAS - ${error instanceof Error ? error.message : 'Unknown error'}`,
        })
      } finally {
        if (originalInfraId && infrastructureStore.getSelectedInfrastructureId !== originalInfraId) {
          await infrastructureStore.dispatchSelectInfrastructure(originalInfraId)
        }
      }
    }
    importingInProgress.value = false
  }

  defineExpose({ discoverId, cancel })
</script>

<style scoped>
  :deep(.token) {
    line-height: 21px;
  }

  :deep(code) {
    line-height: 21px;
  }

  .json-content {
    word-wrap: normal;
    font-size: 14px;
    line-height: 21px;
    flex-grow: 0;
    overflow: auto;
    background-color: #f5f5f5;
  }

  .json-content code {
    display: block;
  }

  :deep(.token.punctuation) {
    color: #999;
  }

  :deep(.token.property) {
    color: #905;
  }

  :deep(.token.string) {
    color: #690;
  }

  :deep(.token.number) {
    color: #07a;
  }

  :deep(.token.boolean) {
    color: #07a;
  }

  :deep(.token.null) {
    color: #999;
  }
</style>
