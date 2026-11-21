<template>
  <!-- A column at least as tall as the visualization panel; the requirement sets card takes the remaining height -->
  <v-container class="d-flex flex-column pa-0" fluid :style="{ minHeight: panelHeight }">
    <VisualizationHeader default-title="Railway Fire Protection" :submodel-element-data="submodelElementData" />

    <!-- Loading -->
    <template v-if="isLoading">
      <v-row class="mb-4" dense>
        <v-col v-for="n in 2" :key="n" cols="12" md="6">
          <v-card>
            <v-skeleton-loader type="heading, table-heading@4" />
          </v-card>
        </v-col>
      </v-row>

      <v-card class="flex-grow-1">
        <v-card-text class="rfp-grid">
          <v-skeleton-loader v-for="n in 3" :key="n" class="rfp-grid__placeholder border rounded" type="article" />
        </v-card-text>
      </v-card>
    </template>

    <template v-else>
      <!-- Product and material -->
      <RailwayFireProtectionSummary :manufacturer="data.manufacturer" :material="data.material" />

      <!-- Requirement sets: hazard level filter and tiles -->
      <v-card class="flex-grow-1">
        <v-card-title>
          <div class="text-body-large">Requirement sets</div>
        </v-card-title>

        <v-card-text class="d-flex flex-column ga-4">
          <div v-if="data.requirementsSets.length > 0" class="d-flex flex-wrap align-center ga-2">
            <div id="rfp-filter-label" class="d-flex align-center ga-1 text-label-large text-medium-emphasis">
              <v-icon icon="mdi-filter-variant" size="small" />
              <span>Filter by hazard level</span>
            </div>

            <v-chip-group
              v-model="selectedCodes"
              aria-labelledby="rfp-filter-label"
              class="py-0"
              column
              multiple
            >
              <v-chip
                v-for="entry in hazardLevelCounts"
                :key="entry.code"
                :color="hazardLevelMeta(entry.code).color"
                filter
                label
                size="small"
                :value="entry.code"
                variant="tonal"
              >
                {{ hazardLevelMeta(entry.code).short }}
                <span class="ml-1 font-weight-bold">{{ entry.count }}</span>
              </v-chip>
            </v-chip-group>

            <v-btn
              v-if="selectedCodes.length > 0"
              prepend-icon="mdi-filter-remove-outline"
              size="small"
              variant="text"
              @click="selectedCodes = []"
            >
              Clear filter
            </v-btn>
          </div>

          <div v-if="visibleSets.length > 0" class="rfp-grid">
            <RailwayFireProtectionTile
              v-for="set in visibleSets"
              :key="set.key"
              :ref="(instance: unknown) => setTileRef(set.key, instance)"
              :reports="data.reports"
              :requirements-set="set"
              @open="openRequirementsSet(set)"
            />
          </div>

          <v-alert
            v-else-if="data.requirementsSets.length > 0"
            density="compact"
            type="info"
            variant="tonal"
          >
            No requirement set matches the hazard level filter.
            <template #append>
              <v-btn size="small" variant="text" @click="selectedCodes = []">Clear filter</v-btn>
            </template>
          </v-alert>

          <v-alert
            v-else
            density="compact"
            icon="mdi-information-outline"
            text="No requirement sets found in this submodel."
            type="info"
            variant="tonal"
          />
        </v-card-text>
      </v-card>
    </template>

    <!-- Details of the clicked requirement set: flips and zooms out of its tile -->
    <v-dialog
      v-model="dialogOpen"
      :fullscreen="xs"
      max-width="900"
      scrollable
      :transition="dialogTransition"
      @after-leave="onDialogAfterLeave"
    >
      <RailwayFireProtectionDetails
        v-if="activeSet"
        :reports="data.reports"
        :requirements-set="activeSet"
        @close="dialogOpen = false"
      />
    </v-dialog>
  </v-container>
</template>

