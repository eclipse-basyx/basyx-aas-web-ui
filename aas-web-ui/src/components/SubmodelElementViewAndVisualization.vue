<template>
    <v-container fluid class="pa-0">
        <v-card color="rgba(0,0,0,0)" elevation="0">
            <!-- Title bar -->
            <v-card-title style="padding: 15px 16px 16px">
                <div class="d-flex align-center">
                    <v-btn-toggle
                        v-model="componentToShow"
                        color="primary"
                        variant="outlined"
                        divided
                        density="compact"
                        class="pa-0 ma-0"
                        style="height: 32px !important">
                        <v-btn value="SMEView" class="ma-0">
                            <v-icon start>mdi-folder-edit-outline</v-icon>
                            <span class="hidden-sm-and-down">Element Details</span>
                        </v-btn>
                        <v-btn value="Visualization" class="ma-0">
                            <v-icon start>mdi-folder-star-outline</v-icon>
                            <span class="hidden-sm-and-down">Visualization</span>
                        </v-btn>
                    </v-btn-toggle>
                </div>
            </v-card-title>
            <v-divider></v-divider>
            <v-card-text
                style="overflow-y: auto"
                :style="singleAas ? 'height: calc(100svh - 105px)' : 'height: calc(100svh - 170px)'">
                <template
                    v-if="
                        selectedAAS &&
                        Object.keys(selectedAAS).length > 0 &&
                        selectedNode &&
                        Object.keys(selectedNode).length > 0
                    ">
                    <SubmodelElementView v-if="componentToShow === 'SMEView'" />
                    <SubmodelElementVisualization v-else-if="componentToShow === 'Visualization'" />
                </template>
                <v-empty-state
                    v-else-if="!selectedAAS || Object.keys(selectedAAS).length === 0"
                    title="No selected AAS"
                    class="text-divider"></v-empty-state>
                <v-empty-state
                    v-else-if="!selectedNode || Object.keys(selectedNode).length === 0"
                    title="No selected Submodel / Submodel Element"
                    text="Select a Submodel / Submodel Element to view"
                    class="text-divider"></v-empty-state>
            </v-card-text>
        </v-card>
    </v-container>
</template>

<script lang="ts" setup>
    import { computed, ref } from 'vue';
    import { useAASStore } from '@/store/AASDataStore';
    import { useEnvStore } from '@/store/EnvironmentStore';

    //Stores
    const aasStore = useAASStore();
    const envStore = useEnvStore();

    // Data
    const componentToShow = ref('SMEView');

    // Computed Properties
    const singleAas = computed(() => envStore.getSingleAas);
    const selectedAAS = computed(() => aasStore.getSelectedAAS);
    const selectedNode = computed(() => aasStore.getSelectedNode);
</script>
