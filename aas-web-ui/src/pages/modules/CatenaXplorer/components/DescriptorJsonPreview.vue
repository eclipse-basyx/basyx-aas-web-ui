<template>
  <section>
    <JSONPreview
      :download-file-name="downloadFileName"
      :json-content="descriptor"
      title="AAS Descriptor JSON"
    />
  </section>
</template>

<script lang="ts" setup>
  import { getDescriptorTitle } from '@/pages/modules/CatenaXplorer/catenaXplorerUtils'

  const props = defineProps<{
    descriptor: any
  }>()

  const downloadFileName = computed(() => {
    const title = getDescriptorTitle(props.descriptor)
    return `aas-descriptor-${title}`.replace(/[^\w.-]+/g, '-').replace(/^-|-$/g, '')
  })
</script>
