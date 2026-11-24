<template>
  <!-- Widened by the OAuth2 drawer, so the form keeps its width -->
  <v-dialog
    v-model="createAssetDialog"
    style="min-height: 190px; max-height:90%"
    :width="oauth2Drawer ? '1136px' : '800px'"
  >
    <v-sheet border class="d-flex flex-column" height="100%" rounded="lg">
      <v-card-title class="bg-cardHeader">
        Create Asset from Template
      </v-card-title>

      <v-divider />

      <!-- Only the form scrolls, the OAuth2 drawer keeps the visible height -->
      <v-card-text class="pa-0 flex-grow-1 d-flex flex-column overflow-hidden">
        <v-layout class="overflow-hidden">
          <EdcAssetOAuth2Drawer v-model="oauth2Drawer">
            <EdcAssetOAuth2Fields
              v-model="oauth2"
              subtitle="Used by the data address of the Asset"
              title="Asset"
            />
          </EdcAssetOAuth2Drawer>

          <v-main class="d-flex flex-column">
            <v-form ref="form" class="d-flex flex-column pa-4 overflow-y-auto">

              <!-- Template Selection -->
              <v-select
                v-model="selectedTemplate"
                hide-details
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

              <!-- Full width, across the padding of the form -->
              <v-divider v-if="selectedTemplate" class="mt-4 mx-n4" />

              <!-- Dynamic Placeholder Fields, the OAuth2 ones are filled in the OAuth2 drawer -->
              <div v-if="selectedTemplate" class="d-flex flex-column mt-4">
                <v-text-field
                  v-for="(placeholder, index) in fieldPlaceholders"
                  :key="placeholder.label"
                  v-model="placeholderValues[placeholder.attribute]"
                  :class="index > 0 ? 'mt-2': ''"
                  :hide-details="placeholder.hint == ''"
                  :hint="placeholder.hint"
                  :label="placeholder.label"
                  :persistent-hint="placeholder.hint !== ''"
                  :placeholder="placeholder.placeholder"
                  required
                  variant="outlined"
                >
                  <!-- Next to the field of the Asset ID, aligned with the field above its hint -->
                  <template v-if="placeholder.attribute === '@id' && oauth2Placeholders.length > 0" #append>
                    <EdcAssetOAuth2Button v-model="oauth2Drawer" :configured="hasEdcAssetOAuth2(oauth2)" />
                  </template>
                </v-text-field>
              </div>

              <!-- Asset Preview, fits its content, the form scrolls instead of shrinking it -->
              <JSONPreview
                v-if="activeAssetTemplate"
                class="mt-4 flex-shrink-0"
                download-file-name="asset"
                height="auto"
                :json-content="jsonContent"
                title="Asset"
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
          :disabled="!selectedTemplate || !mandatoryPlaceholdersFilled()"
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
  } from '@/pages/modules/EclipseDataspaceConnector/composables/EdcAssetOAuth2'
  import {
    edcRequestFailureText,
    useEdcRequestFailureMessage,
  } from '@/pages/modules/EclipseDataspaceConnector/composables/EdcRequestFailure'
  import { fillTemplatePlaceholders, templatePlaceholders } from '@/pages/modules/EclipseDataspaceConnector/composables/EdcTemplatePlaceholders'
  import AssetTemplateDefault from '@/pages/modules/EclipseDataspaceConnector/data/templates/template_asset.json'
  import AssetTemplateDTRegistry from '@/pages/modules/EclipseDataspaceConnector/data/templates/template_asset_digitaltwin_registry.json'
  import AssetTemplateSmService from '@/pages/modules/EclipseDataspaceConnector/data/templates/template_asset_submodel_service.json'

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

  // Composables
  const { createAsset: createAssetInEdc } = useCatenaXEdcClient()
  const { showFailureMessage } = useEdcRequestFailureMessage()

  // Data
  const createAssetDialog = ref(false)
  const selectedTemplate = ref<'default' | 'railwayXPush' | ''>('')
  const form = ref<any>(null)
  const placeholderValues = ref<Record<string, string>>({})
  const oauth2Drawer = ref(false)
  const oauth2 = ref<EdcAssetOAuth2>(createEmptyEdcAssetOAuth2()) // Fills the "oauth2:*" placeholders of the template

  // Computed properties
  // Asset Templates
  const assetTemplates = computed(() => [
    {
      value: 'default',
      name: 'Default Asset',
      description: '',
      asset: AssetTemplateDefault,
    },
    {
      value: 'digitalTwinRegistry',
      name: 'Digital Twin Registry',
      description: 'The Digital Twin Registry enables the discovery and access of Digital Twins',
      asset: AssetTemplateDTRegistry,
    },
    {
      value: 'submodelService',
      name: 'Submodel Service',
      description: 'The Submodel service allows to retrieve Submodels of Digital Twins',
      asset: AssetTemplateSmService,
    },
  ].filter(template => template.asset !== null))

  const activeAssetTemplate = computed(() => assetTemplates.value.find(t => t.value === selectedTemplate.value))

  const placeholders = computed(() => activeAssetTemplate.value ? templatePlaceholders(activeAssetTemplate.value.asset) : [])

  const oauth2Placeholders = computed(() => placeholders.value.filter(p => p.attribute.startsWith('oauth2:')))
  const fieldPlaceholders = computed(() => placeholders.value.filter(p => !p.attribute.startsWith('oauth2:')))

  // Values of the placeholder fields and the OAuth2 drawer by attribute, e.g. "oauth2:clientId"
  const filledPlaceholderValues = computed<Record<string, string>>(() => ({
    ...placeholderValues.value,
    ...Object.fromEntries(Object.entries(oauth2.value).map(([key, value]) => ['oauth2:' + key, value.trim()])),
  }))

  // The preview shows the asset as it is created, without the unfilled placeholders
  const jsonContent = computed(() => activeAssetTemplate.value ? JSON.stringify(buildAsset(activeAssetTemplate.value.asset)) : '')

  // Watchers
  // Immediate, so a dialog restored from the URL opens
  watch(
    () => props.modelValue,
    value => {
      createAssetDialog.value = value
      if (!value) {
        resetForm()
      }
    },
    { immediate: true },
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
      oauth2.value = createEmptyEdcAssetOAuth2()
      if (oauth2Placeholders.value.length === 0) {
        oauth2Drawer.value = false
      }
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
      // Create the asset via EDC API
      const result = await createAssetInEdc(props.proxyId, buildAsset(template.asset))
      if (result.success) {
        emit('assets-created', result.data['@id'])
        createAssetDialog.value = false
        resetForm()
      } else {
        showFailureMessage('Failed to create Asset.', edcRequestFailureText(result, 'Asset', 'create'))
      }
    } catch (error_) {
      console.error('Error creating asset:', error_)
      showFailureMessage('Failed to create Asset.', error_ instanceof Error ? error_.message : String(error_))
    }
  }

  // The values are kept by attribute, the template is filled by label
  function buildAsset (template: unknown): CatenaXEdcAsset {
    const values = Object.fromEntries(placeholders.value.map(placeholder => [placeholder.label, filledPlaceholderValues.value[placeholder.attribute]]))
    return fillTemplatePlaceholders(template, values) as CatenaXEdcAsset
  }

</script>
