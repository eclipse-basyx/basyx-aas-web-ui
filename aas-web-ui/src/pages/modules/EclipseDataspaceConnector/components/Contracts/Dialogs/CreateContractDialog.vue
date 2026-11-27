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
                v-if="placeholder.label === CONTRACT_TEMPLATE_LABELS.assetId"
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
                v-else-if="placeholder.label === CONTRACT_TEMPLATE_LABELS.accessPolicyId || placeholder.label === CONTRACT_TEMPLATE_LABELS.usagePolicyId"
                v-model="placeholderValues[placeholder.label]"
                :class="index > 0 ? 'mt-2': ''"
                :hide-details="placeholder.hint == ''"
                :hint="placeholder.hint"
                :item-title="getEdcPolicyDisplayName"
                item-value="@id"
                :items="placeholder.label === CONTRACT_TEMPLATE_LABELS.accessPolicyId ? accessPolicies : usagePolicies"
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
  import { DEFAULT_EDC_PROXY_ID } from '@/composables/SelectedEdcConfig'
  import { edcAssetName } from '@/pages/modules/EclipseDataspaceConnector/composables/EdcAssetName'
  import { EDC_ASSET_ID_OPERAND } from '@/pages/modules/EclipseDataspaceConnector/composables/EdcPaging'
  import { type EdcPolicyType, edcPolicyTypes } from '@/pages/modules/EclipseDataspaceConnector/composables/EdcPolicyType'
  import { useEdcResourceOptions } from '@/pages/modules/EclipseDataspaceConnector/composables/EdcResourceOptions'
  import { type EdcTemplate, useEdcTemplateForm } from '@/pages/modules/EclipseDataspaceConnector/composables/EdcTemplateForm'
  import { fillTemplatePlaceholders } from '@/pages/modules/EclipseDataspaceConnector/composables/EdcTemplatePlaceholders'
  import { CONTRACT_TEMPLATE_LABELS } from '@/pages/modules/EclipseDataspaceConnector/data/templatePlaceholderLabels'
  import ContractTemplate from '@/pages/modules/EclipseDataspaceConnector/data/templates/template_contract.json'

  const props = withDefaults(defineProps<{
    proxyId?: string
  }>(), {
    proxyId: DEFAULT_EDC_PROXY_ID,
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
    placeholders,
    resetForm,
    createFromTemplate,
  } = useEdcTemplateForm('Contract', contractTemplates, 'contract', placeholder => ({
    ...placeholder,
    placeholder: placeholder.placeholder || `Enter ${placeholder.label}`,
  }))

  const { options: availableAssets, loading: assetsLoading, load: loadAssets } = useEdcResourceOptions(
    'assets',
    querySpec => queryAssets(props.proxyId, { querySpec }),
    getEdcAssetDisplayName,
    { idOperand: EDC_ASSET_ID_OPERAND },
  )
  const { options: availablePolicies, loading: policiesLoading, load: loadPolicies } = useEdcResourceOptions(
    'policies',
    querySpec => queryPolicyDefinitions(props.proxyId, { querySpec }),
    getEdcPolicyDisplayName,
  )

  // Data
  // The Contract ID the dialog generated last, to tell it from an ID the user typed
  let generatedContractId = ''

  // Computed properties
  // Unfilled placeholders stay visible in the preview as {{Label}}
  const jsonContent = computed(() => activeTemplate.value
    ? JSON.stringify(fillTemplatePlaceholders(activeTemplate.value.template, placeholderValues.value, { keepUnfilled: true }))
    : '')

  // Each policy select offers only policies of its type, so a usage policy can't become the access policy
  const accessPolicies = computed(() => policiesOfType('Access'))
  const usagePolicies = computed(() => policiesOfType('Usage'))

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
        generatedContractId = ''
      }
    },
    { immediate: true },
  )

  // Generate the Contract ID from the asset and the policies, and again when one of them changes.
  // An ID the user typed is kept; once the field is cleared, the next change generates the ID again.
  watch(
    () => [
      placeholderValues.value[CONTRACT_TEMPLATE_LABELS.assetId],
      placeholderValues.value[CONTRACT_TEMPLATE_LABELS.accessPolicyId],
      placeholderValues.value[CONTRACT_TEMPLATE_LABELS.usagePolicyId],
    ],
    ([assetId, accessId, usageId]) => {
      const currentContractId = placeholderValues.value[CONTRACT_TEMPLATE_LABELS.contractId] ?? ''
      const typedByUser = currentContractId.trim() !== '' && currentContractId !== generatedContractId
      if (assetId && accessId && usageId && !typedByUser) {
        generatedContractId = `contract-${assetId}-${accessId}-${usageId}`
        placeholderValues.value[CONTRACT_TEMPLATE_LABELS.contractId] = generatedContractId
      }
    },
  )

  // Methods
  // With its ID, since assets from the same template share their name, e.g. "Submodel Service"
  function getEdcAssetDisplayName (asset: any): string {
    const id = asset?.['@id'] || ''
    const name = edcAssetName(asset)
    if (!name || name === id) return id
    return id ? `${name} (${id})` : name
  }

  // A policy of unknown type, e.g. without a known action, stays in both selects
  function policiesOfType (type: EdcPolicyType): typeof availablePolicies.value {
    return availablePolicies.value.filter(policy => {
      const types = edcPolicyTypes(policy)
      return types.length === 0 || types.includes(type)
    })
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
