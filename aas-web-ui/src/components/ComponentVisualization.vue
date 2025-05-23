<template>
    <v-container fluid class="pa-0">
        <v-card color="card" elevation="0">
            <template v-if="!singleAas || isMobile">
                <!-- Title Bar in the Submodel Element View -->
                <v-card-title :style="{ padding: isVisualization ? '' : '15px 16px 16px' }">
                    <div v-if="!isMobile">
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
                    <v-spacer></v-spacer>
                    <v-tooltip
                        v-if="viewerMode && selectedAAS && Object.keys(selectedAAS).length > 0"
                        open-delay="600"
                        location="bottom"
                        :disabled="isMobile">
                        <template #activator="{ props }">
                            <v-btn
                                icon="mdi-expand-all"
                                variant="plain"
                                v-bind="props"
                                class="ml-1"
                                :disabled="!selectedNode || Object.keys(selectedNode).length === 0"
                                @click="extendAllElements()">
                            </v-btn>
                        </template>
                        <span>Expand elements</span>
                    </v-tooltip>
                    <v-tooltip
                        v-if="viewerMode && selectedAAS && Object.keys(selectedAAS).length > 0"
                        open-delay="600"
                        location="bottom"
                        :disabled="isMobile">
                        <template #activator="{ props }">
                            <v-btn
                                icon="mdi-collapse-all"
                                variant="plain"
                                v-bind="props"
                                class="ml-n3"
                                @click="collapseAllElements()">
                            </v-btn>
                        </template>
                        <span>Collapse elements</span>
                    </v-tooltip>
                </v-card-title>
                <v-divider></v-divider>
            </template>
            <v-card-text style="overflow-y: auto"
                :style="singleAas && !isMobile ? 'height: calc(100svh - 105px)' : 'height: calc(100svh - 170px)'">
                <template v-if="
                        selectedAAS &&
                        Object.keys(selectedAAS).length > 0 &&
                        selectedNode &&
                        Object.keys(selectedNode).length > 0 &&
                        submodelElementData &&
                        Object.keys(submodelElementData).length > 0
                    ">
                    <!-- Digital Nameplate Genenrator -->
                    <template v-if="selectedNode.idShort === 'Nameplate'"">
                        <div style="background-color: white">    
                            <div v-html="nameplateHtml"></div>
                        </div>
                        <br>    
                        <v-btn color="primary" @click="downloadNameplate">Download Nameplate</v-btn>
                        <br>
                        <br>
                    </template>
                    <!-- File / Blob Visualizations -->
                    <template v-if="['File', 'Blob'].includes(submodelElementData.modelType)">
                        <ImagePreview
                            v-if="submodelElementData?.contentType && submodelElementData.contentType.includes('image')"
                            :submodel-element-data="submodelElementData"></ImagePreview>
                        <PDFPreview
                            v-if="submodelElementData?.contentType && submodelElementData.contentType.includes('pdf')"
                            :submodel-element-data="submodelElementData"></PDFPreview>
                        <CADPreview v-if="
                                submodelElementData?.contentType &&
                                (submodelElementData.contentType.includes('sla') ||
                                    submodelElementData.contentType.includes('stl') ||
                                    submodelElementData.contentType.includes('model') ||
                                    submodelElementData.contentType.includes('obj') ||
                                    submodelElementData.contentType.includes('gltf'))
