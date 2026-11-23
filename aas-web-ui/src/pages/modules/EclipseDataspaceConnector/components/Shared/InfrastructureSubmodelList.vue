<template>
  <v-card class="d-flex flex-column" color="card" elevation="0">
    <!-- Title bar -->
    <v-card-title class="px-0 py-2 d-flex align-center">
      <v-tooltip location="bottom" open-delay="600">
        <template #activator="{ props: activatorProps }">
          <v-checkbox-btn
            class="flex-grow-0 ml-1 text-body-large"
            color="primary"
            :disabled="submodelList.length === 0"
            :indeterminate="someListedSelected && !allListedSelected"
            :model-value="allListedSelected"
            v-bind="activatorProps"
            @update:model-value="toggleAllListed"
          />
        </template>

        <span>{{ allListedSelected ? 'Deselect all submodels' : 'Select all submodels' }}</span>
      </v-tooltip>

      <div class="flex-grow-1">
        <v-text-field
          v-model="searchValue"
          clearable
          density="compact"
          :disabled="!aas"
          hide-details
          label="Search Submodel"
          persistent-placeholder
          :placeholder="submodelList.length + ' Submodels'"
          variant="outlined"
        />
      </div>

      <v-tooltip location="bottom" open-delay="600">
        <template #activator="{ props: activatorProps }">
          <v-btn
            class="ma-0"
            :disabled="!aas"
            icon="mdi-reload"
            :loading="listLoading"
            variant="plain"
            v-bind="activatorProps"
            @click="loadSubmodels()"
          />
        </template>

        <span>Reload Submodel List</span>
      </v-tooltip>
    </v-card-title>

    <v-divider />

    <!-- Submodel List (fills the remaining height, only the virtual scroll scrolls) -->
    <v-list
      bg-color="card"
      class="pa-0 d-flex flex-column flex-grow-1"
      nav
    >
      <v-skeleton-loader v-if="listLoading" class="mx-2" type="list-item@6" />

      <SelectAasEmptyState
        v-else-if="aasUnavailable || !aas"
        :aas-unavailable="aasUnavailable"
        :infrastructure-selected="!!infrastructure"
        text="Select an AAS to view its Submodels"
      />

      <v-empty-state
        v-else-if="loadFailure"
        icon="mdi-database-alert-outline"
        :text="loadFailureMessage.text"
        :title="loadFailureMessage.title"
      >
        <template #media>
          <v-icon size="64" />
        </template>
      </v-empty-state>

      <v-empty-state
        v-else-if="allSubmodels.length === 0"
        class="text-divider"
        text="The selected AAS does not contain any Submodels"
        title="No existing Submodels"
      />

      <v-empty-state
        v-else-if="submodelList.length === 0"
        class="text-divider"
        text="No Submodels match the search"
        title="No matching Submodels"
      />

      <v-virtual-scroll
        v-else
        class="pb-2 bg-card"
        :item-height="56"
        :items="submodelList"
      >
        <template #default="{ item }">
          <SubmodelListItem
            :key="item.id"
            :aas-id="aas?.id"
            class="mt-2 mx-2"
            selectable
            :selected="submodelIsSelected(item)"
            show-id
            :submodel="item"
            @click="selectSubmodel(item)"
          />
        </template>
      </v-virtual-scroll>

      <!-- Some of the referenced Submodels could not be loaded -->
      <v-list-item v-if="!listLoading && allSubmodels.length > 0 && unloadedCount > 0" class="px-4 py-1" density="compact">
        <template #prepend>
          <v-icon color="warning" size="small">mdi-alert-outline</v-icon>
        </template>

        <v-list-item-subtitle class="text-listItemText">
          {{ unloadedCount }} of {{ unloadedCount + allSubmodels.length }} Submodels could not be loaded
        </v-list-item-subtitle>
      </v-list-item>
    </v-list>
  </v-card>
</template>

