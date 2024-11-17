<template>
    <v-container fluid class="pa-0">
        <!-- List of all available Submodel and SubmodelElement Plugins matched by their SemanticID -->
        <template
            v-if="
                SelectedNode &&
                Object.keys(SelectedNode).length > 0 &&
                Object.keys(submodelElementData).length > 0 &&
                submodelElementData.semanticId &&
                submodelElementData.semanticId.keys &&
                submodelElementData.semanticId.keys.length > 0
            ">
            <HTWFuehrungskomponente
                v-if="checkSemanticId(submodelElementData, 'http://htw-berlin.de/smc_statemachine')"
                :submodel-element-data="submodelElementData"
                :selected-node="selectedNode"></HTWFuehrungskomponente>
            <DigitalNameplate
                v-else-if="checkSemanticId(submodelElementData, 'https://admin-shell.io/zvei/nameplate/2/0/Nameplate')"
                :submodel-element-data="submodelElementData"></DigitalNameplate>
            <TimeSeriesData
                v-else-if="checkSemanticId(submodelElementData, 'https://admin-shell.io/idta/TimeSeries/1/1')"
                :submodel-element-data="submodelElementData"></TimeSeriesData>
            <BillsOfMaterial
                v-else-if="
                    checkSemanticId(
                        submodelElementData,
                        'https://admin-shell.io/idta/HierarchicalStructures/1/0/Submodel'
                    ) ||
                    checkSemanticId(
                        submodelElementData,
                        'https://admin-shell.io/idta/HierarchicalStructures/1/1/Submodel'
                    )
                "
                :submodel-element-data="submodelElementData"></BillsOfMaterial>
            <HandoverDocumentation
                v-else-if="checkSemanticId(submodelElementData, '0173-1#01-AHF578#001')"
                :submodel-element-data="submodelElementData"></HandoverDocumentation>
            <ContactInformation
                v-else-if="
                    checkSemanticId(
                        submodelElementData,
                        'https://admin-shell.io/zvei/nameplate/1/0/ContactInformations'
                    )
                "
                :submodel-element-data="submodelElementData"></ContactInformation>
            <TechnicalData
                v-else-if="
                    checkSemanticId(submodelElementData, 'https://admin-shell.io/ZVEI/TechnicalData/Submodel/1/2')
                "
                :submodel-element-data="submodelElementData"></TechnicalData>
            <JSONArrayProperty
                v-else-if="checkSemanticId(submodelElementData, 'http://iese.fraunhofer.de/prop_jsonarray')"
                :submodel-element-data="submodelElementData"></JSONArrayProperty>
            <!-- Plugins added by the user are dynamically registered here -->
            <template v-else-if="filteredPlugins.length > 0">
                <component
                    :is="plugin.name"
                    v-for="(plugin, i) in filteredPlugins"
                    :key="i"
                    :submodel-element-data="submodelElementData"></component>
            </template>
            <GenericDataVisu
                v-else-if="viewerMode"
                :submodel-element-data="submodelElementData.submodelElements"></GenericDataVisu>
        </template>
        <template
            v-else-if="
                SelectedNode && Object.keys(SelectedNode).length > 0 && Object.keys(submodelElementData).length > 0
            ">
            <GenericDataVisu
                v-if="viewerMode"
                :submodel-element-data="submodelElementData.submodelElements"></GenericDataVisu>
        </template>
        <!-- List of all File/Blob-Plugins matched by their contentType -->
        <template
            v-if="
                SelectedNode &&
                Object.keys(SelectedNode).length > 0 &&
                Object.keys(submodelElementData).length > 0 &&
                (submodelElementData.modelType == 'File' || submodelElementData.modelType == 'Blob')
            ">
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
    </v-container>
</template>

<script lang="ts">
    import { defineComponent } from 'vue';
    import { useRoute } from 'vue-router';
    import GenericDataVisu from '@/components/UIComponents/GenericDataVisu.vue';
    import CADPreview from '@/components/Visualizations/CADPreview.vue';
    import ImagePreview from '@/components/Visualizations/ImagePreview.vue';
    import PDFPreview from '@/components/Visualizations/PDFPreview.vue';
    import HTWFuehrungskomponente from '@/components/Visualizations/SubmodelElements/HTWFuehrungskomponente.vue';
    import JSONArrayProperty from '@/components/Visualizations/SubmodelElements/JSONArrayProperty.vue';
    import BillsOfMaterial from '@/components/Visualizations/Submodels/BillsOfMaterial.vue';
    import ContactInformation from '@/components/Visualizations/Submodels/ContactInformation.vue';
    import DigitalNameplate from '@/components/Visualizations/Submodels/DigitalNameplate.vue';
    import HandoverDocumentation from '@/components/Visualizations/Submodels/HandoverDocumentation.vue';
    import TechnicalData from '@/components/Visualizations/Submodels/TechnicalData.vue';
    import TimeSeriesData from '@/components/Visualizations/Submodels/TimeSeriesData.vue';
    import SubmodelElementHandling from '@/mixins/SubmodelElementHandling';
    import { useAASStore } from '@/store/AASDataStore';
    import { useNavigationStore } from '@/store/NavigationStore';

    export default defineComponent({
        name: 'SubmodelEntrypoint',
        components: {
            HTWFuehrungskomponente,
            DigitalNameplate,
            TimeSeriesData,
            BillsOfMaterial,
            HandoverDocumentation,
            ContactInformation,
            TechnicalData,
            JSONArrayProperty,
            GenericDataVisu,
            ImagePreview,
            PDFPreview,
            CADPreview,
        },
        mixins: [SubmodelElementHandling],
        props: ['submodelElementData', 'selectedNode'],

        setup() {
            const navigationStore = useNavigationStore();
            const aasStore = useAASStore();
            const route = useRoute();

            return {
                navigationStore, // NavigationStore Object
                aasStore, // AASStore Object
                plugins: [] as Array<any>,
                route, // Route Object
            };
        },

        computed: {
            // Get the selected Treeview Node (SubmodelElement) from the store
            SelectedNode() {
                return this.aasStore.getSelectedNode;
            },

            ImportedPlugins() {
                return this.navigationStore.getPlugins;
            },

            // Filtered Plugins
            filteredPlugins() {
                return this.ImportedPlugins.filter((plugin: any) => {
                    if (!plugin.semanticId) return false;

                    if (typeof plugin.semanticId === 'string') {
                        return this.checkSemanticId(this.submodelElementData, plugin.semanticId);
                    } else if (plugin.semanticId.constructor === Array) {
                        for (const pluginSemanticId of plugin.semanticId) {
                            if (this.checkSemanticId(this.submodelElementData, pluginSemanticId)) return true;
                        }
                        return false;
                    }
                    return false;
                });
            },

            // return if in viewer mode
            viewerMode() {
                // check if the route name is aasviewer
                return this.route.name === 'AASViewer' || this.route.name === 'ComponentVisualization';
            },
        },
    });
</script>
