<template>
  <v-container class="pa-0" fluid>
    <VisualizationHeader default-title="Production Plan" :submodel-element-data="submodelElementData" />
  </v-container>
</template>

<script lang="ts" setup>
  // Options
  defineOptions({
    name: 'ProductionPlan',
    semanticId: 'https://smartfactory.de/semantics/submodel/ProductionPlan#1/0',
  })

  // Properties
  const props = defineProps({
    submodelElementData: {
      type: Object as any,
      default: {} as any,
    },
  })
</script>
