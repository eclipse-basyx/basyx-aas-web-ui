<template>
  <!-- Widened by the OAuth2 drawer, so the form keeps its width -->
  <v-dialog
    v-model="createAssetDialog"
    style="min-height: 190px; max-height:90%"
    :width="oauth2Drawer ? '1136px' : '800px'"
  >
    <v-sheet border class="d-flex flex-column" height="100%" rounded="lg">
      <v-card-title class="bg-cardHeader">
        Create Asset
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
              <!-- Dynamic Placeholder Fields, the OAuth2 ones are filled in the OAuth2 drawer -->
              <div class="d-flex flex-column">
                <v-text-field
                  v-for="(placeholder, index) in fieldPlaceholders"
                  :key="placeholder.label"
                  v-model="placeholderValues[placeholder.label]"
                  :class="index > 0 ? 'mt-2': ''"
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

              <!-- Asset Preview, fits its content, the form scrolls instead of shrinking it -->
              <JSONPreview
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
  } from '@/pages/modules/EclipseDataspaceConnector/composables/EdcAssetOAuth2'
  import {
    edcRequestFailureText,
    useEdcRequestFailureMessage,
  } from '@/pages/modules/EclipseDataspaceConnector/composables/EdcRequestFailure'
  import { fillTemplatePlaceholders, templatePlaceholders } from '@/pages/modules/EclipseDataspaceConnector/composables/EdcTemplatePlaceholders'
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

  // A label used for several attributes is mandatory if one of them is
  const placeholders = computed(() => templatePlaceholders(activeAssetTemplate.value).map(placeholder => ({
    ...placeholder,
    mandatory: placeholder.attributes.some(attribute => MANDATORY_ATTRIBUTES.has(attribute)),
  })))

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

  // The preview shows the asset as it is created, without the unfilled placeholders
  const jsonContent = computed(() => JSON.stringify(buildAsset()))

  const mandatoryPlaceholdersFilled = computed(() =>
    placeholders.value
      .filter(p => p.mandatory)
      .every(p => !!placeholderValues.value[p.label]?.trim()),
  )

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

  // Methods
  function resetForm (): void {
    placeholderValues.value = {}
    oauth2.value = createEmptyEdcAssetOAuth2()
    oauth2Drawer.value = false
    if (form.value) {
      form.value.reset()
    }
  }

  async function createAsset (): Promise<void> {
    if (!mandatoryPlaceholdersFilled.value) {
      console.warn('Placeholders not filled')
      return
    }

    try {
      // Create the asset via EDC API
      const result = await createAssetInEdc(props.proxyId, buildAsset())
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

  function buildAsset (): CatenaXEdcAsset {
    return fillTemplatePlaceholders(activeAssetTemplate.value, filledPlaceholderValues.value) as CatenaXEdcAsset
  }

</script>
