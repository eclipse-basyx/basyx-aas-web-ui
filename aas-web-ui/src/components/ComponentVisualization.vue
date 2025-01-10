<template>
    <v-container fluid class="pa-0">
        <v-card color="card" elevation="0">
            <v-card-title :style="{ padding: isMobile ? '' : '15px 16px 16px' }">
                <div v-if="!isMobile">Visualization</div>
                <div v-else class="d-flex align-center">
                    <v-btn class="ml-0" variant="plain" icon="mdi-chevron-left" @click="backToSubmodelList()" />
                    <v-icon icon="custom:aasIcon" color="primary" size="small" class="ml-2" />
                    <span class="text-truncate ml-2">
                        {{ nameToDisplay(selectedAAS) }}
                    </span>
                </div>
            </v-card-title>
            <v-divider></v-divider>
            <v-card-text style="overflow-y: auto; height: calc(100svh - 170px)">
                <template
                    v-if="
                        selectedAAS &&
                        Object.keys(selectedAAS).length > 0 &&
                        selectedNode &&
                        Object.keys(selectedNode).length > 0 &&
                        submodelElementData &&
                        Object.keys(submodelElementData).length > 0
                    ">
                    <!-- File / Blob Visualizations -->
                    <template v-if="['File', 'Blob'].includes(submodelElementData.modelType)">
                        <ImagePreview
                            v-if="submodelElementData?.contentType && submodelElementData.contentType.includes('image')"
                            :submodel-element-data="submodelElementData"></ImagePreview>
                        <PDFPreview
                            v-if="submodelElementData?.contentType && submodelElementData.contentType.includes('pdf')"
                            :submodel-element-data="submodelElementData"></PDFPreview>
                        <CADPreview
                            v-if="
                                submodelElementData?.contentType &&
                                (submodelElementData.contentType.includes('sla') ||
                                    submodelElementData.contentType.includes('stl') ||
                                    submodelElementData.contentType.includes('model') ||
                                    submodelElementData.contentType.includes('obj') ||
                                    submodelElementData.contentType.includes('gltf'))
                            "
                            :submodel-element-data="submodelElementData"></CADPreview>
                    </template>
                    <!-- Plugin Visualizations -->
                    <template v-else>
                        <template
                            v-if="
                                submodelElementData.semanticId &&
                                submodelElementData.semanticId.keys &&
                                submodelElementData.semanticId.keys.length > 0 &&
                                filteredPlugins.length > 0
                            ">
                            <component
                                :is="plugin.name"
                                v-for="(plugin, index) in filteredPlugins"
                                :key="index"
                                :submodel-element-data="submodelElementData">
                                {{ plugin.name }}
                            </component>
                        </template>
                        <template v-else>
                            <GenericDataVisu
                                v-if="viewerMode"
                                :submodel-element-data="submodelElementData.submodelElements"></GenericDataVisu>
                            <v-empty-state
                                v-else
                                title="No available visualization"
                                class="text-divider"></v-empty-state>
                        </template>
                    </template>
                </template>
                <v-empty-state
                    v-else-if="!selectedAAS || Object.keys(selectedAAS).length === 0"
                    title="No selected AAS"
                    class="text-divider"></v-empty-state>
                <v-empty-state
                    v-else-if="!selectedNode || Object.keys(selectedNode).length === 0"
                    title="No selected Submodel / Submodel Element"
                    text="Select a Submodel / Submodel Element to view its visualization"
                    class="text-divider"></v-empty-state>
            </v-card-text>
        </v-card>
    </v-container>
</template>

