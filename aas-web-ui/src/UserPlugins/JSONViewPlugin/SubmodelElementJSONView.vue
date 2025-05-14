<template>
    <v-container fluid class="pa-0">
        <!-- JSON Viewer for selected AAS and Submodel/SubmodelElement -->
        <v-card color="rgba(0,0,0,0)" elevation="0">
            <v-card-text style="height: calc(90vh - 170px)">
                <!-- JSON Content Display -->
                <template
                    v-if="
                        selectedAAS &&
                        Object.keys(selectedAAS).length > 0 &&
                        selectedNode &&
                        Object.keys(selectedNode).length > 0
                    ">
                    <!-- Header -->
                    <v-card class="mb-4">
                        <v-card-title class="text-subtitle-1"> JSON View </v-card-title>
                        <v-card-subtitle
                            v-if="descriptionToDisplay(selectedAAS.submodelElementData)"
                            class="mb-2 text-caption">
                            {{ descriptionToDisplay(selectedAAS.submodelElementData) }}
                        </v-card-subtitle>
                    </v-card>

                    <!-- Raw JSON Content -->
                    <pre class="json-content" style="background-color: black">
            {{ JSON.stringify(selectedNode, null, 2) }}
          </pre
                    >
                </template>

                <!-- Empty State: No AAS Selected -->
                <v-empty-state
                    v-else-if="!selectedAAS || Object.keys(selectedAAS).length === 0"
                    title="No selected AAS"
                    class="text-divider"></v-empty-state>

                <!-- Empty State: No Submodel/SubmodelElement Selected -->
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
    import { computed } from 'vue';
    import { useReferableUtils } from '@/composables/AAS/ReferableUtils';
    import { useAASStore } from '@/store/AASDataStore';

    // Define an interface for JSON-like objects
    interface JsonObject {
        [key: string]: string | number | boolean | null | JsonObject | JsonObject[];
    }

    // Types
    interface AAS {
        submodelElementData: JsonObject;
        [key: string]: JsonObject | string | number | boolean | null;
    }

    // Use type alias for Node to avoid empty interface
    type Node = JsonObject;

    // Composables
    const { descriptionToDisplay } = useReferableUtils();

    // Stores
    const aasStore = useAASStore();

    // Computed Properties
    const selectedAAS = computed<AAS | null>(() => aasStore.getSelectedAAS);
    const selectedNode = computed<Node | null>(() => aasStore.getSelectedNode);
</script>

<style scoped>
    /* Styles for JSON content display */
    .json-content {
        background-color: #1e1e1e;
        padding: 16px;
        border-radius: 4px;
        white-space: pre-wrap;
        word-wrap: break-word;
        font-family: monospace;
        max-height: calc(90vh - 250px);
        overflow-x: auto;
    }

    /* Styles for empty state */
    .text-divider {
        color: #757575;
    }
</style>
