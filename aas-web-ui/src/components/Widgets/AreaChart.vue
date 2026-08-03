<template>
  <v-container class="pa-0" fluid>
    <!-- Options -->
    <v-list class="pa-0" nav style="margin-left: -8px; margin-top: -14px">
      <v-list-item class="pb-0">
        <template #title>
          <div class="text-title-small">{{ 'Options: ' }}</div>
        </template>
      </v-list-item>
    </v-list>

    <v-row align="center">
      <v-col cols="auto">
        <v-select
          v-model="interpolation"
          density="compact"
          hide-details
          :items="interpolationOptions"
          label="Interpolation"
          variant="outlined"
          @update:model-value="changeInterpolation()"
        />
      </v-col>
    </v-row>

    <div class="chart-container">
      <div ref="areaChart" />
    </div>
  </v-container>
</template>

<script lang="ts" setup>
  import ApexCharts, { type ApexOptions } from 'apexcharts'
  import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
  import { useTheme } from 'vuetify'
  import { type ResolvedTimeRange, toApexTimeRange } from '@/components/Plugins/Submodels/TimeSeries/timeRange'
  import { useChartHandling } from '@/composables/ChartHandling'

  const props = defineProps<{
    chartData: any
    timeVariable: any
    yVariables: any
    chartOptionsExternal: any
    timeRange: ResolvedTimeRange | null
  }>()

  const emit = defineEmits<{
    (event: 'chart-options', value: any): void
  }>()

  const theme = useTheme()

  const { prepareSeriesValues, prepareYValueTooltip, prepareLegend } = useChartHandling()

  const areaChart = ref<HTMLElement | null>(null)
  let chartInstance: ApexCharts | null = null

  const localChartOptions = ref({} as any)
  type InterpolationCurve = 'smooth' | 'straight' | 'stepline' | 'linestep' | 'monotoneCubic'
  const interpolationOptions: InterpolationCurve[] = ['smooth', 'straight', 'stepline']
  const interpolation = ref<InterpolationCurve>('smooth') // Default interpolation type

  // Computed properties
  const currentTheme = computed(() => {
    return theme.global.current.value.dark
  })

  onMounted(async () => {
    await nextTick() // Ensure the DOM is updated
    if (areaChart.value) {
      renderChart()
    } else {
      console.error('AreaChart element is not available.')
    }
  })

  onUnmounted(() => {
    if (chartInstance) {
      chartInstance.destroy()
      chartInstance = null
    }
  })

  watch(
    () => props.chartData,
    () => {
      if (chartInstance) {
        updateChartData()
      } else {
        renderChart()
      }
    },
    { deep: true },
  )

  watch(
    () => props.timeRange,
    value => {
      if (chartInstance) {
        chartInstance.updateOptions({ xaxis: toApexTimeRange(value) })
      }
    },
    { deep: true },
  )

  // Watch for theme changes and update the chart
  watch(
    () => currentTheme.value,
    newVal => {
      if (chartInstance) {
        chartInstance.updateOptions(
          {
            markers: {
              strokeColors: newVal ? '#1E1E1E' : '#FFFFFF',
            },
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

  function renderChart (): void {
    if (Object.keys(props.chartData).length === 0) {
      console.warn('No chart data available to render.')
      return
    }

    if (areaChart.value) {
      const series = prepareSeriesValues(props.chartData, props.yVariables)
      const tooltipY = prepareYValueTooltip(props.chartData, props.yVariables)
      const legend = prepareLegend(props.yVariables)

      const chartOptions = {
        chart: {
          id: 'area',
          type: 'area',
          height: 350,
          background: '#ffffff00',
          zoom: {
            enabled: false,
          },
        },
        legend: legend,
        dataLabels: {
          enabled: false,
        },
        xaxis: {
          type: 'datetime',
          ...toApexTimeRange(props.timeRange),
          tickAmount: 10,
          labels: {
            datetimeFormatter: {
              year: 'yyyy',
              month: 'MMM \'yy',
              day: 'dd MMM',
              hour: 'HH:mm',
            },
            datetimeUTC: false,
          },
          tickPlacement: 'on',
        },
        yaxis: {
          decimalsInFloat: 2,
        },
        stroke: {
          curve: 'smooth',
          width: 3,
        },
        grid: {
          xaxis: {
            lines: {
              show: false,
            },
          },
        },
        tooltip: {
          x: {
            format: 'dd MMM yyyy HH:mm:ss',
          },
          y: tooltipY,
        },
        theme: {
          mode: currentTheme.value ? 'dark' : 'light',
        },
        series: series,
      }

      // Override chart options with external options
      if (props.chartOptionsExternal) {
        Object.assign(chartOptions, props.chartOptionsExternal)

        chartOptions.xaxis = {
          ...chartOptions.xaxis,
          ...toApexTimeRange(props.timeRange),
        }
        const curve = chartOptions?.stroke?.curve
        interpolation.value = typeof curve === 'string' ? (curve as InterpolationCurve) : 'smooth'
      }

      // Create and render the chart
      chartInstance = new ApexCharts(areaChart.value, chartOptions as ApexOptions)
      chartInstance.render()

      // Store the chart options
      localChartOptions.value = { ...chartOptions }

      // Emit the initial chart options
      emit('chart-options', localChartOptions.value)
    }
  }

  function updateChartData (): void {
    if (chartInstance) {
      const series = prepareSeriesValues(props.chartData, props.yVariables)
      const tooltipY = prepareYValueTooltip(props.chartData, props.yVariables)
      const legend = prepareLegend(props.yVariables)

      // Update series data
      chartInstance.updateSeries(series, true)

      // Update options
      chartInstance.updateOptions({
        tooltip: {
          y: tooltipY,
        },
        legend: legend,
      })
    }
  }

  function changeInterpolation (): void {
    if (chartInstance) {
      const curve = interpolation.value as InterpolationCurve
      chartInstance.updateOptions({
        stroke: {
          curve: curve,
        },
      })

      localChartOptions.value = { ...localChartOptions.value, stroke: { curve: curve } }

      // Emit the updated options
      emit('chart-options', localChartOptions.value)
    }
  }
</script>
