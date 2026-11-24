<template>
  <v-container class="pa-0 ma-0" fluid :style="{ height: EDC_TAB_HEIGHT }">
    <v-layout :style="{ height: EDC_TAB_HEIGHT }">

      <EdcResourceListDrawer
        ref="listDrawer"
        icon="mdi-code-json"
        :is-selected="isSelected"
        :items="catalogList"
        label="Catalog Dataset"
        :list-loading="listLoading"
        :page-loading="pageLoading"
        :reload-disabled="!selectedBusinessPartner"
        reload-tooltip="Reload Catalog"
        @reload="initialize()"
        @select="selectCatalogDataset"
      >
        <template #title>
          <v-select
            v-model="selectedBusinessPartner"
            class="mr-4"
            density="compact"
            hide-details
            :item-props="partner => ({ subtitle: partner.counterPartyId })"
            :item-title="partner => partner.name || partner.counterPartyId"
            :items="businessPartners"
            label="Select Business Partner"
            return-object
            variant="solo"
          />
        </template>

        <!-- Aligned with the Business Partner selection next to the reload button -->
        <template #filter>
          <div class="pl-12 pr-4 pb-3">
            <v-select
              v-model="selectedCatalogFilter"
              density="compact"
              hide-details
              :items="assetTypeFilterItems"
              label="Filter by Asset Type"
              variant="solo"
            />
          </div>
        </template>

        <template #item-title="{ item }">{{ item.name || item.description }}</template>

        <template #item-subtitle="{ item }">{{ item['@id'] }}</template>

        <template #item-tooltip="{ item }">
          <div v-if="item.name" class="text-body-small mt-1">
            <span class="font-weight-bold">{{ 'Name: ' }}</span>
            {{ item.name }}
          </div>

          <div v-if="item.description" class="text-body-small mt-1">
            <span class="font-weight-bold">{{ 'Description: ' }}</span>
            {{ item.description }}
          </div>
        </template>

        <!-- The list starts below the selections, so the empty states move up to the height of the ones on the right -->
        <template #empty>
          <v-empty-state
            v-if="selectedBusinessPartner && catalogRequestFailed"
            class="mt-n12"
            icon="mdi-database-alert-outline"
            text="The Catalog of the selected Business Partner could not be requested. Reload the Catalog to try again."
            title="Catalog Not Available"
          >
            <template #media>
              <v-icon size="64" />
            </template>
          </v-empty-state>

          <v-empty-state
            v-else-if="selectedBusinessPartner"
            class="mt-n12"
            icon="mdi-database-off-outline"
            text="The Catalog of the selected Business Partner contains no Datasets of the selected Asset Type"
            title="No Catalog Datasets"
          >
            <template #media>
              <v-icon size="64" />
            </template>
          </v-empty-state>

          <v-empty-state
            v-else
            class="mt-n12"
            icon="mdi-gesture-tap"
            text="Please select a Business Partner to load its Catalog"
            title="Select Business Partner"
          >
            <template #media>
              <v-icon size="64" />
            </template>
          </v-empty-state>
        </template>
      </EdcResourceListDrawer>

      <v-main>
        <CatalogDatasetDetails
          :business-partner="selectedBusinessPartner"
          :catalog-request-failed="catalogRequestFailed"
          :dataset="selectedCatalogDataset"
          :list-loading="listLoading"
          :proxy-id="edcProxyId"
          @send-data="sendDataDialog = true"
        />

        <!-- Opens once the Catalog Dataset is selected, which a dialog restored from the URL has to wait for -->
        <SendDataDialog
          :business-partner="selectedBusinessPartner"
          :catalog-dataset="selectedCatalogDataset"
          :model-value="sendDataDialog && isPushAsset(selectedCatalogDataset)"
          :proxy-id="edcProxyId"
          @update:model-value="sendDataDialog = $event"
        />
      </v-main>

    </v-layout>
  </v-container>
</template>

