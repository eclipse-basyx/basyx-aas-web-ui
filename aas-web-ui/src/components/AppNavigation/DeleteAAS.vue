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
    import { ref, watch } from 'vue';
    import { useRoute, useRouter } from 'vue-router';
    import { useAASHandling } from '@/composables/AAS/AASHandling';
    import { useSMHandling } from '@/composables/AAS/SMHandling';
    import { useAASStore } from '@/store/AASDataStore';
    import { useNavigationStore } from '@/store/NavigationStore';

    // Vue Router
    const route = useRoute();
    const router = useRouter();

    // Stores
    const aasStore = useAASStore();
    const navigationStore = useNavigationStore();

    // Composables
    const { deleteAasById, getSubmodelRefsById } = useAASHandling();
    const { deleteSmById, fetchSmById } = useSMHandling();

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

    watch(
        () => props.modelValue,
        async (value) => {
            deleteDialog.value = value;
            submodelIds.value = [];
            selected.value = [];

            // Only load Submodel Ids when dialog is opened
            if (value) {
                const submodelRefs = await getSubmodelRefsById(props.aas.id);

                for (const submodelRef of submodelRefs) {
                    // TODO: Optimize by only using the metadata endpoint once it is implemented in BaSyx Go
                    const submodel = await fetchSmById(submodelRef.keys[0].value);
                    submodelIds.value.push({ smId: submodelRef.keys[0].value, smIdShort: submodel.idShort, submodel });
                    selected.value.push(submodelRef.keys[0].value);
                }
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

    async function confirmDelete(): Promise<void> {
        deleteLoading.value = true;
        let error = false;
        try {
            if (deleteSubmodels.value) {
                // Extract all references in an array called submodelIds from each keys[0].value
                const submodelIds = selected.value;
                // Remove each submodel
                for (const submodelId of submodelIds) {
                    error = error || !(await deleteSmById(submodelId));
                }
            }

            error = error || !(await removeAAS(props.aas));
        } finally {
            deleteDialog.value = false;
            deleteSubmodels.value = false;

            if (!error) {
                // Check if the selected AAS is the one being deleted
                if (aasStore.getSelectedAAS.id === props.aas.id) {
                    const query = structuredClone(route.query);
                    if (Object.hasOwn(query, 'aas')) delete query.aas;
                    if (Object.hasOwn(query, 'path')) delete query.path;

                    router.push({ query: query });
                    aasStore.dispatchSelectedAAS({});
                }
                navigationStore.dispatchTriggerAASListReload(); // Reload AAS List
            }
            deleteLoading.value = false;
        }
    }

    async function removeAAS(AAS: any): Promise<boolean> {
        // return if loading state is true -> prevents multiple requests
        if (props.listLoadingState) {
            navigationStore.dispatchSnackbar({
                status: true,
                timeout: 4000,
                color: 'error',
                btnColor: 'buttonText',
                text: 'Please wait for the current Request to finish.',
            });
            return false;
        }
        return await deleteAasById(AAS.id);
    }
</script>
