<template>
  <v-dialog
    v-model="createPolicyDialog"
    max-height="90%"
    width="800px"
  >
    <v-sheet border class="d-flex flex-column" height="100%" rounded="lg">
      <v-card-title class="bg-cardHeader d-flex align-center">
        {{ fromTemplate ? 'Create Policy from Template' : 'Create Policy' }}

        <v-spacer />

        <v-btn
          v-tooltip="{ text: 'Open Catena-X Policy Builder', openDelay: 600 }"
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

          <!-- Template Selection, without template selection one of the policy types -->
          <EdcTemplateSelect
            v-model="selectedTemplate"
            :disabled="manuallyEdited"
            icon="mdi-shield-check-outline"
            :label="fromTemplate ? 'Select Policy Template' : 'Select Policy Type'"
            show-description
            :templates="templates"
          />

          <!-- Dynamic Placeholder Fields -->
          <EdcTemplatePlaceholderFields
            v-if="activeTemplate"
            v-model="placeholderValues"
            class="pt-2"
            :disabled="manuallyEdited"
            :placeholders="placeholders"
          />

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
            v-if="activeTemplate"
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
          :disabled="!canCreate"
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
  import EdcTemplatePlaceholderFields from '@/pages/modules/EclipseDataspaceConnector/components/Shared/EdcTemplatePlaceholderFields.vue'
  import EdcTemplateSelect from '@/pages/modules/EclipseDataspaceConnector/components/Shared/EdcTemplateSelect.vue'
  import { type EdcTemplate, useEdcTemplateForm } from '@/pages/modules/EclipseDataspaceConnector/composables/EdcTemplateForm'
  import { fillTemplatePlaceholders, templatePlaceholders } from '@/pages/modules/EclipseDataspaceConnector/composables/EdcTemplatePlaceholders'
  import AccessPolicy from '@/pages/modules/EclipseDataspaceConnector/data/templates/template_policy_access.json'
  import AccessPolicyBpn from '@/pages/modules/EclipseDataspaceConnector/data/templates/template_policy_access_bpn.json'
  import UsagePolicy from '@/pages/modules/EclipseDataspaceConnector/data/templates/template_policy_usage.json'
  import UsagePolicyDtr from '@/pages/modules/EclipseDataspaceConnector/data/templates/template_policy_usage_digitaltwin_registry.json'
  import UsagePolicyDppDbp from '@/pages/modules/EclipseDataspaceConnector/data/templates/template_policy_usage_dpp_dbp.json'
  import UsagePolicyPcf from '@/pages/modules/EclipseDataspaceConnector/data/templates/template_policy_usage_pcf.json'
  import UsagePolicySmService from '@/pages/modules/EclipseDataspaceConnector/data/templates/template_policy_usage_sm_service.json'

  const props = withDefaults(defineProps<{
    proxyId?: string
    fromTemplate?: boolean // Lets the user choose from all templates, otherwise from the access and usage policy types
  }>(), {
    proxyId: 'default',
    fromTemplate: false,
  })

  const emit = defineEmits<{
    (event: 'policy-created', policyId: string): void
  }>()

  type PolicyTemplateValue = 'access' | 'usage' | 'usageCxPcf' | 'usageCxDppDbp' | 'usageCxDtr' | 'usageCxSmService' | 'bpn'

  // Catena-X requires the constraints of the usage policy template, e.g. UsagePurpose and FrameworkAgreement
  const policyTypes: EdcTemplate<PolicyTemplateValue>[] = [
    {
      value: 'access',
      name: 'Access Policy',
      description: 'Determines whether a particular consumer is offered an asset or not.',
      template: AccessPolicy,
    },
    {
      value: 'usage',
      name: 'Usage Policy',
      description: 'Determines the conditions for initiating a contract negotiation for a particular asset.',
      template: UsagePolicy,
    },
  ]

  const policyTemplates: EdcTemplate<PolicyTemplateValue>[] = [
    {
      value: 'access',
      name: 'Access Policy',
      description: 'Basic policy allowing usage with unrestricted access',
      template: AccessPolicy,
    },
    {
      value: 'usage',
      name: 'Usage Policy',
      description: 'Policy with permissions, prohibitions, and obligations for complex usage scenarios',
      template: UsagePolicy,
    },
    {
      value: 'usageCxPcf',
      name: 'Usage Policy for PCF Use Case (Catena-X)',
      description: 'Policy with permissions for the PCF Use Case (Catena-X)',
      template: UsagePolicyPcf,
    },
    {
      value: 'usageCxDppDbp',
      name: 'Usage Policy for PCF DPP/DBP Use Case (Catena-X)',
      description: 'Policy with permissions for the DPP/DBP Use Case (Catena-X)',
      template: UsagePolicyDppDbp,
    },
    {
      value: 'usageCxDtr',
      name: 'Usage Policy for Digital Twin Registry (Catena-X)',
      description: 'Policy with permissions for the Digital Twin Registry usage (Catena-X)',
      template: UsagePolicyDtr,
    },
    {
      value: 'usageCxSmService',
      name: 'Usage Policy for Submodel Service (Catena-X)',
      description: 'Policy with permissions for the Submodel Service usage (Catena-X)',
      template: UsagePolicySmService,
    },
    {
      value: 'bpn',
      name: 'Access BPN Policy',
      description: 'Policy restricting access based on Business Partner Number (BPN) constraint',
      template: AccessPolicyBpn,
    },
  ]

  const templates = props.fromTemplate ? policyTemplates : policyTypes

  // Composables
  const { createPolicyDefinition: createPolicyDefinitionInEdc } = useCatenaXEdcClient()
  const {
    selectedTemplate,
    placeholderValues,
    form,
    activeTemplate,
    resetForm: resetTemplateForm,
    createFromTemplate,
  } = useEdcTemplateForm('Policy', templates, props.fromTemplate ? '' : 'usage')

  // Data
  const createPolicyDialog = defineModel<boolean>({ required: true })
  const jsonText = ref('')
  const jsonError = ref<string | null>(null)
  const manuallyEdited = ref(false) // The policy was edited in the editor, the fields no longer rebuild it

  // Computed properties
  const placeholders = computed(() => activeTemplate.value
    ? templatePlaceholders(activeTemplate.value.template).map(placeholder => ({
      ...placeholder,
      placeholder: placeholder.placeholder || placeholder.label,
      hint: placeholder.hint || `Enter ${placeholder.label}`,
    }))
    : [])

  // Unfilled placeholders stay in the editor as {{Label}}, also after editing by hand
  const hasUnfilledPlaceholders = computed(() => /\{\{[^}]+\}\}/.test(jsonText.value))

  const canCreate = computed(() => !!activeTemplate.value && !hasUnfilledPlaceholders.value && !jsonError.value && !!jsonText.value.trim())

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
    [activeTemplate, placeholderValues],
    () => refreshPreviewFromFields(),
    { deep: true },
  )

  // Methods
  function resetForm (): void {
    manuallyEdited.value = false
    resetTemplateForm()
    jsonText.value = ''
    jsonError.value = null
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

  // Unfilled placeholders stay visible in the editor as {{Label}}
  function refreshPreview (): void {
    jsonText.value = activeTemplate.value
      ? JSON.stringify(fillTemplatePlaceholders(activeTemplate.value.template, placeholderValues.value, { keepUnfilled: true }), null, 2)
      : ''
    jsonError.value = null
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
    if (!canCreate.value) return

    // Create the policy via EDC API, from the editor as it may be edited by hand
    const policyId = await createFromTemplate(() => createPolicyDefinitionInEdc(
      props.proxyId,
      JSON.parse(jsonText.value) as CatenaXEdcPolicyDefinition,
    ))
    if (policyId) {
      emit('policy-created', policyId)
      createPolicyDialog.value = false
    }
  }

</script>
