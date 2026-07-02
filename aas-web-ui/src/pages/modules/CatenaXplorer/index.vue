<template>
  <CatenaXplorerNavigationDrawer
    v-if="mdAndUp"
    v-model:asset-id-name="assetIdName"
    v-model:asset-id-value="assetIdValue"
    :asset-id-name-suggestions="assetIdNameSuggestions"
    :copy-json-icon="copyJsonIcon"
    :descriptors="descriptors"
    :dtr-url="dtrUrl"
    :has-more-descriptors="hasMoreDescriptors"
    :inline-error="inlineError"
    :is-loading="isLoading"
    :is-loading-more="isLoadingMoreDescriptors"
    :selected-descriptor-id="selectedDescriptorId"
    @clear="clearSearch"
    @copy-json="copyDescriptorAsJson"
    @create="openCreateDescriptorDialog"
    @delete="openDeleteDescriptorDialog"
    @duplicate="duplicateDescriptor"
    @edit="openEditDescriptorDialog"
    @load-more="loadMoreDescriptors"
    @search="searchDescriptors"
    @select="handleDescriptorSelect"
  />

  <v-container class="pa-2" fluid>
    <div
      class="catena-xplorer-page mx-auto w-100"
      :class="{ 'catena-xplorer-page--desktop': mdAndUp }"
    >
      <template v-if="mdAndUp">
        <main class="catena-xplorer-details">
          <DescriptorDetails :descriptor="selectedDescriptor" :edc-config="selectedEdcConfig" />
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
              :descriptors="descriptors"
              :dtr-url="dtrUrl"
              :has-more-descriptors="hasMoreDescriptors"
              :inline-error="inlineError"
              :is-loading="isLoading"
              :is-loading-more="isLoadingMoreDescriptors"
              :selected-descriptor-id="selectedDescriptorId"
              @clear="clearSearch"
              @copy-json="copyDescriptorAsJson"
              @create="openCreateDescriptorDialog"
              @delete="openDeleteDescriptorDialog"
              @duplicate="duplicateDescriptor"
              @edit="openEditDescriptorDialog"
              @load-more="loadMoreDescriptors"
              @search="searchDescriptors"
              @select="handleDescriptorSelect"
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

            <DescriptorDetails :descriptor="selectedDescriptor" :edc-config="selectedEdcConfig" />
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
    </div>
  </v-container>
</template>

<script lang="ts" setup>
  import type { AasListPageResult, AssetIdFilter } from '@/composables/Client/AASRegistryClient'
  import { computed, onMounted, ref, toRaw, watch } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useDisplay } from 'vuetify'
  import { useAASRegistryClient } from '@/composables/Client/AASRegistryClient'
  import { useClipboardUtil } from '@/composables/ClipboardUtil'
  import { useIDUtils } from '@/composables/IDUtils'
  import {
    buildAssetIdNameSuggestions,
    buildShellDescriptorEndpointUrl,
    getAssetIdNameSuggestions,
  } from '@/pages/modules/CatenaXplorer/catenaXplorerUtils'
  import CatenaXplorerNavigationDrawer from '@/pages/modules/CatenaXplorer/components/CatenaXplorerNavigationDrawer.vue'
  import DeleteDescriptorDialog from '@/pages/modules/CatenaXplorer/components/DeleteDescriptorDialog.vue'
  import DescriptorBrowser from '@/pages/modules/CatenaXplorer/components/DescriptorBrowser.vue'
  import DescriptorDetails from '@/pages/modules/CatenaXplorer/components/DescriptorDetails.vue'
  import DescriptorEditDialog from '@/pages/modules/CatenaXplorer/components/DescriptorEditDialog.vue'
  import { useInfrastructureStore } from '@/store/InfrastructureStore'
  import { base64Decode } from '@/utils/EncodeDecodeUtils'

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

  const route = useRoute()
  const router = useRouter()
  const display = useDisplay()
  const infrastructureStore = useInfrastructureStore()
  const {
    deleteAasDescriptor,
    fetchAasDescriptorById,
    fetchAasDescriptorListPage,
    postAasDescriptor,
    putAasDescriptor,
  } = useAASRegistryClient()
  const { copyToClipboard } = useClipboardUtil()
  const { generateIri } = useIDUtils()

  const descriptors = ref<any[]>([])
  const activeAssetIds = ref<AssetIdFilter[] | undefined>(undefined)
  const descriptorPaginationGeneration = ref(0)
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

  const dtrUrl = computed(() => infrastructureStore.getAASRegistryURL)
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

  onMounted(() => {
    selectedDescriptorId.value = getRouteDescriptorId()
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

  async function reloadDescriptors (): Promise<void> {
    await loadDescriptors()
  }

  async function searchDescriptors (): Promise<void> {
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
    await loadDescriptors()
  }

  async function loadDescriptors (assetIds?: Array<{ name: string, value: string }>): Promise<void> {
    inlineError.value = ''

    if (dtrUrl.value.trim() === '') {
      descriptors.value = []
      selectedDescriptorId.value = ''
      selectedDescriptorFallback.value = null
      resetDescriptorPaginationState()
      inlineError.value = 'The selected Catena-X infrastructure has no Digital Twin Registry URL.'
      return
    }

    const generation = beginDescriptorPagination(assetIds)
    isLoading.value = true

    try {
      const page = await fetchAasDescriptorListPage({
        assetIds: activeAssetIds.value,
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
      await ensureSelectedDescriptorLoaded()
    } catch (error) {
      console.warn(error)
      descriptors.value = []
      selectedDescriptorId.value = getRouteDescriptorId()
      selectedDescriptorFallback.value = null
      resetDescriptorPaginationState()
      inlineError.value = 'Could not load AAS descriptors from the Digital Twin Registry.'
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
      const page = await fetchAasDescriptorListPage({
        assetIds: activeAssetIds.value,
        cursor: nextDescriptorCursor.value,
        limit: descriptorPageLimit,
      })

      if (generation !== descriptorPaginationGeneration.value) {
        return
      }

      appendDescriptorPageItems(page.items)
      rememberAssetIdNames(page.items)
      updateDescriptorPaginationState(page)
      await ensureSelectedDescriptorLoaded()
    } catch (error) {
      console.warn(error)
      inlineError.value = 'Could not load more AAS descriptors from the Digital Twin Registry.'
    } finally {
      if (generation === descriptorPaginationGeneration.value) {
        isLoadingMoreDescriptors.value = false
      }
    }
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

  async function ensureSelectedDescriptorLoaded (): Promise<void> {
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

    const descriptor = await fetchAasDescriptorById(descriptorId)
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
    inlineError.value = ''
    descriptorDialogMode.value = 'create'
    descriptorToEdit.value = null
    descriptorDialog.value = true
  }

  function openEditDescriptorDialog (descriptor: any): void {
    inlineError.value = ''
    descriptorDialogMode.value = 'edit'
    descriptorToEdit.value = cloneDescriptor(descriptor)
    descriptorDialog.value = true
  }

  async function saveDescriptor (descriptor: Record<string, unknown>): Promise<void> {
    inlineError.value = ''

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
    descriptorToDelete.value = descriptor
    deleteDescriptorDialog.value = true
  }

  async function deleteDescriptor (): Promise<void> {
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
