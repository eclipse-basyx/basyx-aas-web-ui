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
              <template #activator="{ props: tooltipProps }">
                <v-btn
                  class="ma-0"
                  icon="mdi-reload"
                  v-bind="tooltipProps"
                  :loading="listLoading"
                  variant="plain"
                  @click="loadResources()"
                />
              </template>

              <span>Reload {{ label }} List</span>
            </v-tooltip>

            <v-text-field
              v-model="searchQuery"
              clearable
              density="compact"
              hide-details
              :label="`Search for ${label} ...`"
              variant="outlined"
              @update:model-value="scrollToSelectedResource()"
            />

            <!-- Menu -->
            <v-menu>
              <template #activator="{ props: menuProps }">
                <v-btn
                  v-bind="menuProps"
                  class="mx-0"
                  icon="mdi-dots-vertical"
                  variant="plain"
                />
              </template>

              <v-sheet border>
                <v-list class="py-0" density="compact">

                  <!-- Create Dialogs -->
                  <v-tooltip
                    v-for="createAction in createActions"
                    :key="createAction.title"
                    location="bottom"
                    open-delay="600"
                  >
                    <template #activator="{ props: tooltipProps }">
                      <v-list-item slim v-bind="tooltipProps" @click="createAction.onClick()">
                        <template #prepend>
                          <v-icon size="small">mdi-plus</v-icon>
                        </template>
                        {{ createAction.title }}
                      </v-list-item>
                    </template>

                    <span>{{ createAction.tooltip }}</span>
                  </v-tooltip>

                </v-list>
              </v-sheet>
            </v-menu>

          </v-card-title>

          <!-- Optional filter below the search field, e.g. by asset type -->
          <div v-if="$slots.filter" class="px-12 pb-2">
            <slot name="filter" />
          </div>

          <v-divider />

          <v-card-text class="pt-0 pb-0 px-2" style="overflow-y: auto" :style="{ height: listHeight }">

            <div v-if="listLoading">
              <v-skeleton-loader type="list-item@6" />
            </div>

            <template v-else>

              <!-- List of Resources -->
              <v-list
                v-if="filteredResources.length > 0"
                class="pa-0"
                density="compact"
                nav
              >
                <v-virtual-scroll
                  ref="virtualScrollRef"
                  class="bg-card mb-2"
                  :item-height="56"
                  :items="filteredResources"
                >

                  <template #default="{ item }">
                    <EdcResourceListItem
                      :key="item['@id']"
                      :icon="icon"
                      :label="label"
                      :resource="item"
                      :selected="isSelected(item)"
                      @delete="openDialog(deleteDialog, item)"
                      @edit="openDialog(updateDialog, item)"
                      @select="selectResource(item)"
                    >
                      <template #title>
                        <slot :item="item" name="item-title">{{ item['@id'] }}</slot>
                      </template>

                      <template #subtitle>
                        <slot :item="item" name="item-subtitle" />
                      </template>

                      <template #tooltip>
                        <slot :item="item" name="item-tooltip" />
                      </template>
                    </EdcResourceListItem>
                  </template>

                </v-virtual-scroll>
              </v-list>

              <v-empty-state
                v-else-if="listRequestFailed"
                :class="failedEmptyStateOffsetClass"
                icon="mdi-database-alert-outline"
                :text="`The ${labelPlural} could not be loaded. Reload the ${label} List to try again.`"
                :title="`${labelPlural} Not Available`"
              >
                <template #media>
                  <v-icon size="64" />
                </template>
              </v-empty-state>

              <v-empty-state
                v-else
                class="text-divider"
                :class="emptyStateOffsetClass"
                :title="`No existing ${labelPlural}`"
              />
            </template>
          </v-card-text>
        </v-card>
      </v-navigation-drawer>

      <v-main>
        <v-container fluid>

          <!-- Placeholder of the JSON preview while the list loads -->
          <v-skeleton-loader
            v-if="listLoading"
            class="border rounded-lg"
            type="list-item-avatar, divider, paragraph@3"
          />

          <div v-else-if="!selectedResource" class="d-flex align-center justify-center" :style="{'height': fullHeightMain}">

            <v-empty-state
              v-if="listRequestFailed"
              icon="mdi-database-alert-outline"
              :text="`No ${label} can be selected, as the ${labelPlural} could not be loaded`"
              :title="`${labelPlural} Not Available`"
            >
              <template #media>
                <v-icon size="64" />
              </template>
            </v-empty-state>

            <v-empty-state
              v-else
              icon="mdi-gesture-tap"
              :text="`Please select ${/^[AEIOU]/.test(label) ? 'an' : 'a'} ${label} to view`"
              :title="`Select ${label}`"
            >
              <template #media>
                <v-icon size="64" />
              </template>
            </v-empty-state>
          </div>

          <template v-else>
            <JSONPreview
              :height="fullHeightMainJsonPreview"
              :icon="icon"
              :json-content="selectedResource"
              :title="label"
            />
          </template>

        </v-container>
      </v-main>
    </v-layout>
  </v-container>

  <!-- Create Dialogs, `onCreated` reloads the list and selects the created resource -->
  <slot name="dialogs" :on-created="onCreated" :proxy-id="edcProxyId" />

  <UpdateEdcResourceDialog
    v-model="updateDialog.open"
    :label="label"
    :proxy-id="edcProxyId"
    :resource="updateDialog.resource"
    :update="update"
    @updated="loadResources()"
  />

  <slot
    :dialog="deleteDialog"
    name="delete-dialog"
    :on-deleted="loadResources"
    :proxy-id="edcProxyId"
  >
    <DeleteEdcResourceDialog
      v-if="props.delete"
      v-model="deleteDialog.open"
      :delete="props.delete"
      :label="label"
      :proxy-id="edcProxyId"
      :resource="deleteDialog.resource"
      @deleted="loadResources()"
    />
  </slot>
