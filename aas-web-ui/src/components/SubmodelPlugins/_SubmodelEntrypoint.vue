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
                :submodelElementData="submodelElementData"
                :selectedNode="selectedNode"></HTWFuehrungskomponente>
            <DigitalNameplate
                v-else-if="checkSemanticId(submodelElementData, 'https://admin-shell.io/zvei/nameplate/2/0/Nameplate')"
                :submodelElementData="submodelElementData"></DigitalNameplate>
            <TimeSeriesData
                v-else-if="checkSemanticId(submodelElementData, 'https://admin-shell.io/idta/TimeSeries/1/1')"
                :submodelElementData="submodelElementData"></TimeSeriesData>
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
                :submodelElementData="submodelElementData"></BillsOfMaterial>
            <HandoverDocumentation
                v-else-if="checkSemanticId(submodelElementData, '0173-1#01-AHF578#001')"
                :submodelElementData="submodelElementData"></HandoverDocumentation>
            <ContactInformation
                v-else-if="
                    checkSemanticId(
                        submodelElementData,
                        'https://admin-shell.io/zvei/nameplate/1/0/ContactInformations'
                    )
                "
                :submodelElementData="submodelElementData"></ContactInformation>
            <TechnicalData
                v-else-if="
                    checkSemanticId(submodelElementData, 'https://admin-shell.io/ZVEI/TechnicalData/Submodel/1/2')
                "
                :submodelElementData="submodelElementData"></TechnicalData>
            <JSONArrayProperty
                v-else-if="checkSemanticId(submodelElementData, 'http://iese.fraunhofer.de/prop_jsonarray')"
                :submodelElementData="submodelElementData"></JSONArrayProperty>
            <GenericDataVisu
                v-else-if="viewerMode"
                :submodelElementData="submodelElementData.submodelElements"></GenericDataVisu>
            <!-- Plugins added by the user are dynamically registered here -->
            <component
                v-for="(plugin, i) in filteredPlugins"
                :key="i"
                :is="plugin.name"
                :submodelElementData="submodelElementData"></component>
        </template>
        <template
            v-else-if="
                SelectedNode && Object.keys(SelectedNode).length > 0 && Object.keys(submodelElementData).length > 0
            ">
            <GenericDataVisu
                v-if="viewerMode"
                :submodelElementData="submodelElementData.submodelElements"></GenericDataVisu>
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
                :submodelElementData="submodelElementData"></ImagePreview>
            <PDFPreview
                v-if="submodelElementData.contentType && submodelElementData.contentType.includes('pdf')"
                :submodelElementData="submodelElementData"></PDFPreview>
            <CADPreview
                v-if="
                    submodelElementData.contentType &&
                    (submodelElementData.contentType.includes('sla') ||
                        submodelElementData.contentType.includes('stl') ||
                        submodelElementData.contentType.includes('model') ||
                        submodelElementData.contentType.includes('obj') ||
                        submodelElementData.contentType.includes('gltf'))
                "
                :submodelElementData="submodelElementData"></CADPreview>
        </template>
    </v-container>
</template>

<script lang="ts">
    import { defineComponent } from 'vue';
    import { useRoute } from 'vue-router';
    import { useNavigationStore } from '@/store/NavigationStore';
    import { useAASStore } from '@/store/AASDataStore';
    import SubmodelElementHandling from '@/mixins/SubmodelElementHandling';

    import HTWFuehrungskomponente from './HTWFuehrungskomponente.vue';
    import DigitalNameplate from './DigitalNameplate.vue';
    import TimeSeriesData from './TimeSeriesData.vue';
    import BillsOfMaterial from './BillsOfMaterial.vue';
    import HandoverDocumentation from './HandoverDocumentation.vue';
    import ContactInformation from './ContactInformation.vue';
    import TechnicalData from './TechnicalData.vue';
    import JSONArrayProperty from './JSONArrayProperty.vue';

    import GenericDataVisu from '@/components/UIComponents/GenericDataVisu.vue';

    import ImagePreview from './ImagePreview.vue';
    import PDFPreview from './PDFPreview.vue';
    import CADPreview from './CADPreview.vue';

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
                    // console.log(plugin.SemanticID === this.submodelElementData.semanticId.keys[0].value ? 'Plugin found: ' + plugin.SemanticID : 'Plugin not found: ' + plugin.SemanticID);
                    return plugin.SemanticID === this.submodelElementData.semanticId.keys[0].value;
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
