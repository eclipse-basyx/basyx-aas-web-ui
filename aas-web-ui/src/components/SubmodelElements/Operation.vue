<template>
    <v-container fluid class="pa-0">
        <v-card v-if="operationObject" color="elevatedCard" class="mt-4">
            <!-- Operation with Variable(s) -->
            <v-list
                v-if="
                    operationObject.inputVariables.length > 0 ||
                    operationObject.inoutputVariables.length > 0 ||
                    operationObject.outputVariables.length > 0
                "
                nav
                class="bg-elevatedCard py-0">
                <!-- List with the Variable Types -->
                <v-container v-for="variableType in variableTypes" :key="variableType.id" class="ma-0 pa-0" fluid>
                    <template
                        v-if="operationObject[variableType.type] && operationObject[variableType.type].length > 0">
                        <!-- Title of the Variable Type -->
                        <v-list-item class="px-1 pb-1 pt-0">
                            <v-list-item-title class="text-subtitle-2 mt-2">{{
                                variableType.name + ':'
                            }}</v-list-item-title>
                        </v-list-item>
                        <!-- List with the Fields belonging to the Variable Type -->
                        <v-card v-for="(variable, i) in localOperationObject[variableType.type]" :key="i" class="mb-3">
                            <!-- Variable Description -->
                            <DescriptionElement
                                v-if="variable.value && variable.value.description"
                                :description-object="variable.value.description"
                                :description-title="'Description'"
                                :small="true"></DescriptionElement>
                            <v-divider v-if="variable.value && variable.value.description" class="mt-1"></v-divider>
                            <!-- Variable Value -->
                            <v-list-item class="px-0 pb-0">
                                <v-list-item-title class="pt-1">
                                    <!-- <pre class="mx-4 mt-2 mb-1 pa-3" style="border: solid; border-radius: 3px; border-width: 1px">{{ variable }}</pre> -->
                                    <!-- Value Representation depending on the ModelType -->
                                    <Property
                                        v-if="variable.value.modelType === 'Property'"
                                        :property-object="variable.value"
                                        :is-operation-variable="true"
                                        :variable-type="variableType.type"
                                        @update-value="updateOperationVariable($event, variable.value)"></Property>
                                    <ReferenceElement
                                        v-else-if="variable.value.modelType === 'ReferenceElement'"
                                        :reference-element-object="variable.value"
                                        :is-operation-variable="true"
                                        :variable-type="variableType.type"
                                        @update-value="
                                            updateOperationVariable($event, variable.value)
                                        "></ReferenceElement>
                                    <InvalidElement
                                        v-else
                                        :invalid-element-object="variable.value"
                                        :is-operation-variable="true"
                                        :variable-type="variableType.type"
                                        @update-value="
                                            updateOperationVariable($event, variable.value)
                                        "></InvalidElement>
                                </v-list-item-title>
                            </v-list-item>
                        </v-card>
                    </template>
                </v-container>
            </v-list>
            <!-- Warning when Operation has no variable(s) -->
            <v-list v-else nav class="bg-elevatedCard pt-0">
                <v-list-item>
                    <v-list-item-title class="pt-2">
                        <v-alert
                            text="Operation doesn't contain a Variable!"
                            density="compact"
                            type="warning"
                            variant="outlined"></v-alert>
                    </v-list-item-title>
                </v-list-item>
            </v-list>
            <v-divider></v-divider>
            <!-- Action Buttons for the Operation -->
            <v-list nav class="bg-elevatedCard pa-0">
                <v-list-item>
                    <template #append>
                        <!-- Clear-Button -->
                        <v-btn size="small" variant="outlined" color="primary" class="mr-3" @click="clearFields()"
                            >clear</v-btn
                        >
                        <!-- Execute-Button -->
                        <v-btn
                            size="small"
                            class="text-buttonText"
                            color="primary"
                            :loading="loading"
                            @click="executeOperation()"
                            >execute</v-btn
                        >
                    </template>
                </v-list-item>
            </v-list>
        </v-card>
    </v-container>
</template>

