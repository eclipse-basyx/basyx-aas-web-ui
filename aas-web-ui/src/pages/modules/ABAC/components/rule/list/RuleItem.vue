<script setup lang="ts">
  import type { Rule } from '@/pages/modules/ABAC/types/rules'
  import { useTheme } from 'vuetify'
  import { useAbacNavigation } from '../../../hooks/useAbacNavigation'
  import RuleComplexityBadge from '../RuleComplexityBadge.vue'

  const ICONS = {
    ALLOW: 'mdi-check-circle',
    DISABLED: 'mdi-close-circle',
  } as const

  const { rule, loading } = defineProps<{ rule?: Rule, loading?: boolean }>()

  const theme = useTheme()
  const isDark = computed(() => theme.global.current.value.dark)
  const primaryColor = computed(() => theme.current.value.colors.primary)

  const { selectedRuleIndex, onSelectRule } = useAbacNavigation()
  const isSelected = computed(() => selectedRuleIndex.value?.toString() === rule?.rule_index?.toString())

  const accessBadge = computed(() => {
    const isEnabled = rule?.access?.toUpperCase() === 'ALLOW'
    return isEnabled ? { icon: ICONS.ALLOW, color: 'success' } : { icon: ICONS.DISABLED, color: 'error' }
  })

  const ruleSummary = computed(() => {
    if (!rule?.configured_rule_json) return ''

    const parts: string[] = []
    if (rule?.configured_rule_json.USEACL) parts.push(`ACL: ${rule?.configured_rule_json.USEACL}`)
    else if (rule?.configured_rule_json.ACL) parts.push(`ACL inline (${rule?.configured_rule_json.ACL.ACCESS})`)
    if (rule?.configured_rule_json.USEFORMULA) parts.push(`FORMULA: ${rule?.configured_rule_json.USEFORMULA}`)
    else if (rule?.configured_rule_json.FORMULA) parts.push('FORMULA inline')
    if (rule?.configured_rule_json.USEOBJECTS) parts.push(`OBJ: ${rule?.configured_rule_json.USEOBJECTS.join(', ')}`)
    else if (rule?.configured_rule_json.OBJECTS) parts.push(`OBJ: ${rule?.configured_rule_json.OBJECTS.length} route(s)`)
    return parts.join('\n') || '—'
  })

</script>

<template>
  <v-list-item
    v-if="loading"
    class="mt-2 mx-2 pa-0"
    color="primarySurface"
    :style="{
      'border': '1px solid',
      'border-color': isDark ? '#686868 !important' : '#ABABAB !important',
    }"
  >
    <v-skeleton-loader type="list-item-three-line" />

  </v-list-item>

  <v-list-item
    v-else-if="rule"
    :active="isSelected"
    base-color="listItem"
    :border="isSelected ? 'primary' : 'listItem thin'"
    class="mt-2 mx-2"
    color="primarySurface"
    :style="{
      'border': '1px solid',
      'border-color': isSelected
        ? primaryColor + ' !important'
        : isDark ? '#686868 !important' : '#ABABAB !important',
    }"
    variant="tonal"
    @click="onSelectRule(rule.rule_index)"
  >
    <v-list-item-title class="d-flex flex-wrap justify-end ga-2 align-center pb-2">
      <div class="d-flex align-center">
        <v-chip class="mr-1 text-listItemText" density="compact" label size="small">
          # {{ rule.rule_index }}
        </v-chip>

        <span class="text-primary">{{ rule.rights?.join(', ') }}</span>
      </div>

      <v-spacer />

      <v-chip
        :color="accessBadge.color"
        label
        size="small"
        variant="flat"
      >
        <v-icon :icon="accessBadge.icon" size="16" start />
        {{ rule.access }}
      </v-chip>

    </v-list-item-title>

    <v-list-item-subtitle class="text-listItemText rule-summary pb-2">
      {{ ruleSummary }}
    </v-list-item-subtitle>

    <v-list-item-subtitle class="text-listItemText">
      {{ rule.matched_rule_id }}
    </v-list-item-subtitle>

    <div class="d-flex justify-end">
      <RuleComplexityBadge :rule="rule" />
    </div>
  </v-list-item>

</template>

<style scoped>
.rule-summary {
  white-space: pre-line;
  line-clamp:unset;
  -webkit-line-clamp: unset;
  overflow: visible;
}
</style>
