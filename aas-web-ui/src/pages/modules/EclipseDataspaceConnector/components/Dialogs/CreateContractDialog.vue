<template>
  <v-dialog v-model="createContractDialog" height="90%" :width="800">
    <v-sheet border class="d-flex flex-column" height="100%" rounded="lg">
      <v-card-title class="bg-cardHeader">
        Create Contract
      </v-card-title>

      <v-divider />

      <v-card-text class="flex-grow-1 overflow-y-auto">
        <v-form ref="form" class="d-flex flex-column gap-4">

          <!-- Dynamic Placeholder Fields -->
          <div class="d-flex flex-column gap-3">
            <template v-for="(placeholder, index) in placeholders" :key="placeholder.label">
              <v-select
                v-if="placeholder.label === 'EDC Asset ID'"
                v-model="placeholderValues[placeholder.label]"
                :class="index > 0 ? 'mt-2': ''"
                dense
                :hint="placeholder.hint"
                :item-title="getEdcAssetDisplayName"
                item-value="@id"
                :items="availableAssets"
                :label="placeholder.label"
                :loading="assetsLoading"
                persistent-hint
                required
                variant="outlined"
              />

              <v-select
                v-else-if="placeholder.label === 'Access Policy ID' || placeholder.label === 'Usage Policy ID'"
                v-model="placeholderValues[placeholder.label]"
                :class="index > 0 ? 'mt-2': ''"
                dense
                :hint="placeholder.hint"
                :item-title="getEdcPolicyDisplayName"
                item-value="@id"
                :items="availablePolicies"
                :label="placeholder.label"
                :loading="policiesLoading"
                persistent-hint
                required
                variant="outlined"
              />

              <v-text-field
                v-else
                v-model="placeholderValues[placeholder.label]"
                :class="index > 0 ? 'mt-2': ''"
                dense
                :hint="placeholder.hint"
                :label="placeholder.label"
                persistent-hint
                :placeholder="placeholder.placeholder"
                required
                variant="outlined"
              />
            </template>
          </div>

          <!-- Template Preview -->
          <div class="mt-4">
            <p class="text-caption text-medium-emphasis font-weight-bold mb-2">
              Template Preview:
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
  import * as Prism from 'prismjs'
  import { type ContractDefinition, useEdcClient } from '@/pages/modules/EclipseDataspaceConnector/composables/Client/EdcClient'
  import ContractTemplate from '@/pages/modules/EclipseDataspaceConnector/data/contract___tractux-x_edc_v0.9.json'
  import { formatJSON } from '@/utils/JsonUtils'
  import { getPrismJsonLanguage } from '@/utils/prismJsonLanguage'

  const props = defineProps<{
    modelValue: boolean
  }>()

  const emit = defineEmits<{
    (event: 'update:modelValue', value: boolean): void
    (event: 'contract-created', contractId: string): void
  }>()

  // Composables
  const { createContractDefinition: createContractInEdc, queryAssets, queryPolicyDefinitions } = useEdcClient()

  // Data
  const createContractDialog = ref(false)
  const form = ref<any>(null)
  const placeholderValues = ref<Record<string, string>>({})
  const availableAssets = ref<any[]>([])
  const assetsLoading = ref(false)
  const availablePolicies = ref<any[]>([])
  const policiesLoading = ref(false)

  // Computed properties
  const placeholders = computed(() => {
    const templateStr = JSON.stringify(ContractTemplate)
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
      let contractJson = JSON.stringify(ContractTemplate)
      contractJson = replacePlaceholders(contractJson)

      const contract = JSON.parse(contractJson)
      const formatted = formatJSON(JSON.stringify(contract))

      if (Prism && Prism.highlight) {
        return Prism.highlight(formatted, getPrismJsonLanguage(), 'json')
      }
      return formatted
    } catch (error_) {
      console.error('Error highlighting JSON:', error_)
      return JSON.stringify(ContractTemplate, null, 2)
    }
  })

  // Watchers
  watch(
    () => props.modelValue,
    value => {
      createContractDialog.value = value
      if (!value) {
        resetForm()
      }
    },
  )

  watch(
    () => createContractDialog.value,
    value => {
      emit('update:modelValue', value)
      if (value) {
        loadAssets()
        loadPolicies()
      }
    },
  )

  // Auto-generate Contract ID
  watch(
    () => [
      placeholderValues.value['EDC Asset ID'],
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
      const assets = await queryAssets()
      availableAssets.value = assets || []
    } catch (error) {
      console.error('Error loading assets:', error)
    } finally {
      assetsLoading.value = false
    }
  }

  async function loadPolicies (): Promise<void> {
    policiesLoading.value = true
    try {
      const policies = await queryPolicyDefinitions()
      availablePolicies.value = policies || []
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
    return props.name || props.description || asset['@id'] || ''
  }

  function getEdcPolicyDisplayName (policy: any): string {
    if (!policy) return ''
    return policy['@id'] || ''
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

  async function createContract (): Promise<void> {
    if (!allPlaceholdersFilled()) {
      console.warn('Placeholders not filled')
      return
    }

    try {
      let contractJson = JSON.stringify(ContractTemplate)
      contractJson = replacePlaceholders(contractJson)

      const finalContract = JSON.parse(contractJson) as ContractDefinition

      // Create the contract via EDC API
      const response = await createContractInEdc(finalContract)
      if (response) {
        emit('contract-created', response['@id'])
        createContractDialog.value = false
        resetForm()
      } else {
        console.error('Failed to create contract')
      }
    } catch (error_) {
      console.error('Error creating contract:', error_)
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