<script lang="ts" setup>
  import type { AasUnavailableReason } from '@/pages/modules/EclipseDataspaceConnector/components/Shared/SelectAasEmptyState.vue'
  import type { InfrastructureConfig } from '@/types/Infrastructure'
  import type { Ref } from 'vue'
  import { useReferableUtils } from '@/composables/AAS/ReferableUtils'
  import { useSubmodelDisplay } from '@/composables/AAS/SubmodelDisplay'
  import { useSMRepositoryClient } from '@/composables/Client/SMRepositoryClient'
  import { useLoadGeneration } from '@/composables/LoadGeneration'
  import SelectAasEmptyState from '@/pages/modules/EclipseDataspaceConnector/components/Shared/SelectAasEmptyState.vue'
  import { extractId as extractIdFromReference } from '@/utils/AAS/ReferenceUtil'
  import { isSubmodelPayload } from '@/utils/AAS/SubmodelUtils'

  const props = defineProps<{
    infrastructure: InfrastructureConfig | null
    aas: any
    aasUnavailable?: AasUnavailableReason | null // Why the AAS List offers no AAS to select
    preselectAll?: boolean // Select all Submodels once those of a newly selected AAS are loaded
  }>()

  const selectedSubmodels = defineModel<Array<any>>({ default: () => [] })
  const failed = defineModel<boolean>('failed', { default: false }) // None of the referenced Submodels could be loaded

  // Composables
  const { fetchSmById } = useSMRepositoryClient()
  const { nameToDisplay, descriptionToDisplay } = useReferableUtils()
  const { sortSmsForDisplay } = useSubmodelDisplay()

  // Data
  const allSubmodels = ref([] as Array<any>) as Ref<Array<any>> // All Submodels of the AAS
  const searchValue = ref<string | null>('')
  const listLoad = useLoadGeneration()
  const listLoading = listLoad.loading
  const unloadedCount = ref(0) // Referenced Submodels that could not be loaded
  const loadFailure = ref<{ unauthorized: boolean } | null>(null) // None of the referenced Submodels could be loaded

  // Computed Properties
  const submodelList = computed(() => {
    const trimmedSearch = searchValue.value?.trim().toLowerCase() ?? ''
    if (trimmedSearch === '') return allSubmodels.value

    return allSubmodels.value.filter(
      (sm: any) =>
        sm.id?.toLowerCase().includes(trimmedSearch)
        || sm.idShort?.toLowerCase().includes(trimmedSearch)
        || nameToDisplay(sm).toLowerCase().includes(trimmedSearch)
        || descriptionToDisplay(sm).toLowerCase().includes(trimmedSearch),
    )
  })
  const allListedSelected = computed(() =>
    submodelList.value.length > 0 && submodelList.value.every(sm => submodelIsSelected(sm)),
  )
  const someListedSelected = computed(() => submodelList.value.some(sm => submodelIsSelected(sm)))
  const loadFailureMessage = computed(() => {
    if (!loadFailure.value?.unauthorized) {
      return { title: 'Submodels Not Available', text: 'The Submodels could not be loaded. Reload the Submodel List to try again.' }
    }
    const infrastructure = props.infrastructure
    return infrastructure?.auth?.securityType === 'OAuth2' && !infrastructure.token?.accessToken
      ? { title: 'Authentication Required', text: `Log in to ${infrastructure.name} to load the Submodels.` }
      : { title: 'Access Denied', text: 'You are not allowed to read the Submodels of this AAS.' }
  })

  // Watchers
  watch(
    () => [props.infrastructure?.id, props.aas?.id],
    () => {
      searchValue.value = ''
      selectedSubmodels.value = []
      loadSubmodels(props.preselectAll)
    },
    { immediate: true },
  )

  // Lifecycle Hooks
  onBeforeUnmount(() => {
    listLoad.invalidate()
  })

  // Methods
  async function loadSubmodels (selectAll = false): Promise<void> {
    allSubmodels.value = []
    setLoadFailure(null, 0)

    const aas = props.aas
    const infrastructure = props.infrastructure
    if (!aas?.id || !infrastructure) {
      listLoad.invalidate()
      return
    }

    const generation = listLoad.start()

    try {
      const submodelRefs: Array<any> = Array.isArray(aas.submodels) ? aas.submodels : []
      const submodels = await Promise.all(
        submodelRefs.map(submodelRef =>
          fetchSmById(extractIdFromReference(submodelRef, 'Submodel'), aas.id, infrastructure),
        ),
      )
      if (!listLoad.isCurrent(generation)) return

      // Failed requests return placeholders like "Submodel Not Authorized!" or an empty object
      allSubmodels.value = sortSmsForDisplay(submodels.filter(sm => isSubmodelPayload(sm)))
      const unloaded = submodels.filter(sm => !isSubmodelPayload(sm))
      setLoadFailure(
        allSubmodels.value.length === 0 && unloaded.length > 0
          ? { unauthorized: unloaded.every(sm => sm?.idShort === 'Submodel Not Authorized!') }
          : null,
        unloaded.length,
      )
      // Keep the selection of a reload, replaced by the reloaded Submodels
      selectedSubmodels.value = selectAll
        ? [...allSubmodels.value]
        : allSubmodels.value.filter(sm => submodelIsSelected(sm))
    } finally {
      listLoad.finish(generation)
    }
  }

  function setLoadFailure (failure: { unauthorized: boolean } | null, unloaded: number): void {
    loadFailure.value = failure
    unloadedCount.value = unloaded
    failed.value = !!failure
  }

  function selectSubmodel (submodel: any): void {
    selectedSubmodels.value = submodelIsSelected(submodel)
      ? selectedSubmodels.value.filter(sm => sm.id !== submodel.id)
      : [...selectedSubmodels.value, submodel]
  }

  function toggleAllListed (): void {
    const listedIds = new Set(submodelList.value.map(sm => sm.id))
    const unlisted = selectedSubmodels.value.filter(sm => !listedIds.has(sm.id))
    selectedSubmodels.value = allListedSelected.value ? unlisted : [...unlisted, ...submodelList.value]
  }

  function submodelIsSelected (submodel: any): boolean {
    return !!submodel?.id && selectedSubmodels.value.some(sm => sm.id === submodel.id)
  }
</script>
