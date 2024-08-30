<template>
    <v-container fluid class="pa-0">
        <!-- Options -->
        <!-- <v-list nav class="pa-0" style="margin-left: -8px; margin-top: -14px">
            <v-list-item class="pb-0">
                <template v-slot:title>
                    <div class="text-subtitle-2">{{ "Options: " }}</div>
                </template>
</v-list-item>
</v-list>
<v-row align="center">
    <v-col cols="auto">
        <v-text-field type="number" hide-details density="compact" v-model="numberOfCategories" @blur="initializeSeries()" @keydown.native.enter="initializeSeries()" label="Bins" variant="outlined"></v-text-field>
    </v-col>
    <v-col cols="auto">
        <v-switch hide-details label="stacked" v-model="stacked" density="compact" @change="changeVariant()"></v-switch>
    </v-col>
</v-row> -->
        <apexchart ref="gauge" height="350" :options="chartOptions" :series="chartSeries"></apexchart>
    </v-container>
</template>

<script lang="ts">
    import { defineComponent } from 'vue';
    import _ from 'lodash';
    import { useTheme } from 'vuetify';
    import DashboardHandling from '@/mixins/DashboardHandling';

    import { useNavigationStore } from '@/store/NavigationStore';

    export default defineComponent({
        name: 'Gauge',
        props: ['chartData', 'timeVariable', 'yVariables', 'chartOptionsExternal', 'editDialog'],
        mixins: [DashboardHandling],

        setup() {
            const theme = useTheme();
            const navigationStore = useNavigationStore();

            return {
                theme, // Theme Object
                navigationStore,
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

        computed: {
            // Check if the current Theme is dark
            isDark() {
                return this.theme.global.current.value.dark;
            },
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
