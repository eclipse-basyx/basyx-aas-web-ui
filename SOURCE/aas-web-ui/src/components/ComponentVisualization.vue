<template>
    <v-container fluid class="pa-0">
        <v-card color="rgba(0,0,0,0)" elevation="0">
            <!-- Title bar -->
            <template v-if="isMobile || (isMobile && !singleAas)">
                <v-card-title :style="{ padding: isMobile ? '0px' : '15px 16px 16px' }">
                    <div v-if="!isMobile" class="d-flex align-center">
                        <template v-if="routesToVisualization.includes(route.name)">
                            <v-btn class="ml-0" variant="plain" icon="mdi-chevron-left" @click="backToAASViewer()" />
                            <v-icon icon="custom:aasIcon" color="primary" size="small" class="ml-2" />
                            <span class="text-truncate ml-2">
                                {{ nameToDisplay(selectedAAS) }}
                            </span>
                            <template v-if="nameToDisplay(selectedNode)">
                                <span class="text-truncate ml-2">|</span>
                                <span class="text-truncate ml-2">{{ nameToDisplay(selectedNode) }}</span>
                            </template>
                        </template>
                        <span v-else>Visualization</span>
                    </div>
                    <div v-else class="d-flex align-center">
                        <v-btn class="ml-0" variant="plain" icon="mdi-chevron-left" @click="backToSubmodelList()" />
                        <v-icon icon="custom:aasIcon" color="primary" size="small" class="ml-2" />
                        <span class="text-truncate ml-2">
                            {{ nameToDisplay(selectedAAS) }}
                        </span>
                    </div>
                </v-card-title>
                <v-divider></v-divider>
            </template>
            <v-card-text
                style="overflow-y: auto"
                :style="
                    isMobile
                        ? 'height: calc(100svh - 154px)'
                        : aasSubmodelViewerMode || visualizationMode
                          ? 'height: calc(100svh - 105px)'
                          : 'height: calc(100svh - 170px)'
                ">
                <SubmodelElementVisualization />
            </v-card-text>
        </v-card>
    </v-container>
</template>

<script lang="ts" setup>
    import type { RouteRecordNameGeneric } from 'vue-router';
    import { computed, onMounted, ref, watch } from 'vue';
    import { useRoute, useRouter } from 'vue-router';
    import { useReferableUtils } from '@/composables/AAS/ReferableUtils';
    import { useAASStore } from '@/store/AASDataStore';
    import { useEnvStore } from '@/store/EnvironmentStore';
    import { useInfrastructureStore } from '@/store/InfrastructureStore';
    import { useNavigationStore } from '@/store/NavigationStore';

    // Vue Router
    const route = useRoute();
    const router = useRouter();

    // Stores
    const navigationStore = useNavigationStore();
    const aasStore = useAASStore();
    const envStore = useEnvStore();
    const infrastructureStore = useInfrastructureStore();

    // Composables
    const { nameToDisplay } = useReferableUtils();

    // Data
    const submodelElementData = ref({} as any);
    const routesToVisualization: Array<RouteRecordNameGeneric> = ['ComponentVisualization', 'Visualization'];

    // Computed Properties
    const aasRegistryURL = computed(() => infrastructureStore.getAASRegistryURL);
    const submodelRegistryURL = computed(() => infrastructureStore.getSubmodelRegistryURL);
    const selectedAAS = computed(() => aasStore.getSelectedAAS);
    const selectedNode = computed(() => aasStore.getSelectedNode);
    const isMobile = computed(() => navigationStore.getIsMobile);
    const singleAas = computed(() => envStore.getSingleAas);
    const visualizationMode = computed(() => routesToVisualization.includes(route.name));
    const aasSubmodelViewerMode = computed(() => route.name === 'AASSubmodelViewer');

    // Watchers
    watch(
        () => aasRegistryURL.value,
        () => {
            resetLocalData();
        }
    );

    watch(
        () => submodelRegistryURL.value,
        () => {
            resetLocalData();
        }
    );

    watch(
        () => selectedAAS.value,
        () => {
            resetLocalData();
            initialize();
        }
    );

    watch(
        () => selectedNode.value,
        () => {
            resetLocalData();
            initialize();
        }
    );

    onMounted(() => {
        initialize();
    });

    function initialize(): void {
        if (Object.keys(selectedNode.value).length === 0) {
            resetLocalData();
            return;
        }
        submodelElementData.value = { ...selectedNode.value };
    }

    function resetLocalData(): void {
        submodelElementData.value = {};
    }

    function backToSubmodelList(): void {
        router.push({ name: 'SubmodelList', query: route.query });
    }

    function backToAASViewer(): void {
        router.push({ name: 'AASViewer', query: route.query });
    }
</script>
