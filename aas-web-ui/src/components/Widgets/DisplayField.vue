<template>
  <v-container class="pa-0" fluid>
    <div
      style="
                min-height: 350px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
            "
    >
      <div
        v-for="(displayElement, index) in localChartData"
        :key="displayElement.idShort || `element-${index}`"
        class="my-3"
        style="text-align: center"
      >
        <v-card-subtitle>{{ nameToDisplay(displayElement) + ': ' }}</v-card-subtitle>

        <v-card-title>
          <span class="text-h5 text-primary">{{ formatValue(displayElement) }}</span>
          <span class="ml-2 text-h5">{{ unitSuffix(displayElement) }}</span>
        </v-card-title>
      </div>
    </div>
  </v-container>
</template>

<script lang="ts" setup>
  import type { types as aasTypes } from '@aas-core-works/aas-core3.1-typescript'
  import { useConceptDescriptionHandling } from '@/composables/AAS/ConceptDescriptionHandling'
  import { useReferableUtils } from '@/composables/AAS/ReferableUtils'

  interface ChartDataPoint {
    time: string
    value: unknown
  }

  type DisplayElement = Omit<aasTypes.Property, 'value'> & ChartDataPoint

  const props = defineProps<{
    chartData: Array<Array<ChartDataPoint>>
    yVariables: Array<aasTypes.Property>
  }>()

  const { unitSuffix } = useConceptDescriptionHandling()
  const { nameToDisplay } = useReferableUtils()

  const localChartData = ref<Array<DisplayElement>>([])

  watch(
    () => props.chartData,
    () => {
      initializeDisplay()
    },
    { deep: true },
  )

  onMounted(() => {
    initializeDisplay()
  })

  function initializeDisplay (): void {
    // Reduce each time series to its last element and join with yVariables
    localChartData.value = props.chartData.flatMap((timeSeries: Array<ChartDataPoint>, index: number) => {
      const lastDataPoint = timeSeries.at(-1)
      if (!lastDataPoint) {
        return []
      }

      const yVariable = props.yVariables[index]
      // Merge the data point with the property metadata, ensuring value is from data point
      return [{
        ...yVariable,
        ...lastDataPoint,
        value: lastDataPoint.value,
      } as DisplayElement]
    })
  }

  // Format numeric chart values consistently while preserving non-numeric values.
  function formatValue (prop: DisplayElement): string | undefined {
    const value = prop.value == null ? '' : String(prop.value)
    if (!value) {
      return undefined
    }

    const numberValue = Number(value)
    if (Number.isFinite(numberValue)) {
      return numberValue.toFixed(2)
    }

    return value
  }
</script>
