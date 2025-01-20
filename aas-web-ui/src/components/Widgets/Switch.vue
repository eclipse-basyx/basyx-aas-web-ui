<template>
    <v-container fluid class="pa-0">
        <template v-for="switchElement in inputElements" :key="switchElement.idShort">
            <v-switch
                v-model="switchElement.value"
                inset
                hide-details
                color="primary"
                :label="switchElement.name"
                @change="sendSwitch(switchElement)"></v-switch>
        </template>
    </v-container>
</template>

// TODO Transfer to composition API
<script lang="ts">
    import { defineComponent } from 'vue';
    import RequestHandling from '@/mixins/RequestHandling';

    export default defineComponent({
        name: 'SwitchElement',
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
                    // console.log('this.widgetSettings.idShorts: ', this.widgetSettings.idShorts, 'localSubmodelElementData.: ', localSubmodelElementData)
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
            sendSwitch(switchElement: any) {
                let value = switchElement.value as any;
                let path = this.selectedNode.pathFull + '/value';
                // check if the submodelELelement is a SubmodelElementCollection
                if (this.submodelElementData.modelType == 'SubmodelElementCollection') {
                    path = this.selectedNode.pathFull + '/' + switchElement.idShort + '/value';
                }
                let content = "'" + value + "'";
                let headers = new Headers();
                headers.append('Content-Type', 'application/json');
                let context = 'updating Property "' + this.selectedNode.idShort + '"';
                let disableMessage = false;
                // Send Request to update the value of the property
                // console.log('Switch Value: ', path, content, headers, context, disableMessage);
                this.putRequest(path, content, headers, context, disableMessage);
            },
        },
    });
</script>
