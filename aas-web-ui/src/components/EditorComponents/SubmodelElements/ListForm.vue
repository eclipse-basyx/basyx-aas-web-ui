<template>
    <v-dialog v-model="editSMLDialog" width="860" persistent @keydown="keyDown" @keyup="keyUp($event, saveSML)">
        <v-card>
            <v-card-title>
                <span class="text-subtile-1">{{
                    props.newSml ? 'Create a new Submodel Element List' : 'Edit Submodel Element List'
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
                                        v-model="smlIdShort"
                                        label="IdShort"
                                        :error="hasError('idShort')"
                                        :rules="[rules.required]"
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
                                        v-model="smlCategory"
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
                    <!-- Options -->
                    <v-expansion-panel class="border-s-thin border-e-thin" :class="bordersToShow(1)">
                        <v-expansion-panel-title>Options</v-expansion-panel-title>
                        <v-expansion-panel-text>
                            <v-row align="center">
                                <v-col class="py-0">
                                    <BooleanInput v-model="orderRelevant" label="Order Relevant"></BooleanInput>
                                </v-col>
                                <v-col cols="auto" class="px-0">
                                    <HelpInfoButton help-type="sml-orderRelevant" />
                                </v-col>
                            </v-row>
                            <v-row align="center">
                                <v-col class="py-0">
                                    <SelectInput
                                        v-model="typeValueListElement"
                                        label="Element Type"
                                        type="elementType"
                                        :clearable="true" />
                                </v-col>
                                <v-col cols="auto" class="px-0">
                                    <HelpInfoButton help-type="sml-typeValueListElement" />
                                </v-col>
                            </v-row>
                            <v-row align="center">
                                <v-col class="py-0">
                                    <SelectInput
                                        v-model="valueTypeListElement"
                                        label="Data Type"
                                        type="dataType"
                                        :clearable="true" />
                                </v-col>
                                <v-col cols="auto" class="px-0">
                                    <HelpInfoButton help-type="sml-valueTypeListElement" />
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
                <v-btn color="primary" @click="saveSML">Save</v-btn>
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
        newSml: boolean;
        parentElement: any;
        path?: string;
        sml?: any;
    }>();

    // Stores
    const navigationStore = useNavigationStore();

    // Composables
    const { fetchSme, putSubmodelElement, postSubmodelElement } = useSMRepositoryClient();
    const { fetchAndDispatchSme } = useSMEHandling();

    // Vue Router
    const router = useRouter();
    const route = useRoute();

    const editSMLDialog = ref(false);
    const smlObject = ref<aasTypes.SubmodelElementList | undefined>(undefined);
    const openPanels = ref<number[]>([0, 1]);

    const smlIdShort = ref<string | null>(null);

    const displayName = ref<Array<aasTypes.LangStringNameType> | null>(null);
    const description = ref<Array<aasTypes.LangStringTextType> | null>(null);
    const smlCategory = ref<string | null>(null);

    const orderRelevant = ref<boolean>(false);
    const valueTypeListElement = ref<aasTypes.DataTypeDefXsd>(aasTypes.DataTypeDefXsd.String);
    const typeValueListElement = ref<aasTypes.AasSubmodelElements | null>(null);

    const semanticId = ref<aasTypes.Reference | null>(null);

    const errors = ref<Map<string, string>>(new Map());

    const rules = {
        required: (value: any) => !!value || 'Required.',
    };

    const emit = defineEmits<{
        (event: 'update:modelValue', value: boolean): void;
    }>();

    watch(
        () => props.modelValue,
        (value) => {
            editSMLDialog.value = value;
            if (value) {
                initializeInputs();
            }
        }
    );

    watch(
        () => editSMLDialog.value,
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
                    border += ' border-t-thin';
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

    async function initializeInputs(): Promise<void> {
        if (!props.newSml && props.sml) {
            const smlJSON = await fetchSme(props.sml.path);

            const instanceOrError = jsonization.submodelElementListFromJsonable(smlJSON);

            if (instanceOrError.error !== null) {
                console.error('Error parsing SubmodelElementList: ', instanceOrError.error);
                return;
            }
            smlObject.value = instanceOrError.mustValue();

            smlIdShort.value = smlObject.value.idShort;

            if (smlObject.value.displayName) {
                displayName.value = smlObject.value.displayName;
            }

            if (smlObject.value.description) {
                description.value = smlObject.value.description;
            }

            if (smlObject.value.category) {
                smlCategory.value = smlObject.value.category;
            }

            if (smlObject.value.orderRelevant !== null) {
                orderRelevant.value = smlObject.value.orderRelevant;
            } else {
                orderRelevant.value = false;
            }

            if (smlObject.value.typeValueListElement) {
                typeValueListElement.value = smlObject.value.typeValueListElement;
            }

            if (smlObject.value.valueTypeListElement) {
                valueTypeListElement.value = smlObject.value.valueTypeListElement;
            }

            if (smlObject.value.semanticId) {
                semanticId.value = smlObject.value.semanticId;
            }

            openPanels.value = [0, 1];
        } else {
            smlIdShort.value = null;
            displayName.value = null;
            description.value = null;
            smlCategory.value = null;
            orderRelevant.value = false;
            typeValueListElement.value = null;
            valueTypeListElement.value = aasTypes.DataTypeDefXsd.String;
            semanticId.value = null;
            openPanels.value = [0, 1];
        }
    }

    async function saveSML(): Promise<void> {
        if (props.newSml || smlObject.value === undefined) {
            smlObject.value = new aasTypes.SubmodelElementList(aasTypes.AasSubmodelElements.SubmodelElement);
        }

        if (smlIdShort.value !== null) {
            smlObject.value.idShort = smlIdShort.value;
        } else {
            errors.value.set('idShort', 'SubmodelElementList IdShort is required');
            return;
        }

        if (semanticId.value !== null) {
            smlObject.value.semanticId = semanticId.value;
        }

        if (displayName.value !== null) {
            smlObject.value.displayName = displayName.value;
        }

        if (description.value !== null) {
            smlObject.value.description = description.value;
        }

        smlObject.value.category = smlCategory.value;

        smlObject.value.orderRelevant = orderRelevant.value;

        if (typeValueListElement.value !== null) {
            smlObject.value.typeValueListElement = typeValueListElement.value;
        }

        if (valueTypeListElement.value !== null) {
            smlObject.value.valueTypeListElement = valueTypeListElement.value;
        }

        if (props.newSml) {
            if (props.parentElement.modelType === 'Submodel') {
                // Create the SML on the parent Submodel
                await postSubmodelElement(smlObject.value, props.parentElement.id);

                // Navigate to the new SML
                const query = structuredClone(route.query);
                query.path = props.parentElement.path + '/submodel-elements/' + smlObject.value.idShort;

                router.push({
                    query: query,
                });
            } else {
                // Extract the submodel ID and the idShortPath from the parentElement path
                const splitted = props.parentElement.path.split('/submodel-elements/');
                const submodelId = base64Decode(splitted[0].split('/submodels/')[1]);
                const idShortPath = splitted[1];

                // Create the SML on the parent element
                await postSubmodelElement(smlObject.value, submodelId, idShortPath);

                // Navigate to the new SML
                if (props.parentElement.modelType === 'SubmodelElementCollection') {
                    const query = structuredClone(route.query);
                    query.path = props.parentElement.path + '.' + smlObject.value.idShort;

                    router.push({
                        query: query,
                    });
                }
            }
        } else {
            if (props.path == undefined) {
                console.error('SML Path is missing');
                return;
            }

            const editedElementSelected = route.query.path === props.path;

            // Update the SML
            if (props.parentElement.modelType === 'Submodel') {
                await putSubmodelElement(smlObject.value, props.path);

                if (editedElementSelected) {
                    fetchAndDispatchSme(props.parentElement.path + '/submodel-elements/' + smlObject.value.idShort);
                }
            } else if (props.parentElement.modelType === 'SubmodelElementList') {
                const index = props.parentElement.value.indexOf(
                    props.parentElement.value.find((el: any) => el.id === props.sml.id)
                );
                const path = props.parentElement.path + `%5B${index}%5D`;
                await putSubmodelElement(smlObject.value, path);

                if (editedElementSelected) {
                    fetchAndDispatchSme(path);
                }
            } else {
                // Submodel Element Collection or Entity
                await putSubmodelElement(smlObject.value, props.sml.path);

                if (editedElementSelected) {
                    fetchAndDispatchSme(props.parentElement.path + '.' + smlObject.value.idShort);
                }
            }
        }
        closeDialog();
        navigationStore.dispatchTriggerTreeviewReload();
    }

    function closeDialog(): void {
        editSMLDialog.value = false;
    }
</script>
