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
  import { isObject } from '../../../utils/object'
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
    const ruleJson = rule?.configured_rule_json
    if (!ruleJson) return ''

    const parts: string[] = []
    if (typeof ruleJson.USEACL === 'string' && ruleJson.USEACL) parts.push(`ACL: ${ruleJson.USEACL}`)
    else if (isObject(ruleJson.ACL)) parts.push(`ACL inline (${typeof ruleJson.ACL.ACCESS === 'string' ? ruleJson.ACL.ACCESS : '?'})`)
    if (typeof ruleJson.USEFORMULA === 'string' && ruleJson.USEFORMULA) parts.push(`FORMULA: ${ruleJson.USEFORMULA}`)
    else if (isObject(ruleJson.FORMULA)) parts.push('FORMULA inline')
    if (Array.isArray(ruleJson.USEOBJECTS)) parts.push(`OBJ: ${ruleJson.USEOBJECTS.filter(value => typeof value === 'string').join(', ')}`)
    else if (Array.isArray(ruleJson.OBJECTS)) parts.push(`OBJ: ${ruleJson.OBJECTS.length} route(s)`)
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
