<template>
  <CatenaXplorerNavigationDrawer
    v-if="mdAndUp"
    v-model:asset-id-name="assetIdName"
    v-model:asset-id-value="assetIdValue"
    :asset-id-name-suggestions="assetIdNameSuggestions"
    :copy-json-icon="copyJsonIcon"
    :curl-command="descriptorCurlCommand"
    :curl-note="descriptorCurlNote"
    :descriptors="descriptors"
    :dtr-url="dtrUrl"
    :edc-access-enabled="isEdcAccessMode"
    :edc-configured-partners="configuredEdcPartners"
    :edc-counter-party-address="edcCounterPartyAddress"
    :edc-counter-party-id="edcCounterPartyId"
    :edc-partner-id="selectedEdcPartnerId"
    :edc-partner-ready="edcPartnerReady"
    :edc-recent-partners="recentEdcPartnerOptions"
    :has-more-descriptors="hasMoreDescriptors"
    :infrastructure-editable="infrastructureEditable"
    :inline-error="inlineError"
    :is-loading="isLoading"
    :is-loading-more="isLoadingMoreDescriptors"
    :read-only="isEdcAccessMode"
    :runtime-partner-loaded="runtimePartnerLoaded"
    :selected-descriptor-id="selectedDescriptorId"
    @clear="clearSearch"
    @copy-json="copyDescriptorAsJson"
    @create="openCreateDescriptorDialog"
    @delete="openDeleteDescriptorDialog"
    @duplicate="duplicateDescriptor"
    @edit="openEditDescriptorDialog"
    @load-more="loadMoreDescriptors"
    @load-partner="loadCurrentEdcPartner"
    @save-partner="savePartnerDialog = true"
    @search="searchDescriptors"
    @select="handleDescriptorSelect"
    @update:edc-counter-party-address="handleEdcCounterPartyAddressUpdate"
    @update:edc-counter-party-id="handleEdcCounterPartyIdUpdate"
    @update:edc-partner-id="handleEdcPartnerUpdate"
  />

  <v-container class="pa-2" fluid>
    <div
      class="catena-xplorer-page mx-auto w-100"
      :class="{ 'catena-xplorer-page--desktop': mdAndUp }"
    >
      <template v-if="mdAndUp">
        <main class="catena-xplorer-details">
          <DescriptorDetails
            :descriptor="selectedDescriptor"
            :edc-access-enabled="isEdcAccessMode"
            :edc-submodels="edcSubmodels"
            @load-edc-submodel="loadEdcSubmodel"
          />
        </main>
      </template>

      <template v-else>
        <v-sheet border class="mb-3 overflow-hidden" rounded="lg">
          <v-tabs
            v-model="mobileView"
            color="primary"
            density="comfortable"
            grow
          >
            <v-tab value="browse">
              <v-icon class="me-2" icon="mdi-format-list-bulleted" size="small" />
              Browse
            </v-tab>

            <v-tab value="details">
              <v-icon class="me-2" icon="mdi-cube-scan" size="small" />
              Details
            </v-tab>
          </v-tabs>
        </v-sheet>

        <v-window v-model="mobileView" :touch="false">
          <v-window-item value="browse">
            <DescriptorBrowser
              v-model:asset-id-name="assetIdName"
              v-model:asset-id-value="assetIdValue"
              :asset-id-name-suggestions="assetIdNameSuggestions"
              :copy-json-icon="copyJsonIcon"
              create-action-placement="fixed"
              :curl-command="descriptorCurlCommand"
              :curl-note="descriptorCurlNote"
              :descriptors="descriptors"
              :dtr-url="dtrUrl"
              :edc-access-enabled="isEdcAccessMode"
              :edc-configured-partners="configuredEdcPartners"
              :edc-counter-party-address="edcCounterPartyAddress"
              :edc-counter-party-id="edcCounterPartyId"
              :edc-partner-id="selectedEdcPartnerId"
              :edc-partner-ready="edcPartnerReady"
              :edc-recent-partners="recentEdcPartnerOptions"
              :has-more-descriptors="hasMoreDescriptors"
              :infrastructure-editable="infrastructureEditable"
              :inline-error="inlineError"
              :is-loading="isLoading"
              :is-loading-more="isLoadingMoreDescriptors"
              :read-only="isEdcAccessMode"
              :runtime-partner-loaded="runtimePartnerLoaded"
              :selected-descriptor-id="selectedDescriptorId"
              @clear="clearSearch"
              @copy-json="copyDescriptorAsJson"
              @create="openCreateDescriptorDialog"
              @delete="openDeleteDescriptorDialog"
              @duplicate="duplicateDescriptor"
              @edit="openEditDescriptorDialog"
              @load-more="loadMoreDescriptors"
              @load-partner="loadCurrentEdcPartner"
              @save-partner="savePartnerDialog = true"
              @search="searchDescriptors"
              @select="handleDescriptorSelect"
              @update:edc-counter-party-address="handleEdcCounterPartyAddressUpdate"
              @update:edc-counter-party-id="handleEdcCounterPartyIdUpdate"
              @update:edc-partner-id="handleEdcPartnerUpdate"
            />
          </v-window-item>

          <v-window-item value="details">
            <v-btn
              class="mb-3"
              prepend-icon="mdi-arrow-left"
              variant="text"
              @click="mobileView = 'browse'"
            >
              Browse descriptors
            </v-btn>

            <DescriptorDetails
              :descriptor="selectedDescriptor"
              :edc-access-enabled="isEdcAccessMode"
              :edc-submodels="edcSubmodels"
              @load-edc-submodel="loadEdcSubmodel"
            />
          </v-window-item>
        </v-window>
      </template>

      <DescriptorEditDialog
        v-model="descriptorDialog"
        :asset-id-name-suggestions="assetIdNameSuggestions"
        :descriptor="descriptorToEdit"
        :loading="isSavingDescriptor"
        :mode="descriptorDialogMode"
        @save="saveDescriptor"
      />

      <DeleteDescriptorDialog
        v-model="deleteDescriptorDialog"
        :descriptor="descriptorToDelete"
        :loading="isDeletingDescriptor"
        @delete="deleteDescriptor"
      />

      <CatenaXPartnerDialog
        v-model="savePartnerDialog"
        :default-partner-id="selectedEdcConfig?.defaultPartnerId"
        :existing-partners="configuredEdcPartners"
        :partner="currentEdcPartner"
        title="Save business partner"
        @save="saveRuntimePartner"
      />
    </div>
  </v-container>
