<template>
    <v-dialog
        v-model="editRangeDialog"
        width="860"
        persistent
        @keydown="keyDown"
        @keyup="keyUp($event, saveRangeElement)">
        <v-card>
            <v-card-title>
                <span class="text-subtile-1">{{
                    props.newRange ? 'Create a new Range Element' : 'Edit Range Element'
                }}</span>
            </v-card-title>
            <v-divider></v-divider>
            <v-card-text style="overflow-y: auto" class="pa-3 bg-card">
                <v-expansion-panels v-model="openPanels" multiple>
                    <!-- Details -->
                    <v-expansion-panel class="border-t-thin border-s-thin border-e-thin" :class="bordersToShow(0)">
                        <v-expansion-panel-title>Details</v-expansion-panel-title>
                        <v-expansion-panel-text>
                            <v-row align="center">
                                <v-col class="py-0">
                                    <TextInput
                                        v-model="rangeIdShort"
                                        label="IdShort"
                                        :error="hasError('idShort')"
                                        :rules="isParentSubmodelElementList ? [] : [rules.required]"
                                        :error-messages="getError('idShort')" />
                                </v-col>
                                <v-col cols="auto" class="px-0">
                                    <HelpInfoButton help-type="idShort" />
                                </v-col>
                            </v-row>
                            <v-row align="center">
                                <v-col class="py-0">
                                    <MultiLanguageTextInput
                                        v-model="displayName"
                                        :show-label="true"
                                        label="Display Name"
                                        type="displayName" />
                                </v-col>
                                <v-col cols="auto" class="px-0">
                                    <HelpInfoButton help-type="displayName" />
                                </v-col>
                            </v-row>
                            <v-row align="center">
                                <v-col class="py-0">
                                    <MultiLanguageTextInput
                                        v-model="description"
                                        :show-label="true"
                                        label="Description"
                                        type="description" />
                                </v-col>
                                <v-col cols="auto" class="px-0">
                                    <HelpInfoButton help-type="description" />
                                </v-col>
                            </v-row>
                            <v-row align="center">
                                <v-col class="py-0">
                                    <SelectInput
                                        v-model="rangeCategory"
                                        label="Category"
                                        type="category"
                                        :clearable="true" />
                                </v-col>
                                <v-col cols="auto" class="px-0">
                                    <HelpInfoButton help-type="category" />
                                </v-col>
                            </v-row>
                        </v-expansion-panel-text>
                    </v-expansion-panel>
                    <!-- Range Value -->
                    <v-expansion-panel class="border-s-thin border-e-thin" :class="bordersToShow(1)">
                        <v-expansion-panel-title>Value</v-expansion-panel-title>
                        <v-expansion-panel-text>
                            <v-row align="center">
                                <v-col class="py-0">
                                    <SelectInput
                                        v-model="valueType"
                                        label="Data Type"
                                        type="dataType"
                                        :clearable="true" />
                                </v-col>
                                <v-col cols="auto" class="px-0">
                                    <HelpInfoButton help-type="dataType" />
                                </v-col>
                            </v-row>
                            <v-row align="center">
                                <v-col class="py-0">
                                    <RangeInput v-model:min-value="minValue" v-model:max-value="maxValue" />
                                </v-col>
                                <v-col cols="auto" class="px-0">
                                    <HelpInfoButton help-type="range-minmax" />
                                </v-col>
                            </v-row>
                        </v-expansion-panel-text>
                    </v-expansion-panel>
                    <!-- Semantic ID -->
                    <v-expansion-panel class="border-s-thin border-e-thin" :class="bordersToShow(2)">
                        <v-expansion-panel-title>Semantic ID</v-expansion-panel-title>
                        <v-expansion-panel-text>
                            <v-row align="center">
                                <v-col class="py-0">
                                    <ReferenceInput v-model="semanticId" label="Semantic ID" :no-header="true" />
                                </v-col>
                                <v-col cols="auto" class="px-0">
                                    <HelpInfoButton help-type="semanticId" />
                                </v-col>
                            </v-row>
                        </v-expansion-panel-text>
                    </v-expansion-panel>
                    <!-- Data Specification -->
                    <v-expansion-panel class="border-b-thin border-s-thin border-e-thin" :class="bordersToShow(3)">
                        <v-expansion-panel-title>Data Specification</v-expansion-panel-title>
                        <v-expansion-panel-text>
                            <span class="text-subtitleText text-subtitle-2">Coming soon!</span>
                        </v-expansion-panel-text>
                    </v-expansion-panel>
                </v-expansion-panels>
            </v-card-text>
            <v-divider></v-divider>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn @click="closeDialog">Cancel</v-btn>
                <v-btn color="primary" @click="saveRangeElement">Save</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
    /*
    NOTE: This component uses Keyboard events (keyUp,keyDown) in the root element v-dialog.
    It saves the changes after pressing the 'Enter' Key. When creating additional Form Inputs that require or support the
    usage of the 'Enter' key, make sure to edit the keyDown/keyUp method to not execute when in such form fields.
*/

    import { jsonization, types as aasTypes } from '@aas-core-works/aas-core3.0-typescript';
    import { computed, ref, watch } from 'vue';
    import { useRoute, useRouter } from 'vue-router';
    import { useSMEHandling } from '@/composables/AAS/SMEHandling';
    import { useSMRepositoryClient } from '@/composables/Client/SMRepositoryClient';
    import { useNavigationStore } from '@/store/NavigationStore';
    import { keyDown, keyUp } from '@/utils/EditorUtils';
    import { base64Decode } from '@/utils/EncodeDecodeUtils';

    const props = defineProps<{
        modelValue: boolean;
        newRange: boolean;
        parentElement: any;
        path?: string;
        range?: any;
    }>();

    // Stores
    const navigationStore = useNavigationStore();

    // Composables
    const { fetchSme, putSubmodelElement, postSubmodelElement } = useSMRepositoryClient();
    const { fetchAndDispatchSme } = useSMEHandling();

    // Vue Router
    const router = useRouter();
    const route = useRoute();

    const editRangeDialog = ref(false);
    const rangeObject = ref<aasTypes.Range | undefined>(undefined);
    const openPanels = ref<number[]>([0]);

    const rangeIdShort = ref<string | null>(null);

    const displayName = ref<Array<aasTypes.LangStringNameType> | null>(null);
    const description = ref<Array<aasTypes.LangStringTextType> | null>(null);
    const rangeCategory = ref<string | null>(null);

    const semanticId = ref<aasTypes.Reference | null>(null);
    const minValue = ref<string | null>(null);
    const maxValue = ref<string | null>(null);
    const valueType = ref<aasTypes.DataTypeDefXsd>(aasTypes.DataTypeDefXsd.String);

    const errors = ref<Map<string, string>>(new Map());

    const isParentSubmodelElementList = computed(() => props.parentElement?.modelType === 'SubmodelElementList');

    const rules = {
        required: (value: any) => !!value || 'Required.',
    };

    const emit = defineEmits<{
        (event: 'update:modelValue', value: boolean): void;
    }>();

    watch(
        () => props.modelValue,
        (value) => {
            editRangeDialog.value = value;
            if (value) {
                initializeInputs();
            }
        }
    );

    watch(
        () => editRangeDialog.value,
        (value) => {
            emit('update:modelValue', value);
        }
    );

    const bordersToShow = computed(() => (panel: number) => {
        let border = '';
        switch (panel) {
            case 0:
                if (openPanels.value.includes(0) || openPanels.value.includes(1)) {
                    border = 'border-b-thin';
                }
                break;
            case 1:
                if (openPanels.value.includes(0) || openPanels.value.includes(1)) {
                    border += ' border-t-thin';
                }
                if (openPanels.value.includes(1) || openPanels.value.includes(2)) {
                    border += ' border-b-thin';
                }
                break;
            case 2:
                if (openPanels.value.includes(1) || openPanels.value.includes(2)) {
                    border += ' border-t-thin';
                }
                if (openPanels.value.includes(2) || openPanels.value.includes(3)) {
                    border += ' border-b-thin';
                }
                break;
            case 3:
                if (openPanels.value.includes(2) || openPanels.value.includes(3)) {
                    border += 'border-t-thin';
                }
                break;
        }
        return border;
    });

    function hasError(field: string): boolean {
        return errors.value.has(field);
    }

    function getError(field: string): string | undefined {
        if (!hasError(field)) {
            return undefined;
        }
        return errors.value.get(field);
    }

    async function saveRangeElement(): Promise<void> {
        if (props.newRange || rangeObject.value === undefined) {
            rangeObject.value = new aasTypes.Range(valueType.value);
        }

        if (rangeIdShort.value !== null) {
            rangeObject.value.idShort = rangeIdShort.value;
        } else if (!isParentSubmodelElementList.value) {
            errors.value.set('idShort', 'Range IdShort is required');
            return;
        }

        rangeObject.value.min = minValue.value;
        rangeObject.value.max = maxValue.value;

        if (semanticId.value !== null) {
            rangeObject.value.semanticId = semanticId.value;
        }

        if (displayName.value !== null) {
            rangeObject.value.displayName = displayName.value;
        }

        if (description.value !== null) {
            rangeObject.value.description = description.value;
        }

        rangeObject.value.category = rangeCategory.value;

        if (props.newRange) {
            if (props.parentElement.modelType === 'Submodel') {
                // Create the Range Element on the parent Submodel
                await postSubmodelElement(rangeObject.value, props.parentElement.id);

                // Navigate to the new Range Element
                const query = structuredClone(route.query);
                query.path = props.parentElement.path + '/submodel-elements/' + rangeObject.value.idShort;

                router.push({
                    query: query,
                });
            } else {
                // Extract the submodel ID and the idShortPath from the parentElement path
                const splitted = props.parentElement.path.split('/submodel-elements/');
                const submodelId = base64Decode(splitted[0].split('/submodels/')[1]);
                const idShortPath = splitted[1];

                // Create the Range Element on the parent element
                await postSubmodelElement(rangeObject.value, submodelId, idShortPath);

                // Navigate to the new Range Element
                if (props.parentElement.modelType === 'SubmodelElementCollection') {
                    const query = structuredClone(route.query);
                    query.path = props.parentElement.path + '.' + rangeObject.value.idShort;

                    router.push({
                        query: query,
                    });
                }
            }
        } else {
            if (props.path == undefined) {
                console.error('Range Path is missing');
                return;
            }

            const editedElementSelected = route.query.path === props.path;

            // Update the Range Element
            if (props.parentElement.modelType === 'Submodel') {
                await putSubmodelElement(rangeObject.value, props.path);

                if (editedElementSelected) {
                    fetchAndDispatchSme(props.parentElement.path + '/submodel-elements/' + rangeObject.value.idShort);
                }
            } else if (props.parentElement.modelType === 'SubmodelElementList') {
                const index = props.parentElement.value.indexOf(
                    props.parentElement.value.find((el: any) => el.id === props.range.id)
                );
                const path = props.parentElement.path + `%5B${index}%5D`;
                await putSubmodelElement(rangeObject.value, path);

                if (editedElementSelected) {
                    fetchAndDispatchSme(path);
                }
            } else {
                // Submodel Element Collection or Entity
                await putSubmodelElement(rangeObject.value, props.range.path);

                if (editedElementSelected) {
                    fetchAndDispatchSme(props.parentElement.path + '.' + rangeObject.value.idShort);
                }
            }
        }
        closeDialog();
        navigationStore.dispatchTriggerTreeviewReload();
    }

    function closeDialog(): void {
        editRangeDialog.value = false;
    }

    async function initializeInputs(): Promise<void> {
        if (!props.newRange && props.range) {
            const rangeJSON = await fetchSme(props.range.path);
            const instanceOrError = jsonization.rangeFromJsonable(rangeJSON);

            if (instanceOrError.error !== null) {
                console.error('Error parsing Range Element: ', instanceOrError.error);
                return;
            }

            rangeObject.value = instanceOrError.mustValue();

            rangeIdShort.value = rangeObject.value.idShort;

            if (rangeObject.value.displayName) {
                displayName.value = rangeObject.value.displayName;
            }

            if (rangeObject.value.description) {
                description.value = rangeObject.value.description;
            }

            if (rangeObject.value.category) {
                rangeCategory.value = rangeObject.value.category;
            }

            if (rangeObject.value.min) {
                minValue.value = rangeObject.value.min;
            }

            if (rangeObject.value.max) {
                maxValue.value = rangeObject.value.max;
            }

            if (rangeObject.value.valueType) {
                valueType.value = rangeObject.value.valueType;
            }

            if (rangeObject.value.semanticId) {
                semanticId.value = rangeObject.value.semanticId;
            }

            openPanels.value = [0, 1];
        } else {
            rangeIdShort.value = null;
            displayName.value = null;
            description.value = null;
            rangeCategory.value = null;
            minValue.value = null;
            maxValue.value = null;
            valueType.value = aasTypes.DataTypeDefXsd.String;
            semanticId.value = null;
            openPanels.value = [0, 1];
        }
    }
</script>
