<template>
    <v-container fluid class="pa-0">
        <v-card color="rgba(0,0,0,0)" elevation="0">
            <!-- Title bar -->
            <v-card-title style="padding: 15px 16px 16px">
                <div class="d-flex align-center">
                    <v-btn-toggle
                        v-model="componentToShow"
                        base-color="elevatedCard"
                        color="primary"
                        divided
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
                <SubmodelElementView v-if="componentToShow === 'SMEView'" />
                <SubmodelElementVisualization v-else-if="componentToShow === 'Visualization'" />
            </v-card-text>
        </v-card>
    </v-container>
</template>

<script lang="ts" setup>
    import { computed, ref } from 'vue';
    import { useEnvStore } from '@/store/EnvironmentStore';

    //Stores
    const envStore = useEnvStore();

    // Data
    const componentToShow = ref('SMEView');

    // Computed Properties
    const singleAas = computed(() => envStore.getSingleAas);
</script>
