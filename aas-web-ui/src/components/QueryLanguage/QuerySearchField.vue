<template>
  <v-menu
    v-model="suggestionsOpen"
    :close-on-content-click="false"
    location="bottom start"
    :open-on-click="false"
  >
    <template #activator="{ props: menuProps }">
      <v-text-field
        ref="inputRef"
        v-bind="menuProps"
        :clearable="draft.length > 0 || committedFilters.length > 0"
        density="compact"
        hide-details
        :label="label"
        :loading="loading"
        :model-value="draft"
        persistent-placeholder
        :placeholder="serverSearch ? example : placeholder"
        variant="outlined"
        @click:clear="clearSearch"
        @focus="openSuggestions"
        @keydown.enter.prevent="submitSearch"
        @keydown.esc="suggestionsOpen = false"
        @keydown.space="commitFilterOnSpace"
        @update:model-value="updateDraft"
      >
        <template v-if="committedFilters.length > 0" #prepend-inner>
          <div class="d-flex ga-1">
            <v-chip
              v-for="filter in committedFilters"
              :key="filter.id"
              class="flex-shrink-0"
              closable
              label
              size="small"
              @click:close.stop="removeFilter(filter.id)"
            >
              {{ formatQueryFilterExpression(filter) }}
            </v-chip>
          </div>
        </template>
      </v-text-field>
    </template>

    <v-card v-if="serverSearch" max-width="380" min-width="280">
      <v-list class="py-1" density="compact" max-height="320">
        <v-list-subheader>{{ suggestionTitle }}</v-list-subheader>

        <template v-if="draftState.stage === 'value' && activeField?.valueOptions">
          <v-list-item
            v-for="option in valueSuggestions"
            :key="option.value"
            :subtitle="option.value"
            :title="option.title"
            @click="selectValue(option.value)"
          />
        </template>

        <v-list-item
          v-else-if="draftState.stage === 'value' && canCommitDraftFilter()"
          prepend-icon="mdi-plus"
          subtitle="Add this filter"
          :title="draftState.value.trim()"
          @click="commitDraftFilter"
        />

        <v-list-item
          v-else-if="draftState.stage === 'value'"
          disabled
          subtitle="Press Space to add the filter"
          title="Type a value"
        />

        <template v-else-if="draftState.stage === 'operator' && activeField">
          <v-list-item
            v-for="option in operatorSuggestions"
            :key="option.operator"
            :subtitle="QUERY_FILTER_OPERATOR_LABELS[option.operator]"
            :title="option.symbol"
            @click="selectOperator(option.operator)"
          />
        </template>

        <template v-else>
          <v-list-item
            v-for="field in fieldSuggestions"
            :key="field.key"
            prepend-icon="mdi-filter-outline"
            :subtitle="field.key"
            :title="field.label"
            @click="selectField(field.key)"
          />
        </template>
      </v-list>

      <v-divider />

      <v-list class="py-1" density="compact">
        <v-list-item
          prepend-icon="mdi-code-json"
          :title="advancedActive ? 'Edit advanced query' : 'Advanced Query Language'"
          @click="openAdvancedQuery"
        />
      </v-list>
    </v-card>
  </v-menu>
</template>

