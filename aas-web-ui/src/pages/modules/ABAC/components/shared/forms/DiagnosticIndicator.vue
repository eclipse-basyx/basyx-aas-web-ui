<template>
  <v-tooltip v-if="severity" location="top" max-width="420" open-delay="600">
    <template #activator="{ props }">
      <span
        v-bind="props"
        :aria-label="text"
        class="d-inline-flex me-2"
        role="img"
        tabindex="0"
      >
        <v-icon :color="severity" :icon="severity === 'error' ? ICONS.ERROR : ICONS.WARNING" size="small" />
      </span>
    </template>
    {{ text }}
  </v-tooltip>
</template>

<script setup lang="ts">
  import { useAbacI18n } from '../../../i18n/useAbacI18n'

  const ICONS = { ERROR: 'mdi-alert-circle', WARNING: 'mdi-alert' } as const
  const { severity } = defineProps<{ severity?: 'error' | 'warning' }>()
  const { t } = useAbacI18n()
  const text = computed(() => t(severity === 'error' ? 'forms.validation.fieldError' : 'forms.validation.fieldWarning'))
</script>
