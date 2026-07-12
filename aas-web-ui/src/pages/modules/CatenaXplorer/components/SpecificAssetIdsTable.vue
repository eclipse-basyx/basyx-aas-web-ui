<template>
  <section>
    <div class="text-h6 mb-2">Specific Asset IDs</div>

    <v-alert
      v-if="assetIds.length === 0"
      density="comfortable"
      icon="mdi-tag-off-outline"
      text="No specific asset IDs are visible for this descriptor."
      type="info"
      variant="tonal"
    />

    <div v-else class="overflow-x-auto">
      <v-table class="border rounded" density="comfortable">
        <thead class="bg-tableHeader">
          <tr>
            <th class="text-titleText">Name</th>
            <th class="text-titleText">Value</th>
            <th class="text-titleText">Markers</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="(assetId, index) in assetIds" :key="`${assetId.name}-${index}`">
            <td class="text-body-small text-break">{{ displayValue(assetId.name) }}</td>
            <td class="text-body-small text-break">{{ displayValue(assetId.value) }}</td>

            <td>
              <v-chip
                v-for="marker in getExternalSubjectMarkerValues(assetId)"
                :key="marker"
                class="mr-1 my-1"
                size="x-small"
                variant="tonal"
              >
                {{ marker }}
              </v-chip>

              <span
                v-if="getExternalSubjectMarkerValues(assetId).length === 0"
                class="text-body-small text-medium-emphasis"
              >
                -
              </span>
            </td>
          </tr>
        </tbody>
      </v-table>
    </div>
  </section>
</template>

<script lang="ts" setup>
  import {
    displayValue,
    getExternalSubjectMarkerValues,
  } from '@/pages/modules/CatenaXplorer/catenaXplorerUtils'

  defineProps<{
    assetIds: any[]
  }>()
</script>
