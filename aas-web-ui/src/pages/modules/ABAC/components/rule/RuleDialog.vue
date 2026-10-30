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
        <v-form @submit.prevent="onSubmit">
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

          <AbacEditor
            v-model="ruleJson"
            :disabled="isPending"
            :error-message="jsonError"
            :label="t('rules.ruleDialog.editor')"
            :rows="18"
            :target="{ mode: dialogMode, viewer: 'rule' }"
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
  import type { JsonErrorMessage } from '../../types/json.ts'
  import type { Rule } from '../../types/rules'
  import { useNavigationStore } from '@/store/NavigationStore'
  import { hasContent } from '@/utils/StringUtils'
  import { useCreateRule } from '../../api/rule/useCreateRule'
  import { useUpdateRule } from '../../api/rule/useUpdateRule'
  import { EMPTY_RULE } from '../../constants/json'
  import { useAbacNavigation } from '../../hooks/useAbacNavigation'
  import { useRules } from '../../hooks/useRules'
  import { useRuleValidation } from '../../hooks/useRuleValidation'
  import { useAbacI18n } from '../../i18n/useAbacI18n'
  import AbacEditor from '../shared/AbacEditor.vue'

  const ICONS = {
    CLOSE: 'mdi-close',
  } as const

  export interface RuleDialogProps {
    mode: 'create' | 'update'
    rule?: Rule
  }

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
  const ruleJson = ref('')
  const currentRule = ref<Rule | undefined>(undefined)
  const jsonError = ref<JsonErrorMessage | null>(null)

  function open ({ mode, rule }: RuleDialogProps): void {
    isOpen.value = true
    dialogMode.value = mode
    position.value = undefined
    jsonError.value = null
    currentRule.value = rule

    if (mode === 'create') {
      position.value = rulesCount.value + 1
      ruleJson.value = JSON.stringify(EMPTY_RULE, null, 2)
    } else if (rule) {
      ruleJson.value = JSON.stringify(rule?.configured_rule_json, null, 2)
    }
  }

  function close (): void {
    isOpen.value = false
  }

  const { validateJson } = useRuleValidation(tm('rules.ruleDialog.errors'), tm('validation'))

  async function onSubmit (): Promise<void> {
    const { rule, error } = validateJson({
      json: ruleJson.value,
      currentRule: dialogMode.value === 'update'
        ? currentRule.value?.configured_rule_json
        : undefined,
    })

    jsonError.value = error

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

          await updateRule({ versionId, ruleIndex, currentRule: currentRule.value!.configured_rule_json, rule })
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
      // Replace validation errors with the save failure.
      jsonError.value = {
        title: t(`rules.error.${dialogMode.value}`),
        messages: error instanceof Error ? error.message.split('\n') : undefined,
      }
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
