<template>
    <v-container fluid class="pa-0">
        <!-- Options -->
        <v-list nav class="pa-0" style="margin-left: -8px; margin-top: -14px" v-if="!hideSettings || editDialog">
            <v-list-item class="pb-0">
                <template v-slot:title>
                    <div class="text-subtitle-2">{{ 'Options: ' }}</div>
                </template>
            </v-list-item>
        </v-list>
        <v-row align="center" v-if="!hideSettings || editDialog">
            <v-col cols="auto">
                <v-text-field
                    type="number"
                    hide-details
                    density="compact"
                    v-model="range"
                    label="Range"
                    variant="outlined"
                    suffix="ms"
                    @blur="changeRange()"
                    @keydown.native.enter="changeRange()"></v-text-field>
            </v-col>
            <v-col cols="auto">
                <v-select
                    hide-details
                    density="compact"
                    :items="interpolationOptions"
                    v-model="interpolation"
                    label="Interpolation"
                    variant="outlined"
                    @update:model-value="changeInterpolation()"></v-select>
            </v-col>
        </v-row>
        <apexchart ref="linechart" type="line" height="350" :options="chartOptions" :series="chartSeries"></apexchart>
    </v-container>
</template>

<script lang="ts">
    import { defineComponent } from 'vue';
    import _ from 'lodash';
    import { useTheme } from 'vuetify';
    import WidgetHandling from '@/mixins/WidgetHandling';
    import DashboardHandling from '@/mixins/DashboardHandling';

    export default defineComponent({
        name: 'LineChart',
        props: ['chartData', 'timeVariable', 'yVariables', 'chartOptionsExternal', 'editDialog'],
        mixins: [WidgetHandling, DashboardHandling],

        setup() {
            const theme = useTheme();

            return {
                theme, // Theme Object
            };
        },

        data() {
            return {
                chartSeries: [
                    {
                        name: 'Value',
                        data: [],
                    },
                ] as Array<any>,
                chartOptions: {
                    chart: {
                        id: 'line',
                        type: 'line',
                        height: 350,
                        background: '#ffffff00',
                    },
                    xaxis: {
                        type: 'datetime',
                        range: 60000,
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
                                show: true,
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

        computed: {
            // Check if the current Theme is dark
            isDark() {
                return this.theme.global.current.value.dark;
            },
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
