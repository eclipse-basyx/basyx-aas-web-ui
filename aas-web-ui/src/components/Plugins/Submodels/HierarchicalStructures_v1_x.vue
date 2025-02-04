<template>
    <v-container fluid class="pa-0">
        <VisualizationHeader
            :submodel-element-data="submodelElementData"
            default-title="Hierarchical Structures enabling Bills of Material"></VisualizationHeader>
        <!-- BoM Graph -->
        <v-card>
            <v-card-text id="BoMCard">
                <!-- Archetype -->
                <v-list-item class="px-2 pb-3">
                    <v-list-item-title>
                        <span class="text-subtitle-2 mr-2">{{ 'Archetype: ' }}</span>
                        <v-chip label size="x-small" border color="primary" style="margin-top: -3px">
                            {{ archetype }}
                        </v-chip>
                    </v-list-item-title>
                </v-list-item>
                <div id="BoMDiagram" style="position: relative; max-width: 100%"></div>
            </v-card-text>
        </v-card>
    </v-container>
</template>

<script lang="ts" setup>
    import mermaid from 'mermaid';
    import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
    import { useTheme } from 'vuetify';
    import { useReferableUtils } from '@/composables/AAS/ReferableUtils';
    import { useAASDiscoveryClient } from '@/composables/Client/AASDiscoveryClient';
    import { useJumpHandling } from '@/composables/JumpHandling';
    import { useSMHandling } from '@/composables/SMHandling';
    import { useNavigationStore } from '@/store/NavigationStore';
    import { getSubmodelElementBySemanticId } from '@/utils/SemanticIdUtils';

    // Options
    defineOptions({
        name: 'HierarchicalStructures',
        semanticId: [
            'https://admin-shell.io/idta/HierarchicalStructures/1/0/Submodel',
            'https://admin-shell.io/idta/HierarchicalStructures/1/1/Submodel',
        ],
    });

    // Composables
    const { calculateSMEPathes } = useSMHandling();
    const { getAasId } = useAASDiscoveryClient();
    const { nameToDisplay } = useReferableUtils();
    const { jumpToAasById } = useJumpHandling();

    // Stores
    const navigationStore = useNavigationStore();

    // Vuetify
    const theme = useTheme();

    // Properties
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

    // Watchers
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

        bomData.value = await calculateSMEPathes({ ...props.submodelElementData }, props.submodelElementData.path);

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
            let element = document.querySelector('#BoMDiagram');
            // create the graphDefinition
            const graphDefinition = createGraphDefinition(bomData);
            const { svg, bindFunctions } = await mermaid.render('BoMDiagram', graphDefinition);
            if (element) {
                element.innerHTML = svg;
                let foreignObjects = element.querySelectorAll('foreignObject');
                foreignObjects.forEach((foreignObject) => {
                    let div = foreignObject.querySelector('div');
                    if (div) {
                        // Calculate the required width based on content
                        let textLength = div.textContent?.length;
                        let baseWidth = Math.max(150, (textLength ?? 0) * 8); // Base width estimation
                        let contentWidth = div.scrollWidth; // Actual content width

                        // Choose the larger of the two widths and add a buffer
                        let newWidth = Math.max(baseWidth, contentWidth) + 20; // Add a 20px buffer

                        foreignObject.setAttribute('width', newWidth.toString());
                        div.style.maxWidth = `${newWidth}px`; // Set the same max-width for div
                    }
                });
                // add the element to the card
                let card = document.querySelector('#BoMCard');
                if (card) {
                    card.appendChild(element);
                }
                // bind the functions to the graph
                bindFunctions?.(element);
            }
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
        let entryNode = bomData.submodelElements.find((element: any) => {
            return (
                element.semanticId.keys[0].value === 'https://admin-shell.io/idta/HierarchicalStructures/EntryNode/1/0'
            );
        });
        if (!entryNode) return graphDefinition;

        if (!entryNode.statements) return graphDefinition;
        const hasChildren = entryNode.statements.some((element: any) => {
            return element.modelType === 'Entity';
        });
        if (!hasChildren) return graphDefinition;

        [graphDefinition, callBacks] = addChildrenToGraph(entryNode, graphDefinition, callBacks); // Update the graphDefinition
        graphDefinition += callBacks; // add the callbacks to the graphDefinition

        return graphDefinition;
    }

    function addChildrenToGraph(parentNode: any, graphDefinition: string, callBacks: string): [string, string] {
        // get all children of the parentNode
        let children = parentNode.statements.filter((element: any) => {
            return element.modelType === 'Entity';
        });
        // get all RelationShipElements of the parentNode
        let relationships = parentNode.statements.filter((element: any) => {
            return element.modelType === 'RelationshipElement';
        });
        // extract the semanticId of the relationships (result should be relationships = [semanticId1, semanticId2, ...])
        relationships = relationships.map((element: any) => {
            return element.semanticId.keys[0].value;
        });
        // check if all relationships are the same
        const allEqual = relationships.every((element: any) => {
            return element === relationships[0];
        });
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
            graphDefinition +=
                parentNode.idShort +
                '(' +
                nameToDisplay(parentNode) +
                ') -->|' +
                relationship +
                '| ' +
                child.idShort +
                '(' +
                nameToDisplay(child) +
                ')\n'; // add the relationship to the graphDefinition
            callBacks += 'click ' + child.idShort + ' call callback(' + child.globalAssetId + ')\n'; // add the callback to the callBacks
            if (child.statements) {
                const hasChildren = child.statements.some((element: any) => {
                    return element.modelType === 'Entity';
                });
                if (hasChildren) {
                    [graphDefinition, callBacks] = addChildrenToGraph(child, graphDefinition, callBacks); // Update graphDefinition with returned value
                }
            }
        });

        return [graphDefinition, callBacks]; // Return the updated string
    }

    function getArchetype(bomData: any): string {
        let archetypeElement = getSubmodelElementBySemanticId(
            'https://admin-shell.io/idta/HierarchicalStructures/ArcheType/1/0',
            bomData
        );

        if (archetypeElement) {
            return archetypeElement.value;
        }

        return 'no archetype found';
    }

    // apply the theme to the mermaid graph
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
