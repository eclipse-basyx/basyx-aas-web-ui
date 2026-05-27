<template>
  <v-dialog v-model="createAssetDialog" max-height="90%" :width="800">
    <v-sheet border class="d-flex flex-column" height="100%" rounded="lg">
      <v-card-title class="bg-cardHeader">
        Create Asset
      </v-card-title>

      <v-divider />

      <v-card-text class="flex-grow-1 overflow-y-auto">
        <v-form ref="form" class="d-flex flex-column gap-4">
          <!-- Dynamic Placeholder Fields -->
          <div class="d-flex flex-column gap-3">
            <v-text-field
              v-for="(placeholder, index) in placeholders"
              :key="placeholder.label"
              v-model="placeholderValues[placeholder.label]"
              :class="index > 0 ? 'mt-2': ''"
              dense
              :hide-details="placeholder.hint == ''"
              :hint="placeholder.hint"
              :label="placeholder.label"
              :persistent-hint="placeholder.hint !== ''"
              :placeholder="placeholder.placeholder"
              required
              variant="outlined"
            />
          </div>

          <!-- EDC Asset Preview -->
          <div>
            <p class="text-caption text-medium-emphasis font-weight-bold mb-2">
              EDC Asset Preview:
            </p>

            <pre class="json-content bg-surface rounded border overflow-x-auto" style="max-height: 500px; overflow-y: auto">
              <code v-html="previewJsonFormatted" />
            </pre>
          </div>
        </v-form>
      </v-card-text>

      <v-card-actions>
        <v-spacer />

        <v-btn
          rounded="lg"
          text="Cancel"
          @click="createAssetDialog = false"
        />

        <v-btn
          class="text-buttonText"
          color="primary"
          :disabled="!allPlaceholdersFilled()"
          rounded="lg"
          text="Create"
          variant="flat"
          @click="createAsset"
        />
      </v-card-actions>
    </v-sheet>
  </v-dialog>
</template>

<script lang="ts" setup>
  import * as Prism from 'prismjs'
  import { type Asset, useEdcClient } from '@/pages/modules/EclipseDataspaceConnector/composables/Client/EdcClient'
  import AssetTemplate from '@/pages/modules/EclipseDataspaceConnector/data/asset___tractus-x_edc_v0.9.json'
  import { formatJSON } from '@/utils/JsonUtils'
  import { getPrismJsonLanguage } from '@/utils/prismJsonLanguage'

  const props = defineProps<{
    modelValue: boolean
  }>()

  const emit = defineEmits<{
    (event: 'update:modelValue', value: boolean): void
    (event: 'asset-created', assetId: string): void
  }>()

  // Composables
  const { createAsset: createAssetInEdc } = useEdcClient()

  // Data
  const createAssetDialog = ref(false)
  const form = ref<any>(null)
  const placeholderValues = ref<Record<string, string>>({})

  // Computed properties
  const placeholders = computed(() => {
    const templateStr = JSON.stringify(AssetTemplate)
    const matches = templateStr.match(/\{\{([^}]+)\}\}/g) || []

    const placeholderList = matches.map(match => {
      const content = match.slice(2, -2) // Remove {{ and }}
      const parts = content.split('|')

      return {
        label: parts[0].trim(),
        placeholder: parts[1]?.trim() || `Enter ${parts[0].trim()}`,
        hint: parts[2]?.trim() || '',
      }
    })

    // Return unique placeholders by name
    const seen = new Set<string>()
    return placeholderList.filter(p => {
      if (seen.has(p.label)) return false
      seen.add(p.label)
      return true
    })
  })

  const previewJsonFormatted = computed(() => {
    try {
      let assetJson = JSON.stringify(AssetTemplate)
      assetJson = replacePlaceholders(assetJson)

      const asset = JSON.parse(assetJson)
      const formatted = formatJSON(JSON.stringify(asset))

      if (Prism && Prism.highlight) {
        return Prism.highlight(formatted, getPrismJsonLanguage(), 'json')
      }
      return formatted
    } catch (error_) {
      console.error('Error highlighting JSON:', error_)
      return JSON.stringify(AssetTemplate, null, 2)
    }
  })

  // Watchers
  watch(
    () => props.modelValue,
    value => {
      createAssetDialog.value = value
      if (!value) {
        resetForm()
      }
    },
  )

  watch(
    () => createAssetDialog.value,
    value => {
      emit('update:modelValue', value)
    },
  )

  // Methods
  function resetForm (): void {
    placeholderValues.value = {}
    if (form.value) {
      form.value.reset()
    }
  }

  function allPlaceholdersFilled (): boolean {
    return placeholders.value.every(placeholder => placeholderValues.value[placeholder.label] && placeholderValues.value[placeholder.label].trim() !== '')
  }

  function replacePlaceholders (jsonStr: string): string {
    let result = jsonStr
    for (const placeholder of placeholders.value) {
      const value = placeholderValues.value[placeholder.label] || `{{${placeholder.label}}}`
      // Regex matches {{Label|...}} or {{Label}}
      const regex = new RegExp(String.raw`\{\{${placeholder.label}(?:\|[^}]*)?\}\}`, 'g')
      result = result.replace(regex, value)
    }
    return result
  }

  async function createAsset (): Promise<void> {
    if (!allPlaceholdersFilled()) {
      console.warn('Placeholders not filled')
      return
    }

    try {
      let assetJson = JSON.stringify(AssetTemplate)
      assetJson = replacePlaceholders(assetJson)

      const finalAsset = JSON.parse(assetJson) as Asset

      // Create the asset via EDC API
      const response = await createAssetInEdc(finalAsset)
      if (response.success && response.data) {
        emit('asset-created', response.data['@id'])
        createAssetDialog.value = false
        resetForm()
      } else {
        console.error('Failed to create asset:', response.errorMessage)
      }
    } catch (error_) {
      console.error('Error creating asset:', error_)
    }
  }

</script>

<style scoped>
    :deep(.token) {
        line-height: 21px;
    }

    :deep(code) {
        line-height: 21px;
    }

    .json-content {
        margin: 0;
        padding: 0 20px 0 20px;
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
