<template>
  <v-dialog v-model="createContractDialog" max-height="90%" :width="800">
    <v-sheet border class="d-flex flex-column" height="100%" rounded="lg">
      <v-card-title class="bg-cardHeader">
        Create Contract
      </v-card-title>

      <v-divider />

      <v-card-text class="flex-grow-1 overflow-y-auto">
        <v-form ref="form" class="d-flex flex-column">

          <!-- Dynamic Placeholder Fields -->
          <div class="d-flex flex-column">
            <template v-for="(placeholder, index) in placeholders" :key="placeholder.label">
              <v-select
                v-if="placeholder.label === 'Asset ID'"
                v-model="placeholderValues[placeholder.label]"
                :class="index > 0 ? 'mt-2': ''"
                :hide-details="placeholder.hint == ''"
                :hint="placeholder.hint"
                :item-title="getEdcAssetDisplayName"
                item-value="@id"
                :items="availableAssets"
                :label="placeholder.label"
                :loading="assetsLoading"
                :persistent-hint="placeholder.hint !== ''"
                required
                variant="outlined"
              />

              <v-select
                v-else-if="placeholder.label === 'Access Policy ID' || placeholder.label === 'Usage Policy ID'"
                v-model="placeholderValues[placeholder.label]"
                :class="index > 0 ? 'mt-2': ''"
                :hide-details="placeholder.hint == ''"
                :hint="placeholder.hint"
                :item-title="getEdcPolicyDisplayName"
                item-value="@id"
                :items="availablePolicies"
                :label="placeholder.label"
                :loading="policiesLoading"
                :persistent-hint="placeholder.hint !== ''"
                required
                variant="outlined"
              />

              <v-text-field
                v-else
                v-model="placeholderValues[placeholder.label]"
                :class="index > 0 ? 'mt-2': ''"
                :hide-details="placeholder.hint == ''"
                :hint="placeholder.hint"
                :label="placeholder.label"
                :persistent-hint="placeholder.hint !== ''"
                :placeholder="placeholder.placeholder"
                required
                variant="outlined"
              />
            </template>
          </div>

          <!-- Contract Preview -->
          <JSONPreview
            class="mt-4"
            download-file-name="contract"
            height="auto"
            icon="mdi-file-sign"
            :json-content="jsonContent"
            title="Contract"
          />
        </v-form>
      </v-card-text>

      <v-divider />

      <v-card-actions>
        <v-spacer />

        <v-btn
          rounded="lg"
          text="Cancel"
          @click="createContractDialog = false"
        />

        <v-btn
          class="text-buttonText"
          color="primary"
          :disabled="!allPlaceholdersFilled()"
          rounded="lg"
          text="Create"
          variant="flat"
          @click="createContract"
        />
      </v-card-actions>
    </v-sheet>
  </v-dialog>
</template>

