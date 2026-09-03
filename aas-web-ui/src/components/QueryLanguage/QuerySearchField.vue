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
        clearable
        density="compact"
        hide-details
        :label="label"
        :model-value="searchExpression"
        persistent-placeholder
        :placeholder="serverSearch ? example : placeholder"
        variant="outlined"
        @click:clear="suggestionsOpen = false"
        @focus="openSuggestions"
        @keydown.esc="suggestionsOpen = false"
        @update:model-value="updateSearchExpression"
      >
        <template v-if="serverSearch" #append-inner>
          <v-tooltip location="bottom" text="Add a field filter">
            <template #activator="{ props: tooltipProps }">
              <v-btn
                v-bind="tooltipProps"
                aria-label="Add a field filter"
                icon="mdi-tune-variant"
                size="x-small"
                variant="text"
                @click.stop="suggestionsOpen = !suggestionsOpen"
              />
            </template>
          </v-tooltip>
        </template>
      </v-text-field>
    </template>

    <v-card v-if="serverSearch" max-width="360" min-width="260">
      <v-list class="py-1" density="compact" max-height="320">
        <v-list-subheader>{{ suggestionTitle }}</v-list-subheader>

        <template v-if="activeField?.valueOptions">
          <v-list-item
            v-for="option in activeField.valueOptions"
            :key="option.value"
            :subtitle="`${activeField.key}:${option.value}`"
            :title="option.title"
            @click="insertValue(option.value)"
          />
        </template>

        <v-list-item
          v-else-if="activeField"
          :subtitle="`Type the value after ${activeField.key}:`"
          :title="activeField.label"
        />

        <template v-else>
          <v-list-item
            v-for="field in fieldSuggestions"
            :key="field.key"
            prepend-icon="mdi-filter-outline"
            :subtitle="`${field.key}:value`"
            :title="field.label"
            @click="insertField(field.key)"
          />
        </template>
      </v-list>

      <v-divider />

      <div class="px-3 py-2 text-caption text-medium-emphasis">
        <code>field:value</code> contains · <code>field=value</code> exact · <code>field!=value</code> excludes
      </div>
    </v-card>
  </v-menu>
</template>

<script setup lang="ts">
  import type { QueryFilterFieldDefinition, QueryFilterFieldKey, QueryTarget } from '@/types/QueryLanguage'
  import { getQueryFilterFields } from '@/utils/QueryLanguageUtils'

  const props = defineProps<{
    example: string
    label: string
    placeholder: string
    serverSearch: boolean
    target: QueryTarget
  }>()

  const searchExpression = defineModel<string>({ required: true })
  const suggestionsOpen = ref(false)
  const inputRef = ref<{ focus: () => void } | null>(null)

  const fields = computed(() => getQueryFilterFields(props.target))
  const activeToken = computed(() => searchExpression.value.match(/(?:^|\s)(-?)([a-z][a-z0-9]*)(:|!=|=)(\S*)$/i))
  const activeField = computed<QueryFilterFieldDefinition | undefined>(() => {
    const key = activeToken.value?.[2]?.toLowerCase()
    return fields.value.find(field => field.key.toLowerCase() === key)
  })
  const fieldFragment = computed(() => {
    if (activeToken.value) return ''
    return searchExpression.value.match(/(?:^|\s)([a-z][a-z0-9]*)$/i)?.[1] ?? ''
  })
  const fieldSuggestions = computed(() => {
    const fragment = fieldFragment.value.toLowerCase()
    if (!fragment) return fields.value
    const matches = fields.value.filter(field =>
      field.key.toLowerCase().startsWith(fragment)
      || field.label.toLowerCase().includes(fragment),
    )
    return matches.length > 0 ? matches : fields.value
  })
  const suggestionTitle = computed(() => activeField.value?.valueOptions
    ? `Choose ${activeField.value.label}`
    : (activeField.value ? 'Enter filter value' : 'Filter by field'))

  watch(() => props.target, () => {
    suggestionsOpen.value = false
  })

  function openSuggestions (): void {
    if (props.serverSearch) suggestionsOpen.value = true
  }

  function updateSearchExpression (value: string | null): void {
    searchExpression.value = value ?? ''
  }

  function insertField (field: QueryFilterFieldKey): void {
    const expression = searchExpression.value
    const fragment = fieldFragment.value
    const replaceFragment = fragment !== '' && fields.value.some(candidate =>
      candidate.key.toLowerCase().startsWith(fragment.toLowerCase()),
    )
    const prefix = replaceFragment
      ? expression.slice(0, expression.length - fragment.length)
      : `${expression}${expression && !expression.endsWith(' ') ? ' ' : ''}`

    searchExpression.value = `${prefix}${field}:`
    const definition = fields.value.find(candidate => candidate.key === field)
    suggestionsOpen.value = Boolean(definition?.valueOptions)
    focusInput()
  }

  function insertValue (value: string): void {
    const token = activeToken.value
    if (!token) return
    const prefixLength = searchExpression.value.length - token[4].length
    searchExpression.value = `${searchExpression.value.slice(0, prefixLength)}${quoteValue(value)} `
    suggestionsOpen.value = false
    focusInput()
  }

  function quoteValue (value: string): string {
    return /\s/.test(value) ? `"${value.replace(/[\\"]/g, String.raw`\$&`)}"` : value
  }

  function focusInput (): void {
    nextTick(() => inputRef.value?.focus())
  }
</script>
