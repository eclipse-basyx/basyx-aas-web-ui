<template>
  <v-container class="pa-0" fluid>
    <v-card color="card" elevation="0">
      <!-- Title bar -->
      <template v-if="!singleAas">
        <v-card-title class="py-3" :class="editMode || allowUploading ? '' : 'pr-0'">
          <v-text-field
            clearable
            density="compact"
            hide-details
            label="Search for AAS..."
            :model-value="searchValue"
            persistent-placeholder
            :placeholder="aasList.length.toString() + ' Shells'"
            variant="outlined"
            @update:model-value="debouncedFilterAasList"
          >
            <template #prepend>
              <v-tooltip :disabled="isMobile" location="bottom" open-delay="600">
                <template #activator="{ props }">
                  <v-icon
                    v-bind="props"
                    icon="mdi-reload"
                    :loading="listLoading"
                    @click="initialize()"
                  />
                </template>
                <span>Reload AAS List</span>
              </v-tooltip>
            </template>
            <template #append>
              <!-- Add AAS -->
              <v-menu v-if="editMode">
                <template #activator="{ props }">
                  <v-icon icon="mdi-dots-vertical" variant="plain" v-bind="props" />
                </template>
                <v-sheet border>
                  <v-list class="py-0" density="compact">
                    <!-- Open Upload Dialog -->
                    <template v-if="allowUploading">
                      <v-tooltip :disabled="isMobile" :location="editMode ? 'end' : 'bottom'" open-delay="600">
                        <template #activator="{ props }">
                          <v-list-item prepend-icon="mdi-upload" slim v-bind="props" @click="uploadAASDialog = true">
                            <template #prepend>
                              <v-icon size="small">mdi-upload</v-icon>
                            </template>
                            Upload AAS
                          </v-list-item>
                        </template>
                        <span>Upload AAS File to Environment</span>
                      </v-tooltip>
                      <v-divider />
                    </template>
                    <!-- Open AAS create dialog -->
                    <v-tooltip location="end" open-delay="600">
                      <template #activator="{ props }">
                        <v-list-item slim v-bind="props" @click="openEditDialog(true)">
                          <template #prepend>
                            <v-icon size="small">mdi-plus</v-icon>
                          </template>
                          Create AAS
                        </v-list-item>
                      </template>
                      <span>Create a new AAS</span>
                    </v-tooltip>
                  </v-list>
                </v-sheet>
              </v-menu>
              <v-tooltip v-else-if="allowUploading" :disabled="isMobile" :location="editMode ? 'end' : 'bottom'" open-delay="600">
                <template #activator="{ props }">
                  <v-icon
                    v-bind="props"
                    icon="mdi-upload"
                    @click="uploadAASDialog = true"
                  />
                </template>
                <span>Upload AAS File to Environment</span>
              </v-tooltip>
            </template>
          </v-text-field>
        </v-card-title>
        <v-divider />
        <v-progress-linear
          v-if="pageLoading && !listLoading"
          color="primary"
          height="2"
          indeterminate
        />
      </template>
      <!-- AAS List -->
      <v-list
        v-if="!singleAas"
        bg-color="card"
        class="pa-0"
        nav
        :style="{
          display: 'flex',
          'flex-direction': 'column',
          height: listHeight,
        }"
      >
        <template v-if="listLoading">
          <v-list-item
            v-for="i in 6"
            :key="i"
            class="px-0 py-3"
            density="compact"
            :height="48"
            nav
          >
            <v-list-item-title>
              <v-skeleton-loader type="list-item" :width="300" />
            </v-list-item-title>
            <template #append>
              <v-skeleton-loader type="list-item" :width="50" />
            </template>
          </v-list-item>
        </template>
        <template v-else>
          <v-virtual-scroll
            ref="virtualScrollRef"
            class="pb-2 bg-card"
            :item-height="56"
            :items="aasList"
          >
            <template #default="{ item }">
              <!-- Single AAS -->
              <v-list-item
                v-if="item && Object.keys(item).length > 0"
                :active="isSelected(item)"
                base-color="listItem"
                :border="isSelected(item) ? 'primary' : 'listItem thin'"
                class="mt-2 mx-2"
                color="primarySurface"
                style="border-top: solid; border-right: solid; border-bottom: solid; border-width: 1px"
                :style="{
                  'border-color': isSelected(item)
                    ? primaryColor + ' !important'
                    : isDark
                      ? '#686868 !important'
                      : '#ABABAB !important',
                }"
                variant="tonal"
                @click="selectAAS(item)"
              >
                <!-- Tooltip with idShort and id -->
                <v-tooltip
                  v-if="!isMobile"
                  activator="parent"
                  :disabled="isMobile"
                  open-delay="600"
                  transition="slide-x-transition"
                >
                  <!-- AAS ID -->
                  <div v-if="item.id" class="text-body-small">
                    <span class="font-weight-bold">{{ 'ID: ' }}</span>
                    {{ item.id }}
                  </div>
                  <!-- AAS idShort -->
                  <div v-if="item.idShort" class="text-body-small">
                    <span class="font-weight-bold"> {{ 'idShort: ' }}</span>
                    {{ item.idShort }}
                  </div>
                  <v-divider v-if="item.administration?.version" class="my-1" />
                  <!-- AAS administrative information -->
                  <div v-if="item.administration?.version" class="text-body-small">
                    <span class="font-weight-bold">{{ 'Version: ' }}</span>
                    {{
                      item.administration.version +
                        (item.administration.revision ? '.' + item.administration.revision : '')
                    }}
                  </div>
                </v-tooltip>
                <v-list-item-title class="text-primary" style="z-index: 9999">
                  {{ nameToDisplay(item) }}
                </v-list-item-title>
                <v-list-item-subtitle class="text-listItemText">{{ item.id }}</v-list-item-subtitle>
                <!-- open Details Button (with Status Badge) -->
                <template #append>
                  <v-badge
                    color="error"
                    icon="mdi-network-strength-4-alert"
                    inline
                    :model-value="
                      item.status && item.status.trim() !== '' && item.status === 'offline'
                        ? true
                        : false
                    "
                    text-color="buttonText"
                  />
                  <v-menu v-if="editMode">
                    <template #activator="{ props }">
                      <v-btn
                        color="listItemText"
                        icon
                        size="x-small"
                        variant="plain"
                        v-bind="props"
                        @click.prevent
                      >
                        <v-icon size="x-small">mdi-dots-vertical</v-icon>
                      </v-btn>
                    </template>
                    <v-sheet border>
                      <v-list class="py-0" dense density="compact" slim>
                        <v-list-item @click="openDownloadDialog(item)">
                          <template #prepend>
                            <v-icon size="x-small">mdi-download</v-icon>
                          </template>
                          <v-list-item-subtitle>Download AAS</v-list-item-subtitle>
                        </v-list-item>
                        <v-divider />
                        <!-- Open AAS edit dialog -->
                        <v-list-item @click="openEditDialog(false, item)">
                          <template #prepend>
                            <v-icon size="x-small">mdi-pencil</v-icon>
                          </template>
                          <v-list-item-subtitle>Edit AAS</v-list-item-subtitle>
                        </v-list-item>
                        <!-- Delete AAS -->
                        <v-list-item @click="openDeleteDialog(item)">
                          <template #prepend>
                            <v-icon size="x-small">mdi-delete</v-icon>
                          </template>
                          <v-list-item-subtitle>Delete AAS</v-list-item-subtitle>
                        </v-list-item>
                        <v-divider
                          v-if="
                            item.assetKind === 'Type' ||
                              item.assetInformation?.assetKind === 'Type'
                          "
                        />
                        <!-- Create Instance from Type -->
                        <v-list-item
                          v-if="
                            item.assetKind === 'Type' ||
                              item.assetInformation?.assetKind === 'Type'
                          "
                          @click="createInstanceFromType(item)"
                        >
                          <template #prepend>
                            <v-icon size="x-small">mdi-file-plus</v-icon>
                          </template>
                          <v-list-item-subtitle>Create Instance from Type</v-list-item-subtitle>
                        </v-list-item>
                        <v-divider />
                        <!-- Copy AAS Endpoint to clipboard -->
                        <v-list-item
                          @click.stop="
                            copyToClipboard(item.path, 'AAS Endpoint', copyIconAsRef)
                          "
                        >
                          <template #prepend>
                            <v-icon size="x-small">{{ copyIcon }} </v-icon>
                          </template>
                          <v-list-item-subtitle>Copy AAS Endpoint</v-list-item-subtitle>
                        </v-list-item>
                      </v-list>
                    </v-sheet>
                  </v-menu>
                  <template v-else>
                    <!-- Download AAS -->
                    <v-btn
                      v-if="aasRepoURL"
                      class="ml-n6"
                      color="listItemText"
                      icon
                      size="x-small"
                      style="z-index: 9000"
                      variant="plain"
                      @click.stop="openDownloadDialog(item)"
                    >
                      <v-icon size="x-small">mdi-download</v-icon>
                    </v-btn>
                  </template>
                </template>
              </v-list-item>
            </template>
          </v-virtual-scroll>
          <v-list-item
            v-if="isSearchLimited"
            class="px-4 py-1"
            density="compact"
          >
            <v-list-item-subtitle class="text-listItemText">
              Searching loaded shells only. Scroll down to load more.
            </v-list-item-subtitle>
          </v-list-item>
          <v-list-item
            v-if="pageLoading && !listLoading"
            class="px-4 py-0"
            density="compact"
          >
            <template #prepend>
              <v-progress-circular class="mr-2" indeterminate size="16" width="2" />
            </template>
            <v-list-item-subtitle class="text-listItemText ml-1">Loading more shells...</v-list-item-subtitle>
          </v-list-item>
        </template>
      </v-list>
      <!-- AAS Details (only visible if the Information Button is pressed on an AAS) -->
      <AASListDetails v-if="selectedAAS && Object.keys(selectedAAS).length > 0" />
      <!-- Collapse/extend Sidebar Button -->
      <v-list v-if="!isMobile" class="bg-detailsCard pa-0" nav style="width: 100%; z-index: 9000">
        <v-divider style="margin-left: -8px; margin-right: -8px" />
        <!-- Button to collapse the Sidebar -->
        <v-list-item class="ma-0" @click="collapseSidebar()">
          <template #prepend>
            <v-icon class="ml-2">mdi-chevron-double-left</v-icon>
          </template>
          <v-list-item-title class="text-body-small">Close Sidebar</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-card>
  </v-container>
  <!-- Dialog for creating/editing AAS -->
  <AASForm v-model="editDialog" :aas="aasToEdit" :new-shell="newShell" />
  <!-- Dialog for uploading AAS -->
  <UploadAAS v-model="uploadAASDialog" />
  <!-- Dialog for deleting AAS -->
  <DeleteAAS v-model="deleteDialog" :aas="aasToDelete" :list-loading-state="listLoading" />
  <!-- Dialog for downloading AAS -->
  <DownloadAAS v-model="downloadAASDialog" :aas="aasToDownload" />
  <!-- Dialog for Instance Creation from Type -->
  <AASToInstance v-model="instanceDialog" :aas="aasToInstantiate" />
