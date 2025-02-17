<template>
    <v-container fluid class="pa-0">
        <apexchart ref="gauge" height="350" :options="chartOptions" :series="chartSeries"></apexchart>
    </v-container>
</template>

// TODO Transfer to composition API
<script lang="ts">
    import { defineComponent } from 'vue';
    import { useRoute } from 'vue-router';
    import { useTheme } from 'vuetify';
    import { useNavigationStore } from '@/store/NavigationStore';

    export default defineComponent({
        name: 'Gauge',
        props: ['chartData', 'timeVariable', 'yVariables', 'chartOptionsExternal', 'editDialog'],

        setup() {
            const theme = useTheme();
            const navigationStore = useNavigationStore();
            const route = useRoute();

            return {
                theme, // Theme Object
                navigationStore,
                route, // Route Object
            };
        },

        data() {
            return {
                chartSeries: [] as Array<any>,
                chartOptions: {
                    chart: {
                        id: 'histogram',
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
                                        return val;
                                    },
                                },
                            },
                        },
                    },
                    theme: {
                        mode: 'dark',
                    },
                } as any,
                localChartOptions: {} as any,
            };
        },

        computed: {
            // Check if the current Theme is dark
            isDark() {
                return this.theme.global.current.value.dark;
            },

            // check if plugin is in dashboard
            hideSettings() {
                if (this.route.name === 'DashboardGroup') {
                    return true;
                } else {
                    return false;
                }
            },
        },

        watch: {
            chartData: {
                handler() {
                    this.initializeSeries();
                },
                deep: true,
            },

            isDark() {
                this.applyTheme();
            },
        },

        mounted() {
            this.$nextTick(() => {
                const chart = (this.$refs.gauge as any).chart;
                if (chart) {
                    // console.log('Chart has rendered')
                    // apply the theme on component mount
                    this.applyTheme();
                    // append the series to the chart
                    this.initializeSeries();
                }
            });
        },

        methods: {
            // Function to initialize the chart (by appending the series)
            initializeSeries() {
                // console.log('initializeSeries: ', this.chartData);
                // extract the last object of each array in the chartData array
                let values = this.chartData.map((data: any) => {
                    return data[data.length - 1];
                });
                // extract the values from the objects
                let chartValues = values.map((element: any) => {
                    return Number(element.value).toFixed(2);
                });
                // determine the labels for each value
                let chartLabels = values.map((element: any, index: number) => {
                    let name = 'Value ' + Number(index + 1);
                    // check if the yVariable exists
                    if (this.yVariables.length > index) {
                        // check if the yVariable has an idShort
                        if (this.yVariables[index] && this.yVariables[index].idShort) {
                            name = this.yVariables[index].idShort;
                        }
                    }
                    return name;
                });
                // console.log('chartValues: ', chartValues);
                // update the series
                (this.$refs.gauge as any).updateSeries(chartValues);
                // initialize the chartOptions in the Dashboard
                if (this.hideSettings) {
                    (this.$refs.gauge as any).updateOptions(this.chartOptionsExternal);
                    this.localChartOptions = { ...this.chartOptionsExternal };
                }
                // update the labels
                (this.$refs.gauge as any).updateOptions({
                    labels: chartLabels,
                });
                // emit the chartOptions to the parent component
                this.$emit('chartOptions', this.localChartOptions);
            },

            // Function to apply the selected theme to the chart
            applyTheme() {
                if (this.isDark) {
                    // apply the dark theme to the chart options
                    (this.$refs.gauge as any).updateOptions({
                        theme: {
                            mode: 'dark',
                        },
                    });
                } else {
                    // apply the light theme to the chart options
                    (this.$refs.gauge as any).updateOptions({
                        theme: {
                            mode: 'light',
                        },
                    });
                }
            },
        },
    });
</script>
