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
  import { onMounted, ref, watch } from 'vue'
  import { useConceptDescriptionHandling } from '@/composables/AAS/ConceptDescriptionHandling'
  import { useReferableUtils } from '@/composables/AAS/ReferableUtils'

  interface ChartDataPoint {
    time: string
    value: string
  }

  type DisplayElement = ChartDataPoint & aasTypes.Property

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
    localChartData.value = props.chartData.map((timeSeries: Array<ChartDataPoint>, index: number) => {
      const lastDataPoint = timeSeries.at(-1)
      const yVariable = props.yVariables[index]
      // Merge the data point with the property metadata, ensuring value is from data point
      return {
        ...yVariable,
        ...lastDataPoint,
        value: lastDataPoint.value,
      } as DisplayElement
    })
  }

  // Format the Value of the Property
  function formatValue (prop: aasTypes.Property): string | undefined {
    if (!prop.value) {
      return undefined
    }

    // Floating-point types (with decimal places)
    if ([6, 7, 9].includes(prop.valueType)) {
      // Decimal (6), Double (7), Float (9)
      const numberValue = Number.parseFloat(prop.value)
      return numberValue.toFixed(2)
    } else if (
      // Integer types (no decimal places)
      [
        3, // Byte
        16, // Int
        17, // Integer
        18, // Long (moved from floating-point)
        19, // NegativeInteger
        20, // NonNegativeInteger
        21, // NonPositiveInteger
        22, // PositiveInteger
        23, // Short
        26, // UnsignedByte
        27, // UnsignedInt
        28, // UnsignedLong
        29, // UnsignedShort
      ].includes(prop.valueType)
    ) {
      const numberValue = Number.parseInt(prop.value, 10)
      return numberValue.toFixed(0)
    } else {
      return prop.value
    }
  }
</script>
