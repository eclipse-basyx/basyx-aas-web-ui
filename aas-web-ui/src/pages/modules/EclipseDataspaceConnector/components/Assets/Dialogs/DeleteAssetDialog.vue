<template>
  <DeleteEdcResourceDialog
    v-model="deleteDialog"
    :delete="deleteAssetAndContracts"
    label="Asset"
    :proxy-id="proxyId"
    :resource="asset"
    @deleted="emit('deleted')"
  >
    <v-alert
      v-if="referencingContracts.length > 0"
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

  async function loadReferencingContracts (): Promise<void> {
    if (!props.asset?.['@id']) {
      referencingContracts.value = []
      return
    }

    const result = await queryContractDefinitions(props.proxyId)
    if (!result.success) {
      referencingContracts.value = []
      return
    }

    const assetId = props.asset['@id']
    const EDC_ID_OPERAND = 'https://w3id.org/edc/v0.0.1/ns/id'

    referencingContracts.value = result.data.filter((contract: any) => {
      const selector: any = contract['assetsSelector'] ?? contract['edc:assetsSelector'] ?? null
      if (selector) {
        const left = selector['operandLeft'] ?? selector['edc:operandLeft'] ?? ''
        const op = selector['operator'] ?? selector['edc:operator'] ?? ''
        const right = selector['operandRight'] ?? selector['edc:operandRight'] ?? ''
        return (left === EDC_ID_OPERAND || left === 'id') && op === '=' && right === assetId
      }
      return false
    })
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
