<template>
  <v-dialog v-model="deletePolicyDialog" :width="800">
    <v-sheet border rounded="lg">
      <v-card-title class="bg-cardHeader">
        Confirm Policy Deletion
      </v-card-title>

      <v-divider />

      <v-card-text class="overflow-y-auto" style="max-height: calc(100vh - 296px)">
        <v-alert border="start" variant="tonal">
          <span>Are you sure you want to delete the Policy with the id </span>
          <span class="text-primary font-weight-bold">{{ policy['@id'] }}</span>
          <span>?</span>
        </v-alert>

      </v-card-text>

      <v-card-actions>
        <v-spacer />

        <v-btn
          rounded="lg"
          text="Cancel"
          @click="deletePolicyDialog = false"
        />

        <v-btn
          class="text-buttonText"
          color="primary"
          rounded="lg"
          text="Delete"
          variant="flat"
          @click="deletePolicy"
        />
      </v-card-actions>
    </v-sheet>
  </v-dialog>
</template>

<script lang="ts" setup>
  import { useEdcClient } from '@/pages/modules/EclipseDataspaceConnector/composables/Client/EdcClient'

  const props = defineProps<{
    modelValue: boolean
    policy: any
  }>()

  const emit = defineEmits<{
    (event: 'update:modelValue' | 'policy-deleted', value: boolean): void
  }>()

  // Composables
  const { deletePolicyDefinition: deletePolicyDefinitionFromEdc } = useEdcClient()

  // Data
  const deletePolicyDialog = ref(false)

  // Watchers
  watch(
    () => props.modelValue,
    value => {
      deletePolicyDialog.value = value
    },
  )

  watch(
    () => deletePolicyDialog.value,
    value => {
      emit('update:modelValue', value)
    },
  )

  async function deletePolicy (): Promise<void> {
    if (!props.policy) {
      return
    }

    try {
      // Create the policy via EDC API
      const response = await deletePolicyDefinitionFromEdc(props.policy['@id'])
      if (response) {
        emit('policy-deleted', true)
        deletePolicyDialog.value = false
      } else {
        console.error('Failed to delete policy')
      }
    } catch (error_) {
      console.error('Error creating policy:', error_)
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
