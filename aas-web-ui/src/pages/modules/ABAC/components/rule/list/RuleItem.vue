<template>
  <SelectableListItem
    :active="isSelected"
    :loading="loading"
    skeleton-type="list-item-three-line"
    @click="onSelectRule(rule!.rule_index)"
  >
    <v-list-item-title class="d-flex flex-wrap justify-end ga-2 align-center pb-2">
      <div class="d-flex align-center">
        <v-chip class="mr-1 text-listItemText" density="compact" label size="small">
          <v-icon class="me-1" :icon="ICONS.HASH" size="x-small" />
          <span>{{ rule!.rule_index }}</span>
        </v-chip>

        <span class="text-primary">{{ rule!.rights?.join(', ') }}</span>
      </div>

      <v-spacer />

      <v-chip :color="accessBadge.color" label size="small">
        <v-icon :icon="accessBadge.icon" size="16" start />
        {{ rule!.access }}
      </v-chip>

    </v-list-item-title>

    <v-list-item-subtitle class="text-listItemText rule-summary pb-2">
      {{ ruleSummary }}
    </v-list-item-subtitle>

    <div class="d-flex justify-end">
      <RuleComplexityBadge :rule="rule!" />
    </div>

    <template #action>
      <RuleOptions v-if="staged && rule" :rule="rule!" />
    </template>
  </SelectableListItem>
</template>

<script setup lang="ts">
  import type { Rule } from '../../../types/rules'
  import { useAbacNavigation } from '../../../hooks/useAbacNavigation'
  import SelectableListItem from '../../shared/SelectableListItem.vue'
  import RuleComplexityBadge from '../RuleComplexityBadge.vue'
  import RuleOptions from './RuleOptions.vue'

  const ICONS = {
    HASH: 'mdi-pound',
    ALLOW: 'mdi-check-circle',
    DISABLED: 'mdi-close-circle',
  } as const

  const { rule, loading, staged } = defineProps<{ rule?: Rule, loading?: boolean, staged?: boolean }>()

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

<style scoped>
.rule-summary {
  white-space: pre-line;
  line-clamp:unset;
  -webkit-line-clamp: unset;
  overflow: visible;
}
</style>
