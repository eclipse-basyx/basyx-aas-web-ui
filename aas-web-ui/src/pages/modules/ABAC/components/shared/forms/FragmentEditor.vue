<template>
  <div class="d-flex flex-column ga-4">
    <v-row align="start" class="ma-0 ga-4" no-gutters>
      <v-col cols="12" sm="5">
        <v-select
          density="comfortable"
          :disabled="disabled"
          hide-details="auto"
          :items="targetItems"
          :label="t('forms.fragments.target')"
          :model-value="parsed?.target ?? 'custom'"
          variant="outlined"
          @update:model-value="onTargetSelect"
        />
      </v-col>

      <v-col cols="12" sm>
        <v-combobox
          v-if="parsed"
          density="comfortable"
          :disabled="disabled"
          hide-details="auto"
          :hint="parsed.target === 'sme' && parsed.field === '' && !severity ? t('forms.fragments.wholeElementHint') : undefined"
          :items="pathItems"
          :label="t('forms.fragments.field')"
          :model-value="parsed.field"
          persistent-hint
          :return-object="false"
          v-bind="diagnostics"
          variant="outlined"
          @update:model-value="onFieldUpdate"
        />

        <v-text-field
          v-else
          density="comfortable"
          :disabled="disabled"
          hide-details="auto"
          :label="t('forms.rule.fragment')"
          :model-value="modelValue"
          v-bind="diagnostics"
          variant="outlined"
          @update:model-value="onCustomInput"
        />
      </v-col>
    </v-row>

    <v-text-field
      v-if="parsed?.target === 'sme'"
      density="comfortable"
      :disabled="disabled"
      hide-details="auto"
      :hint="t('forms.fragments.pathHint')"
      :label="t('forms.fragments.path')"
      :model-value="parsed.path"
      v-bind="diagnostics"
      variant="outlined"
      @update:model-value="modelValue = writeFragment(parsed.target, parsed.field, $event ?? '')"
    />
  </div>
</template>

<script setup lang="ts">
  import type { FragmentTarget } from '../../../utils/forms/fragments'
  import { useAbacI18n } from '../../../i18n/useAbacI18n'
  import { FRAGMENT_PATHS, readFragment, writeFragment } from '../../../utils/forms/fragments'

  const { disabled = false, severity, messages = [] } = defineProps<{
    disabled?: boolean
    severity?: 'error' | 'warning'
    messages?: string[]
  }>()
  const modelValue = defineModel<string>({ required: true })
  const custom = ref(false)
  const { t } = useAbacI18n()
  const parsed = computed(() => custom.value ? undefined : readFragment(modelValue.value))
  const targetItems = computed(() => [
    ...(Object.keys(FRAGMENT_PATHS) as FragmentTarget[]).map(target => ({ title: `${t(`forms.fragments.targets.${target}`)} ($${target})`, value: target })),
    { title: t('forms.objectEntry.custom'), value: 'custom' as const },
  ])
  const pathItems = computed(() => parsed.value
    ? FRAGMENT_PATHS[parsed.value.target].map(field => ({
      title: field === '' ? t('forms.fragments.wholeElement') : field,
      value: field,
    }))
    : [])
  const diagnostics = computed(() => ({
    class: { 'abac-field-warning': severity === 'warning' },
    error: severity === 'error',
    baseColor: severity === 'warning' ? 'warning' : undefined,
    color: severity === 'warning' ? 'warning' : undefined,
    messages,
  }))

  function onTargetSelect (target: string): void {
    if (target === 'custom') {
      custom.value = true
      return
    }
    if (!Object.hasOwn(FRAGMENT_PATHS, target)) return
    const fragmentTarget = target as FragmentTarget
    const previous = readFragment(modelValue.value)
    const suggestions: readonly string[] = FRAGMENT_PATHS[fragmentTarget]
    const field = previous && suggestions.includes(previous.field) ? previous.field : suggestions[0]!
    custom.value = false
    modelValue.value = writeFragment(fragmentTarget, field, fragmentTarget === 'sme' ? previous?.path ?? '' : '')
  }

  function onCustomInput (value: string | null): void {
    custom.value = true
    modelValue.value = value ?? ''
  }

  function onFieldUpdate (field: unknown): void {
    if (!parsed.value) return
    modelValue.value = writeFragment(parsed.value.target, typeof field === 'string' ? field : '', parsed.value.path)
  }
</script>
