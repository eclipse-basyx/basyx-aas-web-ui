<template>
  <CodeViewer
    :empty-message="'No JSON content available'"
    :error="error"
    :export-text="text"
    :file-name="`${downloadFileName || submodelElementData?.idShort || 'download'}.json`"
    :height="height"
    :icon="icon"
    :loading="loading"
    :text="displayText"
    :title="title"
  />
</template>

<script setup lang="ts">
  import { useCodePreviewSource } from '@/composables/useCodePreviewSource'
  import { formatJsonPreview } from '@/utils/codeFormatting'

  const props = withDefaults(defineProps<{
    downloadFileName?: string
    jsonContent?: unknown
    height?: string
    icon?: string
    submodelElementData?: any
    title?: string
  }>(), {
    downloadFileName: '',
    height: '600px',
    icon: 'mdi-code-json',
    jsonContent: undefined,
    submodelElementData: () => ({}),
    title: 'JSON Preview',
  })

  const { text, loading, error } = useCodePreviewSource(() => ({
    path: props.submodelElementData?.path,
    content: props.jsonContent,
  }), 'JSON')
  const displayText = computed(() => formatJsonPreview(text.value))
</script>
