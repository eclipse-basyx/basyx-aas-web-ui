<template>
  <v-container class="pa-0" fluid>
    <v-card>
      <v-toolbar color="cardHeader" density="compact">
        <v-icon class="ml-4 mr-2">mdi-sitemap-outline</v-icon>
        <v-toolbar-title class="text-body-large">UML View</v-toolbar-title>

        <v-chip
          v-if="buildResult"
          class="ml-2"
          color="primary"
          label
          size="x-small"
        >
          {{ buildResult.nodeCount }} elements
        </v-chip>

        <v-spacer />

        <v-tooltip location="bottom" open-delay="600" text="Show PlantUML source">
          <template #activator="{ props: tooltipProps }">
            <v-btn
              v-bind="tooltipProps"
              :disabled="!plantUmlSource"
              :icon="showSource ? 'mdi-eye-off-outline' : 'mdi-code-tags'"
              variant="text"
              @click="showSource = !showSource"
            />
          </template>
        </v-tooltip>

        <v-tooltip location="bottom" open-delay="600" text="Copy PlantUML source">
          <template #activator="{ props: tooltipProps }">
            <v-btn
              v-bind="tooltipProps"
              :disabled="!plantUmlSource"
              :icon="hasCopied ? 'mdi-check' : 'mdi-content-copy'"
              variant="text"
              @click="copyPlantUmlSource"
            />
          </template>
        </v-tooltip>

        <v-tooltip location="bottom" open-delay="600" text="Download PlantUML source">
          <template #activator="{ props: tooltipProps }">
            <v-btn
              v-bind="tooltipProps"
              :disabled="!plantUmlSource"
              icon="mdi-file-download-outline"
              variant="text"
              @click="downloadPlantUmlSource"
            />
          </template>
        </v-tooltip>

        <v-tooltip location="bottom" open-delay="600" text="Download SVG">
          <template #activator="{ props: tooltipProps }">
            <v-btn
              v-bind="tooltipProps"
              :disabled="!svgContent"
              icon="mdi-svg"
              variant="text"
              @click="downloadSvg"
            />
          </template>
        </v-tooltip>
      </v-toolbar>

      <v-divider />

      <v-card-text class="uml-card-text pa-0">
        <div v-if="loading" class="d-flex justify-center align-center uml-loading">
          <v-progress-circular color="primary" indeterminate />
        </div>

        <template v-else-if="!selectedNode || Object.keys(selectedNode).length === 0">
          <v-empty-state
            class="text-divider"
            text="Select a Submodel / Submodel Element to view"
            title="No selected Submodel / Submodel Element"
          />
        </template>

        <template v-else>
          <v-alert
            v-for="warning in warnings"
            :key="warning"
            class="mb-3"
            density="compact"
            type="warning"
            variant="tonal"
          >
            {{ warning }}
          </v-alert>

          <v-alert
            v-if="renderError"
            class="mb-3"
            density="compact"
            title="PlantUML preview unavailable"
            type="warning"
            variant="tonal"
          >
            {{ renderError }}
          </v-alert>

          <div
            v-if="svgContent"
            class="uml-preview-container"
          >
            <!-- eslint-disable-next-line vue/no-v-html -->
            <div class="uml-svg" v-html="svgContent" />
          </div>

          <v-empty-state
            v-else-if="!renderError"
            class="text-divider"
            title="No UML content available"
          />

          <v-divider v-if="showSource && plantUmlSource" />

          <div v-if="showSource && plantUmlSource" class="uml-source-container">
            <pre class="uml-source"><code>{{ plantUmlSource }}</code></pre>
          </div>
        </template>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script lang="ts" setup>
  import { computed, ref, toRaw, watch } from 'vue'
  import { useAASStore } from '@/store/AASDataStore'
  import {
    buildPlantUmlForSubmodelElement,
    type PlantUmlBuildResult,
  } from '@/utils/AAS/PlantUMLBuilder'
  import { renderPlantUmlToSvg } from '@/utils/AAS/PlantUMLRenderer'

  // SVG namespace identifiers use http by specification; this is not a network URL.
  // eslint-disable-next-line unicorn/prefer-https
  const SVG_XMLNS = 'http://www.w3.org/2000/svg'

  const aasStore = useAASStore()

  const selectedNode = computed(() => aasStore.getSelectedNode)

  const buildResult = ref<PlantUmlBuildResult | null>(null)
  const plantUmlSource = ref('')
  const svgContent = ref('')
  const warnings = ref<string[]>([])
  const renderError = ref('')
  const loading = ref(false)
  const showSource = ref(false)
  const hasCopied = ref(false)
  let renderRunId = 0

  watch(
    selectedNode,
    () => {
      processSelectedNode()
    },
    { immediate: true },
  )

  async function processSelectedNode (): Promise<void> {
    const currentRunId = ++renderRunId
    resetLocalData()

    if (!selectedNode.value || Object.keys(selectedNode.value).length === 0) {
      return
    }

    loading.value = true

    try {
      const nodeCopy = cloneSelectedNode(selectedNode.value)
      const result = buildPlantUmlForSubmodelElement(nodeCopy)

      if (currentRunId !== renderRunId) {
        return
      }

      buildResult.value = result
      plantUmlSource.value = result.source
      warnings.value = [...result.warnings]

      const svg = await renderPlantUmlToSvg(result.source)

      if (currentRunId !== renderRunId) {
        return
      }

      svgContent.value = sanitizeSvg(svg)
    } catch (error) {
      if (currentRunId !== renderRunId) {
        return
      }

      renderError.value = error instanceof Error ? error.message : 'PlantUML rendering failed.'
    } finally {
      if (currentRunId === renderRunId) {
        loading.value = false
      }
    }
  }

  function resetLocalData (): void {
    buildResult.value = null
    plantUmlSource.value = ''
    svgContent.value = ''
    warnings.value = []
    renderError.value = ''
    hasCopied.value = false
  }

  function cloneSelectedNode (value: unknown): unknown {
    const rawValue = toRaw(value)

    if (typeof structuredClone === 'function') {
      return structuredClone(rawValue)
    }

    return rawValue
  }

  async function copyPlantUmlSource (): Promise<void> {
    if (!plantUmlSource.value) {
      return
    }

    try {
      await navigator.clipboard.writeText(plantUmlSource.value)
      hasCopied.value = true
      window.setTimeout(() => {
        hasCopied.value = false
      }, 2000)
    } catch (error) {
      console.error('Failed to copy PlantUML source to clipboard', error)
    }
  }

  function downloadPlantUmlSource (): void {
    if (!plantUmlSource.value) {
      return
    }

    downloadTextFile(plantUmlSource.value, `${fileBaseName()}.puml`, 'text/plain')
  }

  function downloadSvg (): void {
    if (!svgContent.value) {
      return
    }

    downloadTextFile(svgContent.value, `${fileBaseName()}.svg`, 'image/svg+xml')
  }

  function downloadTextFile (content: string, fileName: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = fileName
    document.body.append(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  function fileBaseName (): string {
    const idShort = typeof selectedNode.value?.idShort === 'string' ? selectedNode.value.idShort : ''
    const modelType = typeof selectedNode.value?.modelType === 'string' ? selectedNode.value.modelType : ''
    const baseName = idShort || modelType || 'selected-node'

    return baseName.replaceAll(/[^\w.-]+/g, '_')
  }

  function sanitizeSvg (svg: string): string {
    if (typeof DOMParser === 'undefined' || typeof XMLSerializer === 'undefined') {
      return svg
    }

    const parser = new DOMParser()
    const documentNode = parser.parseFromString(svg, 'image/svg+xml')

    if (documentNode.querySelector('parsererror')) {
      return ''
    }

    for (const element of documentNode.querySelectorAll('script, foreignObject, iframe, object, embed')) {
      element.remove()
    }

    for (const element of documentNode.querySelectorAll('*')) {
      for (const attribute of element.attributes) {
        const attributeName = attribute.name.toLowerCase()
        const attributeValue = attribute.value.trim().toLowerCase()

        if (
          attributeName.startsWith('on')
          || (['href', 'xlink:href'].includes(attributeName) && attributeValue.startsWith('javascript:'))
        ) {
          element.removeAttribute(attribute.name)
        }
      }
    }

    addSvgTextOverflowGuard(documentNode)

    return new XMLSerializer().serializeToString(documentNode.documentElement)
  }

  function addSvgTextOverflowGuard (documentNode: Document): void {
    const styleElement = documentNode.createElementNS(SVG_XMLNS, 'style')

    styleElement.textContent = [
      'text {',
      '  font-family: Arial, Helvetica, sans-serif !important;',
      '  font-size: 13px !important;',
      '}',
    ].join('\n')

    documentNode.documentElement.prepend(styleElement)
  }
</script>

<style scoped>
  .uml-loading {
    min-height: 240px;
  }

  .uml-card-text {
    background: #fff;
  }

  .uml-preview-container {
    max-width: 100%;
    overflow-x: auto;
    overflow-y: visible;
    background: #fff;
  }

  .uml-svg {
    display: inline-block;
    min-inline-size: 100%;
    inline-size: max-content;
    padding: 16px;
    box-sizing: border-box;
    background: #fff;
    vertical-align: top;
  }

  .uml-svg :deep(svg) {
    display: block;
    max-width: none;
    width: auto;
    height: auto;
    background: #fff;
  }

  .uml-source-container {
    max-height: 420px;
    overflow: auto;
    border-radius: 0px 0px 3px 3px;
    background: rgb(var(--v-theme-surface));
    color: rgb(var(--v-theme-on-surface));
  }

  .uml-source {
    margin: 0;
    padding: 16px;
    font-size: 14px;
    line-height: 21px;
    white-space: pre;
    color: inherit;
  }

  .text-divider {
    color: #757575;
  }
</style>
