<template>
    <v-dialog v-model="deleteDialog" max-width="500px">
        <v-card>
            <v-card-title>Confirm Delete</v-card-title>
            <v-divider></v-divider>
            <v-card-text class="pb-0">
                <div>
                    Are you sure you want to delete the element with the
                    {{ element.modelType === 'Submodel' ? 'id' : 'idShort' }}
                </div>
                <span class="text-primary font-weight-bold">{{
                    element.modelType === 'Submodel' ? element.id : element.idShort
                }}</span>
                <span>?</span>
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
    import { useAASRepositoryClient } from '@/composables/Client/AASRepositoryClient';
    import { useSMRegistryClient } from '@/composables/Client/SMRegistryClient';
    import { useRequestHandling } from '@/composables/RequestHandling';
    import { useAASStore } from '@/store/AASDataStore';
    import { extractEndpointHref } from '@/utils/DescriptorUtils';

    // Stores
    const aasStore = useAASStore();

    // Composables
    const { deleteRequest } = useRequestHandling();
    const { deleteSubmodelRef } = useAASRepositoryClient();
    const { fetchSmDescriptorById } = useSMRegistryClient();

    const props = defineProps<{
        modelValue: boolean;
        element: any;
    }>();

    const emit = defineEmits<{
        (event: 'update:modelValue', value: boolean): void;
    }>();

    // Data
    const deleteDialog = ref(false); // Variable to store if the delete dialog is open
    const deleteLoading = ref(false); // Variable to store if the AAS is being deleted

    // Computed Properties
    const selectedAAS = computed(() => aasStore.getSelectedAAS); // get selected AAS from Store

    // Watchers
    watch(
        () => props.modelValue,
        (value) => {
            deleteDialog.value = value;
        }
    );

    watch(
        () => deleteDialog.value,
        (value) => {
            emit('update:modelValue', value);
        }
    );

    async function confirmDelete(): Promise<void> {
        deleteLoading.value = true;
        if (props.element.modelType === 'Submodel') {
            // Fetch the submodel from the submodel registry
            const smDescriptor = await fetchSmDescriptorById(props.element.id);
            // extract the submodel endpoint
            const smEndpoint = extractEndpointHref(smDescriptor, 'SUBMODEL-3.0');
            // delete the submodel
            await deleteRequest(smEndpoint, 'removing Submodel', false);
            // extract the AAS endpoint
            const aasEndpoint = extractEndpointHref(selectedAAS.value, 'AAS-3.0');
            // delete the submodel reference from the AAS
            await deleteSubmodelRef(aasEndpoint, props.element.id);
        }
        deleteLoading.value = false;
        // close the dialog
        deleteDialog.value = false;
    }
</script>
