<template>
  <v-container class="pa-0" fluid>
    <VisualizationHeader
      border
      default-title="Hierarchical Structures enabling Bills of Material"
      :submodel-element-data="submodelElementData"
    />
    <!-- BoM Graph -->
    <v-card border>
      <v-toolbar color="cardHeader" density="compact">
        <!-- Archetype -->
        <v-list-item>
          <v-list-item-title>
            <span class="text-title-small mr-2">Archetype:</span>

            <v-chip
              border
              :class="{ 'cursor-pointer': editorMode }"
              color="primary"
              label
              size="x-small"
              @click="editorMode ? openArchetypeDialog() : null"
            >
              {{ archetype }}
              <v-icon v-if="editorMode" class="ml-1" size="x-small">mdi-pencil</v-icon>
            </v-chip>
          </v-list-item-title>
        </v-list-item>
        <!-- <v-btn color="primary" size="small" @click="exportToXML">Export to XML</v-btn> -->
        <v-spacer />

        <v-tooltip location="left" :text="editorMode ? 'Exit edit mode' : 'Enter edit mode'">
          <template #activator="{ props: tooltipProps }">
            <v-btn
              v-bind="tooltipProps"
              :disabled="!envStore.getAllowEditing"
              :icon="editorMode ? 'mdi-pencil-off-outline' : 'mdi-pencil-outline'"
              size="small"
              @click="toggleMode"
            />
          </template>
        </v-tooltip>
      </v-toolbar>

      <v-divider />

      <v-card-text class="pa-0">
        <!-- Export Button -->
        <div class="rounded-b" style="height: 600px">
          <VueFlow
            v-model:edges="edges"
            v-model:nodes="nodes"
            :edge-types="edgeTypes"
            :fit-view-on-init="true"
            :fit-view-on-init-options="{ padding: 0.3, includeHiddenNodes: false, nodes: nodes }"
            :max-zoom="4"
            :min-zoom="0.1"
            @edge-click="onEdgeClick"
            @node-click="onNodeClick"
            @node-context-menu="onNodeContextMenu"
            @nodes-initialized="onNodesInitialized"
          >
            <template #connection-line>
              <defs>
                <marker
                  id="arrowhead"
                  markerHeight="7"
                  markerWidth="10"
                  orient="auto"
                  refX="9"
                  refY="3.5"
                >
                  <polygon :fill="getPrimaryColor()" :points="'0 0, 10 3.5, 0 7'" />
                </marker>
              </defs>
            </template>

            <Background :gap="16" pattern-color="#aaa" />
            <Controls />
          </VueFlow>
        </div>
      </v-card-text>
    </v-card>

    <EntityForm
      v-model="entityDialog"
      :entity="submodelElementToEdit"
      :new-entity="newEntity"
      :parent-element="elementToAddSME"
      :path="submodelElementPath"
      @update:model-value="onDialogClosed"
    />
    <!-- Dialog for deleting SM/SME -->
    <DeleteDialog
      v-model="deleteDialog"
      :element="elementToDelete"
      @update:model-value="onDialogClosed"
    />
    <!-- Dialog for creating RelationshipElement -->
    <v-dialog v-model="relationshipDialog" max-width="500" persistent>
      <v-card>
        <v-card-title class="text-body-large">{{
          existingRelationship ? 'Edit Relationship Element' : 'Add Relationship Element'
        }}</v-card-title>

        <v-divider />

        <v-card-text>
          <p class="text-body-medium mb-4">
            {{ existingRelationship ? 'Edit the' : 'Create a' }} relationship between
            <v-chip class="mx-1" label size="small">{{ selectedEdge?.sourceNode }}</v-chip>
            and
            <v-chip class="mx-1" label size="small">{{ selectedEdge?.targetNode }}</v-chip>
          </p>

          <v-select
            v-model="selectedRelationshipType"
            density="compact"
            item-title="label"
            item-value="semanticId"
            :items="relationshipTypes"
            label="Relationship Type"
            return-object
            variant="outlined"
          >
            <template #item="{ item, props: itemProps }">
              <v-list-item v-bind="itemProps">
                <template #subtitle>
                  <span class="text-body-small">{{ item.description }}</span>
                </template>
              </v-list-item>
            </template>
          </v-select>
        </v-card-text>

        <v-divider />

        <v-card-actions>
          <v-spacer />
          <v-btn @click="closeRelationshipDialog">Cancel</v-btn>

          <v-btn color="primary" :disabled="!selectedRelationshipType" @click="saveRelationship">{{
            existingRelationship ? 'Save' : 'Create'
          }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <!-- Dialog for editing Archetype -->
    <v-dialog v-model="archetypeDialog" max-width="500" persistent>
      <v-card>
        <v-card-title class="text-body-large">Edit Archetype</v-card-title>
        <v-divider />

        <v-card-text>
          <p class="text-body-medium mb-4">Select the archetype for this hierarchical structure.</p>

          <v-select
            v-model="selectedArchetype"
            density="compact"
            item-title="label"
            item-value="value"
            :items="archetypeTypes"
            label="Archetype"
            return-object
            variant="outlined"
          >
            <template #item="{ item, props: itemProps }">
              <v-list-item v-bind="itemProps">
                <template #subtitle>
                  <span class="text-body-small">{{ item.description }}</span>
                </template>
              </v-list-item>
            </template>
          </v-select>
        </v-card-text>

        <v-divider />

        <v-card-actions>
          <v-spacer />
          <v-btn @click="closeArchetypeDialog">Cancel</v-btn>
          <v-btn color="primary" :disabled="!selectedArchetype" @click="saveArchetype">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <!-- Context Menu for Node Actions -->
    <v-menu
      v-model="contextMenu.show"
      :close-on-content-click="true"
      :style="{ position: 'absolute', left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
    >
      <v-sheet border>
        <v-list class="py-0" density="compact">
          <v-list-item slim @click="addChildEntity">
            <v-list-item-title>Add Child Entity</v-list-item-title>

            <template #prepend>
              <v-icon size="small">mdi-plus</v-icon>
            </template>
          </v-list-item>

          <v-list-item slim @click="editEntity">
            <v-list-item-title>Edit Entity</v-list-item-title>

            <template #prepend>
              <v-icon size="small">mdi-pencil</v-icon>
            </template>
          </v-list-item>

          <v-list-item
            v-if="
              contextMenu.node && contextMenu.node.data && contextMenu.node.data.modelElement != entryNode
            "
            slim
            @click="deleteEntity"
          >
            <v-list-item-title>Delete Entity</v-list-item-title>

            <template #prepend>
              <v-icon size="small">mdi-delete</v-icon>
            </template>
          </v-list-item>
        </v-list>
      </v-sheet>
    </v-menu>
  </v-container>
</template>

<script lang="ts" setup>
  import type { Edge, EdgeComponent, EdgeProps, Node } from '@vue-flow/core'
  import { types as aasTypes } from '@aas-core-works/aas-core3.1-typescript'
  import { Background } from '@vue-flow/background'
  import { Controls } from '@vue-flow/controls'
  import { MarkerType, useVueFlow, VueFlow } from '@vue-flow/core'
  import { computed, h, onMounted, ref, watch } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useTheme } from 'vuetify'
  import { useReferableUtils } from '@/composables/AAS/ReferableUtils'
  import { useSMHandling } from '@/composables/AAS/SMHandling'
  import { useHierarchicalStructure_v1_xUtils } from '@/composables/AAS/SubmodelTemplates/HierarchicalStructures_v1_xUtils'
  import { useAASDiscoveryClient } from '@/composables/Client/AASDiscoveryClient'
  import { useSMRepositoryClient } from '@/composables/Client/SMRepositoryClient'
  import { useJumpHandling } from '@/composables/JumpHandling'
  import { useRequestHandling } from '@/composables/RequestHandling'
  import { useEnvStore } from '@/store/EnvironmentStore'
  import { useNavigationStore } from '@/store/NavigationStore'
  import { getSubmodelElementBySemanticId } from '@/utils/AAS/SemanticIdUtils'
  import { base64Decode } from '@/utils/EncodeDecodeUtils'
  import '@vue-flow/core/dist/style.css'
  import '@vue-flow/core/dist/theme-default.css'

  // Options
  defineOptions({
    name: 'HierarchicalStructures',
    semanticId: [
      'https://admin-shell.io/idta/HierarchicalStructures/1/0/Submodel',
      'https://admin-shell.io/idta/HierarchicalStructures/1/1/Submodel',
    ],
  })

  // Vue Router
  const route = useRoute()
  const router = useRouter()

  // Composables
  const { setData, fetchAndDispatchSm } = useSMHandling()
  const { getAasId } = useAASDiscoveryClient()
  const { postSubmodelElement, putSubmodelElement } = useSMRepositoryClient()
  const { nameToDisplay } = useReferableUtils()
  const { jumpToAasById } = useJumpHandling()
  const { deleteRequest } = useRequestHandling()
  const {
    findRelationshipLabelForChild,
    buildEntityReference,
    findEntryNode,
    extractChildEntities,
    extractRelationshipSemanticIds,
    findParentEntity,
    findRelationshipToEntity,
  } = useHierarchicalStructure_v1_xUtils()

  // Stores
  const navigationStore = useNavigationStore()
  const envStore = useEnvStore()

  // Vuetify
  const theme = useTheme()

  // Props
  const props = defineProps({
    submodelElementData: {
      type: Object,
      default: () => ({}),
    },
  })

  // Data
  const isLoading = ref(false)
  const archetype = ref('' as string)
  const bomData = ref<Record<string, unknown>>({})
  const nodes = ref<Node[]>([])
  const edges = ref<Edge[]>([])
  const nodeMap = ref<Map<string, unknown>>(new Map())
  const hasSelfLoopEdges = ref(false)
  const entryNode = ref<Record<string, unknown> | undefined>(undefined)

  const entityDialog = ref(false)
  const newEntity = ref(false)
  const elementToAddSME = ref<Record<string, unknown> | null>(null)
  const submodelElementToEdit = ref<Record<string, unknown> | null>(null)
  const submodelElementPath = ref<string>('')

  const deleteDialog = ref(false)
  const elementToDelete = ref<Record<string, unknown> | null>(null)

  // Relationship dialog state
  const relationshipDialog = ref(false)
  const selectedEdge = ref<{
    sourceNode: string
    targetNode: string
    sourceEntity: Record<string, unknown>
  } | null>(null)
  const existingRelationship = ref<Record<string, unknown> | null>(null)
  const selectedRelationshipType = ref<{ label: string, semanticId: string, description: string } | null>(null)
  const relationshipTypes = [
    {
      label: 'HasPart',
      semanticId: 'https://admin-shell.io/idta/HierarchicalStructures/HasPart/1/0',
      description: 'Modeling of logical connections between components and sub-components.',
    },
    {
      label: 'IsPartOf',
      semanticId: 'https://admin-shell.io/idta/HierarchicalStructures/IsPartOf/1/0',
      description: 'Modeling of logical connections between asset and sub-asset (inverse of HasPart).',
    },
    {
      label: 'SameAs',
      semanticId: 'https://admin-shell.io/idta/HierarchicalStructures/SameAs/1/0',
      description: 'Reference between two equivalent Entities in the same or across Submodels.',
    },
  ]

  // Archetype types
  const archetypeTypes = [
    {
      label: 'Full',
      value: 'Full',
      description: 'Complete hierarchical structure with all levels.',
    },
    {
      label: 'OneUp',
      value: 'OneUp',
      description: 'Structure showing one level up in the hierarchy.',
    },
    {
      label: 'OneDown',
      value: 'OneDown',
      description: 'Structure showing one level down in the hierarchy.',
    },
  ]

  // Archetype dialog state
  const archetypeDialog = ref(false)
  const selectedArchetype = ref<{ label: string, value: string, description: string } | null>(null)

  // Context menu state
  const contextMenu = ref({
    show: false,
    x: 0,
    y: 0,
    node: null as { data?: Record<string, unknown> } | null,
  })

  // VueFlow instance
  const { fitView } = useVueFlow()

  // Watchers
  watch(
    () => props.submodelElementData,
    () => {
      initializeVisualization()
    },
  )

  // Computed Properties
  const isDark = computed(() => theme.global.current.value.dark)
  const primaryColor = computed(() => theme.current.value.colors.primary)
  function getPrimaryColor (): string {
    const color = primaryColor.value
    return typeof color === 'string' ? color : '#1976d2'
  }
  const editorMode = computed(() => ['AASEditor', 'SMEditor'].includes(route.name as string))
  // Custom self-loop edge component
  const SelfLoopEdge: EdgeComponent = (props: EdgeProps) => {
    const { sourceX, sourceY, label, style } = props

    // Loop starts and ends on the bottom edge, curves downward
    const loopRadius = 30
    const startX = sourceX
    const endX = sourceX

    const path = `M ${startX} ${sourceY} 
                      C ${startX} ${sourceY + loopRadius * 2}, 
                        ${endX} ${sourceY + loopRadius * 2}, 
                        ${endX} ${sourceY}`

    const labelX = sourceX
    const labelY = sourceY + loopRadius * 2 + 15

    return h('g', {}, [
      h('path', {
        'd': path,
        'fill': 'none',
        'stroke': style?.stroke || getPrimaryColor(),
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
              'style': 'font-size: 12px; fill: #000;',
            },
            label as any,
          ),
        )
        : null,
    ])
  }

  // Edge types for VueFlow
  const edgeTypes = {
    selfloop: SelfLoopEdge,
  }

  // Watcher to update theme dynamically
  watch(isDark, () => {
    updateNodeStyles()
  })

  watch(primaryColor, () => {
    updateNodeStyles()
  })

  onMounted(() => {
    initializeVisualization()
  })

  async function initializeVisualization (): Promise<void> {
    isLoading.value = true

    if (hasNoSubmodelData()) {
      resetVisualization()
      isLoading.value = false
      return
    }

    bomData.value = await setData({ ...props.submodelElementData }, props.submodelElementData.path)
    archetype.value = getArchetype(bomData.value)
    buildFlowGraph(bomData.value)

    isLoading.value = false
  }

  function hasNoSubmodelData (): boolean {
    return !props.submodelElementData || Object.keys(props.submodelElementData).length === 0
  }

  function resetVisualization (): void {
    bomData.value = {}
    nodes.value = []
    edges.value = []
  }

  function buildFlowGraph (bomData: Record<string, unknown>): void {
    entryNode.value = findEntryNode(bomData)

    if (!canBuildGraph(entryNode.value)) {
      resetVisualization()
      return
    }

    nodeMap.value.clear()
    const tempNodes: Node[] = []
    const tempEdges: Edge[] = []

    addNodesToFlow(entryNode.value!, tempNodes, tempEdges, 0, 0)
    applyHierarchicalLayout(tempNodes, tempEdges)

    // Check if there are self-loop edges
    hasSelfLoopEdges.value = tempEdges.some(e => e.type === 'selfloop')

    nodes.value = tempNodes
    edges.value = tempEdges
  }

  function onNodesInitialized (): void {
    // Use extra padding if there are self-loop edges to ensure they're visible
    const padding = hasSelfLoopEdges.value ? 0.4 : 0.2
    fitView({ padding, includeHiddenNodes: false })
  }

  function canBuildGraph (entryNode: Record<string, unknown> | undefined): boolean {
    // Allow building the graph even if entry node has no children - it should still be displayed
    return !!entryNode
  }

  function hasEntityChildren (node: Record<string, unknown>): boolean {
    const statements = node.statements as Record<string, unknown>[] | undefined
    return statements?.some(element => element.modelType === 'Entity') ?? false
  }

  function addNodesToFlow (
    parentNode: Record<string, unknown>,
    tempNodes: Node[],
    tempEdges: Edge[],
    level: number,
    positionInLevel: number,
    parentX?: number,
  ): number {
    const children = extractChildEntities(parentNode)
    const parentFlowNode = addNodeIfNotExists(parentNode, tempNodes, level, positionInLevel, parentX, children)
    if (parentNode === entryNode.value) {
      parentFlowNode.data.parentModelElement = { ...props.submodelElementData }
    }
    // Get this node's x position
    const thisNode = tempNodes.find(n => n.id === parentNode.idShort)
    const thisX = thisNode ? thisNode.position.x : 250

    const relationships = extractRelationshipSemanticIds(parentNode)

    validateRelationshipConsistency(relationships)

    for (const child of children) {
      const childEntities = extractChildEntities(child)
      const childFlowNode = addNodeIfNotExists(child, tempNodes, level + 1, 0, thisX, childEntities)
      childFlowNode.data.parent = parentFlowNode
      childFlowNode.data.parentModelElement = parentNode
      // Find the specific relationship for this child
      const relationshipLabel = findRelationshipLabelForChild(parentNode, child)
      addEdgeBetweenNodes(parentNode, child, tempEdges, relationshipLabel)
      processChildRecursively(child, tempNodes, tempEdges, level, 0)
    }
    return positionInLevel + 1
  }

  function addNodeIfNotExists (
    nodeData: Record<string, unknown>,
    tempNodes: Node[],
    level: number,
    positionInLevel: number,
    parentX?: number,
    children?: Record<string, unknown>[],
  ): Node {
    const nodeId = nodeData.idShort as string
    if (!nodeMap.value.has(nodeId)) {
      const node = createFlowNode(nodeData, level, positionInLevel, parentX)
      node.data.children = children
      node.data.modelElement = nodeData
      if (node.data.modelElement.statements)
        node.data.childrenCountOnCurrentLevel = node.data.modelElement.statements.filter(
          (s: any) => s.modelType === 'Entity',
        ).length
      tempNodes.push(node)
      nodeMap.value.set(nodeId, nodeData)
      return node
    }
    return tempNodes.find(n => n.id === nodeId)!
  }

  function createFlowNode (
    nodeData: Record<string, unknown>,
    level: number,
    positionInLevel: number,
    parentX?: number,
  ): Node {
    const x = typeof parentX === 'number' ? parentX : 250
    return {
      id: nodeData.idShort as string,
      type: 'default',
      label: nameToDisplay(nodeData),
      position: { x, y: level * 150 },
      style: getNodeStyle(),
      data: {
        globalAssetId: nodeData.globalAssetId,
      },
    }
  }

  function validateRelationshipConsistency (relationships: (string | undefined)[]): void {
    if (relationships.length === 0) return

    const allIdentical = relationships.every(rel => rel === relationships[0])
    if (!allIdentical) {
      showRelationshipWarning()
    }
  }

  function showRelationshipWarning (): void {
    navigationStore.dispatchSnackbar({
      status: true,
      timeout: 10_000,
      color: 'warning',
      btnColor: 'buttonText',
      text: 'Only one type of relationship is allowed!',
    })
  }

  function addEdgeBetweenNodes (
    parentNode: Record<string, unknown>,
    childNode: Record<string, unknown>,
    tempEdges: Edge[],
    relationshipLabel: string,
  ): void {
    const sourceId = parentNode.idShort as string
    const targetId = childNode.idShort as string
    const isSelfLoop = sourceId === targetId
    const edgeId = `e-${sourceId}-${targetId}`

    if (tempEdges.some(e => e.id === edgeId)) {
      return
    }

    const edge = createEdge(sourceId, targetId, relationshipLabel, { stroke: getPrimaryColor() }, isSelfLoop)
    tempEdges.push(edge)
  }

  function createEdge (
    source: string,
    target: string,
    label: string,
    style: Record<string, string>,
    isSelfLoop = false,
  ): Edge {
    // Use ArrowClosed for HasPart and SameAs, Arrow for IsPartOf
    const markerType = label === 'IsPartOf' ? MarkerType.Arrow : MarkerType.ArrowClosed

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
      markerEnd: {
        type: markerType,
        color: style.stroke,
        width: 30,
        height: 30,
      },
    }
  }

  function processChildRecursively (
    child: Record<string, unknown>,
    tempNodes: Node[],
    tempEdges: Edge[],
    level: number,
    childPosition: number,
  ): number {
    if (!child.statements) {
      return childPosition + 1
    }

    if (hasEntityChildren(child)) {
      return addNodesToFlow(child, tempNodes, tempEdges, level + 1, childPosition)
    }

    return childPosition + 1
  }

  function applyHierarchicalLayout (tempNodes: Node[], tempEdges: Edge[]): void {
    const nodeSpacingX = 200
    const baseNodeSpacingY = 100 // Minimum spacing between levels
    const defaultNodeHeight = 50 // Default height estimate for a node

    if (tempNodes.length === 0) return

    // Build a map from node id to node
    const nodeById = new Map<string, Node>()
    for (const node of tempNodes) nodeById.set(node.id, node)

    // Build parent-child relationships from edges
    const childrenMap = new Map<string, string[]>()
    const parentMap = new Map<string, string>()

    for (const edge of tempEdges) {
      if (edge.source !== edge.target) {
        // Skip self-loops
        if (!childrenMap.has(edge.source)) {
          childrenMap.set(edge.source, [])
        }
        childrenMap.get(edge.source)!.push(edge.target)
        parentMap.set(edge.target, edge.source)
      }
    }

    // Find root nodes (nodes without parents)
    const rootNodes = tempNodes.filter(node => !parentMap.has(node.id))

    // Calculate subtree widths bottom-up
    const subtreeWidths = new Map<string, number>()

    function calculateSubtreeWidth (nodeId: string): number {
      const children = childrenMap.get(nodeId) || []

      if (children.length === 0) {
        // Leaf node - width is 1 unit (nodeSpacingX)
        subtreeWidths.set(nodeId, nodeSpacingX)
        return nodeSpacingX
      }

      // Sum of all children's subtree widths
      let totalChildWidth = 0
      for (const childId of children) {
        totalChildWidth += calculateSubtreeWidth(childId)
      }

      subtreeWidths.set(nodeId, totalChildWidth)
      return totalChildWidth
    }

    // Calculate widths for all trees starting from roots
    for (const root of rootNodes) calculateSubtreeWidth(root.id)

    // Assign levels to nodes and track node levels
    const nodeLevels = new Map<string, number>()

    function assignLevels (nodeId: string, level: number): void {
      nodeLevels.set(nodeId, level)
      const children = childrenMap.get(nodeId) || []
      for (const childId of children) assignLevels(childId, level + 1)
    }

    for (const root of rootNodes) assignLevels(root.id, 0)

    // Estimate node height based on label length
    function estimateNodeHeight (node: Node): number {
      const label = node.label || ''
      const labelLength = typeof label === 'string' ? label.length : 0
      // Assume ~15 chars per line, ~20px per line, with padding
      const estimatedLines = Math.ceil(labelLength / 15)
      const estimatedHeight = Math.max(defaultNodeHeight, estimatedLines * 20 + 30)
      return estimatedHeight
    }

    // Group nodes by level and find max height per level
    const maxHeightPerLevel = new Map<number, number>()
    for (const node of tempNodes) {
      const level = nodeLevels.get(node.id) ?? 0
      const nodeHeight = estimateNodeHeight(node)
      const currentMax = maxHeightPerLevel.get(level) || 0
      maxHeightPerLevel.set(level, Math.max(currentMax, nodeHeight))
    }

    // Calculate cumulative Y positions for each level
    const levelYPositions = new Map<number, number>()
    const maxLevel = Math.max(...Array.from(nodeLevels.values()), 0)
    let cumulativeY = 0

    for (let level = 0; level <= maxLevel; level++) {
      levelYPositions.set(level, cumulativeY)
      const levelHeight = maxHeightPerLevel.get(level) || defaultNodeHeight
      cumulativeY += levelHeight + baseNodeSpacingY
    }

    // Position nodes recursively, centering children under their parent
    function positionSubtree (nodeId: string, xStart: number): void {
      const node = nodeById.get(nodeId)
      if (!node) return

      const children = childrenMap.get(nodeId) || []
      const subtreeWidth = subtreeWidths.get(nodeId) || nodeSpacingX
      const level = nodeLevels.get(nodeId) ?? 0

      // Position this node at the center of its subtree
      node.position.x = xStart + subtreeWidth / 2 - nodeSpacingX / 2
      node.position.y = levelYPositions.get(level) ?? 0

      // Position children
      let childXStart = xStart
      for (const childId of children) {
        const childSubtreeWidth = subtreeWidths.get(childId) || nodeSpacingX
        positionSubtree(childId, childXStart)
        childXStart += childSubtreeWidth
      }
    }

    // Position all root trees side by side
    let currentX = 0
    for (const root of rootNodes) {
      positionSubtree(root.id, currentX)
      currentX += subtreeWidths.get(root.id) || nodeSpacingX
    }

    // Center the entire graph around x=0
    if (tempNodes.length > 0) {
      const minX = Math.min(...tempNodes.map(n => n.position.x))
      const maxX = Math.max(...tempNodes.map(n => n.position.x))
      const centerOffset = (minX + maxX) / 2
      for (const node of tempNodes) {
        node.position.x -= centerOffset
      }
    }
  }

  function getNodeStyle (): Record<string, string> {
    const bgColor = isDark.value ? primaryColor.value + '20' : primaryColor.value + '0A'
    const borderColor = primaryColor.value
    const textColor = isDark.value ? '#fff' : '#000'

    return {
      backgroundColor: bgColor,
      border: `2px solid ${borderColor}`,
      borderRadius: '8px',
      padding: '10px 20px',
      color: textColor,
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
    }
  }

  function updateNodeStyles (): void {
    const newStyle = getNodeStyle()
    for (const node of nodes.value) {
      node.style = newStyle
    }
    for (const edge of edges.value) {
      edge.style = { stroke: getPrimaryColor() }
      edge.labelStyle = { fill: '#000', fontSize: '12px' }
      edge.labelBgStyle = { fill: '#fff' }
    }
  }

  function onNodeClick (event: { node: { data?: Record<string, unknown> } }): void {
    const globalAssetId = event.node.data?.globalAssetId as string | undefined

    if (globalAssetId && !editorMode.value) {
      navigateToAasByGlobalAssetId(globalAssetId)
    } else if (editorMode.value) {
      // In editor mode, single click opens edit dialog
      openEditDialog(event.node)
    }
  }

  function onNodeContextMenu (event: {
    event: MouseEvent | TouchEvent
    node: { data?: Record<string, unknown> }
  }): void {
    if (!editorMode.value) return

    event.event.preventDefault()

    // Get coordinates from mouse or touch event
    let x = 0
    let y = 0
    if ('clientX' in event.event) {
      x = event.event.clientX
      y = event.event.clientY
    } else if (event.event.touches && event.event.touches.length > 0) {
      x = event.event.touches[0].clientX
      y = event.event.touches[0].clientY
    }

    contextMenu.value = {
      show: true,
      x,
      y,
      node: event.node,
    }
  }

  function addChildEntity (): void {
    if (!contextMenu.value.node) return

    // The parent for the new entity is the clicked node's model element
    const parentEntity = contextMenu.value.node.data?.modelElement as Record<string, unknown>
    if (!parentEntity) return

    newEntity.value = true
    elementToAddSME.value = parentEntity
    submodelElementToEdit.value = null
    submodelElementPath.value = (parentEntity.path as string) || ''
    entityDialog.value = true
    contextMenu.value.show = false
  }

  function editEntity (): void {
    if (!contextMenu.value.node) return
    openEditDialog(contextMenu.value.node)
    contextMenu.value.show = false
  }

  function deleteEntity (): void {
    if (!contextMenu.value.node) return

    const entityToDelete = contextMenu.value.node.data?.modelElement as Record<string, unknown>
    if (!entityToDelete) return

    elementToDelete.value = entityToDelete
    deleteDialog.value = true

    contextMenu.value.show = false
  }

  function onEdgeClick (event: { edge: Edge }): void {
    if (!editorMode.value) return

    const edge = event.edge
    const sourceNodeId = edge.source
    const targetNodeId = edge.target

    // Find the source and target nodes
    const nodesArray = nodes.value as Node[]
    const sourceNode = nodesArray.find(n => n.id === sourceNodeId)
    const targetNode = nodesArray.find(n => n.id === targetNodeId)
    if (!sourceNode || !sourceNode.data?.modelElement) return
    if (!targetNode || !targetNode.data?.modelElement) return

    const sourceEntity = sourceNode.data.modelElement as Record<string, unknown>
    const targetEntity = targetNode.data.modelElement as Record<string, unknown>
    const targetGlobalAssetId = targetEntity.globalAssetId as string | undefined

    // Find existing RelationshipElement for this edge in the source entity's statements
    const statements = sourceEntity.statements as Record<string, unknown>[] | undefined
    const existingRel = statements?.find(stmt => {
      if (stmt.modelType !== 'RelationshipElement') return false

      const second = stmt.second as { keys?: Array<{ type: string, value: string }> } | undefined
      if (!second?.keys || second.keys.length === 0) return false

      // Check all keys in the second reference for a match
      return second.keys.some(key => {
        // Match by Entity idShort (for ModelReference to Entity)
        if (key.type === 'Entity' && key.value === targetNodeId) return true
        // Match by globalAssetId (for reference to AAS)
        if (
          targetGlobalAssetId
          && (key.type === 'AssetAdministrationShell' || key.type === 'GlobalReference')
          && key.value === targetGlobalAssetId
        )
          return true
        return false
      })
    }) as Record<string, unknown> | undefined

    selectedEdge.value = {
      sourceNode: sourceNodeId,
      targetNode: targetNodeId,
      sourceEntity: sourceEntity,
    }

    existingRelationship.value = existingRel || null

    // Pre-select the relationship type if editing
    if (existingRel) {
      const semanticIdValue = (existingRel.semanticId as { keys?: Array<{ value: string }> })?.keys?.[0]?.value
      const matchingType = relationshipTypes.find(rt => rt.semanticId === semanticIdValue)
      selectedRelationshipType.value = matchingType || null
    } else {
      selectedRelationshipType.value = null
    }

    relationshipDialog.value = true
  }

  function closeRelationshipDialog (): void {
    relationshipDialog.value = false
    selectedEdge.value = null
    existingRelationship.value = null
    selectedRelationshipType.value = null
  }

  function openArchetypeDialog (): void {
    // Pre-select current archetype
    const currentArchetype = archetypeTypes.find(at => at.value === archetype.value)
    selectedArchetype.value = currentArchetype || null
    archetypeDialog.value = true
  }

  function closeArchetypeDialog (): void {
    archetypeDialog.value = false
    selectedArchetype.value = null
  }

  async function saveArchetype (): Promise<void> {
    if (!selectedArchetype.value) return

    // Find the archetype element in bomData
    const archetypeElement = getSubmodelElementBySemanticId(
      'https://admin-shell.io/idta/HierarchicalStructures/ArcheType/1/0',
      bomData.value,
    )

    if (!archetypeElement) {
      navigationStore.dispatchSnackbar({
        status: true,
        timeout: 10_000,
        color: 'error',
        btnColor: 'buttonText',
        text: 'Could not find archetype element to update',
      })
      closeArchetypeDialog()
      return
    }

    // Update the archetype value
    const archetypeProperty = new aasTypes.Property(aasTypes.DataTypeDefXsd.String)
    archetypeProperty.idShort = 'ArcheType'
    archetypeProperty.value = selectedArchetype.value.value
    archetypeProperty.semanticId = new aasTypes.Reference(aasTypes.ReferenceTypes.ExternalReference, [
      new aasTypes.Key(
        aasTypes.KeyTypes.GlobalReference,
        'https://admin-shell.io/idta/HierarchicalStructures/ArcheType/1/0',
      ),
    ])

    archetypeProperty.description = [
      new aasTypes.LangStringTextType(
        'en',
        'ArcheType of the Submodel, there are three allowed enumeration entries: 1. “Full”, 2. “OneDown” and 3. “OneUp”.',
      ),
    ]

    try {
      const response = await putSubmodelElement(archetypeProperty, archetypeElement.path)
      if (response) {
        archetype.value = selectedArchetype.value.value
        navigationStore.dispatchSnackbar({
          status: true,
          timeout: 3000,
          color: 'success',
          btnColor: 'buttonText',
          text: 'Archetype updated successfully',
        })
      } else {
        navigationStore.dispatchSnackbar({
          status: true,
          timeout: 10_000,
          color: 'error',
          btnColor: 'buttonText',
          text: 'Failed to update archetype',
        })
      }
    } catch (error) {
      console.error('Error updating archetype:', error)
      navigationStore.dispatchSnackbar({
        status: true,
        timeout: 10_000,
        color: 'error',
        btnColor: 'buttonText',
        text: 'Error updating archetype',
      })
    }

    closeArchetypeDialog()
  }

  async function saveRelationship (): Promise<void> {
    if (!selectedEdge.value || !selectedRelationshipType.value) return

    const sourceEntity = selectedEdge.value.sourceEntity
    const sourceNodeId = selectedEdge.value.sourceNode
    const targetNodeId = selectedEdge.value.targetNode

    // Find the target node to get its modelElement with path
    const nodesArray = nodes.value as Node[]
    const sourceNode = nodesArray.find(n => n.id === sourceNodeId)
    const targetNode = nodesArray.find(n => n.id === targetNodeId)

    if (!sourceNode?.data?.modelElement || !targetNode?.data?.modelElement) {
      navigationStore.dispatchSnackbar({
        status: true,
        timeout: 5000,
        color: 'error',
        btnColor: 'buttonText',
        text: 'Could not find source or target entity data',
      })
      return
    }

    const sourceModelElement = sourceNode.data.modelElement as Record<string, unknown>
    const targetModelElement = targetNode.data.modelElement as Record<string, unknown>

    // Create the RelationshipElement
    const relSemanticId = new aasTypes.Reference(aasTypes.ReferenceTypes.ExternalReference, [
      new aasTypes.Key(aasTypes.KeyTypes.GlobalReference, selectedRelationshipType.value.semanticId),
    ])

    // Build proper references using the entity paths
    const firstReference = buildEntityReference(sourceModelElement)
    const secondReference = buildEntityReference(targetModelElement)

    const relationshipElement = new aasTypes.RelationshipElement()
    relationshipElement.first = firstReference
    relationshipElement.second = secondReference
    relationshipElement.idShort = `${selectedRelationshipType.value.label}_${sourceModelElement.idShort}_${targetModelElement.idShort}`
    relationshipElement.semanticId = relSemanticId

    try {
      let success = false
      const isEditing = existingRelationship.value !== null

      if (isEditing && existingRelationship.value) {
        // Update existing relationship - use PUT
        const existingPath = existingRelationship.value.path as string
        success = await putSubmodelElement(relationshipElement, existingPath)
      } else {
        // Create new relationship - use POST on the source entity
        const sourcePath = sourceEntity.path as string
        const splitted = sourcePath.split('/submodel-elements/')
        const submodelId = base64Decode(splitted[0].split('/submodels/')[1])
        const idShortPath = splitted[1]

        success = await postSubmodelElement(relationshipElement, submodelId, idShortPath)
      }

      if (success) {
        navigationStore.dispatchSnackbar({
          status: true,
          timeout: 3000,
          color: 'success',
          btnColor: 'buttonText',
          text: `RelationshipElement '${selectedRelationshipType.value.label}' ${isEditing ? 'updated' : 'created'} successfully`,
        })
        // Refresh the visualization
        navigationStore.dispatchTriggerTreeviewReload()
        fetchAndDispatchSm(props.submodelElementData.path as string)
      } else {
        navigationStore.dispatchSnackbar({
          status: true,
          timeout: 5000,
          color: 'error',
          btnColor: 'buttonText',
          text: `Failed to ${isEditing ? 'update' : 'create'} RelationshipElement`,
        })
      }
    } catch (error) {
      console.error('Error saving RelationshipElement:', error)
      navigationStore.dispatchSnackbar({
        status: true,
        timeout: 5000,
        color: 'error',
        btnColor: 'buttonText',
        text: 'Error saving RelationshipElement',
      })
    }

    closeRelationshipDialog()
  }

  function openEditDialog (node: { data?: Record<string, unknown> }): void {
    newEntity.value = false
    elementToAddSME.value = node.data?.parentModelElement as Record<string, any>
    submodelElementToEdit.value = node.data?.modelElement as Record<string, any>
    submodelElementPath.value = submodelElementToEdit.value?.path as string
    entityDialog.value = true
  }

  async function navigateToAasByGlobalAssetId (globalAssetId: string): Promise<void> {
    const aasId = await getAasId(globalAssetId)

    if (isValidAasId(aasId)) {
      jumpToAasById(aasId)
    } else {
      showAasNotFoundError()
    }
  }

  function isValidAasId (aasId: string): boolean {
    return !!aasId && aasId.trim() !== ''
  }

  function showAasNotFoundError (): void {
    navigationStore.dispatchSnackbar({
      status: true,
      timeout: 10_000,
      color: 'error',
      btnColor: 'buttonText',
      text: 'Could not find matching AAS in the AAS Discovery Service',
    })
  }

  function getArchetype (bomData: Record<string, unknown>): string {
    const archetypeElement = getSubmodelElementBySemanticId(
      'https://admin-shell.io/idta/HierarchicalStructures/ArcheType/1/0',
      bomData,
    )
    return archetypeElement ? archetypeElement.value : 'no archetype found'
  }

  function toggleMode (): void {
    if (editorMode.value) {
      navigationStore.navigateToViewerMode(router)
    } else {
      navigationStore.navigateToEditorMode(router)
    }
  }

  async function onDialogClosed (status: boolean): Promise<void> {
    if (!status) {
      // Check if in parent there is a RelationshipElement Referencing the deleted entity
      if (elementToDelete.value) {
        const parentEntity = findParentEntity(bomData.value, elementToDelete.value)
        if (parentEntity) {
          const relationshipToDelete = findRelationshipToEntity(parentEntity, elementToDelete.value)
          if (relationshipToDelete) {
            // Delete the orphaned Relationship Element
            const relationshipPath = relationshipToDelete.path as string
            if (relationshipPath) {
              try {
                await deleteRequest(relationshipPath, 'removing orphaned RelationshipElement', true)
              } catch (error) {
                console.error('Error deleting orphaned RelationshipElement:', error)
              }
            }
          }
        }
      }
      // Clear the deleted element reference
      elementToDelete.value = null
      // Refresh the visualization
      fetchAndDispatchSm(props.submodelElementData.path as string)
    }
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