<script lang="ts" setup>
  import type { CatenaXPartner } from '@/types/Infrastructure'
  import { useSelectedEdcConfig } from '@/composables/SelectedEdcConfig'
  import CatalogDatasetDetails from '@/pages/modules/EclipseDataspaceConnector/components/Catalog/CatalogDatasetDetails.vue'
  import SendDataDialog from '@/pages/modules/EclipseDataspaceConnector/components/Catalog/Dialogs/SendDataDialog.vue'
  import EdcResourceListDrawer from '@/pages/modules/EclipseDataspaceConnector/components/Shared/EdcResourceListDrawer.vue'
  import { useEdcCatalogQuery } from '@/pages/modules/EclipseDataspaceConnector/composables/EdcCatalogQuery'
  import { useEdcDialogRoute } from '@/pages/modules/EclipseDataspaceConnector/composables/EdcDialogRoute'
  import { type EdcVirtualScroll, useEdcPagedList } from '@/pages/modules/EclipseDataspaceConnector/composables/EdcPagedList'
  import { edcBffFailureText, useEdcRequestFailureMessage } from '@/pages/modules/EclipseDataspaceConnector/composables/EdcRequestFailure'
  import { isSameEdcResource } from '@/pages/modules/EclipseDataspaceConnector/composables/EdcResourceId'
  import { assetTypeFilterItems, isPushAsset } from '@/pages/modules/EclipseDataspaceConnector/data/assetTypeFilters'
  import { EDC_TAB_HEIGHT } from '@/pages/modules/EclipseDataspaceConnector/data/heights'
  import { normalizeCatenaXPartners } from '@/utils/CatenaXPartnerUtils'

  // Composables
  const { selectedEdcConfig, edcProxyId } = useSelectedEdcConfig()
  const { queryCatalogPage, findCatalogDataset } = useEdcCatalogQuery()
  const { showFailureMessage } = useEdcRequestFailureMessage()
  const { dialogOpen, dialogState } = useEdcDialogRoute()

  // Data
  const listDrawer = useTemplateRef<InstanceType<typeof EdcResourceListDrawer>>('listDrawer')

  const selectedBusinessPartner = ref<CatenaXPartner | null>(null)
  const selectedCatalogDataset = ref({} as any)
  const selectedCatalogFilter = ref('all')
  // The open dialog is kept in the URL with the selection it was opened for, e.g. to return to it after a login
  const sendDataDialog = dialogOpen('send-data', () => ({
    partner: selectedBusinessPartner.value?.id,
    dataset: selectedCatalogDataset.value?.['@id'],
  }))
  const sendDataPartnerId = dialogState('partner')
  const sendDataDatasetId = dialogState('dataset')

  // Computed properties
  const virtualScrollRef = computed<EdcVirtualScroll | null>(() => listDrawer.value?.virtualScroll ?? null)
  const businessPartners = computed(() => normalizeCatenaXPartners(selectedEdcConfig.value?.partners ?? []))

  // Loaded pages of the catalog, in the order of the provider
  const {
    items: catalogList,
    listLoading,
    pageLoading,
    requestFailed: catalogRequestFailed,
    reload: reloadCatalog,
    clear: clearCatalog,
    scrollToItem: scrollToCatalogDataset,
  } = useEdcPagedList<any>({
    virtualScrollRef,
    queryPage: page => queryCatalogPage(edcProxyId.value, selectedBusinessPartner.value!, selectedCatalogFilter.value, page),
    onFailure: failure => showFailureMessage('Failed to request the catalog.', edcBffFailureText(failure)),
  })

  // Watchers
  watch(
    businessPartners,
    partners => {
      if (selectedBusinessPartner.value && partners.some(partner => partner.id === selectedBusinessPartner.value?.id)) {
        return
      }

      // The Business Partner of a Send Data dialog restored from the URL takes precedence over the default one
      const defaultPartnerId = selectedEdcConfig.value?.defaultPartnerId?.trim() ?? ''
      const partnerId = (sendDataDialog.value ? sendDataPartnerId.value : null) ?? defaultPartnerId
      selectedBusinessPartner.value = partners.find(partner => partner.id === partnerId) ?? null
    },
    { immediate: true },
  )

  watch(
    [selectedBusinessPartner, selectedCatalogFilter],
    () => {
      initialize()
    },
  )

  onMounted(() => {
    initialize()
  })
  onActivated(() => {
    scrollToCatalogDataset(isSelected)
  })

  async function initialize (): Promise<void> {
    selectedCatalogDataset.value = {}

    // Without an address, no list of a previous partner stays visible
    if (!selectedBusinessPartner.value?.counterPartyAddress) {
      clearCatalog()
      await restoreSendDataDialog()
      return
    }

    if (!(await reloadCatalog())) return // A newer request replaces this one
    scrollToCatalogDataset(isSelected)
    await restoreSendDataDialog()
  }

  // Selects the Catalog Dataset of a Send Data dialog restored from the URL, the dialog then opens.
  // Without it, e.g. if the Catalog could not be requested, the dialog is closed.
  // The dataset may be beyond the loaded pages, then it is requested by its ID.
  async function restoreSendDataDialog (): Promise<void> {
    if (!sendDataDialog.value) return

    const partner = selectedBusinessPartner.value
    const datasetId = sendDataDatasetId.value
    let catalogDataset = null
    if (partner?.counterPartyAddress && datasetId && partner.id === sendDataPartnerId.value) {
      catalogDataset = catalogList.value.find(dataset => dataset['@id'] === datasetId)
        ?? await findCatalogDataset(edcProxyId.value, partner, datasetId)
    }
    if (catalogDataset && isPushAsset(catalogDataset)) {
      selectedCatalogDataset.value = catalogDataset
      scrollToCatalogDataset(isSelected)
    } else {
      sendDataDialog.value = false
    }
  }

  function selectCatalogDataset (dataset: any): void {
    if (isSelected(dataset)) {
      selectedCatalogDataset.value = {}
    } else {
      selectedCatalogDataset.value = dataset

      if (Object.keys(selectedCatalogDataset.value).length === 0) {
        scrollToCatalogDataset(isSelected)
      }
    }
  }

  function isSelected (dataset: any): boolean {
    return isSameEdcResource(dataset, selectedCatalogDataset.value)
  }

</script>
