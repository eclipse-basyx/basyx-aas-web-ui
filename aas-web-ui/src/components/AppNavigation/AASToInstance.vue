<template>
    <v-dialog v-model="instanceDialog" max-width="800px">
        <v-card>
            <v-card-title>Create Instance from Type</v-card-title>
            <v-divider></v-divider>
            <v-card-text>
                <div>You selected the AAS with the ID</div>
                <span class="text-primary font-weight-bold">{{ aas.id }}</span>
                <span> for instantiation.</span><br />
                <SubmodelSelection
                    :selected="selected"
                    :submodel-ids="submodelIds"
                    @update:selected="updateSelectedSubmodels" />
                <!-- ID Suffix for new Instances -->
                <v-text-field
                    v-model="idSuffix"
                    variant="outlined"
                    label="ID Suffix"
                    class="mt-6"
                    :rules="[rules.required]"
                    density="compact"></v-text-field>
            </v-card-text>
            <v-divider></v-divider>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn @click="instanceDialog = false">Cancel</v-btn>
                <v-btn variant="tonal" color="primary" :loading="instantiationLoading" @click="instantiate"
                    >Instantiate AAS</v-btn
                >
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script lang="ts" setup>
    import { jsonization } from '@aas-core-works/aas-core3.0-typescript';
    import { types as aasTypes } from '@aas-core-works/aas-core3.0-typescript';
    import { onMounted, ref, watch } from 'vue';
    import { useAASHandling } from '@/composables/AAS/AASHandling';
    import { useSMHandling } from '@/composables/AAS/SMHandling';
    import { useAASRepositoryClient } from '@/composables/Client/AASRepositoryClient';
    import { useSMRepositoryClient } from '@/composables/Client/SMRepositoryClient';
    import { useIDUtils } from '@/composables/IDUtils';
    import { useNavigationStore } from '@/store/NavigationStore';

    const { postAas } = useAASRepositoryClient();
    const { fetchAasById, getSubmodelRefsById, aasIsAvailableById } = useAASHandling();
    const { postSubmodel } = useSMRepositoryClient();
    const { fetchSmById, smIsAvailableById } = useSMHandling();
    const { generateUUID } = useIDUtils();

    const navigationStore = useNavigationStore();

    const props = defineProps<{
        modelValue: boolean;
        aas: any;
    }>();

    const emit = defineEmits<{
        (event: 'update:modelValue', value: boolean): void;
    }>();

    const instanceDialog = ref(false);
    const instantiationLoading = ref(false);

    const selected = ref<string[]>([]);
    const submodelIds = ref<any[]>([]);

    const idSuffix = ref<string>('');

    const rules = {
        required: (value: string) => !!value?.trim() || 'ID Suffix is required',
    };

    onMounted(() => {
        idSuffix.value = '_instance_' + generateUUID();
    });

    watch(
        () => props.modelValue,
        async (value) => {
            instanceDialog.value = value;
            selected.value = [];
            submodelIds.value = [];
            instantiationLoading.value = false;

            // Generate new ID Suffix on dialog open
            if (value) {
                idSuffix.value = '_instance_' + generateUUID();
            }

            if (!props.aas) return;

            const submodelRefs = await getSubmodelRefsById(props.aas.id);

            for (const submodelRef of submodelRefs) {
                // TODO: Optimize by only using the metadata endpoint once it is implemented in BaSyx Go
                const submodel = await fetchSmById(submodelRef.keys[0].value);
                submodelIds.value.push({ smId: submodelRef.keys[0].value, smIdShort: submodel.idShort, submodel });
                selected.value.push(submodelRef.keys[0].value);
            }
        }
    );

    watch(
        () => instanceDialog.value,
        (value) => {
            emit('update:modelValue', value);
        }
    );

    function updateSelectedSubmodels(value: string[]): void {
        selected.value = value;
    }

    async function instantiate(): Promise<void> {
        instantiationLoading.value = true;
        try {
            // Validate ID Suffix
            if (!idSuffix.value?.trim()) {
                navigationStore.dispatchSnackbar({
                    status: true,
                    timeout: 4000,
                    color: 'error',
                    btnColor: 'buttonText',
                    text: 'ID Suffix cannot be empty.',
                });
                return;
            }

            // Fetch the AAS
            const fetchedAAS = await fetchAasById(props.aas.id);
            if (!fetchedAAS) {
                throw new Error('Failed to fetch AAS.');
            }

            // Check if AAS with new ID already exists
            const newAASId = props.aas.id + idSuffix.value.trim();
            const aasExists = await aasIsAvailableById(newAASId);

            if (aasExists) {
                navigationStore.dispatchSnackbar({
                    status: true,
                    timeout: 4000,
                    color: 'error',
                    btnColor: 'buttonText',
                    text: 'Instantiation Failed: An AAS with the ID "' + newAASId + '" already exists.',
                });
                return;
            }

            fetchedAAS.id = newAASId;

            // create AAS Core Works AAS
            const instanceOrError = jsonization.assetAdministrationShellFromJsonable(fetchedAAS);
            if (instanceOrError.error !== null) {
                throw new Error('Converting AAS Failed during Instantiation: ' + instanceOrError.error);
            }
            const coreworksAAS = instanceOrError.mustValue();

            // Change the asset kind of the AAS to "Instance"
            if (!coreworksAAS.assetInformation) {
                throw new Error('AAS assetInformation is missing.');
            }
            coreworksAAS.assetInformation.assetKind = aasTypes.AssetKind.Instance;
            // Clear existing submodel references for rebuilding
            coreworksAAS.submodels = [];

            if (!fetchedAAS.submodels || fetchedAAS.submodels.length === 0) {
                // No submodels to process, just post the AAS
                await postAas(coreworksAAS);
                instanceDialog.value = false;
                navigationStore.dispatchTriggerAASListReload();
                return;
            }

            // Filter submodels that are selected
            interface SubmodelRef {
                keys: Array<{ value: string }>;
            }
            const selectedSubmodelRefs = fetchedAAS.submodels.filter((submodelRef: SubmodelRef) => {
                if (!submodelRef.keys?.[0]?.value) return false;
                return selected.value.includes(submodelRef.keys[0].value);
            });

            // Fetch all selected submodels in parallel
            const fetchedSubmodels = await Promise.all(
                selectedSubmodelRefs.map(async (submodelRef: SubmodelRef) => {
                    const submodelId = submodelRef.keys[0].value;
                    const fetchedSubmodel = await fetchSmById(submodelId);
                    if (!fetchedSubmodel) {
                        throw new Error(`Failed to fetch Submodel with ID "${submodelId}".`);
                    }
                    return { originalId: submodelId, submodel: fetchedSubmodel };
                })
            );

            // Check if any submodels with new IDs already exist
            const existingSubmodelChecks = await Promise.all(
                fetchedSubmodels.map(async ({ originalId }) => {
                    const newSubmodelId = originalId + idSuffix.value.trim();
                    const smExists = await smIsAvailableById(newSubmodelId);
                    return { newSubmodelId, exists: smExists };
                })
            );

            const existingSubmodel = existingSubmodelChecks.find((check) => check.exists);
            if (existingSubmodel) {
                navigationStore.dispatchSnackbar({
                    status: true,
                    timeout: 4000,
                    color: 'error',
                    btnColor: 'buttonText',
                    text:
                        'Instantiation Failed: A Submodel with the ID "' +
                        existingSubmodel.newSubmodelId +
                        '" already exists.',
                });
                return;
            }

            // Process submodels
            const submodelsToAttach: aasTypes.Submodel[] = [];
            for (const { originalId, submodel } of fetchedSubmodels) {
                const newSubmodelId = originalId + idSuffix.value.trim();

                submodel.id = newSubmodelId;

                // Create Core Works Submodel
                const submodelOrError = jsonization.submodelFromJsonable(submodel);
                if (submodelOrError.error !== null) {
                    throw new Error('Converting Submodel Failed during Instantiation: ' + submodelOrError.error);
                }
                const coreworksSubmodel = submodelOrError.mustValue();

                // Change the submodel kind of the Submodel to "Instance"
                submodel.kind = aasTypes.ModellingKind.Instance;

                submodelsToAttach.push(coreworksSubmodel);

                // Add submodel reference to AAS
                coreworksAAS.submodels.push(
                    new aasTypes.Reference(aasTypes.ReferenceTypes.ModelReference, [
                        new aasTypes.Key(aasTypes.KeyTypes.Submodel, coreworksSubmodel.id),
                    ])
                );
            }

            // Post all Submodels in parallel
            await Promise.all(submodelsToAttach.map((submodel) => postSubmodel(submodel)));

            // Post AAS after Submodels
            await postAas(coreworksAAS);

            // Close Dialog
            instanceDialog.value = false;

            // Reload AAS List
            navigationStore.dispatchTriggerAASListReload();

            navigationStore.dispatchSnackbar({
                status: true,
                timeout: 3000,
                color: 'success',
                btnColor: 'buttonText',
                text: 'AAS instantiated successfully.',
            });
        } catch (error) {
            navigationStore.dispatchSnackbar({
                status: true,
                timeout: 4000,
                color: 'error',
                btnColor: 'buttonText',
                text: 'Instantiation Failed: ' + (error instanceof Error ? error.message : String(error)),
            });
        } finally {
            instantiationLoading.value = false;
        }
    }
</script>
