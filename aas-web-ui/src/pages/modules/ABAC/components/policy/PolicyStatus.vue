<template>
  <v-chip
    :color="color"
    label
    size="small"
    v-bind="key"
  >
    <v-icon :icon="icon" size="16" start />
    {{ label }}
  </v-chip>
</template>

<script setup lang="ts">
  import type { PolicyStatus } from '../../types/policy'
  import { useAbacI18n } from '../../i18n/useAbacI18n'

  const ICONS = {
    active: 'mdi-check-circle',
    staged: 'mdi-pencil-circle',
    superseded: 'mdi-archive',
    rejected: 'mdi-close-circle',
  } as const

  const COLORS: Record<PolicyStatus, string> = {
    active: 'success',
    staged: 'warning',
    superseded: 'grey-darken-1',
    rejected: 'error',
  }

  const { status } = defineProps<{ status: PolicyStatus }>()

  const { t, i18nData } = useAbacI18n()

  const label = computed(() => t(`policies.status.${status}`))
  const color = computed(() => COLORS[status])
  const icon = computed(() => ICONS[status])
  const key = computed(() => i18nData(`policies.status.${status}`))
</script>
