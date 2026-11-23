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
            :json-content="jsonContent"
            :title="`Contract`"
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
  import {
    edcRequestFailureText,
    useEdcRequestFailureMessage,
  } from '@/pages/modules/EclipseDataspaceConnector/composables/EdcRequestFailure'
  import { fillTemplatePlaceholders, templatePlaceholders } from '@/pages/modules/EclipseDataspaceConnector/composables/EdcTemplatePlaceholders'
  import ContractTemplate from '@/pages/modules/EclipseDataspaceConnector/data/templates/template_contract.json'

  const props = withDefaults(defineProps<{
    modelValue: boolean
    proxyId?: string
  }>(), {
    proxyId: 'default',
  })

  const emit = defineEmits<{
    (event: 'update:model-value', value: boolean): void
    (event: 'contract-created', contractId: string): void
  }>()

  // Composables
  const { createContractDefinition: createContractInEdc, queryAssets, queryPolicyDefinitions } = useCatenaXEdcClient()
  const { showFailureMessage } = useEdcRequestFailureMessage()

  // Data
  const createContractDialog = ref(false)
  const form = ref<any>(null)
  const placeholderValues = ref<Record<string, string>>({})
  const availableAssets = ref<any[]>([])
  const assetsLoading = ref(false)
  const availablePolicies = ref<any[]>([])
  const policiesLoading = ref(false)

  // Computed properties
  const activeContractTemplate = computed(() => ContractTemplate)

  const placeholders = computed(() => templatePlaceholders(activeContractTemplate.value).map(placeholder => ({
    ...placeholder,
    placeholder: placeholder.placeholder || `Enter ${placeholder.label}`,
  })))

  // Unfilled placeholders stay visible in the preview as {{Label}}
  const jsonContent = computed(() =>
    JSON.stringify(fillTemplatePlaceholders(activeContractTemplate.value, placeholderValues.value, { keepUnfilled: true })),
  )

  // Watchers
  // Immediate, so a dialog restored from the URL opens
  watch(
    () => props.modelValue,
    value => {
      createContractDialog.value = value
      if (value) {
        loadAssets()
        loadPolicies()
      } else {
        resetForm()
      }
    },
    { immediate: true },
  )

  watch(
    () => createContractDialog.value,
    value => {
      emit('update:model-value', value)
    },
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

  function resetForm (): void {
    placeholderValues.value = {}
    if (form.value) {
      form.value.reset()
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

    try {
      const finalContract = fillTemplatePlaceholders(activeContractTemplate.value, placeholderValues.value) as CatenaXEdcContractDefinition

      // Create the contract via EDC API
      const result = await createContractInEdc(props.proxyId, finalContract)
      if (result.success) {
        emit('contract-created', result.data['@id'])
        createContractDialog.value = false
        resetForm()
      } else {
        showFailureMessage('Failed to create Contract.', edcRequestFailureText(result, 'Contract', 'create'))
      }
    } catch (error_) {
      console.error('Error creating contract:', error_)
      showFailureMessage('Failed to create Contract.', error_ instanceof Error ? error_.message : String(error_))
    }
  }

</script>
