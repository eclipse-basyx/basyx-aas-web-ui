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
                    hide-details
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

    const { getSubmodelRefsById, fetchAasById: fetchAASByIdFromRepo, postAas } = useAASRepositoryClient();
    const { fetchAasById } = useAASHandling();
    const { fetchSmById, postSubmodel } = useSMRepositoryClient();
    const { fetchSmById: fetchSubmodelById } = useSMHandling();
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
    const downloadEndpoint = ref<string>('');

    const idSuffix = ref<string>('');

    onMounted(() => {
        idSuffix.value = '_instance_' + generateUUID();
    });

    watch(
        () => props.modelValue,
        async (value) => {
            instanceDialog.value = value;
            selected.value = [];
            submodelIds.value = [];
            downloadEndpoint.value = '';
            instantiationLoading.value = false;
            if (!props.aas) return;
            const submodelRefs = await getSubmodelRefsById(props.aas.id);
            downloadEndpoint.value = props.aas.endpoints[0].protocolInformation.href.split('/shells')[0];
            for (const submodelRef of submodelRefs) {
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
        const fetchedAAS = await fetchAasById(props.aas.id);
        // Check if AAS with new ID already exists
        const newAASId = props.aas.id + idSuffix.value;
        const existingAAS = await fetchAASByIdFromRepo(newAASId);

        if (existingAAS?.id) {
            navigationStore.dispatchSnackbar({
                status: true,
                timeout: 4000,
                color: 'error',
                btnColor: 'buttonText',
                text: 'Instantiation Failed: An AAS with the ID "' + newAASId + '" already exists.',
            });
            return;
        }

        fetchedAAS.id = fetchedAAS.id + idSuffix.value;
        // create AAS Core Works AAS
        const instanceOrError = jsonization.assetAdministrationShellFromJsonable(fetchedAAS);
        if (instanceOrError.error !== null) {
            console.error('Error parsing AAS: ', instanceOrError.error);
            return;
        }
        const coreworksAAS = instanceOrError.mustValue();
        // Change the asset kind of the AAS to "Instance"
        coreworksAAS.assetInformation.assetKind = aasTypes.AssetKind.Instance;
        // Delete existing submodel references
        coreworksAAS.submodels = [];

        const submodelsToAttach: any[] = [];

        for (const submodelRef of fetchedAAS.submodels) {
            if (selected.value.includes(submodelRef.keys[0].value)) {
                const fetchedSubmodel = await fetchSubmodelById(submodelRef.keys[0].value);
                // Check if Submodel with new ID already exists
                const newSubmodelId = submodelRef.keys[0].value + idSuffix.value;
                const existingSubmodel = await fetchSmById(newSubmodelId);
                if (existingSubmodel?.id) {
                    navigationStore.dispatchSnackbar({
                        status: true,
                        timeout: 4000,
                        color: 'error',
                        btnColor: 'buttonText',
                        text: 'Instantiation Failed: A Submodel with the ID "' + newSubmodelId + '" already exists.',
                    });
                    return;
                }
                // Change the submodel kind of the Submodel to "Instance"
                fetchedSubmodel.kind = 'Instance';
                fetchedSubmodel.id = newSubmodelId;

                // Create Core Works Submodel
                const submodelOrError = jsonization.submodelFromJsonable(fetchedSubmodel);
                if (submodelOrError.error !== null) {
                    console.error('Error parsing Submodel: ', submodelOrError.error);
                    return;
                }
                const coreworksSubmodel = submodelOrError.mustValue();
                submodelsToAttach.push(coreworksSubmodel);
                // Add submodel reference to AAS
                coreworksAAS.submodels?.push(
                    new aasTypes.Reference(aasTypes.ReferenceTypes.ModelReference, [
                        new aasTypes.Key(aasTypes.KeyTypes.Submodel, coreworksSubmodel.id),
                    ])
                );
            }
        }

        // Post Submodels first
        for (const submodel of submodelsToAttach) {
            await postSubmodel(submodel);
        }
        // Post AAS after Submodels
        await postAas(coreworksAAS);

        // Close Dialog
        instanceDialog.value = false;
        instantiationLoading.value = false;

        // Reload AAS List
        navigationStore.dispatchTriggerAASListReload();
    }
</script>