<script lang="ts" setup>
    import { computed, onMounted, ref, watch } from 'vue';
    import { useRoute, useRouter } from 'vue-router';
    import { useAASHandling } from '@/composables/AASHandling';
    import { useSMEHandling } from '@/composables/SMEHandling';
    import { useAASStore } from '@/store/AASDataStore';
    import { useNavigationStore } from '@/store/NavigationStore';
    import { nameToDisplay } from '@/utils/ReferableUtils';
    import { checkSemanticId } from '@/utils/SemanticIdUtils';

    // Vue Router
    const route = useRoute();
    const router = useRouter();

    // Composables
    const { fetchAndDispatchAas } = useAASHandling();
    const { fetchAndDispatchSme } = useSMEHandling();

    // Stores
    const navigationStore = useNavigationStore();
    const aasStore = useAASStore();

    // Data
    const submodelElementData = ref({} as any);

    // Computed Properties
    const aasRegistryServerURL = computed(() => navigationStore.getAASRegistryURL);
    const submodelRegistryServerURL = computed(() => navigationStore.getSubmodelRegistryURL);
    const selectedAAS = computed(() => aasStore.getSelectedAAS);
    const selectedNode = computed(() => aasStore.getSelectedNode);
    const isMobile = computed(() => navigationStore.getIsMobile);
    const importedPlugins = computed(() => navigationStore.getPlugins);
    const filteredPlugins = computed(() => {
        let plugins = importedPlugins.value.filter((plugin: any) => {
            if (!plugin.semanticId) return false;

            if (typeof plugin.semanticId === 'string') {
                return checkSemanticId(submodelElementData.value, plugin.semanticId);
            } else if (plugin.semanticId.constructor === Array) {
                for (const pluginSemanticId of plugin.semanticId) {
                    if (checkSemanticId(submodelElementData.value, pluginSemanticId)) return true;
                }
                return false;
            }
            return false;
        });

        // In case of multiple plugins matching for the semanticId of
        // submodelElementData, the plugins are sorted in descending
        // alphabetical order with respect to their semanticIds.
        // This will display the latest (in terms of version) plugin on
        // top. Plugins without version in the semanticId will be
        // displayed at the bottom.

        // Sort filtered plugins with respect to semanticId
        plugins
            .sort((pluginA: any, pluginB: any) => {
                let pluginASemanticId = '';
                let pluginBSemanticId = '';

                if (typeof pluginA.semanticId === 'string') pluginASemanticId = pluginA.semanticId;
                if (typeof pluginB.semanticId === 'string') pluginBSemanticId = pluginB.semanticId;

                if (Array.isArray(pluginA.semanticId)) {
                    if (pluginA.semanticId.length > 0) {
                        pluginA.semanticId
                            .sort((semanticIdA: any, semanticIdB: any) => semanticIdA.localeCompare(semanticIdB))
                            .reverse();
                        pluginASemanticId = pluginA.semanticId[0];
                    }
                }

                if (Array.isArray(pluginB.semanticId)) {
                    if (pluginB.semanticId.length > 0) {
                        pluginB.semanticId
                            .sort((semanticIdA: any, semanticIdB: any) => semanticIdA.localeCompare(semanticIdB))
                            .reverse();
                        pluginBSemanticId = pluginB.semanticId[0];
                    }
                }

                return pluginASemanticId.localeCompare(pluginBSemanticId);
            })
            .reverse();

        return plugins;
    });
    const viewerMode = computed(() => route.name === 'SubmodelViewer' || route.name === 'ComponentVisualization');

    // Watchers
    // Resets the submodelElementData when the AAS Registry changes
    watch(aasRegistryServerURL, () => {
        if (!aasRegistryServerURL.value) {
            submodelElementData.value = {};
        }
    });

    // Resets the submodelElementData when the Submodel Registry changes
    watch(submodelRegistryServerURL, () => {
        if (!submodelRegistryServerURL.value) {
            submodelElementData.value = {};
        }
    });

    // Resets the submodelElementData when the AAS changes
    watch(selectedAAS, () => {
        submodelElementData.value = {};
    });

    // Watch for changes in the selectedNode and (re-)initialize the Component
    watch(selectedNode, () => {
        // clear old submodelElementData
        submodelElementData.value = {};
        initializeView(); // initialize list
    });

    onMounted(() => {
        if (Object.keys(selectedNode.value).length > 0 && isMobile.value) {
            // initialize if component got mounted on mobile devices (needed there because it is rendered in a separate view)
            initializeView();
        } else if (Object.keys(selectedNode.value).length === 0 && route.path == '/componentvisualization') {
            const searchParams = new URL(window.location.href).searchParams;
            const aasEndpoint = searchParams.get('aas');
            const path = searchParams.get('path');

            // check if the aas Query and the path Query are set in the URL and if so initialize
            if (aasEndpoint && path) {
                initializeViewWithRouteParams();
            }
        }
    });

    function initializeView() {
        // console.log('Selected Node: ', this.realTimeObject);
        // Check if a Node is selected
        if (Object.keys(selectedNode.value).length === 0) {
            submodelElementData.value = {}; // Reset the SubmodelElement Data when no Node is selected
            return;
        }
        submodelElementData.value = { ...selectedNode.value }; // create local copy of the SubmodelElement Object
        // console.log('SubmodelElement Data (ComponentVisualization): ', this.submodelElementData);
    }

    async function initializeViewWithRouteParams() {
        const searchParams = new URL(window.location.href).searchParams;
        const aasEndpoint = searchParams.get('aas');
        const path = searchParams.get('path');

        if (aasEndpoint && path) {
            await fetchAndDispatchAas(aasEndpoint);
            await fetchAndDispatchSme(path);
        }
    }

    function backToSubmodelList() {
        router.push({ name: 'SubmodelList', query: route.query });
    }
</script>
