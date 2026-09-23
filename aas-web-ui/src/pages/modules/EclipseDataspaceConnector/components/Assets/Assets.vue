<template>
  <v-container class="pa-0 ma-0" fluid :style="{ 'height': fullHeight}">

    <v-layout :style="{ 'height': fullHeight}">
      <v-navigation-drawer
        class="leftMenu"
        color="appNavigation"
        :width="336"
      >
        <v-card color="rgba(0,0,0,0)" elevation="0">
          <v-card-title
            class="px-0 py-2 d-flex align-center"
          >

            <v-tooltip location="bottom" open-delay="600">
              <template #activator="{ props }">
                <v-btn
                  class="ma-0"
                  icon="mdi-reload"
                  v-bind="props"
                  :loading="listLoading"
                  variant="plain"
                  @click="initialize()"
                />
              </template>

              <span>Reload EDC Asset List</span>
            </v-tooltip>

            <v-text-field
              v-model="searchQuery"
              clearable
              density="compact"
              hide-details
              label="Search for EDC Asset ..."
              variant="outlined"
              @update:model-value="filterAssetList"
            />

            <!-- Menu -->
            <v-menu>
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  class="mx-0"
                  icon="mdi-dots-vertical"
                  variant="plain"
                />
              </template>

              <v-sheet border>
                <v-list class="py-0" density="compact">

                  <!-- Create EDC Asset Dialog -->
                  <v-tooltip location="bottom" open-delay="600">
                    <template #activator="{ props }">
                      <v-list-item prepend-icon="mdi-upload" slim v-bind="props" @click="createAssetDialog = true">
                        <template #prepend>
                          <v-icon size="small">mdi-plus</v-icon>
                        </template>
                        Create EDC Asset
                      </v-list-item>
                    </template>

                    <span>Create a new asset</span>
                  </v-tooltip>

                  <!-- Create EDC Asset AAS/SMs Dialog -->
                  <!-- <v-tooltip location="bottom" open-delay="600">
                    <template #activator="{ props }">
                      <v-list-item prepend-icon="mdi-upload" slim v-bind="props" @click="createAssetsAasSmsDialog = true">
                        <template #prepend>
                          <v-icon size="small">mdi-plus</v-icon>
                        </template>
                        Create EDC Assets from AAS/SMs
                      </v-list-item>
                    </template>

                    <span>Create a new assets from an AAS and its SMs</span>
                  </v-tooltip> -->

                  <!-- Create EDC Asset from Template Dialog -->
                  <v-tooltip location="bottom" open-delay="600">
                    <template #activator="{ props }">
                      <v-list-item prepend-icon="mdi-upload" slim v-bind="props" @click="createAssetFromTemplateDialog = true">
                        <template #prepend>
                          <v-icon size="small">mdi-plus</v-icon>
                        </template>
                        Create EDC Asset from Template
                      </v-list-item>
                    </template>

                    <span>Create a new asset from Template</span>
                  </v-tooltip>

                </v-list>
              </v-sheet>
            </v-menu>

          </v-card-title>

          <v-divider />

          <v-card-text class="pt-0 pb-0 px-2" style="overflow-y: auto; height: calc(100svh - 64px - 48px - 40px - 64px - 3px)">

            <div v-if="listLoading">
              <v-skeleton-loader type="list-item@6" />
            </div>

            <template v-else>

              <!-- List of EDC Assets -->
              <v-list
                v-if="assetList.length > 0"
                class="pa-0"
                density="compact"
                nav
              >
                <v-virtual-scroll
                  ref="virtualScrollRef"
                  class="bg-card mb-2"
                  :item-height="56"
                  :items="assetList"
                >

                  <template #default="{ item }">
                    <!-- Single EDC Asset -->
                    <v-list-item
                      :key="item['@id']"
                      :active="isSelected(item)"
                      base-color="listItem"
                      :border="isSelected(item) ? 'primary' : 'listItem thin'"
                      class="mt-2 mx-0"
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
                      @click="selectAsset(item)"
                    >
                      <template #prepend>
                        <v-btn
                          class="ml-n1"
                          color="primary"
                          icon="mdi-code-json"
                          rel="noopener noreferrer"
                          size="x-small"
                          style="z-index: 9000"
                          target="_blank"
                          variant="plain"
                          @click.stop
                        />
                      </template>

                      <v-tooltip
                        activator="parent"
                        open-delay="600"
                        transition="slide-x-transition"
                      >
                        <!-- EDC Asset ID -->
                        <div v-if="item['@id']" class="text-body-small">
                          <span class="font-weight-bold">{{ 'ID: ' }}</span>
                          {{ item['@id'] }}
                        </div>

                        <!-- Created At -->
                        <div v-if="item['createdAt']" class="text-body-small mt-1">
                          <span class="font-weight-bold">{{ 'Created: ' }}</span>
                          {{ new Date(item['createdAt']).toISOString() }}
                        </div>

                      </v-tooltip>

                      <v-list-item-title class="text-primary">
                        {{ item?.properties?.displayName || item?.properties?.name || item?.properties?.description }}
                      </v-list-item-title>

                      <v-list-item-subtitle class="text-listItemText">
                        {{ item['@id'] }}
                      </v-list-item-subtitle>

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

                        <v-menu>
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

                              <!-- Update EDC Asset -->
                              <v-list-item @click="openUpdateDialog(item)">
                                <template #prepend>
                                  <v-icon size="x-small">mdi-pencil</v-icon>
                                </template>

                                <v-list-item-subtitle>Edit Asset</v-list-item-subtitle>
                              </v-list-item>

                              <!-- Delete EDC Asset -->
                              <v-list-item @click="openDeleteDialog(item)">
                                <template #prepend>
                                  <v-icon size="x-small">mdi-delete</v-icon>
                                </template>

                                <v-list-item-subtitle>Delete Asset</v-list-item-subtitle>
                              </v-list-item>

                              <v-divider />
                              <!-- Copy EDC Asset ID to clipboard -->
                              <v-list-item
                                @click.stop="
                                  copyToClipboard(item['@id'], 'AssetId', copyIconAsRef)
                                "
                              >
                                <template #prepend>
                                  <v-icon size="x-small">{{ copyIcon }} </v-icon>
                                </template>

                                <v-list-item-subtitle>Copy Asset ID</v-list-item-subtitle>
                              </v-list-item>
                            </v-list>
                          </v-sheet>
                        </v-menu>

                      </template>

                    </v-list-item>
                  </template>

                </v-virtual-scroll>
              </v-list>

              <v-empty-state
                v-else
                class="text-divider"
                title="No existing Assets"
              />
            </template>
          </v-card-text>
        </v-card>
      </v-navigation-drawer>

      <v-main>
        <v-container fluid>

          <div v-if="!selectedAsset || Object.keys(selectedAsset).length === 0" class="d-flex align-center justify-center" :style="{'height': fullHeightMain}">

            <v-empty-state
              icon="mdi-gesture-tap"
              text="Please select a EDC Asset to view"
              title="Select EDC Asset"
            >
              <template #media>
                <v-icon size="64" />
              </template>
            </v-empty-state>
          </div>

          <template v-else>
            <JSONPreview
              :height="fullHeightMainJsonPreview"
              :json-content="selectedAsset"
              title="EDC Asset"
            />
          </template>

        </v-container>
      </v-main>
    </v-layout>
  </v-container>

  <CreateAssetDialog
    v-model="createAssetDialog"
    :proxy-id="edcProxyId"
    @assets-created="onAssetsCreated"
  />
  <!-- <CreateAssetsAasSmsDialog v-model="createAssetsAasSmsDialog" @assets-created="onAssetsCreated" /> -->
  <CreateAssetFromTemplateDialog
    v-model="createAssetFromTemplateDialog"
    :proxy-id="edcProxyId"
    @assets-created="onAssetsCreated"
  />

  <UpdateAssetDialog
    v-model="updateAssetDialog"
    :asset="assetToUpdate"
    :proxy-id="edcProxyId"
    @asset-updated="onAssetUpdated"
  />

  <DeleteAssetDialog
    v-model="deleteAssetDialog"
    :asset="assetToDelete"
    :proxy-id="edcProxyId"
    @asset-deleted="onAssetDeleted"
  />
