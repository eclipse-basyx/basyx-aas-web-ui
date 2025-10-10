<template>
    <v-container fluid class="pa-0">
        <div class="chart-container">
            <div ref="gaugeChart"></div>
        </div>
    </v-container>
</template>

<script lang="ts" setup>
    import ApexCharts from 'apexcharts';
    import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
    import { useTheme } from 'vuetify';
    import { useConceptDescriptionHandling } from '@/composables/AAS/ConceptDescriptionHandling';
    import { useReferableUtils } from '@/composables/AAS/ReferableUtils';

    const props = defineProps<{
        chartData: any;
        timeVariable: any;
        yVariables: any;
        chartOptionsExternal: any;
    }>();

    const emit = defineEmits<{
        (event: 'chartOptions', value: any): void;
    }>();

    const theme = useTheme();

    // Composables
    const { unitSuffix } = useConceptDescriptionHandling();
    const { nameToDisplay } = useReferableUtils();

    const gaugeChart = ref<HTMLElement | null>(null);
    let chartInstance: ApexCharts | null = null;

    const localChartOptions = ref({} as any);
    const currentUnits = ref<string[]>([]); // Store units for each gauge

    // Computed properties
    const currentTheme = computed(() => {
        return theme.global.current.value.dark;
    });

    onMounted(async () => {
        await nextTick(); // Ensure the DOM is updated
        if (gaugeChart.value) {
            renderChart();
        } else {
            console.error('Gauge element is not available.');
        }
    });

    onUnmounted(() => {
        if (chartInstance) {
            chartInstance.destroy();
            chartInstance = null;
        }
    });

    watch(
        () => props.chartData,
        () => {
            if (chartInstance) {
                updateChartData();
            } else {
                renderChart();
            }
        },
        { deep: true }
    );

    // Watch for theme changes and update the chart
    watch(
        () => currentTheme.value,
        (newVal) => {
            if (chartInstance) {
                chartInstance.updateOptions(
                    {
                        theme: {
                            mode: newVal ? 'dark' : 'light',
                        },
                    },
                    false,
                    true
                );
            }
        }
    );

    function prepareGaugeData(): { values: number[]; labels: string[]; units: string[] } {
        if (!props.chartData || !Array.isArray(props.chartData)) {
            return { values: [], labels: [], units: [] };
        }

        // Extract the last object of each array in the chartData array
        const values = props.chartData.map((data: any) => {
            return data[data.length - 1];
        });

        // Extract the values from the objects
        const chartValues = values.map((element: any) => {
            return Number(element.value);
        });

        // Determine the labels for each value
        const chartLabels = values.map((element: any, index: number) => {
            let name = 'Value ' + Number(index + 1);
            // Check if the yVariable exists
            if (props.yVariables.length > index) {
                name = nameToDisplay(props.yVariables[index]);
            }
            return name;
        });

        // Extract units for each value
        const chartUnits = values.map((_element: any, index: number) => {
            let unit = '';
            if (props.yVariables.length > index && props.yVariables[index]) {
                unit = unitSuffix(props.yVariables[index]);
            }
            return unit;
        });

        return { values: chartValues, labels: chartLabels, units: chartUnits };
    }

    function renderChart(): void {
        if (!props.chartData || props.chartData.length === 0) {
            console.warn('No chart data available to render.');
            return;
        }

        if (gaugeChart.value) {
            const { values, labels, units } = prepareGaugeData();

            if (values.length === 0) {
                console.warn('No gauge data available to render.');
                return;
            }

            // Store units for use in formatter
            currentUnits.value = units;

            const chartOptions = {
                chart: {
                    id: 'gauge',
                    type: 'radialBar',
                    height: 350,
                    background: '#ffffff00',
                },
                plotOptions: {
                    radialBar: {
                        offsetY: 0,
                        startAngle: -140,
                        endAngle: 140,
                        hollow: {
                            margin: 5,
                            size: '40%',
                            background: 'transparent',
                            image: undefined,
                        },
                        dataLabels: {
                            name: {
                                fontSize: '16px',
                                color: undefined,
                                offsetY: 120,
                            },
                            value: {
                                offsetY: 76,
                                fontSize: '22px',
                                color: undefined,
                                formatter: function (val: any) {
                                    let index = 0;
                                    const currentVal = Number(val);

                                    // Find the index by matching the value with the stored values
                                    for (let i = 0; i < values.length; i++) {
                                        if (Math.abs(values[i] - currentVal) < 0.001) {
                                            index = i;
                                            break;
                                        }
                                    }

                                    const unit = currentUnits.value[index] || '';
                                    const unitDisplay = unit ? ' ' + unit : '';
                                    return Number(val).toFixed(2) + unitDisplay;
                                },
                            },
                        },
                    },
                },
                labels: labels,
                theme: {
                    mode: currentTheme.value ? 'dark' : 'light',
                },
                series: values,
            };

            // Override chart options with external options
            if (props.chartOptionsExternal) {
                Object.assign(chartOptions, props.chartOptionsExternal);
            }

            // Create and render the chart
            chartInstance = new ApexCharts(gaugeChart.value, chartOptions);
            chartInstance.render();

            // Store the chart options
            localChartOptions.value = { ...chartOptions };

            // Emit the initial chart options
            emit('chartOptions', localChartOptions.value);
        }
    }

    function updateChartData(): void {
        if (chartInstance) {
            const { values, labels, units } = prepareGaugeData();

            if (values.length === 0) {
                return;
            }

            // Update stored units
            currentUnits.value = units;

            // Update series data
            chartInstance.updateSeries(values, true);

            // Update labels
            chartInstance.updateOptions({
                labels: labels,
            });
        }
    }
</script>
