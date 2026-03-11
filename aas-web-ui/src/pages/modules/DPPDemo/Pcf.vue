<template>
    <v-card rounded="lg" border>
        <v-card-title class="text-h6 mt-1">Product Carbon Footprint</v-card-title>
        <v-card-text class="pt-2">
            <v-sheet v-if="isLoading" color="transparent">
                <v-skeleton-loader type="subtitle" class="mb-2" />
                <v-skeleton-loader type="image" />
            </v-sheet>

            <v-alert
                v-else-if="!hasSelectedAas"
                type="info"
                variant="tonal"
                icon="mdi-information-outline"
                text="Select an Asset Administration Shell to load Product Carbon Footprint data." />

            <v-alert
                v-else-if="!hasPcfSubmodel"
                type="warning"
                variant="tonal"
                icon="mdi-alert-outline"
                text="No Carbon Footprint v1.0 submodel was found for the selected AAS." />

            <CarbonFootprint_v1_0 v-else :submodel-element-data="pcfSubmodel" />
        </v-card-text>
    </v-card>
</template>

<script lang="ts" setup>
    import { computed, onMounted, ref, watch } from 'vue';
    import CarbonFootprint_v1_0 from '@/components/Plugins/Submodels/CarbonFootprint_v1_0.vue';
    import { useDppSubmodelResolver } from '@/pages/modules/DPPDemo/submodelResolver';
    import { useAASStore } from '@/store/AASDataStore';

    const semanticIdCarbonFootprint = 'https://admin-shell.io/idta/CarbonFootprint/CarbonFootprint/1/0';

    const aasStore = useAASStore();
    const { resolveSubmodelBySemanticId } = useDppSubmodelResolver();

    const selectedAas = computed(() => aasStore.getSelectedAAS);
    const isLoading = ref(false);
    const pcfSubmodel = ref({} as Record<string, unknown>);

    const hasSelectedAas = computed(() => !!selectedAas.value && Object.keys(selectedAas.value).length > 0);
    const hasPcfSubmodel = computed(() => !!pcfSubmodel.value && Object.keys(pcfSubmodel.value).length > 0);

    onMounted(() => {
        initializePcf();
    });

    watch(
        () => selectedAas.value?.id,
        () => {
            initializePcf();
        }
    );

    async function initializePcf(): Promise<void> {
        isLoading.value = true;
        pcfSubmodel.value = {};

        if (!selectedAas.value || Object.keys(selectedAas.value).length === 0) {
            isLoading.value = false;
            return;
        }

        pcfSubmodel.value = await resolveSubmodelBySemanticId(selectedAas.value, semanticIdCarbonFootprint);
        isLoading.value = false;
    }
</script>
