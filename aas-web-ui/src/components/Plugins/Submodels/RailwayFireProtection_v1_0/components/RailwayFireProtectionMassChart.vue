<template>
  <!-- Donut chart: combustible part of the total mass -->
  <figure v-if="typeof share === 'number'" class="rfp-mass-chart d-flex align-center ga-4 ma-0">
    <svg
      :aria-label="`${percentText} of the total mass is combustible`"
      class="rfp-mass-chart__donut flex-shrink-0"
      role="img"
      viewBox="0 0 42 42"
    >
      <circle
        class="rfp-mass-chart__rest"
        cx="21"
        cy="21"
        fill="none"
        r="15.9155"
        stroke-width="6"
      />
      <!-- The circumference is 100, so the dash length is the percentage -->
      <circle
        v-if="share > 0"
        class="rfp-mass-chart__combustible"
        cx="21"
        cy="21"
        fill="none"
        r="15.9155"
        :stroke-dasharray="`${share * 100} ${100 - share * 100}`"
        stroke-dashoffset="25"
        stroke-width="6"
      />

      <text
        class="rfp-mass-chart__value"
        dominant-baseline="central"
        text-anchor="middle"
        x="21"
        y="21"
      >
        {{ percentText }}
      </text>
    </svg>

    <figcaption class="d-flex flex-column ga-1 text-body-small">
      <div class="d-flex align-center ga-2">
        <span class="rfp-mass-chart__swatch rfp-mass-chart__swatch--combustible" />
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
  .rfp-mass-chart__donut {
    width: 112px;
    height: 112px;
  }

  .rfp-mass-chart__rest {
    stroke: rgba(var(--v-theme-on-surface), 0.12);
  }

  .rfp-mass-chart__combustible {
    stroke: rgb(var(--v-theme-primary));
  }

  .rfp-mass-chart__value {
    fill: rgb(var(--v-theme-on-surface));
    font-size: 7px;
    font-weight: 600;
  }

  .rfp-mass-chart__swatch {
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 2px;
  }

  .rfp-mass-chart__swatch--combustible {
    background-color: rgb(var(--v-theme-primary));
  }

  .rfp-mass-chart__swatch--rest {
    background-color: rgba(var(--v-theme-on-surface), 0.12);
  }
</style>
