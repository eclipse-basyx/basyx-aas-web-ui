import { defineComponent } from 'vue';

import { useNavigationStore } from '@/store/NavigationStore';
import { useAASStore } from '@/store/AASDataStore';

import RequestHandling from '@/mixins/RequestHandling';
import SubmodelElementHandling from '@/mixins/SubmodelElementHandling';

export default defineComponent({
    name: 'WidgetHandling',
    mixins: [RequestHandling, SubmodelElementHandling],

    setup() {
        const navigationStore = useNavigationStore();
        const aasStore = useAASStore();

        return {
            navigationStore, // NavigationStore Object
            aasStore, // AASStore Object
        };
    },

    data() {
        return {};
    },

    computed: {},

    methods: {
        prepareSeriesValues(chartData: any, yVariables: any) {
            let newSeries = chartData.map((series: any, index: number) => {
                let chartValues = series.map((element: any) => ({
                    x: new Date(element.time),
                    y: Number(element.value).toFixed(2),
                }));
                let name = 'Value ' + Number(index + 1);
                // check if the yVariable exists
                if (yVariables.length > index) {
                    // check if the yVariable has an idShort
                    if (yVariables[index] && yVariables[index].idShort) {
                        name = yVariables[index].idShort;
                    }
                }
                return {
                    name: name,
                    data: chartValues,
                };
            });
            return newSeries;
        },

        prepareYValueTooltip(chartData: any, yVariables: any) {
            return chartData.map((series: any, index: number) => {
                // Use optional chaining and nullish coalescing to simplify the retrieval of the unit
                let unit = '';
                if (yVariables[index]) {
                    unit = this.unitSuffix(yVariables[index]);
                }
                return {
                    formatter: (value: any) => `${value} ${unit}`,
                };
            });
        },

        prepareLegend(yVariables: any) {
            return {
                formatter: (seriesName: any, opts: any) => {
                    let unit = '';
                    const index = opts.seriesIndex;

                    // check if the yVariable exists
                    if (yVariables.length > index) {
                        // check if the yVariable has an unit (embeddedDataSpecification) -> take the first one (TODO: make this more generic in the future)
                        if (yVariables[index]) {
                            unit = '[' + this.unitSuffix(yVariables[index]) + ']';
                        }
                    }
                    return seriesName + ' ' + unit;
                },
            };
        },

        prepareHistogramData(chartData: any, numberOfCategories: any) {
            let bins = Number(numberOfCategories);
            // Flatten the array and sort values
            let allValues = chartData.flat().map((item: any) => Number(item.value));
            allValues.sort((a: any, b: any) => a - b);

            // Determine range and interval
            const minValue = allValues[0];
            const maxValue = allValues[allValues.length - 1];
            const range = maxValue - minValue;
            const interval = range / bins;

            // Create bins for histogram for each series
            let histograms = chartData.map((series: any) => {
                let histogram = new Array(bins).fill(0);
                series.forEach((item: any) => {
                    let value = Number(item.value);
                    let index = Math.min(Math.floor((value - minValue) / interval), bins - 1);
                    histogram[index]++;
                });
                return histogram;
            });

            // Prepare categories array
            let categories = new Array(bins);
            for (let i = 0; i < bins; i++) {
                let rangeStart = minValue + i * interval;
                let rangeEnd = rangeStart + interval;
                categories[i] = `${rangeStart.toFixed(2)} - ${rangeEnd.toFixed(2)}`;
            }

            return { histograms, categories };
        },
    },
});
