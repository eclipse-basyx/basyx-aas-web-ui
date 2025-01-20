<template>
    <v-container fluid class="pa-0">
        <apexchart
            ref="radialchart"
            type="radialBar"
            height="420"
            :options="chartOptions"
            :series="chartSeries"></apexchart>
    </v-container>
</template>

// TODO Transfer to composition API
<script lang="ts">
    import { defineComponent } from 'vue';
    import { useTheme } from 'vuetify';

    export default defineComponent({
        name: 'RadialChart',
        props: ['submodelElementData', 'widgetSettings'],

        setup() {
            const theme = useTheme();

            return {
                theme, // Theme Object
            };
        },

        data() {
            return {
                chartSeries: [] as Array<any>,
                chartOptions: {
                    chart: {
                        type: 'radialBar',
                    },
                    plotOptions: {
                        radialBar: {
                            startAngle: -135,
                            endAngle: 135,
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
                                },
                            },
                        },
                    },
                    fill: {
                        type: 'gradient',
                        gradient: {
                            shade: 'dark',
                            shadeIntensity: 0.15,
                            inverseColors: false,
                            opacityFrom: 1,
                            opacityTo: 1,
                            stops: [0, 50, 65, 91],
                        },
                    },
                    // stroke: {
                    //     dashArray: 4
                    // },
                } as any,
            };
        },

        computed: {
            // Check if the current Theme is dark
            isDark() {
                return this.theme.global.current.value.dark;
            },
        },

        watch: {
            submodelElementData: {
                handler() {
                    this.updateView();
                },
                deep: true,
            },

            isDark() {
                this.applyTheme();
            },
        },

        mounted() {
            this.$nextTick(() => {
                const chart = (this.$refs.radialchart as any).chart;
                if (chart && this.submodelElementData && Object.keys(this.submodelElementData).length > 0) {
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
                let targetValue = 0;
                let actualValue = 0;
                let actualValueDisplayName = '';
                // determine the target and actual value
                this.submodelElementData.value.forEach((element: any) => {
                    if (this.widgetSettings.targetValue == element.idShort) {
                        targetValue = element.value;
                    }
                    if (this.widgetSettings.actualValue == element.idShort) {
                        actualValue = element.value;
                        actualValueDisplayName =
                            this.widgetSettings.chartNamesUnits[0].name +
                            ' [' +
                            this.widgetSettings.chartNamesUnits[0].unit +
                            ']';
                    }
                });
                // Add the idShort as label
                (this.$refs.radialchart as any).updateOptions({
                    labels: [actualValueDisplayName],
                });
                // Append the series to the chart
                (this.$refs.radialchart as any).appendSeries([((actualValue / targetValue) * 100).toFixed(0)]);
            },

            // Function to update the chart (by updating the series)
            updateView() {
                // console.log("Widget Settings:", this.widgetSettings);
                if (!this.submodelElementData || Object.keys(this.submodelElementData).length === 0) {
                    return;
                }
                let targetValue = 0;
                let actualValue = 0;
                // determine the target and actual value
                this.submodelElementData.value.forEach((element: any) => {
                    if (this.widgetSettings.targetValue == element.idShort) {
                        targetValue = element.value;
                    }
                    if (this.widgetSettings.actualValue == element.idShort) {
                        actualValue = element.value;
                    }
                });
                // Update the series
                (this.$refs.radialchart as any).updateSeries([((actualValue / targetValue) * 100).toFixed(0)]);
            },

            // Function to apply the selected theme to the chart
            applyTheme() {
                if (this.isDark) {
                    // apply the dark theme to the chart options
                    (this.$refs.radialchart as any).updateOptions({
                        theme: {
                            mode: 'dark',
                        },
                    });
                } else {
                    // apply the light theme to the chart options
                    (this.$refs.radialchart as any).updateOptions({
                        theme: {
                            mode: 'light',
                        },
                    });
                }
            },
        },
    });
</script>
