<template>
  <div class="d-flex flex-column ga-4" style="min-width: 0;">
    <v-row no-gutters>
      <v-col class="pe-sm-4" cols="12" sm="8">
        <v-select
          :aria-label="t('forms.expression.operator')"
          density="comfortable"
          :disabled="disabled"
          hide-details="auto"
          :items="operatorItems"
          :label="t('forms.expression.operator')"
          :model-value="stateOperator"
          variant="outlined"
          @update:model-value="onOperatorSelect($event as string)"
        >
          <template #selection="{ item }">
            <span class="d-flex align-center ga-2">
              <span>{{ OPERATOR_SYMBOLS[item.value] }}</span>
              <span class="text-body-small text-medium-emphasis">{{ item.title }}</span>
            </span>
          </template>

          <template #item="{ props: itemProps, item }">
            <v-list-item v-bind="itemProps">
              <template #title>
                <span class="d-flex align-center ga-2">
                  <span>{{ OPERATOR_SYMBOLS[item.value] }}</span>
                  <span class="text-body-small">{{ item.title }}</span>
                </span>
              </template>
            </v-list-item>
          </template>
        </v-select>

      </v-col>

      <v-col class="mt-3 mt-sm-0" cols="12" sm="4">
        <v-select
          :aria-label="t('forms.expression.negated')"
          density="comfortable"
          :disabled="disabled || (!canNegate && !negated)"
          hide-details="auto"
          :hint="allowed === 'match' && !canNegate ? t('forms.expression.matchNegationHint') : undefined"
          :items="negationItems"
          :label="t('forms.expression.negated')"
          :model-value="negated"
          :persistent-hint="allowed === 'match' && !canNegate"
          variant="outlined"
          @update:model-value="negated = $event"
        />
      </v-col>
    </v-row>

    <v-select
      v-if="editableCondition.kind === 'boolean'"
      :aria-label="t('forms.expression.value')"

      density="comfortable"
      :disabled="disabled"
      hide-details="auto"
      :items="booleanItems"
      :label="t('forms.expression.value')"
      :model-value="editableCondition.value"
      variant="outlined"
      @update:model-value="onBooleanSelect"
    />

    <template v-if="isGroup(editableCondition)">
      <CollapsibleList
        :key="editableCondition.kind"
        :disabled="disabled"
        :expand-request="expandRequest"
        :model-value="groupItems"
        @update:model-value="onItemsUpdate"
      >
        <template #default="{ item, index }">
          <span :class="{ 'text-error': pathsForItem(index, errorPaths).length > 0, 'text-warning': pathsForItem(index, errorPaths).length === 0 && pathsForItem(index, warningPaths).length > 0 }"><DiagnosticIndicator :severity="pathsForItem(index, errorPaths).length > 0 ? 'error' : pathsForItem(index, warningPaths).length > 0 ? 'warning' : undefined" />{{ conditionTitle(item, index) }}</span>
        </template>

        <template #actions="{ index }">
          <v-btn
            :aria-label="t('forms.list.remove')"
            color="error"
            :disabled="disabled || !canRemoveItem"
            :icon="ICONS.REMOVE"
            size="small"
            variant="text"
            @click="onItemRemove(index)"
          >
            <v-icon :icon="ICONS.REMOVE" />
            <v-tooltip activator="parent" location="top" open-delay="600">{{ t('forms.list.remove') }}</v-tooltip>
          </v-btn>
        </template>

        <template #body="{ item, index }">
          <FormulaEditor
            :allowed="childAllowed"
            :disabled="disabled"
            :error-paths="pathsForItem(index, errorPaths)"
            :model-value="item"
            :warning-paths="pathsForItem(index, warningPaths)"
            @update:model-value="onItemUpdate(index, $event)"
          />
        </template>
      </CollapsibleList>

      <ListAddActions :empty="groupItems.length === 0" :empty-text="t('forms.expression.emptyItems')">
        <v-btn
          :aria-label="t('forms.expression.addCondition')"
          color="primary"
          density="comfortable"
          :disabled="disabled"
          :prepend-icon="ICONS.ADD"
          variant="outlined"
          @click="onItemAdd"
        >
          {{ t('forms.expression.addCondition') }}
        </v-btn>
      </ListAddActions>
    </template>

    <template v-else-if="editableCondition.kind === 'comparison'">
      <div>
        <FormSectionHeading :title="t('forms.expression.operand.left')" />

        <OperandEditor
          :disabled="disabled"
          :error-paths="pathsForOperand(0, errorPaths)"
          :model-value="editableCondition.left"
          :operator="editableCondition.operator"
          :other-operand="editableCondition.right"
          :warning-paths="pathsForOperand(0, warningPaths)"
          @update:model-value="onLeftUpdate"
        />
      </div>

      <div>
        <FormSectionHeading :title="t('forms.expression.operand.right')" />

        <OperandEditor
          :disabled="disabled"
          :error-paths="pathsForOperand(1, errorPaths)"
          :model-value="editableCondition.right"
          :operator="editableCondition.operator"
          :other-operand="editableCondition.left"
          :warning-paths="pathsForOperand(1, warningPaths)"
          @update:model-value="onRightUpdate"
        />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
  import type { ComparisonOperator, ExpressionState, LiteralOperandState } from '../../../types/forms'
  import { COMPARISON_OPERATORS } from '../../../constants/forms'
  import { FORMULA_GROUP_MIN_ITEMS } from '../../../constants/formula'
  import { useAbacI18n } from '../../../i18n/useAbacI18n'
  import { readExpressionNegation, writeExpressionNegation } from '../../../utils/forms/expressionNegation'
  import CollapsibleList from '../list/CollapsibleList.vue'
  import DiagnosticIndicator from './DiagnosticIndicator.vue'
  import FormSectionHeading from './FormSectionHeading.vue'
  import ListAddActions from './ListAddActions.vue'
  import OperandEditor from './OperandEditor.vue'

  defineOptions({ name: 'FormulaEditor' })

  const ICONS = {
    ADD: 'mdi-plus',
    REMOVE: 'mdi-delete',
  } as const

  const OPERATOR_SYMBOLS: Record<string, string> = {
    'eq': '=', 'ne': '≠', 'gt': '>', 'ge': '≥', 'lt': '<', 'le': '≤',
    'contains': '…x…', 'starts-with': '^…', 'ends-with': '…$', 'regex': '.*',
    'and': '∧', 'or': '∨', 'match': 'MATCH', 'boolean': '⊤ / ⊥',
  }

  const { allowed = 'expressions', disabled = false, errorPaths = [], warningPaths = [] } = defineProps<{
    /** `match` groups only accept comparisons and nested match conditions. */
    allowed?: 'expressions' | 'match'
    disabled?: boolean
    errorPaths?: string[][]
    warningPaths?: string[][]
  }>()

  const modelValue = defineModel<ExpressionState>({ required: true })

  const expandRequest = shallowRef<{ index: number }>()

  const { t } = useAbacI18n()

  const booleanItems = computed(() => [
    { title: t('forms.expression.booleanValues.true'), value: true },
    { title: t('forms.expression.booleanValues.false'), value: false },
  ])

  const operatorItems = computed(() => [
    ...COMPARISON_OPERATORS.filter(operator => operator !== 'ne').map(operator => ({
      title: t(`forms.expression.operators.${operator}`),
      value: operator,
      props: { disabled: allowed === 'match' && negated.value && operator !== 'eq' },
    })),
    { title: t('forms.expression.operators.and'), value: 'and', props: { disabled: allowed === 'match' } },
    { title: t('forms.expression.operators.match'), value: 'match', props: { disabled: allowed === 'match' && negated.value } },
    { title: t('forms.expression.operators.or'), value: 'or', props: { disabled: allowed === 'match' } },
    { title: t('forms.expression.operators.boolean'), value: 'boolean', props: { disabled: allowed === 'match' } },
  ])

  const negationItems = computed(() => [
    { title: t('forms.expression.no'), value: false },
    { title: t('forms.expression.yes'), value: true },
  ])

  const expressionControls = computed(() => readExpressionNegation(modelValue.value))
  const negated = computed({
    get: () => expressionControls.value.negated,
    set: (value: boolean) => {
      modelValue.value = writeExpressionNegation(expressionControls.value.condition, value)
    },
  })
  const editableCondition = computed({
    get: () => expressionControls.value.condition,
    set: (condition: ExpressionState) => {
      modelValue.value = writeExpressionNegation(condition, negated.value)
    },
  })
  const canNegate = computed(() => editableCondition.value.kind !== 'empty'
    && (allowed !== 'match' || (editableCondition.value.kind === 'comparison' && editableCondition.value.operator === 'eq')))

  const stateOperator = computed<string>(() => {
    const state = editableCondition.value
    return state.kind === 'comparison' ? state.operator : state.kind
  })

  const childAllowed = computed(() => allowed === 'match' || editableCondition.value.kind === 'match' ? 'match' : 'expressions')

  /**
   * Follow the serialized group path, including NOT wrappers, to the child editor.
   */
  function pathsForItem (index: number, paths: string[][]): string[][] {
    const prefix: string[] = []
    let expression = modelValue.value
    while (expression.kind === 'not') {
      prefix.push('$not')
      expression = expression.operand
    }
    prefix.push(`$${expression.kind}`, String(index))
    return paths.filter(path => prefix.every((part, i) => path[i] === part)).map(path => path.slice(prefix.length))
  }

  /**
   * Match the serialized comparison, retaining its original NE and NOT wrappers.
   */
  function pathsForOperand (index: number, paths: string[][]): string[][] {
    const prefix: string[] = []
    let expression = modelValue.value
    while (expression.kind === 'not') {
      prefix.push('$not')
      expression = expression.operand
    }
    if (expression.kind !== 'comparison') return []
    prefix.push(`$${expression.operator}`, String(index))
    return paths.filter(path => prefix.every((part, i) => path[i] === part)).map(path => path.slice(prefix.length))
  }

  function conditionTitle (expression: ExpressionState, index: number): string {
    const { condition, negated } = readExpressionNegation(expression)
    const operator = condition.kind === 'comparison' ? condition.operator : condition.kind
    const label = condition.kind === 'empty' ? t('forms.expression.operator') : `${OPERATOR_SYMBOLS[operator] ?? ''} ${t(`forms.expression.operators.${operator}`)}`
    const value = condition.kind === 'boolean' ? `: ${t(`forms.expression.booleanValues.${condition.value}`)}` : ''
    return t('forms.expression.conditionTitle', { index: index + 1, operator: `${label}${value}${negated ? ` (${t('forms.expression.negated')})` : ''}` })
  }

  function defaultOperand (): LiteralOperandState {
    return { source: 'literal', literalOption: 'strVal', value: '' }
  }

  function defaultComparison (operator: ComparisonOperator = 'eq'): ExpressionState {
    return { kind: 'comparison', operator, left: defaultOperand(), right: defaultOperand() }
  }

  function onOperatorSelect (value: string): void {
    if (value === stateOperator.value) return
    const state = editableCondition.value
    if (value === 'boolean') {
      editableCondition.value = { kind: 'boolean', value: true }
      return
    }
    if (COMPARISON_OPERATORS.includes(value as ComparisonOperator)) {
      if (state.kind === 'comparison') {
        // Operator changes within comparisons keep both operands.
        editableCondition.value = { ...state, operator: value as ComparisonOperator }
        return
      }
      editableCondition.value = defaultComparison(value as ComparisonOperator)
      return
    }
    // groups: and/or/match
    const child = defaultComparison()
    const items = value === 'match' ? [child] : [child, defaultComparison()]
    editableCondition.value = { kind: value as 'and' | 'or' | 'match', items } as ExpressionState
  }

  function isGroup (state: ExpressionState): state is Extract<ExpressionState, { items: ExpressionState[] }> {
    return ['and', 'or', 'match'].includes(state.kind as 'and')
  }

  const groupItems = computed<ExpressionState[]>(() => (isGroup(editableCondition.value) ? editableCondition.value.items : []))

  const canRemoveItem = computed(() => isGroup(editableCondition.value)
    && groupItems.value.length > FORMULA_GROUP_MIN_ITEMS[editableCondition.value.kind])

  function onBooleanSelect (value: boolean): void {
    if (editableCondition.value.kind !== 'boolean') return
    editableCondition.value = { kind: 'boolean', value }
  }

  function onItemUpdate (index: number, item: ExpressionState): void {
    if (!isGroup(editableCondition.value)) return
    editableCondition.value = { ...editableCondition.value, items: editableCondition.value.items.map((current, i) => (i === index ? item : current)) }
  }

  function onItemRemove (index: number): void {
    if (disabled || !canRemoveItem.value || !isGroup(editableCondition.value)) return
    editableCondition.value = { ...editableCondition.value, items: editableCondition.value.items.filter((_, i) => i !== index) }
  }

  function onItemsUpdate (items: ExpressionState[]): void {
    if (!isGroup(editableCondition.value)) return
    editableCondition.value = { ...editableCondition.value, items }
  }

  function onItemAdd (): void {
    if (!isGroup(editableCondition.value)) return
    expandRequest.value = { index: editableCondition.value.items.length }
    editableCondition.value = { ...editableCondition.value, items: [...editableCondition.value.items, defaultComparison()] }
  }

  function onLeftUpdate (operand: LiteralOperandState): void {
    if (editableCondition.value.kind !== 'comparison') return
    editableCondition.value = { ...editableCondition.value, left: operand }
  }

  function onRightUpdate (operand: LiteralOperandState): void {
    if (editableCondition.value.kind !== 'comparison') return
    editableCondition.value = { ...editableCondition.value, right: operand }
  }
</script>
