<template>
  <CodeViewer
    empty-message="No JSON content available"
    :error="content.error"
    :file-name="`${selectedNode?.idShort || 'selectedNode'}.json`"
    icon="mdi-code-json"
    :text="content.text"
    title="JSON View"
  />
</template>

<script setup lang="ts">
  import { useAASStore } from '@/store/AASDataStore'
  import { cleanObjectRecursively } from '@/utils/AAS/cleanTreeObject'

  const aasStore = useAASStore()
  const selectedNode = computed(() => aasStore.getSelectedNode)
  const content = computed(() => {
    try {
      if (!selectedNode.value || Object.keys(selectedNode.value).length === 0) return { text: '', error: null }
      const node = structuredClone(toRaw(selectedNode.value))
      return { text: JSON.stringify(cleanObjectRecursively(node), null, 2), error: null }
    } catch (error) {
      return { text: '', error: `Error processing JSON data: ${error instanceof Error ? error.message : String(error)}` }
    }
  })
</script>
