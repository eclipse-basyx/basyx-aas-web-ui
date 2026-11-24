<template>
  <v-container fluid>

    <!-- Placeholder of the Catalog Dataset while the Catalog loads -->
    <v-skeleton-loader
      v-if="listLoading"
      class="border rounded-lg"
      type="list-item-avatar, divider, paragraph@3"
    />

    <!-- Empty states when nothing is selected yet -->
    <div
      v-else-if="!businessPartner || !datasetSelected"
      class="d-flex align-center justify-center"
      :style="{ height: EDC_MAIN_HEIGHT }"
    >
      <v-empty-state
        v-if="!businessPartner"
        icon="mdi-gesture-tap"
        text="Please select a Business Partner to load its Catalog"
        title="Select Business Partner"
      >
        <template #media>
          <v-icon size="64" />
        </template>
      </v-empty-state>

      <v-empty-state
        v-else-if="catalogRequestFailed"
        icon="mdi-database-alert-outline"
        text="No Catalog Dataset can be selected, as the Catalog of the selected Business Partner could not be requested"
        title="Catalog Not Available"
      >
        <template #media>
          <v-icon size="64" />
        </template>
      </v-empty-state>

      <v-empty-state
        v-else
        icon="mdi-gesture-tap"
        text="Please select a Catalog Dataset"
        title="Select Catalog Dataset"
      >
        <template #media>
          <v-icon size="64" />
        </template>
      </v-empty-state>
    </div>

    <template v-else>
      <JSONPreview
        :height="catalogDatasetPreviewHeight"
        icon="mdi-database-outline"
        :json-content="dataset"
        title="Catalog Dataset"
      />

      <!-- Use case: Push Data -->
      <div v-if="isPushAsset(dataset)" class="d-flex mt-2">
        <v-spacer />

        <v-btn
          class="text-buttonText"
          color="primary"
          prepend-icon="mdi-upload"
          rounded="lg"
          text="Send Data"
          variant="flat"
          @click="emit('send-data')"
        />
      </div>

      <!-- Use case: Fetch Data -->
      <template v-else-if="isFetchAsset(dataset)">
        <div class="d-flex mt-2">
          <v-spacer />

          <!-- Readonly instead of disabled, as disabled would drop the success color -->
          <v-btn
            class="text-buttonText"
            :color="dataFetched ? 'success' : 'primary'"
            :loading="fetchingData"
            :prepend-icon="dataFetched ? 'mdi-check' : 'mdi-download'"
            :readonly="dataFetched"
            rounded="lg"
            :text="dataFetched ? 'Data Fetched' : 'Fetch Data'"
            variant="flat"
            @click="fetchCatalogDatasetData()"
          />
        </div>

        <!-- Shares the height with the Catalog Dataset -->
        <JSONPreview
          v-if="dataFetched"
          class="mt-2"
          :download-file-name="dataset['@id']"
          :height="jsonPreviewHalfHeight"
          :icon="fetchedDataTypeInfo?.icon ?? 'mdi-download'"
          :json-content="fetchedData"
          :title="fetchedDataTypeInfo ? `Fetched ${fetchedDataTypeInfo.title}` : 'Fetched Data'"
        />

        <div v-if="fetchedSubmodel" class="d-flex mt-2">
          <v-spacer />

          <v-btn
            class="text-buttonText"
            color="primary"
            prepend-icon="mdi-import"
            rounded="lg"
            text="Import Submodel"
            variant="flat"
            @click="importSubmodelDialog = true"
          />
        </div>
      </template>
    </template>

    <ImportSubmodelDialog v-model="importSubmodelDialog" :submodel="fetchedSubmodel" />
  </v-container>
</template>

