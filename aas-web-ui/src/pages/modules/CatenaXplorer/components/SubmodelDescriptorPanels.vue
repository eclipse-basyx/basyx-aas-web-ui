<template>
  <section>
    <div class="d-flex align-center justify-space-between ga-2 mb-2">
      <div class="text-h6">Submodel Descriptors</div>
      <v-chip size="x-small" variant="tonal">{{ descriptors.length }}</v-chip>
    </div>

    <v-alert
      v-if="descriptors.length === 0"
      density="comfortable"
      icon="mdi-view-module-outline"
      text="No embedded submodel descriptors are visible for this descriptor."
      type="info"
      variant="tonal"
    />

    <v-expansion-panels
      v-else
      gap="8"
      multiple
      rounded="lg"
      static
      variant="accordion"
    >
      <v-expansion-panel
        v-for="submodelDescriptor in descriptors"
        :key="getDescriptorKey(submodelDescriptor)"
      >
        <v-expansion-panel-title>
          <div class="d-flex flex-column flex-md-row align-start align-md-center ga-2 w-100">
            <div class="flex-grow-1">
              <div class="text-body-medium text-break">
                {{ getDescriptorTitle(submodelDescriptor) }}
              </div>

              <div class="text-caption text-medium-emphasis text-break">
                {{ submodelDescriptor.id }}
              </div>
            </div>

            <div class="d-none d-lg-flex ga-1 flex-wrap">
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

          <v-alert
            v-if="getEndpointRows(submodelDescriptor.endpoints).length === 0"
            density="comfortable"
            icon="mdi-information-outline"
            text="No submodel endpoints are visible for this descriptor."
            type="info"
            variant="tonal"
          />

          <EndpointTable
            v-else
            :endpoints="getEndpointRows(submodelDescriptor.endpoints)"
          />

          <template v-if="edcAccessEnabled">
            <div class="d-flex justify-end mt-4">
              <v-btn
                :disabled="!canLoadSubmodel(submodelDescriptor)"
                :loading="getSubmodelState(submodelDescriptor).isLoading"
                prepend-icon="mdi-download-network-outline"
                size="small"
                variant="tonal"
                @click="emit('load-edc-submodel', submodelDescriptor)"
              >
                {{ hasSubmodelData(submodelDescriptor) ? 'Reload Submodel' : 'Load Submodel' }}
              </v-btn>
            </div>

            <v-alert
              v-if="!canLoadSubmodel(submodelDescriptor)"
              class="mt-3"
              density="comfortable"
              icon="mdi-alert-circle-outline"
              text="This submodel descriptor has no complete DSP endpoint information."
              type="warning"
              variant="tonal"
            />

            <v-alert
              v-if="getSubmodelState(submodelDescriptor).error"
              class="mt-3"
              density="comfortable"
              icon="mdi-alert-circle-outline"
              type="error"
              variant="tonal"
            >
              <div
                v-for="line in getSubmodelErrorLines(submodelDescriptor)"
                :key="line"
              >
                {{ line }}
              </div>
            </v-alert>

            <template v-if="hasSubmodelData(submodelDescriptor)">
              <div class="text-subtitle-2 mt-4 mb-2">
                {{ getLoadedSubmodelTitle(submodelDescriptor) }}
              </div>

              <v-sheet
                v-if="isFullSubmodelResponse(submodelDescriptor)"
                border
                rounded
              >
                <v-table density="comfortable" hover>
                  <thead class="bg-tableHeader">
                    <tr>
                      <th class="text-titleText">SubmodelElement</th>
                      <th class="text-titleText">Description</th>
                      <th class="text-titleText">Definition</th>
                      <th class="text-titleText">Value</th>
                    </tr>
                  </thead>

                  <tbody>
                    <GenericDataTableView
                      :level="0"
                      :submodel-element-data="getSubmodelElements(submodelDescriptor)"
                    />
                  </tbody>
                </v-table>
              </v-sheet>

              <SubmodelValueOnlyView
                v-else
                :value="getSubmodelData(submodelDescriptor)"
              />
            </template>
          </template>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </section>
</template>

<script lang="ts" setup>
  import type { EdcSubmodelViewState } from '@/pages/modules/CatenaXplorer/catenaXplorerUtils'
  import SubmodelValueOnlyView from '@/components/UIComponents/SubmodelValueOnlyView.vue'
  import {
    getDescriptorKey,
    getDescriptorTitle,
    getEndpointRows,
    getReferenceKeyValues,
    getSubmodelEdcEndpointInfo,
    getSubmodelMarkerValues,
    normalizeSupplementalSemanticIds,
  } from '@/pages/modules/CatenaXplorer/catenaXplorerUtils'
  import EndpointTable from '@/pages/modules/CatenaXplorer/components/EndpointTable.vue'
  import ReferenceChips from '@/pages/modules/CatenaXplorer/components/ReferenceChips.vue'

  const props = withDefaults(defineProps<{
    descriptors: any[]
    edcAccessEnabled?: boolean
    edcSubmodels?: Record<string, EdcSubmodelViewState>
  }>(), {
    edcAccessEnabled: false,
    edcSubmodels: () => ({}),
  })

  const emit = defineEmits<{
    'load-edc-submodel': [descriptor: any]
  }>()

  function getSubmodelState (submodelDescriptor: any): EdcSubmodelViewState {
    return props.edcSubmodels[getDescriptorKey(submodelDescriptor)] ?? {}
  }

  function canLoadSubmodel (submodelDescriptor: any): boolean {
    return getSubmodelEdcEndpointInfo(submodelDescriptor) !== null
  }

  function getSubmodelData (submodelDescriptor: any): unknown {
    return getSubmodelState(submodelDescriptor).data
  }

  function getSubmodelElements (submodelDescriptor: any): any[] {
    const data = getSubmodelData(submodelDescriptor) as { submodelElements?: unknown } | undefined
    return Array.isArray(data?.submodelElements) ? data.submodelElements : []
  }

  function hasSubmodelData (submodelDescriptor: any): boolean {
    return Object.prototype.hasOwnProperty.call(getSubmodelState(submodelDescriptor), 'data')
  }

  function isFullSubmodelResponse (submodelDescriptor: any): boolean {
    const data = getSubmodelData(submodelDescriptor) as { submodelElements?: unknown } | undefined
    return Array.isArray(data?.submodelElements)
  }

  function getLoadedSubmodelTitle (submodelDescriptor: any): string {
    return isFullSubmodelResponse(submodelDescriptor) ? 'Submodel' : 'Submodel Value'
  }

  function getSubmodelErrorLines (submodelDescriptor: any): string[] {
    return (getSubmodelState(submodelDescriptor).error ?? '')
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean)
  }
</script>
