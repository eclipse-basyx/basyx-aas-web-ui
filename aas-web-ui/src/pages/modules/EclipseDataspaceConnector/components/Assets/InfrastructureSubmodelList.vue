<template>
  <v-card class="d-flex flex-column" color="card" elevation="0">
    <!-- Title bar -->
    <v-card-title class="px-0 py-2 d-flex align-center">
      <v-tooltip location="bottom" open-delay="600">
        <template #activator="{ props: activatorProps }">
          <v-btn
            class="ma-0"
            :disabled="!aas"
            icon="mdi-reload"
            :loading="listLoading"
            variant="plain"
            v-bind="activatorProps"
            @click="loadSubmodels"
          />
        </template>

        <span>Reload Submodel List</span>
      </v-tooltip>

      <div class="flex-grow-1 pr-2">
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
          <v-checkbox-btn
            class="flex-grow-0 mr-1 text-body-large"
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
    </v-card-title>

    <v-divider />

    <!-- Submodel List (fills the remaining height, only the virtual scroll scrolls) -->
    <v-list
      bg-color="card"
      class="pa-0 d-flex flex-column flex-grow-1"
      nav
    >
      <v-skeleton-loader v-if="listLoading" class="mx-2" type="list-item@6" />

      <v-empty-state
        v-else-if="!aas"
        :class="{ 'text-divider': !infrastructure }"
        icon="mdi-gesture-tap"
        text="Select an AAS to view its Submodels"
        title="Select AAS"
      >
        <template #media>
          <v-icon :color="infrastructure ? undefined : 'divider'" size="64" />
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
    </v-list>
  </v-card>
</template>

<script lang="ts" setup>
  import type { InfrastructureConfig } from '@/types/Infrastructure'
  import type { Ref } from 'vue'
  import { filterResolvedSubmodels } from '@/composables/AAS/AASHandling'
  import { useReferableUtils } from '@/composables/AAS/ReferableUtils'
  import { useSubmodelDisplay } from '@/composables/AAS/SubmodelDisplay'
  import { useSMRepositoryClient } from '@/composables/Client/SMRepositoryClient'
  import { useLoadGeneration } from '@/composables/LoadGeneration'
  import { extractId as extractIdFromReference } from '@/utils/AAS/ReferenceUtil'

  const props = defineProps<{
    infrastructure: InfrastructureConfig | null
    aas: any
  }>()

  const selectedSubmodels = defineModel<Array<any>>({ default: () => [] })

  // Composables
  const { fetchSmById } = useSMRepositoryClient()
  const { nameToDisplay, descriptionToDisplay } = useReferableUtils()
  const { sortSmsForDisplay } = useSubmodelDisplay()

  // Data
  const allSubmodels = ref([] as Array<any>) as Ref<Array<any>> // All Submodels of the AAS
  const searchValue = ref<string | null>('')
  const listLoad = useLoadGeneration()
  const listLoading = listLoad.loading

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

  // Watchers
  watch(
    () => [props.infrastructure?.id, props.aas?.id],
    () => {
      searchValue.value = ''
      selectedSubmodels.value = []
      loadSubmodels()
    },
    { immediate: true },
  )

  // Lifecycle Hooks
  onBeforeUnmount(() => {
    listLoad.invalidate()
  })

  // Methods
  async function loadSubmodels (): Promise<void> {
    allSubmodels.value = []

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

      allSubmodels.value = sortSmsForDisplay(filterResolvedSubmodels(submodels))
      // Keep the selection of a reload, replaced by the reloaded Submodels
      selectedSubmodels.value = allSubmodels.value.filter(sm => submodelIsSelected(sm))
    } finally {
      listLoad.finish(generation)
    }
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
