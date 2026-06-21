<template>
  <div>
    <div class="d-flex justify-space-between align-center mt-4 mx-4 mb-2">
      <v-btn-toggle
        v-model="selectedAasDescriptorView"
        density="compact"
        mandatory
        rounded="lg"
        variant="outlined"
      >
        <v-btn value="tree">
          <v-icon start>mdi-file-tree-outline</v-icon>
          Tree
        </v-btn>

        <v-btn value="json">
          <v-icon start>mdi-code-json</v-icon>
          JSON
        </v-btn>
      </v-btn-toggle>

      <v-list-item-title class="text-body-large d-flex align-center">

        <v-icon
          class="mr-2"
          color="primary"
          icon="custom:aasIcon"
          size="small"
        />
        Asset Administration Shell Descriptor
      </v-list-item-title>
    </div>

    <!-- Asset JSON view -->
    <pre
      v-if="selectedAasDescriptorView === 'json'"
      class="json-content mt-0 mx-4 mb-5 bg-surface rounded border"
      style="min-height: 63px"
      :style="{ 'max-height': heightAasDescriptorJson }"
    >
      <code class="mx-5" v-html="aasDescriptorJsonFormatted" />
    </pre>

    <!-- Asset Tree view -->
    <div
      v-else
      class="rounded border overflow-y-auto mx-4 mb-5 pa-4"
      style="min-height: 63px; background-color: #f5f5f5"
      :style="{ 'max-height': heightAasDescriptorJson }"
    >
      <JsonTreeView :data="aasDescriptorJsonParsed" />
    </div>
  </div>
</template>

<script lang="ts" setup>
  import type { AASDescriptor } from '@/types/Descriptors'
  import * as Prism from 'prismjs'
  import { useEdcDataTransfer } from '@/pages/modules/EclipseDataspaceConnector/composables/useEdcDataTransfer'
  import { base64Encode } from '@/utils/EncodeDecodeUtils'
  import { formatJSON } from '@/utils/JsonUtils'
  import { getPrismJsonLanguage } from '@/utils/prismJsonLanguage'
  import 'prismjs/themes/prism.css'

  // Props
  const props = defineProps<{
    selectedBusinessPartner: any
    selectedCatalogDataset: any
    discoveringId: boolean
    discoveryId: string
    heightAasDescriptorJson: string
  }>()

  // Emits
  const emit = defineEmits<{
    'update:discovering-id': [value: boolean]
    'update:edc-status': [value: string]
  }>()

  const aasDescriptorJson = ref<string>('')
  const aasDescriptorJsonFormatted = ref<string>('')
  const aasDescriptorJsonParsed = ref<unknown>({})
  const cancelled = ref(false)
  const selectedAasDescriptorView = ref<'json' | 'tree'>('json')

  // Composables
  const { resolveEdcEndpoint } = useEdcDataTransfer()

  async function discoverId (): Promise<void> {
    if (!props.selectedBusinessPartner || !props.selectedCatalogDataset)
      return

    const { endpoint, headers } = await resolveEdcEndpoint(
      props.selectedBusinessPartner,
      props.selectedCatalogDataset,
      {
        cancelled,
        setInProgress: value => emit('update:discovering-id', value),
        setStatus: msg => emit('update:edc-status', msg),
      },
    )

    if (!endpoint) return

    try {
      const aasId = await discoverAasId(props.discoveryId, endpoint, headers)
      console.log('discoverId:aasId', aasId)
      const aasDescriptor = await discoverAasDescriptor((aasId === '' ? props.discoveryId : aasId), endpoint, headers)

      aasDescriptorJson.value = JSON.stringify(aasDescriptor)
      aasDescriptorJsonParsed.value = aasDescriptor

      const formatted = formatJSON(aasDescriptorJson.value)
      aasDescriptorJsonFormatted.value
        = Prism && Prism.highlight
          ? Prism.highlight(formatted, getPrismJsonLanguage(), 'json')
          : formatted

      emit('update:edc-status', 'Discovery successfully')
    } catch (error) {
      console.error('Error Discovery:', error)
      emit('update:edc-status', `Error: Failed to discover - ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      emit('update:discovering-id', false)
    }
  }

  async function discoverAasDescriptor (aasId: string, endpoint: string, headers: Headers): Promise<AASDescriptor | null> {
    if (aasId.trim() === '' || endpoint.trim() === '') return null
    console.log('discoverAasDescriptor:aasId', aasId)
    try {
      // /shell-descriptors/{aasIdentifier}
      const aasRegistryShellDescriptorsEndpoint = `${endpoint}/shell-descriptors/${base64Encode(aasId)}`
      const response = await fetch(aasRegistryShellDescriptorsEndpoint, {
        method: 'GET',
        headers,
      })

      if (response.ok) {
        const aasDescriptor = await response.json()
        return aasDescriptor
      }
    } catch {
      return null
    }

    return null
  }

  async function discoverAasId (globalAssetId: string, endpoint: string, headers: Headers): Promise<string> {
    if (globalAssetId.trim() === '' || endpoint.trim() === '') return ''

    try {
      // /lookup/shells
      const assetIdObject = JSON.stringify({ name: 'globalAssetId', value: globalAssetId })
      const aasDiscoveryPathLookupShells2Endpoint = `${endpoint}/lookup/shells?assetIds=${base64Encode(assetIdObject)}`

      const responseAasDiscoveryPathLookupShells2Endpoint = await fetch(aasDiscoveryPathLookupShells2Endpoint, {
        method: 'GET',
        headers: headers,
      })

      if (responseAasDiscoveryPathLookupShells2Endpoint.ok) {
        const jsonResponse = await responseAasDiscoveryPathLookupShells2Endpoint.json()
        if (Array.isArray(jsonResponse?.result) && jsonResponse.result.length > 0) {
          const aasIds = jsonResponse.result
          console.log('discoverAasId:aasId', aasIds[0])
          return aasIds[0]
        }
      }
    } catch {
      return ''
    }

    return ''
  }

  function cancel (): void {
    cancelled.value = true
  }

  defineExpose({ discoverId, cancel })
</script>

<style scoped>
  :deep(.token) {
    line-height: 21px;
  }

  :deep(code) {
    line-height: 21px;
  }

  .json-content {
    word-wrap: normal;
    font-size: 14px;
    line-height: 21px;
    flex-grow: 0;
    overflow: auto;
    background-color: #f5f5f5;
  }

  .json-content code {
    display: block;
  }

  :deep(.token.punctuation) {
    color: #999;
  }

  :deep(.token.property) {
    color: #905;
  }

  :deep(.token.string) {
    color: #690;
  }

  :deep(.token.number) {
    color: #07a;
  }

  :deep(.token.boolean) {
    color: #07a;
  }

  :deep(.token.null) {
    color: #999;
  }
</style>
