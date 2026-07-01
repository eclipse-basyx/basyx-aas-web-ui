<template>
  <v-container
    class="pa-3 pa-md-5 d-flex flex-column overflow-hidden"
    fluid
    style="height: calc(100svh - 105px); min-height: 0"
  >
    <div
      class="mx-auto d-flex flex-column w-100 overflow-hidden"
      style="max-width: 1440px; min-height: 0; height: 100%"
    >
      <CatenaXplorerTopBar
        v-model:asset-id-name="assetIdName"
        v-model:asset-id-value="assetIdValue"
        :asset-id-name-suggestions="assetIdNameSuggestions"
        :asset-id-value-suggestions="assetIdValueSuggestions"
        :descriptor-count="descriptors.length"
        :dtr-url-to-display="dtrUrlToDisplay"
        :inline-error="inlineError"
        :is-loading="isLoading"
        :show-descriptor-list-button="smAndDown"
        @clear="clearSearch"
        @open-descriptor-list="openDescriptorListDialog"
        @reload="reloadDescriptors"
        @search="searchDescriptors"
      />

      <div
        v-if="mdAndUp"
        class="flex-grow-1 overflow-hidden"
        style="display: grid; grid-template-columns: 360px minmax(0, 1fr); gap: 16px; min-height: 0; height: 0"
      >
        <div class="d-flex flex-column overflow-hidden" style="min-height: 0; height: 100%">
          <DescriptorList
            :copied-descriptor-available="Boolean(copiedDescriptor)"
            :copy-json-icon="copyJsonIcon"
            :descriptors="descriptors"
            :is-loading="isLoading"
            :selected-descriptor-id="selectedDescriptorId"
            @copy="copyDescriptor"
            @copy-json="copyDescriptorAsJson"
            @create="openCreateDescriptorDialog"
            @delete="openDeleteDescriptorDialog"
            @edit="openEditDescriptorDialog"
            @paste="pasteDescriptor"
            @select="selectDescriptor"
          />
        </div>

        <div class="d-flex flex-column overflow-hidden" style="min-height: 0; height: 100%">
          <DescriptorDetails :descriptor="selectedDescriptor" />
        </div>
      </div>

      <div v-else class="d-flex flex-column flex-grow-1 overflow-hidden" style="min-height: 0; height: 0">
        <DescriptorDetails :descriptor="selectedDescriptor" />
      </div>

      <v-dialog v-model="descriptorListDialog" fullscreen transition="dialog-bottom-transition">
        <DescriptorList
          :copied-descriptor-available="Boolean(copiedDescriptor)"
          :copy-json-icon="copyJsonIcon"
          :descriptors="descriptors"
          :flat="true"
          :is-loading="isLoading"
          :selected-descriptor-id="selectedDescriptorId"
          :show-close-button="true"
          @close="closeDescriptorListDialog"
          @copy="copyDescriptor"
          @copy-json="copyDescriptorAsJson"
          @create="openCreateDescriptorDialogFromList"
          @delete="openDeleteDescriptorDialogFromList"
          @edit="openEditDescriptorDialogFromList"
          @paste="pasteDescriptorFromList"
          @select="selectDescriptorFromList"
        />
      </v-dialog>

      <DescriptorEditDialog
        v-model="descriptorDialog"
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
  import { computed, onMounted, ref, toRaw, watch } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useDisplay } from 'vuetify'
  import { useAASRegistryClient } from '@/composables/Client/AASRegistryClient'
  import { useClipboardUtil } from '@/composables/ClipboardUtil'
  import { useIDUtils } from '@/composables/IDUtils'
  import {
    getAssetIdNameSuggestions,
    getAssetIdValueSuggestions,
  } from '@/pages/modules/CatenaXplorer/catenaXplorerUtils'
  import CatenaXplorerTopBar from '@/pages/modules/CatenaXplorer/components/CatenaXplorerTopBar.vue'
  import DeleteDescriptorDialog from '@/pages/modules/CatenaXplorer/components/DeleteDescriptorDialog.vue'
  import DescriptorDetails from '@/pages/modules/CatenaXplorer/components/DescriptorDetails.vue'
  import DescriptorEditDialog from '@/pages/modules/CatenaXplorer/components/DescriptorEditDialog.vue'
  import DescriptorList from '@/pages/modules/CatenaXplorer/components/DescriptorList.vue'
  import { useInfrastructureStore } from '@/store/InfrastructureStore'
  import { useNavigationStore } from '@/store/NavigationStore'

  defineOptions({
    inheritAttrs: false,
    moduleTitle: 'CatenaXplorer',
    isDesktopModule: true,
    isMobileModule: true,
    supportedInfrastructureTemplates: ['catena-x'],
  })

  const descriptorQueryParam = 'descriptorId'
  const defaultAssetIdName = 'manufacturerPartId'

  const route = useRoute()
  const router = useRouter()
  const display = useDisplay()
  const infrastructureStore = useInfrastructureStore()
  const navigationStore = useNavigationStore()
  const { fetchAasDescriptorList, postAasDescriptor, putAasDescriptor, deleteAasDescriptor } = useAASRegistryClient()
  const { copyToClipboard } = useClipboardUtil()
  const { generateIri } = useIDUtils()

  const descriptors = ref<any[]>([])
  const knownAssetIdNames = ref<string[]>([])
  const selectedDescriptorId = ref('')
  const assetIdName = ref(defaultAssetIdName)
  const assetIdValue = ref('')
  const inlineError = ref('')
  const isLoading = ref(false)
  const descriptorDialog = ref(false)
  const descriptorDialogMode = ref<'create' | 'edit'>('create')
  const descriptorToEdit = ref<Record<string, unknown> | null>(null)
  const isSavingDescriptor = ref(false)
  const deleteDescriptorDialog = ref(false)
  const descriptorListDialog = ref(false)
  const descriptorToDelete = ref<any | null>(null)
  const isDeletingDescriptor = ref(false)
  const copiedDescriptor = ref<Record<string, unknown> | null>(null)
  const copyJsonIcon = ref('mdi-clipboard-text-outline')
  const copyJsonIconAsRef = computed(() => copyJsonIcon)

  const dtrUrl = computed(() => infrastructureStore.getAASRegistryURL)
  const dtrUrlToDisplay = computed(() => dtrUrl.value.trim() || 'No Digital Twin Registry URL configured')
  const mdAndUp = computed(() => display.mdAndUp.value)
  const smAndDown = computed(() => display.smAndDown.value)
  const assetIdNameSuggestions = computed(() => {
    return Array.from(new Set([
      defaultAssetIdName,
      ...knownAssetIdNames.value,
      ...getAssetIdNameSuggestions(descriptors.value),
    ])).toSorted((a, b) => a.localeCompare(b))
  })
  const assetIdValueSuggestions = computed(() => {
    return getAssetIdValueSuggestions(descriptors.value, assetIdName.value)
  })
  const selectedDescriptor = computed(() => {
    return descriptors.value.find(descriptor => descriptor?.id === selectedDescriptorId.value) ?? null
  })

  onMounted(() => {
    selectedDescriptorId.value = getRouteDescriptorId()
    reloadDescriptors()
  })

  watch(
    () => route.query[descriptorQueryParam],
    () => {
      selectedDescriptorId.value = getRouteDescriptorId()
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
      inlineError.value = 'The selected Catena-X infrastructure has no Digital Twin Registry URL.'
      return
    }

    isLoading.value = true

    try {
      const loadedDescriptors = await fetchAasDescriptorList({ assetIds })
      descriptors.value = loadedDescriptors
      rememberAssetIdNames(loadedDescriptors)
      selectedDescriptorId.value = getRouteDescriptorId()
    } catch (error) {
      console.warn(error)
      descriptors.value = []
      selectedDescriptorId.value = getRouteDescriptorId()
      inlineError.value = 'Could not load AAS descriptors from the Digital Twin Registry.'
    } finally {
      isLoading.value = false
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
      setSelectedDescriptor('')
      return
    }

    setSelectedDescriptor(descriptorId)
  }

  function setSelectedDescriptor (descriptorId: string): void {
    selectedDescriptorId.value = descriptorId
    updateSelectedDescriptorRoute(descriptorId)
  }

  function openCreateDescriptorDialog (): void {
    inlineError.value = ''
    descriptorDialogMode.value = 'create'
    descriptorToEdit.value = null
    descriptorDialog.value = true
  }

  function openCreateDescriptorDialogFromList (): void {
    closeDescriptorListDialog()
    openCreateDescriptorDialog()
  }

  function openEditDescriptorDialog (descriptor: any): void {
    inlineError.value = ''
    descriptorDialogMode.value = 'edit'
    descriptorToEdit.value = cloneDescriptor(descriptor)
    descriptorDialog.value = true
  }

  function openEditDescriptorDialogFromList (descriptor: any): void {
    closeDescriptorListDialog()
    openEditDescriptorDialog(descriptor)
  }

  async function saveDescriptor (descriptor: Record<string, unknown>): Promise<void> {
    inlineError.value = ''

    if (dtrUrl.value.trim() === '') {
      inlineError.value = 'The selected Catena-X infrastructure has no Digital Twin Registry URL.'
      return
    }

    isSavingDescriptor.value = true

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
      await loadDescriptors()
      setSelectedDescriptor(typeof descriptor.id === 'string' ? descriptor.id : '')
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

  function openDeleteDescriptorDialogFromList (descriptor: any): void {
    closeDescriptorListDialog()
    openDeleteDescriptorDialog(descriptor)
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
        setSelectedDescriptor('')
      }
      await loadDescriptors()
    } catch (error) {
      console.warn(error)
      inlineError.value = 'Could not delete AAS descriptor from the Digital Twin Registry.'
    } finally {
      isDeletingDescriptor.value = false
    }
  }

  function copyDescriptor (descriptor: any): void {
    copiedDescriptor.value = cloneDescriptor(descriptor)
    navigationStore.dispatchSnackbar({
      status: true,
      timeout: 2000,
      color: 'success',
      btnColor: 'buttonText',
      text: 'AAS Descriptor copied.',
    })
  }

  function copyDescriptorAsJson (descriptor: any): void {
    copyToClipboard(JSON.stringify(cloneDescriptor(descriptor), null, 2), 'AAS Descriptor JSON', copyJsonIconAsRef.value)
  }

  async function pasteDescriptor (): Promise<void> {
    if (!copiedDescriptor.value) {
      return
    }

    const descriptor = cloneDescriptor(copiedDescriptor.value)
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

  async function pasteDescriptorFromList (): Promise<void> {
    closeDescriptorListDialog()
    await pasteDescriptor()
  }

  function openDescriptorListDialog (): void {
    descriptorListDialog.value = true
  }

  function closeDescriptorListDialog (): void {
    descriptorListDialog.value = false
  }

  function selectDescriptorFromList (descriptor: any): void {
    selectDescriptor(descriptor)
    closeDescriptorListDialog()
  }

  function getRouteDescriptorId (): string {
    const value = route.query[descriptorQueryParam]
    if (Array.isArray(value)) {
      return value[0] ?? ''
    }

    return typeof value === 'string' ? value : ''
  }

  function updateSelectedDescriptorRoute (descriptorId: string): void {
    const query = { ...route.query }
    if (descriptorId.trim() === '') {
      delete query[descriptorQueryParam]
    } else {
      query[descriptorQueryParam] = descriptorId
    }

    router.replace({ query }).catch(error => {
      console.warn(error)
    })
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