<script lang="ts" setup>
  import type { CatenaXPartner } from '@/types/Infrastructure'
  import { types as aasTypes } from '@aas-core-works/aas-core3.1-typescript'
  import { useCatenaXEdcClient } from '@/composables/Client/CatenaXEdcClient'
  import ImportSubmodelDialog from '@/pages/modules/EclipseDataspaceConnector/components/Catalog/Dialogs/ImportSubmodelDialog.vue'
  import { edcBffFailureText, useEdcRequestFailureMessage } from '@/pages/modules/EclipseDataspaceConnector/composables/EdcRequestFailure'
  import { isFetchAsset, isPushAsset } from '@/pages/modules/EclipseDataspaceConnector/data/assetTypeFilters'
  import { fetchedDataType } from '@/pages/modules/EclipseDataspaceConnector/data/fetchedDataType'
  import {
    EDC_JSON_PREVIEW_HEIGHT,
    EDC_JSON_PREVIEW_WITH_ACTIONS_HALF_HEIGHT,
    EDC_JSON_PREVIEW_WITH_ACTIONS_HEIGHT,
    EDC_JSON_PREVIEW_WITH_TWO_ACTIONS_HALF_HEIGHT,
    EDC_MAIN_HEIGHT,
  } from '@/pages/modules/EclipseDataspaceConnector/data/heights'

  // The selected Catalog Dataset with its use case: send data to it or fetch its data
  const props = defineProps<{
    businessPartner: CatenaXPartner | null
    dataset: any // `null` if none is selected
    proxyId: string
    listLoading: boolean // The Catalog loads, no Catalog Dataset can be selected yet
    catalogRequestFailed: boolean
  }>()

  const emit = defineEmits<{
    (event: 'send-data'): void
  }>()

  // Composables
  const { fetchData } = useCatenaXEdcClient()
  const { showFailureMessage } = useEdcRequestFailureMessage()

  // Data
  const importSubmodelDialog = ref(false)
  const fetchingData = ref(false)
  const fetchedData = ref<unknown>(undefined) // Data fetched from the data plane of the Catalog Dataset

  // Computed properties
  const datasetSelected = computed(() => !!props.dataset)
  const dataFetched = computed(() => fetchedData.value !== undefined)
  const fetchedDataTypeInfo = computed(() => fetchedDataType(fetchedData.value)) // AAS or Submodel, if the fetched data is one
  const fetchedSubmodel = computed(() => {
    const instance = fetchedDataTypeInfo.value?.instance
    return instance instanceof aasTypes.Submodel ? instance : null
  })
  // Height of the Catalog Dataset and the Fetched Data, sharing the space below each other
  const jsonPreviewHalfHeight = computed(() => fetchedSubmodel.value
    ? EDC_JSON_PREVIEW_WITH_TWO_ACTIONS_HALF_HEIGHT
    : EDC_JSON_PREVIEW_WITH_ACTIONS_HALF_HEIGHT)
  const catalogDatasetPreviewHeight = computed(() => {
    if (dataFetched.value) {
      return jsonPreviewHalfHeight.value
    }
    return isPushAsset(props.dataset) || isFetchAsset(props.dataset)
      ? EDC_JSON_PREVIEW_WITH_ACTIONS_HEIGHT
      : EDC_JSON_PREVIEW_HEIGHT
  })

  // Watchers
  watch(() => props.dataset, () => {
    fetchedData.value = undefined
  })

  // Methods
  async function fetchCatalogDatasetData (): Promise<void> {
    const businessPartner = props.businessPartner
    const catalogDataset = props.dataset
    if (!businessPartner || !catalogDataset?.['@id']) return

    fetchingData.value = true
    // The BFF negotiates the asset and fetches the data from the data plane given by the EDR
    const result = await fetchData(props.proxyId, {
      counterPartyId: businessPartner.counterPartyId,
      counterPartyAddress: businessPartner.counterPartyAddress,
      assetId: catalogDataset['@id'],
    })
    fetchingData.value = false

    // Ignore the result if another Catalog Dataset was selected in the meantime
    if (catalogDataset !== props.dataset) return

    if (!result.success) {
      showFailureMessage('Failed to fetch the data.', edcBffFailureText(result))
      return
    }

    fetchedData.value = result.data.data
  }
</script>
