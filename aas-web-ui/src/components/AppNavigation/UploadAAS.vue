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

        <v-radio-group
          class="mt-4"
          density="compact"
          hide-details
          :model-value="uploadMode"
          @update:model-value="selectUploadMode"
        >
          <v-radio
            v-for="mode in uploadModes"
            :key="mode.value"
            class="ml-2"
            :disabled="mode.value === 'server' && !serverUploadSupported"
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

  <v-dialog v-model="showUploadReport" :max-width="800" scrollable>
    <v-card rounded="lg" title="Upload report">
      <v-card-text>
        <v-alert class="mb-4" :type="uploadReport.color">{{ uploadReport.summary }}</v-alert>
        <pre class="text-body-small text-pre-wrap">{{ uploadReport.details }}</pre>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn text="Close" @click="showUploadReport = false" />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
  import type { ClientImportOutcome } from '@/composables/AAS/AASXImport'
  import type { SubmodelDescriptor } from '@/types/Descriptors'
  import type { jsonization } from '@aas-core-works/aas-core3.1-typescript'
  import { detectImportFileKind } from '@/composables/AAS/SerializationFormats'
  import { useSMHandling } from '@/composables/AAS/SMHandling'
  import { useAASDiscoveryClient } from '@/composables/Client/AASDiscoveryClient'
  import { useAASRegistryClient } from '@/composables/Client/AASRegistryClient'
  import { useAASRepositoryClient } from '@/composables/Client/AASRepositoryClient'
  import { useSMRegistryClient } from '@/composables/Client/SMRegistryClient'
  import { useSMRepositoryClient } from '@/composables/Client/SMRepositoryClient'
  import { upsertDescriptor } from '@/composables/DescriptorSync'
  import { appendHttpStatusFailureReason } from '@/composables/HttpStatusMessages'
  import { useInfrastructureStore } from '@/store/InfrastructureStore'
  import { useNavigationStore } from '@/store/NavigationStore'
  import { Endpoint, ProtocolInformation } from '@/types/Descriptors'
  import {
    getDefaultAasUploadMode,
    type InfrastructureAasUploadMode,
    isComponentActiveForTemplate,
  } from '@/utils/InfrastructureUtils'
  import { useAASXImport } from '../../composables/AAS/AASXImport'

  // Stores
  const navigationStore = useNavigationStore()
  const infrastructureStore = useInfrastructureStore()

  // Composables
  const {
    fetchAas,
    uploadAas,
    getAasEndpointById,
    consumeLastRequestFailureStatus,
    consumeLastRequestFailureDetails,
  } = useAASRepositoryClient()
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
    (event: 'update:model-value', value: boolean): void
  }>()

  const showUploadReport = ref(false)
  const uploadReport = ref<{ color: 'success' | 'warning' | 'error', summary: string, details: string }>({
    color: 'success', summary: '', details: '',
  })
  const uploadAASDialog = ref(false)
  const aasFiles = ref<File[]>([])
  const loadingUpload = ref(false)
  const ignoreDuplicates = ref(true)
  const uploadProgress = ref(0)
  const currentFileLabel = ref('')
  const preferredUploadMode = ref<InfrastructureAasUploadMode | null>(null)

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
  const serverUploadSupported = computed(() =>
    aasFiles.value.every(file => detectImportFileKind(file.name) === 'aasx'),
  )
  const uploadMode = computed<InfrastructureAasUploadMode>(() => {
    if (!serverUploadSupported.value) return 'client'
    return preferredUploadMode.value ?? getDefaultAasUploadMode(selectedInfrastructure.value)
  })
  const aasRegistryActive = computed(() =>
    isComponentActiveForTemplate(selectedInfrastructure.value, 'AASRegistry'),
  )
  const submodelRegistryActive = computed(() =>
    isComponentActiveForTemplate(selectedInfrastructure.value, 'SubmodelRegistry'),
  )
  const aasDiscoveryActive = computed(() =>
    isComponentActiveForTemplate(selectedInfrastructure.value, 'AASDiscovery'),
  )
  const aasRepoHasRegistryIntegration = computed(
    () =>
      !aasRegistryActive.value
      || (selectedInfrastructure.value?.components?.AASRepo?.hasRegistryIntegration ?? true),
  )
  const submodelRepoHasRegistryIntegration = computed(
    () =>
      !submodelRegistryActive.value
      || (selectedInfrastructure.value?.components?.SubmodelRepo?.hasRegistryIntegration ?? true),
  )
  const aasRegistryHasDiscoveryIntegration = computed(
    () =>
      !aasRegistryActive.value
      || !aasDiscoveryActive.value
      || (selectedInfrastructure.value?.components?.AASRegistry?.hasDiscoveryIntegration ?? true),
  )
  const manualDescriptorSyncRequired = computed(
    () => !aasRepoHasRegistryIntegration.value || !submodelRepoHasRegistryIntegration.value,
  )
  const manualDiscoverySyncRequired = computed(() => !aasRegistryHasDiscoveryIntegration.value)

  watch(
    () => props.modelValue,
    value => {
      if (value) {
        preferredUploadMode.value = null
      }
      uploadAASDialog.value = value
    },
  )

  watch(
    () => uploadAASDialog.value,
    value => {
      emit('update:model-value', value)
    },
  )

  function selectUploadMode (mode: InfrastructureAasUploadMode | null): void {
    if (mode === null) return

    preferredUploadMode.value = mode
  }

  async function uploadAASFiles (): Promise<void> {
    if (aasFiles.value.length === 0) return

    const resolvedUploadMode = uploadMode.value
    loadingUpload.value = true
    uploadProgress.value = 0

    let hasImportedAas = false
    const summary = {
      outcomes: [] as ClientImportOutcome[],
      details: [] as string[],
      total: aasFiles.value.length,
      succeeded: 0,
      warnings: [] as string[],
      failed: [] as string[],
    }

    function buildUploadReportDetails (summary: { failed: string[], warnings: string[], details: string[] }): string {
      const sections: string[] = []

      if (summary.failed.length > 0) {
        sections.push(['Failed files:', ...summary.failed.map(entry => `- ${entry}`)].join('\n'))
      }

      if (summary.warnings.length > 0) {
        sections.push(['Warnings:', ...summary.warnings.map(entry => `- ${entry}`)].join('\n'))
      }

      sections.push(...summary.details)
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

        if (resolvedUploadMode === 'server') {
          const response = await uploadAas(aasFile, ignoreDuplicates.value)

          if (response?.success) {
            summary.succeeded++
            hasImportedAas = true
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
            const failureStatus = consumeLastRequestFailureStatus()
            const failureDetails = consumeLastRequestFailureDetails()
            summary.failed.push([
              `${aasFile.name}: ${appendHttpStatusFailureReason('upload failed.', failureStatus)}`,
              failureDetails,
            ].filter(Boolean).join('\n'))
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

            hasImportedAas ||= result.importedAasIds.length > 0
            const failures = result.outcomes.filter(outcome => outcome.action === 'failed')
            summary.outcomes.push(...result.outcomes)
            summary.details.push([
              aasFile.name,
              ...result.outcomes.map(outcome => {
                const action = outcome.action === 'written' ? 'CREATED OR UPDATED' : outcome.action.toUpperCase()
                const details = outcome.details ? ` ${outcome.details}` : ''
                return `${action}: ${outcome.kind} '${outcome.id}'.${details}`
              }),
            ].join('\n'))
            if (failures.length > 0) {
              summary.failed.push(`${aasFile.name}: ${failures.length} object(s) failed to import.`)
            } else if (result.importedAasIds.length === 0) {
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

      if (hasImportedAas) {
        navigationStore.dispatchTriggerAASListReload()
      }

      const counts = (['created', 'updated', 'skipped', 'written', 'failed'] as const)
        .map(action => ({ action, count: summary.outcomes.filter(outcome => outcome.action === action).length }))
        .filter(entry => entry.count > 0)
        .map(entry => `${entry.count} ${entry.action === 'written' ? 'created or updated' : entry.action}`)
        .join(', ')
      const hasDuplicates = summary.outcomes.some(outcome => outcome.action === 'updated' || outcome.action === 'skipped')
      const color = summary.failed.length > 0 ? 'error' : (summary.warnings.length > 0 || hasDuplicates ? 'warning' : 'success')
      const message = summary.failed.length > 0
        ? `Uploaded ${summary.succeeded}/${summary.total} file(s). ${summary.failed.length} failed.`
        : `Uploaded ${summary.succeeded}/${summary.total} file(s)${color === 'warning' ? ' with warnings' : ' successfully'}.`
      displayUploadReport(color, `${message}${counts ? ` Objects: ${counts}.` : ''}`, buildUploadReportDetails(summary))
    } catch (error) {
      console.error('Error uploading AAS:', error)
      displayUploadReport('error', 'AAS upload failed.', stringifyUnknown(error))
    } finally {
      resetUploadState()
    }
  }

  watchEffect(() => {
    if (!uploadAASDialog.value) {
      resetUploadState()
    }
  })

  function displayUploadReport (color: 'success' | 'warning' | 'error', summary: string, details: string): void {
    uploadReport.value = { color, summary, details }
    showUploadReport.value = color !== 'success'
    navigationStore.dispatchSnackbar({
      status: true,
      timeout: color === 'success' ? 8000 : 10_000,
      color,
      btnColor: 'buttonText',
      text: summary,
      actionText: 'View report',
      actionCallback: () => {
        showUploadReport.value = true
      },
    })
  }

  function resetUploadState (): void {
    aasFiles.value = []
    uploadAASDialog.value = false
    loadingUpload.value = false
    uploadProgress.value = 0
    currentFileLabel.value = ''
    preferredUploadMode.value = null
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
          let submodelDescriptorSyncFailed = false
          const submodelRefs = Array.isArray(fetchedShell.submodels) ? fetchedShell.submodels : []
          for (const submodelRef of submodelRefs) {
            const submodelId = submodelRef?.keys?.[0]?.value
            if (!submodelId) continue

            const submodelDescriptor = await createSubmodelDescriptor(submodelId)
            const smSuccess = await upsertDescriptor(
              true,
              () => postSubmodelDescriptor(submodelDescriptor),
              () => putSubmodelDescriptor(submodelDescriptor),
            )
            if (!smSuccess) {
              warnings.push(`Failed to create Submodel Descriptor '${submodelId}'.`)
              submodelDescriptorSyncFailed = true
              break
            }
          }
          if (submodelDescriptorSyncFailed) {
            continue
          }
        }

        if (sync.syncAasDescriptor) {
          const aasEndpoints = createEndpoints(href, 'AAS-3.0')
          const aasDescriptor = createDescriptorFromAAS(fetchedShell, aasEndpoints)
          const aasSuccess = await upsertDescriptor(
            true,
            () => postAasDescriptor(aasDescriptor),
            () => putAasDescriptor(aasDescriptor),
          )
          if (!aasSuccess) {
            warnings.push(`Failed to create AAS Descriptor '${aasId}'.`)
            continue
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
              continue
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
          let submodelDescriptorSyncFailed = false
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
            const smSuccess = await upsertDescriptor(
              true,
              () => postSubmodelDescriptor(submodelDescriptor),
              () => putSubmodelDescriptor(submodelDescriptor),
            )
            if (!smSuccess) {
              warnings.push(`Failed to create Submodel Descriptor '${submodelId}'.`)
              submodelDescriptorSyncFailed = true
              break
            }
          }
          if (submodelDescriptorSyncFailed) {
            continue
          }
        }

        if (sync.syncAasDescriptor) {
          const aasDescriptor = createDescriptorFromAAS(
            aas as unknown as jsonization.JsonObject,
            createEndpoints(aasHref, 'AAS-3.0'),
          )
          const aasSuccess = await upsertDescriptor(
            true,
            () => postAasDescriptor(aasDescriptor),
            () => putAasDescriptor(aasDescriptor),
          )
          if (!aasSuccess) {
            warnings.push(`Failed to create AAS Descriptor '${aasId}'.`)
            continue
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
              continue
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
