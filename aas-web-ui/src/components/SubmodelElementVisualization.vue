<template>
  <v-container class="pa-0" fluid>
    <template
      v-if="
        ((selectedAAS && Object.keys(selectedAAS).length > 0) ||
          ['SMViewer', 'SMEditor'].includes(route.name as string)) &&
          selectedNode &&
          Object.keys(selectedNode).length > 0 &&
          submodelElementData &&
          Object.keys(submodelElementData).length > 0
      "
    >
      <!-- File / Blob Visualizations -->
      <template v-if="['File', 'Blob'].includes(submodelElementData.modelType)">
        <ImagePreview
          v-if="submodelElementData?.contentType && submodelElementData.contentType.includes('image')"
          :submodel-element-data="submodelElementData"
        />

        <PDFPreview
          v-if="submodelElementData?.contentType && submodelElementData.contentType.includes('pdf')"
          :submodel-element-data="submodelElementData"
        />

        <CADPreview
          v-if="
            submodelElementData?.contentType &&
              (submodelElementData.contentType.includes('sla') ||
                submodelElementData.contentType.includes('stl') ||
                submodelElementData.contentType.includes('model') ||
                submodelElementData.contentType.includes('obj') ||
                submodelElementData.contentType.includes('gltf'))
          "
          :submodel-element-data="submodelElementData"
        />

        <XMLPreview
          v-if="submodelElementData?.contentType && submodelElementData.contentType.includes('xml')"
          :submodel-element-data="submodelElementData"
        />

        <JSONPreview
          v-if="submodelElementData?.contentType && submodelElementData.contentType.includes('json')"
          :submodel-element-data="submodelElementData"
        />

        <IfcPreview
          v-if="submodelElementData?.contentType && submodelElementData.contentType.includes('x-step')"
          :submodel-element-data="submodelElementData"
        />
      </template>
      <!-- Plugin Visualizations -->
      <template v-else>
        <template
          v-if="
            submodelElementData.semanticId &&
              submodelElementData.semanticId.keys &&
              submodelElementData.semanticId.keys.length > 0 &&
              filteredPlugins.length > 0
          "
        >
          <component
            :is="plugin.name"
            v-for="(plugin, index) in filteredPlugins"
            :key="index"
            :submodel-element-data="submodelElementData"
          >
            {{ plugin.name }}
          </component>
        </template>

        <template v-else>
          <GenericDataVisu
            v-if="visualizationMode"
            :submodel-element-data="submodelElementData.submodelElements"
          />

          <v-container
            v-else
            class="pa-0 ma-0 d-flex justify-center align-center"
            fluid
            :style="
              aasSubmodelViewerMode ? 'height: calc(100svh - 137px)' : 'height: calc(100svh - 202px)'
            "
          >
            <v-empty-state class="text-divider" title="No available visualization" />
          </v-container>
        </template>
      </template>
    </template>
  </v-container>
</template>

<script lang="ts" setup>
  import type { RouteRecordNameGeneric } from 'vue-router'
  import { computed, onMounted, ref, watch } from 'vue'
  import { useRoute } from 'vue-router'
  import { useAASStore } from '@/store/AASDataStore'
  import { useInfrastructureStore } from '@/store/InfrastructureStore'
  import { useNavigationStore } from '@/store/NavigationStore'
  import { checkSemanticId } from '@/utils/AAS/SemanticIdUtils'

  // Vue Router
  const route = useRoute()

  // Stores
  const navigationStore = useNavigationStore()
  const aasStore = useAASStore()
  const infrastructureStore = useInfrastructureStore()

  // Data
  const submodelElementData = ref({} as any)
  const routesToVisualization = new Set<RouteRecordNameGeneric>(['ComponentVisualization', 'Visualization'])

  // Computed Properties
  const aasRegistryURL = computed(() => infrastructureStore.getAASRegistryURL)
  const submodelRegistryURL = computed(() => infrastructureStore.getSubmodelRegistryURL)
  const selectedAAS = computed(() => aasStore.getSelectedAAS)
  const selectedNode = computed(() => aasStore.getSelectedNode)
  const importedPlugins = computed(() => navigationStore.getPlugins)
  const filteredPlugins = computed(() => {
    const plugins = importedPlugins.value.filter((plugin: any) => {
      if (!plugin.semanticId) return false

      if (typeof plugin.semanticId === 'string') {
        return checkSemanticId(submodelElementData.value, plugin.semanticId)
      } else if (plugin.semanticId.constructor === Array) {
        for (const pluginSemanticId of plugin.semanticId) {
          if (checkSemanticId(submodelElementData.value, pluginSemanticId)) return true
        }
        return false
      }
      return false
    })

    const getLatestSemanticId = (plugin: any): string => {
      if (typeof plugin.semanticId === 'string') {
        return plugin.semanticId
      }

      if (Array.isArray(plugin.semanticId) && plugin.semanticId.length > 0) {
        return plugin.semanticId.toSorted((semanticIdA: any, semanticIdB: any) => semanticIdA.localeCompare(semanticIdB)).at(-1) || ''
      }

      return ''
    }

    // In case of multiple plugins matching for the semanticId of
    // submodelElementData, the plugins are sorted in descending
    // alphabetical order with respect to their semanticIds.
    // This will display the latest (in terms of version) plugin on
    // top. Plugins without version in the semanticId will be
    // displayed at the bottom.

    // Sort filtered plugins with respect to semanticId in descending order.
    return plugins.toSorted((pluginA: any, pluginB: any) => {
      const pluginASemanticId = getLatestSemanticId(pluginA)
      const pluginBSemanticId = getLatestSemanticId(pluginB)
      return pluginBSemanticId.localeCompare(pluginASemanticId)
    })
  })
  const visualizationMode = computed(() => routesToVisualization.has(route.name as RouteRecordNameGeneric))
  const aasSubmodelViewerMode = computed(() => route.name === 'AASSubmodelViewer')

  // Watchers
  watch(
    () => aasRegistryURL.value,
    () => {
      resetLocalData()
    },
  )

  watch(
    () => submodelRegistryURL.value,
    () => {
      resetLocalData()
    },
  )

  watch(
    () => selectedAAS.value,
    () => {
      resetLocalData()
      initialize()
    },
  )

  watch(
    () => selectedNode.value,
    () => {
      resetLocalData()
      initialize()
    },
  )

  onMounted(() => {
    initialize()
  })

  function initialize (): void {
    if (Object.keys(selectedNode.value).length === 0) {
      resetLocalData()
      return
    }
    submodelElementData.value = { ...selectedNode.value }
  }

  function resetLocalData (): void {
    submodelElementData.value = {}
  }
</script>
