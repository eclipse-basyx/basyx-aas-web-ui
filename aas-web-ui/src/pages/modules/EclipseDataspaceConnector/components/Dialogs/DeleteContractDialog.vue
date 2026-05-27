<template>
  <v-dialog v-model="deleteContractDialog" :width="800">
    <v-sheet border rounded="lg">
      <v-card-title class="bg-cardHeader">
        Confirm Contract Deletion
      </v-card-title>

      <v-divider />

      <v-card-text class="overflow-y-auto" style="max-height: calc(100vh - 296px)">
        <v-alert border="start" variant="tonal">
          <span>Are you sure you want to delete the Contract with the id </span>
          <span class="text-primary font-weight-bold">{{ contract['@id'] }}</span>
          <span>?</span>
        </v-alert>

      </v-card-text>

      <v-card-actions>
        <v-spacer />

        <v-btn
          rounded="lg"
          text="Cancel"
          @click="deleteContractDialog = false"
        />

        <v-btn
          class="text-buttonText"
          color="primary"
          rounded="lg"
          text="Delete"
          variant="flat"
          @click="deleteContract"
        />
      </v-card-actions>
    </v-sheet>
  </v-dialog>
</template>

<script lang="ts" setup>
  import { useEdcClient } from '@/pages/modules/EclipseDataspaceConnector/composables/Client/EdcClient'

  const props = defineProps<{
    modelValue: boolean
    contract: any
  }>()

  const emit = defineEmits<{
    (event: 'update:modelValue' | 'contract-deleted', value: boolean): void
  }>()

  // Composables
  const { deleteContractDefinition: deleteContractFromEdc } = useEdcClient()

  // Data
  const deleteContractDialog = ref(false)

  // Watchers
  watch(
    () => props.modelValue,
    value => {
      deleteContractDialog.value = value
    },
  )

  watch(
    () => deleteContractDialog.value,
    value => {
      emit('update:modelValue', value)
    },
  )

  async function deleteContract (): Promise<void> {
    if (!props.contract) {
      return
    }

    try {
      // Create the contract via EDC API
      const response = await deleteContractFromEdc(props.contract['@id'])
      if (response) {
        emit('contract-deleted', true)
        deleteContractDialog.value = false
      } else {
        console.error('Failed to delete contract')
      }
    } catch (error_) {
      console.error('Error creating contract:', error_)
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
