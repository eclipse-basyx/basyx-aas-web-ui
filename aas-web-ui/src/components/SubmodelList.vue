<template>
  <v-container class="pa-0" fluid>
    <v-card color="rgba(0,0,0,0)" elevation="0">
      <!-- Title bar -->
      <template v-if="isMobile || submodelListUnfiltered.length > 10">
        <v-card-title :style="{ padding: !selectedAAS ? '15px 16px 16px' : '0px' }">
          <div class="d-flex align-center">
            <v-btn
              v-if="isMobile"
              class="ml-0"
              icon="mdi-chevron-left"
              variant="plain"
              @click="backToAASList()"
            />

            <span v-if="!selectedAAS || Object.keys(selectedAAS).length === 0">Submodel List </span>

            <template v-else-if="submodelListUnfiltered.length > 10">
              <v-col>
                <v-text-field
                  clearable
                  density="compact"
                  hide-details
                  label="Search for Submodel ..."
                  persistent-placeholder
                  :placeholder="submodelList.length.toString() + ' Submodels'"
                  variant="outlined"
                  @update:model-value="filterSubmodelList"
                />
              </v-col>
            </template>

            <template v-else>
              <v-icon class="ml-2" color="primary" icon="custom:aasIcon" size="small" />

              <span class="text-truncate ml-2">
                {{ nameToDisplay(selectedAAS) }}
              </span>
            </template>
          </div>
        </v-card-title>

        <v-divider />
      </template>

      <v-card-text class="pt-2 pb-0 px-2" style="overflow-y: auto; height: calc(100svh - 170px)">
        <div v-if="listLoading">
          <v-skeleton-loader type="list-item@6" />
        </div>

        <template v-else>
          <template v-if="selectedAAS && Object.keys(selectedAAS).length > 0">
            <!-- List of Submodels -->
            <v-list v-if="submodelList.length > 0" class="pa-0" density="compact" nav>
              <v-virtual-scroll
                ref="virtualScrollRef"
                class="bg-card"
                :item-height="56"
                :items="submodelList"
              >
                <template #default="{ item }">
                  <SubmodelListItem
                    :key="item.id"
                    class="mb-2"
                    :hide-tooltip="isMobile"
                    :selected="isSelected(item)"
                    :submodel="item"
                    @click="selectSM(item)"
                  />
                </template>
              </v-virtual-scroll>
            </v-list>

            <v-empty-state
              v-else
              class="text-divider"
              text="The selected AAS does not contain any Submodels"
              title="No existing Submodels"
            />
          </template>

          <template v-else>
            <v-empty-state
              class="text-divider"
              text="Select an AAS to view its Submodels"
              title="No selected AAS"
            />
          </template>
        </template>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script lang="ts" setup>
  import type { ComponentPublicInstance, Ref } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useAASHandling } from '@/composables/AAS/AASHandling'
  import { useReferableUtils } from '@/composables/AAS/ReferableUtils'
  import { useSubmodelDisplay } from '@/composables/AAS/SubmodelDisplay'
  import { useLoadGeneration } from '@/composables/LoadGeneration'
  import { useAASStore } from '@/store/AASDataStore'
  import { useInfrastructureStore } from '@/store/InfrastructureStore'
  import { useNavigationStore } from '@/store/NavigationStore'

  // Extend the ComponentPublicInstance type to include scrollToIndex
  interface VirtualScrollInstance extends ComponentPublicInstance {
    scrollToIndex: (index: number) => void
  }

  // Vue Router
  const route = useRoute()
  const router = useRouter()

  // Composables
  const { fetchAasSmListById } = useAASHandling()
  const { nameToDisplay, descriptionToDisplay } = useReferableUtils()
  const { sortSmsForDisplay } = useSubmodelDisplay()

  // Stores
  const navigationStore = useNavigationStore()
  const aasStore = useAASStore()
  const infrastructureStore = useInfrastructureStore()

  // Data
  const submodelList = ref([] as Array<any>) as Ref<Array<any>> // Variable to store the SM Data
  const submodelListUnfiltered = ref([] as Array<any>) as Ref<Array<any>> // Variable to store the SM Data before filtering
  const listLoad = useLoadGeneration()
  const listLoading = listLoad.loading // Variable to store if the Submodel List is loading
  const virtualScrollRef: Ref<VirtualScrollInstance | null> = ref(null) // Reference to the Virtual Scroll Component

  // Computed Properties
  const selectedAAS = computed(() => aasStore.getSelectedAAS)
  const selectedNode = computed(() => aasStore.getSelectedNode)
  const aasRegistryURL = computed(() => infrastructureStore.getAASRegistryURL)
  const submodelRegistryURL = computed(() => infrastructureStore.getSubmodelRegistryURL)
  const isMobile = computed(() => navigationStore.getIsMobile)

  // Watchers
  watch(
    () => aasRegistryURL.value,
    () => {
      listLoad.invalidate()
      submodelList.value = []
      submodelListUnfiltered.value = []
    },
  )

  watch(
    () => submodelRegistryURL.value,
    () => {
      listLoad.invalidate()
      submodelList.value = []
      submodelListUnfiltered.value = []
    },
  )

  watch(
    () => selectedAAS.value,
    () => {
      listLoad.invalidate()
      submodelList.value = []
      submodelListUnfiltered.value = []
      initialize()
    },
  )

  watch(
    () => selectedNode.value,
    () => {
      scrollToSelectedSubmodel()
    },
  )

  onMounted(() => {
    initialize()
  })

  onActivated(() => {
    scrollToSelectedSubmodel()
  })

  onBeforeUnmount(() => {
    listLoad.invalidate()
  })

  async function initialize (): Promise<void> {
    if (!selectedAAS.value || Object.keys(selectedAAS.value).length === 0) {
      listLoad.invalidate()
      submodelList.value = []
      submodelListUnfiltered.value = []
      return
    }

    const generation = listLoad.start()

    try {
      const submodels = await fetchAasSmListById(selectedAAS.value.id)
      if (!listLoad.isCurrent(generation)) {
        return
      }
      const submodelsSorted = sortSmsForDisplay(submodels)

      submodelList.value = [...submodelsSorted]

      submodelListUnfiltered.value = [...submodelsSorted]

      scrollToSelectedSubmodel()
    } finally {
      listLoad.finish(generation)
    }
  }

  function filterSubmodelList (value: string): void {
    if (!value || value.trim() === '') {
      submodelList.value = submodelListUnfiltered.value
    } else {
      // Filter list of SMs (cf. AASList.vue)
      const submodelListFiltered = submodelListUnfiltered.value.filter(
        (sm: any) =>
          sm.id.toLowerCase().includes(value.toLowerCase())
          || sm.idShort.toLowerCase().includes(value.toLowerCase())
          || nameToDisplay(sm).toLowerCase().includes(value.toLowerCase())
          || descriptionToDisplay(sm).toLowerCase().includes(value.toLowerCase()),
      )
      submodelList.value = submodelListFiltered
    }
    scrollToSelectedSubmodel()
  }

  function selectSM (submodel: any): void {
    // No deselection on mobile
    // On mobile every click on a submodel routes to visualization ()
    if (isSelected(submodel) && !isMobile.value) {
      // Deselect submodel: remove the path query
      const query = structuredClone(route.query)
      delete query.path
      router.push({ query: query })
    } else {
      // Select submodel: add smePath to path query
      let scrollToSubmodel = false
      if (!selectedNode.value || Object.keys(selectedNode.value).length === 0) {
        scrollToSubmodel = true
      }

      const query = { ...route.query, path: submodel.path }
      if (isMobile.value) {
        // Go to Visualization
        router.push({
          name: 'Visualization',
          query: query,
        })
      } else {
        router.push({
          query: query,
        })
      }

      if (scrollToSubmodel) scrollToSelectedSubmodel()
    }
  }

  function isSelected (submodel: any): boolean {
    if (
      !selectedNode.value
      || Object.keys(selectedNode.value).length === 0
      || !selectedNode.value.id
      || !submodel
      || Object.keys(submodel).length === 0
      || !submodel.id
    ) {
      return false
    }
    return selectedNode.value.id === submodel.id
  }

  function scrollToSelectedSubmodel (): void {
    // Find the index of the selected item
    const index = submodelList.value.findIndex((sm: any) => isSelected(sm))

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

  function backToAASList (): void {
    router.push({ name: 'AASList', query: route.query })
  }
</script>
