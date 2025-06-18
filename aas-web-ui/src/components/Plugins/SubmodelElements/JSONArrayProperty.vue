<template>
    <v-container fluid class="pa-0">
        <v-card class="pa-3">
            <div class="chart-container">
                <div ref="jsonChart"></div>
            </div>
        </v-card>
    </v-container>
</template>

<script lang="ts" setup>
    import ApexCharts from 'apexcharts';
    import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
    import { useTheme } from 'vuetify';

    interface ChartSeries {
        name: string;
        data: any[];
    }

    // Options
    defineOptions({
        name: 'JSONArrayProperty',
        semanticId: 'http://iese.fraunhofer.de/prop_jsonarray',
    });

    const props = defineProps<{
        submodelElementData: any;
    }>();

    const theme = useTheme();

    const jsonChart = ref<HTMLElement | null>(null);
    let chartInstance: ApexCharts | null = null;

    const currentTheme = computed(() => {
        return theme.global.current.value.dark;
    });

    onMounted(async () => {
        await nextTick(); // Ensure the DOM is updated
        if (jsonChart.value) {
            renderChart();
        } else {
            console.error('JsonChart element is not available.');
        }
    });

    onUnmounted(() => {
        if (chartInstance) {
            chartInstance.destroy();
            chartInstance = null;
        }
    });

    watch(
        () => props.submodelElementData,
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
                        title: {
                            style: {
                                color: newVal ? '#FFFFFF' : '#1E1E1E',
                            },
                        },
                    },
                    false,
                    true
                );
            }
        }
    );

    function renderChart(): void {
        if (Object.keys(props.submodelElementData).length === 0) {
            return;
        }

        if (jsonChart.value) {
            const series = prepareSeries();

            // Create chartOptions inside renderChart to use the latest data
            const chartOptions = {
                chart: {
                    id: 'line-chart',
                    height: 320,
                    type: 'line',
                    background: '#00000000',
                    zoom: {
                        enabled: false,
                    },
                },
                stroke: {
                    width: 3,
                    curve: 'smooth',
                },
                markers: {
                    size: 3,
                    strokeColors: currentTheme.value ? '#1E1E1E' : '#FFFFFF',
                    strokeWidth: 2,
                    hover: {
                        size: undefined,
                        sizeOffset: 2,
                    },
                },
                theme: {
                    mode: currentTheme.value ? 'dark' : 'light',
                },
                series: series,
            };

            // Create and render the chart
            chartInstance = new ApexCharts(jsonChart.value, chartOptions);
            chartInstance.render();
        }
    }

    function prepareSeries(): ChartSeries[] {
        if (!props.submodelElementData || !props.submodelElementData.value) {
            return [];
        }

        let chartData;
        try {
            chartData = JSON.parse(props.submodelElementData.value); // parse the value of the SubmodelElement
        } catch (error) {
            console.error('Failed to parse JSON data:', error);
            return [];
        }

        const seriesName = props.submodelElementData.idShort;
        let series: ChartSeries[] = [];

        try {
            // check if the value is an array or an object
            if (Array.isArray(chartData)) {
                // array in form of [y1, y2, y3, ..., yn ]
                series = [
                    {
                        name: seriesName,
                        data: chartData,
                    },
                ];
            } else if (typeof chartData === 'object' && chartData !== null) {
                // object in form of { title1: [y11, y12, y13, ..., y1n], title2: [y21, y22, y23, ..., y2n] }
                series = Object.keys(chartData).map((key) => {
                    if (!Array.isArray(chartData[key])) {
                        throw new Error(`Expected array data for key "${key}"`);
                    }
                    return {
                        name: key,
                        data: chartData[key],
                    };
                });
            } else {
                throw new Error('Invalid data format: expected array or object with array values');
            }
        } catch (error) {
            console.error('Failed to process chart data:', error);
            return [
                {
                    name: seriesName || 'Error',
                    data: [],
                },
            ];
        }

        return series;
    }

    function updateChartData(): void {
        if (chartInstance) {
            const series = prepareSeries();
            // Update series data
            chartInstance.updateSeries(series, true);
        }
    }
</script>
