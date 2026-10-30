<template>
  <dl class="models3d-definitions text-body-small">
    <template v-for="entry in rows" :key="entry.label + entry.value">
      <dt class="d-flex align-center text-subtitleText">
        <v-icon v-if="entry.icon" class="mr-2" size="16">{{ entry.icon }}</v-icon>
        {{ entry.label }}
      </dt>

      <dd class="text-break">{{ entry.value }}</dd>
    </template>
  </dl>
</template>

<script lang="ts" setup>
  import type { DetailRow } from '../types'

  defineProps<{ rows: DetailRow[] }>()
</script>

<style scoped>
  .models3d-definitions {
    display: grid;
    grid-template-columns: 8.5rem minmax(0, 1fr);
    gap: 6px 16px;
    margin: 0;
  }

  .models3d-definitions dd {
    margin: 0;
  }
</style>