<script lang="ts" setup>
  import type {
    HazardLevelCode,
    RailwayFireProtectionData,
    RequirementsSet,
    SubmodelElementLike,
  } from './RailwayFireProtection_v1_0/types'
  import { useRoute } from 'vue-router'
  import { useDisplay } from 'vuetify'
  import { useSMHandling } from '@/composables/AAS/SMHandling'
  import RailwayFireProtectionFlipTransition from './RailwayFireProtection_v1_0/components/RailwayFireProtectionFlipTransition.vue'
  import { hazardLevelMeta } from './RailwayFireProtection_v1_0/utils/hazardLevel'
  import { parseRailwayFireProtection } from './RailwayFireProtection_v1_0/utils/parseRailwayFireProtection'
  import {
    countHazardLevels,
    filterRequirementsSets,
    sortRequirementsSets,
  } from './RailwayFireProtection_v1_0/utils/presentation'

  defineOptions({
    name: 'RailwayFireProtection',
    semanticId: 'https://admin-shell.io/idta/cds/RailwayFireProtection/1',
  })

  // Props
  const props = defineProps<{
    submodelElementData?: SubmodelElementLike
  }>()

  type TileHandle = {
    focus: () => void
    originElement: () => HTMLElement | null
  }

  // Composables
  const { setData } = useSMHandling()
  const { xs } = useDisplay()
  const route = useRoute()

  // Reactive data
  const isLoading = ref(false)
  const data = ref<RailwayFireProtectionData>(emptyData())
  const selectedCodes = ref<HazardLevelCode[]>([])
  const dialogOpen = ref(false)
  const activeSet = ref<RequirementsSet | null>(null)
  const activeOrigin = shallowRef<HTMLElement | null>(null)
  const tiles = new Map<string, TileHandle>()
  let activeKey = ''

  // Computed properties
  /** Height of the visualization panel below the app bars, as used by SubmodelElementVisualization */
  const panelHeight = computed(() =>
    route?.name === 'AASSubmodelViewer' ? 'calc(100svh - 137px)' : 'calc(100svh - 202px)',
  )

  const hazardLevelCounts = computed(() => countHazardLevels(data.value.requirementsSets))

  const visibleSets = computed(() =>
    sortRequirementsSets(filterRequirementsSets(data.value.requirementsSets, selectedCodes.value)),
  )

  const dialogTransition = computed(() => ({
    component: RailwayFireProtectionFlipTransition,
    origin: activeOrigin.value,
  }))

  // Watchers
  watch(
    () => [props.submodelElementData?.id, props.submodelElementData?.path, props.submodelElementData?.timestamp],
    initializeVisualization,
  )

  onMounted(initializeVisualization)

  // Methods
  function emptyData (): RailwayFireProtectionData {
    return { manufacturer: null, material: null, requirementsSets: [], reports: [] }
  }

  async function initializeVisualization (): Promise<void> {
    isLoading.value = true
    dialogOpen.value = false
    selectedCodes.value = []

    if (!props.submodelElementData || Object.keys(props.submodelElementData).length === 0) {
      data.value = emptyData()
      isLoading.value = false
      return
    }

    // setData assigns the `path` of every element, which is needed to request the report files
    const submodel = await setData(
      { ...props.submodelElementData },
      props.submodelElementData.path ?? '',
      false,
      props.submodelElementData.timestamp,
    )
    data.value = parseRailwayFireProtection(submodel)
    isLoading.value = false
  }

  function setTileRef (key: string, instance: unknown): void {
    if (instance) {
      tiles.set(key, instance as TileHandle)
    } else {
      tiles.delete(key)
    }
  }

  function openRequirementsSet (set: RequirementsSet): void {
    if (dialogOpen.value) {
      return
    }
    // The dialog transition turns the tile into the dialog, see RailwayFireProtectionFlipTransition
    activeKey = set.key
    activeSet.value = set
    activeOrigin.value = tiles.get(set.key)?.originElement() ?? null
    dialogOpen.value = true
  }

  function onDialogAfterLeave (): void {
    tiles.get(activeKey)?.focus()
    activeSet.value = null
    activeOrigin.value = null
    activeKey = ''
  }
</script>

<style scoped>
  .rfp-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 16px;
  }

  .rfp-grid__placeholder {
    aspect-ratio: 1 / 1;
  }
</style>
