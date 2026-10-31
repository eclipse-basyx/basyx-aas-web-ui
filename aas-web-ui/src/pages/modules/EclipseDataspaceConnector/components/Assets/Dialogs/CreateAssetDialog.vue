<template>
  <!-- Widened by the OAuth2 drawer, so the form keeps its width -->
  <v-dialog
    v-model="createAssetDialog"
    style="min-height: 190px; max-height:90%"
    :width="oauth2Drawer ? '1136px' : '800px'"
  >
    <v-sheet border class="d-flex flex-column" height="100%" rounded="lg">
      <v-card-title class="bg-cardHeader">
        Create EDC Asset
      </v-card-title>

      <v-divider />

      <!-- Only the form scrolls, the OAuth2 drawer keeps the visible height -->
      <v-card-text class="pa-0 flex-grow-1 d-flex flex-column overflow-hidden">
        <v-layout class="overflow-hidden">
          <EdcAssetOAuth2Drawer v-model="oauth2Drawer">
            <EdcAssetOAuth2Fields
              v-model="oauth2"
              subtitle="Used by the data address of the EDC asset"
              title="EDC Asset"
            />
          </EdcAssetOAuth2Drawer>

          <v-main class="d-flex flex-column">
            <v-form ref="form" class="d-flex flex-column gap-4 pa-4 overflow-y-auto">
              <!-- Dynamic Placeholder Fields, the OAuth2 ones are filled in the OAuth2 drawer -->
              <div class="d-flex flex-column gap-3">
                <v-text-field
                  v-for="(placeholder, index) in fieldPlaceholders"
                  :key="placeholder.label"
                  v-model="placeholderValues[placeholder.label]"
                  :class="index > 0 ? 'mt-2': ''"
                  dense
                  :hide-details="placeholder.hint == ''"
                  :hint="placeholder.hint"
                  :label="placeholder.mandatory ? `${placeholder.label} *` : placeholder.label"
                  :persistent-hint="placeholder.hint !== ''"
                  :placeholder="placeholder.placeholder"
                  :required="placeholder.mandatory"
                  variant="outlined"
                >
                  <!-- Next to the field of the Asset ID, aligned with the field above its hint -->
                  <template v-if="placeholder.attribute === '@id'" #append>
                    <EdcAssetOAuth2Button v-model="oauth2Drawer" :configured="hasEdcAssetOAuth2(oauth2)" />
                  </template>
                </v-text-field>
              </div>

              <!-- EDC Asset Preview, fits its content, the form scrolls instead of shrinking it -->
              <JSONPreview
                class="mt-4 flex-shrink-0"
                height="auto"
                :json-content="jsonContent"
                title="EDC Asset"
              />
            </v-form>
          </v-main>
        </v-layout>
      </v-card-text>

      <v-divider />

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
          :disabled="!mandatoryPlaceholdersFilled"
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
  import { type CatenaXEdcAsset, useCatenaXEdcClient } from '@/composables/Client/CatenaXEdcClient'
  import EdcAssetOAuth2Button from '@/pages/modules/EclipseDataspaceConnector/components/Assets/EdcAssetOAuth2Button.vue'
  import EdcAssetOAuth2Drawer from '@/pages/modules/EclipseDataspaceConnector/components/Assets/EdcAssetOAuth2Drawer.vue'
  import EdcAssetOAuth2Fields from '@/pages/modules/EclipseDataspaceConnector/components/Assets/EdcAssetOAuth2Fields.vue'
  import {
    createEmptyEdcAssetOAuth2,
    type EdcAssetOAuth2,
    hasEdcAssetOAuth2,
  } from '@/pages/modules/EclipseDataspaceConnector/composables/EdcAssetFromAas'
  import {
    edcRequestFailureText,
    useEdcRequestFailureMessage,
  } from '@/pages/modules/EclipseDataspaceConnector/composables/EdcRequestFailure'
  import AssetTemplate from '@/pages/modules/EclipseDataspaceConnector/data/templates/template_asset.json'

  const props = withDefaults(defineProps<{
    modelValue: boolean
    proxyId?: string
  }>(), {
    proxyId: 'default',
  })

  const emit = defineEmits<{
    (event: 'update:model-value', value: boolean): void
    (event: 'assets-created', assetId: string): void
  }>()

  // Template attributes the user must fill in before an asset can be created
  const MANDATORY_ATTRIBUTES = new Set(['@id', 'baseUrl'])

  // Composables
  const { createAsset: createAssetInEdc } = useCatenaXEdcClient()
  const { showFailureMessage } = useEdcRequestFailureMessage()

  // Data
  const createAssetDialog = ref(false)
  const form = ref<any>(null)
  const placeholderValues = ref<Record<string, string>>({})
  const oauth2Drawer = ref(false)
  const oauth2 = ref<EdcAssetOAuth2>(createEmptyEdcAssetOAuth2()) // Fills the "oauth2:*" placeholders of the template

  // Computed properties
  const activeAssetTemplate = computed(() => AssetTemplate)

  const placeholders = computed(() => {
    const templateStr = JSON.stringify(activeAssetTemplate.value)
    const matches = [...templateStr.matchAll(/"([^"]+)":\s*"(\{\{[^}]+\}\})"/g)]

    // Keyed by label, since the same placeholder may be used for several attributes
    const uniquePlaceholders = new Map<string, { attribute: string, label: string, placeholder: string, hint: string, mandatory: boolean }>()

    for (const match of matches) {
      const attributeName = match[1]
      const content = match[2].slice(2, -2) // Remove {{ and }}
      const parts = content.split('|')
      const label = parts[0].trim()
      const mandatory = MANDATORY_ATTRIBUTES.has(attributeName)

      const existing = uniquePlaceholders.get(label)
      if (existing) {
        existing.mandatory = existing.mandatory || mandatory
        continue
      }

      uniquePlaceholders.set(label, {
        attribute: attributeName,
        label,
        placeholder: parts[1]?.trim() || '',
        hint: parts[2]?.trim() || '',
        mandatory,
      })
    }

    return [...uniquePlaceholders.values()]
  })

  const oauth2Placeholders = computed(() => placeholders.value.filter(p => p.attribute.startsWith('oauth2:')))
  const fieldPlaceholders = computed(() => placeholders.value.filter(p => !p.attribute.startsWith('oauth2:')))

  // Values of the placeholder fields and the OAuth2 drawer by label, e.g. "oauth2:clientId" → "Endpoint client ID"
  const filledPlaceholderValues = computed<Record<string, string>>(() => ({
    ...placeholderValues.value,
    ...Object.fromEntries(oauth2Placeholders.value.map(p => [
      p.label,
      oauth2.value[p.attribute.replace('oauth2:', '') as keyof EdcAssetOAuth2]?.trim() ?? '',
    ])),
  }))

  const jsonContent = computed(() =>
    replacePlaceholders(JSON.stringify(activeAssetTemplate.value)),
  )

  const mandatoryPlaceholdersFilled = computed(() =>
    placeholders.value
      .filter(p => p.mandatory)
      .every(p => !!placeholderValues.value[p.label]?.trim()),
  )

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

  // Methods
  function resetForm (): void {
    placeholderValues.value = {}
    oauth2.value = createEmptyEdcAssetOAuth2()
    oauth2Drawer.value = false
    if (form.value) {
      form.value.reset()
    }
  }

  function replacePlaceholders (assetJson: string): string {
    let result = assetJson
    for (const placeholder of placeholders.value) {
      const value = filledPlaceholderValues.value[placeholder.label] ?? ''
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
    if (!mandatoryPlaceholdersFilled.value) {
      console.warn('Placeholders not filled')
      return
    }

    try {
      let assetJson = JSON.stringify(activeAssetTemplate.value)
      assetJson = replacePlaceholders(assetJson)

      const finalAsset = removeUnfilledPlaceholders(JSON.parse(assetJson)) as CatenaXEdcAsset

      // Create the asset via EDC API
      const result = await createAssetInEdc(props.proxyId, finalAsset)
      if (result.success) {
        emit('assets-created', result.data['@id'])
        createAssetDialog.value = false
        resetForm()
      } else {
        showFailureMessage('Failed to create EDC Asset.', edcRequestFailureText(result, 'Asset', 'create'))
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
