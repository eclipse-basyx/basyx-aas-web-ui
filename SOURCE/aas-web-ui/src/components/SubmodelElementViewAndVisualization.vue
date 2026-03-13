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
                        mandatory
                        density="compact"
                        class="pa-0 ma-0"
                        style="height: 32px !important"
                        @update:model-value="updateQueryParam">
                        <v-btn value="SMEView" class="ma-0">
                            <v-icon start>mdi-folder-edit-outline</v-icon>
                            <span class="hidden-sm-and-down">Element Details</span>
                        </v-btn>
                        <v-btn value="Visualization" class="ma-0">
                            <v-icon start>mdi-folder-star-outline</v-icon>
                            <span class="hidden-sm-and-down">Visualization</span>
                        </v-btn>
                        <v-btn value="JSONView" class="ma-0">
                            <v-icon start>mdi-code-block-braces</v-icon>
                            <span class="hidden-sm-and-down">JSON</span>
                        </v-btn>
                    </v-btn-toggle>
                </div>
            </v-card-title>
            <v-divider></v-divider>
            <v-card-text style="overflow-y: auto; height: calc(100svh - 170px)">
                <template
                    v-if="
                        ((selectedAAS && Object.keys(selectedAAS).length > 0) ||
                            ['SMViewer', 'SMEditor'].includes(route.name as string)) &&
                        selectedNode &&
                        Object.keys(selectedNode).length > 0
                    ">
                    <SubmodelElementView v-if="componentToShow === 'SMEView'" />
                    <SubmodelElementVisualization v-else-if="componentToShow === 'Visualization'" />
                    <SubmodelElementJSONView v-if="componentToShow === 'JSONView'" />
                </template>
                <v-empty-state
                    v-else-if="
                        !['SMViewer', 'SMEditor'].includes(route.name as string) &&
                        (!selectedAAS || Object.keys(selectedAAS).length === 0)
                    "
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
    import { computed, ref, watch } from 'vue';
    import { useRoute, useRouter } from 'vue-router';
    import { useAASStore } from '@/store/AASDataStore';

    // Vue Router
    const route = useRoute();
    const router = useRouter();

    //Stores
    const aasStore = useAASStore();

    // Data
    const validViews = ['SMEView', 'Visualization', 'JSONView'];
    const componentToShow = ref(
        validViews.includes(route.query.view as string) ? (route.query.view as string) : 'SMEView'
    );

    // Watch for external query param changes (e.g., browser back/forward)
    watch(
        () => route.query.view,
        (newView) => {
            if (newView && validViews.includes(newView as string)) {
                componentToShow.value = newView as string;
            }
        }
    );

    // Computed Properties
    const selectedAAS = computed(() => aasStore.getSelectedAAS);
    const selectedNode = computed(() => aasStore.getSelectedNode);

    // Methods

    function updateQueryParam(value: string): void {
        router.replace({
            query: {
                ...route.query,
                view: value,
            },
        });
    }
</script>
