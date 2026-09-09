<template>
  <v-container class="pa-0" fluid>
    <v-row justify="center">
      <v-col
        v-for="(item, index) in gaugeItems"
        :key="item.key"
        cols="12"
        md="6"
        xl="4"
      >
        <div
          :aria-label="gaugeAccessibleLabel(item)"
          class="text-center"
          role="group"
        >
          <div :ref="element => setGaugeChartRef(element, index)" />
          <div class="text-title-medium">{{ item.label }}</div>

          <div class="text-headline-small text-primary">
            {{ formatGaugeValue(item.value) }}<span v-if="item.unit"> {{ item.unit }}</span>
          </div>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts" setup>
  import type { ComponentPublicInstance } from 'vue'
  import ApexCharts, { type ApexOptions } from 'apexcharts'
  import { useTheme } from 'vuetify'
  import { useConceptDescriptionHandling } from '@/composables/AAS/ConceptDescriptionHandling'
  import { useReferableUtils } from '@/composables/AAS/ReferableUtils'

  type GaugeItem = {
    key: string
    value: number
    label: string
    unit: string
  }

  const props = defineProps<{
    chartData: any
    timeVariable: any
    yVariables: any
    chartOptionsExternal: any
  }>()

  const emit = defineEmits<{
    (event: 'chart-options', value: any): void
  }>()

  const theme = useTheme()

  // Composables
  const { unitSuffix } = useConceptDescriptionHandling()
  const { nameToDisplay } = useReferableUtils()

  const gaugeChartElements = ref<Array<HTMLElement | null>>([])
  const chartInstances: ApexCharts[] = []

  const localChartOptions = ref({} as any)

  // Computed properties
  const currentTheme = computed(() => {
    return theme.global.current.value.dark
  })

  const gaugeItems = computed<GaugeItem[]>(() => {
    if (!Array.isArray(props.chartData)) {
      return []
    }

    return props.chartData.flatMap((series: any, index: number) => {
      const lastDataPoint = Array.isArray(series) ? series.at(-1) : undefined
      if (
        !lastDataPoint
        || lastDataPoint.value === null
        || lastDataPoint.value === undefined
        || lastDataPoint.value === ''
      ) {
        return []
      }

      const value = Number(lastDataPoint.value)
      if (!Number.isFinite(value)) {
        return []
      }

      const yVariable = props.yVariables?.[index]
      return [{
        key: yVariable?.idShort || `gauge-${index}`,
        value,
        label: yVariable ? nameToDisplay(yVariable) : `Value ${index + 1}`,
        unit: yVariable ? unitSuffix(yVariable) : '',
      }]
    })
  })

  onMounted(async () => {
    await nextTick()
    renderCharts()
  })

  onUnmounted(() => {
    destroyCharts()
  })

  watch(
    [() => props.chartData, () => props.yVariables],
    async () => {
      await nextTick()
      renderCharts()
    },
    { deep: true },
  )

  // Watch for theme changes and update the charts
  watch(
    () => currentTheme.value,
    newVal => {
      for (const chartInstance of chartInstances) {
        chartInstance.updateOptions(
          {
            theme: {
              mode: newVal ? 'dark' : 'light',
            },
          },
          false,
          true,
        )
      }
    },
  )

  function setGaugeChartRef (element: Element | ComponentPublicInstance | null, index: number): void {
    gaugeChartElements.value[index] = element instanceof HTMLElement ? element : null
  }

  function renderCharts (): void {
    destroyCharts()

    if (gaugeItems.value.length === 0) {
      return
    }

    let firstChartOptions: ApexOptions | null = null
    for (const [index, item] of gaugeItems.value.entries()) {
      const chartElement = gaugeChartElements.value[index]
      if (!chartElement) {
        continue
      }

      const chartOptions: ApexOptions = {
        chart: {
          id: `gauge-${index}`,
          type: 'radialBar',
          height: 280,
          background: '#ffffff00',
        },
        plotOptions: {
          radialBar: {
            startAngle: -140,
            endAngle: 140,
            hollow: {
              margin: 5,
              size: '45%',
              background: 'transparent',
            },
            dataLabels: {
              name: {
                show: false,
              },
              value: {
                show: false,
              },
            },
          },
        },
        labels: [item.label],
        theme: {
          mode: currentTheme.value ? 'dark' : 'light',
        },
        series: [item.value],
      }

      if (props.chartOptionsExternal) {
        Object.assign(chartOptions, props.chartOptionsExternal)
        chartOptions.chart = {
          ...chartOptions.chart,
          id: `gauge-${index}`,
          type: 'radialBar',
        }
      }

      // Values and labels belong to each individual gauge and must not be
      // overwritten by options emitted for a previously rendered gauge.
      chartOptions.labels = [item.label]
      chartOptions.series = [item.value]

      const chartInstance = new ApexCharts(chartElement, chartOptions)
      chartInstances.push(chartInstance)
      chartInstance.render()
      firstChartOptions ||= chartOptions
    }

    if (firstChartOptions) {
      localChartOptions.value = { ...firstChartOptions }
      emit('chart-options', localChartOptions.value)
    }
  }

  function destroyCharts (): void {
    for (const chartInstance of chartInstances.splice(0)) {
      chartInstance.destroy()
    }
  }

  function formatGaugeValue (value: number): string {
    return value.toFixed(2)
  }

  function gaugeAccessibleLabel (item: GaugeItem): string {
    const unit = item.unit ? ` ${item.unit}` : ''
    return `${item.label}: ${formatGaugeValue(item.value)}${unit}`
  }
</script>
