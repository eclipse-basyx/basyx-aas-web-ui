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
                    v-model="numberOfCategories"
                    type="number"
                    hide-details
                    density="compact"
                    label="Bins"
                    variant="outlined"
                    @blur="initializeSeries()"
                    @keydown.enter="initializeSeries()"></v-text-field>
            </v-col>
            <v-col cols="auto">
                <v-switch
                    v-model="stacked"
                    hide-details
                    label="stacked"
                    density="compact"
                    @change="changeVariant()"></v-switch>
            </v-col>
        </v-row>
        <div class="chart-container">
            <div ref="histogramChart"></div>
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

    const { prepareHistogramData } = useChartHandling();

    const histogramChart = ref<HTMLElement | null>(null);
    let chartInstance: ApexCharts | null = null;

    const localChartOptions = ref({} as any);
    const numberOfCategories = ref(20); // Default number of bins
    const stacked = ref(false); // Default stacked state

    // Computed properties
    const currentTheme = computed(() => {
        return theme.global.current.value.dark;
    });

    onMounted(async () => {
        await nextTick(); // Ensure the DOM is updated
        if (histogramChart.value) {
            renderChart();
        } else {
            console.error('Histogram element is not available.');
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

    function renderChart(): void {
        if (Object.keys(props.chartData).length === 0) {
            console.warn('No chart data available to render.');
            return;
        }

        if (histogramChart.value) {
            const { histograms, categories } = prepareHistogramData(props.chartData, numberOfCategories.value);

            if (!histograms || !categories || histograms.length === 0 || categories.length === 0) {
                console.warn('No histogram data available to render.');
                return;
            }

            const series = histograms.map((histogram: any) => ({
                name: 'Number of values in bin',
                data: histogram,
            }));

            const chartOptions = {
                chart: {
                    id: 'histogram',
                    type: 'bar',
                    height: 350,
                    stacked: false,
                    background: '#ffffff00',
                    zoom: {
                        enabled: false,
                    },
                },
                plotOptions: {
                    bar: {
                        borderRadius: 4,
                        horizontal: false,
                        dataLabels: {
                            position: 'top',
                        },
                    },
                },
                legend: {
                    show: false,
                },
                dataLabels: {
                    enabled: true,
                    offsetX: -6,
                },
                xaxis: {
                    categories: categories,
                },
                theme: {
                    mode: currentTheme.value ? 'dark' : 'light',
                },
                series: series,
            };

            // Override chart options with external options
            if (props.chartOptionsExternal) {
                Object.assign(chartOptions, props.chartOptionsExternal);

                // Save the stacked state from external options
                stacked.value = chartOptions.chart.stacked || false;
            }

            // Create and render the chart
            chartInstance = new ApexCharts(histogramChart.value, chartOptions);
            chartInstance.render();

            // Store the chart options
            localChartOptions.value = { ...chartOptions };

            // Emit the initial chart options
            emit('chartOptions', localChartOptions.value);
        }
    }

    function updateChartData(): void {
        if (chartInstance) {
            const { histograms, categories } = prepareHistogramData(props.chartData, numberOfCategories.value);

            if (!histograms || !categories || histograms.length === 0 || categories.length === 0) {
                return;
            }

            const series = histograms.map((histogram: any) => ({
                name: 'Number of values in bin',
                data: histogram,
            }));

            // Update series data
            chartInstance.updateSeries(series, true);

            // Update categories
            chartInstance.updateOptions({
                xaxis: {
                    categories: categories,
                },
            });
        }
    }

    function initializeSeries(): void {
        updateChartData();
    }

    function changeVariant(): void {
        if (chartInstance) {
            chartInstance.updateOptions({
                chart: {
                    stacked: stacked.value,
                },
            });

            localChartOptions.value = {
                ...localChartOptions.value,
                chart: { ...localChartOptions.value.chart, stacked: stacked.value },
            };

            // Emit the updated options
            emit('chartOptions', localChartOptions.value);
        }
    }
</script>
