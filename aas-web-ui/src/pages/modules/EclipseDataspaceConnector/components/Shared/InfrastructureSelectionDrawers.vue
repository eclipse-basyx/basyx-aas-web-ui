<template>
  <v-navigation-drawer
    class="leftMenu"
    color="appNavigation"
    :width="336"
  >
    <v-card class="d-flex flex-column" color="rgba(0,0,0,0)" elevation="0" height="100%">
      <!-- Infrastructure Selection -->
      <div class="px-2 pt-2">
        <v-select
          v-model="selectedInfrastructureId"
          density="compact"
          hide-details
          item-title="name"
          item-value="id"
          :items="selectableInfrastructures"
          label="Select AAS Infrastructure"
          no-data-text="No infrastructure with configured AAS Repository"
          variant="outlined"
        >
          <template #item="{ props: itemProps, item }">
            <v-list-item v-bind="itemProps" :subtitle="getInfrastructureTemplateDefinition(item).label" />
          </template>
        </v-select>
      </div>

      <!-- AAS List of the selected Infrastructure -->
      <InfrastructureAasList
        v-model="selectedAas"
        class="flex-grow-1"
        :infrastructure="selectedInfrastructure"
      />
    </v-card>
  </v-navigation-drawer>

  <v-navigation-drawer
    color="appNavigation"
    :width="336"
  >
    <v-card class="d-flex flex-column" color="rgba(0,0,0,0)" elevation="0" height="100%">
      <!-- Selected AAS (same height as the infrastructure selection, so both lists align) -->
      <div class="px-2 pt-2">
        <v-text-field
          density="compact"
          hide-details
          label="Selected AAS"
          :model-value="selectedAas ? nameToDisplay(selectedAas) : ''"
          prepend-inner-icon="custom:aasIcon"
          readonly
          variant="outlined"
        />
      </div>

      <!-- Submodel List of the selected AAS -->
      <InfrastructureSubmodelList
        v-model="selectedSubmodels"
        :aas="selectedAas"
        class="flex-grow-1"
        :infrastructure="selectedInfrastructure"
        :preselect-all="preselectAllSubmodels"
      />
    </v-card>
  </v-navigation-drawer>
</template>

<script lang="ts" setup>
  import type { InfrastructureConfig } from '@/types/Infrastructure'
  import { useReferableUtils } from '@/composables/AAS/ReferableUtils'
  import InfrastructureAasList from '@/pages/modules/EclipseDataspaceConnector/components/Assets/InfrastructureAasList.vue'
  import InfrastructureSubmodelList from '@/pages/modules/EclipseDataspaceConnector/components/Assets/InfrastructureSubmodelList.vue'
  import { useInfrastructureStore } from '@/store/InfrastructureStore'
  import { getInfrastructureTemplateDefinition, isAasSourceInfrastructure } from '@/utils/InfrastructureUtils'

  // Drawers to select an AAS infrastructure, one of its AAS and Submodels of that AAS, placed in a v-layout
  defineProps<{
    preselectAllSubmodels?: boolean // Select all Submodels of a newly selected AAS
  }>()

  const selectedInfrastructureId = defineModel<string | null>('infrastructureId', { default: null })
  const selectedAas = defineModel<any>('aas', { default: null })
  const selectedSubmodels = defineModel<Array<any>>('submodels', { default: () => [] })

  // Stores
  const infrastructureStore = useInfrastructureStore()

  // Composables
  const { nameToDisplay } = useReferableUtils()

  // Computed Properties
  const selectableInfrastructures = computed(() =>
    infrastructureStore.getInfrastructures.filter(infrastructure => isAasSourceInfrastructure(infrastructure)),
  )
  const selectedInfrastructure = computed<InfrastructureConfig | null>(() =>
    selectableInfrastructures.value.find(infrastructure => infrastructure.id === selectedInfrastructureId.value) ?? null,
  )
</script>
