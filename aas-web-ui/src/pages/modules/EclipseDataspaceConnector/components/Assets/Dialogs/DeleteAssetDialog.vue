<template>
  <DeleteEdcResourceDialog
    v-model="deleteDialog"
    :delete="deleteAssetAndContracts"
    label="Asset"
    :loading="referencingContractsLoading"
    :proxy-id="proxyId"
    :resource="asset"
    @deleted="emit('deleted')"
  >
    <v-alert
      v-if="referencingContractsFailed"
      border="start"
      class="mt-3"
      color="warning"
      variant="tonal"
    >
      The contracts referencing this asset could not be checked. They are not deleted and would reference a missing asset.
    </v-alert>

    <v-alert
      v-else-if="referencingContracts.length > 0"
      border="start"
      class="mt-3"
      color="warning"
      variant="tonal"
    >
      <div class="font-weight-bold mb-1">
        The following contract{{ referencingContracts.length > 1 ? 's' : '' }} reference this asset and will be deleted first:
      </div>

      <v-list
        class="bg-transparent pa-0"
        density="compact"
      >
        <v-list-item
          v-for="contract in referencingContracts"
          :key="contract['@id']"
          class="pa-0"
        >
          <span class="font-weight-bold text-primary">{{ contract['@id'] }}</span>
        </v-list-item>
      </v-list>
    </v-alert>
  </DeleteEdcResourceDialog>
</template>

<script lang="ts" setup>
  import { type CatenaXEdcFailure, type CatenaXEdcResult, useCatenaXEdcClient } from '@/composables/Client/CatenaXEdcClient'
  import DeleteEdcResourceDialog from '@/pages/modules/EclipseDataspaceConnector/components/Shared/DeleteEdcResourceDialog.vue'
  import { namesAnyAsset } from '@/pages/modules/EclipseDataspaceConnector/composables/EdcAssetsSelector'
  import { queryAllEdcPages } from '@/pages/modules/EclipseDataspaceConnector/composables/EdcPaging'
  import { edcRequestFailureText } from '@/pages/modules/EclipseDataspaceConnector/composables/EdcRequestFailure'

  const props = withDefaults(defineProps<{
    asset: any
    proxyId?: string
  }>(), {
    proxyId: 'default',
  })

  const emit = defineEmits<{
    (event: 'deleted'): void
  }>()

  // Composables
  const { deleteAsset, queryContractDefinitions, deleteContractDefinition } = useCatenaXEdcClient()

  // Data
  const deleteDialog = defineModel<boolean>({ required: true })
  const referencingContracts = ref<any[]>([])
  const referencingContractsLoading = ref(false)
  const referencingContractsFailed = ref(false)

  // Watchers
  watch(
    () => deleteDialog.value,
    async value => {
      if (value) {
        await loadReferencingContracts()
      } else {
        referencingContracts.value = []
      }
    },
  )

  /**
   * Looks up the contracts naming the asset in their assets selector, among all contracts.
   * A contract with an empty selector selects all assets and is kept.
   */
  async function loadReferencingContracts (): Promise<void> {
    referencingContracts.value = []
    referencingContractsFailed.value = false
    if (!props.asset?.['@id']) return

    referencingContractsLoading.value = true
    const result = await queryAllEdcPages(querySpec => queryContractDefinitions(props.proxyId, { querySpec }))
    referencingContractsLoading.value = false

    if (!result.success) {
      referencingContractsFailed.value = true
      return
    }
    const assetIds = new Set<string | undefined>([props.asset['@id']])
    referencingContracts.value = result.data.filter(contract => namesAnyAsset(contract, assetIds))
  }

  async function deleteAssetAndContracts (proxyId: string, assetId: string): Promise<CatenaXEdcResult> {
    // Delete all referencing contracts first, keep the asset if one of them cannot be deleted
    const deletedContractIds: Array<string> = []
    for (const contract of referencingContracts.value) {
      const contractResult = await deleteContractDefinition(proxyId, contract['@id'])
      if (!contractResult.success) {
        const contractFailure = edcRequestFailureText(contractResult, 'Contract', 'delete')
        return keptAssetFailure(
          `The asset was kept, as the Contract ${contract['@id']} could not be deleted:\n${contractFailure}`,
          deletedContractIds,
        )
      }
      deletedContractIds.push(contract['@id'])
    }

    // Delete the asset via EDC API, e.g. an asset of a contract agreement cannot be deleted (409)
    const result = await deleteAsset(proxyId, assetId)
    return result.success ? result : keptAssetFailure(edcRequestFailureText(result, 'Asset', 'delete'), deletedContractIds)
  }

  // Shows the contracts still referencing the kept asset and names the already deleted ones in the details
  async function keptAssetFailure (details: string, deletedContractIds: Array<string>): Promise<CatenaXEdcFailure> {
    await loadReferencingContracts()
    const deletedContracts = deletedContractIds.length > 0
      ? `\n\nAlready deleted Contracts:\n${deletedContractIds.join('\n')}`
      : ''
    // Without a status, the dialog shows the details as they are
    return { success: false, details: details + deletedContracts }
  }
</script>
