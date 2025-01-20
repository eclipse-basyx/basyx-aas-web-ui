<template>
    <v-container fluid class="pa-0">
        <v-row v-for="lampElement in inputElements" :key="lampElement.idShort" align="center" class="mt-1">
            <v-col cols="auto" class="pt-0 pb-2">
                <v-icon
                    v-if="getValue(lampElement)"
                    color="primary"
                    style="margin-top: 14px; margin-bottom: 14px"
                    size="x-large"
                    >{{ 'mdi-lightbulb-on' }}</v-icon
                >
                <v-icon v-else color="lamp" style="margin-top: 14px; margin-bottom: 14px" size="x-large">{{
                    'mdi-lightbulb-outline'
                }}</v-icon>
            </v-col>
            <v-col cols="auto" class="pl-0 pt-1">
                <div>{{ lampElement.name }}</div>
            </v-col>
        </v-row>
    </v-container>
</template>

// TODO Transfer to composition API
<script lang="ts">
    import { defineComponent } from 'vue';
    import RequestHandling from '@/mixins/RequestHandling';

    export default defineComponent({
        name: 'Lamp',
        mixins: [RequestHandling],

        props: ['submodelElementData', 'widgetSettings'],

        setup() {
            return {};
        },

        data() {
            return {
                inputElements: [] as Array<any>,
            };
        },

        computed: {},

        watch: {
            // Watch for changes in the submodelElementData and (re-)initialize the Component
            submodelElementData: {
                deep: true,
                handler() {
                    this.initializeView(); // initialize switch
                },
            },
        },

        mounted() {
            this.initializeView(); // initialize list
        },

        methods: {
            // Initialize the Component
            initializeView() {
                // console.log('Switch Data: ', this.submodelElementData);
                if (
                    !this.widgetSettings ||
                    !this.submodelElementData ||
                    Object.keys(this.submodelElementData).length === 0
                )
                    return;
                let localSubmodelElementData = { ...this.submodelElementData };
                // check if the submodelELelement is a Property or a SubmodelElementCollection
                if (this.widgetSettings.idShorts && this.widgetSettings.idShorts.length > 0) {
                    // Collection
                    // Filter submodelElementData by idShorts from widgetSettings
                    let collectionValues = [] as Array<any>;
                    this.widgetSettings.idShorts.forEach((element: any, i: number) => {
                        localSubmodelElementData.value.forEach((el: any) => {
                            if (element == el.idShort) {
                                let elementToPush = { ...el };
                                elementToPush.name = this.widgetSettings.chartNamesUnits[i].name;
                                // convert value to boolean with !!
                                elementToPush.value = !!el.value;
                                collectionValues.push(elementToPush);
                            }
                        });
                    });
                    // console.log('collectionValues: ', collectionValues);
                    this.inputElements = collectionValues;
                } else {
                    // Property
                    localSubmodelElementData.name = this.widgetSettings.chartNamesUnits[0].name;
                    // convert value to boolean with !!
                    localSubmodelElementData.value = !!localSubmodelElementData.value;
                    this.inputElements = [localSubmodelElementData];
                }
            },

            // Get the value of the submodelElement
            getValue(element: any) {
                // console.log('getValue: ', element.value)
                return element.value;
            },
        },
    });
</script>
