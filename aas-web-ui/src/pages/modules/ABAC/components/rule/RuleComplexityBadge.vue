<script setup lang="ts">
  import type { Rule } from '@/pages/modules/ABAC/types/rules'
  import { useAbacI18n } from '../../i18n/useAbacI18n'
  import { classifyFormulaComplexity } from '../../utils/formulaComplexity'

  const ICONS = {
    LOW: 'mdi-speedometer-slow',
    DATA_DRIVEN: 'mdi-database-cog',
    N_A: 'mdi-help-circle',
  } as const

  const { rule } = defineProps<{ rule?: Rule }>()

  const { t } = useAbacI18n()

  const complexity = computed(() => classifyFormulaComplexity(rule?.configured_rule_json?.FORMULA))

  const badgeConfig = computed(() => {
    if (!complexity || complexity.value === 'N/A')
      return {
        color: 'grey',
        icon: ICONS.N_A,
        label: t('rules.complexity.na'),
        tooltip: t('rules.complexity.naTooltip'),
      }

    else if (complexity.value === 'LOW') {
      return {
        color: 'success',
        icon: ICONS.LOW,
        label: t('rules.complexity.low'),
        tooltip: t('rules.complexity.lowTooltip'),
      }
    }
    return {
      color: 'info',
      icon: ICONS.DATA_DRIVEN,
      label: t('rules.complexity.dataDriven'),
      tooltip: t('rules.complexity.dataDrivenTooltip'),
    }
  })
</script>

<template>
  <v-tooltip location="top" :open-delay="400">
    <template #activator="{ props: tipProps }">
      <v-chip
        v-bind="tipProps"
        :color="badgeConfig.color"
        label
        size="x-small"
        variant="flat"
      >
        <v-icon :icon="badgeConfig.icon" size="14" start />
        {{ badgeConfig.label }}
      </v-chip>
    </template>

    <span>{{ badgeConfig.tooltip }}</span>
  </v-tooltip>
</template>
