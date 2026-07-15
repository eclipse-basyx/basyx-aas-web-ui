<template>
  <v-container class="pa-0" fluid>
    <v-sheet>
      <v-divider v-if="!singleAas && !isMobile" />

      <v-card-title class="bg-detailsHeader px-1 py-0 d-flex align-center" style="height: 32px">
        <!-- AAS Status -->
        <div
          v-if="
            !isMobile &&
              singleAas &&
              assetAdministrationShellData.status &&
              assetAdministrationShellData.status.trim() !== ''
          "
          class="text-body-small px-1"
        >
          <v-tooltip
            v-if="
              assetAdministrationShellData.status && assetAdministrationShellData.status === 'offline'
            "
            :text="'AAS status ' + assetAdministrationShellData.status"
          >
            <template #activator="{ props }">
              <v-icon v-bind="props" class="text-error" size="small"> mdi-cloud-off-outline </v-icon>
            </template>
          </v-tooltip>
        </div>
        <!-- Last Sync -->
        <div class="text-body-small ml-1">
          <v-icon class="text-body-small" size="small">mdi-autorenew</v-icon>

          <span
            class="text-body-small ml-1"
            :class="
              assetAdministrationShellData?.timestamp === 'no sync'
                ? 'text-error'
                : 'text-subtitleText'
            "
          >
            {{ assetAdministrationShellData.timestamp }}
          </span>
        </div>

        <v-spacer v-if="isMobile || singleAas" />
        <!-- Jump to Submodel List on mobile -->
        <v-btn
          v-if="isMobile"
          append-icon="mdi-chevron-right"
          border
          color="primary"
          density="compact"
          text="Submodels"
          variant="tonal"
          @click="gotoSubmodelList()"
        />
        <!-- Download AAS on Desktop -->
        <v-tooltip location="end" :open-delay="600">
          <template #activator="{ props }">
            <v-btn
              v-if="singleAas && !isMobile"
              v-bind="props"
              append-icon="mdi-download"
              border
              color="primary"
              density="compact"
              text="Download"
              variant="tonal"
              @click="openDownloadDialog(assetAdministrationShellData)"
            />
          </template>

          <span>Download Asset Administration Shell as .aasx file</span>
        </v-tooltip>
      </v-card-title>

      <v-divider />

      <v-card-text class="bg-detailsCard pa-0" style="overflow-y: auto" :style="{ height: detailsListHeight }">
        <!-- Asset Information -->
        <!-- 1) AssetInformation is mandatory for an AssetAdministrationShell -->
        <!-- 2) Minimal (empty) AssetInformation (generated with aas4j) will be { assetKind: null } -->
        <AssetInformation
          v-if="assetInformation?.assetKind && Object.keys(assetInformation).length > 1"
          :asset-object="assetInformation"
        />

        <v-divider
          v-if="assetInformation?.assetKind && Object.keys(assetInformation).length > 1"
          thickness="2"
        />
        <!-- AAS Details -->
        <v-list v-if="assetAdministrationShellData" class="bg-detailsCard" lines="one" nav>
          <!-- AAS Identification -->
          <IdentificationElement
            :identification-object="assetAdministrationShellData"
            :v-chip-content="
              getKeyTypeAbbreviation(assetAdministrationShellData.modelType)
            "
          />
          <!-- AAS Administrative Information-->
          <v-divider v-if="assetAdministrationShellData?.administration" />

          <AdministrativeInformationElement
            v-if="assetAdministrationShellData.administration"
            :administrative-information-object="assetAdministrationShellData.administration"
            :administrative-information-title="'Administrative Information'"
            :background-color="'detailsCard'"
            :small="false"
          />

          <v-divider
            v-if="
              assetAdministrationShellData.displayName &&
                assetAdministrationShellData.displayName.length > 0
            "
            class="mt-2"
          />
          <!-- AAS DisplayName -->
          <DisplayNameElement
            v-if="
              assetAdministrationShellData.displayName &&
                assetAdministrationShellData.displayName.length > 0
            "
            :display-name-array="assetAdministrationShellData.displayName"
            :display-name-title="'DisplayName'"
            :small="false"
          />

          <v-divider
            v-if="
              assetAdministrationShellData.description &&
                assetAdministrationShellData.description.length > 0
            "
            class="mt-2"
          />
          <!-- AAS Description -->
          <DescriptionElement
            v-if="
              assetAdministrationShellData.description &&
                assetAdministrationShellData.description.length > 0
            "
            :description-array="assetAdministrationShellData.description"
            :description-title="'Description'"
            :small="false"
          />
        </v-list>
      </v-card-text>
    </v-sheet>
  </v-container>
  <!-- Dialog for downloading AAS -->
  <DownloadAAS v-model="downloadAASDialog" :aas="aasToDownload" />