</template>

<script lang="ts" setup>
  import type { ComponentPublicInstance, Ref } from 'vue'
  import { computed, nextTick, onActivated, onBeforeUnmount, onMounted, ref, watch } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useTheme } from 'vuetify'
  import { useAASHandling } from '@/composables/AAS/AASHandling'
  import { appendOrMergeSortedAasById, compareAasById } from '@/composables/AAS/AASListAccumulation'
  import { useAASListPagination } from '@/composables/AAS/AASListPagination'
  import { useAASListStatusChecks } from '@/composables/AAS/AASListStatusChecks'
  import { useReferableUtils } from '@/composables/AAS/ReferableUtils'
  import { useClipboardUtil } from '@/composables/ClipboardUtil'
  import { useAASStore } from '@/store/AASDataStore'
  import { useEnvStore } from '@/store/EnvironmentStore'
  import { useInfrastructureStore } from '@/store/InfrastructureStore'
  import { useNavigationStore } from '@/store/NavigationStore'
  import { debounce } from '@/utils/generalUtils'

  // Extend the ComponentPublicInstance type to include scrollToIndex
  interface VirtualScrollInstance extends ComponentPublicInstance {
    scrollToIndex: (index: number) => void
  }

  // Vue Router
  const route = useRoute()
  const router = useRouter()

  // Composables
  const { fetchAasShellListPage, aasIsAvailableById } = useAASHandling()
  const { nameToDisplay, descriptionToDisplay } = useReferableUtils()
  const { copyToClipboard } = useClipboardUtil()

  // Stores
  const navigationStore = useNavigationStore()
  const aasStore = useAASStore()
  const envStore = useEnvStore()
  const infrastructureStore = useInfrastructureStore()

  // Vuetify
  const theme = useTheme()

  const itemHeight = 56
  const minPageLimit = 100
  const maxPageLimit = 300
  const prefetchThresholdInRows = 8
  const pageSizeMultiplier = 3
  const scrollLoadDebounceMs = 200
  const minPageLoadIntervalMs = 350
  const statusCheckConcurrency = 4
  const statusCheckViewportBufferRows = 6
  const statusCheckFallbackLimit = 60

  // Data
  const aasList = ref([] as Array<any>) as Ref<Array<any>> // Variable to store currently displayed AAS Data
  const allLoadedAas = ref([] as Array<any>) as Ref<Array<any>> // Variable to store all loaded AAS Data
  const searchValue = ref('')
  const loadedIds = ref(new Set<string>())
  const debouncedFilterAasList = debounce(filterAasList, 300) // Debounced function to filter the AAS List
  const listLoading = computed(() => isLoadingInitialPage.value) // Variable to store if the AAS List is loading
  const deleteDialog = ref(false) // Variable to store if the Delete Dialog should be shown
  const downloadAASDialog = ref(false) // Variable to store if the DownloadAAS Dialog should be shown
  const aasToDelete = ref({}) // Variable to store the AAS to be deleted
  const aasToDownload = ref({}) // Variable to store the AAS to be downloaded
  const virtualScrollRef: Ref<VirtualScrollInstance | null> = ref(null) // Reference to the Virtual Scroll Component
  const uploadAASDialog = ref(false) // Variable to store if the Upload AAS Dialog should be shown
  const editDialog = ref(false) // Variable to store if the Edit Dialog should be shown
  const newShell = ref(false) // Variable to store if a new Shell should be created
  const aasToEdit = ref<any | undefined>(undefined) // Variable to store the AAS to be edited
  const statusCheckInterval = ref<number | undefined>(undefined)
  const copyIcon = ref<string>('mdi-clipboard-file-outline')
  const instanceDialog = ref(false) // Variable to store if the Instance Creation Dialog should be shown
  const aasToInstantiate = ref({}) // Variable to store the AAS to be instantiated

  const {
    hasMorePages,
    isLoadingInitialPage,
    pageLoading,
    getVirtualScrollContainer,
    bindVirtualScrollListener,
    unbindVirtualScrollListener,
    invalidatePaginationGeneration,
    resetPaginationState: resetPaginationStateInternal,
    initialize: initializePagination,
  } = useAASListPagination({
    virtualScrollRef,
    itemHeight,
    minPageLimit,
    maxPageLimit,
    pageSizeMultiplier,
    prefetchThresholdInRows,
    scrollLoadDebounceMs,
    minPageLoadIntervalMs,
    fetchPage: params => fetchAasShellListPage(params),
    onPageItems: items => {
      const incomingItems = items
        .toSorted(compareAasById)
        .filter(item => {
          if (!item?.id || loadedIds.value.has(item.id)) {
            return false
          }
          loadedIds.value.add(item.id)
          return true
        })
        .map(item => preprocessListItem(item))

      if (incomingItems.length > 0) {
        allLoadedAas.value = appendOrMergeSortedAasById(allLoadedAas.value, incomingItems)
        applyCurrentFilter()
      }
    },
  })

  const { updateStatus } = useAASListStatusChecks({
    aasList,
    getVirtualScrollContainer,
    itemHeight,
    viewportBufferRows: statusCheckViewportBufferRows,
    fallbackLimit: statusCheckFallbackLimit,
    concurrency: statusCheckConcurrency,
    aasIsAvailableById,
  })

  // Computed Properties
  const isMobile = computed(() => navigationStore.getIsMobile) // Check if the current Device is a Mobile Device
  const isDark = computed(() => theme.global.current.value.dark) // Check if the current Theme is dark
  const aasRepoURL = computed(() => infrastructureStore.getAASRepoURL) // Get the AAS Repository URL from the Store
  const aasRegistryURL = computed(() => infrastructureStore.getAASRegistryURL) // Get AAS Registry URL from Store
  const selectedAAS = computed(() => aasStore.getSelectedAAS) // Get the selected AAS from Store
  const primaryColor = computed(() => theme.current.value.colors.primary) // returns the primary color of the current theme
  const triggerAASListReload = computed(() => navigationStore.getTriggerAASListReload) // Get the trigger signal for AAS List reload from store
  const clearAASList = computed(() => navigationStore.getClearAASList) // Get the clear AAS List signal from store
  const singleAas = computed(() => envStore.getSingleAas) // Get the single AAS state from the Store
  const listHeight = computed(() => {
    if (isMobile.value) {
      return selectedAAS.value && Object.keys(selectedAAS.value).length > 0
        ? '231px' // 4x AAS items
        : 'calc(100vh - 64px - 40px - 64px - 2px)' // Full height - header - footer - Searchbar - 2x divider
    } else {
      return selectedAAS.value && Object.keys(selectedAAS.value).length > 0
        ? 'calc(50vh - 64px - 64px - 2px - 1px)' // Half height - header - title - 2x divider - border
        : 'calc(100vh - 64px - 64px - 48px - 40px - 2px)' // Full height - header - title - collapse button - footer - 2x divider
    }
  })
  const editMode = computed(() => route.name === 'AASEditor') // Check if the current Route is the AAS Editor
  const allowUploading = computed(() => envStore.getAllowUploading) // Check if the current environment config allows uploading shells
  const statusCheck = computed(() => navigationStore.getStatusCheck)
  const copyIconAsRef = computed(() => copyIcon)
  const isAuthenticating = computed(() => infrastructureStore.getIsAuthenticating) // Check if authentication is in progress
  const isTestingConnections = computed(() => infrastructureStore.getIsTestingConnections) // Check if testing connections
  const selectedInfrastructureId = computed(() => infrastructureStore.getSelectedInfrastructureId) // Get selected infrastructure ID
  const isSearchLimited = computed(() => searchValue.value.trim() !== '' && hasMorePages.value)

  // Watchers
  // Reload when AAS Registry URL or selected infrastructure changes
  watch(
    [() => aasRegistryURL.value, () => aasRepoURL.value, () => selectedInfrastructureId.value],
    ([newRegistryUrl, newRepoUrl, newId], [oldRegistryUrl, oldRepoUrl, oldId]) => {
      const hasValidSourceUrl
        = (newRegistryUrl && newRegistryUrl.trim() !== '') || (newRepoUrl && newRepoUrl.trim() !== '')

      // Only reload when one source URL is valid and not authenticating and not testing connections
      if (
        hasValidSourceUrl
        && !isAuthenticating.value
        && !isTestingConnections.value
        && (newRegistryUrl !== oldRegistryUrl || newRepoUrl !== oldRepoUrl || newId !== oldId)
      ) {
        initialize()
      }
    },
    { immediate: true },
  )

  watch(
    () => selectedAAS.value,
    () => {
      applyCurrentFilter()
      scrollToSelectedAAS()
    },
    { deep: true },
  )

  watch(
    () => listLoading.value,
    loading => {
      if (loading) {
        unbindVirtualScrollListener()
        return
      }

      void nextTick(() => {
        bindVirtualScrollListener()
      })
    },
  )

  watch(
    () => statusCheck.value,
    statusCheckValue => {
      window.clearInterval(statusCheckInterval.value) // clear old interval
      if (statusCheckValue.state === true) {
        void updateStatus(statusCheckValue.state)

        // create new interval
        statusCheckInterval.value = window.setInterval(() => {
          void updateStatus(statusCheck.value.state)
        }, statusCheck.value.interval)
      } else {
        for (const aasDescriptor of allLoadedAas.value) {
          aasDescriptor.status = 'check disabled'
        }

        // Reset status icon after 2 seconds
        setTimeout(() => {
          for (const aasDescriptor of allLoadedAas.value) {
            aasDescriptor.status = ''
          }
        }, 2000)
      }
    },
    { deep: true },
  )

  watch(
    () => triggerAASListReload.value,
    triggerVal => {
      if (triggerVal === true) {
        initialize()
      }
    },
  )

  watch(
    () => clearAASList.value,
    clearAasListValue => {
      if (clearAasListValue === true) {
        invalidatePaginationGeneration()
        resetAASListState(false)
        unbindVirtualScrollListener()
      }
    },
  )

  onMounted(() => {
    if (statusCheck.value.state === true) {
      window.clearInterval(statusCheckInterval.value) // clear old interval

      // create new interval
      statusCheckInterval.value = window.setInterval(() => {
        void updateStatus(statusCheck.value.state)
      }, statusCheck.value.interval)
    }

    if (!listLoading.value) {
      void nextTick(() => {
        bindVirtualScrollListener()
      })
    }
  })

  onBeforeUnmount(() => {
    window.clearInterval(statusCheckInterval.value)
    unbindVirtualScrollListener()
  })

  onActivated(() => {
    scrollToSelectedAAS()
  })

  function collapseSidebar (): void {
    navigationStore.dispatchDrawerState(false)
  }

  function preprocessListItem (item: any): any {
    return {
      ...item,
      idLower: item?.id?.toLowerCase() || '',
      idShortLower: item?.idShort?.toLowerCase() || '',
      nameLower: nameToDisplay(item).toLowerCase(),
      descLower: descriptionToDisplay(item).toLowerCase(),
    }
  }

  function applyCurrentFilter (): void {
    const trimmedSearch = searchValue.value.trim().toLowerCase()
    const filteredItems = trimmedSearch === ''
      ? allLoadedAas.value
      : allLoadedAas.value.filter(
        aasOrAasDescriptor =>
          aasOrAasDescriptor.idLower.includes(trimmedSearch)
          || aasOrAasDescriptor.idShortLower.includes(trimmedSearch)
          || aasOrAasDescriptor.nameLower.includes(trimmedSearch)
          || aasOrAasDescriptor.descLower.includes(trimmedSearch),
      )

    const pinnedSelectedItem = createPinnedSelectedItem()
    if (pinnedSelectedItem) {
      aasList.value = [
        pinnedSelectedItem,
        ...filteredItems.filter(item => item?.id !== pinnedSelectedItem.id),
      ]
      return
    }

    aasList.value = filteredItems
  }

  function createPinnedSelectedItem (): any | undefined {
    if (!selectedAAS.value || Object.keys(selectedAAS.value).length === 0 || !selectedAAS.value.id) {
      return undefined
    }

    const selectedId = selectedAAS.value.id
    const selectedLoadedItem = allLoadedAas.value.find(item => item?.id === selectedId)
    if (selectedLoadedItem) {
      return selectedLoadedItem
    }

    const aasPathFromQuery = typeof route.query.aas === 'string' ? route.query.aas : ''
    const selectedPath = selectedAAS.value.path || aasPathFromQuery
    return preprocessListItem({
      ...selectedAAS.value,
      path: selectedPath,
    })
  }

  function resetAASListState (enablePagination = true): void {
    aasList.value = []
    allLoadedAas.value = []
    loadedIds.value.clear()
    resetPaginationStateInternal(enablePagination)
    searchValue.value = ''
  }

  // Function to get the AAS Data from the Registry Server
  async function initialize (): Promise<void> {
    resetAASListState(true)
    await initializePagination(scrollToSelectedAAS)
  }

  function filterAasList (value: string | null): void {
    searchValue.value = value?.trim() ?? ''
    applyCurrentFilter()
    scrollToSelectedAAS()
  }

  // Function to select an AAS
  function selectAAS (aas: any): void {
    if (listLoading.value) {
      navigationStore.dispatchSnackbar({
        status: true,
        timeout: 4000,
        color: 'error',
        btnColor: 'buttonText',
        text: 'Please wait for the current Request to finish.',
      })
      return
    }
    if (isSelected(aas)) {
      // Deselect AAS: remove aas and path url query parameter
      const query = structuredClone(route.query)
      if (Object.hasOwn(query, 'aas')) delete query.aas
      if (Object.hasOwn(query, 'path')) delete query.path

      router.push({ query: query })
    } else {
      // // Select AAS: Set AAS path as aas url query parameter
      // let scrollToAas = false;
      // if (!selectedAAS.value || Object.keys(selectedAAS.value).length === 0) {
      //     scrollToAas = true;
      // }

      const query = structuredClone(route.query)
      query.aas = aas.path
      if (Object.hasOwn(query, 'path')) delete query.path

      router.push({ query: query })

      // if (scrollToAas) scrollToSelectedAAS();
    }
  }

  function isSelected (aasOrAasDescriptor: any): boolean {
    if (
      !selectedAAS.value
      || Object.keys(selectedAAS.value).length === 0
      || !selectedAAS.value.id
      || !aasOrAasDescriptor
      || Object.keys(aasOrAasDescriptor).length === 0
      || !aasOrAasDescriptor.id
    ) {
      return false
    }
    return selectedAAS.value.id === aasOrAasDescriptor.id
  }

  // Function to scroll to the selected AAS
  function scrollToSelectedAAS (): void {
    // Find the index of the selected item
    const index = aasList.value.findIndex((aasOrAasDescriptor: any) => isSelected(aasOrAasDescriptor))

    if (index !== -1) {
      const intervalId = setInterval(() => {
        if (
          virtualScrollRef.value
          && virtualScrollRef.value?.$el.querySelector('.v-virtual-scroll__container').children.length > 0
        ) {
          // Access the scrollable container
          virtualScrollRef.value.scrollToIndex(index)
          clearInterval(intervalId)
        }
      }, 50)
    }
  }

  function openDeleteDialog (aasOrAasDescriptor: any): void {
    deleteDialog.value = true
    aasToDelete.value = aasOrAasDescriptor
  }

  function openDownloadDialog (aasDescriptor: any): void {
    downloadAASDialog.value = true
    aasToDownload.value = aasDescriptor
  }

  function openEditDialog (createNew: boolean, aasOrAasDescriptor?: any): void {
    editDialog.value = true
    newShell.value = createNew
    if (createNew === false && aasOrAasDescriptor) {
      aasToEdit.value = aasOrAasDescriptor
    }
  }

  function createInstanceFromType (aasDescriptor: any): void {
    instanceDialog.value = true
    aasToInstantiate.value = aasDescriptor
  }
</script>

<style>
    .custom-loader {
        animation: loader 1s infinite;
        display: flex;
    }

    @-moz-keyframes loader {
        from {
            transform: rotate(0);
        }

        to {
            transform: rotate(360deg);
        }
    }

    @-webkit-keyframes loader {
        from {
            transform: rotate(0);
        }

        to {
            transform: rotate(360deg);
        }
    }

    @-o-keyframes loader {
        from {
            transform: rotate(0);
        }

        to {
            transform: rotate(360deg);
        }
    }

    @keyframes loader {
        from {
            transform: rotate(0);
        }

        to {
            transform: rotate(360deg);
        }
    }
</style>
