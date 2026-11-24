<template>
  <v-dialog
    v-model="createPolicyDialog"
    max-height="90%"
    width="800px"
  >
    <v-sheet border class="d-flex flex-column" height="100%" rounded="lg">
      <v-card-title class="bg-cardHeader d-flex align-center">
        Create Policy

        <v-spacer />

        <v-btn
          v-tooltip="'Open Catena-X Policy Builder'"
          color="text-medium-emphasis"
          href="https://eclipse-tractusx.github.io/tractusx-edc-dashboard/policy-builder/"
          icon
          rel="noopener noreferrer"
          size="small"
          target="_blank"
          variant="text"
        >
          <v-icon icon="mdi-information-outline" />
        </v-btn>
      </v-card-title>

      <v-divider />

      <v-card-text class="flex-grow-1 overflow-y-auto">
        <v-form ref="form" class="d-flex flex-column">

          <!-- Policy Type Selection -->
          <v-select
            v-model="selectedType"
            :disabled="manuallyEdited"
            :hint="selectedPolicyTypeDescription"
            item-title="name"
            item-value="value"
            :items="policyTypes"
            label="Select Policy Type"
            persistent-hint
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
          <div class="d-flex flex-column pt-2">
            <v-text-field
              v-for="(placeholder, index) in placeholders"
              :key="placeholder.label"
              v-model="placeholderValues[placeholder.label]"
              :class="index > 0 ? 'mt-2': ''"
              :disabled="manuallyEdited"
              :hide-details="placeholder.hint == ''"
              :hint="placeholder.hint"
              :label="placeholder.label"
              :persistent-hint="placeholder.hint !== ''"
              :placeholder="placeholder.placeholder"
              required
              variant="outlined"
            />
          </div>

          <!-- After editing the policy by hand, the fields above no longer change it -->
          <v-alert
            v-if="manuallyEdited"
            class="mt-4"
            density="compact"
            type="info"
            variant="tonal"
          >
            The policy was edited by hand, so the fields above no longer change it.

            <template #append>
              <v-btn size="small" text="Reset to Template" variant="text" @click="resetToTemplate" />
            </template>
          </v-alert>

          <v-alert
            v-if="jsonError"
            class="mt-4"
            density="compact"
            :text="jsonError"
            type="error"
            variant="tonal"
          />

          <!-- Policy, editable; only an edit by hand emits update:text, a policy rebuilt from the fields doesn't -->
          <CodeViewer
            class="mt-4"
            file-name="policy.json"
            height="auto"
            icon="mdi-shield-check-outline"
            :invalid="!!jsonError"
            :read-only="false"
            :text="jsonText"
            title="Policy"
            @update:text="onEditorInput"
          />
        </v-form>
      </v-card-text>

      <v-divider />

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
          :disabled="hasUnfilledPlaceholders || !!jsonError || !jsonText.trim()"
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
  import { type CatenaXEdcPolicyDefinition, useCatenaXEdcClient } from '@/composables/Client/CatenaXEdcClient'
  import {
    edcRequestFailureText,
    useEdcRequestFailureMessage,
  } from '@/pages/modules/EclipseDataspaceConnector/composables/EdcRequestFailure'
  import { fillTemplatePlaceholders, templatePlaceholders } from '@/pages/modules/EclipseDataspaceConnector/composables/EdcTemplatePlaceholders'
  import PolicyTemplate from '@/pages/modules/EclipseDataspaceConnector/data/templates/template_policy.json'
  import UsagePolicyTemplate from '@/pages/modules/EclipseDataspaceConnector/data/templates/template_policy_usage.json'

  const props = withDefaults(defineProps<{
    proxyId?: string
  }>(), {
    proxyId: 'default',
  })

  const emit = defineEmits<{
    (event: 'policy-created', policyId: string): void
  }>()

  // Composables
  const { createPolicyDefinition: createPolicyDefinitionInEdc } = useCatenaXEdcClient()
  const { showFailureMessage } = useEdcRequestFailureMessage()

  // Data
  const createPolicyDialog = defineModel<boolean>({ required: true })
  const selectedType = ref<'access' | 'usage'>('usage')
  const form = ref<any>(null)
  const placeholderValues = ref<Record<string, string>>({})
  const jsonText = ref('')
  const jsonError = ref<string | null>(null)
  const manuallyEdited = ref(false) // The policy was edited in the editor, the fields no longer rebuild it

  // Computed properties
  const policyTypes = computed(() => [
    {
      value: 'access',
      name: 'Access Policy',
      description: 'Determines whether a particular consumer is offered an asset or not.',
    },
    {
      value: 'usage',
      name: 'Usage Policy',
      description: 'Determines the conditions for initiating a contract negotiation for a particular asset.',
    },
  ])

  const selectedPolicyTypeDescription = computed(() => {
    return policyTypes.value.find(policyType => policyType.value === selectedType.value)?.description || ''
  })

  // Unfilled placeholders stay in the editor as {{Label}}, also after editing by hand
  const hasUnfilledPlaceholders = computed(() => /\{\{[^}]+\}\}/.test(jsonText.value))

  const placeholders = computed(() => templatePlaceholders(PolicyTemplate).map(placeholder => ({
    ...placeholder,
    placeholder: placeholder.placeholder || placeholder.label,
    hint: placeholder.hint || `Enter ${placeholder.label}`,
  })))

  // Watchers
  // Immediate, so a dialog restored from the URL shows the preview
  watch(
    () => createPolicyDialog.value,
    value => {
      if (value) {
        refreshPreview()
      } else {
        resetForm()
      }
    },
    { immediate: true },
  )

  watch(
    () => selectedType.value,
    () => refreshPreviewFromFields(),
  )

  watch(
    placeholderValues,
    () => refreshPreviewFromFields(),
    { deep: true },
  )

  // Methods
  function resetForm (): void {
    manuallyEdited.value = false
    placeholderValues.value = {}
    jsonText.value = ''
    jsonError.value = null
    if (form.value) {
      form.value.reset()
    }
  }

  // Field changes rebuild the preview only until the policy is edited by hand, so manual changes are kept
  function refreshPreviewFromFields (): void {
    if (!manuallyEdited.value) {
      refreshPreview()
    }
  }

  // Discards the manual changes, the fields rebuild the policy again
  function resetToTemplate (): void {
    manuallyEdited.value = false
    refreshPreview()
  }

  function buildPolicy (): CatenaXEdcPolicyDefinition {
    // Unfilled placeholders stay visible in the editor as {{Label}}
    const policy = fillTemplatePlaceholders(PolicyTemplate, placeholderValues.value, { keepUnfilled: true }) as CatenaXEdcPolicyDefinition

    if (policy.policy) {
      if (selectedType.value === 'access') {
        (policy.policy as any).permission = [
          {
            action: 'access',
            constraint: [],
          },
        ]
      } else if (selectedType.value === 'usage') {
        // Catena-X requires the constraints of the usage policy template, e.g. UsagePurpose and FrameworkAgreement
        (policy.policy as any).permission = structuredClone(UsagePolicyTemplate.policy.permission)
      }
    }

    return policy
  }

  function refreshPreview (): void {
    try {
      const policy = buildPolicy()
      jsonText.value = JSON.stringify(policy, null, 2)
      jsonError.value = null
    } catch (error_) {
      jsonText.value = JSON.stringify(PolicyTemplate, null, 2)
      jsonError.value = error_ instanceof Error ? error_.message : 'Invalid JSON'
    }
  }

  // Called only for an edit by hand, so the fields no longer rebuild the policy
  function onEditorInput (value: string): void {
    jsonText.value = value
    manuallyEdited.value = true

    try {
      JSON.parse(value)
      jsonError.value = null
    } catch (error_) {
      jsonError.value = error_ instanceof Error ? error_.message : 'Invalid JSON'
    }
  }

  async function createPolicy (): Promise<void> {
    if (jsonError.value || !jsonText.value.trim()) return

    try {
      const finalPolicy = JSON.parse(jsonText.value) as CatenaXEdcPolicyDefinition

      // Create the policy via EDC API
      const result = await createPolicyDefinitionInEdc(props.proxyId, finalPolicy)
      if (result.success) {
        emit('policy-created', result.data['@id'])
        createPolicyDialog.value = false
        resetForm()
      } else {
        showFailureMessage('Failed to create Policy.', edcRequestFailureText(result, 'Policy', 'create'))
      }
    } catch (error_) {
      console.error('Error creating policy:', error_)
      jsonError.value = error_ instanceof Error ? error_.message : 'Invalid JSON'
    }
  }

</script>
