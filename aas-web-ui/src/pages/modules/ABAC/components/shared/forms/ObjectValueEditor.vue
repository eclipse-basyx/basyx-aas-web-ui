<template>
  <div class="d-flex flex-column ga-4">
    <FragmentEditor
      v-if="kind === 'FRAGMENT'"
      v-model="modelValue"
      :disabled="disabled"
      :messages="messages"
      :severity="severity"
    />

    <template v-else-if="targets">
      <v-row align="start" class="ma-0 ga-4" no-gutters>
        <v-col cols="12" sm="4">
          <v-select
            density="comfortable"
            :disabled="disabled"
            hide-details="auto"
            :items="targetItems"
            :label="t('forms.objectEntry.format')"
            :model-value="parsed?.target ?? 'custom'"
            variant="outlined"
            @update:model-value="onTargetSelect"
          />
        </v-col>

        <v-col cols="12" sm>
          <TextInput
            :aria-label="t(parsed ? 'forms.objectEntry.identifier' : `forms.objectEntry.${kind}`)"
            :disabled="disabled"
            hide-details="auto"
            :label="t(parsed ? 'forms.objectEntry.identifier' : `forms.objectEntry.${kind}`)"
            :model-value="parsed?.identifier ?? modelValue"
            v-bind="diagnostics"
            @update:model-value="modelValue = parsed ? writeObjectIdentifier(parsed.target, $event ?? '', parsed.path) : $event ?? ''"
          />
        </v-col>
      </v-row>

      <TextInput
        v-if="parsed && kind === 'REFERABLE'"
        :disabled="disabled"
        hide-details="auto"
        :label="t('forms.objectEntry.path')"
        :model-value="parsed.path"
        v-bind="diagnostics"
        @update:model-value="modelValue = writeObjectIdentifier(parsed.target, parsed.identifier, $event ?? '')"
      />

    </template>

    <TextInput
      v-else
      :aria-label="t(`forms.objectEntry.${kind}`)"
      :disabled="disabled"
      hide-details="auto"
      :label="t(`forms.objectEntry.${kind}`)"
      :model-value="modelValue"
      v-bind="diagnostics"
      @update:model-value="modelValue = $event ?? ''"
    />
  </div>
</template>

<script setup lang="ts">
  import type { ObjectItemKind } from '../../../types/forms'
  import { useAbacI18n } from '../../../i18n/useAbacI18n'
  import { OBJECT_TARGETS, readObjectIdentifier, writeObjectIdentifier } from '../../../utils/forms/objectIdentifiers'
  import FragmentEditor from './FragmentEditor.vue'

  const { kind, disabled = false, severity, messages = [] } = defineProps<{
    kind: ObjectItemKind
    disabled?: boolean
    severity?: 'error' | 'warning'
    messages?: string[]
  }>()
  const modelValue = defineModel<string>({ required: true })

  const { t } = useAbacI18n()
  // Retain the text when selecting Custom instead of immediately decoding it again.
  const custom = ref(false)
  const targets = computed(() => OBJECT_TARGETS[kind])
  const parsed = computed(() => custom.value ? undefined : readObjectIdentifier(kind, modelValue.value))
  const targetItems = computed(() => [
    ...(targets.value ?? []).map(target => ({ title: `$${target}("…")`, value: target })),
    { title: t('forms.objectEntry.custom'), value: 'custom' },
  ])
  const diagnostics = computed(() => ({
    class: { 'abac-field-warning': severity === 'warning' },
    error: severity === 'error',
    baseColor: severity === 'warning' ? 'warning' : undefined,
    color: severity === 'warning' ? 'warning' : undefined,
    messages,
  }))

  watch(() => kind, () => {
    custom.value = false
  })

  function onTargetSelect (target: string): void {
    if (target === 'custom') {
      custom.value = true
      return
    }
    const previous = readObjectIdentifier(kind, modelValue.value)
    custom.value = false
    modelValue.value = writeObjectIdentifier(target, previous?.identifier ?? '', previous?.path ?? '')
  }
</script>
