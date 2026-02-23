<template>
    <v-dialog v-model="editSMCDialog" width="860" persistent @keydown="keyDown" @keyup="keyUp($event, saveSMC)">
        <v-card>
            <v-card-title>
                {{ props.newSmc ? 'Create a new Submodel Element Collection' : 'Edit Submodel Element Collection' }}
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
                                        v-model="smcIdShort"
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
                                        v-model="smcCategory"
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
                    <!-- Semantic ID -->
                    <v-expansion-panel class="border-s-thin border-e-thin" :class="bordersToShow(1)">
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
                    <v-expansion-panel class="border-b-thin border-s-thin border-e-thin" :class="bordersToShow(2)">
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
                <v-btn color="primary" @click="saveSMC">Save</v-btn>
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
    import { applyFieldErrors, buildVerificationSummary, verifyForEditor } from '@/composables/MetamodelVerification';
    import { useNavigationStore } from '@/store/NavigationStore';
    import { getCreatedSubmodelElementPath } from '@/utils/AAS/SubmodelElementPathUtils';
    import { keyDown, keyUp } from '@/utils/EditorUtils';
    import { base64Decode } from '@/utils/EncodeDecodeUtils';

    const props = defineProps<{
        modelValue: boolean;
        newSmc: boolean;
        parentElement: any;
        path?: string;
        smc?: any;
    }>();

    // Stores
    const navigationStore = useNavigationStore();

    // Composables
    const { fetchSme, putSubmodelElement, postSubmodelElement } = useSMRepositoryClient();
    const { fetchAndDispatchSme } = useSMEHandling();

    // Vue Router
    const router = useRouter();
    const route = useRoute();

    const editSMCDialog = ref(false);
    const smcObject = ref<aasTypes.SubmodelElementCollection | undefined>(undefined);
    const openPanels = ref<number[]>([0]);

    const smcIdShort = ref<string | null>(null);

    const displayName = ref<Array<aasTypes.LangStringNameType> | null>(null);
    const description = ref<Array<aasTypes.LangStringTextType> | null>(null);
    const smcCategory = ref<string | null>(null);

    const semanticId = ref<aasTypes.Reference | null>(null);
    //const smcValue = ref<string | null>(null);

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
            editSMCDialog.value = value;
            if (value) {
                initializeInputs();
            }
        }
    );

    watch(
        () => editSMCDialog.value,
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

    async function saveSMC(): Promise<void> {
        errors.value.clear();

        if (props.newSmc || smcObject.value === undefined) {
            smcObject.value = new aasTypes.SubmodelElementCollection();
        }

        const normalizedIdShort = smcIdShort.value?.trim() ?? null;
        if (normalizedIdShort) {
            smcObject.value.idShort = normalizedIdShort;
        } else if (!isParentSubmodelElementList.value) {
            errors.value.set('idShort', 'SubmodelElementCollection IdShort is required');
            return;
        } else {
            (smcObject.value as Record<string, unknown>).idShort = null;
        }

        if (semanticId.value !== null) {
            smcObject.value.semanticId = semanticId.value;
        }

        if (displayName.value !== null) {
            smcObject.value.displayName = displayName.value;
        }

        if (description.value !== null) {
            smcObject.value.description = description.value;
        }

        smcObject.value.category = smcCategory.value;

        const verificationResult = verifyForEditor(smcObject.value, { maxErrors: 10 });
        if (!verificationResult.isValid) {
            applyFieldErrors(errors.value, verificationResult.fieldErrors);
            const summary = buildVerificationSummary(verificationResult);
            const firstError = verificationResult.globalErrors[0];
            navigationStore.dispatchSnackbar({
                status: true,
                timeout: 10000,
                color: 'error',
                btnColor: 'buttonText',
                baseError: 'Collection validation failed',
                extendedError: firstError ? `${summary} ${firstError}` : summary,
            });
            return;
        }

        if (props.newSmc) {
            if (props.parentElement.modelType === 'Submodel') {
                // Create the smc on the parent Submodel
                await postSubmodelElement(smcObject.value, props.parentElement.id);

                // Navigate to the new smc
                const query = structuredClone(route.query);
                query.path = props.parentElement.path + '/submodel-elements/' + smcObject.value.idShort;

                router.push({
                    query: query,
                });
            } else {
                // Extract the submodel ID and the idShortPath from the parentElement path
                const splitted = props.parentElement.path.split('/submodel-elements/');
                const submodelId = base64Decode(splitted[0].split('/submodels/')[1]);
                const idShortPath = splitted[1];

                // Create the smc on the parent element
                await postSubmodelElement(smcObject.value, submodelId, idShortPath);

                const createdPath = getCreatedSubmodelElementPath(props.parentElement, smcObject.value.idShort);
                if (createdPath) {
                    const query = structuredClone(route.query);
                    query.path = createdPath;

                    router.push({
                        query: query,
                    });
                }
            }
        } else {
            if (props.path == undefined) {
                console.error('SMC Path is missing');
                return;
            }

            const editedElementSelected = route.query.path === props.path;

            // Update the smc
            if (props.parentElement.modelType === 'Submodel') {
                await putSubmodelElement(smcObject.value, props.path);

                if (editedElementSelected) {
                    fetchAndDispatchSme(props.parentElement.path + '/submodel-elements/' + smcObject.value.idShort);
                }
            } else if (props.parentElement.modelType === 'SubmodelElementList') {
                const index = props.parentElement.value.indexOf(
                    props.parentElement.value.find((el: any) => el.id === props.smc.id)
                );
                const path = props.parentElement.path + `%5B${index}%5D`;
                await putSubmodelElement(smcObject.value, path);

                if (editedElementSelected) {
                    fetchAndDispatchSme(path);
                }
            } else {
                // Submodel Element Collection or Entity
                await putSubmodelElement(smcObject.value, props.smc.path);

                if (editedElementSelected) {
                    fetchAndDispatchSme(props.parentElement.path + '.' + smcObject.value.idShort);
                }
            }
        }
        closeDialog();
        navigationStore.dispatchTriggerTreeviewReload();
    }

    function closeDialog(): void {
        editSMCDialog.value = false;
    }

    function resetFormValues(): void {
        smcIdShort.value = null;
        displayName.value = null;
        description.value = null;
        smcCategory.value = null;
        semanticId.value = null;
        openPanels.value = [0];
    }

    async function initializeInputs(): Promise<void> {
        // Always reset form values first to clear any stale data from previously opened elements
        resetFormValues();

        if (!props.newSmc && props.smc) {
            const smcJSON = await fetchSme(props.smc.path);

            const instanceOrError = jsonization.submodelElementCollectionFromJsonable(smcJSON);
            if (instanceOrError.error !== null) {
                console.error('Error parsing SubmodelElementCollection: ', instanceOrError.error);
                return;
            }
            smcObject.value = instanceOrError.mustValue();

            smcIdShort.value = smcObject.value.idShort ?? null;
            displayName.value = smcObject.value.displayName ?? null;
            description.value = smcObject.value.description ?? null;
            smcCategory.value = smcObject.value.category ?? null;
            semanticId.value = smcObject.value.semanticId ?? null;
        }
    }
</script>