<script lang="ts" setup>
  import { type CatenaXEdcContractDefinition, useCatenaXEdcClient } from '@/composables/Client/CatenaXEdcClient'
  import { EDC_ASSET_ID_OPERAND, queryAllEdcPages } from '@/pages/modules/EclipseDataspaceConnector/composables/EdcPaging'
  import { type EdcTemplate, useEdcTemplateForm } from '@/pages/modules/EclipseDataspaceConnector/composables/EdcTemplateForm'
  import { fillTemplatePlaceholders, templatePlaceholders } from '@/pages/modules/EclipseDataspaceConnector/composables/EdcTemplatePlaceholders'
  import ContractTemplate from '@/pages/modules/EclipseDataspaceConnector/data/templates/template_contract.json'

  const props = withDefaults(defineProps<{
    proxyId?: string
  }>(), {
    proxyId: 'default',
  })

  const emit = defineEmits<{
    (event: 'contract-created', contractId: string): void
  }>()

  const createContractDialog = defineModel<boolean>({ required: true })

  // The dialog has no template selection, its only template is always active
  const contractTemplates: EdcTemplate<'contract'>[] = [
    {
      value: 'contract',
      name: 'Contract',
      description: 'Offers an asset under an access and a usage policy',
      template: ContractTemplate,
    },
  ]

  // Composables
  const { createContractDefinition: createContractInEdc, queryAssets, queryPolicyDefinitions } = useCatenaXEdcClient()
  const {
    placeholderValues,
    form,
    activeTemplate,
    resetForm,
    createFromTemplate,
  } = useEdcTemplateForm('Contract', contractTemplates, 'contract')

  // Data
  const availableAssets = ref<any[]>([])
  const assetsLoading = ref(false)
  const availablePolicies = ref<any[]>([])
  const policiesLoading = ref(false)

  // Computed properties
  const placeholders = computed(() => activeTemplate.value
    ? templatePlaceholders(activeTemplate.value.template).map(placeholder => ({
      ...placeholder,
      placeholder: placeholder.placeholder || `Enter ${placeholder.label}`,
    }))
    : [])

  // Unfilled placeholders stay visible in the preview as {{Label}}
  const jsonContent = computed(() => activeTemplate.value
    ? JSON.stringify(fillTemplatePlaceholders(activeTemplate.value.template, placeholderValues.value, { keepUnfilled: true }))
    : '')

  // Watchers
  // Immediate, so a dialog restored from the URL loads the assets and policies
  watch(
    () => createContractDialog.value,
    value => {
      if (value) {
        loadAssets()
        loadPolicies()
      } else {
        resetForm()
      }
    },
    { immediate: true },
  )

  // Auto-generate Contract ID
  watch(
    () => [
      placeholderValues.value['Asset ID'],
      placeholderValues.value['Access Policy ID'],
      placeholderValues.value['Usage Policy ID'],
    ],
    ([assetId, accessId, usageId]) => {
      const currentContractId = placeholderValues.value['Contract ID']
      if (assetId && accessId && usageId && (!currentContractId || currentContractId.trim() === '')) {
        placeholderValues.value['Contract ID'] = `contract-${assetId}-${accessId}-${usageId}`
      }
    },
  )

  // Methods
  async function loadAssets (): Promise<void> {
    assetsLoading.value = true
    try {
      const result = await queryAllEdcPages(querySpec => queryAssets(props.proxyId, { querySpec }), { idOperand: EDC_ASSET_ID_OPERAND })
      availableAssets.value = (result.success ? result.data : []).toSorted((a, b) => getEdcAssetDisplayName(a).localeCompare(getEdcAssetDisplayName(b)))
    } catch (error) {
      console.error('Error loading assets:', error)
    } finally {
      assetsLoading.value = false
    }
  }

  async function loadPolicies (): Promise<void> {
    policiesLoading.value = true
    try {
      const result = await queryAllEdcPages(querySpec => queryPolicyDefinitions(props.proxyId, { querySpec }))
      availablePolicies.value = (result.success ? result.data : []).toSorted((a, b) => getEdcPolicyDisplayName(a).localeCompare(getEdcPolicyDisplayName(b)))
    } catch (error) {
      console.error('Error loading policies:', error)
    } finally {
      policiesLoading.value = false
    }
  }

  function getEdcAssetDisplayName (asset: any): string {
    if (!asset) return ''
    const props = asset.properties || {}
    return props.displayName || props.name || props.description || asset['@id'] || ''
  }

  function getEdcPolicyDisplayName (policy: any): string {
    if (!policy) return ''
    return policy['@id'] || ''
  }

  function allPlaceholdersFilled (): boolean {
    return placeholders.value.every(placeholder => placeholderValues.value[placeholder.label] && placeholderValues.value[placeholder.label].trim() !== '')
  }

  async function createContract (): Promise<void> {
    if (!allPlaceholdersFilled()) {
      console.warn('Placeholders not filled')
      return
    }

    // Create the contract via EDC API, the dialog resets when it closes
    const contractId = await createFromTemplate(template => createContractInEdc(
      props.proxyId,
      fillTemplatePlaceholders(template, placeholderValues.value) as CatenaXEdcContractDefinition,
    ))
    if (contractId) {
      emit('contract-created', contractId)
      createContractDialog.value = false
    }
  }

</script>
