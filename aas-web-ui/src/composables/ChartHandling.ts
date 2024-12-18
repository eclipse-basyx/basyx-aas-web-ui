import { useConceptDescriptionHandling } from '@/composables/ConceptDescriptionHandling';

export function useChartHandling() {
    const { unitSuffix } = useConceptDescriptionHandling();

    function prepareYValueTooltip(chartData: any, yVariables: any) {
        return chartData.map((_series: any, index: number) => {
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

    return {
        prepareYValueTooltip,
        prepareLegend,
    };
}
