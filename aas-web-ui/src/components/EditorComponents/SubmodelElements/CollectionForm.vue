<template>
    <v-dialog v-model="editSMCDialog" width="860" persistent>
        <v-card>
            <v-card-title>
                <span class="text-subtile-1">{{ props.newSmc ? 'Create a new Submodel Element Collection' : 'Edit Submodel Element Collection' }}</span>
            </v-card-title>
            <v-divider></v-divider>
            <v-card-text style="overflow-y: auto" class="pa-3 bg-card">
                <v-expansion-panels v-model="openPanels" multiple>
                    <!-- Details -->
                    <v-expansion-panel class="border-t-thin border-s-thin border-e-thin" :class="bordersToShow(0)">
                        <v-expansion-panel-title>Details</v-expansion-panel-title>
                        <v-expansion-panel-text>
                            <TextInput
                                v-model="smcIdShort"
                                label="IdShort"
                                :error="hasError('idShort')"
                                :rules="[rules.required]"
                                :error-messages="getError('idShort')" />
                            <MultiLanguageTextInput v-model="displayName" label="Display Name" type="displayName" />
                            <MultiLanguageTextInput v-model="description" label="Description" type="description" />
                            <SelectInput
                                v-model="smcCategory"
                                label="Category"
                                type="category"
                                :clearable="true" />
                        </v-expansion-panel-text>
                    </v-expansion-panel>
                    <!-- Semantic ID -->
                    <v-expansion-panel class="border-s-thin border-e-thin" :class="bordersToShow(1)">
                        <v-expansion-panel-title>Semantic ID</v-expansion-panel-title>
                        <v-expansion-panel-text>
                            <ReferenceInput v-model="semanticId" label="Semantic ID" :no-header="true" />
                        </v-expansion-panel-text>
                    </v-expansion-panel>                   
                    <!-- TODO: What are Extensions?  -->
                    <v-expansion-panel class="border-s-thin border-e-thin" :class="bordersToShow(3)">
                        <v-expansion-panel-title>Extensions</v-expansion-panel-title>
                        <v-expansion-panel-text>
                            <span class="text-subtitleText text-subtitle-2">Coming soon!</span>
                        </v-expansion-panel-text>
                    </v-expansion-panel>
                    <v-expansion-panel class="border-b-thin border-s-thin border-e-thin" :class="bordersToShow(4)">
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
    import { jsonization, types as aasTypes } from '@aas-core-works/aas-core3.0-typescript';
    import { computed, ref, watch } from 'vue';
    import { useRoute, useRouter } from 'vue-router';
    import { useSMRepositoryClient } from '@/composables/Client/SMRepositoryClient';
    import { useAASStore } from '@/store/AASDataStore';
    import { useNavigationStore } from '@/store/NavigationStore';
    import { extractEndpointHref } from '@/utils/AAS/DescriptorUtils';
    import { base64Decode } from '@/utils/EncodeDecodeUtils';

    const props = defineProps<{
        modelValue: boolean;
        newSmc: boolean;
        parentElement: any;
        path?: string;
        property?: any;
    }>();

    // Stores
    const navigationStore = useNavigationStore();
    const aasStore = useAASStore();

    // Composables
    const { fetchSme, putSubmodelElement, postSubmodelElement } = useSMRepositoryClient();

    // Vue Router
    const router = useRouter();
    const route = useRoute();

    const editSMCDialog = ref(false);
    const openPanels = ref<number[]>([0]);

    const smcIdShort = ref<string | null>(null);

    const displayName = ref<Array<aasTypes.LangStringNameType> | null>(null);
    const description = ref<Array<aasTypes.LangStringTextType> | null>(null);
    const smcCategory = ref<string | null>(null);

    const semanticId = ref<aasTypes.Reference | null>(null);
    //const smcValue = ref<string | null>(null);

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

    const selectedAAS = computed(() => aasStore.getSelectedAAS); // Get the selected AAS from Store

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
                if (openPanels.value.includes(3) || openPanels.value.includes(4)) {
                    border += ' border-b-thin';
                }
                break;
            case 4:
                if (openPanels.value.includes(3) || openPanels.value.includes(4)) {
                    border = 'border-t-thin';
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
        const smc: aasTypes.SubmodelElementCollection = new aasTypes.SubmodelElementCollection();
        if (smcIdShort.value !== null) {
            smc.idShort = smcIdShort.value;
        } else {
            errors.value.set('idShort', 'Property IdShort is required');
            return;
        }
        if (semanticId.value !== null) {
            smc.semanticId = semanticId.value;
        }
        if (displayName.value !== null) {
            smc.displayName = displayName.value;
        }
        if (description.value !== null) {
            smc.description = description.value;
        }
        if (smcCategory.value !== null) {
            smc.category = smcCategory.value;
        }
        if (props.newSmc) {
            if (props.parentElement.modelType === 'Submodel') {
                // Create the property on the parent Submodel
                await postSubmodelElement(smc, props.parentElement.id);

                const aasEndpoint = extractEndpointHref(selectedAAS.value, 'AAS-3.0');

                // Navigate to the new property
                router.push({
                    query: {
                        aas: aasEndpoint,
                        path: props.parentElement.path + '/submodel-elements/' + smc.idShort,
                    },
                });
            } else {
                // Extract the submodel ID and the idShortPath from the parentElement path
                const splitted = props.parentElement.path.split('/submodel-elements/');
                const submodelId = base64Decode(splitted[0].split('/submodels/')[1]);
                const idShortPath = splitted[1];

                // Create the property on the parent element
                await postSubmodelElement(smc, submodelId, idShortPath);

                const aasEndpoint = extractEndpointHref(selectedAAS.value, 'AAS-3.0');

                // Navigate to the new property
                if (props.parentElement.modelType === 'SubmodelElementCollection') {
                    router.push({
                        query: { aas: aasEndpoint, path: props.parentElement.path + '.' + smc.idShort },
                    });
                }
            }
        } else {
            if (props.path == undefined) {
                console.error('SMC Path is missing');
                return;
            }

            const editedElementSelected = route.query.path === props.path;
            const aasEndpoint = extractEndpointHref(selectedAAS.value, 'AAS-3.0');

            // Update the property
            if (props.parentElement.modelType === 'Submodel') {
                await putSubmodelElement(smc, props.path);

                if (editedElementSelected) {
                    router.push({
                        query: {
                            aas: aasEndpoint,
                            path: props.parentElement.path + '/submodel-elements/' + smc.idShort,
                        },
                    });
                }
            } else if (props.parentElement.modelType === 'SubmodelElementList') {
                const index = props.parentElement.value.indexOf(
                    props.parentElement.value.find((el: any) => el.id === props.property.id)
                );
                const path = props.parentElement.path + `%5B${index}%5D`;
                await putSubmodelElement(smc, path);

                if (editedElementSelected) {
                    router.push({
                        query: { aas: aasEndpoint, path: path },
                    });
                }
            } else {
                // Submodel Element Collection or Entity
                await putSubmodelElement(smc, props.property.path);

                if (editedElementSelected) {
                    router.push({
                        query: { aas: aasEndpoint, path: props.parentElement.path + '.' + smc.idShort },
                    });
                }
            }
        }
        closeDialog();
        navigationStore.dispatchTriggerTreeviewReload();
    }

    function closeDialog(): void {
        editSMCDialog.value = false;
    }

    async function initializeInputs(): Promise<void> {
        if (!props.newSmc && props.property) {
            const smcJSON = await fetchSme(props.property.path);
            const instanceOrError = jsonization.propertyFromJsonable(smcJSON);
            const smc = instanceOrError.mustValue();
            smcIdShort.value = smc.idShort;
            if (smc.displayName) {
                displayName.value = smc.displayName;
            }
            if (smc.description) {
                description.value = smc.description;
            }
            if (smc.category) {
                smcCategory.value = smc.category;
            }
            if (smc.semanticId) {
                semanticId.value = smc.semanticId;
            }
            openPanels.value = [0];
        } else {
            smcIdShort.value = null;
            displayName.value = null;
            description.value = null;
            smcCategory.value = null;
            semanticId.value = null;
            openPanels.value = [0];
        }
    }
</script>
