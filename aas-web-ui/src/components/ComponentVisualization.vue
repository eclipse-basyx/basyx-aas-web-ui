<template>
    <v-container fluid class="pa-0">
        <v-card color="card" elevation="0">
            <v-card-title v-if="!isMobile" style="padding: 15px 16px 16px"> Visualization </v-card-title>
            <v-card-title v-else style="padding: 15px 16px 16px">
                <v-row align="center">
                    <v-col cols="auto" class="pa-0">
                        <v-btn
                            class="ml-2"
                            variant="plain"
                            icon="mdi-chevron-left"
                            @click="backToSubmodelList()"></v-btn>
                    </v-col>
                    <v-col cols="auto">
                        <span>Visualization</span>
                    </v-col>
                    <v-col v-if="nameToDisplay(SelectedAAS)" cols="auto" class="pl-1">
                        <v-chip size="x-small" color="primary" label border>{{
                            'AAS: ' + nameToDisplay(SelectedAAS)
                        }}</v-chip>
                    </v-col>
                </v-row>
            </v-card-title>
            <v-divider></v-divider>
            <v-card-text
                v-if="
                    SelectedNode && Object.keys(SelectedNode).length > 0 && Object.keys(submodelElementData).length > 0
                "
                style="overflow-y: auto; height: calc(100svh - 170px)">
                <template v-if="submodelElementData.modelType == 'File' || submodelElementData.modelType == 'Blob'">
                    <ImagePreview
                        v-if="submodelElementData.contentType && submodelElementData.contentType.includes('image')"
                        :submodel-element-data="submodelElementData"></ImagePreview>
                    <PDFPreview
                        v-if="submodelElementData.contentType && submodelElementData.contentType.includes('pdf')"
                        :submodel-element-data="submodelElementData"></PDFPreview>
                    <CADPreview
                        v-if="
                            submodelElementData.contentType &&
                            (submodelElementData.contentType.includes('sla') ||
                                submodelElementData.contentType.includes('stl') ||
                                submodelElementData.contentType.includes('model') ||
                                submodelElementData.contentType.includes('obj') ||
                                submodelElementData.contentType.includes('gltf'))
                        "
                        :submodel-element-data="submodelElementData"></CADPreview>
                </template>
                <template v-else>
                    <template
                        v-if="
                            submodelElementData.semanticId &&
                            submodelElementData.semanticId.keys &&
                            submodelElementData.semanticId.keys.length > 0
                        ">
                        <component
                            :is="plugin.name"
                            v-for="(plugin, index) in filteredPlugins"
                            :key="index"
                            :submodel-element-data="submodelElementData">
                            {{ plugin.name }}
                        </component>
                    </template>
                    <GenericDataVisu
                        v-if="viewerMode && filteredPlugins.length === 0"
                        :submodel-element-data="submodelElementData.submodelElements"></GenericDataVisu>
                </template>
            </v-card-text>
        </v-card>
    </v-container>
</template>

