<template>
  <v-dialog v-model="uploadAASDialog" :width="800">
    <v-sheet border :loading="loadingUpload" rounded="lg">
      <v-card-title class="bg-cardHeader">Upload Shells</v-card-title>
      <v-divider />
      <v-card-text class="overflow-y-auto" style="max-height: calc(100vh - 296px)">
        <v-file-upload
          v-model="aasFiles"
          :accept="['.aasx', '.json', '.xml']"
          class="my-1"
          clearable
          density="default"
          :multiple="true"
        />
        <!-- Options -->
        <v-label class="mt-5">Options</v-label>
        <v-radio-group v-model="uploadMode" class="mt-4" density="compact" hide-details>
          <v-radio
            v-for="mode in uploadModes"
            :key="mode.value"
            class="ml-2"
            :label="mode.title"
            :value="mode.value"
          />
        </v-radio-group>
        <v-checkbox
          v-if="uploadMode === 'server'"
          v-model="ignoreDuplicates"
          class="mt-3"
          hide-details
          label="Ignore Duplicates"
        />
        <v-alert
          v-if="manualDescriptorSyncRequired && !descriptorsAvailable"
          class="mt-3"
          density="compact"
          type="warning"
        >
          Manual descriptor sync is required by infrastructure settings, but AAS and Submodel registries are
          not connected.
        </v-alert>
        <v-alert
          v-if="manualDiscoverySyncRequired && !discoveryAvailable"
          class="mt-2"
          density="compact"
          type="warning"
        >
          Manual discovery sync is required by infrastructure settings, but AAS discovery is not connected.
        </v-alert>
        <v-progress-linear
          v-if="loadingUpload"
          class="mt-4"
          color="primary"
          height="12"
          :model-value="uploadProgress"
          rounded
        >
          <template #default>
            <strong>{{ Math.round(uploadProgress) }}%</strong>
          </template>
        </v-progress-linear>
        <div v-if="loadingUpload && currentFileLabel.trim() !== ''" class="text-body-small mt-2">
          Processing: {{ currentFileLabel }}
        </div>
      </v-card-text>
      <v-divider />
      <v-card-actions>
        <v-spacer />
        <v-btn :disabled="loadingUpload" rounded="lg" text="Cancel" @click="uploadAASDialog = false" />
        <v-btn
          class="text-buttonText"
          color="primary"
          :disabled="loadingUpload || aasFiles.length === 0"
          :loading="loadingUpload"
          rounded="lg"
          text="Upload"
          variant="flat"
          @click="uploadAASFiles"
        />
      </v-card-actions>
    </v-sheet>
  </v-dialog>
</template>

