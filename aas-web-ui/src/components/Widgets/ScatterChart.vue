<template>
    <v-container fluid class="pa-0">
        <!-- Options -->
        <v-list v-if="!hideSettings || editDialog" nav class="pa-0" style="margin-left: -8px; margin-top: -14px">
            <v-list-item class="pb-0">
                <template #title>
                    <div class="text-subtitle-2">{{ 'Options: ' }}</div>
                </template>
            </v-list-item>
        </v-list>
        <v-row v-if="!hideSettings || editDialog" align="center">
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
        </v-row>
        <apexchart
            ref="scatterchart"
            type="scatter"
            height="350"
            :options="chartOptions"
            :series="chartSeries"></apexchart>
    </v-container>
</template>

// TODO Transfer to composition API
<script lang="ts">
    import _ from 'lodash';
    import { defineComponent } from 'vue';
    import { useRoute } from 'vue-router';
    import { useTheme } from 'vuetify';
    import { useChartHandling } from '@/composables/ChartHandling';
    import DashboardHandling from '@/mixins/DashboardHandling';

    export default defineComponent({
        name: 'AreaChart',
        mixins: [DashboardHandling],
        props: ['chartData', 'timeVariable', 'yVariables', 'chartOptionsExternal', 'editDialog'],

        setup() {
            const theme = useTheme();
            const route = useRoute();

            const { prepareSeriesValues, prepareYValueTooltip, prepareLegend } = useChartHandling();

            return {
                theme, // Theme Object
                route, // Route Object
                prepareSeriesValues,
                prepareYValueTooltip,
                prepareLegend,
            };
        },

        data() {
            return {
                chartSeries: [] as Array<any>,
                chartOptions: {
                    chart: {
                        id: 'scatter',
                        type: 'scatter',
                        height: 350,
                        background: '#ffffff00',
                    },
                    legend: {
                        show: true,
                        showForSingleSeries: true,
                    },
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
                    markers: {
                        size: 4,
                        strokeColors: '#ffffff',
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
                    },
                    theme: {
                        mode: 'dark',
                    },
                } as any,
                localChartOptions: {} as any,
                range: 60000,
            };
        },

        computed: {
            // Check if the current Theme is dark
            isDark() {
                return this.theme.global.current.value.dark;
            },
        },

        watch: {
            // appendData to the chart if the submodelElementData changed
            chartData: {
                handler() {
                    this.initializeSeries();
                },
                deep: true,
            },

            // apply the chart-theme if the theme changed
            isDark() {
                this.applyTheme();
            },
        },

        mounted() {
            this.$nextTick(() => {
                const chart = (this.$refs.scatterchart as any).chart;
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
                // console.log('initializeSeries: ', this.chartData, this.timeVariable, this.yVariables);
                // Prepare new series values
                let newSeries = this.prepareSeriesValues(this.chartData, this.yVariables);
                // prepare the tooltip for the y-axis
                let tooltip_y = this.prepareYValueTooltip(this.chartData, this.yVariables);
                // prepare the legend for the series
                let legend = this.prepareLegend(this.yVariables);
                // console.log('newSeries: ', newSeries);
                // update the series
                (this.$refs.scatterchart as any).updateSeries(newSeries);
                // initialize the chartOptions in the Dashboard
                if (this.hideSettings) {
                    (this.$refs.scatterchart as any).updateOptions(this.chartOptionsExternal);
                    this.localChartOptions = { ...this.chartOptionsExternal };
                    let completeOptions = _.merge({}, this.chartOptions, this.chartOptionsExternal);
                    this.range = completeOptions.xaxis.range;
                }
                // console.log('tooltip y: ', tooltip_y);
                // update the tooltip
                (this.$refs.scatterchart as any).updateOptions({
                    tooltip: {
                        y: tooltip_y,
                    },
                    legend: legend,
                });
                // emit the chartOptions to the parent component
                this.$emit('chartOptions', this.localChartOptions);
            },

            changeRange() {
                let range = Number(this.range);
                if (!range) {
                    this.range = 60000;
                    return;
                }
                if (range <= 0) {
                    return;
                }
                let newOptions = {
                    xaxis: {
                        range: this.range,
                    },
                };
                // update the chart options
                (this.$refs.scatterchart as any).updateOptions(newOptions);
                // create a complete chartOptions object
                let completeOptions = _.merge({}, this.localChartOptions, newOptions);
                // emit the chartOptions to the parent component
                this.$emit('chartOptions', completeOptions);
                // update the local chartOptions
                this.localChartOptions = completeOptions;
            },

            // Function to apply the selected theme to the chart
            applyTheme() {
                if (this.isDark) {
                    // apply the dark theme to the chart options
                    (this.$refs.scatterchart as any).updateOptions({
                        theme: {
                            mode: 'dark',
                        },
                        markers: {
                            strokeColors: '#1E1E1E',
                        },
                    });
                } else {
                    // apply the light theme to the chart options
                    (this.$refs.scatterchart as any).updateOptions({
                        theme: {
                            mode: 'light',
                        },
                        markers: {
                            strokeColors: '#ffffff',
                        },
                    });
                }
            },
        },
    });
</script>