<script setup lang="ts">
  import type {
    QueryFilter,
    QueryFilterFieldDefinition,
    QueryFilterFieldKey,
    QueryFilterOperator,
    QueryTarget,
  } from '@/types/QueryLanguage'
  import {
    formatQueryFilterExpression,
    getQueryFilterFields,
    parseQuerySearchExpression,
    QUERY_FILTER_OPERATOR_LABELS,
  } from '@/utils/QueryLanguageUtils'

  interface FilterDraftState {
    field?: QueryFilterFieldKey
    fieldFragment: string
    operator?: QueryFilterOperator
    operatorFragment: string
    stage: 'field' | 'operator' | 'value'
    start: number
    value: string
  }

  const FILTER_OPERATOR_SYMBOLS: Partial<Record<QueryFilterOperator, string>> = {
    'contains': ':',
    'equals': '=',
    'not-equals': '!=',
  }

  const props = defineProps<{
    advancedActive?: boolean
    example: string
    label: string
    loading: boolean
    placeholder: string
    serverSearch: boolean
    target: QueryTarget
  }>()

  const emit = defineEmits<{
    advanced: []
    clear: []
    submit: []
  }>()

  const searchExpression = defineModel<string>({ required: true })
  const suggestionsOpen = ref(false)
  const inputRef = ref<{ focus: () => void } | null>(null)
  const committedFilters = ref<QueryFilter[]>([])
  const draft = ref('')
  let nextFilterId = 0
  let lastEmittedExpression: string | undefined

  const fields = computed(() => getQueryFilterFields(props.target))
  const draftState = computed<FilterDraftState>(() => parseFilterDraft(draft.value, fields.value))
  const activeField = computed<QueryFilterFieldDefinition | undefined>(() =>
    fields.value.find(field => field.key === draftState.value.field),
  )
  const fieldSuggestions = computed(() => {
    const fragment = draftState.value.fieldFragment.toLowerCase()
    if (!fragment) return fields.value
    const matches = fields.value.filter(field =>
      field.key.toLowerCase().startsWith(fragment)
      || field.label.toLowerCase().includes(fragment),
    )
    return matches.length > 0 ? matches : fields.value
  })
  const operatorSuggestions = computed(() => {
    const fragment = draftState.value.operatorFragment.toLowerCase()
    const options = (activeField.value?.operators ?? []).flatMap(operator => {
      const symbol = FILTER_OPERATOR_SYMBOLS[operator]
      return symbol ? [{ operator, symbol }] : []
    })
    if (!fragment) return options
    const matches = options.filter(option =>
      option.symbol.startsWith(fragment)
      || QUERY_FILTER_OPERATOR_LABELS[option.operator].toLowerCase().includes(fragment),
    )
    return matches.length > 0 ? matches : options
  })
  const valueSuggestions = computed(() => {
    const fragment = draftState.value.value.trim().toLowerCase()
    const options = activeField.value?.valueOptions ?? []
    if (!fragment) return options
    const matches = options.filter(option =>
      option.value.toLowerCase().startsWith(fragment)
      || option.title.toLowerCase().includes(fragment),
    )
    return matches.length > 0 ? matches : options
  })
  const suggestionTitle = computed(() => {
    if (draftState.value.stage === 'operator') return `How should ${activeField.value?.label ?? 'the field'} match?`
    if (draftState.value.stage === 'value') return `Enter ${activeField.value?.label ?? 'filter'} value`
    return 'Filter by field'
  })

  watch(searchExpression, expression => {
    if (expression === lastEmittedExpression) {
      lastEmittedExpression = undefined
      return
    }
    syncFromExpression(expression)
  }, { immediate: true })

  watch([() => props.target, () => props.serverSearch], () => {
    suggestionsOpen.value = false
    syncFromExpression(searchExpression.value)
  })

  function openSuggestions (): void {
    if (props.serverSearch) suggestionsOpen.value = true
  }

  function clearSearch (): void {
    suggestionsOpen.value = false
    committedFilters.value = []
    draft.value = ''
    updateExpression()
    emit('clear')
  }

  async function submitSearch (): Promise<void> {
    if (props.serverSearch) {
      if (canCommitDraftFilter()) {
        commitDraftFilter()
      } else if (draftState.value.stage !== 'field') {
        suggestionsOpen.value = true
        return
      }
    }

    suggestionsOpen.value = false
    await nextTick()
    emit('submit')
  }

  function updateDraft (value: string | null): void {
    draft.value = value ?? ''
    updateExpression()
  }

  function commitFilterOnSpace (event: KeyboardEvent): void {
    if (!props.serverSearch || !canCommitDraftFilter()) return
    event.preventDefault()
    commitDraftFilter()
  }

  function selectField (field: QueryFilterFieldKey): void {
    const state = draftState.value
    const replaceFragment = state.stage === 'field'
      && state.fieldFragment !== ''
      && fields.value.some(candidate => candidate.key.toLowerCase().startsWith(state.fieldFragment.toLowerCase()))
    const prefix = replaceFragment
      ? draft.value.slice(0, state.start)
      : `${draft.value.trimEnd()}${draft.value.trimEnd() ? ' ' : ''}`

    draft.value = `${prefix}${field} `
    updateExpression()
    focusInput()
  }

  function selectOperator (operator: QueryFilterOperator): void {
    const state = draftState.value
    const symbol = FILTER_OPERATOR_SYMBOLS[operator]
    if (!state.field || !symbol) return

    draft.value = `${draft.value.slice(0, state.start)}${state.field}${symbol}`
    updateExpression()
    focusInput()
  }

  function selectValue (value: string): void {
    const state = draftState.value
    const symbol = state.operator ? FILTER_OPERATOR_SYMBOLS[state.operator] : undefined
    if (!state.field || !state.operator || !symbol) return

    draft.value = `${draft.value.slice(0, state.start)}${state.field}${symbol}${value}`
    commitDraftFilter()
  }

  function commitDraftFilter (): void {
    const state = draftState.value
    if (!canCommitDraftFilter() || !state.field || !state.operator) return

    committedFilters.value.push({
      id: `search-filter-draft-${nextFilterId++}`,
      field: state.field,
      operator: state.operator,
      value: unquoteValue(state.value.trim()),
    })
    draft.value = draft.value.slice(0, state.start).trimEnd()
    updateExpression()
    suggestionsOpen.value = true
    focusInput()
  }

  function removeFilter (id: string): void {
    committedFilters.value = committedFilters.value.filter(filter => filter.id !== id)
    updateExpression()
    focusInput()
  }

  function openAdvancedQuery (): void {
    suggestionsOpen.value = false
    emit('advanced')
  }

  function canCommitDraftFilter (): boolean {
    const state = draftState.value
    const value = state.value.trim()
    if (!state.field || !state.operator || value === '') return false
    if (!value.startsWith('"')) return true
    return /^"(?:\\.|[^"])*"$/.test(value)
  }

  function updateExpression (): void {
    const expression = [
      ...committedFilters.value.map(filter => formatQueryFilterExpression(filter)),
      draft.value.trim(),
    ].filter(Boolean).join(' ')
    lastEmittedExpression = expression
    searchExpression.value = expression
  }

  function syncFromExpression (expression: string): void {
    if (!props.serverSearch) {
      committedFilters.value = []
      draft.value = expression
      return
    }

    const parsed = parseQuerySearchExpression(props.target, expression)
    committedFilters.value = parsed.filters.map(filter => ({
      ...filter,
      id: `search-filter-initial-${nextFilterId++}`,
    }))
    draft.value = parsed.text
  }

  function focusInput (): void {
    nextTick(() => inputRef.value?.focus())
  }

  function parseFilterDraft (
    value: string,
    definitions: QueryFilterFieldDefinition[],
  ): FilterDraftState {
    const exactCandidate = findExactFieldCandidate(value, definitions)
    if (exactCandidate) return exactCandidate

    const fragmentMatch = value.match(/(\S*)$/)
    return {
      fieldFragment: fragmentMatch?.[1] ?? '',
      operatorFragment: '',
      stage: 'field',
      start: fragmentMatch?.index ?? value.length,
      value: '',
    }
  }

  function findExactFieldCandidate (
    value: string,
    definitions: QueryFilterFieldDefinition[],
  ): FilterDraftState | undefined {
    let result: FilterDraftState | undefined
    for (const field of definitions) {
      const pattern = new RegExp(String.raw`(?:^|\s)${escapeRegExp(field.key)}(?=\s|:|=|!|$)`, 'gi')
      let match: RegExpExecArray | null
      while ((match = pattern.exec(value)) !== null) {
        const start = match.index + match[0].length - field.key.length
        const remainder = value.slice(start + field.key.length).trimStart()
        const candidate = parseOperatorDraft(field, remainder, start)
        if (candidate && (!result || candidate.start > result.start)) result = candidate
      }
    }
    return result
  }

  function parseOperatorDraft (
    field: QueryFilterFieldDefinition,
    remainder: string,
    start: number,
  ): FilterDraftState | undefined {
    if (remainder === '') {
      return { field: field.key, fieldFragment: '', operatorFragment: '', stage: 'operator', start, value: '' }
    }

    const operators = field.operators.flatMap(operator => {
      const symbol = FILTER_OPERATOR_SYMBOLS[operator]
      return symbol ? [{ operator, symbol }] : []
    }).toSorted((left, right) => right.symbol.length - left.symbol.length)
    const option = operators.find(candidate => remainder.startsWith(candidate.symbol))
    if (option) {
      const value = remainder.slice(option.symbol.length).trimStart()
      return {
        field: field.key,
        fieldFragment: '',
        operator: option.operator,
        operatorFragment: '',
        stage: 'value',
        start,
        value,
      }
    }

    if (operators.some(operator => operator.symbol.startsWith(remainder))) {
      return { field: field.key, fieldFragment: '', operatorFragment: remainder, stage: 'operator', start, value: '' }
    }
    return undefined
  }

  function escapeRegExp (value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`)
  }

  function unquoteValue (value: string): string {
    if (!(value.startsWith('"') && value.endsWith('"'))) return value
    return value.slice(1, -1).replace(/\\([\\"])/g, '$1')
  }
</script>