" :submodel-element-data="submodelElementData"></CADPreview>
                    </template>
                    <!-- Plugin Visualizations -->
                    <template v-else>
                        <template v-if="
                                submodelElementData.semanticId &&
                                submodelElementData.semanticId.keys &&
                                submodelElementData.semanticId.keys.length > 0 &&
                                filteredPlugins.length > 0
                            ">
                            <component :is="plugin.name" v-for="(plugin, index) in filteredPlugins" :key="index"
                                :submodel-element-data="submodelElementData">
                                {{ plugin.name }}
                            </component>
                        </template>
                        <template v-else-if="submodelElementData?.idShort === 'Nameplate'">
                            <NameplateVisu :submodel-element-data="submodelElementData"></NameplateVisu>
                        </template>
                        <template v-else-if="submodelElementData?.idShort === 'TechnicalData'">
                            <TechnicalDataVisu :submodel-element-data="submodelElementData"></TechnicalDataVisu>
                            <!--DEBUG generic data visu-->
                            <GenericDataVisu v-if="viewerMode"
                                :submodel-element-data="submodelElementData.submodelElements"></GenericDataVisu>
                        </template>
                        <template v-else>
                            <GenericDataVisu
                                ref="genericDataVisuRef"
                                v-if="viewerMode"
                                :submodel-element-data="submodelElementData.submodelElements"></GenericDataVisu>
                            <v-empty-state v-else title="No available visualization"
                                class="text-divider"></v-empty-state>
                        </template>
                    </template>
                </template>
                <v-empty-state v-else-if="!selectedAAS || Object.keys(selectedAAS).length === 0" title="No selected AAS"
                    class="text-divider"></v-empty-state>
                <v-empty-state v-else-if="!selectedNode || Object.keys(selectedNode).length === 0"
                    title="No selected Submodel / Submodel Element"
                    text="Select a Submodel / Submodel Element to view its visualization"
                    class="text-divider"></v-empty-state>
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
    import { useNavigationStore } from '@/store/NavigationStore';
    import { checkSemanticId } from '@/utils/AAS/SemanticIdUtils';
    import GenericDataVisu from '@/components/UIComponents/GenericDataVisu.vue';

    // Digital Nameplate Generator
    import NameplateGenerator from '@/utils/nameplateGenerator/NameplateGenerator.js'
    import formatJSON from '@/utils/nameplateGenerator/JSONFormater.ts';
    const nameplateHtml = ref<string | null>(null);

    // Vue Router
    const route = useRoute();
    const router = useRouter();

    // Stores
    const navigationStore = useNavigationStore();
    const aasStore = useAASStore();
    const envStore = useEnvStore();

    // Composables
    const { nameToDisplay } = useReferableUtils();

    // Data
    const submodelElementData = ref({} as any);
    const genericDataVisuRef = ref<{ collapseAllPanels: () => void; expandAllPanels: () => void } | null>(null);
    const routesToVisualization: Array<RouteRecordNameGeneric> = ['ComponentVisualization', 'Visualization'];

    // Computed Properties
    const aasRegistryURL = computed(() => navigationStore.getAASRegistryURL);
    const submodelRegistryURL = computed(() => navigationStore.getSubmodelRegistryURL);
    const selectedAAS = computed(() => aasStore.getSelectedAAS);
    const selectedNode = computed(() => aasStore.getSelectedNode);
    const isMobile = computed(() => navigationStore.getIsMobile);
    const singleAas = computed(() => envStore.getSingleAas);
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
    const viewerMode = computed(() => route.name === 'SubmodelViewer' || routesToVisualization.includes(route.name));
    const isVisualization = computed(() => route.name === 'Visualization');

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
        // Digital Nameplate Generator
        const dom = document.implementation.createHTMLDocument('New Document');
        dom.body.innerHTML = '<div id="testNR1">Placeholder</div>'; // Setze die ID des Elements
        fetchNameplateHtml(dom);
        
        if (Object.keys(selectedNode.value).length === 0) {
            resetLocalData();
            return;
        }
        submodelElementData.value = { ...selectedNode.value };
    }

    // START Digital Nameplate Generator
    function generateNameplate(dom: Document): Promise<string> {
        return new Promise((resolve, reject) => {
            try {
                let formatedJSON = formatJSON(selectedNode.value)
                const html = NameplateGenerator.nameplateBootstrap(JSON.parse(JSON.stringify(formatedJSON)), 'testNR1', dom);
                resolve(html); // HTML zurückgeben
            } catch (error) {
                console.error('Error while generating nameplate:', error);
                reject(error); // Fehler weitergeben
            }
        });
    }

    function fetchNameplateHtml(dom: Document): void {
        generateNameplate(dom)
            .then((html) => {
                nameplateHtml.value = html; // HTML in die reaktive Variable speichern
            })
            .catch((error) => {
                console.error('Error while generating nameplate:', error);
            });
    }

    function downloadNameplate(): void {
    if (!nameplateHtml.value) {
        console.error('No nameplate HTML available to download.');
        return;
    }

    // Erstelle einen Blob aus dem HTML-Inhalt
    const blob = new Blob([nameplateHtml.value], { type: 'text/html' });

    // Erstelle einen temporären Download-Link
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'nameplate.html';
    link.click();

    // Bereinige den temporären Link
    URL.revokeObjectURL(link.href);
    }
    // END Digital Nameplate Generator

    function resetLocalData(): void {
        submodelElementData.value = {};
    }

    function backToSubmodelList(): void {
        router.push({ name: 'SubmodelList', query: route.query });
    }

    function backToAASViewer(): void {
        router.push({ name: 'AASViewer', query: route.query });
    }

    function collapseAllElements(): void {
        if (genericDataVisuRef.value) {
            genericDataVisuRef.value.collapseAllPanels(); // Call the function from GenericDataVisu
        }
    }

    function extendAllElements(): void {
        if (genericDataVisuRef.value) {
            genericDataVisuRef.value.expandAllPanels(); // Call the function from GenericDataVisu
        }
    }   

</script>
