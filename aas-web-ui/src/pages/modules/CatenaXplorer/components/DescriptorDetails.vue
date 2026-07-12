<template>
  <v-sheet
    border
    class="pa-3"
    rounded="lg"
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
      <div class="d-flex flex-column flex-md-row align-start justify-space-between ga-3 mb-3">
        <div>
          <div class="text-h5 font-weight-medium text-break">{{ getDescriptorTitle(descriptor) }}</div>
          <div class="text-body-small text-medium-emphasis text-break">{{ descriptor.id }}</div>
        </div>

        <v-chip
          v-if="descriptorTimestamp"
          color="primary"
          prepend-icon="mdi-calendar-clock"
          size="x-small"
          variant="tonal"
        >
          {{ descriptorTimestamp.label }} {{ formatDateTime(descriptorTimestamp.value) }}
        </v-chip>
      </div>

      <div class="d-flex justify-end mb-4">
        <v-btn-toggle
          v-model="descriptorViewMode"
          color="primary"
          density="compact"
          divided
          mandatory
          variant="outlined"
        >
          <v-btn value="details">
            <v-icon start>mdi-table</v-icon>
            Details
          </v-btn>

          <v-btn value="json">
            <v-icon start>mdi-code-json</v-icon>
            JSON
          </v-btn>
        </v-btn-toggle>
      </div>

      <template v-if="descriptorViewMode === 'details'">
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

        <SubmodelDescriptorPanels
          :descriptors="submodelDescriptors"
          :edc-access-enabled="edcAccessEnabled"
          :edc-submodels="edcSubmodels"
          @load-edc-submodel="emit('load-edc-submodel', $event)"
        />
      </template>

      <DescriptorJsonPreview
        v-else
        :descriptor="descriptor"
      />
    </template>
  </v-sheet>
</template>

<script lang="ts" setup>
  import type { EdcSubmodelViewState } from '@/pages/modules/CatenaXplorer/catenaXplorerUtils'
  import { computed, ref } from 'vue'
  import {
    displayValue,
    formatDateTime,
    getDescriptorTimestampInfo,
    getDescriptorTitle,
    getLangStringText,
    getSpecificAssetIds,
    getSubmodelDescriptors,
  } from '@/pages/modules/CatenaXplorer/catenaXplorerUtils'
  import DescriptorJsonPreview from '@/pages/modules/CatenaXplorer/components/DescriptorJsonPreview.vue'
  import SpecificAssetIdsTable from '@/pages/modules/CatenaXplorer/components/SpecificAssetIdsTable.vue'
  import SubmodelDescriptorPanels from '@/pages/modules/CatenaXplorer/components/SubmodelDescriptorPanels.vue'

  const props = defineProps<{
    descriptor: any | null
    edcAccessEnabled?: boolean
    edcSubmodels?: Record<string, EdcSubmodelViewState>
  }>()

  const emit = defineEmits<{
    'load-edc-submodel': [descriptor: any]
  }>()

  const descriptorViewMode = ref<'details' | 'json'>('details')
  const specificAssetIds = computed(() => getSpecificAssetIds(props.descriptor))
  const submodelDescriptors = computed(() => getSubmodelDescriptors(props.descriptor))
  const descriptorTimestamp = computed(() => getDescriptorTimestampInfo(props.descriptor))
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
