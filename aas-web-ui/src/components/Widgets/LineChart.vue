<template>
    <v-container fluid class="pa-0">
        <!-- Options -->
        <v-list nav class="pa-0" style="margin-left: -8px; margin-top: -14px">
            <v-list-item class="pb-0">
                <template #title>
                    <div class="text-subtitle-2">{{ 'Options: ' }}</div>
                </template>
            </v-list-item>
        </v-list>
        <v-row align="center">
            <v-col cols="auto">
                <v-text-field
                    v-model="range"
                    type="number"
                    hide-details
                    density="compact"
                    label="Range"
                    variant="outlined"
                    suffix="ms"
                    @blur="changeRange()"
                    @keydown.enter="changeRange()"></v-text-field>
            </v-col>
            <v-col cols="auto">
                <v-select
                    v-model="interpolation"
                    hide-details
                    density="compact"
                    :items="interpolationOptions"
                    label="Interpolation"
                    variant="outlined"
                    @update:model-value="changeInterpolation()"></v-select>
            </v-col>
        </v-row>
        <div class="chart-container">
            <div ref="lineChart"></div>
        </div>
    </v-container>
</template>

<script lang="ts" setup>
    import ApexCharts from 'apexcharts';
    import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
    import { useTheme } from 'vuetify';
    import { useChartHandling } from '@/composables/ChartHandling';

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

    const { prepareSeriesValues, prepareYValueTooltip, prepareLegend } = useChartHandling();

    const lineChart = ref<HTMLElement | null>(null);
    let chartInstance: ApexCharts | null = null;

    const localChartOptions = ref({} as any);
    const range = ref(60000); // Default range in milliseconds
    const interpolationOptions = ['smooth', 'straight', 'stepline'];
    const interpolation = ref('smooth'); // Default interpolation type

    // Computed properties
    const currentTheme = computed(() => {
        return theme.global.current.value.dark;
    });

    onMounted(async () => {
        await nextTick(); // Ensure the DOM is updated
        if (lineChart.value) {
            renderChart();
        } else {
            console.error('LineChart element is not available.');
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
                        markers: {
                            strokeColors: newVal ? '#1E1E1E' : '#FFFFFF',
                        },
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

    function renderChart(): void {
        if (Object.keys(props.chartData).length === 0) {
            console.warn('No chart data available to render.');
            return;
        }

        if (lineChart.value) {
            const series = prepareSeriesValues(props.chartData, props.yVariables);
            const tooltipY = prepareYValueTooltip(props.chartData, props.yVariables);
            const legend = prepareLegend(props.yVariables);

            const chartOptions = {
                chart: {
                    id: 'line',
                    type: 'line',
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
                    range: 60000,
                    tickAmount: 10,
                    labels: {
                        datetimeFormatter: {
                            year: 'yyyy',
                            month: "MMM 'yy",
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
            };

            // Override chart options with external options
            if (props.chartOptionsExternal) {
                Object.assign(chartOptions, props.chartOptionsExternal);

                // Save the range and interpolation from external options
                range.value = chartOptions.xaxis.range || 60000;
                interpolation.value = chartOptions.stroke.curve || 'smooth';
            }

            // Create and render the chart
            chartInstance = new ApexCharts(lineChart.value, chartOptions);
            chartInstance.render();

            // Store the chart options
            localChartOptions.value = { ...chartOptions };

            // Emit the initial chart options
            emit('chartOptions', localChartOptions.value);
        }
    }

    function updateChartData(): void {
        if (chartInstance) {
            const series = prepareSeriesValues(props.chartData, props.yVariables);
            const tooltipY = prepareYValueTooltip(props.chartData, props.yVariables);
            const legend = prepareLegend(props.yVariables);

            // Update series data
            chartInstance.updateSeries(series, true);

            // Update options
            chartInstance.updateOptions({
                tooltip: {
                    y: tooltipY,
                },
                legend: legend,
            });
        }
    }

    function changeRange(): void {
        let rangeValue = Number(range.value);

        if (!rangeValue || rangeValue <= 0) {
            range.value = 60000; // Reset to default if invalid
            return;
        }

        if (chartInstance) {
            chartInstance.updateOptions({
                xaxis: {
                    range: rangeValue,
                },
            });

            localChartOptions.value = { ...localChartOptions.value, xaxis: { range: rangeValue } };

            // Emit the updated options
            emit('chartOptions', localChartOptions.value);
        }
    }

    function changeInterpolation(): void {
        if (chartInstance) {
            chartInstance.updateOptions({
                stroke: {
                    curve: interpolation.value,
                },
            });

            localChartOptions.value = { ...localChartOptions.value, stroke: { curve: interpolation.value } };

            // Emit the updated options
            emit('chartOptions', localChartOptions.value);
        }
    }
</script>
