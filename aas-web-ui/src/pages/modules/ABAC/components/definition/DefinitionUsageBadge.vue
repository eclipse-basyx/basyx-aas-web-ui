<template>
  <v-tooltip v-if="usageHint" location="top" open-delay="600">
    <template #activator="{ props: tooltipProps }">
      <span
        v-bind="tooltipProps"
        :aria-label="usageHint"
        class="ml-2 text-listItemText"
        role="img"
        tabindex="0"
      >
        <v-icon :icon="ICONS.LINK" size="14" />
      </span>
    </template>

    <span>{{ usageHint }}</span>
  </v-tooltip>
</template>

<script setup lang="ts">
  import type { DefinitionUsage } from '../../types/definitions'
  import { useAbacI18n } from '../../i18n/useAbacI18n'

  const ICONS = {
    LINK: 'mdi-link-variant',
  } as const

  const { usages } = defineProps<{ usages: DefinitionUsage[] }>()

  const { t } = useAbacI18n()
  const usageHint = computed(() => usages.length > 0
    ? t('definitions.usage.usedBy', { usage: usages.map(usage => usage.kind === 'rule'
      ? t('definitions.usage.rule', { index: usage.ruleIndex ?? 0 })
      : t('definitions.usage.definition', { kind: t(`definitions.${usage.definitionKind}`), name: usage.name ?? '' })).join(', ') })
    : undefined)
</script>
