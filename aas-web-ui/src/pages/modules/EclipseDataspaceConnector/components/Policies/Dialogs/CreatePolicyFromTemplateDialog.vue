<template>
  <v-dialog v-model="createPolicyDialog" max-height="90%" :width="800">
    <v-sheet border class="d-flex flex-column" height="100%" rounded="lg">
      <v-card-title class="bg-cardHeader">
        Create Policy
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
            :items="policyTemplates"
            label="Select Policy Template"
            required
            variant="outlined"
          >
            <template #item="{ props: itemProps, item }">
              <v-list-item v-bind="itemProps">
                <template #prepend>
                  <v-icon class="mr-n5">mdi-shield-check-outline</v-icon>
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

          <!-- Policy Preview -->
          <div v-if="selectedTemplate">
            <p class="text-caption text-medium-emphasis font-weight-bold mb-2">
              Policy Preview:
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
          @click="createPolicyDialog = false"
        />

        <v-btn
          class="text-buttonText"
          color="primary"
          :disabled="!selectedTemplate || !allPlaceholdersFilled()"
          rounded="lg"
          text="Create"
          variant="flat"
          @click="createPolicy"
        />
      </v-card-actions>
    </v-sheet>
  </v-dialog>
</template>

<script lang="ts" setup>
  import * as Prism from 'prismjs'
  import { type PolicyDefinition, useEdcClient } from '@/pages/modules/EclipseDataspaceConnector/composables/Client/EdcClient'
  import AccessBpnPolicy_v0_9 from '@/pages/modules/EclipseDataspaceConnector/data/policies/access_bpn_policy___tractus-x_edc_v0.9.json'
  import AccessBpnPolicy_v0_12_1 from '@/pages/modules/EclipseDataspaceConnector/data/policies/access_bpn_policy___tractus-x_edc_v0.12.1.json'
  import AccessPolicy_v0_9 from '@/pages/modules/EclipseDataspaceConnector/data/policies/access_policy___tractus-x_edc_v0.9.json'
  import AccessPolicy_v0_12_1 from '@/pages/modules/EclipseDataspaceConnector/data/policies/access_policy___tractus-x_edc_v0.12.1.json'
  import UsagePolicy_v0_9 from '@/pages/modules/EclipseDataspaceConnector/data/policies/usage_policy___tractus-x_edc_v0.9.json'
  import UsagePolicy_v0_12_1 from '@/pages/modules/EclipseDataspaceConnector/data/policies/usage_policy___tractus-x_edc_v0.12.1.json'
  import UsagePolicyCxDppDbp_v0_12_1 from '@/pages/modules/EclipseDataspaceConnector/data/policies/usage_policy_cx_dpp_dbp___tractus-x_edc_v0.12.1.json'
  import UsagePolicyCxDtr_v0_12_1 from '@/pages/modules/EclipseDataspaceConnector/data/policies/usage_policy_cx_dtr___tractus-x_edc_v0.12.1.json'
  import UsagePolicyCxPcf_v0_12_1 from '@/pages/modules/EclipseDataspaceConnector/data/policies/usage_policy_cx_pcf___tractus-x_edc_v0.12.1.json'
  import UsagePolicyRwXPush_v0_12_1 from '@/pages/modules/EclipseDataspaceConnector/data/policies/usage_policy_rwx_push___tractus-x_edc_v0.12.1.json'
  import { useEdcStore } from '@/pages/modules/EclipseDataspaceConnector/store/EdcStore'
  import { formatJSON } from '@/utils/JsonUtils'
  import { getPrismJsonLanguage } from '@/utils/prismJsonLanguage'

  const props = defineProps<{
    modelValue: boolean
  }>()

  const emit = defineEmits<{
    (event: 'update:model-value', value: boolean): void
    (event: 'policy-created', policyId: string): void
  }>()

  // Stores
  const edcStore = useEdcStore()

  // Composables
  const { createPolicyDefinition: createPolicyDefinitionInEdc } = useEdcClient()

  // Data
  const createPolicyDialog = ref(false)
  const selectedTemplate = ref<'access' | 'usage' | 'bpn' | ''>('')
  const form = ref<any>(null)
  const placeholderValues = ref<Record<string, string>>({})

  // Computed properties
  const isEdcV0_12_1 = computed(() => edcStore.getEdcType === 'Tractus-X EDC v0.12.1')

  // Policy Templates
  const policyTemplates = computed(() => [
    {
      value: 'access',
      name: 'Access Policy',
      description: 'Basic policy allowing usage with unrestricted access',
      policy: isEdcV0_12_1.value ? AccessPolicy_v0_12_1 : AccessPolicy_v0_9,
    },
    {
      value: 'usage',
      name: 'Usage Policy',
      description: 'Policy with permissions, prohibitions, and obligations for complex usage scenarios',
      policy: isEdcV0_12_1.value ? UsagePolicy_v0_12_1 : UsagePolicy_v0_9,
    },
    {
      value: 'usageCxPcf',
      name: 'Usage Policy for PCF Use Case (Catena-X)',
      description: 'Policy with permissions for the PCF Use Case (Catena-X)',
      policy: isEdcV0_12_1.value ? UsagePolicyCxPcf_v0_12_1 : null,
    },
    {
      value: 'usageCxDppDbp',
      name: 'Usage Policy for PCF DPP/DBP Use Case (Catena-X)',
      description: 'Policy with permissions for the DPP/DBP Use Case (Catena-X)',
      policy: isEdcV0_12_1.value ? UsagePolicyCxDppDbp_v0_12_1 : null,
    },
    {
      value: 'usageCxDtr',
      name: 'Usage Policy for Digital Twin Registry (Catena-X)',
      description: 'Policy with permissions for the Digital Twin Registry usage (Catena-X)',
      policy: isEdcV0_12_1.value ? UsagePolicyCxDtr_v0_12_1 : null,
    },
    {
      value: 'usageRwXPush',
      name: 'Usage Policy for Push Endpoint (Railway-X)',
      description: 'Policy with permissions for the Push Endpoint usage (Railway-X)',
      policy: isEdcV0_12_1.value ? UsagePolicyRwXPush_v0_12_1 : null,
    },
    {
      value: 'bpn',
      name: 'Access BPN Policy',
      description: 'Policy restricting access based on Business Partner Number (BPN) constraint',
      policy: isEdcV0_12_1.value ? AccessBpnPolicy_v0_12_1 : AccessBpnPolicy_v0_9,
    },
  ].filter(template => template.policy !== null))

  const placeholders = computed(() => {
    if (!selectedTemplate.value) return []

    const template = policyTemplates.value.find(t => t.value === selectedTemplate.value)
    if (!template) return []

    const policyStr = JSON.stringify(template.policy)
    const matches = policyStr.match(/\{\{([^}]+)\}\}/g) || []

    const placeholderList = matches.map(match => {
      const content = match.slice(2, -2) // Remove {{ and }}
      const parts = content.split('|')

      return {
        label: parts[0].trim(),
        placeholder: parts[1]?.trim() || parts[0].trim(),
        hint: parts[2]?.trim() || `Enter ${parts[0].trim()}`,
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

    const template = policyTemplates.value.find(t => t.value === selectedTemplate.value)
    if (!template) return ''

    try {
      let policyJson = JSON.stringify(template.policy)
      policyJson = replacePlaceholders(policyJson)

      const policy = JSON.parse(policyJson)
      const formatted = formatJSON(JSON.stringify(policy))

      if (Prism && Prism.highlight) {
        return Prism.highlight(formatted, getPrismJsonLanguage(), 'json')
      }
      return formatted
    } catch (error_) {
      console.error('Error highlighting JSON:', error_)
      return JSON.stringify(template.policy, null, 2)
    }
  })

  // Watchers
  watch(
    () => props.modelValue,
    value => {
      createPolicyDialog.value = value
      if (!value) {
        resetForm()
      }
    },
  )

  watch(
    () => createPolicyDialog.value,
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

  function allPlaceholdersFilled (): boolean {
    if (!selectedTemplate.value) return false
    return placeholders.value.every(placeholder => placeholderValues.value[placeholder.label])
  }

  function replacePlaceholders (policyJson: string): string {
    let result = policyJson
    for (const placeholder of placeholders.value) {
      const value = placeholderValues.value[placeholder.label] || `{{${placeholder.label}}}`
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

  async function createPolicy (): Promise<void> {
    if (!selectedTemplate.value || !allPlaceholdersFilled()) {
      console.warn('Template not selected or placeholders not filled')
      return
    }

    const template = policyTemplates.value.find(t => t.value === selectedTemplate.value)
    if (!template) {
      console.warn('Template not found')
      return
    }

    try {
      let policyJson = JSON.stringify(template.policy)
      policyJson = replacePlaceholders(policyJson)

      const finalPolicy = JSON.parse(policyJson) as PolicyDefinition

      // Create the policy via EDC API
      const response = await createPolicyDefinitionInEdc(finalPolicy)
      if (response) {
        emit('policy-created', response['@id'])
        createPolicyDialog.value = false
        resetForm()
      } else {
        console.error('Failed to create policy')
      }
    } catch (error_) {
      console.error('Error creating policy:', error_)
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
