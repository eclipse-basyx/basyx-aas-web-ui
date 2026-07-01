<template>
  <div v-if="values.length > 0" class="d-flex ga-1 flex-wrap mt-1">
    <v-chip
      v-for="value in values"
      :key="value"
      class="mr-1 my-1"
      size="x-small"
      variant="tonal"
    >
      {{ value }}
    </v-chip>
  </div>

  <span v-else class="text-body-small text-medium-emphasis">-</span>
</template>

<script lang="ts" setup>
  withDefaults(defineProps<{
    values?: string[]
  }>(), {
    values: () => [],
  })
</script>
