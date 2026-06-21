<template>
  <div>
    <div class="d-flex justify-space-between align-center mt-4 mx-4 mb-2">
      <v-btn-toggle
        v-model="selectedAssetView"
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
        <v-btn
          v-if="isValidAAS || isValidSubmodel"
          class="text-buttonText"
          :color="dataTranserInProgress ? 'error' : 'primary'"
          :prepend-icon="dataTranserInProgress ? 'mdi-close' : 'mdi-import'"
          rounded="lg"
          :text="dataTranserInProgress ? 'Cancel Push' : 'Import ' + (isValidAAS? 'AAS' : isValidSubmodel ? 'Submodel':'asset') + ' data'"
          variant="flat"
          @click="dataTranserInProgress ? cancel() : importAsset()"
        />

        <template v-else>
          <v-icon class="mr-2" color="primary" size="small">
            mdi-cube
          </v-icon>
          Asset
        </template>
      </v-list-item-title>
    </div>

    <!-- Asset JSON view -->
    <pre
      v-if="selectedAssetView === 'json'"
      class="json-content mt-0 mx-4 mb-5 bg-surface rounded border"
      style="min-height: 63px"
      :style="{ 'max-height': heightAssetJson }"
    >
      <code class="mx-5" v-html="assetJsonFormatted" />
    </pre>

    <!-- Asset Tree view -->
    <div
      v-else
      class="rounded border overflow-y-auto mx-4 mb-5 pa-4"
      style="min-height: 63px; background-color: #f5f5f5"
      :style="{ 'max-height': heightAssetJson }"
    >
      <JsonTreeView :data="assetJsonParsed" />
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { jsonization } from '@aas-core-works/aas-core3.1-typescript'
  import * as Prism from 'prismjs'
  import { computed, ref, watch } from 'vue'
  import JsonTreeView from '@/components/UIComponents/JsonTreeView.vue'
  import { useEdcDataTransfer } from '@/pages/modules/EclipseDataspaceConnector/composables/useEdcDataTransfer'
  import { formatJSON } from '@/utils/JsonUtils'
  import { getPrismJsonLanguage } from '@/utils/prismJsonLanguage'
  import 'prismjs/themes/prism.css'

  // Props
  const props = defineProps<{
    selectedBusinessPartner: any
    selectedCatalogDataset: any
    fetchingAsset: boolean
    heightAssetJson: string
  }>()

  // Emits
  const emit = defineEmits<{
    'update:fetching-asset': [value: boolean]
    'update:edc-status': [value: string]
  }>()

  const assetJson = ref<string>('')
  const assetJsonFormatted = ref<string>('')
  const assetJsonParsed = ref<unknown>({})
  const cancelled = ref(false)
  const dataTranserInProgress = ref(false)
  const selectedAssetView = ref<'json' | 'tree'>('json')

  // Composables
  const { resolveEdcEndpoint } = useEdcDataTransfer()

  // Computed
  const isValidAAS = computed(() => {
    const parsed = assetJsonParsed.value
    if (
      !parsed
      || typeof parsed !== 'object'
      || Object.keys(parsed).length === 0
    )
      return false
    const result = jsonization.assetAdministrationShellFromJsonable(
      parsed as jsonization.JsonValue,
    )
    return result.error === null
  })
  const isValidSubmodel = computed(() => {
    const parsed = assetJsonParsed.value
    if (
      !parsed
      || typeof parsed !== 'object'
      || Object.keys(parsed).length === 0
    )
      return false
    const result = jsonization.submodelFromJsonable(
      parsed as jsonization.JsonValue,
    )
    return result.error === null
  })

  // Watchers
  watch(
    () => props.selectedCatalogDataset,
    () => {
      assetJson.value = ''
      assetJsonFormatted.value = ''
      assetJsonParsed.value = {}
    },
    { deep: true },
  )

  async function fetchAsset (): Promise<void> {
    if (!props.selectedBusinessPartner || !props.selectedCatalogDataset)
      return

    const { endpoint, headers } = await resolveEdcEndpoint(
      props.selectedBusinessPartner,
      props.selectedCatalogDataset,
      {
        cancelled,
        setInProgress: value => emit('update:fetching-asset', value),
        setStatus: msg => emit('update:edc-status', msg),
      },
    )

    if (!endpoint) return

    try {
      const response = await fetch(endpoint, { headers })
      const data = await response.json()
      assetJson.value = JSON.stringify(data)
      assetJsonParsed.value = data

      const formatted = formatJSON(assetJson.value)
      assetJsonFormatted.value
        = Prism && Prism.highlight
          ? Prism.highlight(formatted, getPrismJsonLanguage(), 'json')
          : formatted

      emit('update:edc-status', 'Asset fetched successfully')
    } catch (error) {
      console.error('Error fetching asset data:', error)
      emit('update:edc-status', `Error: Failed to fetch data - ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      emit('update:fetching-asset', false)
    }
  }

  async function importAsset (): Promise<void> {
    if (isValidAAS.value) {
      // TODO Import AAS
    } else if (isValidSubmodel.value) {
      // TODO Import SM
    }
  }

  function cancel (): void {
    cancelled.value = true
  }

  defineExpose({ fetchAsset, cancel })
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
