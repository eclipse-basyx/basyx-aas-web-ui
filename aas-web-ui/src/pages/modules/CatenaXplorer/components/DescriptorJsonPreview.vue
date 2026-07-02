<template>
  <section>
    <v-expansion-panels
      gap="8"
      rounded="lg"
      static
      variant="accordion"
    >
      <v-expansion-panel>
        <v-expansion-panel-title>
          <div class="d-flex align-center ga-2">
            <v-icon icon="mdi-code-json" size="small" />
            <span>JSON Preview</span>
          </div>
        </v-expansion-panel-title>

        <v-expansion-panel-text>
          <JSONPreview
            :download-file-name="downloadFileName"
            :json-content="descriptor"
            title="AAS Descriptor JSON"
          />
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </section>
</template>

<script lang="ts" setup>
  import { computed } from 'vue'
  import JSONPreview from '@/components/Plugins/JSONPreview.vue'
  import { getDescriptorTitle } from '@/pages/modules/CatenaXplorer/catenaXplorerUtils'

  const props = defineProps<{
    descriptor: any
  }>()

  const downloadFileName = computed(() => {
    const title = getDescriptorTitle(props.descriptor)
    return `aas-descriptor-${title}`.replace(/[^\w.-]+/g, '-').replace(/^-|-$/g, '')
  })
</script>
