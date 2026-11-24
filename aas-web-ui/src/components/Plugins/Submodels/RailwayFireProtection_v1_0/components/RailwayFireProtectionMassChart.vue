<template>
  <!-- Donut chart: combustible part of the total mass -->
  <figure v-if="typeof share === 'number'" class="rfp-mass-chart d-flex align-center ga-4 ma-0">
    <v-progress-circular
      :aria-label="`${percentText} of the total mass is combustible`"
      class="flex-shrink-0"
      color="primary"
      :model-value="share * 100"
      size="112"
      width="16"
    >
      <span class="text-title-medium font-weight-bold text-high-emphasis">{{ percentText }}</span>
    </v-progress-circular>

    <figcaption class="d-flex flex-column ga-1 text-body-small">
      <div class="d-flex align-center ga-2">
        <span class="rfp-mass-chart__swatch bg-primary" />
        <span>Combustible</span>
        <span class="font-weight-medium ml-auto">{{ percentText }}</span>
      </div>

      <div class="d-flex align-center ga-2">
        <span class="rfp-mass-chart__swatch rfp-mass-chart__swatch--rest" />
        <span>Non-combustible</span>
        <span class="font-weight-medium ml-auto">{{ restPercentText }}</span>
      </div>
    </figcaption>
  </figure>

  <div v-else-if="share === 'invalid'" class="d-flex align-center ga-2 text-body-small text-medium-emphasis">
    <v-icon color="warning" icon="mdi-alert-outline" size="small" />
    <span>The combustible mass exceeds the total mass, so no share can be shown.</span>
  </div>
</template>

<script lang="ts" setup>
  import type { Material } from '../types'
  import { combustibleShare } from '../utils/presentation'

  defineOptions({
    name: 'RailwayFireProtectionMassChart',
  })

  const props = defineProps<{
    material: Material | null
  }>()

  const percent = new Intl.NumberFormat('en', { style: 'percent', maximumFractionDigits: 1 })

  const share = computed(() => combustibleShare(props.material))

  const percentText = computed(() => typeof share.value === 'number' ? percent.format(share.value) : '')

  const restPercentText = computed(() => typeof share.value === 'number' ? percent.format(1 - share.value) : '')
</script>

<style scoped>
  .rfp-mass-chart__swatch {
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 2px;
  }

  /* Same colour as the underlay of v-progress-circular */
  .rfp-mass-chart__swatch--rest {
    background-color: rgba(var(--v-border-color), var(--v-border-opacity));
  }
</style>
