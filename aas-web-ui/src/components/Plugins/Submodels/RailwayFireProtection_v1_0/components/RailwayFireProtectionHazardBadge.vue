<template>
  <v-chip
    class="font-weight-bold"
    :color="meta.color"
    label
    size="small"
    variant="flat"
  >
    {{ meta.short }}
  </v-chip>
</template>

<script lang="ts" setup>
  import type { HazardLevelCode } from '../types'
  import { hazardLevelMeta } from '../utils/hazardLevel'

  defineOptions({
    name: 'RailwayFireProtectionHazardBadge',
  })

  // Props
  const props = defineProps<{
    code: HazardLevelCode
  }>()

  // Computed properties
  const meta = computed(() => hazardLevelMeta(props.code))
</script>
