<template>
  <v-sheet
    border
    class="pa-4 flex-grow-1 overflow-y-auto"
    rounded="lg"
    style="min-height: 0; height: 100%; overflow-y: auto"
  >
    <v-empty-state
      v-if="!descriptor"
      icon="mdi-cube-off-outline"
      text="Select a descriptor to inspect its DTR metadata."
      title="No selected descriptor"
    >
      <template #media>
        <v-icon size="56" />
      </template>
    </v-empty-state>

    <template v-else>
      <div class="d-flex flex-column flex-md-row align-start justify-space-between ga-3 mb-4">
        <div>
          <div class="text-h5 font-weight-medium text-break">{{ getDescriptorTitle(descriptor) }}</div>
          <div class="text-body-small text-medium-emphasis text-break">{{ descriptor.id }}</div>
        </div>

        <v-chip
          v-if="getDescriptorLastUpdatedAt(descriptor)"
          color="primary"
          prepend-icon="mdi-calendar-clock"
          size="x-small"
          variant="tonal"
        >
          Updated {{ formatDateTime(getDescriptorLastUpdatedAt(descriptor)) }}
        </v-chip>
      </div>

      <v-row density="comfortable">
        <v-col
          v-for="item in descriptorSummary"
          :key="item.label"
          cols="12"
          md="6"
        >
          <div class="border rounded pa-3 h-100">
            <div class="text-label-small text-medium-emphasis">{{ item.label }}</div>
            <div class="text-body-small text-break">{{ item.value }}</div>
          </div>
        </v-col>
      </v-row>

      <v-divider class="my-4" />

      <SpecificAssetIdsTable :asset-ids="specificAssetIds" />

      <v-divider class="my-4" />

      <SubmodelDescriptorPanels :descriptors="submodelDescriptors" />

      <template v-if="edcProxyId">
        <v-divider class="my-4" />

        <CatenaXplorerEdcPanel
          :default-counter-party-address="edcConfig?.defaultCounterPartyAddress"
          :default-counter-party-id="edcConfig?.defaultCounterPartyId"
          :proxy-id="edcProxyId"
        />
      </template>

      <v-divider class="my-4" />

      <DescriptorJsonPreview :descriptor="descriptor" />
    </template>
  </v-sheet>
</template>

<script lang="ts" setup>
  import type { CatenaXEdcConfig } from '@/types/Infrastructure'
  import { computed } from 'vue'
  import {
    displayValue,
    formatDateTime,
    getDescriptorLastUpdatedAt,
    getDescriptorTitle,
    getLangStringText,
    getSpecificAssetIds,
    getSubmodelDescriptors,
  } from '@/pages/modules/CatenaXplorer/catenaXplorerUtils'
  import CatenaXplorerEdcPanel from '@/pages/modules/CatenaXplorer/components/CatenaXplorerEdcPanel.vue'
  import DescriptorJsonPreview from '@/pages/modules/CatenaXplorer/components/DescriptorJsonPreview.vue'
  import SpecificAssetIdsTable from '@/pages/modules/CatenaXplorer/components/SpecificAssetIdsTable.vue'
  import SubmodelDescriptorPanels from '@/pages/modules/CatenaXplorer/components/SubmodelDescriptorPanels.vue'

  const props = defineProps<{
    descriptor: any | null
    edcConfig?: CatenaXEdcConfig | null
  }>()

  const specificAssetIds = computed(() => getSpecificAssetIds(props.descriptor))
  const submodelDescriptors = computed(() => getSubmodelDescriptors(props.descriptor))
  const edcProxyId = computed(() => props.edcConfig?.proxyId?.trim() ?? '')
  const descriptorSummary = computed(() => {
    const descriptor = props.descriptor
    if (!descriptor) {
      return []
    }

    return [
      { label: 'Global Asset ID', value: displayValue(descriptor.globalAssetId) },
      { label: 'Asset Kind', value: displayValue(descriptor.assetKind) },
      { label: 'Asset Type', value: displayValue(descriptor.assetType) },
      { label: 'Description', value: displayValue(getLangStringText(descriptor.description)) },
    ]
  })
</script>
