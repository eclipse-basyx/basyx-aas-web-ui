<template>
  <v-dialog v-model="editAASDialog" persistent width="860">
    <v-card>
      <v-card-title>
        <span class="text-subtile-1">{{ newShell ? 'Create a new AAS' : 'Edit AAS' }}</span>
      </v-card-title>
      <v-divider />
      <v-card-text class="pa-3 bg-card" style="overflow-y: auto">
        <v-expansion-panels v-model="openPanels" multiple>
          <!-- Details -->
          <v-expansion-panel class="border-t-thin border-s-thin border-e-thin" :class="bordersToShow(0)">
            <v-expansion-panel-title>Details</v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-row align="center">
                <v-col class="py-0">
                  <TextInput
                    v-model="AASId"
                    :disabled="!newShell"
                    label="ID"
                    :show-generate-iri-button="true"
                    type="AssetAdministrationShell"
                  />
                </v-col>
                <v-col class="px-0" cols="auto">
                  <HelpInfoButton help-type="identifier" />
                </v-col>
              </v-row>
              <v-row align="center">
                <v-col class="py-0">
                  <TextInput v-model="AASIdShort" label="IdShort" />
                </v-col>
                <v-col class="px-0" cols="auto">
                  <HelpInfoButton help-type="idShort" />
                </v-col>
              </v-row>
              <v-row align="center">
                <v-col class="py-0">
                  <MultiLanguageTextInput
                    v-model="displayName"
                    label="Display Name"
                    :show-label="true"
                    type="displayName"
                  />
                </v-col>
                <v-col class="px-0" cols="auto">
                  <HelpInfoButton help-type="displayName" />
                </v-col>
              </v-row>
              <v-row align="center">
                <v-col class="py-0">
                  <MultiLanguageTextInput
                    v-model="description"
                    label="Description"
                    :show-label="true"
                    type="description"
                  />
                </v-col>
                <v-col class="px-0" cols="auto">
                  <HelpInfoButton help-type="description" />
                </v-col>
              </v-row>
              <v-row align="center">
                <v-col class="py-0">
                  <SelectInput
                    v-model="AASCategory"
                    :clearable="true"
                    label="Category"
                    type="category"
                  />
                </v-col>
                <v-col class="px-0" cols="auto">
                  <HelpInfoButton help-type="category" />
                </v-col>
              </v-row>
            </v-expansion-panel-text>
          </v-expansion-panel>
          <!-- Administrative Information -->
          <v-expansion-panel class="border-s-thin border-e-thin" :class="bordersToShow(1)">
            <v-expansion-panel-title>Administrative Information</v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-row align="center">
                <v-col class="py-0">
                  <TextInput v-model="version" label="Version" />
                </v-col>
                <v-col class="px-0" cols="auto">
                  <HelpInfoButton help-type="version" />
                </v-col>
              </v-row>
              <v-row align="center">
                <v-col class="py-0">
                  <TextInput v-model="revision" label="Revision" />
                </v-col>
                <v-col class="px-0" cols="auto">
                  <HelpInfoButton help-type="revision" />
                </v-col>
              </v-row>
              <v-row align="center">
                <v-col class="py-0">
                  <ReferenceInput v-model="creator" label="Creator" />
                </v-col>
                <v-col class="px-0" cols="auto">
                  <HelpInfoButton help-type="creator" />
                </v-col>
              </v-row>
              <v-row align="center">
                <v-col class="py-0">
                  <TextInput v-model="templateId" label="Template ID" />
                </v-col>
                <v-col class="px-0" cols="auto">
                  <HelpInfoButton help-type="templateId" />
                </v-col>
              </v-row>
            </v-expansion-panel-text>
          </v-expansion-panel>
          <!-- Derivation -->
          <v-expansion-panel class="border-s-thin border-e-thin" :class="bordersToShow(2)">
            <v-expansion-panel-title>Derivation</v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-row align="center">
                <v-col class="py-0">
                  <ReferenceInput
                    v-model="derivedFrom"
                    :default-key-type="aasTypes.KeyTypes.AssetAdministrationShell"
                    label="Derived From"
                  />
                </v-col>
                <v-col class="px-0" cols="auto">
                  <HelpInfoButton help-type="derivedFrom" />
                </v-col>
              </v-row>
            </v-expansion-panel-text>
          </v-expansion-panel>
          <!-- Asset -->
          <v-expansion-panel class="border-s-thin border-e-thin" :class="bordersToShow(3)">
            <v-expansion-panel-title>Asset</v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-row align="center" class="mb-3">
                <v-col class="py-0">
                  <SelectInput v-model="assetKind" label="Asset Kind" type="assetKind" />
                </v-col>
                <v-col class="px-0" cols="auto">
                  <HelpInfoButton help-type="assetKind" />
                </v-col>
              </v-row>
              <AssetIdInput
                v-model:global-asset-id="globalAssetId"
                v-model:specific-asset-ids="specificAssetIds"
                :show-generate-iri-for-global="true"
                :show-generate-iri-for-specific="true"
                :show-specific-asset-ids="true"
              />
              <v-row align="center" class="mt-0">
                <v-col class="py-0">
                  <TextInput v-model="assetType" label="Asset Type" />
                </v-col>
                <v-col class="px-0" cols="auto">
                  <HelpInfoButton help-type="assetType" />
                </v-col>
              </v-row>
              <v-row align="center">
                <v-col class="py-0">
                  <ResourceInput
                    v-model="defaultThumbnail"
                    :aas="aas"
                    label="Default Thumbnail"
                    :new-shell="newShell"
                    @update:file-thumbnail="handleFileThumbnail"
                  />
                </v-col>
                <v-col class="px-0" cols="auto">
                  <HelpInfoButton help-type="defaultThumbnail" />
                </v-col>
              </v-row>
            </v-expansion-panel-text>
          </v-expansion-panel>
          <!-- Data Specification -->
          <v-expansion-panel class="border-b-thin border-s-thin border-e-thin" :class="bordersToShow(4)">
            <v-expansion-panel-title>Data Specification</v-expansion-panel-title>
            <v-expansion-panel-text>
              <EmbeddedDataSpecificationInput v-model="embeddedDataSpecifications" />
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-card-text>
      <v-divider />
      <v-card-actions>
        <v-spacer />
        <v-btn @click="closeDialog">Cancel</v-btn>
        <v-btn color="primary" @click="saveAAS">Save</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
  import { types as aasTypes, jsonization } from '@aas-core-works/aas-core3.1-typescript'
  import { computed, ref, watch } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useAASHandling } from '@/composables/AAS/AASHandling'
  import { useAASDiscoveryClient } from '@/composables/Client/AASDiscoveryClient'
  import { useAASRegistryClient } from '@/composables/Client/AASRegistryClient'
  import { useAASRepositoryClient } from '@/composables/Client/AASRepositoryClient'
  import { useIDUtils } from '@/composables/IDUtils'
  import { buildVerificationSummary, verifyForEditor } from '@/composables/MetamodelVerification'
  import { useAASStore } from '@/store/AASDataStore'
  import { useInfrastructureStore } from '@/store/InfrastructureStore'
  import { useNavigationStore } from '@/store/NavigationStore'
  import { Endpoint, ProtocolInformation } from '@/types/Descriptors'

  const props = defineProps<{
    modelValue: boolean
    newShell: boolean
    aas?: aasTypes.AssetAdministrationShell
  }>()

  // Vue Router
  const route = useRoute()
  const router = useRouter()

  // Composables
  const { generateUUID } = useIDUtils()
  const { getAasEndpointById, fetchAndDispatchAasById } = useAASHandling()

  // Stores
  const aasStore = useAASStore()
  const infrastructureStore = useInfrastructureStore()
  const navigationStore = useNavigationStore()

  const emit = defineEmits<{
    (event: 'update:modelValue', value: boolean): void
  }>()

  const {
    fetchAasById,
    postAas,
    putAas,
    putThumbnail,
    getAasEndpointById: getAasRepoEndpointById,
  } = useAASRepositoryClient()
  const { fetchAasDescriptorById, postAasDescriptor, putAasDescriptor, createDescriptorFromAAS }
    = useAASRegistryClient()
  const { createAssetLinksFromAssetInformation, upsertAssetLinksForAas, deleteAssetLinksForAas }
    = useAASDiscoveryClient()

  const editAASDialog = ref(false)
  const AASObject = ref<aasTypes.AssetAdministrationShell | undefined>(undefined)
  const openPanels = ref<number[]>([0, 3])

  const AASId = ref<string | null>(generateUUID())
  const AASIdShort = ref<string | null>(null)
  const displayName = ref<Array<aasTypes.LangStringNameType> | null>(null)
  const description = ref<Array<aasTypes.LangStringTextType> | null>(null)
  const AASCategory = ref<string | null>(null)

  const version = ref<string | null>(null)
  const revision = ref<string | null>(null)
  const creator = ref<aasTypes.Reference | null>(null)
  const templateId = ref<string | null>(null)
  const derivedFrom = ref<aasTypes.Reference | null>(null)

  const assetKind = ref<aasTypes.AssetKind>(aasTypes.AssetKind.Instance)
  const globalAssetId = ref<string | null>(null)
  const specificAssetIds = ref<Array<aasTypes.SpecificAssetId> | null>(null)
  const assetType = ref<string | null>(null)
  const defaultThumbnail = ref<aasTypes.Resource | null>(null)
  const embeddedDataSpecifications = ref<Array<aasTypes.EmbeddedDataSpecification> | null>(null)

  const fileThumbnail = ref<File | undefined>(undefined)
  const initialDiscoveryAssetLinks = ref<Array<{ name: string, value: string }>>([])

  // Computed Properties
  const selectedAAS = computed(() => aasStore.getSelectedAAS) // Get the selected AAS from Store
  const selectedInfrastructure = computed(() => infrastructureStore.getSelectedInfrastructure)
  const aasRepoHasRegistryIntegration = computed(
    () => selectedInfrastructure.value?.components?.AASRepo?.hasRegistryIntegration ?? true,
  )
  const aasRegistryHasDiscoveryIntegration = computed(
    () => selectedInfrastructure.value?.components?.AASRegistry?.hasDiscoveryIntegration ?? true,
  )
  const bordersToShow = computed(() => (panel: number) => {
    let border = ''
    switch (panel) {
      case 0: {
        if (openPanels.value.includes(0) || openPanels.value.includes(1)) {
          border = 'border-b-thin'
        }
        break
      }
      case 1: {
        if (openPanels.value.includes(0) || openPanels.value.includes(1)) {
          border += ' border-t-thin'
        }
        if (openPanels.value.includes(1) || openPanels.value.includes(2)) {
          border += ' border-b-thin'
        }
        break
      }
      case 2: {
        if (openPanels.value.includes(1) || openPanels.value.includes(2)) {
          border += ' border-t-thin'
        }
        if (openPanels.value.includes(2) || openPanels.value.includes(3)) {
          border += ' border-b-thin'
        }
        break
      }
      case 3: {
        if (openPanels.value.includes(2) || openPanels.value.includes(3)) {
          border += ' border-t-thin'
        }
        if (openPanels.value.includes(3) || openPanels.value.includes(4)) {
          border += ' border-b-thin'
        }
        break
      }
      case 4: {
        if (openPanels.value.includes(3) || openPanels.value.includes(4)) {
          border = 'border-t-thin'
        }
        break
      }
    }
    return border
  })

  watch(
    () => props.modelValue,
    value => {
      editAASDialog.value = value
      if (value) {
        initializeInputs()
      }
    },
  )

  watch(
    () => editAASDialog.value,
    value => {
      emit('update:modelValue', value)
    },
  )

  async function initializeInputs (): Promise<void> {
    // Always reset form values first to clear any stale data from previously opened elements
    clearForm()

    if (props.newShell === false && props.aas) {
      const aas = await fetchAasById(props.aas.id)

      // Parse JSON to AssetAdministrationShell
      const instanceOrError = jsonization.assetAdministrationShellFromJsonable(aas)
      if (instanceOrError.error !== null) {
        console.error('Error parsing AAS:', instanceOrError.error)
        return
      }
      AASObject.value = instanceOrError.mustValue()
      // console.log('AASObject: ', AASObject.value);
      // Set values of AAS
      AASId.value = AASObject.value.id ?? generateUUID()
      AASIdShort.value = AASObject.value.idShort ?? null
      displayName.value = AASObject.value.displayName ?? null
      description.value = AASObject.value.description ?? null
      AASCategory.value = AASObject.value.category ?? null
      derivedFrom.value = AASObject.value.derivedFrom ?? null
      if (AASObject.value.administration !== null && AASObject.value.administration !== undefined) {
        version.value = AASObject.value.administration.version ?? null
        revision.value = AASObject.value.administration.revision ?? null
        creator.value = AASObject.value.administration.creator ?? null
        templateId.value = AASObject.value.administration.templateId ?? null
      }
      if (AASObject.value.assetInformation !== null && AASObject.value.assetInformation !== undefined) {
        assetKind.value = AASObject.value.assetInformation.assetKind ?? aasTypes.AssetKind.Instance
        globalAssetId.value = AASObject.value.assetInformation.globalAssetId ?? null
        specificAssetIds.value = AASObject.value.assetInformation.specificAssetIds ?? null
        assetType.value = AASObject.value.assetInformation.assetType ?? null
        defaultThumbnail.value = AASObject.value.assetInformation.defaultThumbnail ?? null
      }
      embeddedDataSpecifications.value = AASObject.value.embeddedDataSpecifications ?? null

      // Keep a stable snapshot from initial load so update detection is not affected by in-place form mutations.
      initialDiscoveryAssetLinks.value = createAssetLinksFromAssetInformation(
        AASObject.value.assetInformation?.globalAssetId,
        AASObject.value.assetInformation?.specificAssetIds,
      )
    }
  }

  function createAssetInformation (): aasTypes.AssetInformation {
    const assetInformation = new aasTypes.AssetInformation(assetKind.value)

    // Add optional parameter globalAssetId
    if (globalAssetId.value !== null) {
      assetInformation.globalAssetId = globalAssetId.value
    }

    // Add optional parameter specificAssetIds
    if (specificAssetIds.value !== null && specificAssetIds.value.length > 0) {
      assetInformation.specificAssetIds = specificAssetIds.value
    }

    // Add optional parameter assetType
    if (assetType.value !== null) {
      assetInformation.assetType = assetType.value
    }

    if (defaultThumbnail.value !== null) {
      assetInformation.defaultThumbnail = defaultThumbnail.value
    }

    return assetInformation
  }

  function createAdministrativeInformation (): aasTypes.AdministrativeInformation {
    const administrativeInformation = new aasTypes.AdministrativeInformation()

    // Add optional parameter version
    if (version.value !== null && version.value !== undefined) {
      administrativeInformation.version = version.value
    }

    // Add optional parameter revision
    if (revision.value !== null && revision.value !== undefined) {
      administrativeInformation.revision = revision.value
    }

    // Add optional parameter creator
    if (creator.value !== null && creator.value !== undefined) {
      administrativeInformation.creator = creator.value
    }

    // Add optional parameter templateId
    if (templateId.value !== null && templateId.value !== undefined) {
      administrativeInformation.templateId = templateId.value
    }

    return administrativeInformation
  }

  async function saveAAS (): Promise<void> {
    if (AASId.value === null) return

    const previousAssetLinks = props.newShell ? [] : [...initialDiscoveryAssetLinks.value]

    const assetInformation = createAssetInformation()

    const administrativeInformation = createAdministrativeInformation()

    // Create new AAS if newShell is true
    if (props.newShell || AASObject.value === undefined) {
      AASObject.value = new aasTypes.AssetAdministrationShell(AASId.value, assetInformation)
    } else {
      // Update existing AAS
      AASObject.value.assetInformation = assetInformation
    }

    // Add optional parameter category
    AASObject.value.category = AASCategory.value

    // Add optional parameter idShort
    if (AASIdShort.value !== null) {
      AASObject.value.idShort = AASIdShort.value
    }

    // Add optional parameter displayName
    if (displayName.value !== null) {
      AASObject.value.displayName = displayName.value
    }

    // Add optional parameter description
    if (description.value !== null) {
      AASObject.value.description = description.value
    }

    // Add optional parameter administration
    if (Object.values(administrativeInformation).some(value => value !== null)) {
      AASObject.value.administration = administrativeInformation
    }

    AASObject.value.derivedFrom = derivedFrom.value
    AASObject.value.embeddedDataSpecifications = embeddedDataSpecifications.value
    // extensions are out of scope
    // TODO Add Submodels

    const verificationResult = verifyForEditor(AASObject.value, { maxErrors: 10 })
    if (!verificationResult.isValid) {
      const summary = buildVerificationSummary(verificationResult)
      const firstFieldErrorEntry = Array.from(verificationResult.fieldErrors.entries())[0]
      const firstFieldError = firstFieldErrorEntry
        ? `${firstFieldErrorEntry[0]}: ${firstFieldErrorEntry[1]}`
        : undefined
      const firstError = verificationResult.globalErrors[0] ?? firstFieldError
      navigationStore.dispatchSnackbar({
        status: true,
        timeout: 10_000,
        color: 'error',
        btnColor: 'buttonText',
        baseError: 'AAS validation failed',
        extendedError: firstError ? `${summary} ${firstError}` : summary,
      })
      return
    }

    if (props.newShell) {
      // Create new AAS
      await postAas(AASObject.value)
      await syncAasDescriptorAndDiscovery(AASObject.value, true, previousAssetLinks)
      // Upload default thumbnail
      if (fileThumbnail.value !== undefined) {
        await putThumbnail(fileThumbnail.value, AASObject.value.id)
      }

      const query = structuredClone(route.query)
      query.aas = await getAasEndpointById(AASObject.value.id)
      if (Object.hasOwn(query, 'path')) delete query.path

      await router.push({ query: query })
      navigationStore.dispatchTriggerAASListReload() // Reload AAS List
    } else {
      // Update existing AAS
      await putAas(AASObject.value)
      await syncAasDescriptorAndDiscovery(AASObject.value, false, previousAssetLinks)
      // Upload default thumbnail
      if (fileThumbnail.value !== undefined) {
        await putThumbnail(fileThumbnail.value, AASObject.value.id)
      }
      if (AASObject.value.id === selectedAAS.value.id) {
        await fetchAndDispatchAasById(AASObject.value.id)
      }
      navigationStore.dispatchTriggerAASListReload() // Reload AAS List
    }
    clearForm()
    editAASDialog.value = false
  }

  async function syncAasDescriptorAndDiscovery (
    aas: aasTypes.AssetAdministrationShell,
    isCreate: boolean,
    previousAssetLinks: Array<{ name: string, value: string }>,
  ): Promise<void> {
    const warnings: string[] = []

    if (!aasRepoHasRegistryIntegration.value) {
      try {
        const jsonAAS = jsonization.toJsonable(aas)
        const existingDescriptor = await fetchAasDescriptorById(aas.id)
        const fallbackAasEndpoint = getAasRepoEndpointById(aas.id)
        const endpoints
          = Array.isArray(existingDescriptor?.endpoints) && existingDescriptor.endpoints.length > 0
            ? existingDescriptor.endpoints
            : createEndpoints(fallbackAasEndpoint, 'AAS-3.0')
        const descriptor = createDescriptorFromAAS(jsonAAS, endpoints)
        const success = isCreate
          ? (await postAasDescriptor(descriptor)) || (await putAasDescriptor(descriptor))
          : (await putAasDescriptor(descriptor)) || (await postAasDescriptor(descriptor))

        if (!success) {
          warnings.push(`Failed to synchronize AAS descriptor for '${aas.id}'.`)
        }
      } catch (error) {
        warnings.push(
          `Failed to synchronize AAS descriptor for '${aas.id}': ${error instanceof Error ? error.message : String(error)}`,
        )
      }
    }

    if (!aasRegistryHasDiscoveryIntegration.value) {
      try {
        const assetLinks = createAssetLinksFromAssetInformation(
          aas.assetInformation?.globalAssetId,
          aas.assetInformation?.specificAssetIds,
        )

        if (isCreate) {
          if (assetLinks.length > 0) {
            const success = await upsertAssetLinksForAas(aas.id, assetLinks)
            if (!success) {
              warnings.push(`Failed to synchronize discovery asset links for '${aas.id}'.`)
            }
          }
        } else {
          const linksChanged = !areAssetLinksEqual(previousAssetLinks, assetLinks)

          if (linksChanged) {
            if (assetLinks.length === 0) {
              const deleteSuccess = await deleteAssetLinksForAas(aas.id)
              if (!deleteSuccess) {
                warnings.push(`Failed to remove discovery asset links for '${aas.id}'.`)
              }
            } else {
              const upsertSuccess = await upsertAssetLinksForAas(aas.id, assetLinks)
              if (!upsertSuccess) {
                warnings.push(`Failed to synchronize discovery asset links for '${aas.id}'.`)
              }
            }
          }
        }
      } catch (error) {
        warnings.push(
          `Failed to synchronize discovery asset links for '${aas.id}': ${error instanceof Error ? error.message : String(error)}`,
        )
      }
    }

    if (warnings.length > 0) {
      navigationStore.dispatchSnackbar({
        status: true,
        timeout: 10_000,
        color: 'warning',
        btnColor: 'buttonText',
        baseError: 'AAS saved with synchronization warnings.',
        extendedError: warnings.join('\n'),
      })
    }
  }

  function areAssetLinksEqual (
    left: Array<{ name: string, value: string }>,
    right: Array<{ name: string, value: string }>,
  ): boolean {
    if (left.length !== right.length) return false

    const normalize = (links: Array<{ name: string, value: string }>): Array<string> =>
      links.map(link => `${link.name}\u0000${link.value}`).sort((a, b) => a.localeCompare(b))

    const leftNormalized = normalize(left)
    const rightNormalized = normalize(right)

    return leftNormalized.every((entry, index) => entry === rightNormalized[index])
  }

  function createEndpoints (href: string, type: string): Array<Endpoint> {
    let protocol: string | null = null
    try {
      const url = new URL(href)
      protocol = url.protocol.replace(/:$/, '')
    } catch {
      // If href is not a valid absolute URL, keep protocol null.
    }

    const protocolInformation = new ProtocolInformation(href, null, protocol)
    return [new Endpoint(type, protocolInformation)]
  }

  function closeDialog (): void {
    clearForm()
    editAASDialog.value = false
  }

  function clearForm (): void {
    // Reset all values
    AASId.value = generateUUID()
    AASIdShort.value = null
    displayName.value = null
    description.value = null
    AASCategory.value = null
    version.value = null
    revision.value = null
    creator.value = null
    templateId.value = null
    derivedFrom.value = null
    assetKind.value = aasTypes.AssetKind.Instance
    globalAssetId.value = null
    specificAssetIds.value = null
    assetType.value = null
    defaultThumbnail.value = null
    embeddedDataSpecifications.value = null
    initialDiscoveryAssetLinks.value = []
    // Reset state of expansion panels
    openPanels.value = [0, 3]
  }

  function handleFileThumbnail (file: File | undefined): void {
    fileThumbnail.value = file
  }
</script>
