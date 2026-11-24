<template>
  <!-- Widened by the OAuth2 drawer, so the form keeps its width -->
  <v-dialog
    v-model="createAssetDialog"
    max-height="90%"
    :width="oauth2Drawer ? '1136px' : '800px'"
  >
    <v-sheet border class="d-flex flex-column" height="100%" rounded="lg">
      <v-card-title class="bg-cardHeader">
        {{ fromTemplate ? 'Create Asset from Template' : 'Create Asset' }}
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

              <!-- Template Selection, without it the default template is used -->
              <template v-if="fromTemplate">
                <EdcTemplateSelect
                  v-model="selectedTemplate"
                  icon="mdi-code-json"
                  label="Select Asset Template"
                  :templates="assetTemplates"
                />

                <!-- Full width, across the padding of the form -->
                <v-divider v-if="activeTemplate" class="mt-4 mx-n4" />
              </template>

              <!-- Dynamic Placeholder Fields, the OAuth2 ones are filled in the OAuth2 drawer -->
              <EdcTemplatePlaceholderFields
                v-if="activeTemplate"
                v-model="placeholderValues"
                :append-attribute="oauth2Placeholders.length > 0 ? '@id' : undefined"
                :class="fromTemplate ? 'mt-4' : ''"
                :placeholders="fieldPlaceholders"
              >
                <!-- Next to the field of the Asset ID, aligned with the field above its hint -->
                <template #append>
                  <EdcAssetOAuth2Button v-model="oauth2Drawer" :configured="hasEdcAssetOAuth2(oauth2)" />
                </template>
              </EdcTemplatePlaceholderFields>

              <!-- Asset Preview, fits its content, the form scrolls instead of shrinking it -->
              <JSONPreview
                v-if="activeTemplate"
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
          :disabled="!activeTemplate || !mandatoryPlaceholdersFilled"
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
  import EdcTemplatePlaceholderFields from '@/pages/modules/EclipseDataspaceConnector/components/Shared/EdcTemplatePlaceholderFields.vue'
  import EdcTemplateSelect from '@/pages/modules/EclipseDataspaceConnector/components/Shared/EdcTemplateSelect.vue'
  import {
    createEmptyEdcAssetOAuth2,
    type EdcAssetOAuth2,
    edcAssetOAuth2PlaceholderValues,
    hasEdcAssetOAuth2,
  } from '@/pages/modules/EclipseDataspaceConnector/composables/EdcAssetOAuth2'
  import { type EdcTemplate, useEdcTemplateForm } from '@/pages/modules/EclipseDataspaceConnector/composables/EdcTemplateForm'
  import { fillTemplatePlaceholders, templatePlaceholders } from '@/pages/modules/EclipseDataspaceConnector/composables/EdcTemplatePlaceholders'
  import AssetTemplateDefault from '@/pages/modules/EclipseDataspaceConnector/data/templates/template_asset.json'
  import AssetTemplateDTRegistry from '@/pages/modules/EclipseDataspaceConnector/data/templates/template_asset_digitaltwin_registry.json'
  import AssetTemplateSmService from '@/pages/modules/EclipseDataspaceConnector/data/templates/template_asset_submodel_service.json'

  const props = withDefaults(defineProps<{
    proxyId?: string
    fromTemplate?: boolean // Lets the user choose the template, otherwise the default template is used
  }>(), {
    proxyId: 'default',
    fromTemplate: false,
  })

  const emit = defineEmits<{
    (event: 'assets-created', assetId: string): void
  }>()

  // Template attributes the user must fill in before an asset can be created
  const MANDATORY_ATTRIBUTES = new Set(['@id', 'baseUrl'])

  const assetTemplates: EdcTemplate<'default' | 'digitalTwinRegistry' | 'submodelService'>[] = [
    {
      value: 'default',
      name: 'Default Asset',
      description: '',
      template: AssetTemplateDefault,
    },
    {
      value: 'digitalTwinRegistry',
      name: 'Digital Twin Registry',
      description: 'The Digital Twin Registry enables the discovery and access of Digital Twins',
      template: AssetTemplateDTRegistry,
    },
    {
      value: 'submodelService',
      name: 'Submodel Service',
      description: 'The Submodel service allows to retrieve Submodels of Digital Twins',
      template: AssetTemplateSmService,
    },
  ]

  // Composables
  const { createAsset: createAssetInEdc } = useCatenaXEdcClient()
  const {
    selectedTemplate,
    placeholderValues,
    form,
    activeTemplate,
    resetForm,
    createFromTemplate,
  } = useEdcTemplateForm('Asset', assetTemplates, props.fromTemplate ? '' : 'default')

  // Data
  const createAssetDialog = defineModel<boolean>({ required: true })
  const oauth2Drawer = ref(false)
  const oauth2 = ref<EdcAssetOAuth2>(createEmptyEdcAssetOAuth2()) // Fills the "oauth2:*" placeholders of the template

  // Computed properties
  // A label used for several attributes is mandatory if one of them is
  const placeholders = computed(() => activeTemplate.value
    ? templatePlaceholders(activeTemplate.value.template).map(placeholder => ({
      ...placeholder,
      mandatory: placeholder.attributes.some(attribute => MANDATORY_ATTRIBUTES.has(attribute)),
    }))
    : [])

  const oauth2Placeholders = computed(() => placeholders.value.filter(p => p.attribute.startsWith('oauth2:')))
  const fieldPlaceholders = computed(() => placeholders.value.filter(p => !p.attribute.startsWith('oauth2:')))

  // Values of the placeholder fields and the OAuth2 drawer by label
  const filledPlaceholderValues = computed<Record<string, string>>(() => ({
    ...placeholderValues.value,
    ...edcAssetOAuth2PlaceholderValues(oauth2Placeholders.value, oauth2.value),
  }))

  // The preview shows the asset as it is created, without the unfilled placeholders
  const jsonContent = computed(() => activeTemplate.value ? JSON.stringify(buildAsset(activeTemplate.value.template)) : '')

  const mandatoryPlaceholdersFilled = computed(() =>
    placeholders.value
      .filter(p => p.mandatory)
      .every(p => !!placeholderValues.value[p.label]?.trim()),
  )

  // Watchers
  watch(
    () => createAssetDialog.value,
    value => {
      if (!value) {
        resetForm()
        resetOAuth2()
        oauth2Drawer.value = false
      }
    },
  )

  watch(
    () => selectedTemplate.value,
    () => {
      // The placeholder values are reset by the template form
      resetOAuth2()
      if (oauth2Placeholders.value.length === 0) {
        oauth2Drawer.value = false
      }
    },
  )

  // Methods
  function resetOAuth2 (): void {
    oauth2.value = createEmptyEdcAssetOAuth2()
  }

  async function createAsset (): Promise<void> {
    if (!mandatoryPlaceholdersFilled.value) {
      console.warn('Placeholders not filled')
      return
    }

    // Create the asset via EDC API
    const assetId = await createFromTemplate(template => createAssetInEdc(props.proxyId, buildAsset(template)))
    if (assetId) {
      emit('assets-created', assetId)
      createAssetDialog.value = false
    }
  }

  function buildAsset (template: unknown): CatenaXEdcAsset {
    return fillTemplatePlaceholders(template, filledPlaceholderValues.value) as CatenaXEdcAsset
  }

</script>
