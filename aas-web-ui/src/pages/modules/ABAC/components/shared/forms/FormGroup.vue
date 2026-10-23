<template>
  <v-expansion-panel class="abac-form-group border-s-thin border-e-thin" :value="value">
    <v-expansion-panel-title class="text-title-medium" :class="{ 'text-error': error, 'text-warning': warning && !error }">
      <v-tooltip v-if="error || warning" location="top" max-width="420" open-delay="600">
        <template #activator="{ props: tooltipProps }">
          <span
            v-bind="tooltipProps"
            :aria-label="diagnosticText"
            class="me-2"
            role="img"
            tabindex="0"
            @click.stop
          >
            <v-icon :icon="error ? ICONS.ERROR : ICONS.WARNING" size="small" />
          </span>
        </template>

        <span class="text-pre-wrap">{{ diagnosticText }}</span>
      </v-tooltip>
      {{ title }}
      <template #actions="{ expanded }">
        <div class="d-flex align-center ga-1">
          <AbacHelp v-if="hint" :text="hint" :topic="helpTopic" />
          <v-icon :icon="expanded ? ICONS.COLLAPSE : ICONS.EXPAND" />
        </div>
      </template>
    </v-expansion-panel-title>

    <v-expansion-panel-text>
      <div class="d-flex flex-column ga-4 pt-2">
        <slot />
      </div>
    </v-expansion-panel-text>
  </v-expansion-panel>
</template>

<script setup lang="ts">
  import type { HelpTopic } from '../../../constants/help'
  import { FORM_DIAGNOSTICS_KEY } from '../../../constants/inject'
  import { useAbacI18n } from '../../../i18n/useAbacI18n'
  import { sectionDiagnosticMessages } from '../../../utils/forms/diagnostics'
  import AbacHelp from './AbacHelp.vue'

  const ICONS = {
    ERROR: 'mdi-alert-circle',
    WARNING: 'mdi-alert',
    COLLAPSE: 'mdi-chevron-up',
    EXPAND: 'mdi-chevron-down',
  } as const

  const { error, diagnosticPrefix = [], diagnosticKeys, diagnosticExcludeKeys = [] } = defineProps<{
    value: string
    title: string
    hint?: string
    helpTopic?: HelpTopic
    error?: boolean
    warning?: boolean
    diagnosticPrefix?: string[]
    diagnosticKeys?: string[]
    diagnosticExcludeKeys?: string[]
  }>()

  const { t } = useAbacI18n()
  const diagnostics = inject(FORM_DIAGNOSTICS_KEY, computed(() => ({ error: null, advisory: null })))
  const diagnosticText = computed(() => {
    const messages = sectionDiagnosticMessages(diagnostics.value.error, diagnostics.value.advisory, diagnosticPrefix, diagnosticKeys, diagnosticExcludeKeys)
    const shown = messages.slice(0, 3)
    if (messages.length > 3) shown.push(t('forms.validation.more', { count: messages.length - 3 }))
    return shown.join('\n') || t(error ? 'forms.validation.fieldError' : 'forms.validation.fieldWarning')
  })
</script>

<style scoped>
  /* Match the editor panels: frame collapsed groups and each expanded gap. */
  .abac-form-group:is(:first-child, .v-expansion-panel--active, .v-expansion-panel--after-active) {
    border-block-start: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
  }

  .abac-form-group:is(:last-child, .v-expansion-panel--active, .v-expansion-panel--before-active) {
    border-block-end: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
  }
</style>
