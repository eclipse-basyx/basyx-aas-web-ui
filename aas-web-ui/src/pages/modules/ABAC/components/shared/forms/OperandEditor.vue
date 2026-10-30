<template>
  <div class="d-flex flex-column ga-3 flex-grow-1" style="min-width: 0;">
    <v-select
      :aria-label="t('forms.expression.operand.kind')"
      class="flex-grow-1"
      density="comfortable"
      :disabled="disabled"
      hide-details="auto"
      :items="sourceItems"
      :label="t('forms.expression.operand.kind')"
      :model-value="modelValue.source"
      variant="outlined"
      @update:model-value="onSourceSelect"
    />

    <template v-if="modelValue.source === 'literal'">
      <v-select
        :aria-label="t('forms.expression.operand.type')"
        class="flex-grow-1"
        density="comfortable"
        :disabled="disabled"
        hide-details="auto"
        :items="literalItems"
        :label="t('forms.expression.operand.type')"
        :model-value="modelValue.literalOption"
        variant="outlined"
        @update:model-value="onLiteralOptionSelect"
      />

      <v-select
        v-if="modelValue.literalOption === 'boolean'"
        :aria-label="t('forms.expression.value')"
        class="flex-grow-1"
        density="comfortable"
        :disabled="disabled"
        hide-details="auto"
        :items="booleanItems"
        :label="t('forms.expression.value')"
        :model-value="modelValue.value"
        v-bind="valueDiagnostics"
        variant="outlined"
        @update:model-value="onBooleanSelect"
      />

      <v-text-field
        v-else
        class="flex-grow-1"
        density="comfortable"
        :disabled="disabled"
        hide-details="auto"
        :label="t(`forms.expression.operand.literals.${modelValue.literalOption}`)"
        :model-value="modelValue.value"
        v-bind="valueDiagnostics"
        :type="modelValue.literalOption === 'numVal' ? 'number' : 'text'"
        variant="outlined"
        @update:model-value="onLiteralValueInput"
      />
    </template>

    <FieldRow v-else-if="modelValue.source === 'field'" :help="t('forms.expression.operand.fieldHelp')" help-topic="formulas">
      <v-combobox
        class="flex-grow-1"
        density="comfortable"
        :disabled="disabled"
        hide-details="auto"
        :hint="valueDiagnostics.messages.length > 0 ? undefined : t('forms.expression.operand.fieldHint')"
        :items="FIELD_PATH_SUGGESTIONS"
        :label="t('forms.expression.operand.field')"
        :model-value="modelValue.value"
        persistent-hint
        :return-object="false"
        v-bind="valueDiagnostics"
        variant="outlined"
        @update:model-value="onFieldValueInput"
      />
    </FieldRow>

    <template v-else>
      <AttributeSourceEditor
        :allowed-globals="allowedGlobals"
        :allowed-kinds="allowedAttributeKinds"
        class="flex-grow-1"
        :disabled="disabled"
        :messages="valueDiagnostics.messages"
        :model-value="attributeSource"
        :severity="diagnosticSeverity(errorPaths, warningPaths, '$attribute')"
        @update:model-value="onAttributeUpdate"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
  import type { AttributeSourceKind, ComparisonOperator, LiteralOperandState, LiteralOption } from '../../../types/forms'
  import { ATTRIBUTE_SOURCE_KINDS, GLOBAL_ATTRIBUTE_VALUES } from '@/schemas/access-rules/constants'
  import { FIELD_PATH_SUGGESTIONS, LITERAL_OPTIONS } from '../../../constants/forms'
  import { useAbacI18n } from '../../../i18n/useAbacI18n'
  import { diagnosticFieldProps, diagnosticSeverity } from '../../../utils/forms/diagnostics'
  import { isOperandChoiceAllowed } from '../../../utils/forms/operandChoices'
  import AttributeSourceEditor from './AttributeSourceEditor.vue'
  import FieldRow from './FieldRow.vue'

  const modelValue = defineModel<LiteralOperandState>({ required: true })

  const { disabled = false, errorPaths = [], warningPaths = [], operator = 'eq', otherOperand } = defineProps<{
    errorPaths?: string[][]
    warningPaths?: string[][]
    disabled?: boolean
    operator?: ComparisonOperator
    otherOperand?: LiteralOperandState
  }>()

  const { t } = useAbacI18n()

  const sourceItems = computed(() => [
    { title: t('forms.expression.operand.sources.literal'), value: 'literal', props: { disabled: !LITERAL_OPTIONS.some(option => choiceAllowed(defaultLiteral(option))) } },
    { title: t('forms.expression.operand.sources.attribute'), value: 'attribute', props: { disabled: allowedAttributeKinds.value.length === 0 } },
    { title: t('forms.expression.operand.sources.field'), value: 'field', props: { disabled: !choiceAllowed({ source: 'field', value: '' }) } },
  ] as const)

  const literalItems = computed(() => LITERAL_OPTIONS.map(option => ({ title: t(`forms.expression.operand.literals.${option}`), value: option, props: { disabled: !choiceAllowed(defaultLiteral(option)) } })))

  const allowedGlobals = computed(() => GLOBAL_ATTRIBUTE_VALUES.filter(value => choiceAllowed({ source: 'attribute', kind: 'GLOBAL', value })))
  const allowedAttributeKinds = computed(() => ATTRIBUTE_SOURCE_KINDS.filter(kind => kind === 'GLOBAL'
    ? allowedGlobals.value.length > 0
    : choiceAllowed({ source: 'attribute', kind, value: '' })))

  const booleanItems = computed(() => [
    { title: t('forms.expression.booleanValues.true'), value: true },
    { title: t('forms.expression.booleanValues.false'), value: false },
  ])

  const attributeSource = computed(() => ({
    kind: modelValue.value.source === 'attribute' ? modelValue.value.kind : 'CLAIM',
    value: modelValue.value.source === 'attribute' ? modelValue.value.value : '',
  }) satisfies { kind: AttributeSourceKind, value: string })

  const valueDiagnostics = computed(() => {
    const operand = modelValue.value
    const key = operand.source === 'literal' ? `$${operand.literalOption}` : (operand.source === 'field' ? '$field' : '$attribute')
    return diagnosticFieldProps(errorPaths, warningPaths, t, key)
  })

  function onSourceSelect (value: 'literal' | 'attribute' | 'field'): void {
    if (value === modelValue.value.source) return
    let candidate: LiteralOperandState | undefined
    if (value === 'literal') {
      const option = LITERAL_OPTIONS.find(option => choiceAllowed(defaultLiteral(option)))
      if (option) candidate = defaultLiteral(option)
    } else if (value === 'field') {
      candidate = { source: 'field', value: '' }
    } else {
      const kind = allowedAttributeKinds.value[0]
      if (kind) candidate = { source: 'attribute', kind, value: kind === 'GLOBAL' ? allowedGlobals.value[0] ?? '' : '' }
    }
    if (candidate && choiceAllowed(candidate)) modelValue.value = candidate
  }

  function choiceAllowed (operand: LiteralOperandState): boolean {
    return isOperandChoiceAllowed(operator, operand, otherOperand)
  }

  function defaultLiteral (option: LiteralOption): LiteralOperandState {
    return option === 'boolean' ? { source: 'literal', literalOption: option, value: true } : { source: 'literal', literalOption: option, value: '' }
  }

  function onLiteralOptionSelect (value: LiteralOption): void {
    const current = modelValue.value
    if (current.source === 'literal' && current.literalOption === value) return
    const candidate = defaultLiteral(value)
    if (choiceAllowed(candidate)) modelValue.value = candidate
  }

  function onLiteralValueInput (value: string): void {
    if (modelValue.value.source !== 'literal' || modelValue.value.literalOption === 'boolean') return
    // Only numeric literals coerce; every other type keeps text exactly as typed.
    const numeric = modelValue.value.literalOption === 'numVal' && value.trim() !== '' && Number.isFinite(Number(value)) ? Number(value) : value
    modelValue.value = { ...modelValue.value, value: numeric }
  }

  function onFieldValueInput (value: string | null): void {
    if (modelValue.value.source !== 'field') return
    modelValue.value = { source: 'field', value: value ?? '' }
  }

  function onBooleanSelect (value: boolean): void {
    if (modelValue.value.source !== 'literal' || modelValue.value.literalOption !== 'boolean') return
    modelValue.value = { source: 'literal', literalOption: 'boolean', value }
  }

  function onAttributeUpdate (value: { kind: AttributeSourceKind, value: string }): void {
    if (modelValue.value.source !== 'attribute') return
    const candidate: LiteralOperandState = { source: 'attribute', kind: value.kind, value: value.value }
    if (choiceAllowed(candidate)) modelValue.value = candidate
  }
</script>
