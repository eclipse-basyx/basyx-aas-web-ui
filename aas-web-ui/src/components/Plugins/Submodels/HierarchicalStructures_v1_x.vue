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
                    <!-- Export Button -->
                    <v-list-item class="px-2 pb-3">
                        <v-btn @click="exportToXML" color="primary" size="small">Export to XML</v-btn>
                    </v-list-item>
                    <div style="height: 600px; border: 1px solid rgba(0, 0, 0, 0.12)">
                        <VueFlow
                            v-model:nodes="nodes"
                            v-model:edges="edges"
                            :edge-types="edgeTypes"
                            :min-zoom="0.1"
                            :max-zoom="4"
                            :fit-view-on-init="true"
                            :fit-view-on-init-options="{ padding: 0.3, includeHiddenNodes: false, nodes: nodes }"
                            @nodes-initialized="onNodesInitialized"
                            @node-click="onNodeClick">
                            <template #connection-line>
                                <defs>
                                    <marker
                                        id="arrowhead"
                                        markerWidth="10"
                                        markerHeight="7"
                                        refX="9"
                                        refY="3.5"
                                        orient="auto">
                                        <polygon :points="'0 0, 10 3.5, 0 7'" :fill="primaryColor" />
                                    </marker>
                                </defs>
                            </template>
                            <Background pattern-color="#aaa" :gap="16" />
                            <Controls />
                        </VueFlow>
                    </div>
                </div>
            </v-card-text>
        </v-card>
    </v-container>
</template>

