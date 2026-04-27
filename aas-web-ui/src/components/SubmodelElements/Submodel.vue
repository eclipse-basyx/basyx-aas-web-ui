<template>
  <v-container class="pa-0" fluid>
    <!-- kind -->
    <v-list-item v-if="submodelObject.kind" class="px-1 pb-1 pt-2">
      <v-list-item-title>
        <span class="text-title-small mr-2">{{ 'Kind: ' }}</span>

        <v-chip
          border
          color="primary"
          label
          size="x-small"
          style="margin-top: -3px"
        >{{
          submodelObject.kind
        }}</v-chip>
      </v-list-item-title>
    </v-list-item>
    <!-- Group of contained SubmodelElements -->
    <SubmodelElementGroup
      :sme-locator="'submodelElements'"
      :sme-object="submodelObject"
      :top-margin="submodelObject.kind ? 'mt-1' : 'mt-4'"
    />
  </v-container>
</template>

<script lang="ts" setup>
  defineProps({
    submodelObject: {
      type: Object,
      default: () => ({}),
    },
  })
</script>
