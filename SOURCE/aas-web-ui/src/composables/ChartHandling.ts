import { useConceptDescriptionHandling } from '@/composables/AAS/ConceptDescriptionHandling';
import { useReferableUtils } from '@/composables/AAS/ReferableUtils';

export function useChartHandling() {
    const { unitSuffix } = useConceptDescriptionHandling();
    const { nameToDisplay } = useReferableUtils();

    function prepareSeriesValues(chartData: any, yVariables: any) {
        const newSeries = chartData.map((series: any, index: number) => {
            const chartValues = series.map((element: any) => ({
                x: new Date(element.time),
                y: Number(element.value).toFixed(2),
            }));
            let name = 'Value ' + Number(index + 1);
            // check if the yVariable exists
            if (yVariables.length > index) {
                name = nameToDisplay(yVariables[index]);
            }
            return {
                name: name,
                data: chartValues,
            };
        });
        return newSeries;
    }

    function prepareYValueTooltip(chartData: any, yVariables: any) {
        return chartData.map(async (_series: any, index: number) => {
            // Use optional chaining and nullish coalescing to simplify the retrieval of the unit
            let unit = '';
            if (yVariables[index]) {
                unit = unitSuffix(yVariables[index]);
            }
            return {
                formatter: (value: any) => `${value} ${unit}`,
            };
        });
    }

    function prepareLegend(yVariables: any) {
        return {
            formatter: (seriesName: any, opts: any) => {
                let unit = '';
                const index = opts.seriesIndex;

                // check if the yVariable exists
                if (yVariables.length > index) {
                    // check if the yVariable has an unit (embeddedDataSpecification) -> take the first one (TODO: make this more generic in the future)
                    if (yVariables[index]) {
                        unit = '[' + unitSuffix(yVariables[index]) + ']';
                    }
                }
                return seriesName + ' ' + unit;
            },
        };
    }

    function prepareHistogramData(chartData: any, numberOfCategories: any) {
        const bins = Number(numberOfCategories);
        // Flatten the array and sort values
        const allValues = chartData.flat().map((item: any) => Number(item.value));
        allValues.sort((a: any, b: any) => a - b);

        // Determine range and interval
        const minValue = allValues[0];
        const maxValue = allValues[allValues.length - 1];
        const range = maxValue - minValue;
        const interval = range / bins;

        // Create bins for histogram for each series
        const histograms = chartData.map((series: any) => {
            const histogram = new Array(bins).fill(0);
            series.forEach((item: any) => {
                const value = Number(item.value);
                const index = Math.min(Math.floor((value - minValue) / interval), bins - 1);
                histogram[index]++;
            });
            return histogram;
        });

        // Prepare categories array
        const categories = new Array(bins);
        for (let i = 0; i < bins; i++) {
            const rangeStart = minValue + i * interval;
            const rangeEnd = rangeStart + interval;
            categories[i] = `${rangeStart.toFixed(2)} - ${rangeEnd.toFixed(2)}`;
        }

        return { histograms, categories };
    }

    return {
        prepareSeriesValues,
        prepareYValueTooltip,
        prepareLegend,
        prepareHistogramData,
    };
}
