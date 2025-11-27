<template>
    <v-container fluid class="pa-0">
        <div class="chart-container">
            <div ref="pieChart"></div>
        </div>
    </v-container>
</template>

<script lang="ts" setup>
    import ApexCharts from 'apexcharts';
    import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
    import { useTheme } from 'vuetify';

    const props = defineProps<{
        chartData: Array<{ label: string; value: number }>;
        chartTitle?: string;
    }>();

    const theme = useTheme();

    const pieChart = ref<HTMLElement | null>(null);
    let chartInstance: ApexCharts | null = null;

    // Computed properties
    const currentTheme = computed(() => {
        return theme.global.current.value.dark;
    });

    onMounted(async () => {
        await nextTick(); // Ensure the DOM is updated
        if (pieChart.value) {
            renderChart();
        } else {
            console.error('PieChart element is not available.');
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
                        dataLabels: {
                            style: {
                                colors: [newVal ? '#000000' : '#ffffff'],
                            },
                        },
                        stroke: {
                            colors: [newVal ? '#212121' : '#ffffff'],
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
        if (!props.chartData || props.chartData.length === 0) {
            console.warn('No chart data available to render.');
            return;
        }

        if (pieChart.value) {
            const series = props.chartData.map((item) => item.value);
            const labels = props.chartData.map((item) => item.label);

            const chartOptions = {
                chart: {
                    id: 'pie',
                    type: 'pie',
                    height: 400,
                    background: '#ffffff00',
                },
                series: series,
                labels: labels,
                legend: {
                    position: 'bottom',
                    horizontalAlign: 'center',
                    markers: {
                        strokeWidth: 0,
                    },
                },
                dataLabels: {
                    enabled: true,
                    formatter: function (val: number) {
                        return val.toFixed(1) + '%';
                    },
                    style: {
                        colors: [currentTheme.value ? '#000000' : '#ffffff'],
                    },
                },
                stroke: {
                    colors: [currentTheme.value ? '#212121' : '#ffffff'],
                },
                tooltip: {
                    custom: function ({ series, seriesIndex, w }: any) {
                        const label = w.globals.labels[seriesIndex];
                        const value = series[seriesIndex];
                        return (
                            '<div style="background: #fff; color: #000; padding: 10px">' +
                            '<div style="color: #000; font-weight: 600; margin-bottom: 4px;">' +
                            label +
                            '</div>' +
                            '<div style="color: #000;">' +
                            value.toFixed(2) +
                            ' CO₂eq</div>' +
                            '</div>'
                        );
                    },
                },
                theme: {
                    mode: currentTheme.value ? 'dark' : 'light',
                },
            };

            // Create and render the chart
            chartInstance = new ApexCharts(pieChart.value, chartOptions);
            chartInstance.render();
        }
    }

    function updateChartData(): void {
        if (chartInstance && props.chartData && props.chartData.length > 0) {
            const series = props.chartData.map((item) => item.value);
            const labels = props.chartData.map((item) => item.label);

            // Update series and labels
            chartInstance.updateOptions({
                series: series,
                labels: labels,
            });
        }
    }
</script>

<style scoped>
    .chart-container {
        width: 100%;
        height: 100%;
    }
</style>
