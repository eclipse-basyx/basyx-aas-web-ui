<template>
  <div class="d-flex flex-column ga-4">
    <FragmentEditor
      :messages="fieldDiagnostics('FRAGMENT').messages"
      :model-value="modelValue.fragment ?? ''"
      :severity="diagnosticSeverity(errorPaths, warningPaths, 'FRAGMENT')"
      @update:model-value="onFragmentUpdate"
    />

    <div class="mt-2">
      <FormSectionHeading :title="t('forms.rule.filterCondition')" />

      <v-radio-group
        :aria-label="t('forms.rule.filterConditionMode')"
        density="compact"
        hide-details="auto"
        inline
        :model-value="condition?.mode"
        @update:model-value="onConditionModeUpdate"
      >
        <v-radio class="me-4" :label="t('forms.rule.filterConditionInline')" value="inline" />
        <v-radio :label="t('forms.rule.filterConditionReference')" value="reference" />
      </v-radio-group>
    </div>

    <div v-if="condition?.mode === 'inline'" class="d-flex flex-column ga-2">
      <FormulaEditor
        :allowed="'expressions'"
        :error-paths="errorPaths.filter(path => path[0] === 'CONDITION').map(path => path.slice(1))"
        :model-value="condition.condition ?? { kind: 'empty' }"
        :warning-paths="warningPaths.filter(path => path[0] === 'CONDITION').map(path => path.slice(1))"
        @update:model-value="onConditionUpdate"
      />
    </div>

    <v-combobox
      v-else-if="condition?.mode === 'reference'"
      :aria-label="t('forms.rule.filterConditionReference')"
      v-bind="fieldDiagnostics('USEFORMULA')"
      density="comfortable"
      hide-details="auto"
      :items="formulaNames"
      :label="t('forms.rule.formulaCollection')"
      :model-value="condition.name ?? ''"
      variant="outlined"
      @update:model-value="onUseFormulaUpdate"
    />

    <div v-else class="text-body-small text-medium-emphasis">
      {{ t('forms.rule.conditionPending') }}
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { ExpressionState, RuleFilterState } from '../../../types/forms'
  import { useDefinitionNames } from '../../../hooks/forms/useDefinitionNames'
  import { useAbacI18n } from '../../../i18n/useAbacI18n'
  import { diagnosticFieldProps, diagnosticSeverity } from '../../../utils/forms/diagnostics'
  import FormSectionHeading from '../../shared/forms/FormSectionHeading.vue'
  import FormulaEditor from '../../shared/forms/FormulaEditor.vue'
  import FragmentEditor from '../../shared/forms/FragmentEditor.vue'

  const { errorPaths = [], warningPaths = [] } = defineProps<{ errorPaths?: string[][], warningPaths?: string[][] }>()
  const modelValue = defineModel<RuleFilterState>({ required: true })
  const pendingReference = ref(false)
  const condition = computed(() => modelValue.value.condition ?? (pendingReference.value ? { mode: 'reference' as const, name: undefined } : undefined))

  watch(() => modelValue.value.condition, value => {
    if (value) pendingReference.value = false
  })

  const { t } = useAbacI18n()
  const formulaNames = useDefinitionNames('formulas')

  function fieldDiagnostics (...path: string[]) {
    return diagnosticFieldProps(errorPaths, warningPaths, t, ...path)
  }

  function onFragmentUpdate (value: string | null): void {
    modelValue.value = { ...modelValue.value, fragment: value ?? '' }
  }

  function onConditionModeUpdate (value: unknown): void {
    if (value === condition.value?.mode) return
    pendingReference.value = value === 'reference'
    modelValue.value = {
      ...modelValue.value,
      condition: value === 'inline'
        ? { mode: 'inline', condition: { kind: 'boolean', value: true } }
        : { mode: 'reference', name: '' },
    }
  }

  function onConditionUpdate (condition: ExpressionState): void {
    pendingReference.value = false
    modelValue.value = { ...modelValue.value, condition: { mode: 'inline', condition: condition.kind === 'empty' ? null : condition } }
  }

  function onUseFormulaUpdate (value: unknown): void {
    const name = Array.isArray(value) ? value[0] : value
    pendingReference.value = typeof name !== 'string' || name === ''
    modelValue.value = { ...modelValue.value, condition: { mode: 'reference', name: typeof name === 'string' && name !== '' ? name : undefined } }
  }
</script>
