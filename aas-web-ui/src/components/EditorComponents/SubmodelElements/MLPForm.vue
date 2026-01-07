<template>
    <v-dialog v-model="editMLPDialog" width="860" persistent @keydown="keyDown" @keyup="keyUp($event, saveMLP)">
        <v-card>
            <v-card-title>
                <span class="text-subtile-1">{{
                    props.newMlp ? 'Create a new Multi Language Property' : 'Edit Multi Language Property'
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
                                        v-model="mlpIdShort"
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
                                        v-model="mlpCategory"
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
                    <!-- TODO: Value ID -->
                    <!-- Property Value -->
                    <v-expansion-panel class="border-s-thin border-e-thin" :class="bordersToShow(1)">
                        <v-expansion-panel-title>Value</v-expansion-panel-title>
                        <v-expansion-panel-text>
                            <v-row align="center">
                                <v-col class="py-0">
                                    <MultiLanguageTextInput v-model="mlpValue" :show-label="false" type="text" />
                                </v-col>
                                <v-col cols="auto" class="px-0">
                                    <HelpInfoButton help-type="mlp-value" />
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
                <v-btn color="primary" @click="saveMLP">Save</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
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
        newMlp: boolean;
        parentElement: any;
        path?: string;
        mlp?: any;
    }>();

    // Stores
    const navigationStore = useNavigationStore();

    // Composables
    const { fetchSme, putSubmodelElement, postSubmodelElement } = useSMRepositoryClient();
    const { fetchAndDispatchSme } = useSMEHandling();

    // Vue Router
    const router = useRouter();
    const route = useRoute();

    const editMLPDialog = ref(false);
    const mlpObject = ref<aasTypes.MultiLanguageProperty | undefined>(undefined);
    const openPanels = ref<number[]>([0]);

    const mlpIdShort = ref<string | null>(null);

    const displayName = ref<Array<aasTypes.LangStringNameType> | null>(null);
    const description = ref<Array<aasTypes.LangStringTextType> | null>(null);
    const mlpCategory = ref<string | null>(null);

    const semanticId = ref<aasTypes.Reference | null>(null);
    const mlpValue = ref<Array<aasTypes.LangStringTextType> | null>(null);

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
            editMLPDialog.value = value;
            if (value) {
                initializeInputs();
            }
        }
    );

    watch(
        () => editMLPDialog.value,
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

    async function saveMLP(): Promise<void> {
        if (props.newMlp || mlpObject.value === undefined) {
            mlpObject.value = new aasTypes.MultiLanguageProperty();
        }

        if (mlpIdShort.value !== null) {
            mlpObject.value.idShort = mlpIdShort.value;
        } else if (!isParentSubmodelElementList.value) {
            errors.value.set('idShort', 'MultiLanguageProperty IdShort is required');
            return;
        }

        if (semanticId.value !== null) {
            mlpObject.value.semanticId = semanticId.value;
        }

        if (displayName.value !== null) {
            mlpObject.value.displayName = displayName.value;
        }

        if (description.value !== null) {
            mlpObject.value.description = description.value;
        }

        mlpObject.value.category = mlpCategory.value;

        if (mlpValue.value !== null) {
            mlpObject.value.value = mlpValue.value;
        }

        if (props.newMlp) {
            if (props.parentElement.modelType === 'Submodel') {
                // Create the MLP on the parent Submodel
                await postSubmodelElement(mlpObject.value, props.parentElement.id);

                // Navigate to the new MLP
                const query = structuredClone(route.query);
                query.path = props.parentElement.path + '/submodel-elements/' + mlpObject.value.idShort;

                router.push({
                    query: query,
                });
            } else {
                // Extract the submodel ID and the idShortPath from the parentElement path
                const splitted = props.parentElement.path.split('/submodel-elements/');
                const submodelId = base64Decode(splitted[0].split('/submodels/')[1]);
                const idShortPath = splitted[1];

                // Create the MLP on the parent element
                await postSubmodelElement(mlpObject.value, submodelId, idShortPath);

                // Navigate to the new MLP
                if (props.parentElement.modelType === 'SubmodelElementCollection') {
                    const query = structuredClone(route.query);
                    query.path = props.parentElement.path + '.' + mlpObject.value.idShort;

                    router.push({
                        query: query,
                    });
                }
            }
        } else {
            if (props.path == undefined) {
                console.error('MLP Path is missing');
                return;
            }

            const editedElementSelected = route.query.path === props.path;

            // Update the MLP
            if (props.parentElement.modelType === 'Submodel') {
                await putSubmodelElement(mlpObject.value, props.path);

                if (editedElementSelected) {
                    fetchAndDispatchSme(props.parentElement.path + '/submodel-elements/' + mlpObject.value.idShort);
                }
            } else if (props.parentElement.modelType === 'SubmodelElementList') {
                const index = props.parentElement.value.indexOf(
                    props.parentElement.value.find((el: any) => el.id === props.mlp.id)
                );
                const path = props.parentElement.path + `%5B${index}%5D`;
                await putSubmodelElement(mlpObject.value, path);

                if (editedElementSelected) {
                    fetchAndDispatchSme(path);
                }
            } else {
                // Submodel Element Collection or Entity
                await putSubmodelElement(mlpObject.value, props.mlp.path);

                if (editedElementSelected) {
                    fetchAndDispatchSme(props.parentElement.path + '.' + mlpObject.value.idShort);
                }
            }
        }
        closeDialog();
        navigationStore.dispatchTriggerTreeviewReload();
    }

    function closeDialog(): void {
        editMLPDialog.value = false;
    }

    async function initializeInputs(): Promise<void> {
        if (!props.newMlp && props.mlp) {
            const mlpJSON = await fetchSme(props.mlp.path);

            const instanceOrError = jsonization.multiLanguagePropertyFromJsonable(mlpJSON);
            if (instanceOrError.error !== null) {
                console.error('Error parsing MultiLanguageProperty: ', instanceOrError.error);
                return;
            }
            mlpObject.value = instanceOrError.mustValue();

            mlpIdShort.value = mlpObject.value.idShort;
            if (mlpObject.value.displayName) {
                displayName.value = mlpObject.value.displayName;
            }
            if (mlpObject.value.description) {
                description.value = mlpObject.value.description;
            }
            if (mlpObject.value.category) {
                mlpCategory.value = mlpObject.value.category;
            }
            if (mlpObject.value.value) {
                mlpValue.value = mlpObject.value.value;
            }
            if (mlpObject.value.semanticId) {
                semanticId.value = mlpObject.value.semanticId;
            }
            openPanels.value = [0, 1];
        } else {
            mlpIdShort.value = null;
            displayName.value = null;
            description.value = null;
            mlpCategory.value = null;
            mlpValue.value = null;
            semanticId.value = null;
            openPanels.value = [0, 1];
        }
    }
</script>