</template>

<script lang="ts" setup>
  import { useTheme } from 'vuetify'
  import { useCatenaXEdcClient } from '@/composables/Client/CatenaXEdcClient'
  import { useClipboardUtil } from '@/composables/ClipboardUtil'
  import CreateAssetDialog from '@/pages/modules/EclipseDataspaceConnector/components/Assets/Dialogs/CreateAssetDialog.vue'
  import CreateAssetFromTemplateDialog from '@/pages/modules/EclipseDataspaceConnector/components/Assets/Dialogs/CreateAssetFromTemplateDialog.vue'
  // import CreateAssetsAasSmsDialog from '@/pages/modules/EclipseDataspaceConnector/components/Assets/Dialogs/CreateAssetsAasSmsDialog.vue'
  import DeleteAssetDialog from '@/pages/modules/EclipseDataspaceConnector/components/Assets/Dialogs/DeleteAssetDialog.vue'
  import UpdateAssetDialog from '@/pages/modules/EclipseDataspaceConnector/components/Assets/Dialogs/UpdateAssetDialog.vue'
  import { useInfrastructureStore } from '@/store/InfrastructureStore'

  // Extend the ComponentPublicInstance type to include scrollToIndex
  interface VirtualScrollInstance extends ComponentPublicInstance {
    scrollToIndex: (index: number) => void
  }

  // Stores
  const infrastructureStore = useInfrastructureStore()

  // Composables
  const { queryAssets } = useCatenaXEdcClient()
  const { copyToClipboard } = useClipboardUtil()

  // Vuetify
  const theme = useTheme()

  // Data
  const searchQuery = ref('')
  const fullHeight = ref('calc(100vh - 64px - 48px - 40px - 2px)') // Full height - header - tabs - footer - border
  const fullHeightMain = ref('calc(100vh - 64px - 48px - 40px - 32px - 2px)') // Full height - header - tabs - footer - padding - border
  const fullHeightMainJsonPreview = ref('calc(100vh - 64px - 48px - 40px - 32px - 2px - 64px - 32px)') // Full height - header - tabs - footer - padding - border - JSON
  const assetList = ref([] as Array<any>) as Ref<Array<any>> // Variable to store the Asset data
  const assetListUnfiltered = ref([] as Array<any>) as Ref<Array<any>> // Variable to store the Asset data before filtering
  const listLoading = ref(false) // Variable to store if the AAS List is loading
  const virtualScrollRef: Ref<VirtualScrollInstance | null> = ref(null) // Reference to the Virtual Scroll Component
  const selectedAsset = ref({} as any)
  const createAssetDialog = ref(false) // Variable to store if the Create Asset Dialog should be shown
  // const createAssetsAasSmsDialog = ref(false) // Variable to store if the Create Asset Dialog should be shown
  const createAssetFromTemplateDialog = ref(false) // Variable to store if the Create Asset Dialog should be shown
  const updateAssetDialog = ref(false) // Variable to store if the Update Asset Dialog should be shown
  const assetToUpdate = ref<any>({}) // Variable to store the asset to be updated
  const deleteAssetDialog = ref(false) // Variable to store if the Delete Asset Dialog should be shown
  const assetToDelete = ref<any>({}) // Variable to store the asset to be deleted
  const copyIcon = ref<string>('mdi-clipboard-file-outline')

  // Computed properties
  const isDark = computed(() => theme.global.current.value.dark)
  const primaryColor = computed(() => theme.current.value.colors.primary)
  const copyIconAsRef = computed(() => copyIcon)
  const selectedEdcConfig = computed(() => infrastructureStore.getSelectedInfrastructure?.catenaX?.edc ?? null)
  const edcProxyId = computed(() => selectedEdcConfig.value?.proxyId?.trim() ?? 'default')

  onMounted(() => {
    initialize()
  })

  onActivated(() => {
    scrollToSelectedAsset()
  })

  async function initialize (): Promise<void> {
    listLoading.value = true

    const assets = await queryAssets(edcProxyId.value)

    if (assets && Array.isArray(assets) && assets.length > 0) {
      const assetsSorted = assets.toSorted((assetA: any, assetB: any) => {
        // Sort assets with respect to id
        return assetA['@id']
          > assetB['@id']
          ? 1
          : -1
      })

      assetList.value = [...assetsSorted]
      assetListUnfiltered.value = [...assetsSorted]

      if (searchQuery.value !== '')
        filterAssetList(searchQuery.value)

      scrollToSelectedAsset()
    }

    listLoading.value = false
  }

  async function onAssetsCreated (assetId?: string): Promise<void> {
    const hadSelection = !!selectedAsset.value?.['@id']

    // Reload the asset list
    await initialize()

    if (!hadSelection && assetId) {
      const createdAsset = assetList.value.find((asset: any) => asset['@id'] === assetId)
      if (createdAsset) {
        selectedAsset.value = createdAsset
        scrollToSelectedAsset()
      }
    }
  }

  function openUpdateDialog (asset: any): void {
    assetToUpdate.value = asset
    updateAssetDialog.value = true
  }

  function openDeleteDialog (asset: any): void {
    deleteAssetDialog.value = true
    assetToDelete.value = asset
  }

  async function onAssetUpdated (): Promise<void> {
    // Remember the currently selected asset's ID before reloading
    const previouslySelectedId = selectedAsset.value?.['@id']

    // Reload the asset list
    await initialize()

    // Re-select the updated asset so the JSON view reflects the new data
    if (previouslySelectedId) {
      const updatedAsset = assetList.value.find((a: any) => a['@id'] === previouslySelectedId)
      if (updatedAsset) {
        selectedAsset.value = updatedAsset
      }
    }
  }

  async function onAssetDeleted (): Promise<void> {
    // Only clear the selection if the deleted asset was the currently selected one
    if (assetToDelete.value?.['@id'] === selectedAsset.value?.['@id']) {
      selectedAsset.value = {}
    }
    // Reload the asset list
    await initialize()
  }

  function filterAssetList (value: string): void {
    if (!value || value.trim() === '') {
      assetList.value = assetListUnfiltered.value
    } else {
      // Filter list of SMs (cf. AASList.vue)
      const assetListFiltered = assetListUnfiltered.value.filter(
        (asset: any) =>
          asset['@id'].toLowerCase().includes(value.toLowerCase()),
      )
      assetList.value = assetListFiltered
    }
    scrollToSelectedAsset()
  }

  function selectAsset (asset: any): void {
    if (isSelected(asset)) {
      selectedAsset.value = {}
    } else {
      selectedAsset.value = asset

      if (!selectedAsset.value || Object.keys(selectedAsset.value).length === 0) {
        scrollToSelectedAsset()
      }
    }
  }

  function isSelected (asset: any): boolean {
    if (
      !selectedAsset.value
      || Object.keys(selectedAsset.value).length === 0
      || !selectedAsset.value['@id']
      || !asset
      || Object.keys(asset).length === 0
      || !asset['@id']
    ) {
      return false
    }
    return selectedAsset.value['@id'] === asset['@id']
  }

  function scrollToSelectedAsset (): void {
    // Find the index of the selected item
    const index = assetList.value.findIndex((sm: any) => isSelected(sm))

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

</script>