</template>

<script lang="ts" setup>
  import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useAASHandling } from '@/composables/AAS/AASHandling'
  import { useAASRepositoryClient } from '@/composables/Client/AASRepositoryClient'
  import { useAASStore } from '@/store/AASDataStore'
  import { useEnvStore } from '@/store/EnvironmentStore'
  import { useInfrastructureStore } from '@/store/InfrastructureStore'
  import { useNavigationStore } from '@/store/NavigationStore'
  import { extractEndpointHref } from '@/utils/AAS/DescriptorUtils'
  import { getKeyTypeAbbreviation } from '@/utils/AAS/KeyTypesUtil'

  // Vue Router
  const route = useRoute()
  const router = useRouter()

  // Composables
  const { fetchAssetInformation } = useAASRepositoryClient()
  const { aasIsAvailableById, fetchAas } = useAASHandling()

  // Stores
  const navigationStore = useNavigationStore()
  const aasStore = useAASStore()
  const envStore = useEnvStore()
  const infrastructureStore = useInfrastructureStore()

  // Data
  const assetAdministrationShellData = ref({} as any | null)
  const assetInformation = ref({} as any | null)
  const autoSyncInterval = ref<number | undefined>(undefined)
  const statusCheckInterval = ref<number | undefined>(undefined)
  const downloadAASDialog = ref(false) // Variable to store if the DownloadAAS Dialog should be shown
  const aasToDownload = ref({}) // Variable to store the AAS to be downloaded
  let viewGeneration = 0
  let isUnmounted = false

  // Computed Properties
  const isMobile = computed(() => navigationStore.getIsMobile)
  const singleAas = computed(() => envStore.getSingleAas)
  const selectedAAS = computed(() => aasStore.getSelectedAAS) // Get the selected AAS from Store
  const aasRegistryURL = computed(() => infrastructureStore.getAASRegistryURL) // Get AAS Registry URL from Store
  const aasRepoURL = computed(() => infrastructureStore.getAASRepoURL) // Get the AAS Repository URL from the Store
  const selectedInfrastructureId = computed(() => infrastructureStore.getSelectedInfrastructureId)
  const detailsListHeight = computed(() => {
    if (isMobile.value) {
      return singleAas.value
        ? 'calc(100vh - 40px - 64px - 34px)' // Full height - footer - header - details header (divider)
        : 'calc(100vh - 231px - 40px - 64px - 36px - 64px)' // Full height - 4x AAS items - footer - header - details header (divider) - Searchbar
    } else {
      return singleAas.value
        ? 'calc(100vh - 64px - 48px - 40px - 34px)' // Full height - header - collapse button - footer - details header (divider)
        : 'calc(50vh - 40px - 48px - 33px)' // Half height - footer - collapse button - details header (divider)
    }
  })
  const autoSync = computed(() => navigationStore.getAutoSync)
  const statusCheck = computed(() => navigationStore.getStatusCheck)

  // Watchers
  watch(
    () => aasRegistryURL.value,
    async () => {
      invalidatePendingRequests()
      initializeView()
    },
  )

  watch(
    () => aasRepoURL.value,
    async () => {
      invalidatePendingRequests()
      initializeView()
    },
  )

  watch(
    () => selectedAAS.value,
    async () => {
      invalidatePendingRequests()
      window.clearInterval(autoSyncInterval.value) // clear old interval
      if (autoSync.value.state && selectedAAS.value && Object.keys(selectedAAS.value).length > 0) {
        // create new interval
        autoSyncInterval.value = window.setInterval(async () => {
          await updateAasData()
        }, autoSync.value.interval)
      }

      window.clearInterval(statusCheckInterval.value) // clear old interval
      if (statusCheck.value.state === true && selectedAAS.value && Object.keys(selectedAAS.value).length > 0) {
        await updateStatusOfAas()

        // create new interval
        statusCheckInterval.value = window.setInterval(async () => {
          await updateStatusOfAas()
        }, statusCheck.value.interval)
      }

      initializeView()
    },
    { deep: true },
  )

  watch(
    () => autoSync.value,
    async autoSyncValue => {
      invalidatePendingRequests()
      window.clearInterval(autoSyncInterval.value) // clear old interval
      if (autoSyncValue.state === true && selectedAAS.value && Object.keys(selectedAAS.value).length > 0) {
        await updateAasData()

        // create new interval
        autoSyncInterval.value = window.setInterval(async () => {
          await updateAasData()
        }, autoSyncValue.interval)
      }
    },
    { deep: true },
  )

  watch(
    () => statusCheck.value,
    async statusCheckValue => {
      invalidatePendingRequests()
      window.clearInterval(statusCheckInterval.value) // clear old interval
      if (statusCheckValue.state === true) {
        assetAdministrationShellData.value.status = 'status loading'

        await updateStatusOfAas()

        // create new interval
        statusCheckInterval.value = window.setInterval(async () => {
          await updateStatusOfAas()
        }, statusCheck.value.interval)
      } else {
        assetAdministrationShellData.value.status = 'check disabled'

        // Reset status icon after 2 seconds
        const generation = viewGeneration
        setTimeout(() => {
          if (generation === viewGeneration && !isUnmounted) {
            assetAdministrationShellData.value.status = ''
          }
        }, 2000)
      }
    },
    { deep: true },
  )

  onMounted(async () => {
    if (autoSync.value.state) {
      // create new interval
      autoSyncInterval.value = window.setInterval(async () => {
        if (selectedAAS.value && Object.keys(selectedAAS.value).length > 0) {
          await updateAasData()
        }
      }, autoSync.value.interval)
    }

    if (statusCheck.value.state === true) {
      await updateStatusOfAas()

      // create new interval
      statusCheckInterval.value = window.setInterval(async () => {
        await updateStatusOfAas()
      }, statusCheck.value.interval)
    }

    initializeView(true)
  })

  onBeforeUnmount(() => {
    isUnmounted = true
    invalidatePendingRequests()
    window.clearInterval(autoSyncInterval.value)
    window.clearInterval(statusCheckInterval.value)
  })

  function invalidatePendingRequests (): void {
    viewGeneration += 1
  }

  function isCurrentRequest (
    generation: number,
    aasId: string,
    infrastructureId: string | null | undefined,
  ): boolean {
    return !isUnmounted
      && generation === viewGeneration
      && selectedAAS.value?.id === aasId
      && selectedInfrastructureId.value === infrastructureId
  }

  async function initializeView (init = false): Promise<void> {
    invalidatePendingRequests()
    if (!selectedAAS.value || Object.keys(selectedAAS.value).length === 0) {
      assetAdministrationShellData.value = {}
      assetInformation.value = {}
      return
    }

    assetAdministrationShellData.value = { ...selectedAAS.value } // create local copy
    const generation = viewGeneration
    const aasId = selectedAAS.value.id
    const infrastructureId = selectedInfrastructureId.value
    void updateAssetInformation(generation, aasId, infrastructureId)

    void updateStatusOfAas(init, generation)
  }

  async function updateStatusOfAas (init = false, generation = viewGeneration): Promise<void> {
    const aasId = selectedAAS.value?.id
    const infrastructureId = selectedInfrastructureId.value

    if (typeof aasId === 'string' && aasId !== '' && isCurrentRequest(generation, aasId, infrastructureId)) {
      await new Promise(resolve => setTimeout(resolve, 600)) // Give the UI the chance to refresh status icons

      if (!isCurrentRequest(generation, aasId, infrastructureId)) {
        return
      }

      const aasIsAvailable = await aasIsAvailableById(aasId)

      if (!isCurrentRequest(generation, aasId, infrastructureId)) {
        return
      }

      if (aasIsAvailable) {
        assetAdministrationShellData.value.status
          = statusCheck.value.state === true ? 'online' : (init ? '' : 'check disabled')
      } else {
        assetAdministrationShellData.value.status
          = statusCheck.value.state === true ? 'offline' : (init ? '' : 'check disabled')
      }
    }
  }

  async function updateAasData (): Promise<void> {
    const generation = viewGeneration
    const aasId = selectedAAS.value?.id
    const infrastructureId = selectedInfrastructureId.value
    const path = selectedAAS.value?.path
    if (typeof aasId !== 'string' || typeof path !== 'string') {
      return
    }

    const aas = await fetchAas(path)
    if (isCurrentRequest(generation, aasId, infrastructureId)) {
      assetAdministrationShellData.value = aas
    }
  }

  async function updateAssetInformation (
    generation: number,
    aasId: string,
    infrastructureId: string | null | undefined,
  ): Promise<void> {
    const endpoint = extractEndpointHref(assetAdministrationShellData.value, 'AAS-3.0')
    const information = await fetchAssetInformation(endpoint)
    if (isCurrentRequest(generation, aasId, infrastructureId)) {
      assetInformation.value = information
    }
  }

  function gotoSubmodelList (): void {
    const query = structuredClone(route.query)
    if (Object.hasOwn(query, 'path')) delete query.path

    router.push({
      name: 'SubmodelList',
      query: query,
    })
  }

  function openDownloadDialog (aasDescriptor: any): void {
    downloadAASDialog.value = true
    aasToDownload.value = aasDescriptor
  }
</script>
