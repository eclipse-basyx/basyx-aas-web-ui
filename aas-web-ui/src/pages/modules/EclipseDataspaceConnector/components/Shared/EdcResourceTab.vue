<template>
  <v-container class="pa-0 ma-0" fluid :style="{ 'height': EDC_TAB_HEIGHT}">

    <v-layout :style="{ 'height': EDC_TAB_HEIGHT}">
      <EdcResourceListDrawer
        ref="listDrawer"
        :editable="managementWritesAllowed"
        :icon="icon"
        :is-selected="isSelected"
        :items="resources"
        :label="label"
        :list-loading="listLoading"
        :page-loading="pageLoading"
        :reload-tooltip="`Reload ${label} List`"
        @delete="(item: any) => openDialog(deleteDialog, item)"
        @edit="(item: any) => openDialog(updateDialog, item)"
        @reload="loadResources()"
        @select="selectResource"
      >
        <template #title>
          <v-text-field
            v-model="searchQuery"
            clearable
            density="compact"
            hide-details
            :label="`Search for ${label} ...`"
            variant="outlined"
            @update:model-value="reloadForSearch()"
          />

          <!-- Menu, only when the EDC BFF allows writes -->
          <v-menu v-if="managementWritesAllowed">
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
        </template>

        <!-- Optional filter below the search field, e.g. by asset type -->
        <template v-if="$slots.filter" #filter>
          <div class="px-12 pb-2">
            <slot name="filter" />
          </div>
        </template>

        <template #item-title="{ item }">
          <slot :item="item" name="item-title">{{ item['@id'] }}</slot>
        </template>

        <template #item-subtitle="{ item }">
          <slot :item="item" name="item-subtitle" />
        </template>

        <template #item-tooltip="{ item }">
          <slot :item="item" name="item-tooltip" />
        </template>

        <template #empty>
          <v-empty-state
            v-if="listRequestFailed"
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
      </EdcResourceListDrawer>

      <v-main>
        <v-container fluid>

          <!-- Placeholder of the JSON preview while the list loads -->
          <v-skeleton-loader
            v-if="listLoading"
            class="border rounded-lg"
            type="list-item-avatar, divider, paragraph@3"
          />

          <div v-else-if="!selectedResource" class="d-flex align-center justify-center" :style="{'height': EDC_MAIN_HEIGHT}">

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
              :text="`Please select ${withIndefiniteArticle(label)} to view`"
              :title="`Select ${label}`"
            >
              <template #media>
                <v-icon size="64" />
              </template>
            </v-empty-state>
          </div>

          <template v-else>
            <JSONPreview
              :download-file-name="selectedResource['@id']"
              :height="EDC_JSON_PREVIEW_HEIGHT"
              :icon="icon"
              :json-content="selectedResource"
              :title="label"
            />
          </template>

        </v-container>
      </v-main>
    </v-layout>
  </v-container>

  <!-- Create, update and delete dialogs only when the EDC BFF allows writes, also when opened by the route -->
  <!-- Create Dialogs, `onCreated` reloads the list and selects the created resource -->
  <slot
    v-if="managementWritesAllowed"
    name="dialogs"
    :on-created="onCreated"
    :proxy-id="edcProxyId"
  />

  <UpdateEdcResourceDialog
    v-if="managementWritesAllowed"
    v-model="updateDialog.open"
    :icon="icon"
    :label="label"
    :proxy-id="edcProxyId"
    :resource="updateDialog.resource"
    :update="update"
    @updated="loadResources()"
  />

  <slot
    v-if="managementWritesAllowed"
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
  import type { CatenaXEdcResult } from '@/composables/Client/CatenaXEdcClient'
  import type { EdcListPage, EdcPageResult } from '@/pages/modules/EclipseDataspaceConnector/composables/EdcPaging'
  import { useLoadGeneration } from '@/composables/LoadGeneration'
  import { useSelectedEdcConfig } from '@/composables/SelectedEdcConfig'
  import DeleteEdcResourceDialog from '@/pages/modules/EclipseDataspaceConnector/components/Shared/DeleteEdcResourceDialog.vue'
  import EdcResourceListDrawer from '@/pages/modules/EclipseDataspaceConnector/components/Shared/EdcResourceListDrawer.vue'
  import UpdateEdcResourceDialog from '@/pages/modules/EclipseDataspaceConnector/components/Shared/UpdateEdcResourceDialog.vue'
  import { useEdcManagementWrites } from '@/pages/modules/EclipseDataspaceConnector/composables/EdcManagementWrites'
  import { type EdcVirtualScroll, useEdcPagedList } from '@/pages/modules/EclipseDataspaceConnector/composables/EdcPagedList'
  import { edcBffFailureText, useEdcRequestFailureMessage } from '@/pages/modules/EclipseDataspaceConnector/composables/EdcRequestFailure'
  import { isSameEdcResource } from '@/pages/modules/EclipseDataspaceConnector/composables/EdcResourceId'
  import { EDC_JSON_PREVIEW_HEIGHT, EDC_MAIN_HEIGHT, EDC_TAB_HEIGHT } from '@/pages/modules/EclipseDataspaceConnector/data/heights'
  import { debounce } from '@/utils/generalUtils'
  import { withIndefiniteArticle } from '@/utils/StringUtils'

  interface ResourceDialog {
    open: boolean
    resource: any
  }

  const props = defineProps<{
    label: string // e.g. `Asset`, used in all texts
    labelPlural: string
    icon: string
    createActions: Array<{ title: string, tooltip: string, onClick: () => void }>
    // A page of the list, e.g. filtered by the value of the `filter` slot. `search` matches a part of the ID
    queryPage: (proxyId: string, page: EdcListPage) => Promise<EdcPageResult<any>>
    update: (proxyId: string, resourceId: string, resource: any) => Promise<CatenaXEdcResult>
    delete?: (proxyId: string, resourceId: string) => Promise<CatenaXEdcResult> // Not needed with the `delete-dialog` slot
  }>()

  const emit = defineEmits<{
    // Another EDC is selected, e.g. by switching the infrastructure; emitted before the list loads from it
    (event: 'proxy-change', proxyId: string): void
  }>()

  defineExpose({ loadResources })

  const slots = useSlots()

  // Composables
  const { edcProxyId } = useSelectedEdcConfig()
  const { showFailureMessage } = useEdcRequestFailureMessage()
  const resourceLoad = useLoadGeneration() // A newer load sets the selection

  // Data
  const searchQuery = ref<string | null>('')

  const listDrawer = useTemplateRef<InstanceType<typeof EdcResourceListDrawer>>('listDrawer')
  const selectedResource = ref<any>(null)

  const updateDialog = reactive<ResourceDialog>({ open: false, resource: {} })
  const deleteDialog = reactive<ResourceDialog>({ open: false, resource: {} })

  // Computed properties
  const virtualScrollRef = computed<EdcVirtualScroll | null>(() => listDrawer.value?.virtualScroll ?? null)
  // The list starts below the search (and filter), so its empty state moves up to the title height of the one on the right
  const emptyStateOffsetClass = computed(() => slots.filter ? 'mt-n9' : 'mt-n3')
  const failedEmptyStateOffsetClass = computed(() => slots.filter ? 'mt-n12' : 'mt-n6') // With icon and text, like the one on the right

  // Composables that depend on the EDC proxy ID
  const { managementWritesAllowed } = useEdcManagementWrites(edcProxyId)

  // Loaded pages, sorted by ID by the EDC
  const {
    items: resources,
    listLoading,
    pageLoading,
    requestFailed: listRequestFailed,
    reload,
    scrollToItem: scrollToResource,
  } = useEdcPagedList<any>({
    virtualScrollRef,
    queryPage: page => props.queryPage(edcProxyId.value, { ...page, search: searchText() }),
    onFailure: failure => showFailureMessage(`Failed to load the ${props.labelPlural}.`, edcBffFailureText(failure)),
  })

  // Watchers
  // List, selection and open dialogs belong to the previous EDC, its IDs must not reach the new one
  watch(edcProxyId, proxyId => {
    updateDialog.open = false
    deleteDialog.open = false
    selectedResource.value = null
    emit('proxy-change', proxyId)
    void loadResources()
  })

  onMounted(() => {
    loadResources()
  })

  onActivated(() => {
    scrollToResource(isSelected)
  })

  /**
   * Loads the first page again. The selection points to the reloaded resource, so the JSON view shows updates,
   * also for a resource beyond the first page, and drops deleted resources.
   */
  async function loadResources (): Promise<void> {
    const generation = resourceLoad.start()
    try {
      const selectedId = selectedResource.value?.['@id']
      if (!(await reload())) return

      if (listRequestFailed.value) {
        selectedResource.value = null // A failed reload drops the previous list, like a failed first load
        return
      }

      const reloadedSelection = selectedId ? await findResource(selectedId) : null
      if (!resourceLoad.isCurrent(generation)) return
      selectedResource.value = reloadedSelection
      scrollToResource(isSelected)
    } finally {
      resourceLoad.finish(generation)
    }
  }

  // `keepSelection` keeps a selected resource instead of selecting the created one
  async function onCreated (resourceId?: string, { keepSelection = false }: { keepSelection?: boolean } = {}): Promise<void> {
    const hadSelection = !!selectedResource.value

    await loadResources()

    if (!resourceId || (hadSelection && keepSelection)) return

    const createdResource = await findResource(resourceId)
    if (createdResource) {
      selectedResource.value = createdResource
      scrollToResource(isSelected)
    }
  }

  // Finds a resource in the loaded pages, otherwise asks the EDC, e.g. for a resource beyond the first page
  async function findResource (resourceId: string): Promise<any> {
    const loadedResource = resources.value.find(resource => resource['@id'] === resourceId)
    if (loadedResource) return loadedResource

    const result = await props.queryPage(edcProxyId.value, { offset: 0, limit: 50, search: resourceId })
    return result.success ? (result.data.find(resource => resource['@id'] === resourceId) ?? null) : null
  }

  function searchText (): string | undefined {
    return searchQuery.value?.trim() || undefined
  }

  const reloadForSearch = debounce(() => {
    void loadResources()
  }, 300)

  function openDialog (dialog: ResourceDialog, resource: any): void {
    dialog.resource = resource
    dialog.open = true
  }

  function selectResource (resource: any): void {
    selectedResource.value = isSelected(resource) ? null : resource
  }

  function isSelected (resource: any): boolean {
    return isSameEdcResource(resource, selectedResource.value)
  }

</script>
