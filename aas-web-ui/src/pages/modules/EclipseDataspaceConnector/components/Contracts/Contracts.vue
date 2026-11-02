<template>
  <EdcResourceTab
    ref="resourceTab"
    :create-actions="createActions"
    :delete="deleteContractDefinition"
    icon="mdi-file-sign"
    label="Contract"
    label-plural="Contracts"
    :query="queryFilteredContracts"
    :update="updateContractDefinition"
  >
    <template #filter>
      <v-select
        v-model="selectedContractFilter"
        density="compact"
        hide-details
        :items="contractFilterItems"
        label="Filter by Asset or Policy Type"
        variant="outlined"
      />
    </template>

    <template #dialogs="{ proxyId, onCreated }">
      <CreateContractDialog v-model="createContractDialog" :proxy-id="proxyId" @contract-created="onCreated" />
    </template>
  </EdcResourceTab>
</template>

<script lang="ts" setup>
  import type { CatenaXEdcContractDefinition } from '@/composables/Client/CatenaXEdcClient'
  import type { AssetTypeFilterPreset } from '@/pages/modules/EclipseDataspaceConnector/data/assetTypeFilters'
  import { useCatenaXEdcClient } from '@/composables/Client/CatenaXEdcClient'
  import CreateContractDialog from '@/pages/modules/EclipseDataspaceConnector/components/Contracts/Dialogs/CreateContractDialog.vue'
  import EdcResourceTab from '@/pages/modules/EclipseDataspaceConnector/components/Shared/EdcResourceTab.vue'
  import { useEdcAssetTypeQuery } from '@/pages/modules/EclipseDataspaceConnector/composables/EdcAssetTypeQuery'
  import { assetTypeFilterItems } from '@/pages/modules/EclipseDataspaceConnector/data/assetTypeFilters'
  import { EDC_NAMESPACE } from '@/pages/modules/EclipseDataspaceConnector/data/namespaces'

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

  // Data
  const resourceTab = useTemplateRef<InstanceType<typeof EdcResourceTab>>('resourceTab')
  const contracts = ref<CatenaXEdcContractDefinition[]>([]) // All contracts, before filtering
  const selectedContractFilter = ref<ContractFilter>(allContractsFilter)
  const createContractDialog = ref(false)

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

  async function queryFilteredContracts (proxyId: string): Promise<CatenaXEdcContractDefinition[] | null> {
    const loadedContracts = await queryContractDefinitions(proxyId)
    if (!loadedContracts) return null

    // The policy filter items are taken from all contracts
    contracts.value = loadedContracts

    const { type, value } = selectedContractFilter.value
    switch (type) {
      case 'assetType': {
        const assets = await queryAssetsOfType(proxyId, value)
        if (!assets) return null
        const assetIds = new Set(assets.map(asset => asset['@id']))
        return loadedContracts.filter(contract => selectsAnyAsset(contract, assetIds))
      }
      case 'accessPolicy':
      case 'usagePolicy': {
        const policyContracts = loadedContracts.filter(contract => policyIdOf[type](contract) === value)
        // Show all contracts again once no contract uses the policy anymore, e.g. after deleting the last one
        if (policyContracts.length === 0) {
          selectedContractFilter.value = allContractsFilter
          return loadedContracts
        }
        return policyContracts
      }
    }
    return loadedContracts
  }

  /**
   * Returns the filter items for the distinct policy IDs of the loaded contracts, sorted by ID.
   */
  function policyFilterItems (type: PolicyFilterType) {
    const policyIds = [...new Set(contracts.value.map(contract => policyIdOf[type](contract)).filter(Boolean))].toSorted()
    return policyIds.map(id => ({ title: id, value: { type, value: id } }))
  }

  /**
   * Returns whether the assets selector of the contract selects one of the given assets.
   * Only ID criteria (`=` and `in`) are resolved; an empty selector selects all assets.
   */
  function selectsAnyAsset (contract: CatenaXEdcContractDefinition, assetIds: Set<string | undefined>): boolean {
    // The EDC returns a single criterion as object, several as array
    const criteria = [contract.assetsSelector ?? []].flat()
    if (criteria.length === 0) return assetIds.size > 0

    return criteria
      .filter(criterion => [`${EDC_NAMESPACE}id`, 'edc:id', 'id'].includes(String(criterion.operandLeft)))
      .filter(criterion => ['=', 'in'].includes(String(criterion.operator)))
      .flatMap(criterion => [criterion.operandRight].flat())
      .some(assetId => assetIds.has(String(assetId)))
  }
</script>