<script lang="ts" setup>
    import '@vue-flow/core/dist/style.css';
    import '@vue-flow/core/dist/theme-default.css';
    import { Background } from '@vue-flow/background';
    import { Controls } from '@vue-flow/controls';
    import { type Edge, type Node, useVueFlow, VueFlow } from '@vue-flow/core';
    import { computed, h, onMounted, ref, watch } from 'vue';
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
            type: Object,
            default: () => ({}),
        },
    });

    // Data
    const isLoading = ref(false);
    const archetype = ref('' as string);
    const bomData = ref<Record<string, unknown>>({});
    const nodes = ref<Node[]>([]);
    const edges = ref<Edge[]>([]);
    const nodeMap = ref<Map<string, unknown>>(new Map());
    const hasSelfLoopEdges = ref(false);

    // VueFlow instance
    const { fitView } = useVueFlow();

    // Computed Properties
    const isDark = computed(() => theme.global.current.value.dark);
    const primaryColor = computed(() => theme.current.value.colors.primary);

    import type { EdgeProps } from '@vue-flow/core';

    // Custom self-loop edge component
    const SelfLoopEdge: import('@vue-flow/core').EdgeComponent = (props: EdgeProps) => {
        const { sourceX, sourceY, label, style } = props;

        // Loop starts and ends on the bottom edge, curves downward
        const loopRadius = 30;
        const startX = sourceX;
        const endX = sourceX;

        const path = `M ${startX} ${sourceY} 
                      C ${startX} ${sourceY + loopRadius * 2}, 
                        ${endX} ${sourceY + loopRadius * 2}, 
                        ${endX} ${sourceY}`;

        const labelX = sourceX;
        const labelY = sourceY + loopRadius * 2 + 15;

        return h('g', {}, [
            h('path', {
                d: path,
                fill: 'none',
                stroke: style?.stroke || primaryColor.value,
                'stroke-width': 2,
                'marker-end': 'url(#arrowhead)',
            }),
            label
                ? h(
                      'g',
                      { transform: `translate(${labelX}, ${labelY})` },
                      h(
                          'text',
                          {
                              'text-anchor': 'middle',
                              'dominant-baseline': 'middle',
                              style: 'font-size: 12px; fill: #000;',
                          },
                          label
                      )
                  )
                : null,
        ]);
    };

    // Edge types for VueFlow
    const edgeTypes = {
        selfloop: SelfLoopEdge,
    };

    // Refs for DOM elements
    const boMCard = ref<HTMLElement | null>(null);

    // Watcher to update theme dynamically
    watch(isDark, () => {
        updateNodeStyles();
    });

    watch(primaryColor, () => {
        updateNodeStyles();
    });

    onMounted(() => {
        initializeVisualization();
    });

    async function initializeVisualization(): Promise<void> {
        isLoading.value = true;

        if (hasNoSubmodelData()) {
            resetVisualization();
            isLoading.value = false;
            return;
        }

        bomData.value = await setData({ ...props.submodelElementData }, props.submodelElementData.path);
        archetype.value = getArchetype(bomData.value);
        buildFlowGraph(bomData.value);

        isLoading.value = false;
    }

    function hasNoSubmodelData(): boolean {
        return !props.submodelElementData || Object.keys(props.submodelElementData).length === 0;
    }

    function resetVisualization(): void {
        bomData.value = {};
        nodes.value = [];
        edges.value = [];
    }

    function buildFlowGraph(bomData: Record<string, unknown>): void {
        const entryNode = findEntryNode(bomData);

        if (!canBuildGraph(entryNode)) {
            resetVisualization();
            return;
        }

        nodeMap.value.clear();
        const tempNodes: Node[] = [];
        const tempEdges: Edge[] = [];

        addNodesToFlow(entryNode!, tempNodes, tempEdges, 0, 0);
        applyHierarchicalLayout(tempNodes, tempEdges);

        // Check if there are self-loop edges
        hasSelfLoopEdges.value = tempEdges.some((e) => e.type === 'selfloop');

        nodes.value = tempNodes;
        edges.value = tempEdges;
    }

    function onNodesInitialized(): void {
        // Use extra padding if there are self-loop edges to ensure they're visible
        const padding = hasSelfLoopEdges.value ? 0.4 : 0.2;
        fitView({ padding, includeHiddenNodes: false });
    }

    function findEntryNode(bomData: Record<string, unknown>): Record<string, unknown> | undefined {
        const submodelElements = bomData.submodelElements as Record<string, unknown>[] | undefined;
        return submodelElements?.find(isEntryNode);
    }

    function isEntryNode(element: Record<string, unknown>): boolean {
        const semanticId = getSemanticIdValue(element);
        return semanticId === 'https://admin-shell.io/idta/HierarchicalStructures/EntryNode/1/0';
    }

    function getSemanticIdValue(element: Record<string, unknown>): string | undefined {
        return (element.semanticId as unknown as { keys: Array<{ value: string }> })?.keys?.[0]?.value;
    }

    function canBuildGraph(entryNode: Record<string, unknown> | undefined): boolean {
        return !!entryNode && !!entryNode.statements && hasEntityChildren(entryNode);
    }

    function hasEntityChildren(node: Record<string, unknown>): boolean {
        const statements = node.statements as Record<string, unknown>[] | undefined;
        return statements?.some((element) => element.modelType === 'Entity') ?? false;
    }

    function addNodesToFlow(
        parentNode: Record<string, unknown>,
        tempNodes: Node[],
        tempEdges: Edge[],
        level: number,
        positionInLevel: number,
        parentX?: number
    ): number {
        const children = extractChildEntities(parentNode);
        const parentFlowNode = addNodeIfNotExists(parentNode, tempNodes, level, positionInLevel, parentX, children);

        // Get this node's x position
        const thisNode = tempNodes.find((n) => n.id === parentNode.idShort);
        const thisX = thisNode ? thisNode.position.x : 250;

        const relationships = extractRelationshipSemanticIds(parentNode);

        validateRelationshipConsistency(relationships);

        const relationshipLabel = getRelationshipLabel(relationships[0]);
        children.forEach((child: Record<string, unknown>) => {
            const children = extractChildEntities(child);
            const childFlowNode = addNodeIfNotExists(child, tempNodes, level + 1, 0, thisX, children);
            childFlowNode.data.parent = parentFlowNode;
            addEdgeBetweenNodes(parentNode, child, tempEdges, relationshipLabel);
            processChildRecursively(child, tempNodes, tempEdges, level, 0);
        });
        return positionInLevel + 1;
    }

    function addNodeIfNotExists(
        nodeData: Record<string, unknown>,
        tempNodes: Node[],
        level: number,
        positionInLevel: number,
        parentX?: number,
        children?: Record<string, unknown>[]
    ): Node {
        const nodeId = nodeData.idShort as string;
        if (!nodeMap.value.has(nodeId)) {
            const node = createFlowNode(nodeData, level, positionInLevel, parentX);
            node.data.children = children;
            node.data.parent = nodeData;
            if (node.data.parent.statements)
                node.data.childrenCountOnCurrentLevel = node.data.parent.statements.filter(
                    (s: any) => s.modelType === 'Entity'
                ).length;
            tempNodes.push(node);
            nodeMap.value.set(nodeId, nodeData);
            return node;
        }
        return tempNodes.find((n) => n.id === nodeId)!;
    }

    function createFlowNode(
        nodeData: Record<string, unknown>,
        level: number,
        positionInLevel: number,
        parentX?: number
    ): Node {
        const x = typeof parentX === 'number' ? parentX : 250;
        return {
            id: nodeData.idShort as string,
            type: 'default',
            label: nameToDisplay(nodeData),
            position: { x, y: level * 150 },
            style: getNodeStyle(),
            data: {
                globalAssetId: nodeData.globalAssetId,
            },
        };
    }

    function extractChildEntities(node: Record<string, unknown>): Record<string, unknown>[] {
        const statements = node.statements as Record<string, unknown>[] | undefined;
        return statements?.filter((element) => element.modelType === 'Entity') ?? [];
    }

    function extractRelationshipSemanticIds(node: Record<string, unknown>): (string | undefined)[] {
        const statements = node.statements as Record<string, unknown>[] | undefined;
        return (
            statements
                ?.filter((element) => element.modelType === 'RelationshipElement')
                .map((element) => getSemanticIdValue(element)) ?? []
        );
    }

    function validateRelationshipConsistency(relationships: (string | undefined)[]): void {
        if (relationships.length === 0) return;

        const allIdentical = relationships.every((rel) => rel === relationships[0]);
        if (!allIdentical) {
            showRelationshipWarning();
        }
    }

    function showRelationshipWarning(): void {
        navigationStore.dispatchSnackbar({
            status: true,
            timeout: 10000,
            color: 'warning',
            btnColor: 'buttonText',
            text: 'Only one type of relationship is allowed!',
        });
    }

    function getRelationshipLabel(semanticId: string | undefined): string {
        const labelMap: Record<string, string> = {
            'https://admin-shell.io/idta/HierarchicalStructures/HasPart/1/0': 'HasPart',
            'https://admin-shell.io/idta/HierarchicalStructures/IsPartOf/1/0': 'IsPartOf',
            'https://admin-shell.io/idta/HierarchicalStructures/SameAs/1/0': 'SameAs',
        };

        return semanticId ? (labelMap[semanticId] ?? '') : '';
    }

    function addEdgeBetweenNodes(
        parentNode: Record<string, unknown>,
        childNode: Record<string, unknown>,
        tempEdges: Edge[],
        relationshipLabel: string
    ): void {
        const sourceId = parentNode.idShort as string;
        const targetId = childNode.idShort as string;
        const isSelfLoop = sourceId === targetId;
        const edgeId = `e-${sourceId}-${targetId}`;

        if (tempEdges.some((e) => e.id === edgeId)) {
            return;
        }

        const edge = createEdge(sourceId, targetId, relationshipLabel, { stroke: primaryColor.value }, isSelfLoop);
        tempEdges.push(edge);
    }

    function createEdge(
        source: string,
        target: string,
        label: string,
        style: Record<string, string>,
        isSelfLoop = false
    ): Edge {
        return {
            id: `e-${source}-${target}`,
            source,
            target,
            label,
            type: isSelfLoop ? 'selfloop' : 'smoothstep',
            animated: false,
            style,
            labelStyle: { fill: '#000', fontSize: '12px' },
            labelBgStyle: { fill: '#fff' },
        };
    }

    function processChildRecursively(
        child: Record<string, unknown>,
        tempNodes: Node[],
        tempEdges: Edge[],
        level: number,
        childPosition: number
    ): number {
        if (!child.statements) {
            return childPosition + 1;
        }

        if (hasEntityChildren(child)) {
            return addNodesToFlow(child, tempNodes, tempEdges, level + 1, childPosition);
        }

        return childPosition + 1;
    }

    function applyHierarchicalLayout(tempNodes: Node[], tempEdges: Edge[]): void {
        const nodeSpacingX = 200;
        const nodeSpacingY = 150;

        if (tempNodes.length === 0) return;

        // Build a map from node id to node
        const nodeById = new Map<string, Node>();
        tempNodes.forEach((node) => nodeById.set(node.id, node));

        // Build parent-child relationships from edges
        const childrenMap = new Map<string, string[]>();
        const parentMap = new Map<string, string>();

        tempEdges.forEach((edge) => {
            if (edge.source !== edge.target) {
                // Skip self-loops
                if (!childrenMap.has(edge.source)) {
                    childrenMap.set(edge.source, []);
                }
                childrenMap.get(edge.source)!.push(edge.target);
                parentMap.set(edge.target, edge.source);
            }
        });

        // Find root nodes (nodes without parents)
        const rootNodes = tempNodes.filter((node) => !parentMap.has(node.id));

        // Calculate subtree widths bottom-up
        const subtreeWidths = new Map<string, number>();

        function calculateSubtreeWidth(nodeId: string): number {
            const children = childrenMap.get(nodeId) || [];

            if (children.length === 0) {
                // Leaf node - width is 1 unit (nodeSpacingX)
                subtreeWidths.set(nodeId, nodeSpacingX);
                return nodeSpacingX;
            }

            // Sum of all children's subtree widths
            let totalChildWidth = 0;
            children.forEach((childId) => {
                totalChildWidth += calculateSubtreeWidth(childId);
            });

            subtreeWidths.set(nodeId, totalChildWidth);
            return totalChildWidth;
        }

        // Calculate widths for all trees starting from roots
        rootNodes.forEach((root) => calculateSubtreeWidth(root.id));

        // Position nodes recursively, centering children under their parent
        function positionSubtree(nodeId: string, xStart: number, level: number): void {
            const node = nodeById.get(nodeId);
            if (!node) return;

            const children = childrenMap.get(nodeId) || [];
            const subtreeWidth = subtreeWidths.get(nodeId) || nodeSpacingX;

            // Position this node at the center of its subtree
            node.position.x = xStart + subtreeWidth / 2 - nodeSpacingX / 2;
            node.position.y = level * nodeSpacingY;

            // Position children
            let childXStart = xStart;
            children.forEach((childId) => {
                const childSubtreeWidth = subtreeWidths.get(childId) || nodeSpacingX;
                positionSubtree(childId, childXStart, level + 1);
                childXStart += childSubtreeWidth;
            });
        }

        // Position all root trees side by side
        let currentX = 0;
        rootNodes.forEach((root) => {
            positionSubtree(root.id, currentX, 0);
            currentX += subtreeWidths.get(root.id) || nodeSpacingX;
        });

        // Center the entire graph around x=0
        if (tempNodes.length > 0) {
            const minX = Math.min(...tempNodes.map((n) => n.position.x));
            const maxX = Math.max(...tempNodes.map((n) => n.position.x));
            const centerOffset = (minX + maxX) / 2;
            tempNodes.forEach((node) => {
                node.position.x -= centerOffset;
            });
        }
    }

    function getNodeStyle(): Record<string, string> {
        const bgColor = isDark.value ? primaryColor.value + '20' : primaryColor.value + '0A';
        const borderColor = primaryColor.value;
        const textColor = isDark.value ? '#fff' : '#000';

        return {
            backgroundColor: bgColor,
            border: `2px solid ${borderColor}`,
            borderRadius: '8px',
            padding: '10px 20px',
            color: textColor,
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
        };
    }

    function updateNodeStyles(): void {
        const newStyle = getNodeStyle();
        nodes.value.forEach((node) => {
            node.style = newStyle;
        });
        edges.value.forEach((edge) => {
            edge.style = { stroke: primaryColor.value };
            edge.labelStyle = { fill: '#000', fontSize: '12px' };
            edge.labelBgStyle = { fill: '#fff' };
        });
    }

    function onNodeClick(event: { node: { data?: Record<string, unknown> } }): void {
        const globalAssetId = event.node.data?.globalAssetId as string | undefined;

        if (globalAssetId) {
            navigateToAasByGlobalAssetId(globalAssetId);
        }
    }

    async function navigateToAasByGlobalAssetId(globalAssetId: string): Promise<void> {
        const aasId = await getAasId(globalAssetId);

        if (isValidAasId(aasId)) {
            jumpToAasById(aasId);
        } else {
            showAasNotFoundError();
        }
    }

    function isValidAasId(aasId: string): boolean {
        return !!aasId && aasId.trim() !== '';
    }

    function showAasNotFoundError(): void {
        navigationStore.dispatchSnackbar({
            status: true,
            timeout: 10000,
            color: 'error',
            btnColor: 'buttonText',
            text: 'Could not find matching AAS in the AAS Discovery Service',
        });
    }

    function getArchetype(bomData: Record<string, unknown>): string {
        const archetypeElement = getSubmodelElementBySemanticId(
            'https://admin-shell.io/idta/HierarchicalStructures/ArcheType/1/0',
            bomData
        );
        return archetypeElement ? archetypeElement.value : 'no archetype found';
    }

    function exportToXML(): void {
        const xmlDoc = document.implementation.createDocument(null, 'graph', null);
        const root = xmlDoc.documentElement;

        // Add nodes
        nodes.value.forEach((node) => {
            const nodeElement = xmlDoc.createElement('node');
            nodeElement.setAttribute('id', node.id);
            nodeElement.setAttribute('label', node.label || '');
            nodeElement.setAttribute('x', node.position.x.toString());
            nodeElement.setAttribute('y', node.position.y.toString());
            root.appendChild(nodeElement);
        });

        // Add edges
        edges.value.forEach((edge) => {
            const edgeElement = xmlDoc.createElement('edge');
            edgeElement.setAttribute('source', edge.source);
            edgeElement.setAttribute('target', edge.target);
            edgeElement.setAttribute('label', edge.label || '');
            root.appendChild(edgeElement);
        });

        // Serialize to string
        const serializer = new XMLSerializer();
        const xmlString = serializer.serializeToString(xmlDoc);

        // Download as file
        const blob = new Blob([xmlString], { type: 'application/xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'graph.xml';
        a.click();
        URL.revokeObjectURL(url);
    }
</script>

<style scoped>
    :deep(.vue-flow__node) {
        transition: all 0.2s ease;
    }

    :deep(.vue-flow__node:hover) {
        transform: scale(1.05);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    :deep(.vue-flow__edge-label) {
        background: white !important;
        font-weight: 500;
        border: 1px solid rgba(0, 0, 0, 0.2);
        border-radius: 4px;
        padding: 4px 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
</style>
