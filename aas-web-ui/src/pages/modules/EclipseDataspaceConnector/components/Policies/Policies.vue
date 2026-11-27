<template>
  <EdcResourceTab
    ref="resourceTab"
    :create-actions="createActions"
    :delete="deletePolicyDefinition"
    icon="mdi-shield-check-outline"
    label="Policy"
    label-plural="Policies"
    :query-page="queryPolicyPage"
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
      <span class="font-italic">{{ edcPolicyTypeLabel(item) }}</span>
    </template>

    <template #item-tooltip="{ item }">
      <!-- Type -->
      <div v-if="edcPolicyTypeLabel(item)" class="text-body-small mt-1">
        <span class="font-weight-bold">{{ 'Type: ' }}</span>
        {{ `${edcPolicyTypeLabel(item)} Policy` }}
      </div>
    </template>

    <template #dialogs="{ proxyId, onCreated }">
      <CreatePolicyDialog v-model="createPolicyDialog" :proxy-id="proxyId" @policy-created="onCreated" />
      <CreatePolicyDialog v-model="createPolicyFromTemplateDialog" from-template :proxy-id="proxyId" @policy-created="onCreated" />
    </template>
  </EdcResourceTab>
</template>

<script lang="ts" setup>
  import { type CatenaXEdcPolicyDefinition, useCatenaXEdcClient } from '@/composables/Client/CatenaXEdcClient'
  import CreatePolicyDialog from '@/pages/modules/EclipseDataspaceConnector/components/Policies/Dialogs/CreatePolicyDialog.vue'
  import EdcResourceTab from '@/pages/modules/EclipseDataspaceConnector/components/Shared/EdcResourceTab.vue'
  import { useEdcDialogRoute } from '@/pages/modules/EclipseDataspaceConnector/composables/EdcDialogRoute'
  import {
    type EdcListPage,
    type EdcPageResult,
    queryAllEdcPages,
    queryEdcPage,
  } from '@/pages/modules/EclipseDataspaceConnector/composables/EdcPaging'
  import {
    type EdcPolicyType,
    edcPolicyTypeLabel,
    edcPolicyTypes,
  } from '@/pages/modules/EclipseDataspaceConnector/composables/EdcPolicyType'

  // Composables
  const { deletePolicyDefinition, queryPolicyDefinitions, updatePolicyDefinition } = useCatenaXEdcClient()
  const { dialogOpen } = useEdcDialogRoute()

  // Data
  const resourceTab = useTemplateRef<InstanceType<typeof EdcResourceTab>>('resourceTab')
  const policyTypeFilterItems = ['All', 'Access', 'Usage']
  const selectedPolicyType = ref<'All' | EdcPolicyType>('All')
  // The open dialog is kept in the URL, e.g. to return to it after a login
  const createPolicyDialog = dialogOpen('create-policy')
  const createPolicyFromTemplateDialog = dialogOpen('create-policy-from-template')

  const createActions = [
    { title: 'Create Policy', tooltip: 'Create a new Policy', onClick: () => (createPolicyDialog.value = true) },
    { title: 'Create Policy from Template', tooltip: 'Create a new Policy from Template', onClick: () => (createPolicyFromTemplateDialog.value = true) },
  ]

  // Watchers
  watch(selectedPolicyType, () => {
    resourceTab.value?.loadResources()
  })

  /**
   * Queries a page of the policies. The type is derived from the permission in the browser,
   * so a type filter returns all policies of the type at once.
   */
  async function queryPolicyPage (proxyId: string, page: EdcListPage): Promise<EdcPageResult<CatenaXEdcPolicyDefinition>> {
    const query = (querySpec: Record<string, unknown>) => queryPolicyDefinitions(proxyId, { querySpec })
    const policyType = selectedPolicyType.value
    if (policyType === 'All') {
      return queryEdcPage(query, page)
    }

    const result = await queryAllEdcPages(query, { search: page.search })
    return result.success
      ? { success: true, data: result.data.filter(policy => edcPolicyTypes(policy).includes(policyType)), hasMore: false }
      : result
  }
</script>
