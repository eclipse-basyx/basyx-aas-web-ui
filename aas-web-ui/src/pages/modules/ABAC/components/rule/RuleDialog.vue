<template>
  <AbacDialog
    v-model="isOpen"
    :advisory="advisory"
    :editor-mode="editorMode"
    :error="jsonError"
    :form-limitation="formLimitation"
    :loading="isPending"
    :messages="tm(`rules.ruleDialog.${dialogMode}`)"
    @submit="onSubmit"
    @switch="switchEditorMode"
  >
    <v-select
      v-if="dialogMode === 'create'"
      v-model.number="position"
      class="mb-3"
      density="comfortable"
      hide-details
      :items="Array.from({ length: rulesCount + 1 }, (_, i) => i + 1)"
      v-bind="i18nData('rules.ruleDialog.position')"
      :label="t('rules.ruleDialog.position')"
      variant="outlined"
    />

    <p v-if="dialogMode === 'update'" class="mb-0 text-body-small">
      {{ t('rules.ruleDialog.updateHint') }}
    </p>

    <template #form>
      <div class="mt-4">
        <RuleForm
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
          :disabled="isPending"
          :label="t('rules.ruleDialog.editor')"
          :rows="18"
          :target="{ mode: dialogMode, viewer: 'rule' }"
        />
      </div>
    </template>
  </AbacDialog>
</template>

<script setup lang="ts">
  import type { Rule, RuleDialogProps } from '../../types/rules'
  import { useNavigationStore } from '@/store/NavigationStore'
  import { hasContent } from '@/utils/StringUtils'
  import { useCreateRule } from '../../api/rule/useCreateRule'
  import { useUpdateRule } from '../../api/rule/useUpdateRule'
  import { EMPTY_RULE } from '../../constants/json'
  import { useDocumentEditor } from '../../hooks/forms/useDocumentEditor'
  import { useAbacNavigation } from '../../hooks/navigation/useAbacNavigation'
  import { useRules } from '../../hooks/resources/useRules'
  import { useLiveValidation } from '../../hooks/validations/useLiveValidation'
  import { useRuleValidation } from '../../hooks/validations/useRuleValidation'
  import { useAbacI18n } from '../../i18n/useAbacI18n'
  import { toSaveError } from '../../utils/api'
  import { representRule } from '../../utils/forms/rule'
  import { detectRuleUpdate, resolveUpdateDocument } from '../../utils/update'
  import AbacEditor from '../shared/AbacEditor.vue'
  import AbacDialog from '../shared/dialog/AbacDialog.vue'
  import RuleForm from './form/RuleForm.vue'

  const { t, tm, i18nData } = useAbacI18n()
  const navigationStore = useNavigationStore()

  const { selectedPolicyVersion, onSelectRule } = useAbacNavigation()
  const { rulesCount } = useRules()

  const { mutateAsync: createRule, isPending: isCreating } = useCreateRule()
  const { mutateAsync: updateRule, isPending: isUpdating } = useUpdateRule()

  const isPending = computed(() => isCreating.value || isUpdating.value)

  const isOpen = ref(false)
  const dialogMode = ref<RuleDialogProps['mode']>('create')
  const position = ref<number>()
  const currentRule = ref<Rule | undefined>(undefined)

  const {
    formDocument,
    mergeBaseDocument,
    jsonText,
    editorMode,
    formLimitation,
    updateFormDocument,
    initializeNewDocument,
    loadJsonDocument,
    switchEditorMode,
  } = useDocumentEditor({
    checkFormSupport: representRule,
    resolveJsonDocument: (base, draft) => {
      if (dialogMode.value !== 'update') return draft
      const update = detectRuleUpdate(base, draft)
      return resolveUpdateDocument(base, update)
    },
  })

  const { validateJson } = useRuleValidation(tm('rules.ruleDialog.errors'), tm('validation'))
  const { error: jsonError, errorPaths, advisory, saveError, validateNow } = useLiveValidation({
    enabled: () => isOpen.value,
    input: () => ({
      json: jsonText.value,
      currentRule: dialogMode.value === 'update'
        ? currentRule.value?.configured_rule_json
        : undefined,
      inputMode: editorMode.value === 'form' ? 'complete' as const : 'merge' as const,
      mergeBase: mergeBaseDocument.value,
    }),
    validate: validateJson,
  })

  function open ({ mode, rule }: RuleDialogProps): void {
    isOpen.value = true
    dialogMode.value = mode
    position.value = undefined
    currentRule.value = rule

    if (mode === 'create') {
      position.value = rulesCount.value + 1
      initializeNewDocument(EMPTY_RULE)
    } else if (rule) {
      loadJsonDocument(JSON.stringify(rule?.configured_rule_json, null, 2))
    }
  }

  function close (): void {
    isOpen.value = false
  }

  async function onSubmit (): Promise<void> {
    const { payload: rule } = validateNow()

    saveError.value = null

    if (!rule) return

    const versionId = selectedPolicyVersion.value
    if (!hasContent(versionId)) return

    try {
      switch (dialogMode.value) {
        case 'create': {
          await createRule({ versionId, payload: { position: position.value, rule } })

          /**
           * Select rule after creation.
           * Note: if a new rule is created with the same index as the selected one, rule detail will be updated
           */
          if (position.value) {
            onSelectRule(position.value, { force: true })
          }
          break
        }
        case 'update': {
          const ruleIndex = currentRule.value?.rule_index
          if (!hasContent(ruleIndex?.toString())) return

          await updateRule({ versionId, ruleIndex, currentRule: currentRule.value!.configured_rule_json, payload: rule, inputMode: editorMode.value === 'form' ? 'complete' : 'merge', mergeBase: mergeBaseDocument.value })
          break
        }
      }

      navigationStore.dispatchSnackbar({
        status: true,
        timeout: 3000,
        color: 'success',
        btnColor: 'buttonText',
        text: t(`rules.success.${dialogMode.value}`),
      })

      close()
    } catch (error) {
      saveError.value = toSaveError(error, t(`rules.error.${dialogMode.value}`))
      navigationStore.dispatchSnackbar({
        status: true,
        timeout: 8000,
        color: 'error',
        btnColor: 'buttonText',
        text: t(`rules.error.${dialogMode.value}`),
      })
    }
  }

  defineExpose({ open, close })
</script>
