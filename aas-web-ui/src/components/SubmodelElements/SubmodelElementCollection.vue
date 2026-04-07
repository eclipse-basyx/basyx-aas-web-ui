<template>
  <v-container class="pa-0" fluid>
    <!-- Group of contained SubmodelElements -->
    <SubmodelElementGroup
      :sme-locator="'value'"
      :sme-object="submodelElementCollectionObject"
      :top-margin="'mt-4'"
    />
  </v-container>
</template>

<script lang="ts" setup>
  defineProps({
    submodelElementCollectionObject: {
      type: Object,
      default: () => ({}),
    },
  })
</script>
