<template>
    <v-dialog v-model="jsonInsertDialog" width="860" persistent>
        <v-card>
            <v-card-title>Insert {{ type }} from JSON</v-card-title>
            <v-divider></v-divider>
            <v-card-text class="bg-card pa-3">
                <v-card>
                    <v-textarea
                        v-model="jsonInput"
                        :error-messages="jsonInputErrors"
                        variant="outlined"
                        rows="10"
                        hide-details
                        @update:model-value="clearErrorMessages" />
                </v-card>
            </v-card-text>
            <v-divider></v-divider>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn @click="closeDialog">Cancel</v-btn>
                <v-btn color="primary" @click="insertJson">Save</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script lang="ts" setup>
    import type { JsonValue } from '@aas-core-works/aas-core3.0-typescript/jsonization';
    import { jsonization, types as aasTypes } from '@aas-core-works/aas-core3.0-typescript';
    import { computed, ref, watch } from 'vue';
    import { useRoute, useRouter } from 'vue-router';
    import { useAASRepositoryClient } from '@/composables/Client/AASRepositoryClient';
    import { useSMRepositoryClient } from '@/composables/Client/SMRepositoryClient';
    import { useAASStore } from '@/store/AASDataStore';
    import { useInfrastructureStore } from '@/store/InfrastructureStore';
    import { useNavigationStore } from '@/store/NavigationStore';
    import { base64Decode, base64Encode } from '@/utils/EncodeDecodeUtils';

    const props = defineProps<{
        modelValue: boolean;
        type: 'Submodel' | 'SubmodelElement';
        parentElement?: any;
    }>();

    const emit = defineEmits<{
        (event: 'update:modelValue', value: boolean): void;
    }>();

    // Vue Router
    const route = useRoute();
    const router = useRouter();

    // Stores
    const aasStore = useAASStore();
    const navigationStore = useNavigationStore();
    const infrastructureStore = useInfrastructureStore();

    // Composables
    const { postSubmodel, postSubmodelElement } = useSMRepositoryClient();
    const { putAas } = useAASRepositoryClient();

    // Data
    const jsonInsertDialog = ref(false);
    const jsonInput = ref<string | null>(null);
    const jsonInputErrors = ref<string[]>([]);

    // Computed Properties
    const selectedAAS = computed(() => aasStore.getSelectedAAS); // Get the selected AAS from Store
    const submodelRepoUrl = computed(() => infrastructureStore.getSubmodelRepoURL);

    watch(
        () => props.modelValue,
        (value) => {
            jsonInsertDialog.value = value;
        }
    );

    watch(
        () => jsonInsertDialog.value,
        (value) => {
            emit('update:modelValue', value);
        }
    );

    function insertJson(): void {
        if (!jsonInput.value || !isValidJson(jsonInput.value)) {
            jsonInputErrors.value = ['Invalid JSON input'];
            return;
        }

        // Parse JSON to Submodel/SubmodelElement
        if (props.type === 'Submodel') {
            insertSubmodel(JSON.parse(jsonInput.value));
        } else {
            insertSubmodelElement(JSON.parse(jsonInput.value));
        }
    }

    async function insertSubmodel(json: JsonValue): Promise<void> {
        // Parse JSON to Submodel
        const instanceOrError = jsonization.submodelFromJsonable(json);
        if (instanceOrError.error !== null) {
            navigationStore.dispatchSnackbar({
                status: true,
                timeout: 20000,
                color: 'error',
                btnColor: 'buttonText',
                baseError: instanceOrError.error?.message || String(instanceOrError.error),
                extendedError: instanceOrError.error.path ? JSON.stringify(instanceOrError.error.path, null, 2) : '',
            });
            return;
        }
        const submodel = instanceOrError.mustValue();

        // Create Submodel
        await postSubmodel(submodel);
        // Add Submodel Reference to AAS
        await addSubmodelReferenceToAas(submodel);
        // Fetch and dispatch Submodel
        const query = structuredClone(route.query);
        query.path = submodelRepoUrl.value + '/' + base64Encode(submodel.id);

        router.push({ query: query });

        closeDialog();
        navigationStore.dispatchTriggerTreeviewReload();
    }

    async function insertSubmodelElement(json: JsonValue): Promise<void> {
        const instanceOrError = jsonization.submodelElementFromJsonable(json);
        if (instanceOrError.error !== null) {
            navigationStore.dispatchSnackbar({
                status: true,
                timeout: 20000,
                color: 'error',
                btnColor: 'buttonText',
                baseError: instanceOrError.error?.message || String(instanceOrError.error),
                extendedError: instanceOrError.error.path ? JSON.stringify(instanceOrError.error.path, null, 2) : '',
            });
            return;
        }
        const submodelElement = instanceOrError.mustValue();

        if (props.parentElement.modelType === 'Submodel') {
            // Create the property on the parent Submodel
            await postSubmodelElement(submodelElement, props.parentElement.id);

            // Navigate to the new property
            const query = structuredClone(route.query);
            query.path = props.parentElement.path + '/submodel-elements/' + submodelElement.idShort;

            router.push({
                query: query,
            });
        } else {
            // Extract the submodel ID and the idShortPath from the parentElement path
            const splitted = props.parentElement.path.split('/submodel-elements/');
            const submodelId = base64Decode(splitted[0].split('/submodels/')[1]);
            const idShortPath = splitted[1];

            // Create the property on the parent element
            await postSubmodelElement(submodelElement, submodelId, idShortPath);

            // Navigate to the new property
            if (props.parentElement.modelType === 'SubmodelElementCollection') {
                const query = structuredClone(route.query);
                query.path = props.parentElement.path + '.' + submodelElement.idShort;

                router.push({
                    query: query,
                });
            }
        }

        closeDialog();
        navigationStore.dispatchTriggerTreeviewReload();
    }

    async function addSubmodelReferenceToAas(submodel: aasTypes.Submodel): Promise<void> {
        if (selectedAAS.value === null) return;
        const localAAS = { ...selectedAAS.value };
        const instanceOrError = jsonization.assetAdministrationShellFromJsonable(localAAS);
        if (instanceOrError.error !== null) {
            console.error('Error parsing AAS: ', instanceOrError.error);
            return;
        }
        const aas = instanceOrError.mustValue();
        // Create new SubmodelReference
        const submodelReference = new aasTypes.Reference(aasTypes.ReferenceTypes.ExternalReference, [
            new aasTypes.Key(aasTypes.KeyTypes.Submodel, submodel.id),
        ]);
        // Check if Submodels are null
        if (aas.submodels === null || aas.submodels === undefined) {
            aas.submodels = [submodelReference];
            localAAS.submodels = [jsonization.toJsonable(submodelReference)];
        } else {
            aas.submodels.push(submodelReference);
            localAAS.submodels.push(jsonization.toJsonable(submodelReference));
        }
        await putAas(aas);

        // Update AAS in Store
        aasStore.dispatchSelectedAAS(localAAS);
    }

    function isValidJson(jsonString: string): boolean {
        try {
            JSON.parse(jsonString);
            return true;
        } catch {
            return false;
        }
    }

    function closeDialog(): void {
        clearForm();
        jsonInsertDialog.value = false;
    }

    function clearForm(): void {
        jsonInput.value = null;
    }

    function clearErrorMessages(): void {
        jsonInputErrors.value = [];
    }
</script>