</template>

<script lang="ts" setup>
  import type { CatenaXEdcQueryResult, CatenaXEdcResult } from '@/composables/Client/CatenaXEdcClient'
  import DeleteEdcResourceDialog from '@/pages/modules/EclipseDataspaceConnector/components/Shared/DeleteEdcResourceDialog.vue'
  import EdcResourceListItem from '@/pages/modules/EclipseDataspaceConnector/components/Shared/EdcResourceListItem.vue'
  import UpdateEdcResourceDialog from '@/pages/modules/EclipseDataspaceConnector/components/Shared/UpdateEdcResourceDialog.vue'
  import { edcBffFailureText, useEdcRequestFailureMessage } from '@/pages/modules/EclipseDataspaceConnector/composables/EdcRequestFailure'
  import { useInfrastructureStore } from '@/store/InfrastructureStore'

  // Extend the ComponentPublicInstance type to include scrollToIndex
  interface VirtualScrollInstance extends ComponentPublicInstance {
    scrollToIndex: (index: number) => void
  }

  interface ResourceDialog {
    open: boolean
    resource: any
  }

  const props = defineProps<{
    label: string // e.g. `Asset`, used in all texts
    labelPlural: string
    icon: string
    createActions: Array<{ title: string, tooltip: string, onClick: () => void }>
    query: (proxyId: string) => Promise<CatenaXEdcQueryResult<any>>
    update: (proxyId: string, resourceId: string, resource: any) => Promise<CatenaXEdcResult>
    delete?: (proxyId: string, resourceId: string) => Promise<CatenaXEdcResult> // Not needed with the `delete-dialog` slot
    matches?: (resource: any) => boolean // Client-side filter of the loaded resources, e.g. by the value of the `filter` slot
  }>()

  defineExpose({ loadResources })

  const slots = useSlots()

  // Stores
  const infrastructureStore = useInfrastructureStore()

  // Composables
  const { showFailureMessage } = useEdcRequestFailureMessage()

  // Data
  const fullHeight = ref('calc(100vh - 64px - 48px - 40px - 2px)') // Full height - header - tabs - footer - border
  const fullHeightMain = ref('calc(100vh - 64px - 48px - 40px - 32px - 2px)') // Full height - header - tabs - footer - padding - border
  const fullHeightMainJsonPreview = ref('calc(100vh - 64px - 48px - 40px - 32px - 2px - 64px - 32px)') // Full height - header - tabs - footer - padding - border - JSON title - padding

  const searchQuery = ref<string | null>('')

  const resources = ref<Array<any>>([]) // Sorted by ID, before filtering
  const listLoading = ref(false)
  const listRequestFailed = ref(false)
  const virtualScrollRef = ref<VirtualScrollInstance | null>(null)
  const selectedResource = ref<any>(null)

  const updateDialog = reactive<ResourceDialog>({ open: false, resource: {} })
  const deleteDialog = reactive<ResourceDialog>({ open: false, resource: {} })

  // Computed properties
  const selectedEdcConfig = computed(() => infrastructureStore.getSelectedInfrastructure?.catenaX?.edc ?? null)
  const edcProxyId = computed(() => selectedEdcConfig.value?.proxyId?.trim() ?? 'default')
  // Full height - header - tabs - footer - search (and filter) - borders
  const listHeight = computed(() => `calc(100svh - 64px - 48px - 40px - ${slots.filter ? 112 : 64}px - 3px)`)
  // The list starts below the search (and filter), so its empty state moves up to the title height of the one on the right
  const emptyStateOffsetClass = computed(() => slots.filter ? 'mt-n9' : 'mt-n3')
  const failedEmptyStateOffsetClass = computed(() => slots.filter ? 'mt-n12' : 'mt-n6') // With icon and text, like the one on the right
  const filteredResources = computed(() => {
    const query = searchQuery.value?.trim().toLowerCase()
    return resources.value.filter(resource =>
      (!query || resource['@id'].toLowerCase().includes(query)) && (props.matches?.(resource) ?? true))
  })

  onMounted(() => {
    loadResources()
  })

  onActivated(() => {
    scrollToSelectedResource()
  })

  async function loadResources (): Promise<void> {
    listLoading.value = true

    const result = await props.query(edcProxyId.value)
    listRequestFailed.value = !result.success

    if (result.success) {
      resources.value = result.data.toSorted((resourceA: any, resourceB: any) => resourceA['@id'] > resourceB['@id'] ? 1 : -1)

      // Point the selection to the reloaded resource, so the JSON view shows updates and drops deleted resources
      const selectedId = selectedResource.value?.['@id']
      selectedResource.value = resources.value.find(resource => resource['@id'] === selectedId) ?? null
    } else {
      // A failed reload drops the previous list, like a failed first load
      resources.value = []
      selectedResource.value = null
      showFailureMessage(`Failed to load the ${props.labelPlural}.`, edcBffFailureText(result))
    }

    listLoading.value = false
    scrollToSelectedResource()
  }

  async function onCreated (resourceId?: string, replaceSelection = true): Promise<void> {
    const hadSelection = !!selectedResource.value

    await loadResources()

    if (!resourceId || (hadSelection && !replaceSelection)) return

    const createdResource = resources.value.find(resource => resource['@id'] === resourceId)
    if (createdResource) {
      selectedResource.value = createdResource
      scrollToSelectedResource()
    }
  }

  function openDialog (dialog: ResourceDialog, resource: any): void {
    dialog.resource = resource
    dialog.open = true
  }

  function selectResource (resource: any): void {
    selectedResource.value = isSelected(resource) ? null : resource
  }

  function isSelected (resource: any): boolean {
    return !!resource?.['@id'] && resource['@id'] === selectedResource.value?.['@id']
  }

  function scrollToSelectedResource (): void {
    // Find the index of the selected item
    const index = filteredResources.value.findIndex(resource => isSelected(resource))

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
