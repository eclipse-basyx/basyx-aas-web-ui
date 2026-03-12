<template>
    <v-dialog v-model="deleteDialog" :width="800">
        <v-sheet border rounded="lg">
            <v-card-title class="bg-cardHeader">Confirm Delete</v-card-title>
            <v-divider></v-divider>
            <v-card-text class="overflow-y-auto" style="max-height: calc(100vh - 296px)">
                <v-alert border="start" variant="tonal">
                    <span>Are you sure you want to delete the AAS with the id </span>
                    <span class="text-primary font-weight-bold">{{ aas?.id }}</span>
                    <span>?</span>
                </v-alert>
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
            <v-divider></v-divider>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn text="Cancel" rounded="lg" @click="deleteDialog = false" />
                <v-btn
                    color="error"
                    variant="flat"
                    rounded="lg"
                    class="text-buttonText"
                    text="Delete"
                    :loading="deleteLoading"
                    @click="confirmDelete" />
            </v-card-actions>
        </v-sheet>
    </v-dialog>
</template>

<script lang="ts" setup>
    import { computed, ref, watch } from 'vue';
    import { useRoute, useRouter } from 'vue-router';
    import { useAASHandling } from '@/composables/AAS/AASHandling';
    import { useSMHandling } from '@/composables/AAS/SMHandling';
    import { useAASDiscoveryClient } from '@/composables/Client/AASDiscoveryClient';
    import { useAASRegistryClient } from '@/composables/Client/AASRegistryClient';
    import { useSMRegistryClient } from '@/composables/Client/SMRegistryClient';
    import { useAASStore } from '@/store/AASDataStore';
    import { useInfrastructureStore } from '@/store/InfrastructureStore';
    import { useNavigationStore } from '@/store/NavigationStore';

    // Vue Router
    const route = useRoute();
    const router = useRouter();

    // Stores
    const aasStore = useAASStore();
    const infrastructureStore = useInfrastructureStore();
    const navigationStore = useNavigationStore();

    // Composables
    const { deleteAasById, getSubmodelRefsById } = useAASHandling();
    const { deleteSmById, fetchSmById } = useSMHandling();
    const { deleteAasDescriptor } = useAASRegistryClient();
    const { deleteSubmodelDescriptor } = useSMRegistryClient();
    const { deleteAssetLinksForAas } = useAASDiscoveryClient();

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

    const selectedInfrastructure = computed(() => infrastructureStore.getSelectedInfrastructure);
    const aasRepoHasRegistryIntegration = computed(
        () => selectedInfrastructure.value?.components?.AASRepo?.hasRegistryIntegration ?? true
    );
    const submodelRepoHasRegistryIntegration = computed(
        () => selectedInfrastructure.value?.components?.SubmodelRepo?.hasRegistryIntegration ?? true
    );
    const aasRegistryHasDiscoveryIntegration = computed(
        () => selectedInfrastructure.value?.components?.AASRegistry?.hasDiscoveryIntegration ?? true
    );

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
        const warnings: string[] = [];
        try {
            if (deleteSubmodels.value) {
                // Extract all references in an array called submodelIds from each keys[0].value
                const submodelIds = selected.value;
                // Remove each submodel
                for (const submodelId of submodelIds) {
                    error = error || !(await deleteSmById(submodelId));
                    if (!error && !submodelRepoHasRegistryIntegration.value) {
                        const descriptorDeleted = await deleteSubmodelDescriptor(submodelId);
                        if (!descriptorDeleted) {
                            warnings.push(`Failed to delete Submodel descriptor '${submodelId}'.`);
                        }
                    }
                }
            }

            error = error || !(await removeAAS(props.aas));

            if (!error && !aasRepoHasRegistryIntegration.value) {
                const descriptorDeleted = await deleteAasDescriptor(props.aas.id);
                if (!descriptorDeleted) {
                    warnings.push(`Failed to delete AAS descriptor '${props.aas.id}'.`);
                }
            }

            if (!error && !aasRegistryHasDiscoveryIntegration.value) {
                const assetLinksDeleted = await deleteAssetLinksForAas(props.aas.id);
                if (!assetLinksDeleted) {
                    warnings.push(`Failed to delete discovery asset links for '${props.aas.id}'.`);
                }
            }
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

            if (warnings.length > 0) {
                navigationStore.dispatchSnackbar({
                    status: true,
                    timeout: 9000,
                    color: 'warning',
                    btnColor: 'buttonText',
                    baseError: 'Delete completed with synchronization warnings.',
                    extendedError: warnings.join('\n'),
                });
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
