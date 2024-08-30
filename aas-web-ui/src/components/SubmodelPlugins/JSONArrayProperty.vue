<template>
    <v-container fluid class="pa-0">
        <v-card class="pa-3">
            <apexchart ref="areachart" type="area" height="350" :options="chartOptions" :series="chartData"></apexchart>
        </v-card>
    </v-container>
</template>

<script lang="ts">
    import { defineComponent, ref } from 'vue';
    import { useTheme } from 'vuetify';
    import { useAASStore } from '@/store/AASDataStore';

    export default defineComponent({
        name: 'JSONArrayProperty',
        props: ['submodelElementData'],

        setup() {
            const theme = useTheme();
            const aasStore = useAASStore();

            const chartData = ref([
                {
                    name: 'series1',
                    data: [],
                },
            ]);

            const chartOptions = ref({
                chart: {
                    id: 'chartMain',
                    type: 'area',
                    height: 350,
                    background: '#ffffff00',
                },
                // colors: ['#1e8567'],
                dataLabels: {
                    enabled: false,
                },
                stroke: {
                    curve: 'smooth',
                },
                markers: {
                    size: 0,
                },
                xaxis: {
                    type: 'numeric',
                    decimalsInFloat: 0,
                },
                yaxis: {
                    decimalsInFloat: 2,
                },
                theme: {
                    mode: 'dark',
                },
            });

            return {
                theme, // Theme Object
                aasStore, // AASStore Object
                chartData,
                chartOptions,
            };
        },

        data() {
            return {};
        },

        computed: {
            // get selected AAS from Store
            SelectedAAS() {
                return this.aasStore.getSelectedAAS;
            },

            // Get the selected Treeview Node (SubmodelElement) from the store
            SelectedNode() {
                return this.aasStore.getSelectedNode;
            },

            // Check if the current Theme is dark
            isDark() {
                return this.theme.global.current.value.dark;
            },
        },

        watch: {
            // watch for changes in the vuetify theme and update the chart options
            isDark() {
                this.applyTheme();
            },

            // watch for changes in the selected node and update the chart data
            submodelElementData() {
                // console.log('submodelElementData changed: ', this.submodelElementData);
                this.initChart();
            },
        },

        mounted() {
            this.$nextTick(() => {
                const chart = (this.$refs.areachart as any).chart;
                if (chart && this.submodelElementData && Object.keys(this.submodelElementData).length > 0) {
                    // console.log('Chart has rendered')
                    // apply the theme on component mount
                    this.applyTheme();
                    // append the series to the chart
                    this.initChart();
                }
            });
        },

        methods: {
            initChart() {
                // Check if a Node is selected
                if (Object.keys(this.submodelElementData).length == 0) {
                    return;
                }
                let chartData = JSON.parse(this.submodelElementData.value); // parse the value of the SubmodelElement
                let seriesName = this.submodelElementData.idShort; // get the idShort of the SubmodelElement
                // check if the value is an array or an object
                if (Array.isArray(chartData)) {
                    // array in form of [y1, y2, y3, ..., yn ]
                    // set/update the chart data
                    (this.$refs.areachart as any).updateSeries([
                        {
                            name: seriesName,
                            data: chartData,
                        },
                    ]);
                } else if (typeof chartData === 'object') {
                    // object in form of { title1: [y11, y12, y13, ..., y1n], title2: [y21, y22, y23, ..., y2n] }
                    // set/update the chart data
                    (this.$refs.areachart as any).updateSeries(
                        Object.keys(chartData).map((key) => {
                            return {
                                name: key,
                                data: chartData[key],
                            };
                        })
                    );
                }
            },

            // Function to apply the selected theme to the chart
            applyTheme() {
                if (this.isDark) {
                    (this.$refs.areachart as any).updateOptions({
                        theme: {
                            mode: 'dark',
                        },
                    });
                } else {
                    (this.$refs.areachart as any).updateOptions({
                        theme: {
                            mode: 'light',
                        },
                    });
                }
            },
        },
    });
</script>