<script lang="ts" setup>
    import { computed, onMounted, ref, watch } from 'vue';
    import { useRoute, useRouter } from 'vue-router';
    import { useAASRepositoryClient } from '@/composables/Client/AASRepositoryClient';
    import { useRequestHandling } from '@/composables/RequestHandling';
    import { useAASStore } from '@/store/AASDataStore';
    import { useNavigationStore } from '@/store/NavigationStore';
    import { formatDate } from '@/utils/DateUtils';
    import { nameToDisplay } from '@/utils/ReferableUtils';
    import { checkSemanticId } from '@/utils/SemanticIdUtils';

    // Vue Router
    const route = useRoute();
    const router = useRouter();

    // Composables
    const { getRequest } = useRequestHandling();
    const { fetchAndDispatchAas } = useAASRepositoryClient();

    // Stores
    const navigationStore = useNavigationStore();
    const aasStore = useAASStore();

    // Data
    const submodelElementData = ref({} as any);

    // Computed Properties
    const aasRegistryServerURL = computed(() => navigationStore.getAASRegistryURL);
    const submodelRegistryServerURL = computed(() => navigationStore.getSubmodelRegistryURL);
    const SelectedAAS = computed(() => aasStore.getSelectedAAS);
    const SelectedNode = computed(() => aasStore.getSelectedNode);
    const RealTimeObject = computed(() => aasStore.getRealTimeObject);
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
            .sort((pluginA, pluginB) => {
                let pluginASemanticId = '';
                let pluginBSemanticId = '';

                if (typeof pluginA.semanticId === 'string') pluginASemanticId = pluginA.semanticId;
                if (typeof pluginB.semanticId === 'string') pluginBSemanticId = pluginB.semanticId;

                if (Array.isArray(pluginA.semanticId)) {
                    if (pluginA.semanticId.length > 0) {
                        pluginA.semanticId
                            .sort((semanticIdA, semanticIdB) => semanticIdA.localeCompare(semanticIdB))
                            .reverse();
                        pluginASemanticId = pluginA.semanticId[0];
                    }
                }

                if (Array.isArray(pluginB.semanticId)) {
                    if (pluginB.semanticId.length > 0) {
                        pluginB.semanticId
                            .sort((semanticIdA, semanticIdB) => semanticIdA.localeCompare(semanticIdB))
                            .reverse();
                        pluginBSemanticId = pluginB.semanticId[0];
                    }
                }

                return pluginASemanticId.localeCompare(pluginBSemanticId);
            })
            .reverse();

        return plugins;
    });
    const viewerMode = computed(() => route.name === 'AASViewer' || route.name === 'ComponentVisualization');

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
    watch(SelectedAAS, () => {
        submodelElementData.value = {};
    });

    // Watch for changes in the SelectedNode and (re-)initialize the Component
    watch(SelectedNode, () => {
        // clear old submodelElementData
        submodelElementData.value = {};
        initializeView(); // initialize list
    });

    // Watch for changes in the RealTimeDataObject and (re-)initialize the Component
    watch(RealTimeObject, () => {
        // clear old submodelElementData
        submodelElementData.value = {};
        initializeView(); // initialize list
    });

    onMounted(() => {
        if (Object.keys(SelectedNode.value).length > 0 && isMobile.value) {
            // initialize if component got mounted on mobile devices (needed there because it is rendered in a separate view)
            initializeView();
        } else if (Object.keys(SelectedNode.value).length === 0 && route.path == '/componentvisualization') {
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
        // console.log('Selected Node: ', this.RealTimeObject);
        // Check if a Node is selected
        if (Object.keys(RealTimeObject.value).length === 0) {
            submodelElementData.value = {}; // Reset the SubmodelElement Data when no Node is selected
            return;
        }
        submodelElementData.value = { ...RealTimeObject.value }; // create local copy of the SubmodelElement Object
        // console.log('SubmodelElement Data (ComponentVisualization): ', this.submodelElementData);
    }

    async function initializeViewWithRouteParams() {
        const searchParams = new URL(window.location.href).searchParams;
        const aasEndpoint = searchParams.get('aas');
        const path = searchParams.get('path');

        if (aasEndpoint && path) {
            await fetchAndDispatchAas(aasEndpoint);

            // Request the selected SubmodelElement
            let context = 'retrieving SubmodelElement';
            let disableMessage = true;
            getRequest(path, context, disableMessage).then((response: any) => {
                if (response.success) {
                    // execute if the Request was successful
                    response.data.timestamp = formatDate(new Date()); // add timestamp to the SubmodelElement Data
                    response.data.path = path; // add the path to the SubmodelElement Data
                    response.data.isActive = true; // add the isActive Property to the SubmodelElement Data
                    // console.log('SubmodelElement Data: ', response.data)
                    // dispatch the SubmodelElementPath set by the URL to the store
                    submodelElementData.value = response.data;
                    aasStore.dispatchRealTimeObject(submodelElementData.value);
                } else {
                    // execute if the Request failed
                    if (Object.keys(response.data).length === 0) {
                        // don't copy the static SubmodelElement Data if no Node is selected or Node is invalid
                        navigationStore.dispatchSnackbar({
                            status: true,
                            timeout: 60000,
                            color: 'error',
                            btnColor: 'buttonText',
                            text: 'No valid SubmodelElement under the given Path',
                        }); // Show Error Snackbar
                        return;
                    }
                }
            });
        }
    }

    function backToSubmodelList() {
        router.push({ name: 'SubmodelList', query: route.query });
    }
</script>
