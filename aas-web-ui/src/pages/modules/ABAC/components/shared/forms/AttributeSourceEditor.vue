<template>
  <EntryRow>
    <template #source>
      <v-select
        :aria-label="t('forms.attributeSource.label')"
        class="attribute-source-kind"
        density="comfortable"
        :disabled="disabled"
        hide-details="auto"
        :items="kindItems"
        :label="t('forms.attributeSource.label')"
        :model-value="modelValue.kind"
        v-bind="i18nData('forms.attributeSource.label')"
        variant="outlined"
        @update:model-value="onKindSelect"
      />
    </template>

    <FieldRow :help="hideHelp ? undefined : t(`forms.attributeSource.help.${modelValue.kind}`)" help-topic="attributes">
      <v-select
        v-if="modelValue.kind === 'GLOBAL'"
        :aria-label="t('forms.attributeSource.global')"
        :base-color="severity === 'warning' ? 'warning' : undefined"
        class="attribute-source-value"
        :class="{ 'abac-field-warning': severity === 'warning' }"
        :color="severity === 'warning' ? 'warning' : undefined"
        density="comfortable"
        :disabled="disabled"
        :error="severity === 'error'"
        hide-details="auto"
        :items="globalItems"
        :label="t('forms.attributeSource.global')"
        :messages="messages"
        :model-value="modelValue.value"
        variant="outlined"
        @update:model-value="onGlobalSelect"
      />

      <TextInput
        v-else
        :aria-label="t(modelValue.kind === 'CLAIM' ? 'forms.attributeSource.claim' : 'forms.attributeSource.reference')"
        :base-color="severity === 'warning' ? 'warning' : undefined"
        class="attribute-source-value"
        :class="{ 'abac-field-warning': severity === 'warning' }"
        :color="severity === 'warning' ? 'warning' : undefined"
        :disabled="disabled"
        :error="severity === 'error'"
        hide-details="auto"
        :label="t(modelValue.kind === 'CLAIM' ? 'forms.attributeSource.claim' : 'forms.attributeSource.reference')"
        :messages="messages"
        :model-value="modelValue.value"
        @update:model-value="onValueInput"
      />
    </FieldRow>

    <template v-if="$slots.actions" #actions>
      <slot name="actions" />
    </template>
  </EntryRow>
</template>

<script setup lang="ts">
  import type { AttributeGlobalValue, AttributeSourceKind, AttributeSourceState } from '../../../types/forms'
  import { ATTRIBUTE_SOURCE_KINDS, GLOBAL_ATTRIBUTE_VALUES } from '@/schemas/access-rules/constants'
  import { useAbacI18n } from '../../../i18n/useAbacI18n'
  import EntryRow from './EntryRow.vue'
  import FieldRow from './FieldRow.vue'

  const modelValue = defineModel<AttributeSourceState>({ required: true })

  const { disabled = false, allowedKinds = ATTRIBUTE_SOURCE_KINDS, allowedGlobals = GLOBAL_ATTRIBUTE_VALUES } = defineProps<{
    allowedKinds?: readonly AttributeSourceKind[]
    allowedGlobals?: readonly AttributeGlobalValue[]
    hideHelp?: boolean
    disabled?: boolean
    severity?: 'error' | 'warning'
    messages?: string[]
  }>()

  const { t, i18nData } = useAbacI18n()

  const kindItems = computed(() => ATTRIBUTE_SOURCE_KINDS.map(kind => ({ title: t(`forms.attributeSource.${kind}`), value: kind, props: { disabled: !allowedKinds.includes(kind) } })))
  const globalItems = computed(() => GLOBAL_ATTRIBUTE_VALUES.map(value => ({ title: t(`forms.globals.${value}`), value, props: { disabled: !allowedGlobals.includes(value) } })))

  function onKindSelect (value: AttributeSourceKind): void {
    if (value === modelValue.value.kind || !allowedKinds.includes(value)) return
    // Preselect an allowed global so changing the source keeps a usable draft.
    if (value === 'GLOBAL' && allowedGlobals.length === 0) return
    modelValue.value = { kind: value, value: value === 'GLOBAL' ? allowedGlobals[0] ?? '' : '' }
  }

  function onValueInput (value: string | null): void {
    modelValue.value = { ...modelValue.value, value: value ?? '' }
  }

  function onGlobalSelect (value: string): void {
    if (!allowedGlobals.includes(value as AttributeGlobalValue)) return
    modelValue.value = { ...modelValue.value, value: value ?? '' }
  }
</script>
