<template>
    <v-container fluid class="px-0 py-1">
        <v-row v-for="buttonElement in inputElements" :key="buttonElement.idShort">
            <v-col>
                <v-btn color="primary" @click="sendClick(buttonElement, true)" class="text-buttonText">{{
                    buttonElement.name
                }}</v-btn>
            </v-col>
        </v-row>
    </v-container>
</template>

<script lang="ts">
    import { defineComponent } from 'vue';
    import RequestHandling from '@/mixins/RequestHandling';

    export default defineComponent({
        name: 'Button',
        components: {
            RequestHandling,
        },
        mixins: [RequestHandling],
        props: ['submodelElementData', 'selectedNode', 'widgetSettings'],

        setup() {
            return {};
        },

        data() {
            return {
                inputElements: [] as Array<any>,
            };
        },

        mounted() {
            this.initializeView(); // initialize list
        },

        watch: {
            // Watch for changes in the submodelElementData and (re-)initialize the Component
            submodelElementData: {
                deep: true,
                handler() {
                    this.initializeView(); // initialize switch
                },
            },
        },

        computed: {},

        methods: {
            // Initialize the Component
            initializeView() {
                // console.log('Switch Data: ', this.submodelElementData);
                if (
                    !this.widgetSettings ||
                    !this.submodelElementData ||
                    Object.keys(this.submodelElementData).length == 0
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

            // Send Put Request to the AAS when the Button is clicked
            sendClick(buttonElement: any, buttonValue: boolean) {
                let value = buttonValue as any;
                // console.log(this.submodelElementData);
                let path = this.selectedNode.pathFull + '/value';
                if (this.submodelElementData.modelType == 'SubmodelElementCollection') {
                    path = this.selectedNode.pathFull + '/' + buttonElement.idShort + '/value';
                }
                let content = "'" + value + "'";
                let headers = new Headers();
                headers.append('Content-Type', 'application/json');
                let context = 'updating Property "' + this.selectedNode.idShort + '"';
                let disableMessage = false;
                // Send Request to update the value of the property
                this.putRequest(path, content, headers, context, disableMessage).then((response: any) => {
                    if (response.success) {
                        if (value) {
                            this.sendClick(buttonElement, false);
                        }
                    }
                });
            },
        },
    });
</script>
