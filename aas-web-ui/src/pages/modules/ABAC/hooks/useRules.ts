import { useGetRule } from '@/pages/modules/ABAC/api/queries/rule/useGetRule'
import { useGetRules } from '@/pages/modules/ABAC/api/queries/rule/useGetRules'
import { useAbacNavigation } from './useAbacNavigation'

export function useRules () {
  const { selectedPolicyVersion, selectedRuleIndex } = useAbacNavigation()

  const { data: rules, ...rest } = useGetRules(selectedPolicyVersion)

  const rulesCount = computed(() => rules.value?.length ?? 0)

  const { data: selectedRule, isLoading: isSelectedRuleLoading }
    = useGetRule(selectedPolicyVersion, selectedRuleIndex)

  return {
    selectedRuleIndex,
    rules,
    rulesCount,
    ...rest,
    selectedRule,
    isSelectedRuleLoading,
  }
}
