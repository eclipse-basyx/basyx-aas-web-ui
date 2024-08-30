<template>
    <v-container fluid class="pa-0">
        <apexchart type="donut" ref="donutchart" height="420" :options="chartOptions" :series="chartSeries"></apexchart>
    </v-container>
</template>

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
                        type: 'donut',
                    },
                    plotOptions: {
                        pie: {
                            startAngle: -135,
                            endAngle: 135,
                            offsetY: 10,
                        },
                    },
                    title: {
                        text: '',
                        align: 'center',
                    },
                    stroke: {
                        show: false,
                    },
                    labels: [],
                    legend: {
                        position: 'bottom',
                    },
                } as any,
            };
        },

        mounted() {
            this.$nextTick(() => {
                const chart = (this.$refs.donutchart as any).chart;
                if (chart && this.submodelElementData && Object.keys(this.submodelElementData).length > 0) {
                    // console.log('Chart has rendered')
                    // apply the theme on component mount
                    this.applyTheme();
                    // append the series to the chart
                    this.initializeSeries();
                }
            });
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

        computed: {
            // Check if the current Theme is dark
            isDark() {
                return this.theme.global.current.value.dark;
            },
        },

        methods: {
            // Function to initialize the chart (by appending the series)
            initializeSeries() {
                let targetValue = 0;
                let actualValue = 0;
                let valueDisplayNames = [] as any;
                let maxValue = 0;
                let series = [] as any;
                // determine the target and actual value
                this.submodelElementData.value.forEach((element: any, i: number) => {
                    // Actual Value
                    if (this.widgetSettings.actualValue == element.idShort) {
                        actualValue = element.value;
                        valueDisplayNames[0] = element.idShort;
                    }
                    // Target Value
                    if (this.widgetSettings.targetValue == element.idShort) {
                        targetValue = element.value;
                        valueDisplayNames[1] = element.idShort;
                    }
                    // Max Value
                    if (this.widgetSettings.maxValue == element.idShort) {
                        maxValue = element.value;
                        valueDisplayNames[2] = element.idShort;
                    }
                });
                let displayActualValue = (actualValue / maxValue) * 100;
                series.push(parseFloat(displayActualValue.toFixed(2)));
                let displayTargetValue = (targetValue / maxValue) * 100 - displayActualValue;
                series.push(parseFloat(displayTargetValue.toFixed(2)));
                let displayMaxValue = 100 - (displayActualValue + displayTargetValue);
                series.push(parseFloat(displayMaxValue.toFixed(2)));
                // console.log('Donut Chart: ', series, valueDisplayNames);

                // Add the idShort as label
                (this.$refs.donutchart as any).updateOptions({
                    labels: valueDisplayNames,
                    title: {
                        text:
                            this.widgetSettings.chartNamesUnits[0].name +
                            ' [' +
                            this.widgetSettings.chartNamesUnits[0].unit +
                            ']',
                    },
                });
                // Append the series to the chart
                (this.$refs.donutchart as any).updateSeries(series);
            },

            // Function to update the chart (by updating the series)
            updateView() {
                // console.log("Widget Settings:", this.widgetSettings);
                if (!this.submodelElementData || Object.keys(this.submodelElementData).length === 0) {
                    return;
                }
                let targetValue = 0;
                let actualValue = 0;
                let maxValue = 0;
                let series = [] as any;
                // determine the target and actual value

                this.submodelElementData.value.forEach((element: any) => {
                    if (this.widgetSettings.targetValue == element.idShort) {
                        targetValue = element.value;
                    }
                    if (this.widgetSettings.actualValue == element.idShort) {
                        actualValue = element.value;
                    }
                    if (this.widgetSettings.maxValue == element.idShort) {
                        maxValue = element.value;
                    }
                });
                let displayActualValue = (actualValue / maxValue) * 100;
                series.push(parseFloat(displayActualValue.toFixed(2)));
                let displayTargetValue = (targetValue / maxValue) * 100 - displayActualValue;
                series.push(parseFloat(displayTargetValue.toFixed(2)));
                let displayMaxValue = 100 - (displayActualValue + displayTargetValue);
                series.push(parseFloat(displayMaxValue.toFixed(2)));
                // console.log(series);

                (this.$refs.donutchart as any).updateSeries(series);
            },

            // Function to apply the selected theme to the chart
            applyTheme() {
                if (this.isDark) {
                    // apply the dark theme to the chart options
                    (this.$refs.donutchart as any).updateOptions({
                        theme: {
                            mode: 'dark',
                        },
                    });
                } else {
                    // apply the light theme to the chart options
                    (this.$refs.donutchart as any).updateOptions({
                        theme: {
                            mode: 'light',
                        },
                    });
                }
            },
        },
    });
</script>
