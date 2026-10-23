<template>
  <EntryRow>
    <template #source>
      <v-select
        :aria-label="t('forms.objectEntry.label')"
        class="object-entry-kind"
        density="comfortable"
        :disabled="disabled"
        hide-details="auto"
        :items="kindItems"
        :label="t('forms.objectEntry.label')"
        :model-value="modelValue.kind"
        v-bind="i18nData('forms.objectEntry.label')"
        variant="outlined"
        @update:model-value="onKindSelect"
      />
    </template>

    <FieldRow v-if="!hideValue" :help="hideHelp ? undefined : t(`forms.objectEntry.valueHelp.${modelValue.kind}`)" help-topic="objects">
      <ObjectValueEditor
        :disabled="disabled"
        :kind="modelValue.kind"
        :messages="messages"
        :model-value="modelValue.value"
        :severity="severity"
        @update:model-value="onValueInput"
      />
    </FieldRow>

    <template v-if="$slots.actions" #actions>
      <slot name="actions" />
    </template>
  </EntryRow>
</template>

<script setup lang="ts">
  import type { ObjectItemKind, ObjectItemState } from '../../../types/forms'
  import { OBJECT_ITEM_KINDS } from '@/schemas/access-rules/constants'
  import { useAbacI18n } from '../../../i18n/useAbacI18n'
  import EntryRow from './EntryRow.vue'
  import FieldRow from './FieldRow.vue'
  import ObjectValueEditor from './ObjectValueEditor.vue'

  const modelValue = defineModel<ObjectItemState>({ required: true })

  const { disabled = false } = defineProps<{
    hideHelp?: boolean
    hideValue?: boolean
    disabled?: boolean
    severity?: 'error' | 'warning'
    messages?: string[]
  }>()

  const { t, i18nData } = useAbacI18n()

  const kindItems = computed(() => OBJECT_ITEM_KINDS.map(kind => ({ title: t(`forms.objectEntry.${kind}`), value: kind })))

  function onKindSelect (value: ObjectItemKind): void {
    if (value === modelValue.value.kind) return
    modelValue.value = { ...modelValue.value, kind: value }
  }

  function onValueInput (value: string | null): void {
    modelValue.value = { ...modelValue.value, value: value ?? '' }
  }
</script>
