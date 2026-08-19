<script setup lang="ts">
  import { ref } from 'vue'
  import { useImportPolicy } from '@/pages/modules/ABAC/api/queries/policy/useImportPolicy'
  import { useNavigationStore } from '@/store/NavigationStore'
  import { EMPTY_POLICY } from '../../constants/json'
  import { useAbacNavigation } from '../../hooks/useAbacNavigation'
  import { usePolicyValidation } from '../../hooks/usePolicyValidation'
  import { useAbacI18n } from '../../i18n/useAbacI18n'
  import JsonCodeEditor, { type JsonErrorMessage } from '../shared/JsonCodeEditor.vue'

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
  const errorLines = ref<number[]>([])

  function open (): void {
    isOpen.value = true
    sourceRef.value = ''
    activateOnImport.value = false
    jsonError.value = null
    errorLines.value = []
    policyJson.value = JSON.stringify(EMPTY_POLICY, null, 2)
  }

  function close (): void {
    isOpen.value = false
  }
  const { validateJson } = usePolicyValidation(tm('validation'))

  async function onSubmit (): Promise<void> {
    const { policy, error, errorLines: lines } = validateJson({
      json: policyJson.value,
      errorMessages: {
        required: t('policies.import.required'),
        invalidJson: t('policies.import.invalidJson'),
        invalidPolicy: t('policies.import.invalidPolicy'),
      },
    })

    jsonError.value = error
    errorLines.value = lines

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
      const message = error instanceof Error ? error.message : t('policies.import.failed')
      navigationStore.dispatchSnackbar({
        status: true,
        timeout: 4000,
        color: 'error',
        btnColor: 'buttonText',
        text: message,
      })
    }
  }

  defineExpose({ open, close })
</script>

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
            class="mx-2 my-4"
            color="warning"
            density="compact"
            hide-details
            v-bind="i18nData('policies.import.activateOnImport')"
            :label="t('policies.import.activateOnImport')"
          />

          <JsonCodeEditor
            v-model="policyJson"
            :disabled="isImportPending"
            :error-lines="errorLines"
            :error-message="jsonError"
            :label="t('policies.import.editor')"
            :rows="16"
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
