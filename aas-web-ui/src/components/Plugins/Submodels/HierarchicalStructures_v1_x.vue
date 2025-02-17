<template>
    <v-container fluid class="pa-0">
        <VisualizationHeader
            :submodel-element-data="submodelElementData"
            default-title="Hierarchical Structures enabling Bills of Material" />
        <!-- BoM Graph -->
        <v-card>
            <v-card-text>
                <div ref="boMCard">
                    <!-- Archetype -->
                    <v-list-item class="px-2 pb-3">
                        <v-list-item-title>
                            <span class="text-subtitle-2 mr-2">Archetype:</span>
                            <v-chip label size="x-small" border color="primary" style="margin-top: -3px">
                                {{ archetype }}
                            </v-chip>
                        </v-list-item-title>
                    </v-list-item>
                    <div :id="diagramId" ref="boMDiagram" style="position: relative; max-width: 100%"></div>
                </div>
            </v-card-text>
        </v-card>
    </v-container>
</template>

<script lang="ts" setup>
    import mermaid from 'mermaid';
    import { computed, getCurrentInstance, onBeforeUnmount, onMounted, ref, watch } from 'vue';
    import { useTheme } from 'vuetify';
    import { useReferableUtils } from '@/composables/AAS/ReferableUtils';
    import { useSMHandling } from '@/composables/AAS/SMHandling';
    import { useAASDiscoveryClient } from '@/composables/Client/AASDiscoveryClient';
    import { useJumpHandling } from '@/composables/JumpHandling';
    import { useNavigationStore } from '@/store/NavigationStore';
    import { getSubmodelElementBySemanticId } from '@/utils/AAS/SemanticIdUtils';

    // Options
    defineOptions({
        name: 'HierarchicalStructures',
        semanticId: [
            'https://admin-shell.io/idta/HierarchicalStructures/1/0/Submodel',
            'https://admin-shell.io/idta/HierarchicalStructures/1/1/Submodel',
        ],
    });

    // Composables
    const { setData } = useSMHandling();
    const { getAasId } = useAASDiscoveryClient();
    const { nameToDisplay } = useReferableUtils();
    const { jumpToAasById } = useJumpHandling();

    // Stores
    const navigationStore = useNavigationStore();

    // Vuetify
    const theme = useTheme();

    // Props
    const props = defineProps({
        submodelElementData: {
            type: Object as any,
            default: {} as any,
        },
    });

    // Data
    const isLoading = ref(false);
    const archetype = ref('' as string);
    const bomData = ref({} as any);
    const customDefaultThemeColors = {
        nodeBorder: '#000', // change the color of the node borders
        lineColor: '#000', // change the color of the arrow lines
        mainBkg: '#fff', // change the background color of the nodes
    };
    const customDarkThemeColors = {
        nodeBorder: '#fff', // change the color of the node borders
        lineColor: '#fff', // change the color of the arrow lines
        mainBkg: '#000', // change the background color of the nodes
    };

    // Computed Properties
    const isDark = computed(() => theme.global.current.value.dark);
    const primaryColor = computed(() => theme.current.value.colors.primary);

    // Generate a unique diagram ID using the component instance's uid
    const instance = getCurrentInstance();
    const uid = instance?.uid || Math.random().toString(36).substr(2, 9);
    const diagramId = `BoMDiagram-${uid}`;

    // Refs for DOM elements
    const boMDiagram = ref<HTMLElement | null>(null);
    const boMCard = ref<HTMLElement | null>(null);

    // Watcher to update theme dynamically
    watch(isDark, () => {
        applyTheme();
    });

    declare global {
        interface Window {
            callback: any;
        }
    }

    onMounted(() => {
        initializeVisualization();
        window.callback = callback;
    });

    onBeforeUnmount(() => {
        window.callback = null;
    });

    async function initializeVisualization(): Promise<void> {
        isLoading.value = true;

        if (!props.submodelElementData || Object.keys(props.submodelElementData).length === 0) {
            bomData.value = {};
            isLoading.value = false;
            return;
        }

        bomData.value = await setData({ ...props.submodelElementData }, props.submodelElementData.path);

        // apply the primary color to the mermaid settings
        customDefaultThemeColors.nodeBorder = primaryColor.value;
        customDefaultThemeColors.mainBkg = primaryColor.value + '0A';
        customDarkThemeColors.nodeBorder = primaryColor.value;
        customDarkThemeColors.mainBkg = primaryColor.value + '0A';

        // get the archetype of the BoM
        archetype.value = getArchetype(bomData.value);

        // initialize mermaid
        mermaid.initialize({
            startOnLoad: false,
            theme: isDark.value ? 'dark' : 'default',
            themeVariables: isDark.value ? customDarkThemeColors : customDefaultThemeColors,
            securityLevel: 'loose',
        });

        // render mermaid graph
        drawDiagram(bomData.value);

        isLoading.value = false;
    }

    async function drawDiagram(bomData: any): Promise<void> {
        try {
            const element = boMDiagram.value;
            if (!element) {
                console.error('BoMDiagram element not found!');
                return;
            }
            // Build the graph definition
            const graphDefinition = createGraphDefinition(bomData);
            // Use the unique diagramId here
            const { svg, bindFunctions } = await mermaid.render(diagramId, graphDefinition);
            element.innerHTML = svg;

            // Adjust any foreignObject elements for proper sizing
            const foreignObjects = element.querySelectorAll('foreignObject');
            foreignObjects.forEach((foreignObject) => {
                const div = foreignObject.querySelector('div');
                if (div) {
                    const textLength = div.textContent?.length;
                    const baseWidth = Math.max(150, (textLength ?? 0) * 8);
                    const contentWidth = div.scrollWidth;
                    const newWidth = Math.max(baseWidth, contentWidth) + 20;
                    foreignObject.setAttribute('width', newWidth.toString());
                    div.style.maxWidth = `${newWidth}px`;
                }
            });

            // (Optional) Append the element to the card if needed
            const card = boMCard.value;
            if (card && !card.contains(element)) {
                card.appendChild(element);
            }
            // Bind any functions to the graph
            bindFunctions?.(element);
        } catch (error) {
            console.error('Error rendering Mermaid diagram:', error);
        }
    }

    function callback(globalAssetId: string): void {
        getAasId(globalAssetId).then((aasId: string) => {
            if (aasId && aasId.trim() !== '') {
                jumpToAasById(aasId);
            } else {
                navigationStore.dispatchSnackbar({
                    status: true,
                    timeout: 10000,
                    color: 'error',
                    btnColor: 'buttonText',
                    text: 'Could not find matching AAS in the AAS Discovery Service',
                });
            }
        });
    }

    function createGraphDefinition(bomData: any): string {
        let graphDefinition = 'graph LR\n';
        let callBacks = '';
        const entryNode = bomData.submodelElements.find((element: any) => {
            return (
                element.semanticId.keys[0].value === 'https://admin-shell.io/idta/HierarchicalStructures/EntryNode/1/0'
            );
        });
        if (!entryNode) return graphDefinition;
        if (!entryNode.statements) return graphDefinition;

        const hasChildren = entryNode.statements.some((element: any) => element.modelType === 'Entity');
        if (!hasChildren) return graphDefinition;

        [graphDefinition, callBacks] = addChildrenToGraph(entryNode, graphDefinition, callBacks); // Update the graphDefinition
        graphDefinition += callBacks; // add the callbacks to the graphDefinition

        return graphDefinition;
    }

    function addChildrenToGraph(parentNode: any, graphDefinition: string, callBacks: string): [string, string] {
        const children = parentNode.statements.filter((element: any) => element.modelType === 'Entity');
        let relationships = parentNode.statements
            .filter((element: any) => element.modelType === 'RelationshipElement')
            .map((element: any) => element.semanticId.keys[0].value);

        const allEqual = relationships.every((element: any) => element === relationships[0]);
        if (!allEqual)
            navigationStore.dispatchSnackbar({
                status: true,
                timeout: 10000,
                color: 'warning',
                btnColor: 'buttonText',
                text: 'Only one type of relationship is allowed!',
            });
        // extract the first relationship
        let relationship = relationships[0];
        // translate the relationship semanticId to a readable string
        if (relationship === 'https://admin-shell.io/idta/HierarchicalStructures/HasPart/1/0') {
            relationship = 'HasPart';
        } else if (relationship === 'https://admin-shell.io/idta/HierarchicalStructures/IsPartOf/1/0') {
            relationship = 'IsPartOf';
        } else if (relationship === 'https://admin-shell.io/idta/HierarchicalStructures/SameAs/1/0') {
            relationship = 'SameAs';
        } else {
            relationship = '';
        }

        children.forEach((child: any) => {
            graphDefinition += `${parentNode.idShort}(${nameToDisplay(parentNode)}) -->|${relationship}| ${child.idShort}(${nameToDisplay(child)})\n`;
            callBacks += `click ${child.idShort} call callback(${child.globalAssetId})\n`;
            if (child.statements) {
                const hasChildren = child.statements.some((element: any) => element.modelType === 'Entity');
                if (hasChildren) {
                    [graphDefinition, callBacks] = addChildrenToGraph(child, graphDefinition, callBacks);
                }
            }
        });

        return [graphDefinition, callBacks];
    }

    function getArchetype(bomData: any): string {
        const archetypeElement = getSubmodelElementBySemanticId(
            'https://admin-shell.io/idta/HierarchicalStructures/ArcheType/1/0',
            bomData
        );
        return archetypeElement ? archetypeElement.value : 'no archetype found';
    }

    // Apply the current theme to mermaid and re-render the diagram
    function applyTheme(): void {
        mermaid.initialize({
            startOnLoad: false,
            theme: isDark.value ? 'dark' : 'default',
            themeVariables: isDark.value ? customDarkThemeColors : customDefaultThemeColors,
        });

        // render mermaid graph
        drawDiagram(bomData.value);
    }
</script>
