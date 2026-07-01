<template>
  <section>
    <div class="d-flex align-center justify-space-between ga-2 mb-2">
      <div class="text-h6">Submodel Descriptors</div>
      <v-chip size="x-small" variant="tonal">{{ descriptors.length }}</v-chip>
    </div>

    <v-empty-state
      v-if="descriptors.length === 0"
      class="text-divider"
      icon="mdi-view-module-outline"
      text="No embedded submodel descriptors are visible for this descriptor."
      title="No submodel descriptors"
    />

    <v-expansion-panels v-else multiple variant="accordion">
      <v-expansion-panel
        v-for="submodelDescriptor in descriptors"
        :key="getDescriptorKey(submodelDescriptor)"
        border
        height="56px"
        rounded="lg"
      >
        <v-expansion-panel-title>
          <div class="d-flex flex-column flex-md-row align-start align-md-center ga-2 w-100">
            <div class="flex-grow-1">
              <div class="text-body-medium text-break">
                {{ getDescriptorTitle(submodelDescriptor) }}
              </div>

              <div
                class="text-caption text-medium-emphasis text-break"
                style="font-size: 0.7rem; line-height: 1rem"
              >
                {{ submodelDescriptor.id }}
              </div>
            </div>

            <div class="d-flex ga-1 flex-wrap">
              <v-chip
                v-for="marker in getSubmodelMarkerValues(submodelDescriptor)"
                :key="marker"
                size="x-small"
                variant="tonal"
              >
                {{ marker }}
              </v-chip>
            </div>
          </div>
        </v-expansion-panel-title>

        <v-expansion-panel-text>
          <v-row density="comfortable">
            <v-col cols="12" md="6">
              <div class="border rounded pa-3 h-100">
                <div class="text-caption text-medium-emphasis">Semantic ID</div>
                <ReferenceChips :values="getReferenceKeyValues(submodelDescriptor.semanticId)" />
              </div>
            </v-col>

            <v-col cols="12" md="6">
              <div class="border rounded pa-3 h-100">
                <div class="text-caption text-medium-emphasis">Supplemental Semantic IDs</div>

                <div
                  v-for="(reference, index) in normalizeSupplementalSemanticIds(submodelDescriptor)"
                  :key="index"
                  class="mb-1"
                >
                  <ReferenceChips :values="getReferenceKeyValues(reference)" />
                </div>

                <span
                  v-if="normalizeSupplementalSemanticIds(submodelDescriptor).length === 0"
                  class="text-body-small text-medium-emphasis"
                >
                  -
                </span>
              </div>
            </v-col>
          </v-row>

          <div class="text-subtitle-2 mt-4 mb-2">Endpoints</div>

          <v-empty-state
            v-if="getEndpointRows(submodelDescriptor.endpoints).length === 0"
            class="text-divider"
            icon="mdi-information-outline"
            text="No submodel endpoints are visible for this descriptor."
            title="No endpoints"
          />

          <EndpointTable
            v-else
            :endpoints="getEndpointRows(submodelDescriptor.endpoints)"
          />
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </section>
</template>

<script lang="ts" setup>
  import {
    getDescriptorKey,
    getDescriptorTitle,
    getEndpointRows,
    getReferenceKeyValues,
    getSubmodelMarkerValues,
    normalizeSupplementalSemanticIds,
  } from '@/pages/modules/CatenaXplorer/catenaXplorerUtils'
  import EndpointTable from '@/pages/modules/CatenaXplorer/components/EndpointTable.vue'
  import ReferenceChips from '@/pages/modules/CatenaXplorer/components/ReferenceChips.vue'

  defineProps<{
    descriptors: any[]
  }>()
</script>
