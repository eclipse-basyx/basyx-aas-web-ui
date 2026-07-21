<template>
  <v-dialog
    v-model="createAssetDialog"
    style="min-height: 190px; max-height:90%"
    width="800px"
  >
    <v-sheet border class="d-flex flex-column" height="100%" rounded="lg">
      <v-card-title class="bg-cardHeader">
        Create Asset
      </v-card-title>

      <v-divider />

      <v-card-text class="flex-grow-1 overflow-y-auto">
        <v-form ref="form" class="d-flex flex-column gap-4">

          <!-- Template Selection -->
          <v-select
            v-model="selectedTemplate"
            dense
            item-title="name"
            item-value="value"
            :items="assetTemplates"
            label="Select Asset Template"
            required
            variant="outlined"
          >
            <template #item="{ props: itemProps, item }">
              <v-list-item v-bind="itemProps">
                <template #prepend>
                  <v-icon class="mr-n5">mdi-code-json</v-icon>
                </template>

                <template #title>
                  <span class="font-weight-bold">{{ item.name }}</span>
                </template>

                <template #subtitle>
                  {{ item.description }}
                </template>
              </v-list-item>
            </template>
          </v-select>

          <!-- Dynamic Placeholder Fields -->
          <div v-if="selectedTemplate" class="d-flex flex-column gap-3">
            <v-text-field
              v-for="(placeholder, index) in placeholders"
              :key="placeholder.label"
              v-model="placeholderValues[placeholder.attribute]"
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
          <div v-if="selectedTemplate">
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
          :disabled="!mandatoryPlaceholdersFilled()"
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
  import AssetTemplateDefault_v0_9 from '@/pages/modules/EclipseDataspaceConnector/data/assets/asset___tractus-x_edc_v0.9.json'
  import AssetTemplateDefault_v0_12_1 from '@/pages/modules/EclipseDataspaceConnector/data/assets/asset___tractus-x_edc_v0.12.1.json'
  import AssetTemplateDTRegistry_v0_9 from '@/pages/modules/EclipseDataspaceConnector/data/assets/templates/digitaltwin_registry_asset___tractus-x_edc_v0.9.json'
  import AssetTemplateDTRegistry_v0_12_1 from '@/pages/modules/EclipseDataspaceConnector/data/assets/templates/digitaltwin_registry_asset___tractus-x_edc_v0.12.1.json'
  import AssetTemplateAasRepo_v0_12_1 from '@/pages/modules/EclipseDataspaceConnector/data/assets/templates/railway-x_aas_service_asset___tractus-x_edc_v0.12.1.json'
  import AssetTemplateRailwayXPush_v0_9 from '@/pages/modules/EclipseDataspaceConnector/data/assets/templates/railway-x_push_asset___tractus-x_edc_v0.9.json'
  import AssetTemplateRailwayXPush_v0_12_1 from '@/pages/modules/EclipseDataspaceConnector/data/assets/templates/railway-x_push_asset___tractus-x_edc_v0.12.1.json'
  import AssetTemplateSmRepo_v0_12_1 from '@/pages/modules/EclipseDataspaceConnector/data/assets/templates/submodel_service_asset___tractus-x_edc_v0.12.1.json'
  import { useEdcStore } from '@/pages/modules/EclipseDataspaceConnector/store/EdcStore'
  import { formatJSON } from '@/utils/JsonUtils'
  import { getPrismJsonLanguage } from '@/utils/prismJsonLanguage'

  const props = defineProps<{
    modelValue: boolean
  }>()

  const emit = defineEmits<{
    (event: 'update:model-value', value: boolean): void
    (event: 'assets-created', assetId: string): void
  }>()

  // Stores
  const edcStore = useEdcStore()

  // Composables
  const { createAsset: createAssetInEdc } = useEdcClient()

  // Data
  const createAssetDialog = ref(false)
  const selectedTemplate = ref<'default' | 'railwayXPush' | ''>('')
  const form = ref<any>(null)
  const placeholderValues = ref<Record<string, string>>({})

  // Computed properties
  const isEdcV0_12_1 = computed(() => edcStore.getEdcType === 'Tractus-X EDC v0.12.1')

  // Asset Templates
  const assetTemplates = computed(() => [
    {
      value: 'default',
      name: 'Default Asset',
      description: '',
      asset: isEdcV0_12_1.value ? AssetTemplateDefault_v0_12_1 : AssetTemplateDefault_v0_9,
    },
    {
      value: 'railwayXPush',
      name: 'Railway-X Push Asset',
      description: 'Allows other participants to push data to this endpoint',
      asset: isEdcV0_12_1.value ? AssetTemplateRailwayXPush_v0_12_1 : AssetTemplateRailwayXPush_v0_9,
    },
    {
      value: 'digitalTwinRegistry',
      name: 'Digital Twin Registry',
      description: 'The Digital Twin Registry enables the discovery and access of Digital Twins',
      asset: isEdcV0_12_1.value ? AssetTemplateDTRegistry_v0_12_1 : AssetTemplateDTRegistry_v0_9,
    },
    {
      value: 'submodelService',
      name: 'Submodel Service',
      description: 'The Submodel service allows to retrieve Submodels of Digital Twins',
      asset: isEdcV0_12_1.value ? AssetTemplateSmRepo_v0_12_1 : null,
    },
    {
      value: 'aasService',
      name: 'AAS Service',
      description: 'The AAS service allows to retrieve AAS',
      asset: isEdcV0_12_1.value ? AssetTemplateAasRepo_v0_12_1 : null,
    },
  ].filter(template => template.asset !== null))

  const placeholders = computed(() => {
    if (!selectedTemplate.value) return []

    const template = assetTemplates.value.find(t => t.value === selectedTemplate.value)
    if (!template) return []

    const templateStr = JSON.stringify(template.asset)
    const matches = [...templateStr.matchAll(/"([^"]+)":\s*"(\{\{[^}]+\}\})"/g)]

    const placeholderList = matches.map(match => {
      const attributeName = match[1]
      const content = match[2].slice(2, -2) // Remove {{ and }}
      const parts = content.split('|')

      return {
        attribute: attributeName,
        label: parts[0].trim(),
        placeholder: parts[1]?.trim() || '',
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
    if (!selectedTemplate.value) return ''

    const template = assetTemplates.value.find(t => t.value === selectedTemplate.value)
    if (!template) return ''

    try {
      let assetJson = JSON.stringify(template.asset)
      assetJson = replacePlaceholders(assetJson)

      const asset = JSON.parse(assetJson)
      const formatted = formatJSON(JSON.stringify(asset))

      if (Prism && Prism.highlight) {
        return Prism.highlight(formatted, getPrismJsonLanguage(), 'json')
      }
      return formatted
    } catch (error_) {
      console.error('Error highlighting JSON:', error_)
      return JSON.stringify(template.asset, null, 2)
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
      emit('update:model-value', value)
    },
  )

  watch(
    () => selectedTemplate.value,
    () => {
      // Reset placeholder values when template changes
      placeholderValues.value = {}
    },
  )

  // Methods
  function resetForm (): void {
    selectedTemplate.value = ''
    placeholderValues.value = {}
    if (form.value) {
      form.value.reset()
    }
  }

  function mandatoryPlaceholdersFilled (): boolean {
    const mandatoryAttributes = ['@id', 'baseUrl']
    return mandatoryAttributes
      .filter(attr => placeholders.value.some(p => p.attribute === attr))
      .every(attr => !!placeholderValues.value[attr])
  }

  function replacePlaceholders (assetJson: string): string {
    let result = assetJson
    for (const placeholder of placeholders.value) {
      const value = placeholderValues.value[placeholder.attribute] ?? ''
      result = result.replace(
        /\{\{[^}]*\}\}/g,
        match => {
          const matchContent = match.slice(2, -2)
          const matchParts = matchContent.split('|')
          if (matchParts[0].trim() === placeholder.label) {
            return value
          }
          return match
        },
      )
    }
    return result
  }

  function isEmptyValue (value: unknown): boolean {
    return value === null
      || value === undefined
      || (typeof value === 'string' && value.trim() === '')
      || (typeof value === 'string' && value === 'unknown')
      || (typeof value === 'string' && /\{\{[^}]+\}\}/.test(value))
  }

  function removeUnfilledPlaceholders (obj: any): any {
    if (typeof obj === 'string') {
      return obj
    }
    if (Array.isArray(obj)) {
      return obj
        .map(item => removeUnfilledPlaceholders(item))
        .filter(item => !isEmptyValue(item))
    }
    if (obj !== null && typeof obj === 'object') {
      const result: Record<string, any> = {}
      for (const [key, value] of Object.entries(obj as Record<string, any>)) {
        if (isEmptyValue(value)) {
          // Skip this key — value is empty, null, unknown or unfilled placeholder
          continue
        }
        result[key] = removeUnfilledPlaceholders(value)
      }
      return result
    }
    return obj
  }

  async function createAsset (): Promise<void> {
    if (!selectedTemplate.value || !mandatoryPlaceholdersFilled()) {
      console.warn('Template not selected or placeholders not filled')
      return
    }

    const template = assetTemplates.value.find(t => t.value === selectedTemplate.value)
    if (!template) {
      console.warn('Template not found')
      return
    }

    try {
      let assetJson = JSON.stringify(template.asset)
      assetJson = replacePlaceholders(assetJson)

      const finalAsset = removeUnfilledPlaceholders(JSON.parse(assetJson)) as Asset

      // Create the asset via EDC API
      const response = await createAssetInEdc(finalAsset)
      if (response.success && response.data) {
        emit('assets-created', response.data['@id'])
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