<script lang="ts" setup>
  import type { SubmodelDescriptor } from '@/types/Descriptors'
  import type { jsonization } from '@aas-core-works/aas-core3.1-typescript'
  import { computed, ref, watch, watchEffect } from 'vue'
  import { detectImportFileKind } from '@/composables/AAS/SerializationFormats'
  import { useSMHandling } from '@/composables/AAS/SMHandling'
  import { useAASDiscoveryClient } from '@/composables/Client/AASDiscoveryClient'
  import { useAASRegistryClient } from '@/composables/Client/AASRegistryClient'
  import { useAASRepositoryClient } from '@/composables/Client/AASRepositoryClient'
  import { useSMRegistryClient } from '@/composables/Client/SMRegistryClient'
  import { useSMRepositoryClient } from '@/composables/Client/SMRepositoryClient'
  import { useInfrastructureStore } from '@/store/InfrastructureStore'
  import { useNavigationStore } from '@/store/NavigationStore'
  import { Endpoint, ProtocolInformation } from '@/types/Descriptors'
  import { useAASXImport } from '../../composables/AAS/AASXImport'

  // Stores
  const navigationStore = useNavigationStore()
  const infrastructureStore = useInfrastructureStore()

  // Composables
  const { fetchAas, uploadAas, getAasEndpointById } = useAASRepositoryClient()
  const { getSmEndpointById } = useSMRepositoryClient()
  const { fetchSm } = useSMHandling()
  const { importAasxFileClient, importEnvironmentFileClient } = useAASXImport()
  const { createAssetLinksFromAssetInformation, upsertAssetLinksForAas } = useAASDiscoveryClient()
  const { postAasDescriptor, putAasDescriptor, createDescriptorFromAAS } = useAASRegistryClient()
  const { postSubmodelDescriptor, putSubmodelDescriptor, createDescriptorFromSubmodel } = useSMRegistryClient()

  const props = defineProps<{
    modelValue: boolean
  }>()

  const emit = defineEmits<{
    (event: 'update:modelValue', value: boolean): void
  }>()

  const uploadAASDialog = ref(false)
  const aasFiles = ref<File[]>([])
  const loadingUpload = ref(false)
  const ignoreDuplicates = ref(true)
  const uploadProgress = ref(0)
  const currentFileLabel = ref('')
  const uploadMode = ref<'client' | 'server'>('client')

  const uploadModes = [
    { title: 'Client-side Import', value: 'client' },
    { title: 'Server Upload Endpoint', value: 'server' },
  ]

  const descriptorsAvailable = computed(() => {
    const components = infrastructureStore.getBasyxComponents as Record<string, { connected?: unknown }>
    const isConnected = (connected: unknown): boolean => {
      if (connected === true) return true
      if (!connected || typeof connected !== 'object') return false

      const maybeRef = connected as { value?: unknown }
      return maybeRef.value === true
    }

    const aasRegistryConnected = isConnected(components?.AASRegistry?.connected)
    const submodelRegistryConnected = isConnected(components?.SubmodelRegistry?.connected)
    return aasRegistryConnected && submodelRegistryConnected
  })
  const discoveryAvailable = computed(() => {
    const components = infrastructureStore.getBasyxComponents as Record<string, { connected?: unknown }>
    const connected = components?.AASDiscovery?.connected

    if (connected === true) return true
    if (!connected || typeof connected !== 'object') return false
    const maybeRef = connected as { value?: unknown }
    return maybeRef.value === true
  })

  const selectedInfrastructure = computed(() => infrastructureStore.getSelectedInfrastructure)
  const aasRepoHasRegistryIntegration = computed(
    () => selectedInfrastructure.value?.components?.AASRepo?.hasRegistryIntegration ?? true,
  )
  const submodelRepoHasRegistryIntegration = computed(
    () => selectedInfrastructure.value?.components?.SubmodelRepo?.hasRegistryIntegration ?? true,
  )
  const aasRegistryHasDiscoveryIntegration = computed(
    () => selectedInfrastructure.value?.components?.AASRegistry?.hasDiscoveryIntegration ?? true,
  )
  const manualDescriptorSyncRequired = computed(
    () => !aasRepoHasRegistryIntegration.value || !submodelRepoHasRegistryIntegration.value,
  )
  const manualDiscoverySyncRequired = computed(() => !aasRegistryHasDiscoveryIntegration.value)

  watch(
    () => props.modelValue,
    value => {
      uploadAASDialog.value = value
    },
  )

  watch(
    () => uploadAASDialog.value,
    value => {
      emit('update:modelValue', value)
    },
  )

  async function uploadAASFiles (): Promise<void> {
    if (aasFiles.value.length === 0) return

    loadingUpload.value = true
    uploadProgress.value = 0

    const summary = {
      total: aasFiles.value.length,
      succeeded: 0,
      warnings: [] as string[],
      failed: [] as string[],
    }

    function buildUploadErrorDetails (summary: { failed: string[], warnings: string[] }): string {
      const sections: string[] = []

      if (summary.failed.length > 0) {
        sections.push(['Failed files:', ...summary.failed.map(entry => `- ${entry}`)].join('\n'))
      }

      if (summary.warnings.length > 0) {
        sections.push(['Warnings:', ...summary.warnings.map(entry => `- ${entry}`)].join('\n'))
      }

      return sections.join('\n\n')
    }

    try {
      if (manualDescriptorSyncRequired.value && !descriptorsAvailable.value) {
        summary.warnings.push('Manual descriptor sync skipped because registries are not connected.')
      }
      if (manualDiscoverySyncRequired.value && !discoveryAvailable.value) {
        summary.warnings.push('Manual discovery sync skipped because AAS discovery is not connected.')
      }

      const shouldSyncAasDescriptor = !aasRepoHasRegistryIntegration.value && descriptorsAvailable.value
      const shouldSyncSubmodelDescriptor
        = !submodelRepoHasRegistryIntegration.value && descriptorsAvailable.value
      const shouldSyncDiscovery = !aasRegistryHasDiscoveryIntegration.value && discoveryAvailable.value

      for (let index = 0; index < aasFiles.value.length; index++) {
        const aasFile = aasFiles.value[index]
        currentFileLabel.value = aasFile.name

        if (uploadMode.value === 'server') {
          const response = await uploadAas(aasFile, ignoreDuplicates.value)

          if (response?.success) {
            summary.succeeded++
            if (shouldSyncAasDescriptor || shouldSyncSubmodelDescriptor || shouldSyncDiscovery) {
              const createdWarnings = await createAndPostDescriptorsFromAasIds(
                Array.isArray(response?.data?.aasIds) ? response.data.aasIds : [],
                {
                  syncAasDescriptor: shouldSyncAasDescriptor,
                  syncSubmodelDescriptor: shouldSyncSubmodelDescriptor,
                  syncDiscovery: shouldSyncDiscovery,
                },
              )
              summary.warnings.push(...createdWarnings.map(warning => `${aasFile.name}: ${warning}`))
            }
          } else {
            summary.failed.push(`${aasFile.name}: upload failed.`)
          }
        } else {
          try {
            const fileKind = detectImportFileKind(aasFile.name)
            if (fileKind === 'unknown') {
              summary.failed.push(`${aasFile.name}: unsupported file type.`)
              continue
            }

            const result
              = fileKind === 'aasx'
                ? await importAasxFileClient(aasFile)
                : await importEnvironmentFileClient(aasFile)

            if (result.importedAasIds.length === 0) {
              summary.failed.push(`${aasFile.name}: no AAS imported.`)
            } else {
              summary.succeeded++
            }

            summary.warnings.push(
              ...result.warnings.map((warning: string) => `${aasFile.name}: ${warning}`),
            )

            if (shouldSyncAasDescriptor || shouldSyncSubmodelDescriptor || shouldSyncDiscovery) {
              const descriptorWarnings = await createAndPostDescriptorsFromPayload(
                result.importedAas,
                result.importedSubmodels,
                {
                  syncAasDescriptor: shouldSyncAasDescriptor,
                  syncSubmodelDescriptor: shouldSyncSubmodelDescriptor,
                  syncDiscovery: shouldSyncDiscovery,
                },
              )
              summary.warnings.push(
                ...descriptorWarnings.map((warning: string) => `${aasFile.name}: ${warning}`),
              )
            }
          } catch (error) {
            summary.failed.push(`${aasFile.name}: ${stringifyUnknown(error)}`)
          }
        }

        uploadProgress.value = ((index + 1) / aasFiles.value.length) * 100
      }

      if (summary.succeeded > 0) {
        navigationStore.dispatchTriggerAASListReload()
      }

      const warningPreview = summary.warnings.slice(0, 3).join(' | ')

      if (summary.failed.length === 0) {
        navigationStore.dispatchSnackbar({
          status: true,
          timeout: 8000,
          color: summary.warnings.length > 0 ? 'warning' : 'success',
          btnColor: 'buttonText',
          text:
            summary.warnings.length > 0
              ? `Uploaded ${summary.succeeded}/${summary.total} file(s) with ${summary.warnings.length} warning(s): ${warningPreview}`
              : `Uploaded ${summary.succeeded}/${summary.total} file(s) successfully.`,
        })
      } else {
        navigationStore.dispatchSnackbar({
          status: true,
          timeout: 10_000,
          color: 'error',
          btnColor: 'buttonText',
          baseError: `Uploaded ${summary.succeeded}/${summary.total} file(s). ${summary.failed.length} failed.`,
          extendedError: buildUploadErrorDetails(summary),
        })
      }
    } catch (error) {
      console.error('Error uploading AAS:', error)
      navigationStore.dispatchSnackbar({
        status: true,
        timeout: 6000,
        color: 'error',
        btnColor: 'buttonText',
        baseError: 'AAS upload failed.',
        extendedError: stringifyUnknown(error),
      })
    } finally {
      resetUploadState()
    }
  }

  watchEffect(() => {
    if (!uploadAASDialog.value) {
      resetUploadState()
    }
  })

  function resetUploadState (): void {
    aasFiles.value = []
    uploadAASDialog.value = false
    loadingUpload.value = false
    uploadProgress.value = 0
    currentFileLabel.value = ''
    uploadMode.value = 'client'
  }

  function createEndpoints (href: string, type: string): Array<Endpoint> {
    const protocolInformation = new ProtocolInformation(href, null, 'http')
    return [new Endpoint(type, protocolInformation)]
  }

  function stringifyUnknown (value: unknown): string {
    if (value instanceof Error) return value.message
    if (typeof value === 'string') return value
    try {
      return JSON.stringify(value)
    } catch {
      return String(value)
    }
  }

  function asString (value: unknown): string {
    return typeof value === 'string' ? value : ''
  }

  async function createAndPostDescriptorsFromAasIds (
    aasIds: string[],
    sync: { syncAasDescriptor: boolean, syncSubmodelDescriptor: boolean, syncDiscovery: boolean },
  ): Promise<string[]> {
    const warnings: string[] = []

    for (const aasId of aasIds) {
      try {
        const href = getAasEndpointById(aasId)
        const fetchedShell = await fetchAas(href)

        if (!fetchedShell || !fetchedShell.id) {
          warnings.push(`Skipping descriptor creation, AAS '${aasId}' could not be fetched.`)
          continue
        }

        if (sync.syncSubmodelDescriptor) {
          const submodelRefs = Array.isArray(fetchedShell.submodels) ? fetchedShell.submodels : []
          for (const submodelRef of submodelRefs) {
            const submodelId = submodelRef?.keys?.[0]?.value
            if (!submodelId) continue

            const submodelDescriptor = await createSubmodelDescriptor(submodelId)
            const smSuccess
              = (await postSubmodelDescriptor(submodelDescriptor))
                || (await putSubmodelDescriptor(submodelDescriptor))
            if (!smSuccess) {
              warnings.push(`Failed to create Submodel Descriptor '${submodelId}'.`)
            }
          }
        }

        if (sync.syncAasDescriptor) {
          const aasEndpoints = createEndpoints(href, 'AAS-3.0')
          const aasDescriptor = createDescriptorFromAAS(fetchedShell, aasEndpoints)
          const aasSuccess
            = (await postAasDescriptor(aasDescriptor)) || (await putAasDescriptor(aasDescriptor))
          if (!aasSuccess) {
            warnings.push(`Failed to create AAS Descriptor '${aasId}'.`)
          }
        }

        if (sync.syncDiscovery) {
          const links = createAssetLinksFromAssetInformation(
            fetchedShell?.assetInformation?.globalAssetId,
            fetchedShell?.assetInformation?.specificAssetIds,
          )
          if (links.length > 0) {
            const discoverySuccess = await upsertAssetLinksForAas(aasId, links)
            if (!discoverySuccess) {
              warnings.push(`Failed to synchronize discovery asset links for '${aasId}'.`)
            }
          }
        }
      } catch (error) {
        warnings.push(`Error while creating descriptors for AAS '${aasId}': ${stringifyUnknown(error)}`)
      }
    }

    return warnings
  }

  async function createAndPostDescriptorsFromPayload (
    aasList: Array<Record<string, unknown>>,
    submodels: Array<Record<string, unknown>>,
    sync: { syncAasDescriptor: boolean, syncSubmodelDescriptor: boolean, syncDiscovery: boolean },
  ): Promise<string[]> {
    const warnings: string[] = []
    const submodelById = new Map<string, Record<string, unknown>>()

    for (const submodel of submodels) {
      const submodelId = asString(submodel.id).trim()
      if (submodelId !== '') submodelById.set(submodelId, submodel)
    }

    for (const aas of aasList) {
      try {
        const aasId = asString(aas.id).trim()
        if (aasId === '') continue

        const aasHref = getAasEndpointById(aasId)

        if (sync.syncSubmodelDescriptor) {
          const submodelRefs = Array.isArray(aas.submodels) ? aas.submodels : []
          for (const submodelRef of submodelRefs) {
            const submodelId = submodelRef?.keys?.[0]?.value
            if (!submodelId) continue

            const submodel = submodelById.get(submodelId)
            if (!submodel) {
              warnings.push(`Submodel '${submodelId}' not found for descriptor creation.`)
              continue
            }

            const submodelHref = getSmEndpointById(submodelId)
            const submodelDescriptor = createDescriptorFromSubmodel(
              submodel as unknown as jsonization.JsonObject,
              createEndpoints(submodelHref, 'SUBMODEL-3.0'),
            )
            const smSuccess
              = (await postSubmodelDescriptor(submodelDescriptor))
                || (await putSubmodelDescriptor(submodelDescriptor))
            if (!smSuccess) {
              warnings.push(`Failed to create Submodel Descriptor '${submodelId}'.`)
            }
          }
        }

        if (sync.syncAasDescriptor) {
          const aasDescriptor = createDescriptorFromAAS(
            aas as unknown as jsonization.JsonObject,
            createEndpoints(aasHref, 'AAS-3.0'),
          )
          const aasSuccess
            = (await postAasDescriptor(aasDescriptor)) || (await putAasDescriptor(aasDescriptor))
          if (!aasSuccess) {
            warnings.push(`Failed to create AAS Descriptor '${aasId}'.`)
          }
        }

        if (sync.syncDiscovery) {
          const assetInformation = aas.assetInformation as
            | { globalAssetId?: string, specificAssetIds?: Array<{ name?: string, value?: string }> }
            | undefined
          const links = createAssetLinksFromAssetInformation(
            assetInformation?.globalAssetId,
            assetInformation?.specificAssetIds,
          )
          if (links.length > 0) {
            const discoverySuccess = await upsertAssetLinksForAas(aasId, links)
            if (!discoverySuccess) {
              warnings.push(`Failed to synchronize discovery asset links for '${aasId}'.`)
            }
          }
        }
      } catch (error) {
        warnings.push(`Error while creating descriptors from imported payload: ${stringifyUnknown(error)}`)
      }
    }

    return warnings
  }

  async function createSubmodelDescriptor (submodelId: string): Promise<SubmodelDescriptor> {
    try {
      const href = getSmEndpointById(submodelId)
      const submodel = await fetchSm(href)

      const endpoints = createEndpoints(href, 'SUBMODEL-3.0')

      return createDescriptorFromSubmodel(submodel, endpoints)
    } catch (error) {
      console.error('Error creating submodel descriptor:', error)
      throw error
    }
  }
</script>
