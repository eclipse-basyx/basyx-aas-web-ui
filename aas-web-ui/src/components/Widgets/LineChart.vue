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
        <apexchart ref="linechart" type="line" height="350" :options="chartOptions" :series="chartSeries"></apexchart>
    </v-container>
</template>

<script lang="ts">
    import _ from 'lodash';
    import { defineComponent } from 'vue';
    import { useRoute } from 'vue-router';
    import { useTheme } from 'vuetify';
    import DashboardHandling from '@/mixins/DashboardHandling';
    import WidgetHandling from '@/mixins/WidgetHandling';

    export default defineComponent({
        name: 'LineChart',
        mixins: [WidgetHandling, DashboardHandling],
        props: ['chartData', 'timeVariable', 'yVariables', 'chartOptionsExternal', 'editDialog'],

        setup() {
            const theme = useTheme();
            const route = useRoute();

            return {
                theme, // Theme Object
                route, // Route Object
            };
        },

        data() {
            return {
                chartSeries: [] as Array<any>,
                chartOptions: {
                    chart: {
                        id: 'line',
                        type: 'line',
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
                    },
                    theme: {
                        mode: 'dark',
                    },
                } as any,
                localChartOptions: {} as any,
                range: 60000,
                interpolationOptions: ['smooth', 'straight', 'stepline'],
                interpolation: 'smooth',
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
                const chart = (this.$refs.linechart as any).chart;
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
                console.log('newSeries: ', newSeries);
                // prepare the tooltip for the y-axis
                let tooltip_y = this.prepareYValueTooltip(this.chartData, this.yVariables);
                // prepare the legend for the series
                let legend = this.prepareLegend(this.yVariables);
                // console.log('newSeries: ', newSeries);
                // update the series
                (this.$refs.linechart as any).updateSeries(newSeries);
                // initialize the chartOptions in the Dashboard
                if (this.hideSettings) {
                    (this.$refs.linechart as any).updateOptions(this.chartOptionsExternal);
                    this.localChartOptions = { ...this.chartOptionsExternal };
                    let completeOptions = _.merge({}, this.chartOptions, this.chartOptionsExternal);
                    this.range = completeOptions.xaxis.range;
                    this.interpolation = completeOptions.stroke.curve;
                }
                // console.log('tooltip y: ', tooltip_y);
                // update the tooltip
                (this.$refs.linechart as any).updateOptions({
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
                        range: range,
                    },
                };
                // update the chart options
                (this.$refs.linechart as any).updateOptions(newOptions);
                // create a complete chartOptions object
                let completeOptions = _.merge({}, this.localChartOptions, newOptions);
                // emit the chartOptions to the parent component
                this.$emit('chartOptions', completeOptions);
                // update the local chartOptions
                this.localChartOptions = completeOptions;
            },

            changeInterpolation() {
                let newOptions = {
                    stroke: {
                        curve: this.interpolation,
                    },
                };
                // update the chart options
                (this.$refs.linechart as any).updateOptions(newOptions);
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
                    (this.$refs.linechart as any).updateOptions({
                        theme: {
                            mode: 'dark',
                        },
                    });
                } else {
                    // apply the light theme to the chart options
                    (this.$refs.linechart as any).updateOptions({
                        theme: {
                            mode: 'light',
                        },
                    });
                }
            },
        },
    });
</script>
