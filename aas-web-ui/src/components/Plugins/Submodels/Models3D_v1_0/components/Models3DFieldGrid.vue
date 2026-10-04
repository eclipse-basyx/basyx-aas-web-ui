<template>
  <div :style="gridStyle">
    <v-sheet
      v-for="entry in fields"
      :key="entry.label"
      border
      class="h-100 pa-2"
      rounded
    >
      <div class="text-body-small text-subtitleText">{{ entry.label }}</div>

      <div class="mt-1 text-body-small text-break">{{ entry.value }}</div>
    </v-sheet>
  </div>
</template>

<script lang="ts" setup>
  import type { DetailField } from '../types'

  defineProps<{ fields: DetailField[] }>()

  const gridStyle = {
    display: 'grid',
    gap: '8px',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 11rem), 1fr))',
  }
</script>
