<template>
    <v-container fluid class="pa-0">
        <div
            style="
                min-height: 350px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
            ">
            <div
                v-for="(displayElement, index) in localChartData"
                :key="displayElement.idShort || `element-${index}`"
                style="text-align: center"
                class="my-3">
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
    import { types as aasTypes } from '@aas-core-works/aas-core3.0-typescript';
    import { onMounted, ref, watch } from 'vue';
    import { useConceptDescriptionHandling } from '@/composables/AAS/ConceptDescriptionHandling';
    import { useReferableUtils } from '@/composables/AAS/ReferableUtils';

    interface ChartDataPoint {
        time: string;
        value: string;
    }

    type DisplayElement = ChartDataPoint & aasTypes.Property;

    const props = defineProps<{
        chartData: Array<Array<ChartDataPoint>>;
        yVariables: Array<aasTypes.Property>;
    }>();

    const { unitSuffix } = useConceptDescriptionHandling();
    const { nameToDisplay } = useReferableUtils();

    const localChartData = ref<Array<DisplayElement>>([]);

    watch(
        () => props.chartData,
        () => {
            initializeDisplay();
        },
        { deep: true }
    );

    onMounted(() => {
        initializeDisplay();
    });

    function initializeDisplay(): void {
        // Reduce each time series to its last element and join with yVariables
        localChartData.value = props.chartData.map((timeSeries: Array<ChartDataPoint>, index: number) => {
            const lastDataPoint = timeSeries[timeSeries.length - 1];
            const yVariable = props.yVariables[index];
            // Merge the data point with the property metadata, ensuring value is from data point
            return {
                ...yVariable,
                ...lastDataPoint,
                value: lastDataPoint.value,
            } as DisplayElement;
        });
    }

    // Format the Value of the Property
    function formatValue(prop: aasTypes.Property): string | undefined {
        if (!prop.value) {
            return undefined;
        }

        // Floating-point types (with decimal places)
        if (prop.valueType === 6 || prop.valueType === 7 || prop.valueType === 9) {
            // Decimal (6), Double (7), Float (9)
            const numberValue = parseFloat(prop.value);
            return numberValue.toFixed(2);
        } else if (
            // Integer types (no decimal places)
            prop.valueType === 3 || // Byte
            prop.valueType === 16 || // Int
            prop.valueType === 17 || // Integer
            prop.valueType === 18 || // Long (moved from floating-point)
            prop.valueType === 19 || // NegativeInteger
            prop.valueType === 20 || // NonNegativeInteger
            prop.valueType === 21 || // NonPositiveInteger
            prop.valueType === 22 || // PositiveInteger
            prop.valueType === 23 || // Short
            prop.valueType === 26 || // UnsignedByte
            prop.valueType === 27 || // UnsignedInt
            prop.valueType === 28 || // UnsignedLong
            prop.valueType === 29 // UnsignedShort
        ) {
            const numberValue = parseInt(prop.value, 10);
            return numberValue.toFixed(0);
        } else {
            return prop.value;
        }
    }
</script>
