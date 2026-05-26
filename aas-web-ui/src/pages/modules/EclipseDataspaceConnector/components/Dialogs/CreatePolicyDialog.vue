<template>
  <v-dialog v-model="createPolicyDialog" :width="800">
    <v-sheet border rounded="lg">
      <v-card-title class="bg-cardHeader">
        Create Policy
      </v-card-title>

      <v-divider />

      <v-card-text class="overflow-y-auto" style="max-height: calc(100vh - 296px)">
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
                  <v-icon class="mr-2">mdi-file-document-outline</v-icon>
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
              :hint="placeholder.hint"
              :label="placeholder.label"
              persistent-hint
              :placeholder="placeholder.placeholder"
              required
              variant="outlined"
            />
          </div>

          <!-- Template Preview -->
          <div v-if="selectedTemplate" class="mt-4">
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
  import Prism from 'prismjs'
  import { type PolicyDefinition, useEdcClient } from '@/pages/modules/EclipseDataspaceConnector/composables/Client/EdcClient'
  import AccessBpnPolicy from '@/pages/modules/EclipseDataspaceConnector/data/policies/access_bpn_policy.json'
  import AccessPolicy from '@/pages/modules/EclipseDataspaceConnector/data/policies/access_policy.json'
  import UsagePolicy from '@/pages/modules/EclipseDataspaceConnector/data/policies/usage_policy.json'
  import { formatJSON } from '@/utils/JsonUtils'
  import { getPrismJsonLanguage } from '@/utils/prismJsonLanguage'

  const props = defineProps<{
    modelValue: boolean
  }>()

  const emit = defineEmits<{
    (event: 'update:modelValue', value: boolean): void
    (event: 'policy-created', policyId: string): void
  }>()

  // Composables
  const { createPolicyDefinition } = useEdcClient()

  // Data
  const createPolicyDialog = ref(false)
  const selectedTemplate = ref<'access' | 'usage' | 'bpn' | ''>('')
  const form = ref<any>(null)
  const placeholderValues = ref<Record<string, string>>({})

  // Policy Templates
  const policyTemplates = [
    {
      value: 'access',
      name: 'Access Policy',
      description: 'Basic policy allowing usage with unrestricted access',
      policy: AccessPolicy,
    },
    {
      value: 'usage',
      name: 'Usage Policy',
      description: 'Policy with permissions, prohibitions, and obligations for complex usage scenarios',
      policy: UsagePolicy,
    },
    {
      value: 'bpn',
      name: 'Access BPN Policy',
      description: 'Policy restricting access based on Business Partner Number (BPN) constraint',
      policy: AccessBpnPolicy,
    },
  ]

  // Computed properties
  const placeholders = computed(() => {
    if (!selectedTemplate.value) return []

    const template = policyTemplates.find(t => t.value === selectedTemplate.value)
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

    const template = policyTemplates.find(t => t.value === selectedTemplate.value)
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
      emit('update:modelValue', value)
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
      const value = placeholderValues.value[placeholder.label]
      result = result.replace(
        new RegExp(String.raw`\{\{[^}]*\}\}`, 'g'),
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

    const template = policyTemplates.find(t => t.value === selectedTemplate.value)
    if (!template) {
      console.warn('Template not found')
      return
    }

    try {
      let policyJson = JSON.stringify(template.policy)
      policyJson = replacePlaceholders(policyJson)

      const finalPolicy = JSON.parse(policyJson) as PolicyDefinition

      // Create the policy via EDC API
      const response = await createPolicyDefinition(finalPolicy)
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
