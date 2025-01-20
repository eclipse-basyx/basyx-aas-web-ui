<template>
    <v-container fluid class="pa-0">
        <apexchart ref="columnchart" height="350" :options="chartOptions" :series="chartSeries"></apexchart>
    </v-container>
</template>

// TODO Transfer to composition API
<script lang="ts">
    import { defineComponent } from 'vue';
    import { useTheme } from 'vuetify';

    export default defineComponent({
        name: 'ColumnChart',
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
                        type: 'bar',
                    },
                    plotOptions: {
                        bar: {
                            borderRadius: 4,
                            horizontal: false,
                            columnWidth: '55%',
                            endingShape: 'rounded',
                            distributed: true,
                            dataLabels: {
                                position: 'top',
                            },
                        },
                    },
                    grid: {
                        xaxis: {
                            lines: {
                                show: false,
                            },
                        },
                    },
                    legend: {
                        show: false,
                    },
                    dataLabels: {
                        enabled: true,
                        label: null,
                    },
                    stroke: {
                        show: true,
                        width: 2,
                        colors: ['transparent'],
                    },
                    xaxis: {
                        categories: [],
                    },
                    fill: {
                        opacity: 1,
                    },
                    style: {
                        fontSize: '12px',
                        colors: ['#304758'],
                    },
                    tooltip: {
                        enabled: true,
                    },
                    yaxis: {
                        axisBorder: {
                            show: false,
                        },
                    },
                    labels: {
                        show: false,
                    },
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
                const chart = (this.$refs.columnchart as any).chart;
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
                // check if the submodelElementData is a collection or a property
                if (this.widgetSettings.idShorts && this.widgetSettings.idShorts.length > 0) {
                    // Collection
                    // Filter submodelElementData by idShorts from widgetSettings
                    let collectionValues = [] as Array<any>;
                    this.widgetSettings.idShorts.forEach((element: any) => {
                        this.submodelElementData.value.forEach((el: any) => {
                            if (element == el.idShort) {
                                collectionValues.push(el);
                            }
                        });
                    });
                    // console.log('collectionValues: ', collectionValues);
                    let chartValues = [] as Array<any>;
                    let categories = [] as Array<any>;
                    collectionValues.forEach((element: any, index: number) => {
                        // push the value to the chartValues Array
                        chartValues.push(element.value);
                        // push the idShort to the xaxis categories
                        categories.push(
                            this.widgetSettings.chartNamesUnits[index].name +
                                ' [' +
                                this.widgetSettings.chartNamesUnits[index].unit +
                                ']'
                        );
                    });
                    let chartSeries = {
                        name: this.widgetSettings.widgetTitle,
                        data: chartValues,
                    } as any;
                    // Append the series to the chart
                    (this.$refs.columnchart as any).appendSeries(chartSeries);
                    // Update the chartOptions
                    let chartOptions = {
                        xaxis: {
                            categories: categories,
                        },
                        dataLables: {
                            label: chartValues,
                        },
                    } as any;
                    (this.$refs.columnchart as any).updateOptions(chartOptions);
                } else {
                    // Property
                    // Add the idShort as xaxis category and the value as dataLabel
                    (this.$refs.columnchart as any).updateOptions({
                        xaxis: {
                            categories: [
                                this.widgetSettings.chartNamesUnits[0].name +
                                    ' [' +
                                    this.widgetSettings.chartNamesUnits[0].unit +
                                    ']',
                            ],
                        },
                        dataLables: {
                            label: this.submodelElementData.value,
                        },
                    });
                    // Append the series to the chart
                    (this.$refs.columnchart as any).appendSeries({
                        name:
                            this.submodelElementData.idShort + ' [' + this.widgetSettings.chartNamesUnits[0].unit + ']',
                        data: [this.submodelElementData.value],
                    });
                }
            },

            // Function to update the chart (by updating the series)
            updateView() {
                if (!this.submodelElementData || Object.keys(this.submodelElementData).length === 0) {
                    return;
                }
                // check if the submodelElementData is a collection or a property
                if (this.widgetSettings.idShorts && this.widgetSettings.idShorts.length > 0) {
                    // Collection
                    // Filter submodelElementData by idShorts from widgetSettings
                    let collectionValues = [] as Array<any>;
                    this.widgetSettings.idShorts.forEach((element: any) => {
                        this.submodelElementData.value.forEach((el: any) => {
                            if (element == el.idShort) {
                                collectionValues.push(el);
                            }
                        });
                    });
                    // console.log('collectionValues: ', collectionValues);
                    let chartValues = [] as Array<any>;
                    collectionValues.forEach((element: any) => {
                        // push the value to the chartValues Array
                        chartValues.push(element.value);
                    });
                    let chartSeries = {
                        data: chartValues,
                    } as any;
                    // Update the series for the chart
                    (this.$refs.columnchart as any).updateSeries([chartSeries]);
                } else {
                    // console.log("Property:", this.submodelElementData);
                    (this.$refs.columnchart as any).updateSeries([
                        {
                            data: [this.submodelElementData.value],
                        },
                    ]);
                }
            },

            // Function to apply the selected theme to the chart
            applyTheme() {
                if (this.isDark) {
                    // apply the dark theme to the chart options
                    (this.$refs.columnchart as any).updateOptions({
                        theme: {
                            mode: 'dark',
                        },
                    });
                } else {
                    // apply the light theme to the chart options
                    (this.$refs.columnchart as any).updateOptions({
                        theme: {
                            mode: 'light',
                        },
                    });
                }
            },
        },
    });
</script>
