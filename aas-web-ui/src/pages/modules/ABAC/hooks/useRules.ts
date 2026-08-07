import { useGetRule } from '@/composables/Client/ABAC/queries/rule/useGetRule'
import { useGetRules } from '@/composables/Client/ABAC/queries/rule/useGetRules'
import { useAbacNavigation } from './useAbacNavigation'

export function useRules () {
  const { selectedPolicyVersion, selectedRuleIndex } = useAbacNavigation()

  const queryValues = useGetRules(selectedPolicyVersion)

  const rulesCount = ref<number>(0)

  watch(queryValues.data, rules => {
    rulesCount.value = rules?.length ?? 0
  })

  const { data: selectedRule, isLoading: isSelectedRuleLoading }
    = useGetRule(selectedPolicyVersion, selectedRuleIndex)

  return {
    selectedRuleIndex,
    rules: queryValues.data,
    rulesCount,
    ...queryValues,
    selectedRule,
    isSelectedRuleLoading,
  }
}
