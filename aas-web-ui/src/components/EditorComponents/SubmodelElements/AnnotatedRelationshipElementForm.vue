<template>
    <v-dialog
        v-model="editAnnotatedRelationshipElementDialog"
        width="860"
        persistent
        @keydown="keyDown"
        @keyup="keyUp($event, saveAnnotatedRelationshipElement)">
        <v-card>
            <v-card-title>
                <span class="text-subtile-1">
                    {{
                        props.newAnnotatedRelationshipElement
                            ? 'Create a new Annotated Relationship Element'
                            : 'Edit Annotated Relationship Element'
                    }}
                </span>
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
                                        v-model="annotatedRelationshipElementIdShort"
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
                                        v-model="annotatedRelationshipElementCategory"
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
                                    <ReferenceInput v-model="firstReference" label="First" :no-header="false" />
                                </v-col>
                                <v-col cols="auto" class="px-0">
                                    <HelpInfoButton help-type="relationship-first" />
                                </v-col>
                            </v-row>
                            <v-row align="center">
                                <v-col class="py-0">
                                    <ReferenceInput v-model="secondReference" label="Second" :no-header="false" />
                                </v-col>
                                <v-col cols="auto" class="px-0">
                                    <HelpInfoButton help-type="relationship-second" />
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
                <v-btn color="primary" @click="saveAnnotatedRelationshipElement">Save</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
    import { jsonization, types as aasTypes } from '@aas-core-works/aas-core3.1-typescript';
    import { computed, ref, watch } from 'vue';
    import { useRoute, useRouter } from 'vue-router';
    import { useSMEHandling } from '@/composables/AAS/SMEHandling';
    import { useSMRepositoryClient } from '@/composables/Client/SMRepositoryClient';
    import { useNavigationStore } from '@/store/NavigationStore';
    import { getCreatedSubmodelElementPath } from '@/utils/AAS/SubmodelElementPathUtils';
    import { keyDown, keyUp } from '@/utils/EditorUtils';
    import { base64Decode } from '@/utils/EncodeDecodeUtils';

    const props = defineProps<{
        modelValue: boolean;
        newAnnotatedRelationshipElement: boolean;
        parentElement: any;
        path?: string;
        annotatedRelationshipElement?: any;
    }>();

    // Stores
    const navigationStore = useNavigationStore();

    // Composables
    const { fetchSme, putSubmodelElement, postSubmodelElement } = useSMRepositoryClient();
    const { fetchAndDispatchSme } = useSMEHandling();

    // Vue Router
    const router = useRouter();
    const route = useRoute();

    const editAnnotatedRelationshipElementDialog = ref(false);
    const annotatedRelationshipElementObject = ref<aasTypes.AnnotatedRelationshipElement | undefined>(undefined);
    const openPanels = ref<number[]>([0]);

    const annotatedRelationshipElementIdShort = ref<string | null>(null);
    const displayName = ref<Array<aasTypes.LangStringNameType> | null>(null);
    const description = ref<Array<aasTypes.LangStringTextType> | null>(null);
    const annotatedRelationshipElementCategory = ref<string | null>(null);

    const semanticId = ref<aasTypes.Reference | null>(null);
    const firstReference = ref<aasTypes.Reference | null>(null);
    const secondReference = ref<aasTypes.Reference | null>(null);

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
            editAnnotatedRelationshipElementDialog.value = value;
            if (value) {
                initializeInputs();
            }
        }
    );

    watch(
        () => editAnnotatedRelationshipElementDialog.value,
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

    async function saveAnnotatedRelationshipElement(): Promise<void> {
        // Clear previous errors
        errors.value.clear();

        if (props.newAnnotatedRelationshipElement || annotatedRelationshipElementObject.value === undefined) {
            annotatedRelationshipElementObject.value = new aasTypes.AnnotatedRelationshipElement();
        }

        if (annotatedRelationshipElementIdShort.value !== null) {
            annotatedRelationshipElementObject.value.idShort = annotatedRelationshipElementIdShort.value;
        } else if (!isParentSubmodelElementList.value) {
            errors.value.set('idShort', 'Annotated Relationship Element IdShort is required');
            return;
        }

        annotatedRelationshipElementObject.value.first = firstReference.value;
        annotatedRelationshipElementObject.value.second = secondReference.value;

        if (semanticId.value !== null) {
            annotatedRelationshipElementObject.value.semanticId = semanticId.value;
        }

        if (displayName.value !== null) {
            annotatedRelationshipElementObject.value.displayName = displayName.value;
        }

        if (description.value !== null) {
            annotatedRelationshipElementObject.value.description = description.value;
        }

        annotatedRelationshipElementObject.value.category = annotatedRelationshipElementCategory.value;

        if (props.newAnnotatedRelationshipElement) {
            if (props.parentElement.modelType === 'Submodel') {
                // Create the annotated relationship element on the parent Submodel
                await postSubmodelElement(annotatedRelationshipElementObject.value, props.parentElement.id);
            } else {
                // Extract the submodel ID and the idShortPath from the parentElement path
                const splitted = props.parentElement.path.split('/submodel-elements/');
                const submodelId = base64Decode(splitted[0].split('/submodels/')[1]);
                const idShortPath = splitted[1];

                // Create the annotated relationship element on the parent element
                await postSubmodelElement(annotatedRelationshipElementObject.value, submodelId, idShortPath);
            }

            const createdPath = getCreatedSubmodelElementPath(
                props.parentElement,
                annotatedRelationshipElementObject.value.idShort
            );

            if (createdPath) {
                const query = structuredClone(route.query);
                query.path = createdPath;
                router.push({
                    query: query,
                });
            }
        } else {
            if (props.path == undefined) {
                console.error('Annotated Relationship Element Path is missing');
                return;
            }

            const editedElementSelected = route.query.path === props.path;

            // Update the annotated relationship element
            if (props.parentElement.modelType === 'Submodel') {
                await putSubmodelElement(annotatedRelationshipElementObject.value, props.path);

                if (editedElementSelected) {
                    fetchAndDispatchSme(
                        props.parentElement.path +
                            '/submodel-elements/' +
                            annotatedRelationshipElementObject.value.idShort
                    );
                }
            } else if (props.parentElement.modelType === 'SubmodelElementList') {
                const index = props.parentElement.value.indexOf(
                    props.parentElement.value.find((el: any) => el.id === props.annotatedRelationshipElement.id)
                );
                const path = props.parentElement.path + `%5B${index}%5D`;
                await putSubmodelElement(annotatedRelationshipElementObject.value, path);

                if (editedElementSelected) {
                    fetchAndDispatchSme(path);
                }
            } else {
                // Submodel Element Collection, Entity or AnnotatedRelationshipElement
                await putSubmodelElement(
                    annotatedRelationshipElementObject.value,
                    props.annotatedRelationshipElement.path
                );

                if (editedElementSelected) {
                    fetchAndDispatchSme(
                        props.parentElement.path + '.' + annotatedRelationshipElementObject.value.idShort
                    );
                }
            }
        }
        closeDialog();
        navigationStore.dispatchTriggerTreeviewReload();
    }

    function closeDialog(): void {
        editAnnotatedRelationshipElementDialog.value = false;
    }

    function resetFormValues(): void {
        annotatedRelationshipElementIdShort.value = null;
        displayName.value = null;
        description.value = null;
        annotatedRelationshipElementCategory.value = null;
        semanticId.value = null;
        firstReference.value = null;
        secondReference.value = null;
        openPanels.value = [0, 1];
    }

    async function initializeInputs(): Promise<void> {
        // Always reset form values first to clear any stale data from previously opened elements
        resetFormValues();

        if (!props.newAnnotatedRelationshipElement && props.annotatedRelationshipElement) {
            const annotatedRelationshipElementJSON = await fetchSme(props.annotatedRelationshipElement.path);

            const instanceOrError = jsonization.annotatedRelationshipElementFromJsonable(
                annotatedRelationshipElementJSON
            );
            if (instanceOrError.error !== null) {
                console.error('Error parsing Annotated Relationship Element: ', instanceOrError.error);
                return;
            }
            annotatedRelationshipElementObject.value = instanceOrError.mustValue();

            annotatedRelationshipElementIdShort.value = annotatedRelationshipElementObject.value.idShort ?? null;
            displayName.value = annotatedRelationshipElementObject.value.displayName ?? null;
            description.value = annotatedRelationshipElementObject.value.description ?? null;
            annotatedRelationshipElementCategory.value = annotatedRelationshipElementObject.value.category ?? null;
            semanticId.value = annotatedRelationshipElementObject.value.semanticId ?? null;
            firstReference.value = annotatedRelationshipElementObject.value.first ?? null;
            secondReference.value = annotatedRelationshipElementObject.value.second ?? null;
        }
    }
</script>
