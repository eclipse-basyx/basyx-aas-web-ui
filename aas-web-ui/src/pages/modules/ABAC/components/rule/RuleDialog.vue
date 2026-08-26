<template>
  <v-dialog v-model="isOpen" max-width="800" persistent scrollable>
    <v-card>
      <v-card-title class="pa-4 bg-cardHeader d-flex align-center">
        <span class="text-h6" v-bind="i18nData(`rules.ruleDialog.title.${dialogMode}`) ">
          {{ t(`rules.ruleDialog.title.${dialogMode}`) }}
        </span>

        <v-spacer />

        <v-btn
          density="comfortable"
          :icon="ICONS.CLOSE"
          size="small"
          variant="text"
          @click="close"
        />
      </v-card-title>

      <v-divider />

      <v-card-text class="pa-4">
        <v-form ref="form" @submit.prevent="onSubmit">
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

          <p v-if="dialogMode === 'patch'" class="text-end mb-0 text-body-small">
            {{ t('rules.ruleDialog.patchHint') }}
          </p>

          <JsonCodeEditor
            v-model="ruleJson"
            :disabled="isPending"
            :error-lines="errorLines"
            :error-message="jsonError"
            :label="t('rules.ruleDialog.editor')"
            :rows="18"
          />
        </v-form>
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-4">
        <v-btn
          variant="text"
          v-bind="i18nData('rules.ruleDialog.cancel')"
          @click="close"
        >
          {{ t('rules.ruleDialog.cancel') }}
        </v-btn>

        <v-btn
          color="primary"
          :loading="isPending"
          variant="flat"
          v-bind="i18nData(`rules.ruleDialog.${dialogMode}`)"
          @click="onSubmit"
        >
          {{ t(`rules.ruleDialog.${dialogMode}`) }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import { useCreateRule } from '@/pages/modules/ABAC/api/rule/useCreateRule'
  import { usePatchRule } from '@/pages/modules/ABAC/api/rule/usePatchRule'
  import { useReplaceRule } from '@/pages/modules/ABAC/api/rule/useReplaceRule'
  import JsonCodeEditor, { type JsonErrorMessage } from '@/pages/modules/ABAC/components/shared/JsonCodeEditor.vue'
  import { EMPTY_RULE } from '@/pages/modules/ABAC/constants/json'
  import { useAbacNavigation } from '@/pages/modules/ABAC/hooks/useAbacNavigation'
  import { useRules } from '@/pages/modules/ABAC/hooks/useRules'
  import { useRuleValidation } from '@/pages/modules/ABAC/hooks/useRuleValidation'
  import { useAbacI18n } from '@/pages/modules/ABAC/i18n/useAbacI18n'
  import { useNavigationStore } from '@/store/NavigationStore'
  import { hasContent } from '@/utils/StringUtils'

  const ICONS = {
    CLOSE: 'mdi-close',
  } as const

  export type RuleDialogMode = 'create' | 'replace' | 'patch'

  const { t, tm, i18nData } = useAbacI18n()
  const navigationStore = useNavigationStore()

  const { selectedPolicyVersion, selectedRuleIndex, onSelectRule } = useAbacNavigation()
  const { rulesCount, selectedRule } = useRules()

  const { mutateAsync: createRule, isPending: isCreating } = useCreateRule()
  const { mutateAsync: replaceRule, isPending: isReplacing } = useReplaceRule()
  const { mutateAsync: patchRule, isPending: isPatching } = usePatchRule()

  const isPending = computed(() => isCreating.value || isReplacing.value || isPatching.value)

  const isOpen = ref(false)
  const dialogMode = ref<RuleDialogMode>('create')
  const position = ref<number>()
  const ruleJson = ref('')
  const jsonError = ref<JsonErrorMessage | null>(null)
  const errorLines = ref<number[]>([])

  function open (mode: RuleDialogMode): void {
    isOpen.value = true
    dialogMode.value = mode
    position.value = undefined
    jsonError.value = null
    errorLines.value = []

    if (mode === 'create') {
      position.value = rulesCount.value + 1
      ruleJson.value = JSON.stringify(EMPTY_RULE, null, 2)
    } else if (selectedRule) {
      ruleJson.value = JSON.stringify(selectedRule.value?.configured_rule_json, null, 2)
    }
  }

  function close (): void {
    isOpen.value = false
  }

  const { validateJson } = useRuleValidation(tm('validation'))

  async function onSubmit (): Promise<void> {
    const { rule, error, errorLines: lines } = validateJson({
      json: ruleJson.value,
      currentRule: dialogMode.value === 'patch' ? selectedRule.value?.configured_rule_json : undefined,
      errorMessages: {
        required: t('rules.ruleDialog.required'),
        invalidJson: t('rules.ruleDialog.invalidJson'),
        invalidRule: t('rules.ruleDialog.invalidRule'),
      },
    })

    jsonError.value = error
    errorLines.value = lines

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
          if (selectedRuleIndex.value !== position.value?.toString() && position.value) {
            onSelectRule(position.value)
          }
          break
        }
        case 'replace': {
          const ruleIndex = selectedRule.value?.rule_index
          if (!hasContent(ruleIndex?.toString())) return

          await replaceRule({ versionId, ruleIndex, rule })
          break
        }
        case 'patch': {
          const ruleIndex = selectedRule.value?.rule_index
          if (!hasContent(ruleIndex?.toString())) throw new Error(t('rules.ruleDialog.index'))

          await patchRule({ versionId, ruleIndex, patch: rule })
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
      const message = error instanceof Error ? error.message : t(`rules.error.${dialogMode.value}`)
      navigationStore.dispatchSnackbar({
        status: true,
        timeout: 8000,
        color: 'error',
        btnColor: 'buttonText',
        text: message,
      })
    }
  }

  defineExpose({ open, close })
</script>
