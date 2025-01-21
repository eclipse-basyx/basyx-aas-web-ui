<template>
    <v-container fluid class="pa-0">
        <v-row v-for="(element, i) in outputElements" :key="element.idShort" align="center" justify="space-between">
            <v-col cols="auto">
                <div>{{ element.name }}</div>
            </v-col>
            <v-col cols="auto" class="text-right py-1">
                <v-text-field
                    v-if="element.name"
                    v-model="newPropertyValues[i]"
                    variant="outlined"
                    density="compact"
                    hide-details
                    style="width: 300px"
                    clearable
                    @keydown.enter="updateValue(element, i)">
                    <!-- Current Value -->
                    <template #prepend-inner>
                        <v-chip label size="x-small" border>{{ element.value }}</v-chip>
                        <v-divider class="ml-3 mr-1" vertical inset style="margin-top: 4px"></v-divider>
                    </template>
                    <template #append-inner>
                        <!-- Suffix with Unit -->
                        <span v-if="element.unit" class="text-subtitleText">{{ element.unit }}</span>
                        <!-- Update Button -->
                        <v-btn
                            size="small"
                            variant="elevated"
                            color="primary"
                            class="text-buttonText"
                            style="right: -4px"
                            @click.stop="updateValue(element, i)">
                            <v-icon>mdi-upload</v-icon>
                        </v-btn>
                    </template>
                </v-text-field>
            </v-col>
        </v-row>
    </v-container>
</template>

// TODO Transfer to composition API
<script lang="ts">
    import { defineComponent } from 'vue';
    import RequestHandling from '@/mixins/RequestHandling';

    export default defineComponent({
        name: 'InputField',
        mixins: [RequestHandling],

        props: ['submodelElementData', 'selectedNode', 'widgetSettings'],

        setup() {
            return {};
        },

        data() {
            return {
                outputElements: [] as Array<any>,
                newPropertyValues: [] as Array<any>,
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
                if (
                    this.widgetSettings.idShorts &&
                    this.widgetSettings.idShorts.length > 0 &&
                    localSubmodelElementData &&
                    Object.keys(localSubmodelElementData).length > 0
                ) {
                    // Collection
                    // Filter submodelElementData by idShorts from widgetSettings
                    let collectionValues = [] as Array<any>;
                    this.widgetSettings.idShorts.forEach((element: any, i: number) => {
                        localSubmodelElementData.value.forEach((el: any) => {
                            if (element == el.idShort) {
                                let elementToPush = { ...el };
                                // console.log('WidgetSettings: ', this.widgetSettings.chartNamesUnits[i]);
                                elementToPush.name = this.widgetSettings.chartNamesUnits[i].name;
                                elementToPush.unit = this.widgetSettings.chartNamesUnits[i].unit;
                                // console.log('value: ', elementToPush.value)
                                collectionValues.push(elementToPush);
                            }
                        });
                    });
                    // console.log('collectionValues: ', collectionValues);
                    this.outputElements = collectionValues;
                } else {
                    // Property
                    localSubmodelElementData.name = this.widgetSettings.chartNamesUnits[0].name;
                    localSubmodelElementData.unit = this.widgetSettings.chartNamesUnits[0].unit;
                    this.outputElements = [localSubmodelElementData];
                }
            },

            // Function to update the value of the property
            updateValue(inputElement: any, position: number) {
                // console.log("Update Value: ", value);
                let path = this.selectedNode.pathFull + '/value';
                // check if the submodelELelement is a SubmodelElementCollection
                if (this.submodelElementData.modelType == 'SubmodelElementCollection') {
                    path = this.selectedNode.pathFull + '/' + inputElement.idShort + '/value';
                }
                let content = "'" + this.newPropertyValues[position] + "'";
                let headers = new Headers();
                headers.append('Content-Type', 'application/json');
                let context = 'updating Property "' + this.selectedNode.idShort + '"';
                let disableMessage = false;
                // Send Request to update the value of the property
                this.putRequest(path, content, headers, context, disableMessage).then((response: any) => {
                    if (response.success) {
                        this.newPropertyValues[position] = null;
                    }
                });
            },
        },
    });
</script>