<script lang="ts">
    import { defineComponent } from 'vue';
    import DescriptionElement from '@/components/UIComponents/DescriptionElement.vue';
    import RequestHandling from '@/mixins/RequestHandling';
    import SubmodelElementHandling from '@/mixins/SubmodelElementHandling';
    import { useAASStore } from '@/store/AASDataStore';
    import { useNavigationStore } from '@/store/NavigationStore';
    import InvalidElement from './InvalidElement.vue';
    import Property from './Property.vue';
    import ReferenceElement from './ReferenceElement.vue';

    export default defineComponent({
        name: 'Operation',
        components: {
            DescriptionElement,

            Property,
            ReferenceElement,
            InvalidElement,
        },
        mixins: [RequestHandling, SubmodelElementHandling],
        props: ['operationObject'],

        setup() {
            const navigationStore = useNavigationStore();
            const aasStore = useAASStore();

            return {
                navigationStore, // NavigationStore Object
                aasStore, // AASStore Object
            };
        },

        data() {
            return {
                localOperationObject: {} as any, // Local copy of the Operation Object
                variableTypes: [
                    // Variable Types for the Operation
                    { type: 'inputVariables', name: 'Input Variables', id: 0 }, // write
                    { type: 'inoutputVariables', name: 'In-/Output Variables', id: 1 }, // read/write
                    { type: 'outputVariables', name: 'Output Variables', id: 2 }, // read
                ] as Array<any>,
                loading: false, // Loading State of the Operation
            };
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
        },

        watch: {},

        mounted() {
            // console.log(this.operationObject)
            // create local copy of the Operation Object
            this.localOperationObject = JSON.parse(JSON.stringify(this.operationObject));
            // check if inputVariables, inoutputVariables or outputVariables exist (if not, create them as empty arrays)
            if (!this.localOperationObject.inputVariables) {
                this.localOperationObject.inputVariables = [];
            }
            if (!this.localOperationObject.inoutputVariables) {
                this.localOperationObject.inoutputVariables = [];
            }
            if (!this.localOperationObject.outputVariables) {
                this.localOperationObject.outputVariables = [];
            }
        },

        methods: {
            // Function to clear all Fields
            clearFields() {
                // console.log('clearFields: ', this.localOperationObject)
                // clear the inputVariables
                if (this.localOperationObject.inputVariables) {
                    this.localOperationObject.inputVariables.forEach((variable: any) => {
                        variable.value.value = null;
                    });
                }
                // clear the inoutputVariables
                if (this.localOperationObject.inoutputVariables) {
                    this.localOperationObject.inoutputVariables.forEach((variable: any) => {
                        variable.value.value = null;
                    });
                }
                // clear the outputVariables
                if (this.localOperationObject.outputVariables) {
                    this.localOperationObject.outputVariables.forEach((variable: any) => {
                        variable.value.value = null;
                    });
                }
            },

            // Function to execute the Operation
            executeOperation() {
                // create Array containing the Input Variables which will will be send to the Server
                // console.log('executeOperation: ', this.localOperationObject)
                let inputArguments = this.localOperationObject.inputVariables;
                // create Array containing the In-/Output Variables which will will be send to the Server
                let inoutputArguments = this.localOperationObject.inoutputVariables;
                // console.log('executeOperation: ', inputVariables, inoutputVariables);
                let path = this.localOperationObject.path + '/invoke?async=true';
                let content = {
                    inputArguments: inputArguments,
                    inoutputArguments: inoutputArguments,
                    clientTimeoutDuration: 'PT60S', // 60 second timeout
                };
                let body = JSON.stringify(content);
                let headers = new Headers();
                headers.append('accept', 'application/json');
                headers.append('Content-Type', 'application/json');
                let context =
                    'invoking ' + this.localOperationObject.modelType + ' "' + this.localOperationObject.idShort + '"';
                let disableMessage = false;
                this.loading = true;
                this.postRequest(path, body, headers, context, disableMessage).then((response: any) => {
                    this.loading = false;
                    if (response.success) {
                        // console.log('executeOperation: ', response.data);
                        // fill the operationVariables with the new values
                        if (response.data.inoutputArguments) {
                            this.localOperationObject.inoutputVariables = response.data.inoutputArguments;
                        }
                        if (response.data.outputArguments) {
                            this.localOperationObject.outputVariables = response.data.outputArguments;
                        }
                        // check the operationResult, if success is false, show an error message
                        if (response.data.operationResult && !response.data.operationResult.success) {
                            this.errorHandler(response.data.operationResult, context);
                        } else {
                            this.navigationStore.dispatchSnackbar({
                                status: true,
                                timeout: 4000,
                                color: 'success',
                                btnColor: 'buttonText',
                                text: 'Operation executed successfully.',
                            }); // Show Success Snackbar
                        }
                    }
                });
            },

            updateOperationVariable(e: any, variable: any) {
                // console.log('updateOperationVariable: ', 'new Value: ', e, ' Variable: ', variable);
                variable.value = e;
            },

            // generate random uuid
            UUID() {
                return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                    var r = (Math.random() * 16) | 0,
                        v = c == 'x' ? r : (r & 0x3) | 0x8;
                    return v.toString(16);
                });
            },
        },
    });
</script>
