<template>
  <v-dialog v-model="deleteDialog" :width="800">
    <v-sheet border rounded="lg">
      <v-card-title class="bg-cardHeader">
        Confirm {{ label }} Deletion
      </v-card-title>

      <v-divider />

      <v-card-text class="overflow-y-auto" style="max-height: calc(100vh - 296px)">
        <v-alert border="start" variant="tonal">
          <span>Are you sure you want to delete the {{ label }} with the id </span>
          <span class="text-primary font-weight-bold">{{ resourceId }}</span>
          <span>?</span>
        </v-alert>

        <!-- Further content, e.g. the resources deleted along with this one -->
        <slot />
      </v-card-text>

      <v-divider />

      <v-card-actions>
        <v-spacer />

        <v-btn
          rounded="lg"
          text="Cancel"
          @click="deleteDialog = false"
        />

        <v-btn
          class="text-buttonText"
          color="primary"
          :disabled="loading"
          :loading="loading"
          rounded="lg"
          text="Delete"
          variant="flat"
          @click="deleteResource"
        />
      </v-card-actions>
    </v-sheet>
  </v-dialog>
</template>

<script lang="ts" setup>
  import type { CatenaXEdcResult } from '@/composables/Client/CatenaXEdcClient'
  import {
    edcRequestFailureText,
    useEdcRequestFailureMessage,
  } from '@/pages/modules/EclipseDataspaceConnector/composables/EdcRequestFailure'

  const props = withDefaults(defineProps<{
    resource: Record<string, unknown>
    label: string // e.g. `Asset`, used in the title and the error messages
    delete: (proxyId: string, resourceId: string) => Promise<CatenaXEdcResult>
    proxyId?: string
    loading?: boolean // e.g. while the resources deleted along with this one are looked up
  }>(), {
    proxyId: 'default',
    loading: false,
  })

  const emit = defineEmits<{
    (event: 'deleted'): void
  }>()

  const deleteDialog = defineModel<boolean>({ required: true })

  // Composables
  const { showFailureMessage } = useEdcRequestFailureMessage()

  // Computed
  const resourceId = computed(() => (props.resource?.['@id'] as string | undefined) ?? '')

  // Methods
  async function deleteResource (): Promise<void> {
    if (!resourceId.value) return

    try {
      const result = await props.delete(props.proxyId, resourceId.value)
      if (result.success) {
        emit('deleted')
        deleteDialog.value = false
      } else {
        showFailureMessage(`Failed to delete ${props.label}.`, edcRequestFailureText(result, props.label, 'delete'))
      }
    } catch (error_) {
      console.error(`Error deleting ${props.label}:`, error_)
    }
  }
</script>
