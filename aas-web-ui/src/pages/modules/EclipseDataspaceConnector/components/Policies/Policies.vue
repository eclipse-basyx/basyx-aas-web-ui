<template>
  <EdcResourceTab
    :create-actions="createActions"
    :delete="deletePolicyDefinition"
    icon="mdi-shield-check-outline"
    label="Policy"
    label-plural="Policies"
    :matches="matchesPolicyType"
    :query="queryPolicyDefinitions"
    :update="updatePolicyDefinition"
  >
    <template #filter>
      <v-select
        v-model="selectedPolicyType"
        density="compact"
        hide-details
        :items="policyTypeFilterItems"
        label="Filter by Policy Type"
        variant="outlined"
      />
    </template>

    <template #item-subtitle="{ item }">
      <span class="font-italic">{{ getPolicyType(item) }}</span>
    </template>

    <template #item-tooltip="{ item }">
      <!-- Type -->
      <div v-if="getPolicyType(item)" class="text-body-small mt-1">
        <span class="font-weight-bold">{{ 'Type: ' }}</span>
        {{ getPolicyType(item) + ' Policy' }}
      </div>
    </template>

    <template #dialogs="{ proxyId, onCreated }">
      <CreatePolicyDialog v-model="createPolicyDialog" :proxy-id="proxyId" @policy-created="onCreated" />
      <CreatePolicyFromTemplateDialog v-model="createPolicyFromTemplateDialog" :proxy-id="proxyId" @policy-created="onCreated" />
    </template>
  </EdcResourceTab>
</template>

<script lang="ts" setup>
  import { type CatenaXEdcPolicyDefinition, useCatenaXEdcClient } from '@/composables/Client/CatenaXEdcClient'
  import CreatePolicyDialog from '@/pages/modules/EclipseDataspaceConnector/components/Policies/Dialogs/CreatePolicyDialog.vue'
  import CreatePolicyFromTemplateDialog from '@/pages/modules/EclipseDataspaceConnector/components/Policies/Dialogs/CreatePolicyFromTemplateDialog.vue'
  import EdcResourceTab from '@/pages/modules/EclipseDataspaceConnector/components/Shared/EdcResourceTab.vue'

  // Composables
  const { deletePolicyDefinition, queryPolicyDefinitions, updatePolicyDefinition } = useCatenaXEdcClient()

  // Data
  const policyTypeFilterItems = ['All', 'Access', 'Usage']
  const selectedPolicyType = ref('All')
  const createPolicyDialog = ref(false)
  const createPolicyFromTemplateDialog = ref(false)

  const createActions = [
    { title: 'Create Policy', tooltip: 'Create a new Policy', onClick: () => (createPolicyDialog.value = true) },
    { title: 'Create Policy from Template', tooltip: 'Create a new Policy from Template', onClick: () => (createPolicyFromTemplateDialog.value = true) },
  ]

  function matchesPolicyType (policyDefinition: CatenaXEdcPolicyDefinition): boolean {
    return selectedPolicyType.value === 'All' || getPolicyType(policyDefinition) === selectedPolicyType.value
  }

  function getPolicyType (policyDefinition: CatenaXEdcPolicyDefinition): string {
    const permission = policyDefinition?.policy?.['odrl:permission'] ?? policyDefinition?.policy?.permission
    const action = permission?.['odrl:action'] ?? permission?.action
    const actionId = action?.['@id']

    if (!actionId)
      return ''

    switch (actionId) {
      case 'odrl:use':
      case 'use':
      {
        return 'Usage'
      }
      case 'odrl:access':
      case 'access':
      case 'cx-policy:access':
      {
        return 'Access'
      }
    }

    return ''
  }
</script>
