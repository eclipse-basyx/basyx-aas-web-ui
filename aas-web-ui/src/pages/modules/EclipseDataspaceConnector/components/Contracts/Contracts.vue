<template>
  <EdcResourceTab
    ref="resourceTab"
    :create-actions="createActions"
    :delete="deleteContractDefinition"
    icon="mdi-file-sign"
    label="Contract"
    label-plural="Contracts"
    :query-page="queryFilteredContracts"
    :update="updateContractDefinition"
  >
    <template #filter>
      <v-select
        v-model="selectedContractFilter"
        density="compact"
        hide-details
        :items="contractFilterItems"
        label="Filter by Asset or Policy Type"
        :loading="policyFilterItemsLoading"
        variant="outlined"
        @update:menu="open => open && loadPolicyFilterItems()"
      />
    </template>

    <template #dialogs="{ proxyId, onCreated }">
      <CreateContractDialog v-model="createContractDialog" :proxy-id="proxyId" @contract-created="onCreated" />
    </template>
  </EdcResourceTab>
</template>

<script lang="ts" setup>
  import type { CatenaXEdcContractDefinition, CatenaXEdcQuerySpec } from '@/composables/Client/CatenaXEdcClient'
  import type { AssetTypeFilterPreset } from '@/pages/modules/EclipseDataspaceConnector/data/assetTypeFilters'
  import { useCatenaXEdcClient } from '@/composables/Client/CatenaXEdcClient'
  import CreateContractDialog from '@/pages/modules/EclipseDataspaceConnector/components/Contracts/Dialogs/CreateContractDialog.vue'
  import EdcResourceTab from '@/pages/modules/EclipseDataspaceConnector/components/Shared/EdcResourceTab.vue'
  import { selectsAnyAsset } from '@/pages/modules/EclipseDataspaceConnector/composables/EdcAssetsSelector'
  import { useEdcAssetTypeQuery } from '@/pages/modules/EclipseDataspaceConnector/composables/EdcAssetTypeQuery'
  import { useEdcDialogRoute } from '@/pages/modules/EclipseDataspaceConnector/composables/EdcDialogRoute'
  import {
    type EdcListPage,
    type EdcPageResult,
    queryAllEdcPages,
    queryEdcPage,
  } from '@/pages/modules/EclipseDataspaceConnector/composables/EdcPaging'
  import { assetTypeFilterItems } from '@/pages/modules/EclipseDataspaceConnector/data/assetTypeFilters'

  // Filters by an asset type preset or by the ID of the access or usage policy of the contracts
  interface ContractFilter {
    type: 'all' | 'assetType' | 'accessPolicy' | 'usagePolicy'
    value: string
  }

  type PolicyFilterType = Exclude<ContractFilter['type'], 'all' | 'assetType'>

  const allContractsFilter: ContractFilter = { type: 'all', value: '' }

  const policyIdOf: Record<PolicyFilterType, (contract: CatenaXEdcContractDefinition) => string> = {
    accessPolicy: contract => contract.accessPolicyId,
    usagePolicy: contract => contract.contractPolicyId,
  }

  // Composables
  const { deleteContractDefinition, queryContractDefinitions, updateContractDefinition } = useCatenaXEdcClient()
  const { queryAssetsOfType } = useEdcAssetTypeQuery()
  const { dialogOpen } = useEdcDialogRoute()

  // Data
  const resourceTab = useTemplateRef<InstanceType<typeof EdcResourceTab>>('resourceTab')
  const contracts = ref<CatenaXEdcContractDefinition[]>([]) // All contracts, for the policy filter items
  const policyFilterItemsLoading = ref(false)
  let listProxyId = 'default' // Proxy of the list, for the policy filter items
  const selectedContractFilter = ref<ContractFilter>(allContractsFilter)
  const createContractDialog = dialogOpen('create-contract') // The open dialog is kept in the URL, e.g. to return to it after a login

  const createActions = [
    { title: 'Create Contract', tooltip: 'Create a new Contract', onClick: () => (createContractDialog.value = true) },
  ]

  // Computed properties
  const contractFilterItems = computed(() => [
    { title: 'All', value: allContractsFilter },
    { type: 'subheader', title: 'Asset Type' },
    ...assetTypeFilterItems
      .filter((item): item is AssetTypeFilterPreset => 'value' in item && item.value !== 'all')
      .map(item => ({ title: item.title, value: { type: 'assetType', value: item.value } })),
    { type: 'subheader', title: 'Access Policy' },
    ...policyFilterItems('accessPolicy'),
    { type: 'subheader', title: 'Usage Policy' },
    ...policyFilterItems('usagePolicy'),
  ])

  // Watchers
  watch(selectedContractFilter, () => {
    resourceTab.value?.loadResources()
  })

  /**
   * Queries a page of the contracts. A filter is evaluated in the browser, so it returns all matching contracts at once.
   */
  async function queryFilteredContracts (proxyId: string, page: EdcListPage): Promise<EdcPageResult<CatenaXEdcContractDefinition>> {
    listProxyId = proxyId
    const query = (querySpec: CatenaXEdcQuerySpec) => queryContractDefinitions(proxyId, { querySpec })
    const { type, value } = selectedContractFilter.value
    if (type === 'all') {
      return queryEdcPage(query, page)
    }

    const contractsResult = await queryAllEdcPages(query, { search: page.search })
    if (!contractsResult.success) return contractsResult
    const loadedContracts = contractsResult.data

    switch (type) {
      case 'assetType': {
        const assetsResult = await queryAssetsOfType(proxyId, value)
        if (!assetsResult.success) return assetsResult
        const assetIds = new Set(assetsResult.data.map(asset => asset['@id']))
        return { success: true, data: loadedContracts.filter(contract => selectsAnyAsset(contract, assetIds)), hasMore: false }
      }
      case 'accessPolicy':
      case 'usagePolicy': {
        const policyContracts = loadedContracts.filter(contract => policyIdOf[type](contract) === value)
        // Show all contracts again once no contract uses the policy anymore, e.g. after deleting the last one;
        // the changed filter reloads the list
        if (policyContracts.length === 0 && !page.search) {
          selectedContractFilter.value = allContractsFilter
        }
        return { success: true, data: policyContracts, hasMore: false }
      }
    }
    return contractsResult
  }

  // The policy filter items are taken from all contracts, loaded when the filter menu opens
  async function loadPolicyFilterItems (): Promise<void> {
    policyFilterItemsLoading.value = true
    const result = await queryAllEdcPages(querySpec => queryContractDefinitions(listProxyId, { querySpec }))
    contracts.value = result.success ? result.data : []
    policyFilterItemsLoading.value = false
  }

  /**
   * Returns the filter items for the distinct policy IDs of the loaded contracts, sorted by ID.
   */
  function policyFilterItems (type: PolicyFilterType) {
    const policyIds = [...new Set(contracts.value.map(contract => policyIdOf[type](contract)).filter(Boolean))].toSorted()
    return policyIds.map(id => ({ title: id, value: { type, value: id } }))
  }
</script>
