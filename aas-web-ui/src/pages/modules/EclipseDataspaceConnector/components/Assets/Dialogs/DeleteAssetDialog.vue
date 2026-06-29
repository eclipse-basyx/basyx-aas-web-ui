<template>
  <v-dialog v-model="deleteAssetDialog" :width="800">
    <v-sheet border rounded="lg">
      <v-card-title class="bg-cardHeader">
        Confirm Asset Deletion
      </v-card-title>

      <v-divider />

      <v-card-text class="overflow-y-auto" style="max-height: calc(100vh - 296px)">
        <v-alert border="start" variant="tonal">
          <span>Are you sure you want to delete the Asset with the id </span>
          <span class="text-primary font-weight-bold">{{ asset['@id'] }}</span>
          <span>?</span>
        </v-alert>

        <v-alert
          v-if="referencingContracts.length > 0"
          border="start"
          class="mt-3"
          color="warning"
          variant="tonal"
        >
          <div class="font-weight-bold mb-1">
            The following contract definition{{ referencingContracts.length > 1 ? 's' : '' }} reference this asset and will be deleted first:
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
      </v-card-text>

      <v-card-actions>
        <v-spacer />

        <v-btn
          rounded="lg"
          text="Cancel"
          @click="deleteAssetDialog = false"
        />

        <v-btn
          class="text-buttonText"
          color="primary"
          rounded="lg"
          text="Delete"
          variant="flat"
          @click="deleteAsset"
        />
      </v-card-actions>
    </v-sheet>
  </v-dialog>
</template>

<script lang="ts" setup>
  import { useEdcClient } from '@/pages/modules/EclipseDataspaceConnector/composables/Client/EdcClient'

  const props = defineProps<{
    modelValue: boolean
    asset: any
  }>()

  const emit = defineEmits<{
    (event: 'update:model-value' | 'asset-deleted', value: boolean): void
  }>()

  // Composables
  const { deleteAsset: deleteAssetFromEdc, queryContractDefinitions, deleteContractDefinition } = useEdcClient()

  // Data
  const deleteAssetDialog = ref(false)
  const referencingContracts = ref<any[]>([])

  // Watchers
  watch(
    () => props.modelValue,
    async value => {
      deleteAssetDialog.value = value
      if (value) {
        await loadReferencingContracts()
      }
    },
  )

  watch(
    () => deleteAssetDialog.value,
    value => {
      emit('update:model-value', value)
      if (!value) {
        referencingContracts.value = []
      }
    },
  )

  async function loadReferencingContracts (): Promise<void> {
    if (!props.asset?.['@id']) {
      referencingContracts.value = []
      return
    }

    const contracts = await queryContractDefinitions()
    if (!contracts) {
      referencingContracts.value = []
      return
    }

    const assetId = props.asset['@id']
    const EDC_ID_OPERAND = 'https://w3id.org/edc/v0.0.1/ns/id'

    referencingContracts.value = contracts.filter((contract: any) => {
      const selectors: any[] = contract['assetsSelector'] ?? contract['edc:assetsSelector'] ?? []
      return selectors.some((criterion: any) => {
        const left = criterion['operandLeft'] ?? criterion['edc:operandLeft'] ?? ''
        const op = criterion['operator'] ?? criterion['edc:operator'] ?? ''
        const right = criterion['operandRight'] ?? criterion['edc:operandRight'] ?? ''
        return (left === EDC_ID_OPERAND || left === 'id') && op === '=' && right === assetId
      })
    })
  }

  async function deleteAsset (): Promise<void> {
    if (!props.asset) {
      return
    }

    try {
      // Delete all referencing contract definitions first
      for (const contract of referencingContracts.value) {
        const contractDeleted = await deleteContractDefinition(contract['@id'])
        if (!contractDeleted) {
          console.error('Failed to delete referencing contract:', contract['@id'])
        }
      }

      // Delete the asset via EDC API
      const response = await deleteAssetFromEdc(props.asset['@id'])
      if (response) {
        emit('asset-deleted', true)
        deleteAssetDialog.value = false
      } else {
        console.error('Failed to delete asset')
      }
    } catch (error_) {
      console.error('Error deleting asset:', error_)
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