</template>

<script lang="ts" setup>
  import type { AasListPageResult, AssetIdFilter } from '@/composables/Client/AASRegistryClient'
  import type { CatenaXEdcDtrMetadata } from '@/composables/Client/CatenaXEdcClient'
  import type { EdcSubmodelViewState } from '@/pages/modules/CatenaXplorer/catenaXplorerUtils'
  import type { CatenaXPartner, InfrastructureConfig } from '@/types/Infrastructure'
  import { computed, onMounted, ref, toRaw, watch } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useDisplay } from 'vuetify'
  import CatenaXPartnerDialog from '@/components/AppNavigation/Settings/CatenaXPartnerDialog.vue'
  import { useAASRegistryClient } from '@/composables/Client/AASRegistryClient'
  import { useCatenaXEdcClient } from '@/composables/Client/CatenaXEdcClient'
  import { parseNextCursor } from '@/composables/Client/PaginationUtils'
  import { useClipboardUtil } from '@/composables/ClipboardUtil'
  import { useIDUtils } from '@/composables/IDUtils'
  import {
    forgetRecentCatenaXPartner,
    getRecentCatenaXPartners,
    rememberRecentCatenaXPartner,
  } from '@/pages/modules/CatenaXplorer/catenaXplorerPartners'
  import {
    buildAssetIdNameSuggestions,
    buildEdcShellDescriptorsCurlCommand,
    buildShellDescriptorEndpointUrl,
    buildShellDescriptorsCurlCommand,
    getAssetIdNameSuggestions,
    getDescriptorKey,
    getSubmodelEdcEndpointInfo,
  } from '@/pages/modules/CatenaXplorer/catenaXplorerUtils'
  import CatenaXplorerNavigationDrawer from '@/pages/modules/CatenaXplorer/components/CatenaXplorerNavigationDrawer.vue'
  import DeleteDescriptorDialog from '@/pages/modules/CatenaXplorer/components/DeleteDescriptorDialog.vue'
  import DescriptorBrowser from '@/pages/modules/CatenaXplorer/components/DescriptorBrowser.vue'
  import DescriptorDetails from '@/pages/modules/CatenaXplorer/components/DescriptorDetails.vue'
  import DescriptorEditDialog from '@/pages/modules/CatenaXplorer/components/DescriptorEditDialog.vue'
  import { useEnvStore } from '@/store/EnvironmentStore'
  import { useInfrastructureStore } from '@/store/InfrastructureStore'
  import { useNavigationStore } from '@/store/NavigationStore'
  import {
    getCatenaXPartnerKey,
    mergeCatenaXPartners,
    normalizeCatenaXPartners,
  } from '@/utils/CatenaXPartnerUtils'
  import { base64Decode } from '@/utils/EncodeDecodeUtils'
  import { getCatenaXAccessMode } from '@/utils/InfrastructureUtils'

  defineOptions({
    inheritAttrs: false,
    moduleTitle: 'CatenaXplorer',
    isDesktopModule: true,
    isMobileModule: true,
    supportedInfrastructureTemplates: ['catena-x'],
  })

  const descriptorEndpointQueryParam = 'descriptor'
  const legacyDescriptorIdQueryParam = 'descriptorId'
  const descriptorPageLimit = 100
  const defaultAssetIdName = 'manufacturerPartId'
  const edcDtrAssetKey = 'DigitalTwinRegistry'

  const route = useRoute()
  const router = useRouter()
  const display = useDisplay()
  const envStore = useEnvStore()
  const infrastructureStore = useInfrastructureStore()
  const navigationStore = useNavigationStore()
  const {
    deleteAasDescriptor,
    fetchAasDescriptorById,
    fetchAasDescriptorListPage,
    postAasDescriptor,
    putAasDescriptor,
  } = useAASRegistryClient()
  const {
    consumeLastRequestFailureDetails: consumeEdcRequestFailureDetails,
    fetchDtrShellDescriptorById,
    fetchDtrShellDescriptors,
    fetchSubmodel,
  } = useCatenaXEdcClient()
  const { copyToClipboard } = useClipboardUtil()
  const { generateIri } = useIDUtils()

  const descriptors = ref<any[]>([])
  const activeAssetIds = ref<AssetIdFilter[] | undefined>(undefined)
  const descriptorPaginationGeneration = ref(0)
  const edcTransferProcessIds = ref<Record<string, string>>({})
  const edcRecentPartners = ref<CatenaXPartner[]>([])
  const edcSubmodels = ref<Record<string, EdcSubmodelViewState>>({})
  const hasMoreDescriptors = ref(false)
  const isLoadingMoreDescriptors = ref(false)
  const knownAssetIdNames = ref<string[]>([])
  const nextDescriptorCursor = ref<string | undefined>(undefined)
  const selectedDescriptorId = ref('')
  const selectedDescriptorFallback = ref<any | null>(null)
  const seenDescriptorCursors = ref(new Set<string>())
  const assetIdName = ref(defaultAssetIdName)
  const assetIdValue = ref('')
  const inlineError = ref('')
  const isLoading = ref(false)
  const descriptorDialog = ref(false)
  const descriptorDialogMode = ref<'create' | 'edit'>('create')
  const descriptorToEdit = ref<Record<string, unknown> | null>(null)
  const isSavingDescriptor = ref(false)
  const deleteDescriptorDialog = ref(false)
  const descriptorToDelete = ref<any | null>(null)
  const isDeletingDescriptor = ref(false)
  const copyJsonIcon = ref('mdi-clipboard-text-outline')
  const mobileView = ref<'browse' | 'details'>('browse')
  const copyJsonIconAsRef = computed(() => copyJsonIcon)
  const selectedEdcPartnerId = ref('')
  const edcCounterPartyId = ref('')
  const edcCounterPartyAddress = ref('')
  const edcProtocol = ref('dataspace-protocol-http')
  const runtimePartnerLoaded = ref(false)
  const edcPartnerReady = ref(false)
  const savePartnerDialog = ref(false)

  const selectedInfrastructure = computed(() => infrastructureStore.getSelectedInfrastructure)
  const isEdcAccessMode = computed(() =>
    selectedInfrastructure.value?.template === 'catena-x'
    && getCatenaXAccessMode(selectedInfrastructure.value) === 'edc',
  )
  const dtrUrl = computed(() => isEdcAccessMode.value ? '' : infrastructureStore.getAASRegistryURL)
  const mdAndUp = computed(() => display.mdAndUp.value)
  const smAndDown = computed(() => display.smAndDown.value)
  const assetIdNameSuggestions = computed(() => buildAssetIdNameSuggestions(descriptors.value, knownAssetIdNames.value))
  const selectedDescriptor = computed(() => {
    const descriptorId = selectedDescriptorId.value.trim()
    if (descriptorId === '') {
      return null
    }

    return descriptors.value.find(descriptor => descriptor?.id === descriptorId)
      ?? (selectedDescriptorFallback.value?.id === descriptorId ? selectedDescriptorFallback.value : null)
  })
  const selectedEdcConfig = computed(() => {
    return infrastructureStore.getSelectedInfrastructure?.catenaX?.edc ?? null
  })
  const edcProxyId = computed(() => selectedEdcConfig.value?.proxyId?.trim() ?? '')
  const configuredEdcPartners = computed(() => normalizeCatenaXPartners(selectedEdcConfig.value?.partners ?? []))
  const recentEdcPartnerOptions = computed(() => {
    const mergedPartners = mergeCatenaXPartners(configuredEdcPartners.value, edcRecentPartners.value)
    return mergedPartners.slice(configuredEdcPartners.value.length)
  })
  const edcPartnerOptions = computed(() => [
    ...configuredEdcPartners.value,
    ...recentEdcPartnerOptions.value,
  ])
  const infrastructureEditable = computed(() => envStore.getEndpointConfigAvailable)
  const currentEdcPartner = computed<Partial<CatenaXPartner>>(() => ({
    id: selectedEdcPartnerId.value,
    counterPartyId: edcCounterPartyId.value,
    counterPartyAddress: edcCounterPartyAddress.value,
  }))
  const curlAuthorizationHeader = computed(() => {
    const securityType = selectedInfrastructure.value?.auth?.securityType
    if (securityType === 'Basic Authentication') {
      return 'Basic <BASE64_USERNAME_PASSWORD>'
    }
    if (securityType === 'Bearer Token' || securityType === 'OAuth2') {
      const configuredPrefix = envStore.getAuthorizationPrefix.trim()
      const prefix = configuredPrefix === '' || configuredPrefix.includes('PLACEHOLDER')
        ? 'Bearer'
        : configuredPrefix
      return `${prefix} <ACCESS_TOKEN>`
    }
    return undefined
  })
  const descriptorCurlCommand = computed(() => {
    if (!isEdcAccessMode.value) {
      return buildShellDescriptorsCurlCommand(
        dtrUrl.value,
        assetIdName.value,
        assetIdValue.value,
        curlAuthorizationHeader.value,
      )
    }

    return buildEdcShellDescriptorsCurlCommand(
      getEdcDtrDescriptorsEndpointUrl(),
      edcCounterPartyId.value,
      edcCounterPartyAddress.value,
      edcProtocol.value,
      assetIdName.value,
      assetIdValue.value,
      getEdcTransferProcessId(edcDtrAssetKey, edcCounterPartyAddress.value),
      curlAuthorizationHeader.value,
    )
  })
  const descriptorCurlNote = computed(() => {
    if (curlAuthorizationHeader.value) {
      return 'Replace the authorization placeholder before running this command. Stored credentials are never shown in the preview.'
    }
    return isEdcAccessMode.value
      ? 'This command calls the CatenaXplorer BFF, which applies its server-side EDC credentials.'
      : undefined
  })

  onMounted(() => {
    selectedDescriptorId.value = getRouteDescriptorId()
    loadRecentEdcPartners()
    selectDefaultEdcPartner()
    reloadDescriptors()
  })

  watch(
    () => [
      route.query[descriptorEndpointQueryParam],
      route.query[legacyDescriptorIdQueryParam],
    ],
    () => {
      selectedDescriptorId.value = getRouteDescriptorId()
      void ensureSelectedDescriptorLoaded()
    },
  )

  watch(
    () => dtrUrl.value,
    () => {
      selectedDescriptorId.value = getRouteDescriptorId()
      reloadDescriptors()
    },
  )

  watch(
    () => [
      edcProxyId.value,
      edcProtocol.value,
      isEdcAccessMode.value,
    ],
    () => {
      resetEdcSessionState()
      edcPartnerReady.value = false
      runtimePartnerLoaded.value = false
      loadRecentEdcPartners()
      selectDefaultEdcPartner()
      selectedDescriptorId.value = getRouteDescriptorId()
      reloadDescriptors()
    },
  )

  watch(
    () => configuredEdcPartners.value.map(partner => [
      partner.id,
      partner.name,
      partner.counterPartyId,
      partner.counterPartyAddress,
    ]),
    () => syncSelectedEdcPartnerAfterConfigChange(),
    { deep: true },
  )

  async function reloadDescriptors (): Promise<void> {
    await loadDescriptors()
  }

  async function searchDescriptors (): Promise<void> {
    if (isEdcAccessMode.value && !edcPartnerReady.value) {
      inlineError.value = 'Load descriptors for the selected business partner before searching.'
      return
    }

    const name = assetIdName.value.trim()
    const value = assetIdValue.value.trim()

    if (name === '' || value === '') {
      inlineError.value = 'Enter both an asset ID name and value.'
      return
    }

    await loadDescriptors([{ name, value }])
  }

  async function clearSearch (): Promise<void> {
    assetIdName.value = defaultAssetIdName
    assetIdValue.value = ''
    if (isEdcAccessMode.value && !edcPartnerReady.value) {
      return
    }
    await loadDescriptors()
  }

  async function loadCurrentEdcPartner (): Promise<void> {
    await loadDescriptors()
  }

  async function loadDescriptors (assetIds?: Array<{ name: string, value: string }>): Promise<void> {
    inlineError.value = ''

    if (!isDescriptorSourceConfigured()) {
      descriptors.value = []
      selectedDescriptorId.value = ''
      selectedDescriptorFallback.value = null
      resetDescriptorPaginationState()
      return
    }

    const generation = beginDescriptorPagination(assetIds)
    isLoading.value = true

    try {
      const page = await fetchDescriptorListPage({
        assetIds: activeAssetIds.value,
        generation,
        limit: descriptorPageLimit,
      })

      if (generation !== descriptorPaginationGeneration.value) {
        return
      }

      descriptors.value = page.items
      rememberAssetIdNames(page.items)
      updateDescriptorPaginationState(page)
      selectedDescriptorId.value = getRouteDescriptorId()
      if (selectedDescriptorId.value !== '' && getRouteQueryString(legacyDescriptorIdQueryParam) !== '') {
        updateSelectedDescriptorRoute(selectedDescriptorId.value)
      }
      await ensureSelectedDescriptorLoaded(generation)
    } catch (error) {
      if (generation !== descriptorPaginationGeneration.value) {
        return
      }
      console.warn(error)
      descriptors.value = []
      selectedDescriptorId.value = getRouteDescriptorId()
      selectedDescriptorFallback.value = null
      resetDescriptorPaginationState()
      inlineError.value = getErrorMessage(error, 'Could not load AAS descriptors from the Digital Twin Registry.')
    } finally {
      if (generation === descriptorPaginationGeneration.value) {
        isLoading.value = false
      }
    }
  }

  async function loadMoreDescriptors (): Promise<void> {
    if (!hasMoreDescriptors.value || isLoading.value || isLoadingMoreDescriptors.value) {
      return
    }

    const generation = descriptorPaginationGeneration.value
    isLoadingMoreDescriptors.value = true

    try {
      const page = await fetchDescriptorListPage({
        assetIds: activeAssetIds.value,
        cursor: nextDescriptorCursor.value,
        generation,
        limit: descriptorPageLimit,
      })

      if (generation !== descriptorPaginationGeneration.value) {
        return
      }

      appendDescriptorPageItems(page.items)
      rememberAssetIdNames(page.items)
      updateDescriptorPaginationState(page)
      await ensureSelectedDescriptorLoaded(generation)
    } catch (error) {
      if (generation !== descriptorPaginationGeneration.value) {
        return
      }
      console.warn(error)
      inlineError.value = getErrorMessage(error, 'Could not load more AAS descriptors from the Digital Twin Registry.')
    } finally {
      if (generation === descriptorPaginationGeneration.value) {
        isLoadingMoreDescriptors.value = false
      }
    }
  }

  async function fetchDescriptorListPage (options: {
    assetIds?: AssetIdFilter[]
    cursor?: string
    generation?: number
    limit?: number
  }): Promise<AasListPageResult<any>> {
    if (!isEdcAccessMode.value) {
      return fetchAasDescriptorListPage(options)
    }

    const edcRequest = buildEdcDescriptorRequest()
    if (!edcRequest) {
      throw new Error(inlineError.value || 'The selected Catena-X infrastructure is not configured for EDC descriptor access.')
    }

    const response = await fetchDtrShellDescriptors(edcProxyId.value, {
      ...edcRequest,
      assetIds: options.assetIds,
      cursor: options.cursor,
      limit: options.limit,
      transferProcessId: getEdcTransferProcessId(edcDtrAssetKey, edcRequest.counterPartyAddress),
    })

    if (!response) {
      throw new Error(buildEdcFailureMessage('Could not load AAS descriptors through EDC.'))
    }

    if (
      options.generation !== undefined
      && options.generation !== descriptorPaginationGeneration.value
    ) {
      return {
        items: [],
        hasMore: false,
      }
    }

    const requestPartnerKey = getCatenaXPartnerKey(edcRequest)
    const wasRuntimePartner = !configuredEdcPartners.value.some(partner =>
      getCatenaXPartnerKey(partner) === requestPartnerKey,
    )
    rememberCurrentEdcPartner(edcRequest)
    runtimePartnerLoaded.value = runtimePartnerLoaded.value || wasRuntimePartner
    edcPartnerReady.value = true
    rememberEdcTransferProcessId(edcDtrAssetKey, response.edc, edcRequest.counterPartyAddress)
    const data = response.data as any
    const nextCursor = parseNextCursor(data)

    return {
      items: Array.isArray(data?.result) ? data.result : [],
      nextCursor,
      hasMore: nextCursor !== undefined,
      pagingMetadata: data?.paging_metadata ?? data?.pagingMetadata,
    }
  }

  async function fetchDescriptorById (descriptorId: string, generation?: number): Promise<any> {
    if (!isEdcAccessMode.value) {
      return fetchAasDescriptorById(descriptorId)
    }

    const edcRequest = buildEdcDescriptorRequest()
    if (!edcRequest) {
      return {}
    }

    const response = await fetchDtrShellDescriptorById(edcProxyId.value, {
      ...edcRequest,
      descriptorId,
      transferProcessId: getEdcTransferProcessId(edcDtrAssetKey, edcRequest.counterPartyAddress),
    })

    if (!response) {
      return {}
    }

    if (generation !== undefined && generation !== descriptorPaginationGeneration.value) {
      return {}
    }

    rememberCurrentEdcPartner(edcRequest)
    rememberEdcTransferProcessId(edcDtrAssetKey, response.edc, edcRequest.counterPartyAddress)
    return response.data
  }

  async function loadEdcSubmodel (submodelDescriptor: any): Promise<void> {
    if (!isEdcAccessMode.value) {
      return
    }

    const generation = descriptorPaginationGeneration.value
    const stateKey = getDescriptorKey(submodelDescriptor)
    const endpoint = getSubmodelEdcEndpointInfo(submodelDescriptor)
    if (!endpoint) {
      updateEdcSubmodelState(stateKey, {
        error: 'This submodel descriptor has no complete DSP endpoint information.',
        isLoading: false,
      })
      return
    }

    const edcRequest = buildEdcDescriptorRequest()
    if (!edcRequest) {
      return
    }

    updateEdcSubmodelState(stateKey, {
      error: '',
      isLoading: true,
    })

    try {
      const response = await fetchSubmodel(edcProxyId.value, {
        ...edcRequest,
        counterPartyAddress: endpoint.dspEndpoint,
        submodelDescriptor,
        transferProcessId: getEdcTransferProcessId(endpoint.assetId, endpoint.dspEndpoint),
      })

      if (generation !== descriptorPaginationGeneration.value) {
        return
      }

      if (!response) {
        updateEdcSubmodelState(stateKey, {
          error: buildEdcFailureMessage('Could not load the Submodel through EDC.'),
          isLoading: false,
        })
        return
      }

      rememberCurrentEdcPartner()
      rememberEdcTransferProcessId(endpoint.assetId, response.edc, endpoint.dspEndpoint)
      updateEdcSubmodelState(stateKey, {
        data: response.data,
        error: '',
        isLoading: false,
      })
    } catch (error) {
      if (generation !== descriptorPaginationGeneration.value) {
        return
      }
      console.warn(error)
      updateEdcSubmodelState(stateKey, {
        error: buildEdcFailureMessage('Could not load the Submodel through EDC.'),
        isLoading: false,
      })
    }
  }

  function buildEdcFailureMessage (fallback: string): string {
    const details = consumeEdcRequestFailureDetails()?.trim()
    if (details?.includes('counterPartyAddress is not allowed')) {
      return `${fallback}\n${details}\nAsk the deployment administrator to add this DSP address to CX_EDC_ALLOWED_COUNTER_PARTY_ADDRESSES.`
    }
    return details ? `${fallback}\n${details}` : fallback
  }

  function getErrorMessage (error: unknown, fallback: string): string {
    if (error instanceof Error && error.message.trim() !== '') {
      return error.message
    }

    return fallback
  }

  function isDescriptorSourceConfigured (): boolean {
    if (!isEdcAccessMode.value) {
      if (dtrUrl.value.trim() === '') {
        inlineError.value = 'The selected Catena-X infrastructure has no Digital Twin Registry URL.'
        return false
      }
      return true
    }

    if (edcProxyId.value === '') {
      inlineError.value = 'The selected Catena-X infrastructure has no EDC proxy ID.'
      return false
    }

    if (edcCounterPartyId.value.trim() === '' || edcCounterPartyAddress.value.trim() === '') {
      inlineError.value = 'Enter an EDC counterparty ID and DSP address.'
      return false
    }

    return true
  }

  function buildEdcDescriptorRequest (): {
    counterPartyId: string
    counterPartyAddress: string
    protocol: string
  } | null {
    if (!isDescriptorSourceConfigured()) {
      return null
    }

    return {
      counterPartyId: edcCounterPartyId.value.trim(),
      counterPartyAddress: edcCounterPartyAddress.value.trim(),
      protocol: edcProtocol.value.trim(),
    }
  }

  function getEdcTransferProcessId (assetId: string, counterPartyAddress: string): string | undefined {
    return edcTransferProcessIds.value[buildEdcTransferProcessKey(assetId, counterPartyAddress)] || undefined
  }

  function rememberEdcTransferProcessId (
    assetId: string,
    metadata: CatenaXEdcDtrMetadata,
    counterPartyAddress: string,
  ): void {
    const transferProcessId = metadata.transferProcessId?.trim()
    if (!transferProcessId) {
      return
    }

    edcTransferProcessIds.value = {
      ...edcTransferProcessIds.value,
      [buildEdcTransferProcessKey(assetId, counterPartyAddress)]: transferProcessId,
    }
  }

  function buildEdcTransferProcessKey (assetId: string, counterPartyAddress: string): string {
    return JSON.stringify([
      edcProxyId.value,
      edcCounterPartyId.value.trim(),
      counterPartyAddress.trim(),
      edcProtocol.value.trim(),
      assetId.trim(),
    ])
  }

  function getEdcDtrDescriptorsEndpointUrl (): string {
    const configuredBasePath = envStore.getEnvBasePath.trim()
    let basePath = '/'
    if (configuredBasePath !== '' && !configuredBasePath.includes('PLACEHOLDER')) {
      basePath = configuredBasePath.endsWith('/') ? configuredBasePath : `${configuredBasePath}/`
    }
    const relativeUrl = `${basePath}api/catena-x/edc/${encodeURIComponent(edcProxyId.value)}/dtr/shell-descriptors`
    return new URL(relativeUrl, window.location.origin).toString()
  }

  function resetEdcSessionState (): void {
    edcTransferProcessIds.value = {}
    edcSubmodels.value = {}
  }

  function prepareEdcPartnerChange (): void {
    const hadSelectedDescriptor = selectedDescriptorId.value !== ''
      || getRouteQueryString(descriptorEndpointQueryParam) !== ''
      || getRouteQueryString(legacyDescriptorIdQueryParam) !== ''
    descriptorPaginationGeneration.value += 1
    isLoading.value = false
    isLoadingMoreDescriptors.value = false
    resetEdcSessionState()
    runtimePartnerLoaded.value = false
    edcPartnerReady.value = false
    descriptors.value = []
    selectedDescriptorId.value = ''
    selectedDescriptorFallback.value = null
    inlineError.value = ''
    resetDescriptorPaginationState()
    if (hadSelectedDescriptor) {
      updateSelectedDescriptorRoute('')
    }
  }

  function updateEdcSubmodelState (key: string, patch: EdcSubmodelViewState): void {
    edcSubmodels.value = {
      ...edcSubmodels.value,
      [key]: {
        ...edcSubmodels.value[key],
        ...patch,
      },
    }
  }

  function loadRecentEdcPartners (): void {
    const proxyId = edcProxyId.value
    if (!proxyId) {
      edcRecentPartners.value = []
      return
    }

    for (const partner of configuredEdcPartners.value) {
      forgetRecentCatenaXPartner(proxyId, partner)
    }
    edcRecentPartners.value = getRecentCatenaXPartners(proxyId)
  }

  function selectDefaultEdcPartner (): void {
    if (!isEdcAccessMode.value) {
      return
    }

    const defaultPartnerId = selectedEdcConfig.value?.defaultPartnerId?.trim() ?? ''
    const selectedPartner = edcPartnerOptions.value.find(partner => partner.id === selectedEdcPartnerId.value)
    const defaultPartner = edcPartnerOptions.value.find(partner => partner.id === defaultPartnerId)
      ?? edcPartnerOptions.value[0]

    const targetPartner = selectedPartner ?? defaultPartner
    if (!targetPartner) {
      selectedEdcPartnerId.value = ''
      if (edcCounterPartyId.value === '') {
        edcCounterPartyId.value = selectedEdcConfig.value?.defaultCounterPartyId ?? ''
      }
      if (edcCounterPartyAddress.value === '') {
        edcCounterPartyAddress.value = selectedEdcConfig.value?.defaultCounterPartyAddress ?? ''
      }
      return
    }

    selectedEdcPartnerId.value = targetPartner.id
    edcCounterPartyId.value = targetPartner.counterPartyId
    edcCounterPartyAddress.value = targetPartner.counterPartyAddress
  }

  function handleEdcPartnerUpdate (partnerId: string): void {
    selectedEdcPartnerId.value = partnerId
    const partner = edcPartnerOptions.value.find(candidate => candidate.id === partnerId)
    if (!partner) {
      edcCounterPartyId.value = ''
      edcCounterPartyAddress.value = ''
      prepareEdcPartnerChange()
      return
    }

    edcCounterPartyId.value = partner.counterPartyId
    edcCounterPartyAddress.value = partner.counterPartyAddress
    prepareEdcPartnerChange()
  }

  function handleEdcCounterPartyIdUpdate (value: string): void {
    edcCounterPartyId.value = value
    selectedEdcPartnerId.value = ''
    prepareEdcPartnerChange()
  }

  function handleEdcCounterPartyAddressUpdate (value: string): void {
    edcCounterPartyAddress.value = value
    selectedEdcPartnerId.value = ''
    prepareEdcPartnerChange()
  }

  function rememberCurrentEdcPartner (
    partner: Pick<CatenaXPartner, 'counterPartyId' | 'counterPartyAddress'> = currentEdcPartner.value as CatenaXPartner,
  ): void {
    const partnerKey = getCatenaXPartnerKey(partner)
    if (configuredEdcPartners.value.some(configuredPartner =>
      getCatenaXPartnerKey(configuredPartner) === partnerKey,
    )) {
      return
    }

    const rememberedPartner = rememberRecentCatenaXPartner(edcProxyId.value, {
      id: getCatenaXPartnerKey(currentEdcPartner.value as CatenaXPartner) === partnerKey
        ? selectedEdcPartnerId.value
        : '',
      ...partner,
    })

    if (!rememberedPartner) {
      return
    }

    if (getCatenaXPartnerKey(currentEdcPartner.value as CatenaXPartner) === partnerKey) {
      selectedEdcPartnerId.value = rememberedPartner.id
    }
    loadRecentEdcPartners()
  }

  function syncSelectedEdcPartnerAfterConfigChange (): void {
    const selectedPartner = edcPartnerOptions.value.find(partner => partner.id === selectedEdcPartnerId.value)
    if (!selectedPartner) {
      selectDefaultEdcPartner()
      prepareEdcPartnerChange()
      return
    }

    const connectionChanged = selectedPartner.counterPartyId !== edcCounterPartyId.value
      || selectedPartner.counterPartyAddress !== edcCounterPartyAddress.value
    edcCounterPartyId.value = selectedPartner.counterPartyId
    edcCounterPartyAddress.value = selectedPartner.counterPartyAddress
    if (connectionChanged) {
      prepareEdcPartnerChange()
    }
  }

  function saveRuntimePartner (partner: CatenaXPartner, useAsDefault: boolean): void {
    const infrastructure = selectedInfrastructure.value
    const edc = infrastructure?.catenaX?.edc
    if (!infrastructure || !edc || !infrastructureEditable.value) {
      return
    }

    const updatedInfrastructure = structuredClone(toRaw(infrastructure))
    const updatedEdc = updatedInfrastructure.catenaX!.edc!
    const partnerKey = getCatenaXPartnerKey(partner)
    const existingPartners = normalizeCatenaXPartners(updatedEdc.partners ?? [])
    const matchingPartner = existingPartners.find(candidate => getCatenaXPartnerKey(candidate) === partnerKey)
    const savedPartner = {
      ...partner,
      id: matchingPartner?.id ?? partner.id,
    }
    updatedEdc.partners = [
      ...existingPartners.filter(candidate => getCatenaXPartnerKey(candidate) !== partnerKey),
      savedPartner,
    ]

    if (useAsDefault || !updatedEdc.defaultPartnerId) {
      updatedEdc.defaultPartnerId = savedPartner.id
    }
    synchronizeLegacyDefaultPartner(updatedEdc)
    selectedEdcPartnerId.value = savedPartner.id
    infrastructureStore.dispatchUpdateInfrastructure(updatedInfrastructure)
    navigationStore.dispatchSnackbar({
      status: true,
      timeout: 5000,
      color: 'success',
      btnColor: 'buttonText',
      text: `Saved partner "${savedPartner.name || savedPartner.counterPartyId}".`,
    })
  }

  function synchronizeLegacyDefaultPartner (edc: NonNullable<NonNullable<InfrastructureConfig['catenaX']>['edc']>): void {
    const defaultPartner = edc.partners?.find(partner => partner.id === edc.defaultPartnerId)
    edc.defaultCounterPartyId = defaultPartner?.counterPartyId
    edc.defaultCounterPartyAddress = defaultPartner?.counterPartyAddress
  }

  function beginDescriptorPagination (assetIds?: AssetIdFilter[]): number {
    descriptorPaginationGeneration.value += 1
    descriptors.value = []
    selectedDescriptorFallback.value = null
    activeAssetIds.value = normalizeAssetIds(assetIds)
    resetDescriptorPaginationState()
    return descriptorPaginationGeneration.value
  }

  function resetDescriptorPaginationState (): void {
    hasMoreDescriptors.value = false
    isLoadingMoreDescriptors.value = false
    nextDescriptorCursor.value = undefined
    seenDescriptorCursors.value = new Set()
  }

  function updateDescriptorPaginationState (page: AasListPageResult<any>): void {
    const cursor = page.nextCursor?.trim()
    if (page.hasMore && cursor && !seenDescriptorCursors.value.has(cursor)) {
      seenDescriptorCursors.value.add(cursor)
      nextDescriptorCursor.value = cursor
      hasMoreDescriptors.value = true
      return
    }

    nextDescriptorCursor.value = undefined
    hasMoreDescriptors.value = false
  }

  function appendDescriptorPageItems (pageItems: any[]): void {
    if (pageItems.length === 0) {
      return
    }

    const knownDescriptorIds = new Set(
      descriptors.value
        .map(descriptor => (typeof descriptor?.id === 'string' ? descriptor.id : ''))
        .filter(descriptorId => descriptorId !== ''),
    )

    const newDescriptors = pageItems.filter(descriptor => {
      const descriptorId = typeof descriptor?.id === 'string' ? descriptor.id : ''
      if (descriptorId === '') {
        return true
      }
      if (knownDescriptorIds.has(descriptorId)) {
        return false
      }
      knownDescriptorIds.add(descriptorId)
      return true
    })

    descriptors.value = [...descriptors.value, ...newDescriptors]
  }

  function normalizeAssetIds (assetIds?: AssetIdFilter[]): AssetIdFilter[] | undefined {
    const normalizedAssetIds = assetIds
      ?.map(assetId => ({
        name: assetId.name.trim(),
        value: assetId.value.trim(),
      }))
      .filter(assetId => assetId.name !== '' && assetId.value !== '')

    return normalizedAssetIds && normalizedAssetIds.length > 0 ? normalizedAssetIds : undefined
  }

  async function ensureSelectedDescriptorLoaded (
    generation = descriptorPaginationGeneration.value,
  ): Promise<void> {
    const descriptorId = selectedDescriptorId.value.trim()
    if (descriptorId === '') {
      selectedDescriptorFallback.value = null
      return
    }

    if (descriptors.value.some(descriptor => descriptor?.id === descriptorId)) {
      selectedDescriptorFallback.value = null
      return
    }

    if (activeAssetIds.value && activeAssetIds.value.length > 0) {
      selectedDescriptorFallback.value = null
      return
    }

    if (selectedDescriptorFallback.value?.id === descriptorId) {
      return
    }

    const descriptor = await fetchDescriptorById(descriptorId, generation)
    if (generation !== descriptorPaginationGeneration.value) {
      return
    }
    if (descriptor && Object.keys(descriptor).length > 0) {
      selectedDescriptorFallback.value = descriptor
      rememberAssetIdNames([descriptor])
    }
  }

  function rememberAssetIdNames (loadedDescriptors: any[]): void {
    knownAssetIdNames.value = Array.from(new Set([
      ...knownAssetIdNames.value,
      ...getAssetIdNameSuggestions(loadedDescriptors),
    ])).toSorted((a, b) => a.localeCompare(b))
  }

  function selectDescriptor (descriptor: any): void {
    const descriptorId = typeof descriptor?.id === 'string' ? descriptor.id : ''
    if (descriptorId !== '' && selectedDescriptorId.value === descriptorId) {
      setSelectedDescriptorById('')
      return
    }

    setSelectedDescriptorById(descriptorId)
  }

  function handleDescriptorSelect (descriptor: any): void {
    const descriptorId = typeof descriptor?.id === 'string' ? descriptor.id : ''
    selectDescriptor(descriptor)

    if (smAndDown.value && descriptorId !== '' && selectedDescriptorId.value === descriptorId) {
      mobileView.value = 'details'
    }
  }

  function setSelectedDescriptorById (descriptorId: string): void {
    selectedDescriptorId.value = descriptorId
    updateSelectedDescriptorRoute(descriptorId)
    void ensureSelectedDescriptorLoaded()
  }

  function openCreateDescriptorDialog (): void {
    if (isEdcAccessMode.value) {
      inlineError.value = 'Descriptors loaded through EDC are read-only in CatenaXplorer.'
      return
    }

    inlineError.value = ''
    descriptorDialogMode.value = 'create'
    descriptorToEdit.value = null
    descriptorDialog.value = true
  }

  function openEditDescriptorDialog (descriptor: any): void {
    if (isEdcAccessMode.value) {
      inlineError.value = 'Descriptors loaded through EDC are read-only in CatenaXplorer.'
      return
    }

    inlineError.value = ''
    descriptorDialogMode.value = 'edit'
    descriptorToEdit.value = cloneDescriptor(descriptor)
    descriptorDialog.value = true
  }

  async function saveDescriptor (descriptor: Record<string, unknown>): Promise<void> {
    inlineError.value = ''

    if (isEdcAccessMode.value) {
      inlineError.value = 'Descriptors loaded through EDC are read-only in CatenaXplorer.'
      return
    }

    if (dtrUrl.value.trim() === '') {
      inlineError.value = 'The selected Catena-X infrastructure has no Digital Twin Registry URL.'
      return
    }

    isSavingDescriptor.value = true
    const descriptorIdToSelect = typeof descriptor.id === 'string' ? descriptor.id : ''

    try {
      const saved = descriptorDialogMode.value === 'edit'
        ? await putAasDescriptor(descriptor as any)
        : await postAasDescriptor(descriptor as any)

      if (!saved) {
        inlineError.value = `Could not ${descriptorDialogMode.value === 'edit' ? 'update' : 'create'} AAS descriptor in the Digital Twin Registry.`
        return
      }

      descriptorDialog.value = false
      assetIdName.value = defaultAssetIdName
      assetIdValue.value = ''
      if (descriptorIdToSelect !== '') {
        selectedDescriptorId.value = descriptorIdToSelect
        updateSelectedDescriptorRoute(descriptorIdToSelect)
      }
      await loadDescriptors()
      setSelectedDescriptorById(descriptorIdToSelect)
      if (smAndDown.value && descriptorIdToSelect !== '') {
        mobileView.value = 'details'
      }
    } catch (error) {
      console.warn(error)
      inlineError.value = `Could not ${descriptorDialogMode.value === 'edit' ? 'update' : 'create'} AAS descriptor in the Digital Twin Registry.`
    } finally {
      isSavingDescriptor.value = false
    }
  }

  function openDeleteDescriptorDialog (descriptor: any): void {
    if (isEdcAccessMode.value) {
      inlineError.value = 'Descriptors loaded through EDC are read-only in CatenaXplorer.'
      return
    }

    descriptorToDelete.value = descriptor
    deleteDescriptorDialog.value = true
  }

  async function deleteDescriptor (): Promise<void> {
    if (isEdcAccessMode.value) {
      inlineError.value = 'Descriptors loaded through EDC are read-only in CatenaXplorer.'
      return
    }

    const descriptorId = typeof descriptorToDelete.value?.id === 'string' ? descriptorToDelete.value.id : ''
    if (descriptorId.trim() === '') {
      deleteDescriptorDialog.value = false
      return
    }

    isDeletingDescriptor.value = true
    inlineError.value = ''

    try {
      const deleted = await deleteAasDescriptor(descriptorId)
      if (!deleted) {
        inlineError.value = 'Could not delete AAS descriptor from the Digital Twin Registry.'
        return
      }

      deleteDescriptorDialog.value = false
      descriptorToDelete.value = null
      if (selectedDescriptorId.value === descriptorId) {
        setSelectedDescriptorById('')
      }
      await loadDescriptors()
    } catch (error) {
      console.warn(error)
      inlineError.value = 'Could not delete AAS descriptor from the Digital Twin Registry.'
    } finally {
      isDeletingDescriptor.value = false
    }
  }

  function copyDescriptorAsJson (descriptor: any): void {
    copyToClipboard(JSON.stringify(cloneDescriptor(descriptor), null, 2), 'AAS Descriptor JSON', copyJsonIconAsRef.value)
  }

  async function duplicateDescriptor (sourceDescriptor: any): Promise<void> {
    if (isEdcAccessMode.value) {
      inlineError.value = 'Descriptors loaded through EDC are read-only in CatenaXplorer.'
      return
    }

    const descriptor = cloneDescriptor(sourceDescriptor)
    descriptor.id = generateIri('AssetAdministrationShell')
    if (typeof descriptor.idShort === 'string' && descriptor.idShort.trim() !== '') {
      descriptor.idShort = `${descriptor.idShort}_copy`
    }

    deleteDescriptorRuntimeFields(descriptor)

    if (Array.isArray(descriptor.submodelDescriptors)) {
      descriptor.submodelDescriptors = descriptor.submodelDescriptors.map((submodelDescriptor: any) => {
        const copiedSubmodelDescriptor = cloneDescriptor(submodelDescriptor)
        copiedSubmodelDescriptor.id = generateIri('Submodel')
        if (typeof copiedSubmodelDescriptor.idShort === 'string' && copiedSubmodelDescriptor.idShort.trim() !== '') {
          copiedSubmodelDescriptor.idShort = `${copiedSubmodelDescriptor.idShort}_copy`
        }
        deleteDescriptorRuntimeFields(copiedSubmodelDescriptor)
        return copiedSubmodelDescriptor
      })
    }

    descriptorDialogMode.value = 'create'
    await saveDescriptor(descriptor)
  }

  function getRouteDescriptorId (): string {
    const descriptorEndpoint = getRouteQueryString(descriptorEndpointQueryParam)
    if (descriptorEndpoint !== '') {
      return getDescriptorIdByEndpoint(descriptorEndpoint)
    }

    const value = route.query[legacyDescriptorIdQueryParam]
    if (Array.isArray(value)) {
      return value[0] ?? ''
    }

    return typeof value === 'string' ? value : ''
  }

  function updateSelectedDescriptorRoute (descriptorId: string): void {
    const query = { ...route.query }
    if (descriptorId.trim() === '') {
      delete query[descriptorEndpointQueryParam]
      delete query[legacyDescriptorIdQueryParam]
    } else {
      query[descriptorEndpointQueryParam] = buildShellDescriptorEndpointUrl(dtrUrl.value, descriptorId)
      delete query[legacyDescriptorIdQueryParam]
    }

    router.push({ query }).catch(error => {
      console.warn(error)
    })
  }

  function getRouteQueryString (queryParameter: string): string {
    const value = route.query[queryParameter]
    if (Array.isArray(value)) {
      return value[0]?.trim() ?? ''
    }

    return typeof value === 'string' ? value.trim() : ''
  }

  function getDescriptorIdByEndpoint (descriptorEndpoint: string): string {
    const normalizedEndpoint = descriptorEndpoint.replace(/\/+$/, '')
    const descriptor = descriptors.value.find(candidate => {
      const candidateId = typeof candidate?.id === 'string' ? candidate.id : ''
      return buildShellDescriptorEndpointUrl(dtrUrl.value, candidateId).replace(/\/+$/, '') === normalizedEndpoint
    })

    if (typeof descriptor?.id === 'string') {
      return descriptor.id
    }

    const endpointPath = normalizedEndpoint.split(/[?#]/, 1)[0]
    const encodedDescriptorId = endpointPath.split('/').pop() ?? ''
    return base64Decode(decodeURIComponent(encodedDescriptorId))
  }

  function cloneDescriptor<T> (descriptor: T): T {
    return structuredClone(toRaw(descriptor))
  }

  function deleteDescriptorRuntimeFields (descriptor: Record<string, unknown>): void {
    delete descriptor.createdAt
    delete descriptor.updatedAt
    delete descriptor.lastUpdatedAt
    delete descriptor.lastModifiedAt
    delete descriptor.lastModificationDate
    delete descriptor.lastModified
    delete descriptor.modifiedAt
    delete descriptor.modified
  }
</script>

<style scoped>
.catena-xplorer-page {
  max-width: 1440px;
}

.catena-xplorer-page--desktop {
  max-width: none;
}

.catena-xplorer-details {
  min-width: 0;
}
</style>
