<template>
  <AbacDialog
    v-model="isOpen"
    :advisory="advisory"
    :editor-mode="editorMode"
    :error="jsonError"
    :form-limitation="formLimitation"
    :loading="isImportPending"
    :messages="tm('policies.import.dialog')"
    @submit="onSubmit"
    @switch="switchEditorMode"
  >
    <!-- Source reference is optional audit metadata; keep this field for later.
    <v-text-field
      id="sourceRef"
      v-model="sourceRef"
      density="comfortable"
      hide-details
      v-bind="i18nData('policies.import.sourceRef')"
      :label="t('policies.import.sourceRef')"
      variant="outlined"
    />
    -->

    <v-switch
      id="activateOnImport"
      v-model="activateOnImport"
      class="mx-2"
      color="warning"
      density="compact"
      hide-details
      v-bind="i18nData('policies.import.activateOnImport')"
      :label="t('policies.import.activateOnImport')"
    />

    <template #form>
      <div class="mt-4">
        <PolicyForm
          v-if="formDocument"
          :doc="formDocument"
          :error-paths="errorPaths"
          :warning-paths="advisory?.paths"
          @update:doc="updateFormDocument"
        />
      </div>
    </template>

    <template #json>
      <div class="mt-4">
        <AbacEditor
          v-model="jsonText"
          :active="editorMode === 'json'"
          :disabled="isImportPending"
          :label="t('policies.import.editor')"
          :rows="16"
          :target="{ mode: 'create', viewer: 'policy', }"
        />
      </div>
    </template>
  </AbacDialog>
</template>

<script setup lang="ts">
  import { useNavigationStore } from '@/store/NavigationStore'
  import { useImportPolicy } from '../../api/policy/useImportPolicy'
  import { EMPTY_POLICY } from '../../constants/json'
  import { useDocumentEditor } from '../../hooks/forms/useDocumentEditor'
  import { useAbacNavigation } from '../../hooks/navigation/useAbacNavigation'
  import { useLiveValidation } from '../../hooks/validations/useLiveValidation'
  import { usePolicyValidation } from '../../hooks/validations/usePolicyValidation'
  import { useAbacI18n } from '../../i18n/useAbacI18n'
  import { toSaveError } from '../../utils/api'
  import { representPolicyDraft } from '../../utils/forms/policy'
  import AbacEditor from '../shared/AbacEditor.vue'
  import AbacDialog from '../shared/dialog/AbacDialog.vue'
  import PolicyForm from './form/PolicyForm.vue'

  const { t, tm, i18nData } = useAbacI18n()
  const navigationStore = useNavigationStore()

  const { onSelectPolicy } = useAbacNavigation()
  const { mutateAsync: importPolicy, isPending: isImportPending } = useImportPolicy()

  const isOpen = ref(false)
  const sourceRef = ref('')
  const activateOnImport = ref(false)

  const {
    formDocument,
    jsonText,
    editorMode,
    formLimitation,
    updateFormDocument,
    initializeNewDocument,
    switchEditorMode,
  } = useDocumentEditor({
    checkFormSupport: representPolicyDraft,
  })

  const { validateJson } = usePolicyValidation(tm('policies.import.errors'), tm('validation'), t('definitions.definitionDialog.errors.requiredName'))
  const { error: jsonError, errorPaths, advisory, saveError, validateNow } = useLiveValidation({
    enabled: () => isOpen.value,
    input: () => ({
      json: jsonText.value,
    }),
    validate: validateJson,
  })

  function open (): void {
    isOpen.value = true
    sourceRef.value = ''
    activateOnImport.value = false
    initializeNewDocument(EMPTY_POLICY)
  }

  function close (): void {
    isOpen.value = false
  }

  async function onSubmit (): Promise<void> {
    const { payload: policy } = validateNow()

    saveError.value = null

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
      saveError.value = toSaveError(error, t('policies.import.failed'))
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
