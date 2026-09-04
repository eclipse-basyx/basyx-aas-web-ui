<template>
  <CodeViewer
    empty-message="No XML content available"
    :error="error"
    :export-text="text"
    :file-name="`${submodelElementData?.idShort || 'download'}.xml`"
    icon="mdi-xml"
    language="xml"
    :loading="loading"
    mime-type="application/xml"
    :text="displayText"
    title="XML Preview"
  />
</template>

<script setup lang="ts">
  import { useCodePreviewSource } from '@/composables/useCodePreviewSource'
  import { formatXmlPreview } from '@/utils/codeFormatting'

  const props = withDefaults(defineProps<{ submodelElementData?: any }>(), {
    submodelElementData: () => ({}),
  })
  const { text, loading, error } = useCodePreviewSource(() => ({ path: props.submodelElementData?.path }), 'XML')
  const displayText = computed(() => formatXmlPreview(text.value))
</script>
