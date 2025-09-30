<template>
    <v-dialog v-model="deleteDialog" max-width="500px">
        <v-card>
            <v-card-title>Confirm Delete</v-card-title>
            <v-divider></v-divider>
            <v-card-text class="pb-0">
                <div>Are you sure you want to delete the AAS with the id</div>
                <span class="text-primary font-weight-bold">{{ aas.id }}</span>
                <span>?</span>
                <v-checkbox v-model="deleteSubmodels" label="Also delete Submodels" hide-details></v-checkbox>
                <v-alert v-if="deleteSubmodels" class="mb-2" variant="tonal" border color="warning">
                    Warning: If other shells refer to the same submodels, those references are not deleted!
                </v-alert>
                <SubmodelSelection
                    v-if="deleteSubmodels"
                    :selected="selected"
                    :submodel-ids="submodelIds"
                    @update:selected="updateSelectedSubmodels" />
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn @click="deleteDialog = false">Cancel</v-btn>
                <v-btn variant="tonal" color="error" :loading="deleteLoading" @click="confirmDelete">Delete</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script lang="ts" setup>
    import { computed, ref, watch } from 'vue';
    import { useRouter } from 'vue-router';
    import { useAASRepositoryClient } from '@/composables/Client/AASRepositoryClient';
    import { useSMRepositoryClient } from '@/composables/Client/SMRepositoryClient';
    import { useRequestHandling } from '@/composables/RequestHandling';
    import { useAASStore } from '@/store/AASDataStore';
    import { useNavigationStore } from '@/store/NavigationStore';
    import { extractEndpointHref } from '@/utils/AAS/DescriptorUtils';
    import { base64Encode } from '@/utils/EncodeDecodeUtils';

    const router = useRouter();

    const aasStore = useAASStore();
    const navigationStore = useNavigationStore();

    const { getRequest, deleteRequest } = useRequestHandling();
    const { getSubmodelRefsById } = useAASRepositoryClient();
    const { fetchSmById } = useSMRepositoryClient();

    const props = defineProps<{
        modelValue: boolean;
        aas: any;
        listLoadingState: boolean;
    }>();

    const emit = defineEmits<{
        (event: 'update:modelValue', value: boolean): void;
    }>();

    const deleteDialog = ref(false); // Variable to store if the delete dialog is open
    const deleteLoading = ref(false); // Variable to store if the AAS is being deleted
    const deleteSubmodels = ref(false); // Variable to store if the Submodels should be deleted
    const submodelIds = ref<any[]>([]); // Variable to store the Submodel Ids of the AAS
    const selected = ref<string[]>([]); // Variable to store the selected Submodel Ids

    const submodelRegistryURL = computed(() => navigationStore.getSubmodelRegistryURL); // Get Submodel Registry URL from Store
    const submodelRepositoryURL = computed(() => navigationStore.getSubmodelRepoURL); // Get Submodel Repository URL from Store

    watch(
        () => props.modelValue,
        async (value) => {
            deleteDialog.value = value;
            const submodelRefs = await getSubmodelRefsById(props.aas.id);
            submodelIds.value = [];
            selected.value = [];
            for (const submodelRef of submodelRefs) {
                const submodel = await fetchSmById(submodelRef.keys[0].value);
                submodelIds.value.push({ smId: submodelRef.keys[0].value, smIdShort: submodel.idShort, submodel });
                selected.value.push(submodelRef.keys[0].value);
            }
        }
    );

    watch(
        () => deleteDialog.value,
        (value) => {
            emit('update:modelValue', value);
        }
    );

    function updateSelectedSubmodels(value: string[]): void {
        selected.value = value;
    }

    async function confirmDelete() {
        deleteLoading.value = true;
        let error = false;
        try {
            if (deleteSubmodels.value) {
                // Extract all references in an array called submodelIds from each keys[0].value
                const submodelIds = selected.value;
                const disableMessage = false;
                await removeAAS(props.aas);
                // Remove each submodel
                for (const submodelId of submodelIds) {
                    if (submodelRegistryURL.value) {
                        const submodelRegistryPath = `${submodelRegistryURL.value}/${base64Encode(submodelId)}`;
                        const submodelRegistryResponse = await getRequest(
                            submodelRegistryPath,
                            'Removing Submodels',
                            disableMessage
                        );
                        if (submodelRegistryResponse.success) {
                            const submodelHref = extractEndpointHref(submodelRegistryResponse.data, 'SUBMODEL-3.0');
                            const deletePath = submodelHref;
                            await deleteRequest(deletePath, 'removing Submodel', disableMessage);
                        } else {
                            error = true;
                        }
                    } else if (submodelRepositoryURL.value) {
                        const submodelFromRepo = await fetchSmById(submodelId);
                        const deletePath = extractEndpointHref(submodelFromRepo, 'SUBMODEL-3.0');
                        await deleteRequest(deletePath, 'removing Submodel', disableMessage);
                    } else {
                        error = true;
                    }
                }
            } else {
                await removeAAS(props.aas);
            }
        } finally {
            deleteDialog.value = false;
            deleteSubmodels.value = false;
            if (!error) {
                // Check if the selected AAS is the one being deleted
                if (aasStore.getSelectedAAS.id === props.aas.id) {
                    router.push({ query: {} });
                    aasStore.dispatchSelectedAAS({});
                }
                navigationStore.dispatchTriggerAASListReload(); // Reload AAS List
            }
            deleteLoading.value = false;
        }
    }

    async function removeAAS(AAS: any): Promise<void> {
        // return if loading state is true -> prevents multiple requests
        if (props.listLoadingState) {
            navigationStore.dispatchSnackbar({
                status: true,
                timeout: 4000,
                color: 'error',
                btnColor: 'buttonText',
                text: 'Please wait for the current Request to finish.',
            });
            return;
        }
        // console.log('Remove AAS: ', AAS);
        const aasEndpoint = extractEndpointHref(AAS, 'AAS-3.0');
        let path = aasEndpoint;
        let context = 'removing AAS';
        let disableMessage = false;
        await deleteRequest(path, context, disableMessage);
    }
</script>
