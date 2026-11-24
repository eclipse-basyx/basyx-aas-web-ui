<template>
  <v-dialog v-model="createPolicyDialog" max-height="90%" :width="800">
    <v-sheet border class="d-flex flex-column" height="100%" rounded="lg">
      <v-card-title class="bg-cardHeader">
        Create Policy from Template
      </v-card-title>

      <v-divider />

      <v-card-text class="flex-grow-1 overflow-y-auto">
        <v-form ref="form" class="d-flex flex-column">

          <!-- Template Selection -->
          <EdcTemplateSelect
            v-model="selectedTemplate"
            icon="mdi-shield-check-outline"
            label="Select Policy Template"
            :templates="policyTemplates"
          />

          <!-- Dynamic Placeholder Fields -->
          <EdcTemplatePlaceholderFields
            v-if="selectedTemplate"
            v-model="placeholderValues"
            class="mt-4"
            :placeholders="placeholders"
          />

          <!-- Policy Preview -->
          <JSONPreview
            v-if="selectedTemplate"
            class="mt-4"
            download-file-name="policy"
            height="auto"
            icon="mdi-shield-check-outline"
            :json-content="jsonContent"
            title="Policy"
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
  }>(), {
    proxyId: 'default',
  })

  const emit = defineEmits<{
    (event: 'policy-created', policyId: string): void
  }>()

  type PolicyTemplateValue = 'access' | 'usage' | 'usageCxPcf' | 'usageCxDppDbp' | 'usageCxDtr' | 'usageCxSmService' | 'bpn'

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

  // Composables
  const { createPolicyDefinition: createPolicyDefinitionInEdc } = useCatenaXEdcClient()
  const {
    selectedTemplate,
    placeholderValues,
    form,
    activeTemplate,
    resetForm,
    createFromTemplate,
  } = useEdcTemplateForm('Policy', policyTemplates)

  // Data
  const createPolicyDialog = defineModel<boolean>({ required: true })

  // Computed properties
  const placeholders = computed(() => activeTemplate.value
    ? templatePlaceholders(activeTemplate.value.template).map(placeholder => ({
      ...placeholder,
      placeholder: placeholder.placeholder || placeholder.label,
      hint: placeholder.hint || `Enter ${placeholder.label}`,
    }))
    : [])

  // Unfilled placeholders stay visible in the preview as {{Label}}
  const jsonContent = computed(() => activeTemplate.value
    ? JSON.stringify(fillTemplatePlaceholders(activeTemplate.value.template, placeholderValues.value, { keepUnfilled: true }))
    : '')

  // Watchers
  watch(
    () => createPolicyDialog.value,
    value => {
      if (!value) {
        resetForm()
      }
    },
  )

  // Methods
  function allPlaceholdersFilled (): boolean {
    if (!selectedTemplate.value) return false
    return placeholders.value.every(placeholder => placeholderValues.value[placeholder.label])
  }

  async function createPolicy (): Promise<void> {
    if (!allPlaceholdersFilled()) {
      console.warn('Template not selected or placeholders not filled')
      return
    }

    // Create the policy via EDC API
    const policyId = await createFromTemplate(template => createPolicyDefinitionInEdc(
      props.proxyId,
      fillTemplatePlaceholders(template, placeholderValues.value) as CatenaXEdcPolicyDefinition,
    ))
    if (policyId) {
      emit('policy-created', policyId)
      createPolicyDialog.value = false
    }
  }

</script>
