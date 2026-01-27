<template>
    <v-dialog
        v-model="editReferenceElementDialog"
        width="860"
        persistent
        @keydown="keyDown"
        @keyup="keyUp($event, saveReferenceElement)">
        <v-card>
            <v-card-title>
                <span class="text-subtile-1">{{
                    props.newReferenceElement ? 'Create a new Reference Element' : 'Edit Reference Element'
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
                                        v-model="referenceElementIdShort"
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
                                        v-model="referenceElementCategory"
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
                    <!-- Value -->
                    <v-expansion-panel class="border-s-thin border-e-thin" :class="bordersToShow(1)">
                        <v-expansion-panel-title>Value</v-expansion-panel-title>
                        <v-expansion-panel-text>
                            <v-row align="center">
                                <v-col class="py-0">
                                    <ReferenceInput
                                        v-model="referenceElementValue"
                                        label="Reference"
                                        :no-header="true" />
                                </v-col>
                                <v-col cols="auto" class="px-0">
                                    <HelpInfoButton help-type="reference-value" />
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
                <v-btn color="primary" @click="saveReferenceElement">Save</v-btn>
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
        newReferenceElement: boolean;
        parentElement: any;
        path?: string;
        referenceElement?: any;
    }>();

    // Stores
    const navigationStore = useNavigationStore();

    // Composables
    const { fetchSme, putSubmodelElement, postSubmodelElement } = useSMRepositoryClient();
    const { fetchAndDispatchSme } = useSMEHandling();

    // Vue Router
    const router = useRouter();
    const route = useRoute();

    const editReferenceElementDialog = ref(false);
    const referenceElementObject = ref<aasTypes.ReferenceElement | undefined>(undefined);
    const openPanels = ref<number[]>([0]);

    const referenceElementIdShort = ref<string | null>(null);
    const displayName = ref<Array<aasTypes.LangStringNameType> | null>(null);
    const description = ref<Array<aasTypes.LangStringTextType> | null>(null);
    const referenceElementCategory = ref<string | null>(null);

    const semanticId = ref<aasTypes.Reference | null>(null);
    const referenceElementValue = ref<aasTypes.Reference | null>(null);

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
            editReferenceElementDialog.value = value;
            if (value) {
                initializeInputs();
            }
        }
    );

    watch(
        () => editReferenceElementDialog.value,
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

    async function saveReferenceElement(): Promise<void> {
        // Clear previous errors
        errors.value.clear();

        if (props.newReferenceElement || referenceElementObject.value === undefined) {
            referenceElementObject.value = new aasTypes.ReferenceElement();
        }

        if (referenceElementIdShort.value !== null) {
            referenceElementObject.value.idShort = referenceElementIdShort.value;
        } else if (!isParentSubmodelElementList.value) {
            errors.value.set('idShort', 'Reference Element IdShort is required');
            return;
        }

        referenceElementObject.value.value = referenceElementValue.value;

        if (semanticId.value !== null) {
            referenceElementObject.value.semanticId = semanticId.value;
        }

        if (displayName.value !== null) {
            referenceElementObject.value.displayName = displayName.value;
        }

        if (description.value !== null) {
            referenceElementObject.value.description = description.value;
        }

        referenceElementObject.value.category = referenceElementCategory.value;

        if (props.newReferenceElement) {
            if (props.parentElement.modelType === 'Submodel') {
                // Create the reference element on the parent Submodel
                await postSubmodelElement(referenceElementObject.value, props.parentElement.id);

                // Navigate to the new reference element
                const query = structuredClone(route.query);
                query.path = props.parentElement.path + '/submodel-elements/' + referenceElementObject.value.idShort;

                router.push({
                    query: query,
                });
            } else {
                // Extract the submodel ID and the idShortPath from the parentElement path
                const splitted = props.parentElement.path.split('/submodel-elements/');
                const submodelId = base64Decode(splitted[0].split('/submodels/')[1]);
                const idShortPath = splitted[1];

                // Create the reference element on the parent element
                await postSubmodelElement(referenceElementObject.value, submodelId, idShortPath);

                // Navigate to the new reference element
                if (props.parentElement.modelType === 'SubmodelElementCollection') {
                    const query = structuredClone(route.query);
                    query.path = props.parentElement.path + '.' + referenceElementObject.value.idShort;

                    router.push({
                        query: query,
                    });
                }
            }
        } else {
            if (props.path == undefined) {
                console.error('Reference Element Path is missing');
                return;
            }

            const editedElementSelected = route.query.path === props.path;

            // Update the reference element
            if (props.parentElement.modelType === 'Submodel') {
                await putSubmodelElement(referenceElementObject.value, props.path);

                if (editedElementSelected) {
                    fetchAndDispatchSme(
                        props.parentElement.path + '/submodel-elements/' + referenceElementObject.value.idShort
                    );
                }
            } else if (props.parentElement.modelType === 'SubmodelElementList') {
                const index = props.parentElement.value.indexOf(
                    props.parentElement.value.find((el: any) => el.id === props.referenceElement.id)
                );
                const path = props.parentElement.path + `%5B${index}%5D`;
                await putSubmodelElement(referenceElementObject.value, path);

                if (editedElementSelected) {
                    fetchAndDispatchSme(path);
                }
            } else {
                // Submodel Element Collection or Entity
                await putSubmodelElement(referenceElementObject.value, props.referenceElement.path);

                if (editedElementSelected) {
                    fetchAndDispatchSme(props.parentElement.path + '.' + referenceElementObject.value.idShort);
                }
            }
        }
        closeDialog();
        navigationStore.dispatchTriggerTreeviewReload();
    }

    function closeDialog(): void {
        editReferenceElementDialog.value = false;
    }

    async function initializeInputs(): Promise<void> {
        if (!props.newReferenceElement && props.referenceElement) {
            const referenceElementJSON = await fetchSme(props.referenceElement.path);

            const instanceOrError = jsonization.referenceElementFromJsonable(referenceElementJSON);
            if (instanceOrError.error !== null) {
                console.error('Error parsing Reference Element: ', instanceOrError.error);
                return;
            }
            referenceElementObject.value = instanceOrError.mustValue();

            referenceElementIdShort.value = referenceElementObject.value.idShort;
            if (referenceElementObject.value.displayName) {
                displayName.value = referenceElementObject.value.displayName;
            }
            if (referenceElementObject.value.description) {
                description.value = referenceElementObject.value.description;
            }
            if (referenceElementObject.value.category) {
                referenceElementCategory.value = referenceElementObject.value.category;
            }
            if (referenceElementObject.value.semanticId) {
                semanticId.value = referenceElementObject.value.semanticId;
            }
            if (referenceElementObject.value.value) {
                referenceElementValue.value = referenceElementObject.value.value;
            }
            openPanels.value = [0, 1];
        } else {
            referenceElementIdShort.value = null;
            displayName.value = null;
            description.value = null;
            referenceElementCategory.value = null;
            semanticId.value = null;
            referenceElementValue.value = null;
            openPanels.value = [0, 1];
        }
    }
</script>
