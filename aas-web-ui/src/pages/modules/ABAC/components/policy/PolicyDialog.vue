<template>
  <v-dialog v-model="isOpen" max-width="800" persistent scrollable>
    <v-card>
      <v-card-title class="pa-4 bg-cardHeader d-flex align-center">
        <span class="text-h6" v-bind="i18nData('policies.import.title') ">{{ t('policies.import.title') }}</span>
        <v-spacer />

        <v-btn
          density="comfortable"
          :disabled="isImportPending"
          :icon="ICONS.CLOSE"
          size="small"
          variant="text"
          @click="close"
        />
      </v-card-title>

      <v-divider />

      <v-card-text class="pa-4">
        <v-form @submit.prevent="onSubmit">
          <v-text-field
            id="sourceRef"
            v-model="sourceRef"
            density="comfortable"
            hide-details
            v-bind="i18nData('policies.import.sourceRef')"
            :label="t('policies.import.sourceRef')"
            variant="outlined"
          />

          <v-switch
            id="activateOnImport"
            v-model="activateOnImport"
            class="mx-2 my-4 mb-0"
            color="warning"
            density="compact"
            hide-details
            v-bind="i18nData('policies.import.activateOnImport')"
            :label="t('policies.import.activateOnImport')"
          />

          <AbacEditor
            v-model="policyJson"
            :disabled="isImportPending"
            :error-message="jsonError"
            :label="t('policies.import.editor')"
            :rows="16"
            :target="{ mode: 'create', viewer: 'policy', }"
          />
        </v-form>
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-4">
        <v-btn
          :disabled="isImportPending"
          variant="text"
          v-bind="i18nData('policies.import.cancel')"
          @click="close"
        >
          {{ t('policies.import.cancel') }}
        </v-btn>

        <v-btn
          color="primary"
          :loading="isImportPending"
          variant="flat"
          v-bind="i18nData('policies.import.import')"
          @click="onSubmit"
        >
          {{ t('policies.import.import') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
  import type { JsonErrorMessage } from '../../types/json'
  import { useNavigationStore } from '@/store/NavigationStore'
  import { useImportPolicy } from '../../api/policy/useImportPolicy'
  import { EMPTY_POLICY } from '../../constants/json'
  import { useAbacNavigation } from '../../hooks/useAbacNavigation'
  import { usePolicyValidation } from '../../hooks/usePolicyValidation'
  import { useAbacI18n } from '../../i18n/useAbacI18n'
  import AbacEditor from '../shared/AbacEditor.vue'

  const ICONS = {
    CLOSE: 'mdi-close',
  } as const

  const { t, tm, i18nData } = useAbacI18n()
  const navigationStore = useNavigationStore()

  const { onSelectPolicy } = useAbacNavigation()
  const { mutateAsync: importPolicy, isPending: isImportPending } = useImportPolicy()

  const isOpen = ref(false)
  const sourceRef = ref('')
  const activateOnImport = ref(false)
  const policyJson = ref('')
  const jsonError = ref<JsonErrorMessage | null>(null)

  function open (): void {
    isOpen.value = true
    sourceRef.value = ''
    activateOnImport.value = false
    jsonError.value = null
    policyJson.value = JSON.stringify(EMPTY_POLICY, null, 2)
  }

  function close (): void {
    isOpen.value = false
  }

  const { validateJson } = usePolicyValidation(tm('policies.import.errors'), tm('validation'))

  async function onSubmit (): Promise<void> {
    const { policy, error } = validateJson({
      json: policyJson.value,
    })

    jsonError.value = error

    if (!policy) return

    try {
      const newPolicy = await importPolicy({
        source_ref: sourceRef.value.trim() || undefined,
        activate: activateOnImport.value,
        policy,
      })

      onSelectPolicy(newPolicy.version_id)

      navigationStore.dispatchSnackbar({
        status: true,
        timeout: 4000,
        color: 'success',
        btnColor: 'buttonText',
        text: t('policies.import.imported'),
      })

      close()
    } catch (error) {
      // Replace validation errors with the import failure.
      jsonError.value = {
        title: t('policies.import.failed'),
        messages: error instanceof Error ? error.message.split('\n') : undefined,
      }
      navigationStore.dispatchSnackbar({
        status: true,
        timeout: 8000,
        color: 'error',
        btnColor: 'buttonText',
        text: t('policies.import.failed'),
      })
    }
  }

  defineExpose({ open, close })
</script>
