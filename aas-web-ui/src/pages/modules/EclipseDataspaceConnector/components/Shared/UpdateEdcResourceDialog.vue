<template>
  <v-dialog v-model="updateDialog" max-height="90%" :width="800">
    <v-sheet border class="d-flex flex-column" height="100%" rounded="lg">
      <v-card-title class="bg-cardHeader">
        Update {{ label }}
      </v-card-title>

      <v-divider />

      <v-card-text class="flex-grow-1 overflow-y-auto">
        <!-- Error banner: invalid JSON or the error of the EDC on the last update -->
        <v-alert
          v-if="jsonError || updateError"
          class="mb-4 text-pre-line"
          density="compact"
          :text="jsonError ?? updateError ?? ''"
          :title="jsonError ? undefined : `Failed to update ${label}`"
          type="error"
          variant="tonal"
        />

        <CodeViewer
          :file-name="`${resourceId}.json`"
          height="auto"
          :icon="icon"
          :invalid="!!jsonError"
          :read-only="false"
          :text="jsonText"
          :title="label"
          @update:text="jsonText = $event"
        />
      </v-card-text>

      <v-divider />

      <v-card-actions>
        <v-spacer />

        <v-btn
          rounded="lg"
          text="Cancel"
          @click="updateDialog = false"
        />

        <v-btn
          class="text-buttonText"
          color="primary"
          :disabled="!!jsonError || !jsonText.trim() || !jsonChanged"
          rounded="lg"
          text="Update"
          variant="flat"
          @click="updateResource"
        />
      </v-card-actions>
    </v-sheet>
  </v-dialog>
</template>

<script lang="ts" setup generic="T extends Record<string, unknown>">
  import type { CatenaXEdcResult } from '@/composables/Client/CatenaXEdcClient'
  import { edcRequestFailureText } from '@/pages/modules/EclipseDataspaceConnector/composables/EdcRequestFailure'

  const props = withDefaults(defineProps<{
    resource: T
    label: string // e.g. `Asset`, used in the title and the error messages
    icon?: string // Icon of the resource, as in its list
    update: (proxyId: string, resourceId: string, resource: T) => Promise<CatenaXEdcResult>
    proxyId?: string
  }>(), {
    icon: 'mdi-code-json',
    proxyId: 'default',
  })

  const emit = defineEmits<{
    (event: 'updated'): void
  }>()

  // Data
  const updateDialog = defineModel<boolean>({ required: true })
  const jsonText = ref('')
  const updateError = ref<string | null>(null) // Error of the EDC on the last update
  const initialJson = ref('') // Compact JSON of the opened EDC resource, to detect changes

  // Computed
  const resourceId = computed(() => (props.resource?.['@id'] as string | undefined) ?? '')
  // Invalid JSON, or a changed @id: the @id in the JSON selects the resource to update, so it must stay the same
  const jsonError = computed(() => {
    try {
      return JSON.parse(jsonText.value)?.['@id'] === resourceId.value
        ? null
        : `The @id must stay "${resourceId.value}", an update cannot change the ID of the ${props.label}.`
    } catch (error_) {
      return error_ instanceof Error ? error_.message : 'Invalid JSON'
    }
  })
  // Only a change of the content counts, not of its formatting
  const jsonChanged = computed(() => {
    try {
      return JSON.stringify(JSON.parse(jsonText.value)) !== initialJson.value
    } catch {
      return true
    }
  })

  // Watchers
  watch(
    () => updateDialog.value,
    value => {
      if (value) {
        initFromResource()
      }
    },
  )

  // Methods
  function initFromResource (): void {
    if (!props.resource) return
    updateError.value = null
    jsonText.value = JSON.stringify(props.resource, null, 2)
    initialJson.value = JSON.stringify(props.resource)
  }

  async function updateResource (): Promise<void> {
    if (jsonError.value || !jsonText.value.trim()) return

    const id = resourceId.value
    if (!id) return

    try {
      const resourceToUpdate = JSON.parse(jsonText.value) as T

      updateError.value = null
      const result = await props.update(props.proxyId, id, resourceToUpdate)
      if (result.success) {
        emit('updated')
        updateDialog.value = false
      } else {
        updateError.value = edcRequestFailureText(result, props.label, 'update')
      }
    } catch (error_) {
      console.error(`Error updating ${props.label}:`, error_)
      updateError.value = error_ instanceof Error ? error_.message : String(error_)
    }
  }
</script>
