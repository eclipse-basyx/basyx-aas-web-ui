<template>
    <v-container fluid class="pa-0">
        <div
            style="
                min-height: 350px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
            ">
            <div
                v-for="displayElement in localChartData"
                :key="displayElement.idShort"
                style="text-align: center"
                class="my-3">
                <v-card-subtitle>{{ displayElement.idShort + ': ' }}</v-card-subtitle>
                <v-card-title>
                    <span class="text-h5 text-primary">{{ formatValue(displayElement) }}</span>
                    <span class="ml-2 text-h5">{{ unitSuffix(displayElement) }}</span>
                </v-card-title>
            </div>
        </div>
    </v-container>
</template>

<script lang="ts">
    import { defineComponent } from 'vue';
    import SubmodelElementHandling from '@/mixins/SubmodelElementHandling';

    export default defineComponent({
        name: 'DisplayField',
        props: ['chartData', 'timeVariable', 'yVariables'],
        components: {
            SubmodelElementHandling,
        },
        mixins: [SubmodelElementHandling],

        data() {
            return {
                localChartData: [] as Array<any>,
            };
        },

        mounted() {
            this.initializeDisplay();
        },

        watch: {
            chartData: {
                handler() {
                    this.initializeDisplay();
                },
                deep: true,
            },
        },

        methods: {
            // Initialize the Component
            initializeDisplay() {
                // console.log('initializeDisplay: ', this.chartData, this.timeVariable, this.yVariables);
                // Reduce each time series to its last element and join with yVariables
                this.localChartData = this.chartData.map((timeSeries: any, index: number) => {
                    return { ...timeSeries[timeSeries.length - 1], ...this.yVariables[index] };
                });
                // console.log('localChartData: ', this.localChartData);
            },

            // Format the Value of the Property
            formatValue(prop: any) {
                if (
                    prop.valueType === 'xs:long' ||
                    prop.valueType === 'xs:double' ||
                    prop.valueType === 'xs:float' ||
                    prop.valueType === 'xs:decimal'
                ) {
                    return prop.value.toFixed(2);
                } else if (
                    prop.valueType === 'xs:int' ||
                    prop.valueType === 'xs:integer' ||
                    prop.valueType === 'xs:short' ||
                    prop.valueType === 'xs:byte' ||
                    prop.valueType === 'xs:nonNegativeInteger' ||
                    prop.valueType === 'xs:positiveInteger' ||
                    prop.valueType === 'xs:unsignedLong' ||
                    prop.valueType === 'xs:unsignedInt' ||
                    prop.valueType === 'xs:unsignedShort' ||
                    prop.valueType === 'xs:unsignedByte'
                ) {
                    return prop.value.toFixed(0);
                } else {
                    return prop.value;
                }
            },
        },
    });
</script>
