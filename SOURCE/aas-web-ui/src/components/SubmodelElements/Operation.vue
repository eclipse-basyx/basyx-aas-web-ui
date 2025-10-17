<template>
    <v-container fluid class="pa-0">
        <v-card v-if="localOperationObject" color="elevatedCard" class="mt-4">
            <!-- Operation with Variable(s) -->
            <v-list
                v-if="
                    localOperationObject.inputVariables?.length > 0 ||
                    localOperationObject.inoutputVariables?.length > 0 ||
                    localOperationObject.outputVariables?.length > 0
                "
                nav
                class="bg-elevatedCard py-0">
                <!-- List with the Variable Types -->
                <v-container v-for="variableType in variableTypes" :key="variableType.id" class="ma-0 pa-0" fluid>
                    <template
                        v-if="
                            localOperationObject[variableType.type] &&
                            localOperationObject[variableType.type].length > 0
                        ">
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
                                :description-array="variable.value.description"
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
                                        :is-editable="isEditable"
                                        @update-value="updateOperationVariable($event, variable.value)"></Property>
                                    <ReferenceElement
                                        v-else-if="variable.value.modelType === 'ReferenceElement'"
                                        :reference-element-object="variable.value"
                                        :is-operation-variable="true"
                                        :variable-type="variableType.type"
                                        :is-editable="isEditable"
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
                        <v-btn
                            v-if="isEditable"
                            size="small"
                            variant="outlined"
                            color="primary"
                            class="mr-3"
                            @click="clearFields()"
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

<script lang="ts" setup>
    import { onMounted, ref, watch } from 'vue';
    import { useRequestHandling } from '@/composables/RequestHandling';
    import { useNavigationStore } from '@/store/NavigationStore';

    // Stores
    const navigationStore = useNavigationStore();

    // Composables
    const { postRequest, errorHandler } = useRequestHandling();

    const props = defineProps({
        operationObject: {
            type: Object,
            default: () => ({}),
        },
        isEditable: {
            type: Boolean,
            default: true,
        },
    });

    const localOperationObject = ref({} as any);
    const variableTypes = ref([
        { type: 'inputVariables', name: 'Input Variables', id: 0 },
        { type: 'inoutputVariables', name: 'In-/Output Variables', id: 1 },
        { type: 'outputVariables', name: 'Output Variables', id: 2 },
    ]);
    const loading = ref(false);

    // Watchers
    watch(
        () => props.operationObject,
        () => {
            initOperation();
        },
        { deep: true }
    );

    onMounted(() => {
        initOperation();
    });

    // Function to initialize the Operation
    function initOperation(): void {
        // create local copy of the Operation Object
        const operationObjectCopy = { ...props.operationObject };
        delete operationObjectCopy.parent;
        localOperationObject.value = operationObjectCopy;

        // check if inputVariables, inoutputVariables or outputVariables exist (if not, create them as empty arrays)
        if (!localOperationObject.value.inputVariables) {
            localOperationObject.value.inputVariables = [];
        }
        if (!localOperationObject.value.inoutputVariables) {
            localOperationObject.value.inoutputVariables = [];
        }
        if (!localOperationObject.value.outputVariables) {
            localOperationObject.value.outputVariables = [];
        }
    }

    function clearFields(): void {
        if (localOperationObject.value.inputVariables) {
            localOperationObject.value.inputVariables.forEach((variable: any) => {
                variable.value.value = null;
            });
        }

        if (localOperationObject.value.inoutputVariables) {
            localOperationObject.value.inoutputVariables.forEach((variable: any) => {
                variable.value.value = null;
            });
        }

        if (localOperationObject.value.outputVariables) {
            localOperationObject.value.outputVariables.forEach((variable: any) => {
                variable.value.value = null;
            });
        }
    }

    // Function to execute the Operation
    function executeOperation(): void {
        // create Array containing the Input Variables which will will be send to the Server
        const inputArguments = localOperationObject.value.inputVariables;
        // create Array containing the In-/Output Variables which will will be send to the Server
        const inoutputArguments = localOperationObject.value.inoutputVariables;
        // console.log('executeOperation: ', inputVariables, inoutputVariables);
        const path = localOperationObject.value.path + '/invoke?async=true';
        const content = {
            inputArguments: inputArguments,
            inoutputArguments: inoutputArguments,
            clientTimeoutDuration: 'PT60S', // 60 second timeout
        };
        const body = JSON.stringify(content);
        const headers = new Headers();
        headers.append('accept', 'application/json');
        headers.append('Content-Type', 'application/json');
        const context =
            'invoking ' + localOperationObject.value.modelType + ' "' + localOperationObject.value.idShort + '"';
        const disableMessage = false;

        loading.value = true;

        postRequest(path, body, headers, context, disableMessage).then((response: any) => {
            loading.value = false;

            if (response.success) {
                // fill the operationVariables with the new values
                if (response.data.inoutputArguments) {
                    localOperationObject.value.inoutputVariables = response.data.inoutputArguments;
                }

                if (response.data.outputArguments) {
                    localOperationObject.value.outputVariables = response.data.outputArguments;
                }

                // check the operationResult, if success is false, show an error message
                if (response.data.operationResult && !response.data.operationResult.success) {
                    errorHandler(response.data.operationResult, context);
                } else {
                    navigationStore.dispatchSnackbar({
                        status: true,
                        timeout: 4000,
                        color: 'success',
                        btnColor: 'buttonText',
                        text: 'Operation executed successfully.',
                    });

                    // Check if refreshWebUi qualifier is set (to true) and reload AASList and SubmodelTreeview
                    refreshWebUi();
                }
            }
        });
    }

    function updateOperationVariable(e: any, variable: any): void {
        // console.log('updateOperationVariable: ', 'new Value: ', e, ' Variable: ', variable);
        variable.value = e;
    }

    function refreshWebUi(): void {
        if (localOperationObject.value.qualifiers) {
            const refreshQualifier = localOperationObject.value.qualifiers.find(
                (qualifier: any) => qualifier.type === 'refreshWebUi'
            );
            if (refreshQualifier && refreshQualifier.value === 'true') {
                navigationStore.dispatchTriggerAASListReload();
                navigationStore.dispatchTriggerTreeviewReload();
            }
        }
    }
</script>
