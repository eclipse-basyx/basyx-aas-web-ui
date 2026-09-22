import { useGetRule } from '@/pages/modules/ABAC/api/rule/useGetRule'
import { useGetRules } from '@/pages/modules/ABAC/api/rule/useGetRules'
import { useAbacNavigation } from '@/pages/modules/ABAC/hooks/useAbacNavigation'

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
