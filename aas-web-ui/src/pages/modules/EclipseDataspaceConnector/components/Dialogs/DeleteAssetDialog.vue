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
    (event: 'update:modelValue' | 'asset-deleted', value: boolean): void
  }>()

  // Composables
  const { deleteAsset: deleteAssetFromEdc } = useEdcClient()

  // Data
  const deleteAssetDialog = ref(false)

  // Watchers
  watch(
    () => props.modelValue,
    value => {
      deleteAssetDialog.value = value
    },
  )

  watch(
    () => deleteAssetDialog.value,
    value => {
      emit('update:modelValue', value)
    },
  )

  async function deleteAsset (): Promise<void> {
    if (!props.asset) {
      return
    }

    try {
      // Create the asset via EDC API
      const response = await deleteAssetFromEdc(props.asset['@id'])
      if (response) {
        emit('asset-deleted', true)
        deleteAssetDialog.value = false
      } else {
        console.error('Failed to delete asset')
      }
    } catch (error_) {
      console.error('Error creating asset:', error_)
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
